self.addEventListener("push", (event) => {
  let payload = {};
  try { payload = event.data ? event.data.json() : {}; }
  catch { payload = { body: event.data ? event.data.text() : "A visitor sent a message." }; }
  event.waitUntil(self.registration.showNotification(payload.title || "New website chat message", {
    body: payload.body || "A visitor sent a message.", tag: payload.tag || "website-chat", renotify: true,
    data: { url: payload.url || "/entities/chats" },
  }));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const destination = new URL(event.notification.data?.url || "/entities/chats", self.location.origin).href;
  event.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(async (clients) => {
    for (const client of clients) { if ("navigate" in client) await client.navigate(destination); return client.focus(); }
    return self.clients.openWindow(destination);
  }));
});
