import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { Prisma } from "../../../../packages/database/generated/prisma/client.js";

export const visitorRouter = Router();
visitorRouter.get("/", async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1), pageSize = 25;
    const search = String(req.query.search ?? "").trim(), source = String(req.query.source ?? "").trim();
    const from = req.query.from ? new Date(`${req.query.from}T00:00:00Z`) : undefined;
    const to = req.query.to ? new Date(`${req.query.to}T23:59:59.999Z`) : undefined;
    if ((from && isNaN(from.valueOf())) || (to && isNaN(to.valueOf()))) return res.status(400).json({ message: "Invalid date filter" });
    const where: Prisma.VisitorWhereInput = {
      ...(search ? { OR: ["id", "firstName", "lastName", "email", "phone"].map(field => ({ [field]: { contains: search, mode: "insensitive" } })) } : {}),
      ...(source ? { source: { contains: source, mode: "insensitive" } } : {}),
      ...(from || to ? { firstSeenAt: { gte: from, lte: to } } : {}),
      ...(req.query.individualId ? { identities: { some: { individualId: String(req.query.individualId) } } } : req.query.audience === "known" ? { identities: { some: {} } } : req.query.audience === "visitor" ? { identities: { none: {} } } : {}),
    };
    const [items, total] = await Promise.all([prisma.visitor.findMany({ where, orderBy: { lastSeenAt: "desc" }, skip: (page - 1) * pageSize, take: pageSize, include: { identities: { select: { individualId: true } } } }), prisma.visitor.count({ where })]);
    res.json({ items, total, page, pageSize, pages: Math.max(1, Math.ceil(total / pageSize)) });
  } catch (error) { next(error); }
});

visitorRouter.get("/:id", async (req, res, next) => {
  try {
    const id = String(req.params.id);
    const visitor = await prisma.visitor.findUnique({ where: { id }, include: { identities: { include: { individual: { select: { id: true, firstName: true, lastName: true, email: true, manualEmail: true, acquisitionSource: true } } } } } });
    if (!visitor) return res.status(404).json({ message: "Visitor not found" });
    const [visits, contacts, chats, carts] = await Promise.all([
      prisma.pageVisit.count({ where: { visitorId: id } }), prisma.contactRequest.count({ where: { visitorId: id } }),
      prisma.chat.count({ where: { visitorId: id } }), prisma.tripCart.count({ where: { visitorId: id } }),
    ]);
    res.json({ ...visitor, counts: { visits, contacts, chats, carts } });
  } catch (error) { next(error); }
});

visitorRouter.get("/:id/activity", async (req, res, next) => {
  try {
    const id = String(req.params.id), page = Math.max(1, Number(req.query.page) || 1), pageSize = 25;
    const type = String(req.query.type ?? "all");
    const kinds = ["visit", "contact", "chat", "trip"];
    if (type !== "all" && !kinds.includes(type)) return res.status(400).json({ message: "Invalid activity type" });
    const rows = await prisma.$queryRaw<any[]>(Prisma.sql`
      SELECT * FROM (
        SELECT 'visit' AS kind, id, "visitDate" AS date, COALESCE("pageName", "pageUrl") AS label, "pageUrl" AS detail, "individualId", source, "accessOutcome", "clientVisitedAt" FROM "PageVisit" WHERE "visitorId" = ${id}
        UNION ALL SELECT 'contact', id, "createdDate", "requestType"::text, subject, "individualId", NULL, NULL, NULL FROM "ContactRequest" WHERE "visitorId" = ${id}
        UNION ALL SELECT 'chat', id, "createdDate", status::text, "managedBy"::text, "individualId", NULL, NULL, NULL FROM "Chat" WHERE "visitorId" = ${id}
        UNION ALL SELECT 'trip', id, "createdDate", status::text, NULL, "individualId", NULL, NULL, NULL FROM "TripCart" WHERE "visitorId" = ${id}
      ) activity WHERE (${type} = 'all' OR kind = ${type}) ORDER BY date DESC, kind, id LIMIT ${pageSize + 1} OFFSET ${(page - 1) * pageSize}
    `);
    res.json({ items: rows.slice(0, pageSize), hasMore: rows.length > pageSize, page, pageSize });
  } catch (error) { next(error); }
});
