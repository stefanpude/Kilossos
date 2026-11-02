// Kleiner Testserver ohne Zusatzpakete: node server.js  →  http://localhost:8080
// Ein anderer Port geht über die Umgebungsvariable PORT (z. B. wenn 8080 schon belegt ist).
import http from "node:http";
import fs from "node:fs";
import path from "node:path";

const PORT = Number(process.env.PORT) || 8080;
const WURZEL = import.meta.dirname;
const TYPEN = {
  ".json": "application/json; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".webmanifest": "application/manifest+json",
  ".png": "image/png",
  ".svg": "image/svg+xml",
};

http
  .createServer((anfrage, antwort) => {
    const pfad = decodeURIComponent(new URL(anfrage.url, "http://localhost").pathname);
    const datei = path.join(WURZEL, pfad === "/" ? "index.html" : pfad);
    if (!datei.startsWith(WURZEL)) {
      antwort.writeHead(403).end();
      return;
    }
    fs.readFile(datei, (fehler, inhalt) => {
      if (fehler) {
        antwort.writeHead(404).end("Nicht gefunden");
        return;
      }
      antwort.writeHead(200, { "Content-Type": TYPEN[path.extname(datei)] || "application/octet-stream" });
      antwort.end(inhalt);
    });
  })
  .listen(PORT, () => console.log(`Kilossos läuft auf http://localhost:${PORT}`));
