import { Router } from "express";
import { Prisma } from "../../../../packages/database/generated/prisma/client.js";
import { prisma } from "../lib/prisma.js";
import { compileSegment, segmentFunctions, segmentObjects, segmentRelationships } from "../segments/segmentEngine.js";

export const router = Router();
const cleanName = (value: unknown) => typeof value === "string" && value.trim() ? value.trim() : (() => { throw Object.assign(new Error("Segment name is required"), { status: 400 }); })();
const payload = (body: any, userId: string) => { const compiled = compileSegment(body.definition); return { data: { name: cleanName(body.name), description: typeof body.description === "string" && body.description.trim() ? body.description.trim() : null, sourceObject: body.definition.inclusion.sourceObject, definition: body.definition as Prisma.InputJsonValue, isActive: body.isActive !== false, updatedBy: userId }, compiled }; };

router.get("/metadata", (_req, res) => res.json({ objects: segmentObjects, profileObjects: segmentObjects.filter(item => item.profile).map(item => item.name), relationships: segmentRelationships, functions: segmentFunctions }));
router.get("/", async (_req, res, next) => { try { res.json({ items: await prisma.segment.findMany({ orderBy: { updatedDate: "desc" }, select: { id: true, name: true, description: true, sourceObject: true, isActive: true, createdDate: true, updatedDate: true } }) }); } catch (error) { next(error); } });
router.get("/:id", async (req, res, next) => { try { const item = await prisma.segment.findUnique({ where: { id: req.params.id } }); if (!item) return res.status(404).json({ message: "Segment not found" }); res.json({ ...item, generatedSql: compileSegment(item.definition).sql }); } catch (error) { next(error); } });
router.post("/compile", (req, res, next) => { try { const compiled = compileSegment(req.body.definition); res.json({ generatedSql: compiled.sql, output: compiled.output }); } catch (error) { next(error); } });
router.post("/preview", async (req, res, next) => { try { await preview(req.body.definition, req.body, res); } catch (error) { next(error); } });
router.post("/:id/preview", async (req, res, next) => { try { const item = await prisma.segment.findUnique({ where: { id: req.params.id } }); if (!item) return res.status(404).json({ message: "Segment not found" }); await preview(item.definition, req.body, res); } catch (error) { next(error); } });
router.post("/", async (req, res, next) => { try { const parsed = payload(req.body, req.adminUser!.id); const item = await prisma.segment.create({ data: { ...parsed.data, createdBy: req.adminUser!.id } }); res.status(201).json({ ...item, generatedSql: parsed.compiled.sql }); } catch (error) { next(error); } });
router.patch("/:id", async (req, res, next) => { try { const parsed = payload(req.body, req.adminUser!.id); const item = await prisma.segment.update({ where: { id: req.params.id }, data: parsed.data }); res.json({ ...item, generatedSql: parsed.compiled.sql }); } catch (error) { next(error); } });
router.delete("/:id", async (req, res, next) => { try { await prisma.segment.delete({ where: { id: req.params.id } }); res.status(204).end(); } catch (error) { next(error); } });

async function preview(definition: any, body: any, res: any) {
  const compiled = compileSegment(definition); const page = Math.max(1, Number(body.page) || 1); const pageSize = Math.min(100, Math.max(1, Number(body.pageSize) || 25));
  const output = new Map(compiled.output.map(item => [item.name, item])); const params = [...compiled.params];
  const compilePreviewLeaf = (filter: any) => { const metadata = output.get(filter.field); if (!metadata) throw Object.assign(new Error(`Preview field ${filter.field} is not available`), { status: 400 }); const column = `result."${filter.field}"`; if (filter.operator === "IS_NULL") return `${column} IS NULL`; if (filter.operator === "IS_NOT_NULL") return `${column} IS NOT NULL`; if (filter.operator === "BETWEEN") { params.push(filter.value, filter.valueTo); return `${column} BETWEEN $${params.length - 1} AND $${params.length}`; } if (["IN_LAST", "NOT_IN_LAST"].includes(filter.operator)) { const units: Record<string, string> = { MINUTES: "minute", HOURS: "hour", DAYS: "day", WEEKS: "week", MONTHS: "month", YEARS: "year" }; const unit = units[filter.relativeUnit ?? "DAYS"]; if (!unit) throw Object.assign(new Error("Invalid relative date unit"), { status: 400 }); params.push(Number(filter.value)); return `${column} ${filter.operator === "NOT_IN_LAST" ? "<" : ">="} NOW() - ($${params.length} * INTERVAL '1 ${unit}')`; } params.push(filter.value); const placeholder = `$${params.length}`; const op: Record<string, string> = { EQUALS: "=", NOT_EQUALS: "<>", CONTAINS: "ILIKE", GT: ">", GTE: ">=", LT: "<", LTE: "<=" }; const operator = op[filter.operator] ?? "="; return `${column} ${operator} ${filter.operator === "CONTAINS" ? `'%' || ${placeholder} || '%'` : placeholder}`; };
  const compilePreviewGroup = (value: any): string => { if (!value) return ""; if (Array.isArray(value)) return value.map((item, index) => `${index ? item.connector === "OR" ? "OR " : "AND " : ""}${compilePreviewLeaf(item)}`).join(" "); if (value.kind !== "GROUP" || !Array.isArray(value.items)) throw Object.assign(new Error("Invalid preview filter group"), { status: 400 }); const items = value.items.map((item: any) => item?.kind === "GROUP" ? compilePreviewGroup(item) : compilePreviewLeaf(item)); return items.length ? `(${items.join(value.logic === "OR" ? " OR " : " AND ")})` : ""; };
  const filters = compilePreviewGroup(body.filters);
  const base = `SELECT * FROM (${compiled.sql}) result${filters ? ` WHERE ${filters}` : ""}`;
  const [countRows, rows] = await prisma.$transaction(async transaction => {
    await transaction.$executeRawUnsafe("SET LOCAL statement_timeout = '5000ms'");
    const counts = await transaction.$queryRawUnsafe<any[]>(`SELECT COUNT(*)::int AS total FROM (${base}) counted`, ...params);
    const pageParams = [...params, pageSize, (page - 1) * pageSize];
    const items = await transaction.$queryRawUnsafe<any[]>(`${base} LIMIT $${pageParams.length - 1} OFFSET $${pageParams.length}`, ...pageParams);
    return [counts, items] as const;
  });
  const jsonSafe = <T>(value: T): T => JSON.parse(JSON.stringify(value, (_key, item) => {
    if (typeof item !== "bigint") return item;
    return item <= BigInt(Number.MAX_SAFE_INTEGER) && item >= BigInt(Number.MIN_SAFE_INTEGER) ? Number(item) : item.toString();
  }));
  res.json(jsonSafe({ items: rows, page, pageSize, total: Number(countRows[0]?.total ?? 0), pages: Math.max(1, Math.ceil(Number(countRows[0]?.total ?? 0) / pageSize)), output: compiled.output, generatedSql: compiled.sql }));
}
