// Erzeugt vorläufige App-Symbole (Katzenkopf auf orangem Grund) ohne Zusatzpakete.
// Wird später durch das Logo nach Kitos Foto ersetzt.  Aufruf: node werkzeuge/erzeuge-icons.js
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const HINTERGRUND = [0xc8, 0x64, 0x2d];
const KOPF = [0xff, 0xf6, 0xee];
const UNTERPUNKTE = 4; // Kantenglättung: 4×4 Messpunkte pro Pixel

// Liegt der Punkt (x, y), beide 0..1, im Katzenkopf? Alles bleibt in der sicheren Mitte (maskable).
function imKopf(x, y) {
  const dx = x - 0.5;
  const dy = y - 0.56;
  if (dx * dx + dy * dy <= 0.2 * 0.2) return true;
  return imDreieck(x, y, [0.32, 0.47], [0.34, 0.24], [0.48, 0.38]) ||
         imDreieck(x, y, [0.68, 0.47], [0.66, 0.24], [0.52, 0.38]);
}

function imDreieck(x, y, a, b, c) {
  const seite = (p, q) => (x - q[0]) * (p[1] - q[1]) - (p[0] - q[0]) * (y - q[1]);
  const s1 = seite(a, b), s2 = seite(b, c), s3 = seite(c, a);
  const negativ = s1 < 0 || s2 < 0 || s3 < 0;
  const positiv = s1 > 0 || s2 > 0 || s3 > 0;
  return !(negativ && positiv);
}

function zeichne(groesse) {
  const zeilen = [];
  for (let py = 0; py < groesse; py++) {
    const zeile = Buffer.alloc(1 + groesse * 3); // erstes Byte: PNG-Filter "keiner"
    for (let px = 0; px < groesse; px++) {
      let treffer = 0;
      for (let uy = 0; uy < UNTERPUNKTE; uy++) {
        for (let ux = 0; ux < UNTERPUNKTE; ux++) {
          const x = (px + (ux + 0.5) / UNTERPUNKTE) / groesse;
          const y = (py + (uy + 0.5) / UNTERPUNKTE) / groesse;
          if (imKopf(x, y)) treffer++;
        }
      }
      const anteil = treffer / (UNTERPUNKTE * UNTERPUNKTE);
      for (let k = 0; k < 3; k++) {
        zeile[1 + px * 3 + k] = Math.round(HINTERGRUND[k] * (1 - anteil) + KOPF[k] * anteil);
      }
    }
    zeilen.push(zeile);
  }
  return png(groesse, Buffer.concat(zeilen));
}

function png(groesse, rohdaten) {
  const kopf = Buffer.alloc(13);
  kopf.writeUInt32BE(groesse, 0);
  kopf.writeUInt32BE(groesse, 4);
  kopf[8] = 8; // 8 Bit pro Farbkanal
  kopf[9] = 2; // RGB
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    block("IHDR", kopf),
    block("IDAT", zlib.deflateSync(rohdaten)),
    block("IEND", Buffer.alloc(0)),
  ]);
}

function block(typ, daten) {
  const laenge = Buffer.alloc(4);
  laenge.writeUInt32BE(daten.length);
  const typUndDaten = Buffer.concat([Buffer.from(typ, "ascii"), daten]);
  const pruefsumme = Buffer.alloc(4);
  pruefsumme.writeUInt32BE(crc32(typUndDaten));
  return Buffer.concat([laenge, typUndDaten, pruefsumme]);
}

function crc32(daten) {
  let crc = 0xffffffff;
  for (const byte of daten) {
    crc ^= byte;
    for (let i = 0; i < 8; i++) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ 0xffffffff) >>> 0;
}

const ziel = path.join(import.meta.dirname, "..", "icons");
fs.mkdirSync(ziel, { recursive: true });
for (const groesse of [192, 512]) {
  fs.writeFileSync(path.join(ziel, `icon-${groesse}.png`), zeichne(groesse));
  console.log(`icons/icon-${groesse}.png erstellt`);
}
