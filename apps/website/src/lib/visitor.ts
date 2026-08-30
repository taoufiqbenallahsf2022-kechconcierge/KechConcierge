const VISITOR_KEY = "moorish_visitor_id";
const SESSION_KEY = "moorish_session_id";
const JOURNEY_KEY = "moorish_journey_id";

function createId(prefix: string) {
  const browserCrypto = globalThis.crypto;

  if (typeof browserCrypto?.randomUUID === "function") {
    return `${prefix}_${browserCrypto.randomUUID()}`;
  }

  if (typeof browserCrypto?.getRandomValues === "function") {
    const bytes = browserCrypto.getRandomValues(new Uint8Array(16));
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0"));
    const uuid = `${hex.slice(0, 4).join("")}-${hex.slice(4, 6).join("")}-${hex.slice(6, 8).join("")}-${hex.slice(8, 10).join("")}-${hex.slice(10).join("")}`;
    return `${prefix}_${uuid}`;
  }

  // Last-resort support for older browsers running the local site over HTTP.
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`;
}

export function getVisitorId() {
  let id = localStorage.getItem(VISITOR_KEY);
  if (!id) {
    id = createId("visitor");
    localStorage.setItem(VISITOR_KEY, id);
  }
  return id;
}

export function getVisitorSessionId() {
  let id = sessionStorage.getItem(SESSION_KEY);
  if (!id) {
    id = createId("session");
    sessionStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

export function getVisitorJourneyId() {
  let id = localStorage.getItem(JOURNEY_KEY);
  if (!id) {
    id = createId("journey");
    localStorage.setItem(JOURNEY_KEY, id);
  }
  return id;
}

export function rotateVisitorJourney() {
  const id = createId("journey");
  localStorage.setItem(JOURNEY_KEY, id);
  sessionStorage.setItem(SESSION_KEY, createId("session"));
  window.dispatchEvent(new Event("moorish-journey-change"));
  return id;
}
