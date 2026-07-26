import { Router, type Request } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";
import { prisma } from "../config/prisma";
import { claimVisitorJourney, ensureVisitorJourney } from "../services/visitor-journey.service";

const router = Router();

function optionalIndividualId(req: Request) {
  const authorization = req.header("authorization");
  if (!authorization) return null;
  const [scheme, token] = authorization.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token)
    throw Object.assign(new Error("Invalid access token"), { status: 401 });
  const secret = process.env.JWT_SECRET;
  if (!secret)
    throw Object.assign(new Error("Authentication is unavailable"), { status: 503 });
  try {
    const decoded = jwt.verify(token, secret) as JwtPayload & { individualId?: string; id?: string };
    return decoded.individualId ?? decoded.id ?? (typeof decoded.sub === "string" ? decoded.sub : null);
  } catch {
    throw Object.assign(new Error("Invalid or expired access token"), { status: 401 });
  }
}

function text(value: unknown, label: string, max: number, required = false) {
  const normalized = typeof value === "string" ? value.trim() : "";
  if (required && !normalized)
    throw Object.assign(new Error(`${label} is required`), { status: 400 });
  if (normalized.length > max)
    throw Object.assign(new Error(`${label} is too long`), { status: 400 });
  return normalized || null;
}

router.post("/", async (req, res, next) => {
  try {
    const visitorId = text(req.header("x-visitor-id"), "Visitor ID", 100, true)!;
    if (visitorId.length < 16)
      throw Object.assign(new Error("Visitor ID is invalid"), { status: 400 });
    const journeyId = text(req.header("x-journey-id") ?? req.body?.journeyId, "Journey ID", 100, true)!;
    const journey = await ensureVisitorJourney(visitorId, journeyId);
    const individualId = optionalIndividualId(req);
    if (journey.individualId && journey.individualId !== individualId)
      throw Object.assign(new Error("Journey belongs to another Individual"), { status: 409 });
    const individual = individualId
      ? await prisma.individual.findUnique({
          where: { id: individualId },
          select: {
            id: true,
            leads: { take: 1, orderBy: { updatedDate: "desc" }, select: { id: true } },
            prospects: { take: 1, orderBy: { updatedDate: "desc" }, select: { id: true } },
            accounts: { take: 1, orderBy: { updatedDate: "desc" }, select: { id: true } },
          },
        })
      : null;
    if (individualId && !individual)
      throw Object.assign(new Error("Individual not found"), { status: 401 });
    if (individualId && !journey.individualId)
      await claimVisitorJourney(visitorId, journeyId, individualId);
    const accountId = individual?.accounts[0]?.id ?? null;
    const prospectId = accountId ? null : (individual?.prospects[0]?.id ?? null);
    const leadId = accountId || prospectId ? null : (individual?.leads[0]?.id ?? null);
    const visitorStage = accountId ? "ACCOUNT" : prospectId ? "PROSPECT" : leadId ? "LEAD" : "ANONYMOUS";
    const visit = await prisma.pageVisit.create({
      data: {
        pageUrl: text(req.body?.pageUrl, "Page URL", 2000, true)!,
        pageName: text(req.body?.pageName, "Page name", 500),
        visitorId,
        journeyId,
        visitorStage,
        individualId: individual?.id ?? null,
        accountId,
        prospectId,
        leadId,
        sessionId: text(req.body?.sessionId, "Session ID", 100),
        referrer: text(req.body?.referrer, "Referrer", 2000),
        userAgent: text(req.header("user-agent"), "User agent", 1000),
        ipAddress: req.ip,
      },
      select: { id: true, visitDate: true },
    });
    res.status(201).json(visit);
  } catch (error) {
    next(error);
  }
});

export default router;
