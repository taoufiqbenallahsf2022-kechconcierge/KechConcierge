import assert from "node:assert/strict";
import test from "node:test";
import { interactionPage, interactionPath, trackInteraction, flushInteractions } from "../src/lib/interactions";
import { useAuthStore } from "../src/store/auth.store";

test("client batches retain the original visitor/journey/auth context across identity changes", async () => {
  const storage = () => { const data = new Map<string, string>(); return { getItem: (key: string) => data.get(key) || null, setItem: (key: string, value: string) => data.set(key, value), removeItem: (key: string) => data.delete(key) }; };
  Object.assign(globalThis, {
    window: { location: { origin: "https://example.invalid", href: "https://example.invalid/villas/qa" }, innerWidth: 390, innerHeight: 844 },
    document: { documentElement: { lang: "en" }, body: { classList: { contains: () => false } } },
    localStorage: storage(), sessionStorage: storage(), matchMedia: () => ({ matches: false }),
  });
  const original = globalThis.fetch, requests: any[] = [];
  globalThis.fetch = async (_url, options) => { requests.push({ headers: options!.headers, body: JSON.parse(String(options!.body)) }); return Response.json({ accepted: 1 }); };
  try {
    useAuthStore.setState({ accessToken: null });
    const first = interactionPage();
    trackInteraction("click", { target: "open-plans" });
    localStorage.setItem("moorish_journey_id", "journey_second_person_test");
    useAuthStore.setState({ accessToken: "test-second-person-token" });
    const second = interactionPage();
    trackInteraction("click", { target: "open-gallery" });
    await flushInteractions();
    assert.notEqual(first.pageInstanceId, second.pageInstanceId);
    assert.equal(requests.length, 2);
    assert.equal(requests[0].headers.Authorization, undefined);
    assert.equal(requests[0].headers["x-journey-id"], first.journeyId);
    assert.equal(requests[1].headers.Authorization, "Bearer test-second-person-token");
    assert.equal(requests[1].headers["x-journey-id"], second.journeyId);
    assert.equal(requests[0].body.events[0].target, "open-plans");
    assert.equal(interactionPath("/pay/private-token?email=private&token=private"), "/pay/:token");
    assert.equal(interactionPath("/account?section=preferences&token=private"), "/account?section=preferences");
  } finally { globalThis.fetch = original; useAuthStore.setState({ accessToken: null }); }
});
