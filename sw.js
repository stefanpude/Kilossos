// Speichert die App-Dateien auf dem Gerät, damit Kilossos auch ohne Internet startet.
// Bei jeder Änderung an den Dateien CACHE_NAME hochzählen.
const CACHE_NAME = "kilossos-v4";
const DATEIEN = [
  "./",
  "index.html",
  "styles.css",
  "app.js",
  "js/daten.js",
  "js/rechnen.js",
  "manifest.webmanifest",
  "icons/icon-192.png",
  "icons/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(DATEIEN.map((datei) => new Request(datei, { cache: "no-cache" }))))
  );
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
// "no-cache" umgeht die bis zu 10 Minuten alte Zwischenkopie des Browsers, sonst passen nach einem
// Update alte und neue Dateien nicht zusammen. Unveränderte Dateien kosten dabei nur eine kurze Rückfrage.
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    fetch(event.request, { cache: "no-cache" })
      .then((antwort) => {
        const kopie = antwort.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, kopie));
        return antwort;
      })
      .catch(() => caches.match(event.request).then((treffer) => treffer || caches.match("index.html")))
  );
});
