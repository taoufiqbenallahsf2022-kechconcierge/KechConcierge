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
  type?: "UPDATE_RECORD" | "UPDATE_RELATED" | "DELETE_RECORD" | "DELETE_RELATED";
  targetEntity?: string;
  matchField?: string;
  sourceField?: string;
  relationshipId?: string;
  field?: string;
  value?: unknown;
  conditions?: ConditionGroup;
};

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

function resolveValue(value: unknown, record: Record<string, unknown>) {
  if (typeof value !== "string") return value;
  const match = value.match(/^\{\{record\.([a-zA-Z0-9_]+)\}\}$/);
  return match ? record[match[1]!] : value;
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

function databaseConditions(group?: ConditionGroup) {
  const items = group?.items?.filter(condition => condition.field) ?? [];
  if (!items.length) return {};
  return { [group?.logic === "OR" ? "OR" : "AND"]: items.map(databaseCondition) };
}

async function executeAction(
  sourceEntity: string,
  record: Record<string, unknown>,
  action: FlowAction,
) {
  if (action.type === "DELETE_RECORD") {
    if (!ALLOWED_ENTITIES.has(sourceEntity) || typeof record.id !== "string")
      throw new Error("Flow source entity cannot be deleted");
    await (prisma as any)[sourceEntity].deleteMany({ where: { id: record.id } });
    return;
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
    await (prisma as any)[relationship.targetEntity].deleteMany({
      where: {
        AND: [
          { [relationship.targetField]: matchValue },
          databaseConditions(action.conditions),
        ],
      },
    });
    return;
  }

  if (!action.field || BLOCKED_FIELDS.has(action.field))
    throw new Error("Flow action uses a protected or missing field");

  const value = resolveValue(action.value, record);
  if (action.type === "UPDATE_RECORD") {
    if (!ALLOWED_ENTITIES.has(sourceEntity) || typeof record.id !== "string")
      throw new Error("Flow source entity cannot be updated");
    await (prisma as any)[sourceEntity].update({
      where: { id: record.id },
      data: { [action.field]: value },
    });
    return;
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
    await (prisma as any)[relationship.targetEntity].updateMany({
      where: {
        AND: [
          { [relationship.targetField]: matchValue },
          databaseConditions(action.conditions),
        ],
      },
      data: { [action.field]: value },
    });
    return;
  }

  throw new Error("Unsupported flow action type");
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
    try {
      const actions = Array.isArray(flow.actions)
        ? (flow.actions as FlowAction[])
        : [];
      if (!actions.length) throw new Error("Flow has no actions");
      for (const action of actions)
        await executeAction(sourceEntity, record, action);
      await prisma.recordFlow.update({
        where: { id: flow.id },
        data: { lastRunDate: new Date(), lastError: null },
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown flow error";
      await prisma.recordFlow.update({
        where: { id: flow.id },
        data: { lastRunDate: new Date(), lastError: message.slice(0, 1000) },
      });
      console.error(`Record flow "${flow.name}" failed:`, error);
    }
  }
}
