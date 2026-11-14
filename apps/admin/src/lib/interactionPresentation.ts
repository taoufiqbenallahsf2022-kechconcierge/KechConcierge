export type InteractionRecord = { eventType?: string; target?: string | null; component?: string | null; pageUrl?: string; durationMs?: number | null; imageIndex?: number | null; deviceType?: string | null; source?: string | null; metadata?: Record<string, any> | null };
const words = (value: string) => value.replace(/[-_]+/g, " ").replace(/\b\w/g, c => c.toUpperCase());
export function pageName(input = "/"): string {
  const path = input.split("?")[0].replace(/^\/(fr|de|it|es|pt)(?=\/|$)/, "") || "/";
  const names: Record<string, string> = { "/": "Homepage", "/villas": "Villas", "/beachclubs": "Beach clubs", "/transportation": "Transportation", "/nightclubs": "Nightclubs", "/restaurants": "Restaurants", "/experiences": "Experiences", "/contact": "Contact page", "/about": "About us", "/account": "Account", "/services": "Services", "/trip": "Trip", "/terms": "Terms and policies", "/forgot-password": "Password recovery", "/reset-password": "Password reset", "/chat": "Live chat" };
  if (names[path]) return names[path];
  if (path.includes("/pay/")) return "Secure payment page";
  let last = path.split("/").filter(Boolean).pop() || "Page";
  try { last = decodeURIComponent(last); } catch { /* Keep malformed paths readable. */ }
  if (/[a-f0-9]{8}-[a-f0-9-]{20,}/i.test(last)) return "Product page";
  return words(last);
}
export function targetName(row: InteractionRecord): string {
  const target = row.target || "", component = row.component || "";
  const names: Record<string,string> = { "open-booking": "Book now button", "booking-cta": "Book now button", "booking-cta-sticky": "Book now button", "open-plans": "Service options and pricing button", "open-add-to-trip": "Add to trip button", "product-price": "Price", "request-plan": "Request this option button", "booking-submit": "Send booking request button", "plan-description": "Service option description", "hero": "Homepage banner", "header": "Navigation menu", "footer": "Footer", "page": "Page", "home": "Homepage", "product": "Product page", "firstName": "First name field", "lastName": "Last name field", "email": "Email field", "mobilePhone": "Phone field", "phone": "Phone field", "message": "Message field", "planId": "Service option selector", "plans": "Service options", "booking": "Booking form", "contact": "Contact form", "trip": "Trip", "auth": "Sign-in form", "gallery": "Photo gallery", "lightbox": "Photo gallery" };
  if (names[target]) return names[target];
  if (target.startsWith("navigate.")) return `${pageName(target.slice(9))} navigation link`;
  if (/^description[.\d]/.test(target) || target === "description") return "Product description";
  if (target.startsWith("hero-slide")) return "Homepage banner slide";
  if (target.startsWith("plan.")) return "Service option";
  if (target.startsWith("inclusion.")) return "Included service";
  if (/image|photo/.test(target)) return row.imageIndex == null ? "Product photo" : `Photo ${row.imageIndex + 1}`;
  if (/collection/.test(target)) return "Product collection";
  if (/view-all/.test(target)) return "View all button";
  if (/^[a-z]+(?:-[a-z]+)*$/.test(target)) return words(target);
  return names[component] || (component === "hero" ? "Homepage banner" : "Page content");
}
export const interactionLabels: Record<string,string> = { page_enter: "Opened a page", page_engagement: "Spent time on a page", item_view: "Content became visible", item_exposure: "Content stayed visible", click: "Clicked", hover: "Hovered over an item", scroll: "Scrolled", scroll_depth: "Reached a point on the page", modal_open: "Opened a window", modal_close: "Closed a window", image_change: "Changed photo", plan_change: "Changed service option", slide_change: "Banner changed", field_started: "Started filling a field", field_changed: "Changed a field", field_completed: "Finished filling a field", field_validation: "Field needs correction", form_submit: "Sent a form", form_result: "Form result", request_submitted: "Request received", chat_created: "Started a chat", message_sent: "Message sent", cart_result: "Trip updated", auth_result: "Sign-in result", state_change: "Screen changed", content_error: "Content failed to load" };
export function interactionDescription(row: InteractionRecord) {
  const m = row.metadata || {}, target = targetName(row), time = row.durationMs == null ? "" : ` for ${(row.durationMs / 1000).toFixed(1)} seconds`;
  const visible = m.visibleMs == null ? "" : `Page visible for ${(m.visibleMs / 1000).toFixed(1)} seconds`;
  let action: string;
  switch (row.eventType) {
    case "item_view": action = `${target} became visible on screen`; break;
    case "item_exposure": action = `${target} stayed visible${time}`; break;
    case "page_enter": action = "Opened this page"; break;
    case "page_engagement": action = `Active on this page${time}`; break;
    case "click": action = `Clicked ${target}`; break;
    case "hover": action = `Hovered over ${target}${time}`; break;
    case "scroll": action = `Scrolled ${["up", "down", "left", "right"].includes(m.direction) ? m.direction : "through content"}${row.component && row.component !== "page" ? ` in ${target}` : ""}${m.method === "programmatic_or_unknown" ? " (automatic or input unknown)" : ""}`; break;
    case "scroll_depth": action = typeof m.percent === "number" ? `Reached ${m.percent}% of the page` : "Scrolled further down the page"; break;
    case "modal_open": action = `Opened ${target}`; break;
    case "modal_close": action = `Closed ${target}`; break;
    case "image_change": action = row.imageIndex == null ? "Changed the displayed photo" : `Switched to photo ${row.imageIndex + 1}`; break;
    case "slide_change": action = m.method === "auto" ? "Homepage banner advanced automatically" : "Changed the homepage banner slide"; break;
    case "plan_change": action = "Selected a different service option"; break;
    case "field_started": action = `Started filling ${target}`; break;
    case "field_changed": action = `Changed ${target}`; break;
    case "field_completed": action = `Finished filling ${target}`; break;
    case "field_validation": action = `${target} needs correction`; break;
    case "form_submit": action = "Submitted the form; sending in progress"; break;
    case "form_result": action = m.result === "success" ? "Form showed a success confirmation" : m.result === "error" ? "Form showed an error" : "Form result updated"; break;
    case "request_submitted": action = "Request received successfully"; break;
    case "chat_created": action = "Started a live chat"; break;
    case "message_sent": action = "Sent a chat message"; break;
    case "content_error": action = "A photo or video failed to load"; break;
    default: action = interactionLabels[row.eventType || ""] || "Interacted with page content";
  }
  return { action, page: pageName(row.pageUrl), detail: [row.deviceType ? `On ${row.deviceType}` : "", visible, row.eventType === "page_engagement" && typeof m.maxDepth === "number" ? `Reached ${m.maxDepth}% of the page` : ""].filter(Boolean).join(" · ") };
}
