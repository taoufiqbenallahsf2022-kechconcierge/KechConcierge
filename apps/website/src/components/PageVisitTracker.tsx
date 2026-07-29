"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";
import { getVisitorId, getVisitorJourneyId, getVisitorSessionId } from "@/lib/visitor";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export function PageVisitTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const accessToken = useAuthStore(state => state.accessToken);
  const hasRestoredAuth = useAuthStore(state => state.hasRestoredAuth);
  const lastVisit = useRef("");
  const query = searchParams.toString();

  useEffect(() => {
    if (!hasRestoredAuth) return;
    if (useAuthStore.getState().accessToken !== accessToken) return;
    const visitorId = getVisitorId();
    const journeyId = getVisitorJourneyId();
    const sessionId = getVisitorSessionId();
    const pageUrl = `${pathname}${query ? `?${query}` : ""}`;
    const identity = accessToken ? "individual" : "visitor";
    const key = `${identity}:${journeyId}:${pageUrl}`;
    if (lastVisit.current === key) return;
    lastVisit.current = key;

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
        pageName: document.title,
        referrer: document.referrer || null,
        sessionId,
        journeyId,
      }),
      keepalive: true,
    }).catch(() => undefined);
  }, [accessToken, hasRestoredAuth, pathname, query]);

  return null;
}
