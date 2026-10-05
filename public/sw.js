// Offline application shell only. Health data stays in IndexedDB, never the cache.
const CACHE = "forge-shell-v1";
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) =>
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches
        .keys()
        .then((keys) =>
          Promise.all(
            keys
              .filter((k) => k.startsWith("forge-shell-") && k !== CACHE)
              .map((k) => caches.delete(k)),
          ),
        ),
    ]),
  ),
);
self.addEventListener("message", (event) => {
  if (event.data?.type === "CACHE_ASSETS") {
    const urls = event.data.urls.filter(
      (u) => new URL(u).origin === self.location.origin,
    );
    event.waitUntil(
      caches
        .open(CACHE)
        .then((c) => Promise.all(urls.map((u) => c.add(u).catch(() => {})))),
    );
  }
});
self.addEventListener("fetch", (event) => {
  const req = event.request,
    url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== self.location.origin) return;
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put("/", copy));
          }
          return res;
        })
        .catch(() => caches.match("/")),
    );
    return;
  }
  if (/\.(js|css|png|svg|woff2?)$/.test(url.pathname))
    event.respondWith(
      caches.match(req).then(
        (cached) =>
          cached ||
          fetch(req).then((res) => {
            if (res.ok) {
              const copy = res.clone();
              caches.open(CACHE).then((c) => c.put(req, copy));
            }
            return res;
          }),
      ),
    );
});
