/* ─── DJAMA Service Worker ─────────────────────────────────
   Stratégie : Network-first.
   Objectif  : activer l'installation PWA + fallback offline.
──────────────────────────────────────────────────────────── */
const CACHE = "djama-v1";
const OFFLINE_URL = "/";

/* ── Install : met la page d'accueil en cache ── */
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.add(OFFLINE_URL)).catch(() => {})
  );
  self.skipWaiting();
});

/* ── Activate : nettoie les anciens caches ── */
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

/* ── Fetch : Network-first, fallback cache pour la navigation ── */
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(OFFLINE_URL))
    );
  }
});
