// 0.90.3 (Stefan, 11.11.2026): „Wie Kilossos entstanden ist“ neu als zwei kleine Porträts (Entwurf B),
// je mit Foto. Fakten von Stefan: Kito 9,32 kg (Praxis), Zuki 8,35 kg; der Name ohne englisch „loss“.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const lies = (datei) => fs.readFileSync(new URL("../" + datei, import.meta.url), "utf8");
const html = lies("index.html");
const start = html.indexOf('<dialog id="dialog-geschichte">');
const blatt = html.slice(start, html.indexOf("</dialog>", start));

test("0.90.3: Geschichte mit zwei Porträts, Begründung und Name, in dieser Reihenfolge", () => {
  assert.ok(start > 0, "Blatt vorhanden");
  const stellen = ["<h3>Kito, der Koloss</h3>", "<h3>Zuki, die Aussitzerin</h3>", "<h3>Warum eine App?</h3>",
    "<h3>Und der Name?</h3>", "Stefan, mit Kito und Zuki"].map((s) => blatt.indexOf(s));
  stellen.forEach((s, i) => assert.ok(s > 0, "Stelle " + i));
  assert.deepEqual([...stellen].sort((a, b) => a - b), stellen);
  assert.match(blatt, /Kilossos ist aus eigener Not entstanden\. Genauer gesagt aus zwei Nöten, und die heißen Kito und Zuki\./);
  assert.match(blatt, /„Alter Schwede, ist das ein Koloss!“/);
  assert.match(blatt, /Ich bin Katzenhalter wie du, kein Tierarzt\./);
  assert.match(blatt, /Eigene Futtermengen schlägt die App nie vor\./);
});

test("0.90.3: Zahlen mit geschütztem Leerzeichen, ohne „knapp“, Name ohne „loss“", () => {
  assert.match(blatt, /9,32&nbsp;kg/);
  assert.match(blatt, /8,35&nbsp;kg/);
  assert.doesNotMatch(blatt, /knapp/);
  assert.doesNotMatch(blatt, /\bloss\b|Verlust/i);
  assert.match(blatt, /<strong>Ki<\/strong>to \+ <strong>Kolossos<\/strong>, altgriechisch für „riesig“\. Kilossos eben\./);
});

test("0.90.3: Je ein Foto unter dem Porträt, mit Alternativtext und fester Größe", () => {
  const kito = blatt.indexOf('src="bilder/kito.webp"');
  const zuki = blatt.indexOf('src="bilder/zuki.webp"');
  assert.ok(blatt.indexOf("Kito, der Koloss") < kito && kito < blatt.indexOf("Zuki, die Aussitzerin"), "Kito-Foto im Kito-Teil");
  assert.ok(blatt.indexOf("Zuki, die Aussitzerin") < zuki && zuki < blatt.indexOf("Warum eine App?"), "Zuki-Foto im Zuki-Teil");
  for (const img of blatt.match(/<img [^>]*>/g)) {
    assert.match(img, /class="geschichte-foto"/);
    assert.match(img, /alt="[^"]{10,}"/);
    assert.match(img, /width="1200" height="900"/);
  }
  assert.equal(blatt.match(/<img /g).length, 2);
});

test("0.90.3: Fotos liegen bei, sind klein, ohne Metadaten und offline gespeichert", () => {
  const sw = lies("sw.js");
  for (const datei of ["bilder/kito.webp", "bilder/zuki.webp"]) {
    const daten = fs.readFileSync(new URL("../" + datei, import.meta.url));
    assert.equal(daten.subarray(0, 4).toString(), "RIFF");
    assert.equal(daten.subarray(8, 12).toString(), "WEBP");
    assert.ok(daten.length < 150 * 1024, datei + " unter 150 KB");
    assert.ok(!daten.includes("EXIF") && !daten.includes("XMP "), datei + " ohne EXIF/XMP (kein Aufnahmeort)");
    assert.ok(sw.includes(`"${datei}",`), datei + " in sw.js");
  }
});
