import { test } from "node:test";
import assert from "node:assert/strict";
import {
  rer,
  zielgewichtAusBcs,
  harteUntergrenze,
  untergrenzeOhneFreigabe,
  abnahmeProWoche,
  leckerliKcal,
  aktuelleFreigabe,
  warnungen,
} from "../js/rechnen.js";

// Beispielwerte aus docs/sicherheitsgrenzen.md, Abschnitt B4 (Kito, 9,32 kg).

test("rer: 70 × kg^0,75", () => {
  assert.equal(Math.round(rer(9.32)), 373);
  assert.equal(Math.round(rer(7.17)), 307);
});

test("zielgewichtAusBcs: Kito bei BCS 7, 8 und 9", () => {
  assert.equal(zielgewichtAusBcs(9.32, 7).toFixed(2), "7.77");
  assert.equal(zielgewichtAusBcs(9.32, 8).toFixed(2), "7.17");
  assert.equal(zielgewichtAusBcs(9.32, 9).toFixed(2), "6.66");
  assert.equal(zielgewichtAusBcs(9.32, 5), 9.32);
});

test("Untergrenzen für Kito", () => {
  assert.equal(Math.round(harteUntergrenze(9.32 / 1.3)), 184);
  assert.equal(Math.round(untergrenzeOhneFreigabe(9.32)), 290);
});

test("abnahmeProWoche: kürzester Zeitraum von mindestens N Tagen", () => {
  const gewichte = [
    { kg: 9.32, datum: "2026-11-01" },
    { kg: 9.2, datum: "2026-11-08" },
    { kg: 9.04, datum: "2026-11-15" },
  ];
  const zweiWochen = abnahmeProWoche(gewichte, 14);
  assert.equal(zweiWochen.tage, 14);
  assert.equal(zweiWochen.prozent.toFixed(2), "1.50"); // (9,32 − 9,04) / 9,32 / 2 Wochen
  const eineWoche = abnahmeProWoche(gewichte, 7);
  assert.equal(eineWoche.von.datum, "2026-11-08");
  assert.equal(abnahmeProWoche(gewichte, 28), null);
  assert.equal(abnahmeProWoche([], 7), null);
});

test("abnahmeProWoche: Zunahme ist negativ", () => {
  const gewichte = [
    { kg: 9.0, datum: "2026-11-01" },
    { kg: 9.09, datum: "2026-11-08" },
  ];
  assert.equal(abnahmeProWoche(gewichte, 7).prozent.toFixed(1), "-1.0");
});

test("leckerliKcal zählt nur Leckerlis", () => {
  const futter = new Map([
    ["sheba", { typ: "nass", kcalPro100g: 77 }],
    ["snack", { typ: "leckerli", kcalPro100g: 400 }],
  ]);
  const mahlzeiten = [
    { futterId: "sheba", gramm: 100 },
    { futterId: "snack", gramm: 5 },
  ];
  assert.equal(leckerliKcal(mahlzeiten, futter), 20);
});

test("aktuelleFreigabe nimmt die neueste", () => {
  const alt = { datum: "2026-11-03", kcalProTag: 260 };
  const neu = { datum: "2026-12-01", kcalProTag: 245 };
  assert.equal(aktuelleFreigabe([neu, alt]), neu);
  assert.equal(aktuelleFreigabe([]), null);
});

// ---------- Warnungen ----------

const freigabe = { datum: "2026-11-03", zielgewichtKg: 7.2, kcalProTag: 245 };
const gewichte = [{ kg: 9.32, datum: "2026-11-01" }];
const basis = { name: "Kito", tag: "2026-11-10", heute: "2026-11-11", kcal: 245, leckerli: 0, freigabe, gewichte, fruehereMahlzeiten: true };
const arten = (liste) => liste.map((w) => w.art + ":" + w.id);

test("warnungen: alles im Rahmen ergibt keine Warnung", () => {
  assert.deepEqual(warnungen(basis), []);
});

test("warnungen: weniger als die Hälfte der Freigabe ist ein Notfall-Hinweis", () => {
  assert.deepEqual(arten(warnungen({ ...basis, kcal: 100 })), ["sofort:wenig-gefressen"]);
});

test("warnungen: unter der Freigabe, aber über der Hälfte", () => {
  assert.deepEqual(arten(warnungen({ ...basis, kcal: 200 })), ["achtung:unter-freigabe"]);
});

test("warnungen: der laufende Tag wird nicht als zu wenig bewertet", () => {
  assert.deepEqual(warnungen({ ...basis, tag: "2026-11-11", kcal: 50 }), []);
});

test("warnungen: vergangener Tag ohne Eintrag fragt nach, aber nur nach dem ersten Eintrag", () => {
  assert.deepEqual(arten(warnungen({ ...basis, kcal: 0 })), ["sofort:wenig-gefressen"]);
  assert.deepEqual(warnungen({ ...basis, kcal: 0, fruehereMahlzeiten: false }), []);
});

test("warnungen: mehr als freigegeben", () => {
  assert.deepEqual(arten(warnungen({ ...basis, kcal: 280 })), ["hinweis:ueber-freigabe"]);
});

test("warnungen: ohne Freigabe gilt die Untergrenze aus dem aktuellen Gewicht", () => {
  const ohne = { ...basis, freigabe: null };
  assert.deepEqual(warnungen({ ...ohne, kcal: 300 }), []);
  assert.deepEqual(arten(warnungen({ ...ohne, kcal: 250 })), ["achtung:unter-untergrenze"]);
  assert.deepEqual(arten(warnungen({ ...ohne, kcal: 120 })), ["sofort:wenig-gefressen"]);
  assert.deepEqual(warnungen({ ...ohne, kcal: 120, gewichte: [] }), []); // ohne Gewicht keine Grenze
});

test("warnungen: Leckerlis über 10 %", () => {
  assert.deepEqual(warnungen({ ...basis, leckerli: 24 }), []);
  assert.deepEqual(arten(warnungen({ ...basis, leckerli: 30 })), ["achtung:leckerli"]);
  const ohneHeute = { ...basis, freigabe: null, tag: "2026-11-11", kcal: 10, leckerli: 10 };
  assert.deepEqual(warnungen(ohneHeute), []); // laufender Tag ohne Freigabe: noch unvollständig
  assert.deepEqual(arten(warnungen({ ...ohneHeute, tag: "2026-11-10", kcal: 300, leckerli: 40 })), ["achtung:leckerli"]);
});

test("warnungen: Abnahme zu schnell (über 2 % pro Woche, 2 Wochen)", () => {
  const schnell = [
    { kg: 9.32, datum: "2026-11-01" },
    { kg: 8.9, datum: "2026-11-15" },
  ];
  assert.deepEqual(arten(warnungen({ ...basis, gewichte: schnell })), ["achtung:zu-schnell"]);
});

test("warnungen: Stillstand über 4 Wochen nur mit Freigabe", () => {
  const still = [
    { kg: 9.32, datum: "2026-11-01" },
    { kg: 9.28, datum: "2026-11-29" },
  ];
  const mitFreigabe = { ...basis, tag: "2026-11-29", heute: "2026-11-30", freigabe: { ...freigabe, datum: "2026-11-01" } };
  assert.deepEqual(arten(warnungen({ ...mitFreigabe, gewichte: still })), ["hinweis:stillstand"]);
  assert.deepEqual(arten(warnungen({ ...mitFreigabe, freigabe: null, kcal: 300, gewichte: still })), []);
});

test("warnungen: Freigabe älter als 3 Monate und Ziel erreicht", () => {
  const spaet = { ...basis, tag: "2027-02-10", heute: "2027-02-11" };
  assert.deepEqual(arten(warnungen(spaet)), ["hinweis:freigabe-alt"]);
  const amZiel = { ...basis, gewichte: [{ kg: 7.2, datum: "2026-11-09" }] };
  assert.deepEqual(arten(warnungen(amZiel)), ["hinweis:ziel-erreicht"]);
});

test("jede Warnung nennt eine Quelle", () => {
  for (const w of warnungen({ ...basis, kcal: 100, leckerli: 30 })) assert.ok(w.quelle.length > 0);
});
