import { openAIModel } from "../services/openAIModel.js";
import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { validateReportingSql } from "../services/queryAgentSql.js";

export const queryAgentRouter = Router();
// SQL generation and reporting data are restricted to administrators.
queryAgentRouter.use((req, res, next) => {
  if (req.adminUser?.role?.toUpperCase() !== "ADMIN") return res.status(403).json({ message: "Query Agent is available to administrators only" });
  next();
});
const jsonSafe = (value: unknown) => JSON.parse(JSON.stringify(value, (_key, item) => typeof item === "bigint" ? item.toString() : item));
const activeGenerations = new Set<string>();
const activeExecutions = new Set<string>();

queryAgentRouter.get("/", async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1), pageSize = 20;
    const where = { createdBy: req.adminUser!.id };
    const [items, total] = await Promise.all([prisma.agentQuery.findMany({ where, orderBy: { updatedDate: "desc" }, skip: (page - 1) * pageSize, take: pageSize, include: { _count: { select: { executions: true } } } }), prisma.agentQuery.count({ where })]);
    res.json({ items, total, page, pageSize });
  } catch (error) { next(error); }
});
queryAgentRouter.get("/:id", async (req, res, next) => {
  try {
    const item = await prisma.agentQuery.findFirst({ where: { id: String(req.params.id), createdBy: req.adminUser!.id } });
    if (!item) return res.status(404).json({ message: "Query not found" });
    const page = Math.max(1, Number(req.query.page) || 1), pageSize = 20;
    const [executions, total] = await Promise.all([prisma.agentQueryExecution.findMany({ where: { queryId: item.id }, orderBy: { createdDate: "desc" }, skip: (page - 1) * pageSize, take: pageSize }), prisma.agentQueryExecution.count({ where: { queryId: item.id } })]);
    res.json({ ...item, executions, executionPage: page, executionTotal: total });
  } catch (error) { next(error); }
});

queryAgentRouter.post("/", async (req, res, next) => {
  const userId = req.adminUser!.id;
  if (activeGenerations.has(userId)) return res.status(429).json({ message: "A query is already being generated. Please wait." });
  activeGenerations.add(userId);
  try {
    const prompt = typeof req.body.prompt === "string" ? req.body.prompt.trim() : "";
    if (!prompt || prompt.length > 4000) return res.status(400).json({ message: "Enter a request of 1–4,000 characters" });
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return res.status(503).json({ message: "OPENAI_API_KEY is not configured in Admin API" });
    const model = openAIModel("query");
    const columns = await prisma.$queryRawUnsafe<any[]>(`SELECT table_name, column_name, data_type FROM information_schema.columns WHERE table_schema = 'query_agent' ORDER BY table_name, ordinal_position`);
    const relationships = await prisma.$queryRawUnsafe<any[]>(`SELECT tc.table_name, kcu.column_name, ccu.table_name AS referenced_table, ccu.column_name AS referenced_column FROM information_schema.table_constraints tc JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name AND tc.constraint_schema = kcu.constraint_schema JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name AND ccu.constraint_schema = tc.constraint_schema WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public' ORDER BY tc.table_name, kcu.column_name`);
    if (!columns.length) return res.status(503).json({ message: "Apply the Query Agent business coverage database migration before generating queries" });
    const schema = Object.fromEntries([...new Set(columns.map(column => column.table_name))].map(table => [table, columns.filter(column => column.table_name === table).map(column => `${column.column_name}:${column.data_type}`)]));
    const previous = typeof req.body.previousQueryId === "string" ? await prisma.agentQuery.findFirst({ where: { id: req.body.previousQueryId, createdBy: userId }, select: { prompt: true, sql: true } }) : null;
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST", signal: AbortSignal.timeout(90000), headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model, store: false, max_output_tokens: 5000,
        instructions: `You generate PostgreSQL read-only business reporting queries. Return title, sql, explanation. You can investigate ALL supplied application business entities: products, villas, transport, plans, images, visitors, individuals, customers, orders, payments, chats, messages, forms, marketing and administration. Use exact supplied table and column names. Business entities retain CamelCase names: ALWAYS double-quote them and camelCase columns, for example SELECT "id", "titleEN", "createdAt" FROM "Villa". They resolve inside the query_agent schema, which excludes credentials. Do not prefix business entities with public. Legacy reporting_* names remain available. Never use system catalogs, external functions, write statements, credentials, or SELECT INTO. Do not limit requests to visitor reporting. Use the supplied foreign keys for joins; check exact date columns rather than assuming created_at. Legacy Product and independent Villa/catalog tables coexist; prefer the independent catalog entity for its product category. Use ordinary SELECT, WITH, UNION, joins, count/sum/avg/min/max/date_trunc/date_part/coalesce/nullif/lower/upper/round/to_char/now/concat/trim/greatest/least. Dates are GMT/UTC; today means CURRENT_DATE in UTC. Preserve rows with unknown source using COALESCE(source,'unknown'); never invent history. Visitor source is first touch, last_source is latest touch; page visit source is visit attribution. Individuals source is acquisition source; registration_source is separate. Customers link to individuals by individual_id. Avoid double-counting by using count(distinct id) or pre-aggregation before joining. Anonymous visitor IDs identify browser installations, not guaranteed unique people. For first acquisition today use visitors.first_seen_at, individuals.created_at, customers.created_at as appropriate; for activity today use visits.visited_at. Explain date and count semantics. No results are provided to you, only schema. Return empty sql and an explanation if the request cannot be answered by these views. Today UTC: ${new Date().toISOString().slice(0, 10)}. Schema: ${JSON.stringify(schema)}. Relationships: ${JSON.stringify(relationships)}`,
        input: `${previous ? `Previous request: ${previous.prompt}\nPrevious SQL: ${previous.sql}\nFollow-up: ` : "Request: "}${prompt}`,
        text: { format: { type: "json_schema", name: "reporting_query", strict: true, schema: { type: "object", properties: { title: { type: "string" }, sql: { type: "string" }, explanation: { type: "string" } }, required: ["title", "sql", "explanation"], additionalProperties: false } } },
      }),
    });
    const body = await response.json() as any;
    if (!response.ok) throw Object.assign(new Error(body.error?.message || "OpenAI query generation failed"), { status: 502 });
    const output = body.output?.flatMap((item: any) => item.content ?? []).filter((item: any) => item.type === "output_text").map((item: any) => item.text).join("") || body.output_text;
    if (!output) throw Object.assign(new Error("OpenAI did not return a query. Try rephrasing your request."), { status: 422 });
    const generated = JSON.parse(output);
    if (!generated.sql) return res.status(422).json({ message: generated.explanation || "This request cannot be answered from the available reporting data" });
    const sql = validateReportingSql(generated.sql);
    const item = await prisma.agentQuery.create({ data: { prompt, title: String(generated.title).slice(0, 200), explanation: String(generated.explanation).slice(0, 5000), sql, model, createdBy: userId } });
    res.status(201).json(item);
  } catch (error) { next(error); }
  finally { activeGenerations.delete(userId); }
});

queryAgentRouter.post("/:id/execute", async (req, res, next) => {
  const userId = req.adminUser!.id;
  if (activeExecutions.has(userId)) return res.status(429).json({ message: "A report is already running. Please wait." });
  activeExecutions.add(userId);
  let item: Awaited<ReturnType<typeof prisma.agentQuery.findFirst>>;
  const started = Date.now();
  try {
    item = await prisma.agentQuery.findFirst({ where: { id: String(req.params.id), createdBy: userId } });
    if (!item) return res.status(404).json({ message: "Query not found" });
    const sql = validateReportingSql(item.sql);
    const page = Math.min(1000, Math.max(1, Number(req.body.page) || 1)), pageSize = 50;
    const result = await prisma.$transaction(async tx => {
      await tx.$executeRawUnsafe("SET TRANSACTION READ ONLY");
      await tx.$executeRawUnsafe("SET LOCAL search_path = query_agent, pg_catalog");
      await tx.$executeRawUnsafe("SET LOCAL statement_timeout = '5000ms'");
      await tx.$executeRawUnsafe("SET LOCAL lock_timeout = '1000ms'");
      await tx.$executeRawUnsafe("SET LOCAL TIME ZONE 'UTC'");
      const rows = await tx.$queryRawUnsafe<Record<string, unknown>[]>(`SELECT * FROM (${sql}) AS report_result LIMIT $1 OFFSET $2`, pageSize + 1, (page - 1) * pageSize);
      return { items: rows.slice(0, pageSize), hasMore: rows.length > pageSize, page, pageSize };
    }, { timeout: 8000 });
    const execution = await prisma.agentQueryExecution.create({ data: { queryId: item.id, executedBy: userId, sql, status: "SUCCESS", rowCount: result.items.length, durationMs: Date.now() - started } });
    res.json(jsonSafe({ ...result, execution }));
  } catch (error) {
    try {
      const saved = await prisma.agentQuery.findFirst({ where: { id: String(req.params.id), createdBy: userId } });
      if (saved) await prisma.agentQueryExecution.create({ data: { queryId: saved.id, executedBy: userId, sql: saved.sql, status: "FAILED", error: error instanceof Error ? error.message.slice(0, 1000) : "Execution failed", durationMs: Date.now() - started } });
    } catch { /* Preserve the original execution error. */ }
    next(error);
  } finally { activeExecutions.delete(userId); }
});

queryAgentRouter.patch("/:id", async (req, res, next) => {
  try {
    const item = await prisma.agentQuery.findFirst({ where: { id: String(req.params.id), createdBy: req.adminUser!.id } });
    if (!item) return res.status(404).json({ message: "Query not found" });
    const sql = validateReportingSql(req.body.sql);
    res.json(await prisma.agentQuery.update({ where: { id: item.id }, data: { sql } }));
  } catch (error) { next(error); }
});
