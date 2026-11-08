"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";
import { getVisitorId, getVisitorJourneyId, getVisitorSessionId } from "@/lib/visitor";
import { ACCOUNT_ACCESS_EVENT, clearAccountAccessOutcome, getAccountAccessOutcome, safeVisitUrl } from "@/lib/visit-diagnostics";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export function PageVisitTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const accessToken = useAuthStore(state => state.accessToken);
  const hasRestoredAuth = useAuthStore(state => state.hasRestoredAuth);
  const lastVisit = useRef("");
  const firstNavigation = useRef(true);
  const clickedLink = useRef<{ url: string; time: number } | null>(null);
  const query = searchParams.toString();

  useEffect(() => {
    function clicked(event: MouseEvent) {
      const anchor = event.target instanceof Element ? event.target.closest("a[href]") as HTMLAnchorElement | null : null;
      if (anchor && event.isTrusted && ["http:", "https:"].includes(anchor.protocol)) clickedLink.current = { url: safeVisitUrl(anchor.href), time: Date.now() };
    }
    document.addEventListener("click", clicked, true);
    return () => document.removeEventListener("click", clicked, true);
  }, []);

  useEffect(() => {
    if (!hasRestoredAuth) return;
    if (useAuthStore.getState().accessToken !== accessToken) return;
    const visitorId = getVisitorId();
    const journeyId = getVisitorJourneyId();
    const sessionId = getVisitorSessionId();
    const trackingQuery = new URLSearchParams(query);
    const explicitSource = trackingQuery.get("source") || trackingQuery.get("utm_source");
    if (explicitSource) sessionStorage.setItem("moorish_source", explicitSource.slice(0, 120).toLowerCase());
    const source = explicitSource || sessionStorage.getItem("moorish_source") || (document.referrer ? (() => { try { const host = new URL(document.referrer).hostname; return host === window.location.hostname ? "direct" : host; } catch { return "direct"; } })() : "direct");
    for (const key of ["token", "code", "session_id", "email", "access_token", "reset_token"]) trackingQuery.delete(key);
    const safeQuery = trackingQuery.toString();
    const pageUrl = `${pathname}${safeQuery ? `?${safeQuery}` : ""}`;
    const identity = accessToken ? "individual" : "visitor";
    const key = `${identity}:${journeyId}:${pageUrl}`;
    if (lastVisit.current === key) return;
    lastVisit.current = key;
    const previousPageUrl = sessionStorage.getItem("moorish_last_page");
    sessionStorage.setItem("moorish_last_page", safeVisitUrl(pageUrl));
    const navigationType = firstNavigation.current
      ? (performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined)?.type || "unknown"
      : "client_navigation";
    firstNavigation.current = false;
    const clickedLinkUrl = clickedLink.current && Date.now() - clickedLink.current.time < 5000 ? clickedLink.current.url : null;
    clickedLink.current = null;

    // The account guard can report before or after this request finishes, including before a redirect.
    let visitId: string | undefined;
    let sentOutcome = "";
    function sendOutcome() {
      const outcome = getAccountAccessOutcome(pageUrl);
      if (!visitId || !outcome || outcome === sentOutcome) return;
      sentOutcome = outcome;
      void fetch(`${API_URL}/api/page-visits/${visitId}/access`, {
        method: "PATCH", keepalive: true,
        headers: { "Content-Type": "application/json", "x-visitor-id": visitorId, "x-journey-id": journeyId,
          ...(outcome === "ACCOUNT_DATA_LOADED" && accessToken ? { Authorization: `Bearer ${accessToken}` } : {}) },
        body: JSON.stringify({ outcome }),
      }).catch(() => undefined);
    }
    const accessChanged = (event: Event) => {
      if ((event as CustomEvent).detail?.pageUrl === safeVisitUrl(pageUrl)) sendOutcome();
    };
    window.addEventListener(ACCOUNT_ACCESS_EVENT, accessChanged);
    window.setTimeout(() => {
      window.removeEventListener(ACCOUNT_ACCESS_EVENT, accessChanged);
      clearAccountAccessOutcome(pageUrl);
    }, 30000);

    void fetch(`${API_URL}/api/page-visits`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-visitor-id": visitorId,
        "x-journey-id": journeyId,
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      body: JSON.stringify({
        pageUrl,
        source: source.slice(0, 120),
        utmCampaign: searchParams.get("utm_campaign"),
        utmMedium: searchParams.get("utm_medium"),
        language: navigator.language,
        pageName: document.title,
        referrer: document.referrer ? (() => { try { const url = new URL(document.referrer); return `${url.origin}${url.pathname}`; } catch { return null; } })() : null,
        sessionId,
        journeyId,
        previousPageUrl,
        clickedLinkUrl,
        navigationType,
        clientVisitedAt: new Date().toISOString(),
        webdriver: typeof navigator.webdriver === "boolean" ? navigator.webdriver : null,
      }),
      keepalive: true,
    }).then(async response => {
      if (response.ok) { visitId = (await response.json()).id; sendOutcome(); }
    }).catch(() => undefined);
  }, [accessToken, hasRestoredAuth, pathname, query]);

  return null;
}
