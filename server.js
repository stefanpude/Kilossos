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
  ".woff2": "font/woff2",
};

http
  .createServer((anfrage, antwort) => {
    let pfad;
    try {
      pfad = decodeURIComponent(new URL(anfrage.url, "http://localhost").pathname);
    } catch {
      antwort.writeHead(400).end();
      return;
    }
    const datei = path.resolve(WURZEL, "." + path.sep + (pfad === "/" ? "index.html" : pfad));
    // Nur Dateien im Projektordner, keine Punkt-Ordner wie .git oder .claude (seit 0.77.0, Prüfer C). Vorher reichte
    // ein gleicher Namensanfang („Kilossos-Social“ beginnt mit „Kilossos“), um Nachbarordner auf dem Desktop zu lesen.
    const relativ = path.relative(WURZEL, datei);
    const teile = relativ.split(path.sep);
    if (!relativ || path.isAbsolute(relativ) || teile[0] === ".." || teile.some((t) => t.startsWith("."))) {
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
  // Nur auf diesem Rechner erreichbar, nicht im WLAN (seit 0.77.0).
  .listen(PORT, "127.0.0.1", () => console.log(`Kilossos läuft auf http://localhost:${PORT}`));
