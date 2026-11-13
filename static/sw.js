/* Service worker: gemmer appens filer, så den kan åbnes uden net. Netværk først, så opdateringer slår igennem.
   Stierne er relative, så det virker både lokalt (/) og på GitHub Pages (/mikkels-app/). */
const CACHE = "mikkels-app-v5";
const FILES = ["./", "style.css", "icons.js", "charts.js", "static-mode.js", "quiz-data.js", "explore-data.js", "explore-extra.js",
  "app.js", "lessons.js", "lessons-doa.js", "lessons-sys.js", "explore.js", "gamify.js", "profile.js", "offline.js", "sync.js",
  "manifest.json", "icon-192.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== location.origin || url.pathname.includes("/api/")) return;
  e.respondWith(fetch(e.request).then((r) => {
    if (r.ok) { const copy = r.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)); }
    return r;
  }).catch(() => caches.match(e.request).then((r) => r || caches.match("./"))));
});
