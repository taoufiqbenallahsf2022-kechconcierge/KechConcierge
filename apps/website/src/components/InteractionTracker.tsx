"use client";
import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";
import { flushInteractions, interactionPage, interactionPath, trackInteraction, type InteractionDetails } from "@/lib/interactions";

const actionSelector = "[data-track-target],button,a[href],[role=button]";
function attributes(element: Element): InteractionDetails {
  const holder = element.closest("[data-track-component]");
  const product = element.closest("[data-product-id]");
  const plan = element.closest("[data-plan-id]");
  const target = element.getAttribute("data-track-target") || element.getAttribute("data-track-view") || element.getAttribute("data-track-scroll");
  const siblings = holder ? Array.from(holder.querySelectorAll(actionSelector)) : [];
  return {
    component: holder?.getAttribute("data-track-component") || "page",
    target: target || `${element.tagName.toLowerCase()}.${Math.max(0, siblings.indexOf(element))}`,
    productId: product?.getAttribute("data-product-id") || undefined,
    productType: product?.getAttribute("data-product-type") || undefined,
    planId: plan?.getAttribute("data-plan-id") || undefined,
    imageIndex: element.hasAttribute("data-image-index") ? Number(element.getAttribute("data-image-index")) : undefined,
  };
}

export function InteractionTracker() {
  const pathname = usePathname(), query = useSearchParams().toString();
  const ready = useAuthStore(state => state.hasRestoredAuth);
  useEffect(() => {
    if (!ready) return;
    if (typeof IntersectionObserver === "undefined" || typeof MutationObserver === "undefined") return;
    let context: ReturnType<typeof interactionPage>;
    try { context = interactionPage(); } catch { return; }
    let lastAction = performance.now(), lastTick = lastAction, activeMs = 0, visibleMs = 0, maxDepth = 0;
    let keyboard = false, closed = false, lastPointer = "unknown";
    let lastScrollGesture = -Infinity;
    const overlays = new Map<Element, InteractionDetails>();
    const states = new WeakMap<Element, string>();
    const milestones = new Set<number>();
    const fieldStarted = new WeakSet<Element>(), fieldCompleted = new WeakSet<Element>();
    const exposures = new Map<Element, { intersecting: boolean; start: number | null; duration: number; qualified: boolean; details: InteractionDetails }>();
    const hovers = new Map<Element, number>();
    const scrolls = new Map<Element, { x: number; y: number; timer?: number; fromX: number; fromY: number }>();
    const emit = (type: string, details: InteractionDetails = {}) => trackInteraction(type, details, context);
    emit("page_enter", { component: "page", target: context.pageType, metadata: { scrollable: document.documentElement.scrollHeight > innerHeight } });

    function eligible(el: Element) {
      if (document.hidden || !el.isConnected || el.closest("[data-track-ignore],[aria-hidden=true]")) return false;
      const visibleOverlays = Array.from(document.querySelectorAll("[data-track-overlay]")).filter(item => item.getClientRects().length && getComputedStyle(item).visibility !== "hidden");
      const top = visibleOverlays.sort((a, b) => (Number(getComputedStyle(a).zIndex) || 0) - (Number(getComputedStyle(b).zIndex) || 0)).pop();
      if (top && !top.contains(el)) return false;
      if (el.hasAttribute("data-image-index")) {
        const image = el.querySelector("img");
        if (image && (!image.complete || image.naturalWidth === 0)) return false;
      }
      let parent: Element | null = el;
      while (parent && parent !== document.body) {
        const style = getComputedStyle(parent);
        if (style.display === "none" || style.visibility === "hidden" || style.opacity === "0") return false;
        parent = parent.parentElement;
      }
      return true;
    }
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        const state = exposures.get(entry.target);
        if (state) state.intersecting = entry.isIntersecting && entry.intersectionRect.height >= Math.min(entry.boundingClientRect.height * 0.5, innerHeight * 0.5) && entry.intersectionRect.width >= Math.min(entry.boundingClientRect.width * 0.5, innerWidth * 0.5);
      }
    }, { threshold: [0, 0.05, 0.1, 0.25, 0.5, 0.75, 1] });
    function scan() {
      for (const root of [document.documentElement, ...Array.from(document.querySelectorAll<HTMLElement>("[data-track-scroll]"))]) {
        if (!scrolls.has(root)) scrolls.set(root, { x: root.scrollLeft, y: root === document.documentElement ? window.scrollY : root.scrollTop, fromX: root.scrollLeft, fromY: root.scrollTop });
      }
      const present = new Set(Array.from(document.querySelectorAll("[data-track-overlay]")).filter(el => el.getClientRects().length));
      for (const el of present) if (!overlays.has(el)) { const details = attributes(el); overlays.set(el, details); hovers.clear(); emit("modal_open", details); }
      for (const [el, details] of overlays) if (!present.has(el)) { emit("modal_close", details); overlays.delete(el); }
      for (const el of document.querySelectorAll("[data-track-state]")) {
        const value = el.getAttribute("data-track-state") || "", previous = states.get(el); states.set(el, value);
        if (previous === value || previous === undefined) continue;
        const kind = el.getAttribute("data-track-state-name");
        emit(kind === "image" ? "image_change" : kind === "plan" ? "plan_change" : kind === "slide" ? "slide_change" : "state_change", { ...attributes(el), metadata: { status: value, method: el.getAttribute("data-track-method") || "state" } });
        if (el.hasAttribute("data-track-form") && ["loading", "success", "error"].includes(value)) emit(value === "loading" ? "form_submit" : "form_result", { ...attributes(el), metadata: { result: value, form: el.getAttribute("data-track-form")! } });
      }
      for (const el of document.querySelectorAll("[data-track-view]")) {
        const details = attributes(el), previous = exposures.get(el);
        if (previous && (previous.details.imageIndex !== details.imageIndex || previous.details.productId !== details.productId || previous.details.planId !== details.planId)) {
          finishExposure(el, previous); previous.qualified = false; previous.details = details;
        }
        if (!previous) { exposures.set(el, { intersecting: false, start: null, duration: 0, qualified: false, details }); observer.observe(el); }
      }
      for (const [el, state] of exposures) if (!el.isConnected) { finishExposure(el, state); exposures.delete(el); observer.unobserve(el); }
    }
    function finishExposure(el: Element, state: { duration: number; qualified: boolean; start: number | null; details: InteractionDetails }) {
      const now = performance.now();
      if (state.start !== null) { state.duration += now - state.start; state.start = null; }
      if (state.qualified && state.duration > 0) emit("item_exposure", { ...state.details, durationMs: Math.round(state.duration) });
      state.duration = 0;
    }
    function tick() {
      const now = performance.now(), elapsed = Math.min(now - lastTick, 2000); lastTick = now;
      if (!document.hidden) { visibleMs += elapsed; if (now - lastAction < 30000) activeMs += elapsed; }
      for (const [el, state] of exposures) {
        const visible = state.intersecting && eligible(el);
        if (visible && state.start === null) state.start = now;
        if (!visible && state.start !== null) finishExposure(el, state);
        if (visible && !state.qualified && state.start !== null && now - state.start >= 1000) {
          state.qualified = true;
          emit("item_view", state.details);
        }
      }
    }
    function activity() { lastAction = performance.now(); }
    function click(event: MouseEvent) {
      if (!event.isTrusted || !(event.target instanceof Element)) return;
      activity();
      const el = event.target.closest(actionSelector);
      if (!el || el.closest("[data-track-ignore]")) return;
      const link = el.closest("a[href]") as HTMLAnchorElement | null;
      let destination: string | undefined;
      if (link) destination = /^mailto:/i.test(link.href) ? "email" : /^tel:/i.test(link.href) ? "phone" : /wa\.me\//.test(link.href) ? "whatsapp" : interactionPath(link.href);
      emit("click", { ...attributes(el), inputType: event.detail === 0 || keyboard ? "keyboard" : lastPointer, metadata: destination ? { destination } : {} });
    }
    function over(event: PointerEvent) {
      if (event.pointerType !== "mouse" || !(event.target instanceof Element)) return;
      const el = event.target.closest(actionSelector + ",[data-track-hover]");
      if (el && eligible(el) && !el.contains(event.relatedTarget as Node | null) && !hovers.has(el)) hovers.set(el, performance.now());
    }
    function out(event: PointerEvent) {
      if (!(event.target instanceof Element)) return;
      const el = event.target.closest(actionSelector + ",[data-track-hover]");
      if (!el || el.contains(event.relatedTarget as Node | null)) return;
      const start = hovers.get(el); hovers.delete(el);
      if (start !== undefined && performance.now() - start >= 500) emit("hover", { ...attributes(el), inputType: "mouse", durationMs: Math.round(performance.now() - start) });
    }
    function field(event: Event) {
      const el = event.target;
      if (!(el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement)) return;
      if (el.type === "password" || el.type === "hidden" || el.closest("[data-track-ignore]")) return;
      const form = el.closest("[data-track-form]"); if (!form) return;
      const name = el.getAttribute("data-track-field") || el.name || `${el.tagName.toLowerCase()}.${Array.from(form.querySelectorAll("input,select,textarea")).indexOf(el)}`;
      const details = { ...attributes(form), target: name, metadata: { form: form.getAttribute("data-track-form")! } };
      if (!fieldStarted.has(el)) { fieldStarted.add(el); emit("field_started", details); }
      if (event.type === "change") {
        emit("field_changed", details);
        if (el instanceof HTMLSelectElement && el.getAttribute("data-track-field") === "planId")
          emit("plan_change", { ...attributes(form), planId: el.value || undefined, metadata: { method: "selection" } });
      }
      if (event.type === "change" && !fieldCompleted.has(el) && el.value.trim() !== "") { fieldCompleted.add(el); emit("field_completed", details); }
      if (event.type === "invalid") emit("field_validation", { ...details, metadata: { ...details.metadata, reason: "browser_validation" } });
    }
    function scroll(event: Event) {
      const root = event.target === document ? document.documentElement : event.target;
      if (!(root instanceof HTMLElement)) return;
      if (root !== document.documentElement && !root.hasAttribute("data-track-scroll")) return;
      const x = root.scrollLeft, y = root === document.documentElement ? window.scrollY : root.scrollTop;
      let state = scrolls.get(root);
      if (!state) { state = { x: 0, y: 0, fromX: 0, fromY: 0 }; scrolls.set(root, state); }
      if (!state.timer) { state.fromX = state.x; state.fromY = state.y; }
      state.x = x; state.y = y; window.clearTimeout(state.timer);
      state.timer = window.setTimeout(() => {
        if (!state) return; state.timer = undefined;
        const horizontal = Math.abs(state.x - state.fromX) > Math.abs(state.y - state.fromY);
        const visibleTargets = [...exposures.entries()].filter(([el, item]) => item.intersecting && eligible(el) && root.contains(el)).map(([el]) => attributes(el).target!).slice(0, 20);
        emit("scroll", { ...attributes(root), inputType: keyboard ? "keyboard" : lastPointer, metadata: { method: performance.now() - lastScrollGesture < 1500 ? "user_input" : "programmatic_or_unknown", axis: horizontal ? "horizontal" : "vertical", direction: horizontal ? state.x >= state.fromX ? "right" : "left" : state.y >= state.fromY ? "down" : "up", from: Math.round(horizontal ? state.fromX : state.fromY), to: Math.round(horizontal ? state.x : state.y), visibleTargets } });
      }, 250);
      if (root === document.documentElement && root.scrollHeight > innerHeight) {
        maxDepth = Math.max(maxDepth, Math.round(100 * (y + innerHeight) / root.scrollHeight));
        for (const percent of [25, 50, 75, 90, 100]) if (maxDepth >= percent && !milestones.has(percent)) { milestones.add(percent); emit("scroll_depth", { target: "page", metadata: { percent } }); }
      }
    }
    function summary() {
      tick();
      if (visibleMs > 0) emit("page_engagement", { component: "page", target: context.pageType, durationMs: Math.round(activeMs), metadata: { visibleMs: Math.round(visibleMs), maxDepth } });
      activeMs = 0; visibleMs = 0;
    }
    function visibility() {
      if (document.hidden) { hovers.clear(); summary(); for (const [el, state] of exposures) finishExposure(el, state); void flushInteractions(); }
      else lastTick = performance.now();
    }
    function key(event: KeyboardEvent) { keyboard = true; if (["ArrowDown", "ArrowUp", "ArrowLeft", "ArrowRight", "PageDown", "PageUp", "Home", "End", " "].includes(event.key)) lastScrollGesture = performance.now(); activity(); }
    function pointer(event: PointerEvent) { keyboard = false; lastPointer = event.pointerType || "unknown"; activity(); }
    function scrollGesture() { lastScrollGesture = performance.now(); activity(); }
    function contentError(event: Event) { if (event.target instanceof HTMLImageElement || event.target instanceof HTMLVideoElement) emit("content_error", { ...attributes(event.target), metadata: { reason: "media_load_failed" } }); }
    scan();
    let frame = 0;
    const mutations = new MutationObserver(() => { if (!frame) frame = requestAnimationFrame(() => { frame = 0; scan(); }); }); mutations.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["data-track-state", "class", "style", "aria-hidden"] });
    document.addEventListener("click", click, true); document.addEventListener("pointerover", over, true); document.addEventListener("pointerout", out, true);
    document.addEventListener("pointerdown", pointer, true); document.addEventListener("keydown", key, true); document.addEventListener("scroll", scroll, { capture: true, passive: true });
    for (const type of ["focusin", "change", "invalid"]) document.addEventListener(type, field, true);
    document.addEventListener("visibilitychange", visibility);
    document.addEventListener("wheel", scrollGesture, { passive: true }); document.addEventListener("touchmove", scrollGesture, { passive: true });
    window.addEventListener("error", contentError, true);
    const timer = window.setInterval(tick, 500), summaryTimer = window.setInterval(() => { summary(); void flushInteractions(); }, 10000);
    return () => {
      if (closed) return; closed = true;
      if (performance.now() - context.started >= 100) summary(); for (const [el, state] of exposures) finishExposure(el, state);
      for (const state of scrolls.values()) window.clearTimeout(state.timer);
      for (const details of overlays.values()) emit("modal_close", details);
      observer.disconnect(); mutations.disconnect(); cancelAnimationFrame(frame); window.clearInterval(timer); window.clearInterval(summaryTimer);
      document.removeEventListener("click", click, true); document.removeEventListener("pointerover", over, true); document.removeEventListener("pointerout", out, true);
      document.removeEventListener("pointerdown", pointer, true); document.removeEventListener("keydown", key, true); document.removeEventListener("scroll", scroll, true);
      for (const type of ["focusin", "change", "invalid"]) document.removeEventListener(type, field, true);
      document.removeEventListener("visibilitychange", visibility); if (performance.now() - context.started >= 100) emit("page_leave", { component: "page", target: context.pageType }); void flushInteractions();
      window.removeEventListener("error", contentError, true);
      document.removeEventListener("wheel", scrollGesture); document.removeEventListener("touchmove", scrollGesture);
    };
  }, [pathname, query, ready]);
  return null;
}
