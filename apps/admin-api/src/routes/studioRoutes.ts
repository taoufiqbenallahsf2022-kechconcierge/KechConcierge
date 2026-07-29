import { Router } from "express";
import { Prisma } from "../../../../packages/database/generated/prisma/client.js";
import { prisma } from "../lib/prisma.js";
import { audience, executeAutomation, safeSelect } from "../automation/automationEngine.js";
import { nextRunAt, scheduleData } from "../automation/schedule.js";
import { loadObjectRelationships } from "../automation/relationshipMetadata.js";

export const router = Router();

const MAX_PREVIEW_ROWS = 100;

function required(value: unknown, label: string) {
  if (typeof value !== "string" || !value.trim())
    throw Object.assign(new Error(`${label} is required`), { status: 400 });
  return value.trim();
}

function optional(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function boolean(value: unknown, fallback = true) {
  return typeof value === "boolean" ? value : fallback;
}

function jsonObject(value: unknown, fallback: unknown) {
  if (value === undefined) return fallback;
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      throw Object.assign(new Error("Invalid JSON configuration"), {
        status: 400,
      });
    }
  }
  return value;
}

function senderData(body: any) {
  const email = required(body.email, "Sender email").toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    throw Object.assign(new Error("Sender email is invalid"), { status: 400 });
  return {
    name: required(body.name, "Sender name"),
    email,
    replyTo: optional(body.replyTo),
    isActive: boolean(body.isActive),
  };
}

function templateData(body: any) {
  const blocks = jsonObject(body.languageBlocks, {});
  if (!blocks || typeof blocks !== "object" || Array.isArray(blocks))
    throw Object.assign(new Error("Language blocks must be a JSON object"), {
      status: 400,
    });
  return {
    name: required(body.name, "Template name"),
    description: optional(body.description),
    defaultSubject: required(body.defaultSubject, "Default subject"),
    defaultHtml: required(body.defaultHtml, "Default HTML"),
    languageBlocks: blocks as Prisma.InputJsonValue,
    isActive: boolean(body.isActive),
  };
}

function automationData(body: any) {
  const schedule = scheduleData(body);
  const isActive = boolean(body.isActive, false);
  return {
    name: required(body.name, "Automation name"),
    description: optional(body.description),
    sqlQuery: safeSelect(body.sqlQuery),
    subscriberKeyField: required(
      body.subscriberKeyField,
      "Subscriber key field",
    ),
    emailField: required(body.emailField, "Email field"),
    languageField: optional(body.languageField),
    senderEmailId: required(body.senderEmailId, "Sender email"),
    emailTemplateId: required(body.emailTemplateId, "Email template"),
    isActive,
    ...schedule,
    nextRunAt: isActive ? nextRunAt(schedule) : null,
  };
}

function flowData(body: any) {
  const sourceEntity = required(body.sourceEntity, "Source object");
  const trigger = required(body.trigger, "Trigger");
  if (!["CREATED", "UPDATED", "DELETED"].includes(trigger))
    throw Object.assign(new Error("Trigger must be CREATED, UPDATED or DELETED"), {
      status: 400,
    });
  const actions = jsonObject(body.actions, []);
  if (!Array.isArray(actions) || !actions.length)
    throw Object.assign(new Error("At least one flow action is required"), {
      status: 400,
    });
  return {
    name: required(body.name, "Flow name"),
    description: optional(body.description),
    sourceEntity,
    trigger: trigger as "CREATED" | "UPDATED" | "DELETED",
    condition: (jsonObject(body.condition, null) ??
      Prisma.JsonNull) as Prisma.InputJsonValue,
    actions: actions as Prisma.InputJsonValue,
    isActive: boolean(body.isActive, false),
  };
}

function crud(
  path: string,
  delegate: any,
  data: (body: any) => Record<string, unknown>,
  include?: Record<string, unknown>,
) {
  router.get(path, async (_req, res, next) => {
    try {
      res.json({
        items: await delegate.findMany({
          orderBy: { updatedDate: "desc" },
          ...(include ? { include } : {}),
        }),
      });
    } catch (error) {
      next(error);
    }
  });
  router.post(path, async (req, res, next) => {
    try {
      res.status(201).json(await delegate.create({ data: data(req.body) }));
    } catch (error) {
      next(error);
    }
  });
  router.patch(`${path}/:id`, async (req, res, next) => {
    try {
      res.json(
        await delegate.update({
          where: { id: req.params.id },
          data: data(req.body),
        }),
      );
    } catch (error) {
      next(error);
    }
  });
  router.delete(`${path}/:id`, async (req, res, next) => {
    try {
      if (path === "/automations") {
        await prisma.$transaction([
          prisma.audienceAutomation.update({
            where: { id: req.params.id },
            data: { isActive: false, nextRunAt: null },
          }),
          prisma.audienceAutomation.delete({ where: { id: req.params.id } }),
        ]);
      } else {
        await delegate.delete({ where: { id: req.params.id } });
      }
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  });
}

crud("/sender-emails", prisma.senderEmail, senderData);
crud("/email-templates", prisma.emailTemplate, templateData);
crud(
  "/automations",
  prisma.audienceAutomation,
  automationData,
  {
    senderEmail: true,
    emailTemplate: true,
    runs: { take: 5, orderBy: { startedDate: "desc" } },
  },
);
const flowInclude = {
  _count: { select: { versions: true, runs: true } },
  versions: {
    select: { id: true, version: true, status: true, createdDate: true, updatedDate: true },
    orderBy: { version: "desc" as const },
  },
  runs: {
    take: 50,
    orderBy: { startedDate: "desc" as const },
    include: { activities: { orderBy: { startedDate: "asc" as const } } },
  },
};

router.get("/flows", async (_req, res, next) => {
  try {
    res.json({
      items: await prisma.recordFlow.findMany({
        orderBy: { updatedDate: "desc" },
        include: flowInclude,
      }),
    });
  } catch (error) {
    next(error);
  }
});

router.post("/flows", async (req, res, next) => {
  try {
    const data = { ...flowData(req.body), isActive: false };
    const result = await prisma.$transaction(async (transaction) => {
      const flow = await transaction.recordFlow.create({ data });
      const version = await transaction.recordFlowVersion.create({
        data: {
          flowId: flow.id,
          version: 1,
          name: flow.name,
          description: flow.description,
          sourceEntity: flow.sourceEntity,
          trigger: flow.trigger,
          condition: flow.condition ?? Prisma.JsonNull,
          actions: flow.actions as Prisma.InputJsonValue,
          status: "DRAFT",
        },
      });
      return { ...flow, draftVersionId: version.id };
    });
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

router.patch("/flows/:id", async (req, res, next) => {
  try {
    res.json(await prisma.recordFlow.update({
      where: { id: req.params.id },
      data: { isActive: boolean(req.body.isActive, false) },
    }));
  } catch (error) {
    next(error);
  }
});

router.post("/flows/:id/versions", async (req, res, next) => {
  try {
    const version = await prisma.$transaction(async (transaction) => {
      const existingDraft = await transaction.recordFlowVersion.findFirst({
        where: { flowId: req.params.id, status: "DRAFT" },
        orderBy: { version: "desc" },
      });
      if (existingDraft) return existingDraft;
      const base = await transaction.recordFlowVersion.findFirst({
        where: { flowId: req.params.id },
        orderBy: { version: "desc" },
      });
      if (!base)
        throw Object.assign(new Error("Flow has no base version"), { status: 409 });
      return transaction.recordFlowVersion.create({
        data: {
          flowId: base.flowId,
          version: base.version + 1,
          name: base.name,
          description: base.description,
          sourceEntity: base.sourceEntity,
          trigger: base.trigger,
          condition: base.condition ?? Prisma.JsonNull,
          actions: base.actions as Prisma.InputJsonValue,
          status: "DRAFT",
        },
      });
    });
    res.status(201).json(version);
  } catch (error) {
    next(error);
  }
});

router.patch("/flows/:id/versions/:versionId", async (req, res, next) => {
  try {
    const data = flowData(req.body);
    const existing = await prisma.recordFlowVersion.findFirst({
      where: { id: req.params.versionId, flowId: req.params.id },
    });
    if (!existing) return res.status(404).json({ error: "Flow version not found" });
    if (existing.status !== "DRAFT")
      return res.status(409).json({ error: "Only draft versions can be edited" });
    res.json(await prisma.recordFlowVersion.update({
      where: { id: existing.id },
      data: {
        name: data.name,
        description: data.description,
        sourceEntity: data.sourceEntity,
        trigger: data.trigger,
        condition: data.condition,
        actions: data.actions,
      },
    }));
  } catch (error) {
    next(error);
  }
});

router.post("/flows/:id/versions/:versionId/activate", async (req, res, next) => {
  try {
    const flow = await prisma.$transaction(async (transaction) => {
      const version = await transaction.recordFlowVersion.findFirst({
        where: { id: req.params.versionId, flowId: req.params.id },
      });
      if (!version)
        throw Object.assign(new Error("Flow version not found"), { status: 404 });
      await transaction.recordFlowVersion.updateMany({
        where: { flowId: version.flowId, status: "ACTIVE" },
        data: { status: "INACTIVE" },
      });
      await transaction.recordFlowVersion.update({
        where: { id: version.id },
        data: { status: "ACTIVE" },
      });
      return transaction.recordFlow.update({
        where: { id: version.flowId },
        data: {
          name: version.name,
          description: version.description,
          sourceEntity: version.sourceEntity,
          trigger: version.trigger,
          condition: version.condition ?? Prisma.JsonNull,
          actions: version.actions as Prisma.InputJsonValue,
          currentVersion: version.version,
          isActive: true,
        },
      });
    });
    res.json(flow);
  } catch (error) {
    next(error);
  }
});

router.get("/flows/:id/versions", async (req, res, next) => {
  try {
    res.json({
      items: await prisma.recordFlowVersion.findMany({
        where: { flowId: req.params.id },
        orderBy: { version: "desc" },
      }),
    });
  } catch (error) {
    next(error);
  }
});

router.get("/flows/:id/versions/:versionId", async (req, res, next) => {
  try {
    const version = await prisma.recordFlowVersion.findFirst({
      where: { id: req.params.versionId, flowId: req.params.id },
      include: {
        runs: {
          take: 50,
          orderBy: { startedDate: "desc" },
          include: {
            activities: { orderBy: { startedDate: "asc" } },
          },
        },
      },
    });
    if (!version) return res.status(404).json({ error: "Flow version not found" });
    res.json(version);
  } catch (error) {
    next(error);
  }
});

router.get("/flows/:id/versions/:versionId/activity-metrics", async (req, res, next) => {
  try {
    const rows = await prisma.recordFlowActivityRun.groupBy({
      by: ["activityId", "status"],
      where: {
        run: {
          flowId: req.params.id,
          flowVersionId: req.params.versionId,
        },
      },
      _count: { _all: true },
      _sum: { inputCount: true, outputCount: true, affectedCount: true },
    });
    res.json({ items: rows });
  } catch (error) {
    next(error);
  }
});

router.get("/flows/:id/versions/:versionId/activities/:activityId/logs", async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Math.min(100, Math.max(10, Number(req.query.pageSize) || 25));
    const logic = req.query.logic === "OR" ? "OR" : "AND";
    let filters: Array<{ field?: string; operator?: string; value?: string; valueTo?: string }> = [];
    if (typeof req.query.filters === "string") {
      try {
        const parsed = JSON.parse(req.query.filters);
        if (Array.isArray(parsed)) filters = parsed.slice(0, 10);
      } catch {
        throw Object.assign(new Error("Invalid activity log filters"), { status: 400 });
      }
    }
    const singleRecordTypes = [
      "CREATE_MATCHING",
      "UPDATE_ONE",
      "UPDATE_RECORD",
      "DELETE_RECORD",
      "GET_RECORD",
    ];
    const filterClauses: Prisma.RecordFlowActivityRunWhereInput[] = filters.flatMap(
      (filter): Prisma.RecordFlowActivityRunWhereInput[] => {
      if (!filter.field || !filter.operator) return [];
      if (filter.field === "triggerRecordId") {
        const condition =
          filter.operator === "EQUALS"
            ? { equals: filter.value || "", mode: "insensitive" as const }
            : { contains: filter.value || "", mode: "insensitive" as const };
        return [{ run: { triggerRecordId: condition } }];
      }
      if (filter.field === "affectedId") {
        const condition =
          filter.operator === "EQUALS"
            ? { equals: filter.value || "", mode: "insensitive" as const }
            : { contains: filter.value || "", mode: "insensitive" as const };
        return [{ affectedId: condition, activityType: { in: singleRecordTypes } }];
      }
      if (filter.field === "startedDate") {
        if (filter.operator === "LAST_DAYS") {
          const days = Math.max(1, Number(filter.value) || 1);
          return [{ startedDate: { gte: new Date(Date.now() - days * 86400000) } }];
        }
        const first = filter.value ? new Date(filter.value) : undefined;
        const second = filter.valueTo ? new Date(filter.valueTo) : undefined;
        if (filter.operator === "BETWEEN" && first && second)
          return [{ startedDate: { gte: first, lte: second } }];
        if (filter.operator === "AFTER" && first)
          return [{ startedDate: { gte: first } }];
        if (filter.operator === "BEFORE" && first)
          return [{ startedDate: { lte: first } }];
      }
        return [];
      },
    );
    const where: Prisma.RecordFlowActivityRunWhereInput = {
      activityId: req.params.activityId,
      run: {
        flowId: req.params.id,
        flowVersionId: req.params.versionId,
      },
      ...(filterClauses.length ? { [logic]: filterClauses } : {}),
    };
    const [total, items] = await prisma.$transaction([
      prisma.recordFlowActivityRun.count({ where }),
      prisma.recordFlowActivityRun.findMany({
        where,
        orderBy: { startedDate: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          run: {
            select: {
              triggerRecordId: true,
              status: true,
              startedDate: true,
            },
          },
        },
      }),
    ]);
    res.json({
      items,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      },
    });
  } catch (error) {
    next(error);
  }
});

router.delete("/flows/:id", async (req, res, next) => {
  try {
    await prisma.recordFlow.delete({ where: { id: req.params.id } });
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

router.get("/schema", async (_req, res, next) => {
  try {
    const columns = await prisma.$queryRaw<
      Array<{
        table_name: string;
        column_name: string;
        data_type: string;
        udt_name: string;
        is_nullable: string;
      }>
    >`SELECT table_name, column_name, data_type, udt_name, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public'
      ORDER BY table_name, ordinal_position`;
    const grouped = new Map<string, typeof columns>();
    const enumRows = await prisma.$queryRaw<Array<{ type_name: string; enum_value: string }>>`
      SELECT t.typname AS type_name, e.enumlabel AS enum_value
      FROM pg_type t
      JOIN pg_enum e ON t.oid = e.enumtypid
      JOIN pg_namespace n ON n.oid = t.typnamespace
      WHERE n.nspname = 'public'
      ORDER BY t.typname, e.enumsortorder`;
    const enumValues = new Map<string, string[]>();
    for (const row of enumRows)
      enumValues.set(row.type_name, [...(enumValues.get(row.type_name) ?? []), row.enum_value]);
    for (const column of columns) {
      const current = grouped.get(column.table_name) ?? [];
      current.push(column);
      grouped.set(column.table_name, current);
    }
    const relationships = await loadObjectRelationships();
    res.json({
      relationships,
      models: [...grouped.entries()].map(([name, fields]) => ({
        name: name ? name[0]!.toLowerCase() + name.slice(1) : name,
        table: `"${name}"`,
        fields: fields.map((field) => ({
          name: field.column_name,
          type: ["smallint", "integer", "bigint", "numeric", "real", "double precision"].includes(field.data_type)
            ? "number"
            : field.data_type === "boolean"
              ? "boolean"
              : field.data_type.includes("timestamp") || field.data_type === "date"
                ? "date"
                : field.data_type === "json" || field.data_type === "jsonb"
                  ? "json"
                  : field.data_type === "USER-DEFINED"
                    ? "enum"
                    : "string",
          dataType: field.data_type === "USER-DEFINED" ? field.udt_name : field.data_type,
          values: field.data_type === "USER-DEFINED" ? (enumValues.get(field.udt_name) ?? []) : undefined,
          required: field.is_nullable === "NO",
        })),
      })),
    });
  } catch (error) {
    next(error);
  }
});

router.post("/query-preview", async (req, res, next) => {
  try {
    const rows = await audience(req.body?.sqlQuery, MAX_PREVIEW_ROWS);
    res.json({
      rows,
      columns: rows.length ? Object.keys(rows[0]!) : [],
      limited: rows.length === MAX_PREVIEW_ROWS,
    });
  } catch (error) {
    next(error);
  }
});

router.post("/automations/:id/preview", async (req, res, next) => {
  try {
    const automation = await prisma.audienceAutomation.findUnique({
      where: { id: req.params.id },
    });
    if (!automation)
      throw Object.assign(new Error("Automation not found"), { status: 404 });
    const rows = await audience(automation.sqlQuery, MAX_PREVIEW_ROWS);
    const columns = rows.length ? Object.keys(rows[0]!) : [];
    const missing = [
      automation.subscriberKeyField,
      automation.emailField,
      automation.languageField,
    ].filter((field): field is string => !!field && !columns.includes(field));
    res.json({ rows, columns, missing });
  } catch (error) {
    next(error);
  }
});

router.post("/automations/:id/run", async (req, res, next) => {
  try {
    res.json(await executeAutomation(req.params.id, req.adminUser!.id));
  } catch (error) {
    next(error);
  }
});
