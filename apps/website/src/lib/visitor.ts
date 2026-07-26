const VISITOR_KEY = "moorish_visitor_id";
const SESSION_KEY = "moorish_session_id";

function createId(prefix: string) {
  return `${prefix}_${crypto.randomUUID()}`;
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
