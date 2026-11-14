import type { Request } from "express";
import { randomUUID } from "node:crypto";
import jwt, { type JwtPayload } from "jsonwebtoken";
import { prisma } from "../config/prisma";
import { ensureVisitorJourney, claimVisitorJourney } from "./visitor-journey.service";

const events = new Set(["page_enter", "page_leave", "page_engagement", "item_view", "item_exposure", "click", "hover", "scroll", "scroll_depth", "field_started", "field_changed", "field_completed", "field_validation", "form_submit", "form_result", "modal_open", "modal_close", "image_change", "plan_change", "cart_result", "chat_result", "auth_result", "payment_result", "content_error", "input", "state_change", "slide_change"]);
const metadataKeys = new Set(["scrollable", "destination", "axis", "direction", "from", "to", "visibleTargets", "percent", "visibleMs", "maxDepth", "form", "reason", "status", "method", "count", "index", "recordId", "field", "result", "planCount", "imageCount", "auto", "itemCount", "open", "section", "channel", "duration", "position"]);
function invalid(message: string): never { throw Object.assign(new Error(message), { status: 400 }); }
function text(value: unknown, max = 120) { if (value == null) return null; if (typeof value !== "string" || value.length > max) return invalid("Invalid interaction text"); return value || null; }
function id(value: unknown) { const result = text(value, 100); if (!result || !/^[\w-]{16,100}$/.test(result)) invalid("Invalid interaction identifier"); return result!; }
function number(value: unknown, max: number) { if (value == null) return null; if (!Number.isSafeInteger(value) || Number(value) < 0 || Number(value) > max) invalid("Invalid interaction number"); return Number(value); }
export function safeInteractionPath(value: unknown) {
  const raw = text(value, 2000); if (!raw) return null;
  const url = new URL(raw, "https://navigation.invalid");
  const path = url.pathname.replace(/\/pay\/[^/]+/g, "/pay/:token");
  const query = new URLSearchParams();
  const page = url.searchParams.get("page"), section = url.searchParams.get("section");
  if (page && /^\d{1,5}$/.test(page)) query.set("page", page);
  if (section && ["profile", "preferences"].includes(section)) query.set("section", section);
  return `${path}${query.size ? `?${query}` : ""}`;
}
export function safeInteractionMetadata(input: unknown) {
  if (!input || typeof input !== "object" || Array.isArray(input)) return {};
  const output: Record<string, string | number | boolean | string[] | null> = {};
  for (const [key, value] of Object.entries(input)) {
    if (!metadataKeys.has(key)) continue;
    if (key === "destination") { output[key] = typeof value === "string" && ["email", "phone", "whatsapp", "external-contact"].includes(value) ? value : safeInteractionPath(value); continue; }
    if (typeof value === "string") output[key] = value.slice(0, 160);
    else if (typeof value === "number" && Number.isFinite(value)) output[key] = value;
    else if (typeof value === "boolean" || value === null) output[key] = value;
    else if (key === "visibleTargets" && Array.isArray(value)) output[key] = value.filter(item => typeof item === "string").slice(0, 20).map(item => item.slice(0, 120));
  }
  return output;
}
export function interactionDevice(ua: string) {
  return {
    deviceType: /ipad|tablet|android(?!.*mobile)/i.test(ua) ? "tablet" : /mobile|iphone|android/i.test(ua) ? "mobile" : ua ? "desktop" : "unknown",
    browser: /edg\//i.test(ua) ? "Edge" : /firefox\//i.test(ua) ? "Firefox" : /chrome|crios/i.test(ua) ? "Chrome" : /safari/i.test(ua) ? "Safari" : "unknown",
    operatingSystem: /ipad|iphone|ipod/i.test(ua) ? "iOS" : /android/i.test(ua) ? "Android" : /windows/i.test(ua) ? "Windows" : /macintosh|mac os/i.test(ua) ? "macOS" : /linux/i.test(ua) ? "Linux" : "unknown",
  };
}
export async function interactionIdentity(req: Request) {
  const visitorId = id(req.header("x-visitor-id")), journeyId = id(req.header("x-journey-id"));
  let verifiedIndividualId: string | null = null;
  const authorization = req.header("authorization");
  if (authorization) {
    const [scheme, token] = authorization.split(" ");
    if (scheme?.toLowerCase() !== "bearer" || !token || !process.env.JWT_SECRET) throw Object.assign(new Error("Invalid authentication"), { status: 401 });
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET) as JwtPayload;
      verifiedIndividualId = payload.individualId || payload.id || (typeof payload.sub === "string" ? payload.sub : null);
      if (!verifiedIndividualId || !await prisma.individual.findFirst({ where: { id: verifiedIndividualId, isActive: true }, select: { id: true } })) throw new Error("Unknown individual");
    } catch { throw Object.assign(new Error("Invalid authentication"), { status: 401 }); }
  }
  const journey = await ensureVisitorJourney(visitorId, journeyId);
  if (verifiedIndividualId && journey.individualId && verifiedIndividualId !== journey.individualId) throw Object.assign(new Error("Journey belongs to another individual"), { status: 409 });
  if (verifiedIndividualId && !journey.individualId) await claimVisitorJourney(visitorId, journeyId, verifiedIndividualId);
  const visitor = await prisma.visitor.findUnique({ where: { id: visitorId }, select: { source: true, lastSource: true } });
  return { visitorId, journeyId, individualId: verifiedIndividualId || journey.individualId, authenticated: Boolean(verifiedIndividualId), source: visitor?.lastSource || visitor?.source || null };
}
export async function ingestInteractions(req: Request) {
  const input = req.body?.events;
  if (!Array.isArray(input) || !input.length || input.length > 25 || JSON.stringify(input).length > 60000) invalid("Send 1–25 bounded interaction events");
  // Validate the entire batch before creating browser/journey state.
  const normalized = input.map((event: any) => {
    if (!event || typeof event !== "object" || Array.isArray(event)) invalid("Invalid interaction event");
    if (!events.has(event.eventType)) invalid("Unsupported interaction type");
    const occurredAt = new Date(event.occurredAt);
    if (!Number.isFinite(occurredAt.valueOf()) || Math.abs(occurredAt.valueOf() - Date.now()) > 7 * 86400000) invalid("Invalid interaction time");
    return {
      id: id(event.id), pageInstanceId: id(event.pageInstanceId), eventType: event.eventType as string,
      pageUrl: safeInteractionPath(event.pageUrl) || "/", pageType: text(event.pageType, 40),
      component: text(event.component), target: text(event.target), productId: text(event.productId, 100), productType: text(event.productType, 40), planId: text(event.planId, 100),
      imageIndex: number(event.imageIndex, 10000), occurredAt, sequence: number(event.sequence, 2147483647), elapsedMs: number(event.elapsedMs, 2147483647), durationMs: number(event.durationMs, 86400000),
      viewportWidth: number(event.viewportWidth, 30000), viewportHeight: number(event.viewportHeight, 30000), inputType: text(event.inputType, 24),
      pointerCapability: text(event.pointerCapability, 24), hoverCapability: typeof event.hoverCapability === "boolean" ? event.hoverCapability : null,
      language: text(event.language, 30), theme: event.theme === "nightclub" ? "nightclub" : "normal", metadata: safeInteractionMetadata(event.metadata),
    };
  });
  const identity = await interactionIdentity(req);
  const sessionId = text(req.header("x-session-id"), 100);
  const pages = await prisma.pageVisit.findMany({ where: { visitorId: identity.visitorId, journeyId: identity.journeyId, clientPageInstanceId: { in: normalized.map(item => item.pageInstanceId) } }, select: { id: true, clientPageInstanceId: true, source: true }, orderBy: { visitDate: "asc" } });
  const pageRows = new Map(pages.map(page => [page.clientPageInstanceId, page]));
  const result = await prisma.interaction.createMany({ skipDuplicates: true, data: normalized.map(event => ({ ...event, ...identity, sessionId, pageVisitId: pageRows.get(event.pageInstanceId)?.id || null, source: pageRows.get(event.pageInstanceId)?.source || identity.source, ...interactionDevice(req.header("user-agent") || "") })) });
  return { accepted: result.count };
}

// Called only after a business operation succeeds; tracking failure cannot roll it back.
export async function recordInteractionOutcome(req: Request, eventType: string, recordId: string, component: string, authenticatedIndividualId?: string | null) {
  if (!req.header("x-visitor-id") || !req.header("x-journey-id") || !req.header("x-page-instance-id")) return;
  try {
    const identity = await interactionIdentity(req);
    if (authenticatedIndividualId && identity.individualId && authenticatedIndividualId !== identity.individualId) return;
    const page = await prisma.pageVisit.findFirst({ where: { visitorId: identity.visitorId, journeyId: identity.journeyId, clientPageInstanceId: req.header("x-page-instance-id") }, orderBy: { visitDate: "desc" }, select: { id: true, source: true } });
    await prisma.interaction.create({ data: {
      id: randomUUID(), ...identity, source: page?.source || identity.source, pageVisitId: page?.id || null, pageInstanceId: id(req.header("x-page-instance-id")), sessionId: text(req.header("x-session-id"), 100),
      eventType, producer: "SERVER", component, target: "submit", pageUrl: safeInteractionPath(req.header("x-page-url")) || "/", occurredAt: new Date(),
      ...interactionDevice(req.header("user-agent") || ""), metadata: { recordId, result: "success" },
    } });
  } catch { /* Business records remain authoritative even if telemetry cannot be written. */ }
}
