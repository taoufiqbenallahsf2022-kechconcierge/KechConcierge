import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import type { Prisma } from "../../../../packages/database/generated/prisma/client.js";
export const interactionRouter = Router();
interactionRouter.get("/", async (req, res, next) => {
  try {
    const page = Math.min(100000, Math.max(1, Math.floor(Number(req.query.page) || 1))), pageSize = 25;
    const where: Prisma.InteractionWhereInput = {};
    for (const field of ["visitorId", "individualId", "journeyId", "pageVisitId", "pageInstanceId", "eventType", "deviceType", "inputType", "productId", "planId", "producer"]) if (typeof req.query[field] === "string" && req.query[field]) (where as any)[field] = String(req.query[field]).slice(0, 120);
    for (const field of ["source", "pageUrl", "component", "target"]) if (typeof req.query[field] === "string" && req.query[field]) (where as any)[field] = { contains: String(req.query[field]).slice(0, 120), mode: "insensitive" };
    if (req.query.audience === "known") where.individualId = { not: null }; else if (req.query.audience === "anonymous") where.individualId = null;
    const from = req.query.from ? new Date(`${req.query.from}T00:00:00Z`) : undefined, to = req.query.to ? new Date(`${req.query.to}T23:59:59.999Z`) : undefined;
    if ((from && isNaN(from.valueOf())) || (to && isNaN(to.valueOf()))) return res.status(400).json({ message: "Invalid GMT date range" });
    if (from || to) where.occurredAt = { gte: from, lte: to };
    const [items, total] = await Promise.all([prisma.interaction.findMany({ where, orderBy: [{ occurredAt: "desc" }, { sequence: "desc" }, { id: "desc" }], skip: (page - 1) * pageSize, take: pageSize }), prisma.interaction.count({ where })]);
    res.json({ items, total, page, pageSize });
  } catch (error) { next(error); }
});
interactionRouter.get("/:id", async (req, res, next) => {
  try {
    const row = await prisma.interaction.findUnique({ where: { id: String(req.params.id) }, include: { individual: { select: { id: true, firstName: true, lastName: true } }, pageVisit: { select: { id: true, referrer: true, previousPageUrl: true, userAgent: true, navigationType: true } } } });
    if (!row) return res.status(404).json({ message: "Interaction not found" });
    res.json(row);
  } catch (error) { next(error); }
});
