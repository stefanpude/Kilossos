import { test } from "node:test";
import assert from "node:assert/strict";
import {
  freigabeAendern,
  freigabenAmTag,
  fruehereFreigaben,
  freigabeKurz,
  loeschFrage,
  geltungsFrage,
  ersetzenFrage,
  TEXT_ZWEI_AM_TAG,
  TEXT_ANDERE_AM_TAG,
  speicherPlan,
  datumsFrage,
  TEXT_DATUM_KORRIGIEREN,
} from "../js/freigaben.js";
import { ersteDaten, speichern, laden } from "../js/daten.js";
import { readFileSync } from "node:fs";

// Beispielkatze (keine echten Werte, das Projekt ist öffentlich).
const fr = (id, datum, ziel = 5.5, kcal = 210, extra = {}) => ({
  id, tierId: "t", datum, zielgewichtKg: ziel, kcalProTag: kcal, tierarzt: "Praxis Beispiel", notiz: "", ...extra,
});

function testSpeicher() {
  const inhalt = new Map();
  return {
    getItem: (schluessel) => (inhalt.has(schluessel) ? inhalt.get(schluessel) : null),
    setItem: (schluessel, wert) => inhalt.set(schluessel, wert),
    removeItem: (schluessel) => inhalt.delete(schluessel),
  };
}

// ---------- Ändern ----------

test("freigabeAendern: setzt alle Felder, Kennung und Tier bleiben", () => {
  const f = fr("a", "2026-11-13", 5.5, 210, { bcs: 8, mcs: "leicht" });
  freigabeAendern(f, {
    datum: "2026-11-12", zielgewichtKg: 5.2, kcalProTag: 200,
    tierarzt: "  Praxis Neu  ", notiz: "  Kontrolle  ", bcs: 7, mcs: "maessig",
  });
  assert.deepEqual(f, {
    id: "a", tierId: "t", datum: "2026-11-12", zielgewichtKg: 5.2, kcalProTag: 200,
    tierarzt: "Praxis Neu", notiz: "Kontrolle", bcs: 7, mcs: "maessig",
  });
});

test("freigabeAendern: BCS und MCS „Keine Angabe“ entfernen die Felder ganz, fehlende Notiz wird leer", () => {
  const f = fr("a", "2026-11-13", 5.5, 210, { bcs: 8, mcs: "leicht" });
  freigabeAendern(f, { datum: "2026-11-13", zielgewichtKg: 5.5, kcalProTag: 210, tierarzt: "Praxis Beispiel", notiz: null, bcs: undefined, mcs: "" });
  assert.equal("bcs" in f, false);
  assert.equal("mcs" in f, false);
  assert.equal(f.notiz, "");
});

// ---------- Gleicher Tag ----------

test("freigabenAmTag: findet Freigaben am Datum, beim Ändern nie sich selbst", () => {
  const a = fr("a", "2026-11-13");
  const b = fr("b", "2026-11-13");
  const c = fr("c", "2026-11-12");
  assert.deepEqual(freigabenAmTag([a, b, c], "2026-11-13"), [a, b]);
  assert.deepEqual(freigabenAmTag([a, b, c], "2026-11-13", "a"), [b]);
  assert.deepEqual(freigabenAmTag([a, b, c], "2026-11-14"), []);
});

// ---------- Frühere Freigaben ----------

test("fruehereFreigaben: alle außer der geltenden, neueste zuerst", () => {
  const c = fr("c", "2026-10-01");
  const a = fr("a", "2026-11-13");
  const b = fr("b", "2026-10-20");
  assert.deepEqual(fruehereFreigaben([c, a, b]), [b, c]);
  assert.deepEqual(fruehereFreigaben([a]), []);
  assert.deepEqual(fruehereFreigaben([]), []);
});

test("fruehereFreigaben: zwei am selben Tag: die spätere gilt, die frühere steht in der Liste", () => {
  const a = fr("a", "2026-11-13");
  const b = fr("b", "2026-11-13");
  assert.deepEqual(fruehereFreigaben([a, b]), [a]);
});

test("fruehereFreigaben: bei gleichem Datum steht die später eingetragene zuerst", () => {
  const neu = fr("neu", "2026-11-20");
  const x = fr("x", "2026-11-13");
  const y = fr("y", "2026-11-13");
  assert.deepEqual(fruehereFreigaben([x, neu, y]), [y, x]);
});

// ---------- Texte ----------

test("freigabeKurz: Ziel mit zwei Stellen, kcal ganz, geschützte Leerzeichen", () => {
  assert.equal(freigabeKurz(fr("a", "2026-11-13")), "Ziel 5,50 kg, 210 kcal");
});

test("ersetzenFrage nennt Datum und Werte der vorhandenen Freigabe", () => {
  assert.equal(
    ersetzenFrage(fr("a", "2026-11-13")),
    "Für den 13. Nov. 2026 gibt es schon eine Freigabe (Ziel 5,50 kg, 210 kcal). Soll die neue sie ersetzen?"
  );
});

test("loeschFrage: danach gilt wieder die ältere", () => {
  const alt = fr("alt", "2026-10-01", 6, 230);
  const neu = fr("neu", "2026-11-13");
  assert.equal(
    loeschFrage([alt, neu], neu, "Mia", "2026-11-15"),
    "Freigabe vom 13. Nov. 2026 (Ziel 5,50 kg, 210 kcal) löschen? " +
      "Danach gilt wieder die Freigabe vom 1. Okt. 2026 (Ziel 6,00 kg, 230 kcal)."
  );
});

test("loeschFrage: einzige Freigabe", () => {
  const neu = fr("neu", "2026-11-13");
  assert.equal(
    loeschFrage([neu], neu, "Mia", "2026-11-15"),
    "Freigabe vom 13. Nov. 2026 (Ziel 5,50 kg, 210 kcal) löschen? " +
      "Danach hat Mia keine Freigabe mehr: Kilossos zeichnet nur noch auf und zeigt kein Ziel und keine Tagesmenge."
  );
});

test("loeschFrage: ältere Freigabe ohne Wirkung auf heute", () => {
  const alt = fr("alt", "2026-10-01", 6, 230);
  const neu = fr("neu", "2026-11-13");
  assert.equal(loeschFrage([alt, neu], alt, "Mia", "2026-11-15"), "Freigabe vom 1. Okt. 2026 (Ziel 6,00 kg, 230 kcal) löschen?");
});

// ---------- Welche Freigabe gilt nach dem Speichern ----------

test("geltungsFrage: neu mit Datum vor der geltenden fragt", () => {
  const g = fr("g", "2026-11-13");
  const n = fr("n", "2026-11-01", 6, 230);
  assert.equal(
    geltungsFrage({ vorher: [g], nachher: [g, n], id: "n", neu: true, heute: "2026-11-15" }),
    "Die Freigabe vom 13. Nov. 2026 ist neuer und gilt weiter. Diese wird als frühere Freigabe gespeichert. Stimmt das Datum?"
  );
});

test("geltungsFrage: neu mit heutigem Datum fragt nicht", () => {
  const g = fr("g", "2026-11-13");
  const n = fr("n", "2026-11-15");
  assert.equal(geltungsFrage({ vorher: [g], nachher: [g, n], id: "n", neu: true, heute: "2026-11-15" }), null);
  assert.equal(geltungsFrage({ vorher: [], nachher: [n], id: "n", neu: true, heute: "2026-11-15" }), null);
});

test("geltungsFrage: geltende nach hinten verschoben nennt die danach geltende", () => {
  const alt = fr("alt", "2026-10-01", 6, 230);
  const g = fr("g", "2026-11-13");
  assert.equal(
    geltungsFrage({ vorher: [alt, g], nachher: [alt, { ...g, datum: "2026-09-01" }], id: "g", neu: false, heute: "2026-11-15" }),
    "Mit diesem Datum gilt nicht mehr diese Freigabe, sondern wieder die vom 1. Okt. 2026 (Ziel 6,00 kg, 230 kcal). Stimmt das Datum?"
  );
});

test("geltungsFrage: frühere nach vorn verschoben", () => {
  const alt = fr("alt", "2026-10-01", 6, 230);
  const g = fr("g", "2026-11-13");
  assert.equal(
    geltungsFrage({ vorher: [alt, g], nachher: [{ ...alt, datum: "2026-11-14" }, g], id: "alt", neu: false, heute: "2026-11-15" }),
    "Mit diesem Datum gilt diese Freigabe ab sofort statt der vom 13. Nov. 2026 (Ziel 5,50 kg, 210 kcal). Stimmt das Datum?"
  );
});

test("geltungsFrage: nur Wert geändert fragt nicht", () => {
  const alt = fr("alt", "2026-10-01", 6, 230);
  const g = fr("g", "2026-11-13");
  assert.equal(geltungsFrage({ vorher: [alt, g], nachher: [alt, { ...g, kcalProTag: 200 }], id: "g", neu: false, heute: "2026-11-15" }), null);
  assert.equal(geltungsFrage({ vorher: [alt, g], nachher: [{ ...alt, notiz: "x" }, g], id: "alt", neu: false, heute: "2026-11-15" }), null);
});

// ---------- Alte Daten ----------

test("Alte Daten mit zwei Freigaben am selben Tag laden unverändert", () => {
  const speicher = testSpeicher();
  const daten = ersteDaten({ name: "Mia", kastriert: true });
  const tierId = daten.tiere[0].id;
  daten.freigaben.push({ ...fr("a", "2026-11-13"), tierId }, { ...fr("b", "2026-11-13", 5.5, 200), tierId });
  speichern(daten, speicher);
  const geladen = laden(speicher);
  assert.equal(geladen.freigaben.length, 2);
  assert.deepEqual(geladen.freigaben, daten.freigaben);
});

// Fund im Browser-Test: Ist die falsche der beiden gerade die geltende (auf der Tafel), darf der Text nicht nur auf
// „Frühere Freigaben“ zeigen, sonst löscht man dort womöglich die richtige.
test("TEXT_ZWEI_AM_TAG schickt nicht nur zu „Frühere Freigaben“, sondern lässt beide prüfen", () => {
  assert.doesNotMatch(TEXT_ZWEI_AM_TAG, /Frühere Freigaben/);
  assert.match(TEXT_ZWEI_AM_TAG, /beide/);
});

// ---------- Speicher-Entscheidung (nach Review: rein und testbar statt in app.js) ----------

const plan = (freigaben, alt, datum, ziel = 5.5, kcal = 210, tierId = "t") =>
  speicherPlan({ freigaben, tierId, alt, datum, zielgewichtKg: ziel, kcalProTag: kcal, heute: "2026-11-15" });

test("speicherPlan: alte Daten mit zwei Freigaben am selben Tag sperren Ändern und Neu, Wegverschieben geht", () => {
  const a = fr("a", "2026-11-13");
  const b = fr("b", "2026-11-13");
  assert.deepEqual(plan([a, b], a, "2026-11-13"), { fehler: TEXT_ZWEI_AM_TAG });
  assert.deepEqual(plan([a, b], b, "2026-11-13"), { fehler: TEXT_ZWEI_AM_TAG });
  assert.deepEqual(plan([a, b], null, "2026-11-13"), { fehler: TEXT_ZWEI_AM_TAG });
  const weg = plan([a, b], a, "2026-11-01");
  assert.equal(weg.fehler, undefined);
  assert.equal(weg.ueberschrieben, a);
  assert.equal(weg.ersetzen, false);
});

test("speicherPlan: Ändern auf den Tag einer anderen Freigabe ist ein Fehler", () => {
  const a = fr("a", "2026-10-01");
  const c = fr("c", "2026-11-13");
  assert.deepEqual(plan([a, c], a, "2026-11-13"), { fehler: TEXT_ANDERE_AM_TAG });
});

test("speicherPlan: neu am Tag einer vorhandenen Freigabe ersetzt genau diese nach Rückfrage", () => {
  const alt = fr("alt", "2026-10-01");
  const x = fr("x", "2026-11-13");
  const p = plan([alt, x], null, "2026-11-13", 5.2, 200);
  assert.equal(p.ueberschrieben, x);
  assert.equal(p.ersetzen, true);
  assert.equal(p.frage, null);
});

test("speicherPlan: Freigabe eines anderen Tiers am selben Tag zählt nicht", () => {
  const fremd = { ...fr("f", "2026-11-13"), tierId: "anderes" };
  const p = plan([fremd], null, "2026-11-13");
  assert.equal(p.fehler, undefined);
  assert.equal(p.ueberschrieben, null);
  assert.equal(p.ersetzen, false);
  const eigene = fr("e", "2026-11-01");
  const q = plan([fremd, eigene], eigene, "2026-11-13");
  assert.equal(q.fehler, undefined);
  assert.equal(q.ueberschrieben, eigene);
});

test("speicherPlan: reicht die Rückfrage „welche Freigabe gilt“ durch", () => {
  const g = fr("g", "2026-11-13");
  const alt = fr("alt", "2026-10-01", 6, 230);
  assert.equal(
    plan([g], null, "2026-11-01").frage,
    "Die Freigabe vom 13. Nov. 2026 ist neuer und gilt weiter. Diese wird als frühere Freigabe gespeichert. Stimmt das Datum?"
  );
  assert.match(plan([alt, g], g, "2026-09-01").frage, /gilt nicht mehr diese Freigabe, sondern wieder die vom 1\. Okt\. 2026/);
  const nurWert = plan([alt, g], g, "2026-11-13", 5.5, 200);
  assert.equal(nurWert.frage, null);
  assert.equal(nurWert.ueberschrieben, g);
  assert.equal(nurWert.ersetzen, false);
});

// ---------- 0.36.5: Datum beim Korrigieren (Review B-F2) ----------
// Wer eine Freigabe mit neuen Werten korrigiert und das alte Datum stehen lässt, macht die neuen Werte rückwirkend
// gültig (z. B. echte Freigabe über eine Test-Freigabe vom Vortag). Dann vor dem Speichern nach dem Datum fragen.

const df = (alt, datum, ziel = 5.5, kcal = 210, heute = "2026-11-15") =>
  datumsFrage({ alt, datum, zielgewichtKg: ziel, kcalProTag: kcal, heute });

test("datumsFrage: Tagesmenge korrigiert, altes Datum vor heute stehen gelassen, fragt mit Datum und neuen Werten", () => {
  const a = fr("a", "2026-11-04", 5.5, 210);
  assert.equal(
    df(a, "2026-11-04", 5.5, 250),
    "Du hast Ziel oder Tagesmenge geändert, das Datum ist aber noch der 4. Nov. 2026. " +
      "Die neuen Werte (Ziel 5,50 kg, 250 kcal) gelten dann rückwirkend ab diesem Tag, " +
      "auch in der Übersicht für den Tierarzt. Stimmt das Datum?"
  );
});

test("datumsFrage: nur Zielgewicht korrigiert fragt auch", () => {
  const a = fr("a", "2026-11-04", 5.5, 210);
  assert.match(df(a, "2026-11-04", 5.2, 210), /Ziel 5,20 kg, 210 kcal/);
});

test("datumsFrage: Ziel und Tagesmenge unverändert (nur Praxis, BCS oder Notiz) fragt nicht", () => {
  const a = fr("a", "2026-11-04", 5.5, 210);
  assert.equal(df(a, "2026-11-04", 5.5, 210), null);
});

test("datumsFrage: Datum selbst geändert fragt nicht (das regelt die Frage „welche Freigabe gilt“)", () => {
  const a = fr("a", "2026-11-04", 5.5, 210);
  assert.equal(df(a, "2026-11-15", 5.2, 250), null);
  assert.equal(df(a, "2026-11-01", 5.2, 250), null);
});

test("datumsFrage: Freigabe von heute korrigiert (Tippfehler gleich nach dem Eintragen) fragt nicht", () => {
  const a = fr("a", "2026-11-15", 5.5, 210);
  assert.equal(df(a, "2026-11-15", 5.2, 250), null);
});

test("datumsFrage: neu eintragen fragt nie", () => {
  assert.equal(df(null, "2026-11-04", 5.2, 250), null);
});

test("speicherPlan: reicht die Datumsfrage durch, bei Fehler nicht", () => {
  const a = fr("a", "2026-11-04", 5.5, 210);
  const p = plan([a], a, "2026-11-04", 5.5, 250);
  assert.equal(p.datumFrage, df(a, "2026-11-04", 5.5, 250));
  assert.equal(p.ueberschrieben, a);
  assert.equal(plan([a], a, "2026-11-04").datumFrage, null);
  assert.equal(plan([a], null, "2026-11-04", 5.2, 250).datumFrage, null);
  const c = fr("c", "2026-11-13");
  assert.deepEqual(plan([a, c], a, "2026-11-13", 5.2, 250), { fehler: TEXT_ANDERE_AM_TAG });
});

test("TEXT_DATUM_KORRIGIEREN nennt den Weg für einen neuen Plan", () => {
  assert.equal(
    TEXT_DATUM_KORRIGIEREN,
    "Nicht gespeichert: Bitte das Datum prüfen. Ein neuer Plan vom Tierarzt kommt über „Freigabe eintragen“ dazu."
  );
});

test("app.js fragt nach dem Datum nach den Fehlern und vor der 60-%-Rückfrage, Abbrechen setzt den Fokus ins Datum", () => {
  const app = readFileSync(new URL("../app.js", import.meta.url), "utf8");
  const fehler = app.indexOf("if (plan.fehler) return plan.fehler;");
  const datum = app.indexOf("if (plan.datumFrage && !confirm(plan.datumFrage))");
  const sechzig = app.indexOf("60 % des Ruhebedarfs beim Zielgewicht");
  assert.ok(fehler > 0 && datum > fehler && sechzig > datum, `Reihenfolge: ${fehler} < ${datum} < ${sechzig}`);
  const block = app.slice(datum, sechzig);
  assert.match(block, /datum\.focus\(\)/);
  assert.match(block, /return TEXT_DATUM_KORRIGIEREN;/);
});
