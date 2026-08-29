import { useEffect, useState } from "react";
import { API_BASE_URL } from "../store/api";

type PushState = "checking" | "unsupported" | "blocked" | "available" | "subscribed" | "loading" | "error";

function applicationServerKey(value: string) {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replaceAll("-", "+").replaceAll("_", "/");
  return Uint8Array.from(atob(base64), (character) => character.charCodeAt(0));
}

async function saveSubscription(subscription: PushSubscription) {
  const response = await fetch(`${API_BASE_URL}/push-notifications/subscriptions`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(subscription.toJSON()),
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.message ?? "Could not enable notifications");
  }
}

export function PushNotificationControl() {
  const [state, setState] = useState<PushState>("checking");

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
      setState("unsupported");
      return;
    }
    if (Notification.permission === "denied") {
      setState("blocked");
      return;
    }
    void navigator.serviceWorker.register(`${import.meta.env.BASE_URL}admin-sw.js`).then(async (registration) => {
      const existing = await registration.pushManager.getSubscription();
      if (!existing) return setState("available");
      await saveSubscription(existing);
      setState("subscribed");
    }).catch(() => setState("error"));
  }, []);

  async function enable() {
    setState("loading");
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setState(permission === "denied" ? "blocked" : "available");
        return;
      }
      const keyResponse = await fetch(`${API_BASE_URL}/push-notifications/vapid-public-key`, { credentials: "include" });
      const keyPayload = await keyResponse.json();
      if (!keyResponse.ok) throw new Error(keyPayload.message ?? "Push notifications are not configured");
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey(keyPayload.publicKey),
      });
      await saveSubscription(subscription);
      setState("subscribed");
    } catch (error) {
      console.error(error);
      setState("error");
    }
  }

  if (state === "checking" || state === "unsupported") return null;
  const label = state === "subscribed" ? "Notifications on" : state === "blocked" ? "Notifications blocked" : state === "error" ? "Try notifications again" : "Enable notifications";
  return <button type="button" className={`push-control ${state === "subscribed" ? "is-on" : ""}`} onClick={state === "subscribed" || state === "blocked" || state === "loading" ? undefined : () => void enable()} title={state === "blocked" ? "Allow notifications for this site in your browser settings" : label} disabled={state === "loading"}>
    <span aria-hidden="true">{state === "subscribed" ? "●" : "◌"}</span>{state === "loading" ? "Enabling…" : label}
  </button>;
}
