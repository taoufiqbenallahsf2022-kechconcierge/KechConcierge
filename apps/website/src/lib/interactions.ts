"use client";
import { useAuthStore } from "@/store/auth.store";
import { getVisitorId, getVisitorJourneyId, getVisitorSessionId } from "./visitor";
import { createBrowserUUID } from "./browser-id";

export type InteractionContext = {
  pageInstanceId: string; pageUrl: string; pageType: string; pageVisitId?: string;
  started: number; sequence: number;
  visitorId: string; journeyId: string; sessionId: string; token: string | null;
};
export type InteractionDetails = {
  component?: string; target?: string; productId?: string; productType?: string; planId?: string;
  imageIndex?: number; durationMs?: number; inputType?: string; metadata?: Record<string, string | number | boolean | string[] | null>;
};
let current: InteractionContext | undefined;
type Envelope = { token: string | null; visitorId: string; journeyId: string; sessionId: string; event: Record<string, unknown> };
let queue: Envelope[] = [], flushing = false;
const api = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export function interactionPath(input: string) {
  const url = new URL(input, window.location.origin);
  if (!["https:", "http:"].includes(url.protocol)) return "external-contact";
  const path = url.pathname.replace(/\/pay\/[^/]+/g, "/pay/:token");
  const page = url.searchParams.get("page"), section = url.searchParams.get("section");
  const query = new URLSearchParams();
  if (page && /^\d{1,5}$/.test(page)) query.set("page", page);
  if (section && ["profile", "preferences"].includes(section)) query.set("section", section);
  return `${url.origin === window.location.origin ? "" : url.origin}${path}${query.size ? `?${query}` : ""}`;
}
export function interactionPage(input = window.location.href) {
  const pageUrl = interactionPath(input);
  const visitorId = getVisitorId(), journeyId = getVisitorJourneyId(), sessionId = getVisitorSessionId();
  if (!current || current.pageUrl !== pageUrl || current.journeyId !== journeyId || current.sessionId !== sessionId) {
    const normalized = pageUrl.replace(/^\/(fr|de|it|es|pt)(?=\/|$)/, "") || "/";
    const parts = normalized.split("?")[0].split("/").filter(Boolean);
    current = { pageInstanceId: createBrowserUUID(), pageUrl, pageType: parts.length > 1 && ["villas", "transportation", "beachclubs", "nightclubs", "packs", "experiences", "restaurants", "spa"].includes(parts[0]) ? "product" : parts[0] || "home", started: performance.now(), sequence: 0, visitorId, journeyId, sessionId, token: useAuthStore.getState().accessToken };
  }
  current.token = useAuthStore.getState().accessToken;
  return current;
}
export function attachInteractionVisit(context: InteractionContext, pageVisitId: string) { context.pageVisitId = pageVisitId; }

export function interactionHeaders(): Record<string, string> {
  try {
    return { "x-visitor-id": getVisitorId(), "x-journey-id": getVisitorJourneyId(), "x-session-id": getVisitorSessionId(), "x-page-instance-id": interactionPage().pageInstanceId, "x-page-url": interactionPage().pageUrl };
  } catch { return {}; }
}

export function trackInteraction(eventType: string, details: InteractionDetails = {}, context?: InteractionContext) {
  if (typeof window === "undefined") return;
  try {
    const page = context || interactionPage();
    const source = sessionStorage.getItem("moorish_source");
    queue.push({ token: page.token, visitorId: page.visitorId, journeyId: page.journeyId, sessionId: page.sessionId, event: {
      id: eventType === "page_enter" ? `${page.pageInstanceId}-enter` : createBrowserUUID(), eventType, pageInstanceId: page.pageInstanceId, pageVisitId: page.pageVisitId,
      pageUrl: page.pageUrl, pageType: page.pageType, occurredAt: new Date().toISOString(), sequence: ++page.sequence,
      elapsedMs: Math.round(performance.now() - page.started), source,
      viewportWidth: window.innerWidth, viewportHeight: window.innerHeight,
      pointerCapability: matchMedia("(any-pointer: fine)").matches ? "fine" : matchMedia("(any-pointer: coarse)").matches ? "coarse" : "unknown",
      hoverCapability: matchMedia("(any-hover: hover)").matches, language: document.documentElement.lang || navigator.language,
      theme: document.body.classList.contains("nightclub-theme") ? "nightclub" : "normal",
      ...details,
    } });
    if (queue.length > 1000) queue.shift();
    if (queue.length >= 25) void flushInteractions();
  } catch { /* Analytics must never interrupt navigation or a business action. */ }
}

export async function flushInteractions() {
  if (flushing || !queue.length) return;
  flushing = true;
  try {
    while (queue.length) {
      const first = queue[0];
      const matches = (entry: Envelope) => entry.token === first.token && entry.visitorId === first.visitorId && entry.journeyId === first.journeyId && entry.sessionId === first.sessionId;
      const batch: Envelope[] = [];
      let bytes = 100;
      queue = queue.filter(entry => { if (batch.length < 25 && matches(entry) && bytes + new TextEncoder().encode(JSON.stringify(entry.event)).length < 55000) { bytes += new TextEncoder().encode(JSON.stringify(entry.event)).length; batch.push(entry); return false; } return true; });
      if (!batch.length) { queue.shift(); break; }
      const body = JSON.stringify({ events: batch.map(entry => entry.event) });
      let response: Response | undefined;
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          response = await fetch(`${api}/api/interactions`, { method: "POST", keepalive: true,
            headers: { "Content-Type": "application/json", "x-visitor-id": first.visitorId, "x-journey-id": first.journeyId, "x-session-id": first.sessionId,
              ...(first.token ? { Authorization: `Bearer ${first.token}` } : {}) }, body });
          if (response.ok || response.status < 500) break;
        } catch { /* Retry only this original identity's batch. */ }
      }
      if (!response?.ok) { if (!response || response.status >= 500 || response.status === 429) queue.unshift(...batch); break; }
    }
  } finally { flushing = false; }
}
