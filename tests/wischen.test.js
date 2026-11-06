import { test } from "node:test";
import assert from "node:assert/strict";
import { wischRichtung, wischAchse, nachbarAnsicht, RAND_PX } from "../js/wischen.js";

// Handy 375 px breit. Eine typische Wischbewegung: 120 px waagrecht, kaum senkrecht, 250 ms.
const breite = 375;
const wisch = (startX, endX, extra = {}) =>
  wischRichtung({ startX, startY: 400, endX, endY: 400, dauerMs: 250, breite, ...extra });

test("Wischen: nach links geht zum nächsten Bereich, nach rechts zum vorherigen", () => {
  assert.equal(wisch(250, 130), 1);
  assert.equal(wisch(130, 250), -1);
});

test("Wischen: kurze Bewegungen zählen nicht (Antippen, Zittern)", () => {
  assert.equal(wisch(200, 170), 0);
  assert.equal(wisch(200, 200), 0);
});

test("Wischen: am Bildschirmrand nichts tun, dort liegt Androids Zurück-Geste", () => {
  assert.equal(wisch(RAND_PX - 1, 200), 0);
  assert.equal(wisch(breite - RAND_PX + 1, 150), 0);
  assert.equal(wisch(RAND_PX + 1, 200), -1);
});

test("Wischen: schräges Scrollen nach unten löst nichts aus", () => {
  assert.equal(wischRichtung({ startX: 250, startY: 300, endX: 150, endY: 450, dauerMs: 250, breite }), 0);
  assert.equal(wischRichtung({ startX: 250, startY: 300, endX: 130, endY: 360, dauerMs: 250, breite }), 1);
});

test("Wischen: langsames Ziehen über eine Sekunde zählt nicht", () => {
  assert.equal(wisch(250, 100, { dauerMs: 1200 }), 0);
});

test("Wischen: Unsinn ergibt 0", () => {
  assert.equal(wischRichtung({}), 0);
  assert.equal(wisch(250, 100, { dauerMs: NaN }), 0);
});

test("Nachbarbereich: folgt der Reihenfolge der Leiste, an den Enden geht es nicht weiter", () => {
  const leiste = ["heute", "gewicht", "verlauf", "futter", "mehr"];
  assert.equal(nachbarAnsicht(leiste, "heute", 1), "gewicht");
  assert.equal(nachbarAnsicht(leiste, "futter", 1), "mehr");
  assert.equal(nachbarAnsicht(leiste, "gewicht", -1), "heute");
  assert.equal(nachbarAnsicht(leiste, "heute", -1), null);
  assert.equal(nachbarAnsicht(leiste, "mehr", 1), null);
  assert.equal(nachbarAnsicht(leiste, "unbekannt", 1), null);
  assert.equal(nachbarAnsicht(leiste, "heute", 0), null);
});

test("Nachbarbereich: ein neuer Bereich in der Leiste wischt automatisch mit", () => {
  const leiste = ["heute", "gewicht", "verlauf", "futter", "tipps", "mehr"];
  assert.equal(nachbarAnsicht(leiste, "futter", 1), "tipps");
  assert.equal(nachbarAnsicht(leiste, "mehr", -1), "tipps");
});

// 0.59.0 (Stefan 06.11.: „Wischgesten werden schwer angenommen“): Die Richtung steht nach den ersten
// Millimetern fest, wie bei Bildergalerien. Ein Daumen-Bogen, der waagrecht beginnt, zählt dann auch schräg.
test("0.59.0: wischAchse entscheidet nach den ersten 10 px, vorher noch nichts", () => {
  assert.equal(wischAchse(4, 3), null);
  assert.equal(wischAchse(-12, 5), "waagrecht");
  assert.equal(wischAchse(6, 14), "senkrecht");
  assert.equal(wischAchse(10, 10), "senkrecht"); // Gleichstand: lieber scrollen als Seite wechseln
  assert.equal(wischAchse(NaN, 20), null);
});

test("0.59.0: waagrecht begonnen → Bogen bis knapp 45 Grad zählt (früher nur bis 27 Grad)", () => {
  const bogen = { startX: 260, startY: 400, endX: 150, endY: 470, dauerMs: 300, breite };
  assert.equal(wischRichtung(bogen), 0, "ohne Achse gilt die alte, strenge Regel");
  assert.equal(wischRichtung({ ...bogen, achse: "waagrecht" }), 1);
  assert.equal(wischRichtung({ ...bogen, endY: 520, achse: "waagrecht" }), 0, "steiler als 45 Grad zählt nie");
});

test("0.59.0: senkrecht begonnen (Scrollen) → nie Seitenwechsel, auch wenn der Finger danach zur Seite geht", () => {
  assert.equal(wischRichtung({ startX: 260, startY: 300, endX: 120, endY: 330, dauerMs: 300, breite, achse: "senkrecht" }), 0);
});

test("0.59.0: auch mit Achse gelten Mindestweg, Rand und Zeit", () => {
  const basis = { startY: 400, endY: 410, breite, achse: "waagrecht" };
  assert.equal(wischRichtung({ ...basis, startX: 200, endX: 160, dauerMs: 200 }), 0);
  assert.equal(wischRichtung({ ...basis, startX: 10, endX: 200, dauerMs: 200 }), 0);
  assert.equal(wischRichtung({ ...basis, startX: 260, endX: 120, dauerMs: 1200 }), 0);
});
