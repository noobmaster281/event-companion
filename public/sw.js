const CACHE = "event-companion-v1";
const OFFLINE_URL = "/offline";

const PRECACHE = [
  OFFLINE_URL,
  "/feed",
  "/events",
  "/profile",
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(PRECACHE))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  const { request } = e;
  const url = new URL(request.url);

  // Let API calls, Supabase, and non-GET requests go straight to network
  if (
    request.method !== "GET" ||
    url.pathname.startsWith("/api/") ||
    url.hostname.includes("supabase")
  ) {
    return;
  }

  // Network-first: try live, fall back to cache, then offline page
  e.respondWith(
    fetch(request)
      .then((res) => {
        const clone = res.clone();
        caches.open(CACHE).then((c) => c.put(request, clone));
        return res;
      })
      .catch(async () => {
        const cached = await caches.match(request);
        return cached ?? caches.match(OFFLINE_URL);
      })
  );
});
