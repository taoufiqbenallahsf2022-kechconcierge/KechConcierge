export type AccountAccessOutcome = "REDIRECTED_UNAUTHENTICATED" | "ACCOUNT_DATA_LOADED" | "ACCOUNT_LOAD_FAILED";
const outcomes = new Map<string, AccountAccessOutcome>();
export const ACCOUNT_ACCESS_EVENT = "moorish-account-access";

export function safeVisitUrl(input: string) {
  const url = new URL(input, window.location.origin);
  // Keep navigation context, never credentials or personal query parameters.
  const query = new URLSearchParams();
  for (const key of ["section", "source", "utm_source", "utm_medium", "utm_campaign", "medium", "campaign"])
    if (url.searchParams.has(key)) query.set(key, url.searchParams.get(key)!);
  return `${url.origin === window.location.origin ? "" : url.origin}${url.pathname}${query.size ? `?${query}` : ""}`;
}

export function reportAccountAccess(pageUrl: string, outcome: AccountAccessOutcome) {
  const key = safeVisitUrl(pageUrl);
  outcomes.set(key, outcome);
  if (outcomes.size > 50) outcomes.delete(outcomes.keys().next().value!);
  window.dispatchEvent(new CustomEvent(ACCOUNT_ACCESS_EVENT, { detail: { pageUrl: key, outcome } }));
}

export function getAccountAccessOutcome(pageUrl: string) { return outcomes.get(safeVisitUrl(pageUrl)); }
export function clearAccountAccessOutcome(pageUrl: string) { outcomes.delete(safeVisitUrl(pageUrl)); }
