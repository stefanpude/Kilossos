// Speichert die App-Dateien auf dem Gerät, damit Kilossos auch ohne Internet startet.
// Bei jeder Änderung an den Dateien CACHE_NAME hochzählen.
const CACHE_NAME = "kilossos-v1";
const DATEIEN = [
  "./",
  "index.html",
  "styles.css",
  "app.js",
  "manifest.webmanifest",
  "icons/icon-192.png",
  "icons/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(DATEIEN)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((namen) =>
      Promise.all(namen.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name)))
    )
  );
  self.clients.claim();
});

// Erst das Netz fragen (damit Updates sofort ankommen), ohne Netz die gespeicherte Fassung nehmen.
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    fetch(event.request)
      .then((antwort) => {
        const kopie = antwort.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, kopie));
        return antwort;
      })
      .catch(() => caches.match(event.request).then((treffer) => treffer || caches.match("index.html")))
  );
});
