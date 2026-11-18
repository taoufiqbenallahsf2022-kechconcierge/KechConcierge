import assert from "node:assert/strict";
import test from "node:test";
import { interactionPage, interactionPath, trackInteraction, flushInteractions } from "../src/lib/interactions";
import { useAuthStore } from "../src/store/auth.store";

test("client batches retain the original visitor/journey/auth context across identity changes", async () => {
  const cryptoDescriptor = Object.getOwnPropertyDescriptor(globalThis, "crypto");
  const randomValues = globalThis.crypto.getRandomValues.bind(globalThis.crypto);
  // Reproduce plain HTTP Wi-Fi access: randomUUID is absent but secure random
  // bytes remain available. This previously crashed the page-visit tracker.
  Object.defineProperty(globalThis, "crypto", { configurable: true, value: { getRandomValues: randomValues } });
  const storage = () => { const data = new Map<string, string>(); return { getItem: (key: string) => data.get(key) || null, setItem: (key: string, value: string) => data.set(key, value), removeItem: (key: string) => data.delete(key) }; };
  Object.assign(globalThis, {
    window: { location: { origin: "http://192.168.100.7:3000", href: "http://192.168.100.7:3000/villas/qa" }, innerWidth: 390, innerHeight: 844 },
    document: { documentElement: { lang: "en" }, body: { classList: { contains: () => false } } },
    localStorage: storage(), sessionStorage: storage(), matchMedia: () => ({ matches: false }),
  });
  const original = globalThis.fetch, requests: any[] = [];
  globalThis.fetch = async (_url, options) => { requests.push({ headers: options!.headers, body: JSON.parse(String(options!.body)) }); return Response.json({ accepted: 1 }); };
  try {
    useAuthStore.setState({ accessToken: null });
    const first = interactionPage();
    assert.match(first.pageInstanceId, /^[0-9a-f-]{36}$/);
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
  } finally {
    globalThis.fetch = original; useAuthStore.setState({ accessToken: null });
    if (cryptoDescriptor) Object.defineProperty(globalThis, "crypto", cryptoDescriptor);
    else Reflect.deleteProperty(globalThis, "crypto");
  }
});
