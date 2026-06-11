const CACHE_NAME = "vitality-fitness-v30";
const APP_SHELL = [
  "./",
  "./index.html",
  "./styles.css?v=30",
  "./supabase-config.js?v=20",
  "./script.js?v=30",
  "./manifest.webmanifest",
  "./assets/profile-avatar-girl.png",
  "./assets/weight-green-ip.png",
  "./assets/banner-dumbbell.jpg",
  "./assets/banner-kettlebell.jpg",
  "./assets/banner-press.jpg",
  "./assets/banner-boxing.jpg",
  "./assets/intensity-easy.jpg",
  "./assets/intensity-good.jpg",
  "./assets/intensity-tired.jpg",
  "./assets/intensity-exhausted.jpg",
  "./assets/fitness-ip-quote.png",
  "./assets/profile-yellow-ip.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
      .then(() => self.clients.matchAll({ type: "window" }))
      .then((clients) => Promise.all(clients.map((client) => client.navigate(client.url).catch(() => null))))
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const requestUrl = new URL(event.request.url);
  if (requestUrl.hostname.endsWith(".supabase.co")) return;
  const sameOrigin = requestUrl.origin === self.location.origin;
  const shouldPreferNetwork = sameOrigin && (
    event.request.mode === "navigate"
    || ["document", "script", "style"].includes(event.request.destination)
  );

  if (shouldPreferNetwork) {
    event.respondWith(
      fetch(event.request, { cache: "no-store" })
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return response;
        })
        .catch(() => caches.match(event.request).then((cached) => cached || caches.match("./index.html")))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const network = fetch(event.request)
        .then((response) => {
          if (response.ok && sameOrigin) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return response;
        })
        .catch(() => cached || caches.match("./index.html"));

      return cached || network;
    })
  );
});
