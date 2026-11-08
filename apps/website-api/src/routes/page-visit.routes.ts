import { Router, type Request } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";
import { prisma } from "../config/prisma";
import { claimVisitorJourney, ensureVisitorJourney } from "../services/visitor-journey.service";
import { recordVisitor } from "../services/visitor-profile.service";

const router = Router();
const protectedAccount = (url: string) => /^\/(?:fr\/|de\/|es\/|it\/|pt\/)?account\/?$/.test(new URL(url, "https://navigation.invalid").pathname);

function navigationUrl(value: unknown) {
  if (typeof value !== "string" || !value) return null;
  if (value.length > 2000) throw Object.assign(new Error("Navigation URL is too long"), { status: 400 });
  try {
    const url = new URL(value, "https://navigation.invalid");
    if (!["https:", "http:"].includes(url.protocol)) return null;
    const query = new URLSearchParams();
    for (const key of ["section", "source", "utm_source", "utm_medium", "utm_campaign", "medium", "campaign"])
      if (url.searchParams.has(key)) query.set(key, url.searchParams.get(key)!);
    return `${url.origin === "https://navigation.invalid" ? "" : url.origin}${url.pathname}${query.size ? `?${query}` : ""}`;
  } catch { return null; }
}

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
    const source = text(req.body?.source, "Source", 120)?.toLowerCase() ?? null;
    const pageUrl = text(req.body?.pageUrl, "Page URL", 2000, true)!;
    const navigationType = text(req.body?.navigationType, "Navigation type", 40);
    if (navigationType && !["navigate", "reload", "back_forward", "prerender", "client_navigation", "unknown"].includes(navigationType))
      throw Object.assign(new Error("Invalid navigation type"), { status: 400 });
    const clientVisitedAt = req.body?.clientVisitedAt ? new Date(req.body.clientVisitedAt) : null;
    if (clientVisitedAt && !Number.isFinite(clientVisitedAt.getTime())) throw Object.assign(new Error("Invalid client visit time"), { status: 400 });
    await recordVisitor({ visitorId, source, pageUrl: req.body?.pageUrl, referrer: req.body?.referrer, userAgent: req.header("user-agent"), language: req.body?.language, utmCampaign: req.body?.utmCampaign, utmMedium: req.body?.utmMedium, individualId: individual?.id });
    const visit = await prisma.pageVisit.create({
      data: {
        pageUrl,
        pageName: text(req.body?.pageName, "Page name", 500),
        visitorId,
        source,
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
        authenticationStatus: individual ? "AUTHENTICATED" : "ANONYMOUS",
        accessOutcome: protectedAccount(pageUrl) ? "REQUESTED_NOT_CONFIRMED" : null,
        previousPageUrl: navigationUrl(req.body?.previousPageUrl),
        clickedLinkUrl: navigationUrl(req.body?.clickedLinkUrl),
        navigationType,
        clientVisitedAt,
        browserLanguage: text(req.body?.language, "Browser language", 100),
        webdriver: typeof req.body?.webdriver === "boolean" ? req.body.webdriver : null,
        requestOrigin: text(req.header("origin"), "Request origin", 500),
        fetchSite: text(req.header("sec-fetch-site"), "Fetch site", 40),
      },
      select: { id: true, visitDate: true },
    });
    res.status(201).json(visit);
  } catch (error) {
    next(error);
  }
});

router.patch("/:id/access", async (req, res, next) => {
  try {
    const outcome = req.body?.outcome;
    if (!["REDIRECTED_UNAUTHENTICATED", "ACCOUNT_DATA_LOADED", "ACCOUNT_LOAD_FAILED"].includes(outcome))
      return res.status(400).json({ message: "Invalid access outcome" });
    const visit = await prisma.pageVisit.findFirst({ where: {
      id: String(req.params.id), visitorId: text(req.header("x-visitor-id"), "Visitor ID", 100, true),
      journeyId: text(req.header("x-journey-id"), "Journey ID", 100, true),
      visitDate: { gte: new Date(Date.now() - 5 * 60 * 1000) },
    } });
    if (!visit || !protectedAccount(visit.pageUrl)) return res.status(404).json({ message: "Recent account page visit not found" });
    if (outcome === "ACCOUNT_DATA_LOADED") {
      const individualId = optionalIndividualId(req);
      if (!individualId || individualId !== visit.individualId) return res.status(401).json({ message: "Verified account authentication is required" });
    }
    await prisma.pageVisit.update({ where: { id: visit.id }, data: { accessOutcome: outcome } });
    res.status(204).end();
  } catch (error) { next(error); }
});

export default router;
