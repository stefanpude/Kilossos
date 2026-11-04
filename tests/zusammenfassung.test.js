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
  tempoRueckmeldung,
  achtWochen,
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

// ---------- Rückmeldung beim Gewicht eintragen (ab 0.23.0) ----------

const zwei = [G("2026-10-01", 9.32), G("2026-10-08", 9.25)];

test("tempoRueckmeldung: ohne frühere Messung oder ohne gültiges Gewicht keine Rückmeldung", () => {
  assert.equal(tempoRueckmeldung({ gewichte: [], freigaben: [], kg: 9.3, datum: "2026-10-15" }), null);
  assert.equal(tempoRueckmeldung({ gewichte: zwei, freigaben: [], kg: null, datum: "2026-10-15" }), null);
  // Nachtrag vor der ersten Messung: nichts davor
  assert.equal(tempoRueckmeldung({ gewichte: zwei, freigaben: [], kg: 9.4, datum: "2026-09-20" }), null);
});

test("tempoRueckmeldung: vergleicht mit der letzten Messung vor dem Datum", () => {
  const r = tempoRueckmeldung({ gewichte: zwei, freigaben: [freigabe], kg: 9.18, datum: "2026-10-15" });
  assert.equal(r.seit, "2026-10-08");
  nahe(r.diffKg, -0.07);
  nahe(r.prozent, (0.07 / 9.25) * 100);
  assert.equal(r.bewertung, "gut");
  assert.match(r.titel, /^−0,07 kg seit dem 08\.10\./);
  assert.match(r.text, /0,8 % pro Woche, im sicheren Bereich/);
  // Nachtrag zwischen zwei Messungen: Vergleich mit der Messung davor
  assert.equal(tempoRueckmeldung({ gewichte: zwei, freigaben: [], kg: 9.3, datum: "2026-10-05" }).seit, "2026-10-01");
});

test("tempoRueckmeldung beim Ändern (0.31.0): nie mit der Wägung vergleichen, die gerade geändert wird", () => {
  // Wägung vom 08.10. (9,25 kg) bekommt das Datum 15.10.: Vergleich mit dem 01.10. (9,32 kg), nicht mit sich selbst.
  const r = tempoRueckmeldung({ gewichte: zwei, freigaben: [], kg: 9.25, datum: "2026-10-15", ohneId: "2026-10-08" });
  assert.equal(r.seit, "2026-10-01");
  nahe(r.diffKg, -0.07);
  // Wägung vom 01.10. rückt auf den 05.10.: davor liegt dann keine andere Wägung, also keine Rückmeldung.
  assert.equal(tempoRueckmeldung({ gewichte: zwei, freigaben: [], kg: 9.32, datum: "2026-10-05", ohneId: "2026-10-01" }), null);
});

test("tempoRueckmeldung: sicher/langsamer nur nach einer Freigabe (wie wochenRaten)", () => {
  assert.equal(tempoRueckmeldung({ gewichte: zwei, freigaben: [], kg: 9.18, datum: "2026-10-15" }).bewertung, "neutral");
  const ohne = tempoRueckmeldung({ gewichte: zwei, freigaben: [], kg: 9.18, datum: "2026-10-15" });
  assert.match(ohne.text, /erst mit einer Freigabe vom Tierarzt/);
  assert.doesNotMatch(ohne.text, /sicher/);
  // Freigabe erst nach der letzten Messung: diese Woche zählt noch nicht als bewertet
  const spaet = { ...freigabe, datum: "2026-10-10" };
  assert.equal(tempoRueckmeldung({ gewichte: zwei, freigaben: [spaet], kg: 9.18, datum: "2026-10-15" }).bewertung, "neutral");
  assert.equal(tempoRueckmeldung({ gewichte: zwei, freigaben: [freigabe], kg: 9.23, datum: "2026-10-15" }).bewertung, "langsam");
});

test("tempoRueckmeldung: über 2 % pro Woche immer markieren, auch ohne Freigabe", () => {
  const r = tempoRueckmeldung({ gewichte: zwei, freigaben: [], kg: 9.0, datum: "2026-10-15" });
  assert.equal(r.bewertung, "zu-schnell");
  assert.match(r.text, /schneller als 2 %/);
  assert.match(r.text, /Mittel über zwei Wochen/);
  assert.match(r.text, /Nicht selbst die Menge ändern/);
});

test("tempoRueckmeldung: Zunahme", () => {
  const mit = tempoRueckmeldung({ gewichte: zwei, freigaben: [freigabe], kg: 9.3, datum: "2026-10-15" });
  assert.equal(mit.bewertung, "zunahme");
  assert.match(mit.titel, /^\+0,05 kg/);
  assert.match(mit.text, /Zunahme/);
  assert.equal(tempoRueckmeldung({ gewichte: zwei, freigaben: [], kg: 9.3, datum: "2026-10-15" }).bewertung, "neutral");
});

test("tempoRueckmeldung: gleiches Gewicht", () => {
  const r = tempoRueckmeldung({ gewichte: zwei, freigaben: [freigabe], kg: 9.25, datum: "2026-10-15" });
  assert.match(r.titel, /^±0,00 kg/);
  assert.equal(r.bewertung, "langsam");
});

test("achtWochen: Wägungen der letzten 56 Tage, älteste zuerst", () => {
  const liste = [G("2026-08-01", 9.6), G("2026-09-05", 9.4), ...gewichte];
  assert.deepEqual(achtWochen(liste, "2026-10-29").map((g) => g.datum), ["2026-09-05", "2026-10-01", "2026-10-08", "2026-10-15", "2026-10-29"]);
});
