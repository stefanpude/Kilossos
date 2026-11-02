import { test } from "node:test";
import assert from "node:assert/strict";
import {
  zeitraumStart,
  wochenRaten,
  abnahmeZusammenfassung,
  futterTage,
  futterZusammenfassung,
  kalenderwoche,
  wochenGruppen,
  monatsGruppen,
  ringWerte,
  leckerliKachel,
} from "../js/zusammenfassung.js";

const G = (datum, kg) => ({ id: datum, tierId: "k", datum, kg, notiz: "" });
const gewichte = [G("2026-10-01", 9.32), G("2026-10-08", 9.25), G("2026-10-15", 9.0), G("2026-10-29", 8.95)];
const freigabe = { id: "f", tierId: "k", datum: "2026-10-08", zielgewichtKg: 7.2, kcalProTag: 220, tierarzt: "T", notiz: "" };
const nahe = (ist, soll, toleranz = 0.001) => assert.ok(Math.abs(ist - soll) < toleranz, `${ist} ist nicht ≈ ${soll}`);

test("zeitraumStart rechnet 31 und 92 Tage zurück", () => {
  assert.equal(zeitraumStart("1m", "2026-11-02"), "2026-10-02");
  assert.equal(zeitraumStart("3m", "2026-11-02"), "2026-08-02");
  assert.equal(zeitraumStart("alles", "2026-11-02"), null);
});

test("wochenRaten: Rot immer, Grün/Gelb erst ab der ersten Freigabe", () => {
  const raten = wochenRaten(gewichte, [freigabe]);
  assert.deepEqual(raten.map((r) => [r.datum, r.bewertung, r.nachFreigabe]), [
    ["2026-10-29", "langsam", true],
    ["2026-10-15", "zu-schnell", true],
    ["2026-10-08", "neutral", false],
  ]);
  nahe(raten[0].prozent, 0.2778); // 2 Wochen Abstand
  nahe(raten[1].prozent, 2.7027);
  assert.equal(raten[0].vonDatum, "2026-10-15");
  assert.deepEqual(wochenRaten(gewichte, []).map((r) => r.bewertung), ["neutral", "zu-schnell", "neutral"]);
});

test("wochenRaten: Woche im sicheren Bereich ist gut", () => {
  const raten = wochenRaten([G("2026-10-08", 9.25), G("2026-10-15", 9.18)], [freigabe]);
  assert.equal(raten[0].bewertung, "gut");
});

test("Zunahme ergibt negativen Wert", () => {
  const raten = wochenRaten([G("2026-10-01", 9.0), G("2026-10-08", 9.09)], [freigabe]);
  assert.ok(raten[0].prozent < 0);
});

test("abnahmeZusammenfassung zählt nur Wochen ab der Freigabe als bewertet", () => {
  const z = abnahmeZusammenfassung(wochenRaten(gewichte, [freigabe]));
  assert.equal(z.anzahl, 3);
  assert.equal(z.bewertet, 2);
  assert.equal(z.imBereich, 0);
  nahe(z.durchschnitt, 1.2439);
  assert.equal(abnahmeZusammenfassung([]).durchschnitt, null);
});

const futter = new Map([["n", { id: "n", typ: "nass", kcalPro100g: 100, kcalQuelle: "packung" }]]);
const M = (zeitpunkt, gramm) => ({ id: zeitpunkt, tierId: "k", futterId: "n", gramm, zeitpunkt: new Date(zeitpunkt).toISOString() });
const mahlzeiten = [M("2026-10-21T08:00:00", 260), M("2026-10-20T08:00:00", 200), M("2026-10-22T08:00:00", 50)];
const freigabeOkt = { ...freigabe, datum: "2026-10-01" };

test("futterTage: nur Tage mit Einträgen, neueste zuerst, über ab +10 %", () => {
  const tage = futterTage(mahlzeiten, futter, [freigabeOkt]);
  assert.deepEqual(tage.map((t) => t.tag), ["2026-10-22", "2026-10-21", "2026-10-20"]);
  assert.deepEqual(tage.map((t) => t.ueber), [false, true, false]);
  assert.equal(tage[1].freigabeKcal, 220);
  assert.equal(tage[1].kcal, 260);
  assert.equal(tage[1].mahlzeiten.length, 1);
  assert.equal(futterTage(mahlzeiten, futter, [])[1].freigabeKcal, null);
});

test("futterZusammenfassung lässt den heutigen Tag weg", () => {
  assert.deepEqual(futterZusammenfassung(futterTage(mahlzeiten, futter, [freigabeOkt]), "2026-10-22"), {
    durchschnitt: 230,
    anzahl: 2,
    ueber: 1,
  });
  assert.equal(futterZusammenfassung(futterTage(mahlzeiten, futter, []), "2026-10-22").ueber, 0);
  assert.equal(futterZusammenfassung([], "2026-10-22").durchschnitt, null);
});

test("kalenderwoche nach ISO 8601", () => {
  assert.equal(kalenderwoche("2026-10-05"), 41);
  assert.equal(kalenderwoche("2026-01-01"), 1);
  assert.equal(kalenderwoche("2027-01-01"), 53);
});

test("wochenGruppen: Diese Woche, Letzte Woche, dann KW", () => {
  const tage = ["2026-10-22", "2026-10-19", "2026-10-14", "2026-10-05"].map((tag) => ({ tag }));
  const gruppen = wochenGruppen(tage, "2026-10-22");
  assert.deepEqual(gruppen.map((g) => g.titel), ["Diese Woche", "Letzte Woche", "KW 41"]);
  assert.equal(gruppen[0].tage.length, 2);
});

test("monatsGruppen: neueste zuerst, Änderung auch über Monatsgrenzen", () => {
  const gruppen = monatsGruppen([G("2026-09-28", 9.4), G("2026-10-05", 9.32), G("2026-10-12", 9.25)]);
  assert.deepEqual(gruppen.map((g) => g.schluessel), ["2026-10", "2026-09"]);
  assert.equal(gruppen[0].titel, "Oktober 2026");
  assert.deepEqual(gruppen[0].eintraege.map((e) => e.datum), ["2026-10-12", "2026-10-05"]);
  nahe(gruppen[0].eintraege[1].diffKg, -0.08);
  assert.equal(gruppen[1].eintraege[0].diffKg, null);
  nahe(gruppen[0].durchschnitt, 9.285);
});

test("ringWerte mit und ohne Freigabe", () => {
  const r = ringWerte(155, freigabe);
  nahe(r.anteil, 155 / 220);
  assert.equal(r.offen, 65);
  assert.equal(r.ueber, false);
  const voll = ringWerte(230, freigabe);
  assert.equal(voll.anteil, 1);
  assert.equal(voll.darueber, 10);
  assert.equal(voll.ueber, false);
  assert.equal(ringWerte(250, freigabe).ueber, true);
  assert.deepEqual(ringWerte(155, null), { anteil: null, offen: 0, darueber: 0, ueber: false });
});

test("leckerliKachel rechnet wie warnungen()", () => {
  const heute = leckerliKachel({ tag: "2026-10-22", heute: "2026-10-22", kcal: 100, leckerli: 20, freigabe: null, warnungAktiv: false });
  assert.equal(heute.anteil, null);
  assert.equal(heute.amTagesende, true);
  assert.equal(heute.kcal, 20);
  const gestern = leckerliKachel({ tag: "2026-10-21", heute: "2026-10-22", kcal: 200, leckerli: 20, freigabe: null, warnungAktiv: false });
  nahe(gestern.anteil, 0.1);
  assert.equal(gestern.amTagesende, false);
  const mitFreigabe = leckerliKachel({ tag: "2026-10-22", heute: "2026-10-22", kcal: 150, leckerli: 30, freigabe, warnungAktiv: false });
  nahe(mitFreigabe.anteil, 30 / 220);
  assert.equal(mitFreigabe.stufe, "normal");
  assert.equal(leckerliKachel({ tag: "2026-10-22", heute: "2026-10-22", kcal: 150, leckerli: 30, freigabe, warnungAktiv: true }).stufe, "achtung");
  assert.equal(leckerliKachel({ tag: "2026-10-21", heute: "2026-10-22", kcal: 0, leckerli: 0, freigabe: null, warnungAktiv: false }).anteil, null);
});
