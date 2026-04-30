/* ─── DJAMA Service Worker ─────────────────────────────────────
   - Activate PWA install prompt
   - Handle Web Push notifications (even when app is closed)
   - Network-first strategy
──────────────────────────────────────────────────────────────── */
const CACHE = "djama-v2";
const OFFLINE_URL = "/";

/* ── Install ── */
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((c) => c.add(OFFLINE_URL)).catch(() => {})
  );
  self.skipWaiting();
});

/* ── Activate ── */
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

/* ── Fetch : Network-first ── */
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(OFFLINE_URL))
    );
  }
});

/* ── Push : affiche la notification reçue du serveur ── */
self.addEventListener("push", (event) => {
  if (!event.data) return;

  let data = {};
  try { data = event.data.json(); } catch { data = { title: "DJAMA", body: event.data.text() }; }

  const { title = "DJAMA", body = "", icon = "/icons/icon-192.png",
          badge = "/icons/icon-192.png", url = "/client/planning", tag } = data;

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon,
      badge,
      tag,
      renotify: true,
      data: { url },
      actions: [
        { action: "open",    title: "Ouvrir le planning" },
        { action: "dismiss", title: "Ignorer" },
      ],
    })
  );
});

/* ── Clic sur la notification ── */
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  if (event.action === "dismiss") return;

  const url = event.notification.data?.url ?? "/client/planning";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});
