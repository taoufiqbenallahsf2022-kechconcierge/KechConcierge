import { prisma } from "../lib/prisma.js";
import { loadObjectRelationships } from "./relationshipMetadata.js";

type Trigger = "CREATED" | "UPDATED" | "DELETED";
type Condition = {
  field?: string;
  operator?: string;
  value?: unknown;
  valueTo?: unknown;
};
type ConditionGroup = { logic?: "AND" | "OR"; items?: Condition[] };
type FlowAction = {
  id?: string;
  type?:
    | "UPDATE_RECORD"
    | "UPDATE_RELATED"
    | "DELETE_RECORD"
    | "DELETE_RELATED"
    | "GET_RECORD"
    | "GET_RECORDS"
    | "LOOP"
    | "DECISION"
    | "CREATE_MATCHING"
    | "UPDATE_ONE"
    | "UPDATE_MATCHING"
    | "DELETE_MATCHING";
  targetEntity?: string;
  matchField?: string;
  sourceField?: string;
  relationshipId?: string;
  field?: string;
  value?: unknown;
  conditions?: ConditionGroup;
  outputKey?: string;
  sourceRef?: string;
  outcomes?: Array<{
    id?: string;
    name?: string;
    isDefault?: boolean;
    conditions?: ConditionGroup;
    actions?: FlowAction[];
  }>;
  falseBehavior?: "STOP" | "CONTINUE";
  bodyActions?: FlowAction[];
  assignments?: Array<{ field?: string; value?: unknown }>;
  continueOnError?: boolean;
};
type RuntimeContext = {
  trigger: Record<string, unknown>;
  values: Record<string, unknown>;
  runId: string;
  hadErrors: boolean;
};
type SequenceResult = "DONE" | "STOP";
type ActivityResult = {
  inputCount?: number;
  outputCount?: number;
  affectedCount?: number;
  objectName?: string;
  affectedId?: string;
  filterSummary?: string;
  summary: string;
};
class StopFlowExecution extends Error {
  constructor(public cause: unknown) {
    super(cause instanceof Error ? cause.message : String(cause));
  }
}

const ALLOWED_ENTITIES = new Set([
  "individual",
  "lead",
  "prospect",
  "account",
  "consent",
  "product",
  "chat",
  "contactRequest",
  "pageVisit",
  "whatsAppConversation",
]);
const BLOCKED_FIELDS = new Set([
  "id",
  "passwordHash",
  "emailVerificationToken",
  "passwordResetToken",
  "createdDate",
  "createdAt",
  "updatedDate",
  "updatedAt",
]);

function comparable(value: unknown) {
  if (value instanceof Date) return value.getTime();
  if (typeof value === "number") return value;
  const date = typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value) ? Date.parse(value) : NaN;
  return Number.isNaN(date) ? String(value ?? "").toLowerCase() : date;
}

function matchOne(record: Record<string, unknown>, candidate: Condition) {
  if (!candidate.field) return true;
  const current = record[candidate.field];
  const value = candidate.value;
  const left = comparable(current), right = comparable(value);
  const values = Array.isArray(value) ? value : String(value ?? "").split(",").map((item) => item.trim());
  switch (candidate.operator) {
    case "NOT_EQUALS": return left !== right;
    case "CONTAINS": return String(left).includes(String(right));
    case "STARTS_WITH": return String(left).startsWith(String(right));
    case "ENDS_WITH": return String(left).endsWith(String(right));
    case "IN": return values.map(comparable).includes(left);
    case "NOT_IN": return !values.map(comparable).includes(left);
    case "GT": case "AFTER": return left > right;
    case "GTE": return left >= right;
    case "LT": case "BEFORE": return left < right;
    case "LTE": return left <= right;
    case "BETWEEN": return left >= right && left <= comparable(candidate.valueTo);
    case "IS_NULL": return current == null;
    case "IS_NOT_NULL": return current != null;
    case "TRUTHY": return current === true;
    case "FALSY": return current === false;
    case "EQUALS": default: return left === right;
  }
}

function matches(record: Record<string, unknown>, condition: unknown) {
  if (!condition || typeof condition !== "object") return true;
  const group = condition as ConditionGroup;
  const items = Array.isArray(group.items) ? group.items : [condition as Condition];
  return group.logic === "OR" ? items.some((item) => matchOne(record, item)) : items.every((item) => matchOne(record, item));
}

function resolveValue(value: unknown, context: RuntimeContext) {
  if (typeof value !== "string") return value;
  const match = value.match(
    /^\{\{([a-zA-Z0-9_-]+)\.([a-zA-Z0-9_]+)\}\}$/,
  );
  if (!match) return value;
  const record =
    match[1] === "trigger"
      ? context.trigger
      : context.values[match[1]!] as Record<string, unknown> | undefined;
  return record?.[match[2]!];
}

function resolvedCondition(candidate: Condition, context: RuntimeContext) {
  return {
    ...candidate,
    value: resolveValue(candidate.value, context),
    valueTo: resolveValue(candidate.valueTo, context),
  };
}

function databaseCondition(candidate: Condition) {
  if (!candidate.field) return {};
  const values = Array.isArray(candidate.value)
    ? candidate.value
    : String(candidate.value ?? "").split(",").map(value => value.trim()).filter(Boolean);
  switch (candidate.operator) {
    case "NOT_EQUALS": return { [candidate.field]: { not: candidate.value } };
    case "CONTAINS": return { [candidate.field]: { contains: candidate.value, mode: "insensitive" } };
    case "STARTS_WITH": return { [candidate.field]: { startsWith: candidate.value, mode: "insensitive" } };
    case "ENDS_WITH": return { [candidate.field]: { endsWith: candidate.value, mode: "insensitive" } };
    case "IN": return { [candidate.field]: { in: values } };
    case "NOT_IN": return { [candidate.field]: { notIn: values } };
    case "GT": case "AFTER": return { [candidate.field]: { gt: candidate.value } };
    case "GTE": return { [candidate.field]: { gte: candidate.value } };
    case "LT": case "BEFORE": return { [candidate.field]: { lt: candidate.value } };
    case "LTE": return { [candidate.field]: { lte: candidate.value } };
    case "BETWEEN": return { [candidate.field]: { gte: candidate.value, lte: candidate.valueTo } };
    case "IS_NULL": return { [candidate.field]: null };
    case "IS_NOT_NULL": return { [candidate.field]: { not: null } };
    case "TRUTHY": return { [candidate.field]: true };
    case "FALSY": return { [candidate.field]: false };
    case "EQUALS": default: return { [candidate.field]: candidate.value };
  }
}

function databaseConditions(group: ConditionGroup | undefined, context: RuntimeContext) {
  const items = group?.items?.filter(condition => condition.field) ?? [];
  if (!items.length) return {};
  return {
    [group?.logic === "OR" ? "OR" : "AND"]: items.map((condition) =>
      databaseCondition(resolvedCondition(condition, context)),
    ),
  };
}

function appliedFilters(
  group: ConditionGroup | undefined,
  context: RuntimeContext,
) {
  const items = group?.items?.filter((condition) => condition.field) ?? [];
  if (!items.length) return "No filters";
  return items
    .map((condition) => {
      const resolved = resolvedCondition(condition, context);
      const value =
        resolved.operator === "IS_NULL" || resolved.operator === "IS_NOT_NULL"
          ? ""
          : ` ${JSON.stringify(resolved.value)}`;
      const second =
        resolved.operator === "BETWEEN"
          ? ` and ${JSON.stringify(resolved.valueTo)}`
          : "";
      return `${resolved.field} ${resolved.operator || "EQUALS"}${value}${second}`;
    })
    .join(group?.logic === "OR" ? " OR " : " AND ");
}

async function executeAction(
  sourceEntity: string,
  record: Record<string, unknown>,
  action: FlowAction,
  context: RuntimeContext,
) {
  if (action.type === "DELETE_RECORD") {
    if (!ALLOWED_ENTITIES.has(sourceEntity) || typeof record.id !== "string")
      throw new Error("Flow source entity cannot be deleted");
    const result = await (prisma as any)[sourceEntity].deleteMany({ where: { id: record.id } });
    return {
      inputCount: 1,
      affectedCount: result.count,
      objectName: sourceEntity,
      affectedId: String(record.id),
      summary: "Deleted",
    };
  }

  if (action.type === "DELETE_RELATED") {
    const relationships = await loadObjectRelationships();
    const relationship = relationships.find(item =>
      item.id === action.relationshipId &&
      item.sourceEntity === sourceEntity &&
      item.targetEntity === action.targetEntity
    );
    if (!relationship || !ALLOWED_ENTITIES.has(relationship.targetEntity))
      throw new Error("Flow related-record configuration is invalid");
    const matchValue = record[relationship.sourceField];
    if (matchValue === undefined || matchValue === null)
      throw new Error(`Flow source field "${relationship.sourceField}" has no value`);
    const result = await (prisma as any)[relationship.targetEntity].deleteMany({
      where: {
        AND: [
          { [relationship.targetField]: matchValue },
          databaseConditions(action.conditions, context),
        ],
      },
    });
    return {
      inputCount: 1,
      affectedCount: result.count,
      objectName: relationship.targetEntity,
      affectedId: String(result.count),
      filterSummary: `${relationship.targetField} EQUALS ${JSON.stringify(matchValue)} AND ${appliedFilters(action.conditions, context)}`,
      summary: "Deleted records",
    };
  }

  const assignments =
    action.assignments?.length
      ? action.assignments
      : [{ field: action.field, value: action.value }];
  if (
    assignments.some(
      (assignment) =>
        !assignment.field || BLOCKED_FIELDS.has(assignment.field),
    )
  )
    throw new Error("Flow action uses a protected or missing field");
  const fields = assignments.map((assignment) => assignment.field);
  if (new Set(fields).size !== fields.length)
    throw new Error("Flow action assigns the same field more than once");
  const data = Object.fromEntries(
    assignments.map((assignment) => [
      assignment.field!,
      resolveValue(assignment.value, context),
    ]),
  );
  if (action.type === "UPDATE_RECORD") {
    if (!ALLOWED_ENTITIES.has(sourceEntity) || typeof record.id !== "string")
      throw new Error("Flow source entity cannot be updated");
    await (prisma as any)[sourceEntity].update({
      where: { id: record.id },
      data,
    });
    return {
      inputCount: 1,
      affectedCount: 1,
      objectName: sourceEntity,
      affectedId: String(record.id),
      summary: "Updated",
    };
  }

  if (action.type === "UPDATE_RELATED") {
    const relationships = await loadObjectRelationships();
    const relationship = relationships.find(item =>
      item.id === action.relationshipId &&
      item.sourceEntity === sourceEntity &&
      item.targetEntity === action.targetEntity
    );
    if (!relationship || !ALLOWED_ENTITIES.has(relationship.targetEntity)) {
      throw new Error("Flow related-record configuration is invalid");
    }
    const matchValue = record[relationship.sourceField];
    if (matchValue === undefined || matchValue === null)
      throw new Error(`Flow source field "${relationship.sourceField}" has no value`);
    const result = await (prisma as any)[relationship.targetEntity].updateMany({
      where: {
        AND: [
          { [relationship.targetField]: matchValue },
          databaseConditions(action.conditions, context),
        ],
      },
      data,
    });
    return {
      inputCount: 1,
      affectedCount: result.count,
      objectName: relationship.targetEntity,
      affectedId: String(result.count),
      filterSummary: `${relationship.targetField} EQUALS ${JSON.stringify(matchValue)} AND ${appliedFilters(action.conditions, context)}`,
      summary: "Updated records",
    };
  }

  throw new Error("Unsupported flow action type");
}

function actionEntity(action: FlowAction) {
  if (!action.targetEntity || !ALLOWED_ENTITIES.has(action.targetEntity))
    throw new Error("Flow activity uses an invalid object");
  return action.targetEntity;
}

function selectedRecord(context: RuntimeContext, reference?: string) {
  if (!reference || reference === "trigger") return context.trigger;
  return context.values[reference];
}

async function recordActivity(
  context: RuntimeContext,
  action: FlowAction,
  startedDate: Date,
  result?: ActivityResult,
  error?: unknown,
) {
  const message = error instanceof Error ? error.message : error ? String(error) : null;
  await prisma.recordFlowActivityRun.create({
    data: {
      runId: context.runId,
      activityId: action.id || "unknown",
      activityType: action.type || "UNKNOWN",
      status: error ? "FAILED" : "COMPLETED",
      inputCount: result?.inputCount ?? 0,
      outputCount: result?.outputCount ?? 0,
      affectedCount: result?.affectedCount ?? 0,
      objectName: result?.objectName,
      affectedId: result?.affectedId,
      filterSummary: result?.filterSummary,
      summary: result?.summary ?? (error ? "Activity failed." : "Activity completed."),
      error: message?.slice(0, 4000),
      startedDate,
      completedDate: new Date(),
    },
  });
}

async function executeStep(
  sourceEntity: string,
  record: Record<string, unknown>,
  action: FlowAction,
  context: RuntimeContext,
  index: number,
): Promise<{ sequence?: SequenceResult; result: ActivityResult }> {
  if (action.type === "GET_RECORD" || action.type === "GET_RECORDS") {
      const entity = actionEntity(action);
      const where = databaseConditions(action.conditions, context);
      const result =
        action.type === "GET_RECORD"
          ? await (prisma as any)[entity].findFirst({ where })
          : await (prisma as any)[entity].findMany({ where, take: 200 });
      context.values[action.outputKey || action.id || `step_${index}`] = result;
      const count = Array.isArray(result) ? result.length : result ? 1 : 0;
      return {
        result: {
          inputCount: 1,
          outputCount: count,
          objectName: entity,
          affectedId:
            action.type === "GET_RECORD"
              ? result && typeof result.id === "string"
                ? result.id
                : undefined
              : String(count),
          filterSummary: appliedFilters(action.conditions, context),
          summary:
            action.type === "GET_RECORD" ? "Retrieved" : "Retrieved records",
        },
      };
  }

  if (action.type === "DECISION") {
      const candidate = selectedRecord(context, action.sourceRef);
      if (!candidate || Array.isArray(candidate))
        throw new Error("Decision Split requires a single record");
      const outcomes = action.outcomes ?? [];
      if (!outcomes.length) {
        const passed = matches(candidate as Record<string, unknown>, {
          logic: action.conditions?.logic,
          items: action.conditions?.items?.map((condition) =>
            resolvedCondition(condition, context),
          ),
        });
        if (!passed && action.falseBehavior !== "CONTINUE")
          return { sequence: "STOP", result: { inputCount: 1, outputCount: 0, summary: "No decision condition matched; path stopped." } };
        return { result: { inputCount: 1, outputCount: passed ? 1 : 0, summary: passed ? "Decision condition matched." : "Decision did not match; path continued." } };
      }
      const matched =
        outcomes.find(
          (outcome) =>
            !outcome.isDefault &&
            matches(candidate as Record<string, unknown>, {
              logic: outcome.conditions?.logic,
              items: outcome.conditions?.items?.map((condition) =>
                resolvedCondition(condition, context),
              ),
            }),
        ) ?? outcomes.find((outcome) => outcome.isDefault);
      if (matched)
        await executeSequence(
          sourceEntity,
          record,
          matched.actions ?? [],
          context,
        );
      return { result: { inputCount: 1, outputCount: matched ? 1 : 0, summary: matched ? `Routed to “${matched.name || "Unnamed outcome"}”.` : "No decision outcome matched." } };
  }

  if (action.type === "LOOP") {
      const collection = selectedRecord(context, action.sourceRef);
      if (!Array.isArray(collection))
        throw new Error("Loop activity requires a Get Records collection");
      if (collection.length > 200)
        throw new Error("Loop collection exceeds the 200-record safety limit");
      const body = action.bodyActions ?? [];
      for (const item of collection) {
        context.values[action.outputKey || action.id || "currentItem"] = item;
        await executeSequence(sourceEntity, record, body, context);
      }
      return { sequence: !action.bodyActions ? "DONE" : undefined, result: { inputCount: collection.length, outputCount: collection.length, summary: `Completed ${collection.length} loop iteration(s).` } };
  }

  if (
      action.type === "CREATE_MATCHING" ||
      action.type === "UPDATE_ONE" ||
      action.type === "UPDATE_MATCHING" ||
      action.type === "DELETE_MATCHING"
    ) {
      const entity = actionEntity(action);
      const where = databaseConditions(action.conditions, context);
      if (action.type === "DELETE_MATCHING") {
        if (!action.conditions?.items?.some((condition) => condition.field))
          throw new Error("Delete Records requires at least one condition");
        const deleted = await (prisma as any)[entity].deleteMany({ where });
        return {
          result: {
            inputCount: 1,
            affectedCount: deleted.count,
            objectName: entity,
            affectedId: String(deleted.count),
            filterSummary: appliedFilters(action.conditions, context),
            summary: "Deleted records",
          },
        };
      }
      const assignments =
        action.assignments?.length
          ? action.assignments
          : [{ field: action.field, value: action.value }];
      if (
        assignments.some(
          (assignment) =>
            !assignment.field || BLOCKED_FIELDS.has(assignment.field),
        )
      )
        throw new Error("Flow activity uses a protected or missing field");
      const fields = assignments.map((assignment) => assignment.field);
      if (new Set(fields).size !== fields.length)
        throw new Error("Flow activity assigns the same field more than once");
      const data = Object.fromEntries(
        assignments.map((assignment) => [
          assignment.field!,
          resolveValue(assignment.value, context),
        ]),
      );
      if (action.type === "CREATE_MATCHING") {
        const created = await (prisma as any)[entity].create({ data });
        return {
          result: {
            inputCount: 1,
            outputCount: 1,
            affectedCount: 1,
            objectName: entity,
            affectedId: typeof created.id === "string" ? created.id : undefined,
            summary: "Created",
          },
        };
      } else if (action.type === "UPDATE_ONE") {
        if (!action.conditions?.items?.some((condition) => condition.field))
          throw new Error("Update One Record requires at least one condition");
        const selected = await (prisma as any)[entity].findFirst({
          where,
          select: { id: true },
        });
        if (!selected)
          throw new Error(`Update One Record found no ${entity} record`);
        await (prisma as any)[entity].update({
          where: { id: selected.id },
          data,
        });
        return {
          result: {
            inputCount: 1,
            affectedCount: 1,
            objectName: entity,
            affectedId: String(selected.id),
            filterSummary: appliedFilters(action.conditions, context),
            summary: "Updated",
          },
        };
      }
      else {
        if (!action.conditions?.items?.some((condition) => condition.field))
          throw new Error("Update Records requires at least one condition");
        const updated = await (prisma as any)[entity].updateMany({ where, data });
        return {
          result: {
            inputCount: 1,
            affectedCount: updated.count,
            objectName: entity,
            affectedId: String(updated.count),
            filterSummary: appliedFilters(action.conditions, context),
            summary: "Updated records",
          },
        };
      }
  }

  const result = await executeAction(sourceEntity, record, action, context);
  return { result: result as ActivityResult };
}

async function executeSequence(
  sourceEntity: string,
  record: Record<string, unknown>,
  actions: FlowAction[],
  context: RuntimeContext,
): Promise<SequenceResult> {
  for (let index = 0; index < actions.length; index += 1) {
    const action = actions[index]!;
    const startedDate = new Date();
    try {
      const outcome = await executeStep(sourceEntity, record, action, context, index);
      await recordActivity(context, action, startedDate, outcome.result);
      if (outcome.sequence) return outcome.sequence;
    } catch (error) {
      if (error instanceof StopFlowExecution) throw error;
      context.hadErrors = true;
      await recordActivity(context, action, startedDate, undefined, error);
      if (action.continueOnError === false) throw new StopFlowExecution(error);
    }
  }
  return "DONE";
}

export async function runRecordFlows(
  sourceEntity: string,
  trigger: Trigger,
  record: Record<string, unknown>,
) {
  const flows = await prisma.recordFlow.findMany({
    where: { sourceEntity, trigger, isActive: true },
  });

  for (const flow of flows) {
    if (!matches(record, flow.condition)) continue;
    const version = await prisma.recordFlowVersion.findUnique({
      where: {
        flowId_version: { flowId: flow.id, version: flow.currentVersion },
      },
      select: { id: true },
    });
    const run = await prisma.recordFlowRun.create({
      data: {
        flowId: flow.id,
        flowVersionId: version?.id,
        triggerRecordId: typeof record.id === "string" ? record.id : null,
      },
    });
    const context: RuntimeContext = {
      trigger: record,
      values: {},
      runId: run.id,
      hadErrors: false,
    };
    try {
      const actions = Array.isArray(flow.actions)
        ? (flow.actions as FlowAction[])
        : [];
      if (!actions.length) throw new Error("Flow has no actions");
      await executeSequence(sourceEntity, record, actions, context);
      await prisma.recordFlowRun.update({
        where: { id: run.id },
        data: {
          status: context.hadErrors ? "COMPLETED_WITH_ERRORS" : "COMPLETED",
          completedDate: new Date(),
        },
      });
      await prisma.recordFlow.update({
        where: { id: flow.id },
        data: { lastRunDate: new Date(), lastError: null },
      });
    } catch (error) {
      const rootError = error instanceof StopFlowExecution ? error.cause : error;
      const message =
        rootError instanceof Error ? rootError.message : "Unknown flow error";
      await prisma.recordFlowRun.update({
        where: { id: run.id },
        data: {
          status: "FAILED",
          error: message.slice(0, 4000),
          completedDate: new Date(),
        },
      });
      await prisma.recordFlow.update({
        where: { id: flow.id },
        data: { lastRunDate: new Date(), lastError: message.slice(0, 1000) },
      });
      console.error(`Record flow "${flow.name}" failed:`, error);
    }
  }
}
