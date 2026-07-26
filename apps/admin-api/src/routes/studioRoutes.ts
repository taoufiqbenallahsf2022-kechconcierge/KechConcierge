import { Router } from "express";
import { Prisma } from "../../../../packages/database/generated/prisma/client.js";
import { prisma } from "../lib/prisma.js";
import { audience, executeAutomation, safeSelect } from "../automation/automationEngine.js";
import { nextRunAt, scheduleData } from "../automation/schedule.js";

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
  if (!["CREATED", "UPDATED"].includes(trigger))
    throw Object.assign(new Error("Trigger must be CREATED or UPDATED"), {
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
    trigger: trigger as "CREATED" | "UPDATED",
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
crud("/flows", prisma.recordFlow, flowData);

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
    res.json({
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
