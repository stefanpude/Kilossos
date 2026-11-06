import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { abendHinweis, ABEND_STUNDE } from "../js/rechnen.js";
import { hinweisKnopf } from "../js/wissen.js";

// Ruhiger Hinweis am Abend (0.50.0, .planning/erinnerung-abends.md Teil 1): Kito hat schon Einträge von früheren Tagen,
// heute ist um 19 Uhr noch nichts eingetragen.
const basis = {
  name: "Kito",
  tag: "2026-11-06",
  heute: "2026-11-06",
  stunde: 19,
  mahlzeitenHeute: 0,
  fruehereMahlzeiten: true,
  futterVerweigert: false,
};

test("abendHinweis: ab 19 Uhr ohne Mahlzeit heute ein ruhiger Hinweis", () => {
  assert.equal(ABEND_STUNDE, 19);
  const h = abendHinweis(basis);
  assert.equal(h.art, "hinweis");
  assert.equal(h.id, "abend-nichts-eingetragen");
  assert.match(h.text, /^Für Kito ist heute noch keine Mahlzeit eingetragen\./);
  assert.match(h.text, /Schon gefüttert\? Dann trag es jetzt ein/);
});

test("abendHinweis: um 18:59 (Stunde 18) noch nicht", () => {
  assert.equal(abendHinweis({ ...basis, stunde: 18 }), null);
  assert.equal(abendHinweis({ ...basis, stunde: 0 }), null);
});

test("abendHinweis: bis Mitternacht (Stunde 23) weiter sichtbar", () => {
  assert.ok(abendHinweis({ ...basis, stunde: 23 }));
});

test("abendHinweis: mit einer Mahlzeit heute nicht", () => {
  assert.equal(abendHinweis({ ...basis, mahlzeitenHeute: 1 }), null);
});

test("abendHinweis: nicht am ersten Tag der Nutzung", () => {
  assert.equal(abendHinweis({ ...basis, fruehereMahlzeiten: false }), null);
});

test("abendHinweis: nur auf dem heutigen Tag, nicht beim Zurückblättern", () => {
  assert.equal(abendHinweis({ ...basis, tag: "2026-11-05" }), null);
});

test("abendHinweis: nicht, wenn heute „Futter verweigert“ eingetragen ist (dann zeigt der rote Kasten den Notfall)", () => {
  assert.equal(abendHinweis({ ...basis, futterVerweigert: true }), null);
});

test("abendHinweis: keine Gesundheitsaussage und keine Futtermenge im Text", () => {
  const { text } = abendHinweis(basis);
  assert.doesNotMatch(text, /Tierarzt|Fettleber|Gefahr|kcal|\d+\s*g\b/);
});

test("abendHinweis: Knopf „Mahlzeit eintragen“ öffnet das Eintragen", () => {
  const knopf = hinweisKnopf("abend-nichts-eingetragen");
  assert.match(knopf, /data-aktion="mahlzeit-neu"/);
  assert.match(knopf, />Mahlzeit eintragen</);
});

test("app.js: Abend-Hinweis hat einen Kurztitel und wird beim Zurückholen der App nachgezeichnet", () => {
  const app = readFileSync(new URL("../app.js", import.meta.url), "utf8");
  assert.match(app, /"abend-nichts-eingetragen": "Heute noch nichts eingetragen"/);
  assert.match(app, /abendHinweis\(/);
  // visibilitychange zeichnet auch neu, wenn seit dem letzten Zeichnen 19 Uhr überschritten wurde.
  const handler = app.slice(app.indexOf('addEventListener("visibilitychange"'), app.indexOf("zeichneAlles();", app.indexOf('addEventListener("visibilitychange"')));
  assert.match(handler, /abendBeimZeichnen/);
});

// Prüfer-Funde 0.50.0
test("app.js: Ein Leckerli allein zählt nicht als Mahlzeit für den Abend-Hinweis", () => {
  const app = readFileSync(new URL("../app.js", import.meta.url), "utf8");
  assert.match(app, /mahlzeitenHeute: mahlzeiten\.filter\(\(m\) => futter\.get\(m\.futterId\)\?\.typ !== "leckerli"\)\.length/);
});

test("app.js: Hinweise ohne Quelle zeigen keine Zeile „Quelle: undefined“", () => {
  const app = readFileSync(new URL("../app.js", import.meta.url), "utf8");
  assert.match(app, /\$\{w\.quelle \? `<span class="quelle">Quelle: \$\{sicher\(w\.quelle\)\}<\/span>` : ""\}/);
});
