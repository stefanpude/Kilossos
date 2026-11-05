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
  gefuettertWerte,
  messungWerte,
  tempoZahl,
} from "../js/zusammenfassung.js";
import { GRENZEN, warnungen } from "../js/rechnen.js";

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

// 0.36.2: genau 2,0 % (10 → 9,6 kg in 14 Tagen, Gleitkomma 2,000…02) gilt wie bei den Warnungen noch als erlaubt.
test("wochenRaten: genau 2,0 % pro Woche ist nicht „zu schnell“", () => {
  const raten = wochenRaten([G("2026-10-01", 10), G("2026-10-15", 9.6)], []);
  assert.notEqual(raten[0].bewertung, "zu-schnell");
});

// ---------- 0.38.0: „Gefüttert“ mit Mahlzeiten im Balken (Plan .planning/grafiken-auswahl.md, Stelle 1) ----------

const SORTEN = new Map([
  ["n", { id: "n", name: "Nass", typ: "nass", kcalPro100g: 100, kcalQuelle: "hersteller", notiz: "" }],
  ["t", { id: "t", name: "Trocken", typ: "trocken", kcalPro100g: 400, kcalQuelle: "hersteller", notiz: "" }],
  ["l", { id: "l", name: "Leckerli", typ: "leckerli", kcalPro100g: 300, kcalQuelle: "hersteller", notiz: "" }],
]);
const MZ = (futterId, gramm, uhr) => ({ id: futterId + uhr, tierId: "k", futterId, gramm, zeitpunkt: `2026-11-05T${uhr}:00` });
// Nass in Gramm = kcal, dazu immer 25 g Trocken = 100 kcal.
const tagMit = (kcal) => [MZ("n", kcal - 100, "08:00"), MZ("t", 25, "12:00")];
const werte = (kcal, extra = {}) =>
  gefuettertWerte({ mahlzeiten: tagMit(kcal), futterNachId: SORTEN, freigabe, tag: "2026-11-05", heute: "2026-11-05", ...extra });

test("0.38.0: gefuettertWerte unter der Tagesmenge: „Noch 9 kcal“, keine Überdeckung, Marke am Ende", () => {
  const w = werte(211);
  assert.equal(w.kcal, 211);
  assert.equal(w.gramm, 136);
  assert.equal(w.unsicher, false);
  assert.deepEqual(w.ziel.kachel, { wort: "Noch", kcal: 9, warnung: false });
  assert.equal(w.ziel.ueberdeckung, "keine");
  assert.equal(w.ziel.marke, 1);
  assert.equal(w.ziel.soll, 220);
});

test("0.38.0: gefuettertWerte über der Tagesmenge: „Darüber“, Marke rückt nach links", () => {
  const w = werte(230);
  assert.deepEqual(w.ziel.kachel, { wort: "Darüber", kcal: 10, warnung: false });
  assert.equal(w.ziel.ueberdeckung, "grau");
  nahe(w.ziel.marke, 220 / 230);
});

test("0.38.0: gefuettertWerte: Bernstein erst über der Tagesmenge plus Spielraum aus GRENZEN", () => {
  const grenze = Math.round((1 + GRENZEN.spielraum) * 220);
  assert.equal(werte(grenze).ziel.ueberdeckung, "grau");
  assert.equal(werte(grenze).ziel.kachel.warnung, false);
  const drueber = werte(grenze + 1);
  assert.equal(drueber.ziel.ueberdeckung, "bernstein");
  assert.deepEqual(drueber.ziel.kachel, { wort: "Darüber", kcal: grenze + 1 - 220, warnung: true });
});

test("0.38.0: gefuettertWerte genau getroffen: „Noch 0 kcal“ (nie -0), vergangener Tag „Darunter 0 kcal“", () => {
  const w = werte(220);
  assert.deepEqual(w.ziel.kachel, { wort: "Noch", kcal: 0, warnung: false });
  assert.ok(Object.is(w.ziel.kachel.kcal, 0));
  assert.equal(w.ziel.ueberdeckung, "keine");
  const gestern = werte(220, { heute: "2026-11-06" });
  assert.deepEqual(gestern.ziel.kachel, { wort: "Darunter", kcal: 0, warnung: false });
  assert.ok(Object.is(gestern.ziel.kachel.kcal, 0));
  // Knapp darüber rundet auf 0: weder „-0“ noch „Darüber“.
  const knapp = gefuettertWerte({ mahlzeiten: [MZ("n", 220.4, "08:00")], futterNachId: SORTEN, freigabe, tag: "2026-11-05", heute: "2026-11-05" });
  assert.ok(Object.is(knapp.ziel.kachel.kcal, 0));
  assert.equal(knapp.ziel.kachel.wort, "Noch");
});

test("0.38.0: gefuettertWerte vergangener Tag unter der Tagesmenge: „Darunter 70 kcal“", () => {
  assert.deepEqual(werte(150, { heute: "2026-11-06" }).ziel.kachel, { wort: "Darunter", kcal: 70, warnung: false });
  // Ein künftiger Tag (falsche Geräteuhr) zählt wie heute.
  assert.equal(werte(150, { heute: "2026-11-04" }).ziel.kachel.wort, "Noch");
});

test("0.38.0: gefuettertWerte ohne Freigabe: kein Ziel, Arten trotzdem gefüllt", () => {
  const w = werte(211, { freigabe: null });
  assert.equal(w.ziel, null);
  assert.deepEqual(w.arten, [
    { typ: "nass", kcal: 111 },
    { typ: "trocken", kcal: 100 },
  ]);
  assert.equal(w.kcal, 211);
});

test("0.38.0: gefuettertWerte Mahlzeit mit gelöschter Sorte: kein Stück, Gramm zählen, „ca.“", () => {
  const w = gefuettertWerte({
    mahlzeiten: [MZ("n", 100, "08:00"), MZ("weg", 40, "09:00")],
    futterNachId: SORTEN,
    freigabe,
    tag: "2026-11-05",
    heute: "2026-11-05",
  });
  assert.equal(w.stuecke.length, 1);
  assert.deepEqual(w.stuecke[0], { typ: "nass", kcal: 100 });
  assert.equal(w.gramm, 140);
  assert.equal(w.kcal, 100);
  assert.equal(w.unsicher, true);
  assert.deepEqual(w.ziel.kachel, { wort: "Noch", kcal: 120, warnung: false });
});

test("0.38.0: gefuettertWerte Stücke in Mahlzeiten-Reihenfolge, Arten nass, trocken, leckerli", () => {
  const w = gefuettertWerte({
    mahlzeiten: [MZ("n", 89, "08:00"), MZ("t", 30, "12:00"), MZ("l", 1.5, "18:00")],
    futterNachId: SORTEN,
    freigabe,
    tag: "2026-11-05",
    heute: "2026-11-05",
  });
  assert.deepEqual(w.stuecke.map((s) => s.typ), ["nass", "trocken", "leckerli"]);
  assert.deepEqual(w.arten, [
    { typ: "nass", kcal: 89 },
    { typ: "trocken", kcal: 120 },
    { typ: "leckerli", kcal: 5 },
  ]);
  // Reihenfolge der Arten fest, auch wenn das Leckerli zuerst kam.
  const frueh = gefuettertWerte({
    mahlzeiten: [MZ("l", 1.5, "07:00"), MZ("n", 89, "08:00")],
    futterNachId: SORTEN,
    freigabe,
    tag: "2026-11-05",
    heute: "2026-11-05",
  });
  assert.deepEqual(frueh.stuecke.map((s) => s.typ), ["leckerli", "nass"]);
  assert.deepEqual(frueh.arten.map((a) => a.typ), ["nass", "leckerli"]);
  const nurNass = gefuettertWerte({ mahlzeiten: [MZ("n", 89, "08:00")], futterNachId: SORTEN, freigabe, tag: "2026-11-05", heute: "2026-11-05" });
  assert.equal(nurNass.arten.length, 1);
});

test("0.38.0: gefuettertWerte ohne Mahlzeit mit Freigabe: „Noch 220 kcal“, keine Stücke, keine Arten", () => {
  const w = gefuettertWerte({ mahlzeiten: [], futterNachId: SORTEN, freigabe, tag: "2026-11-05", heute: "2026-11-05" });
  assert.equal(w.kcal, 0);
  assert.equal(w.gramm, 0);
  assert.deepEqual(w.stuecke, []);
  assert.deepEqual(w.arten, []);
  assert.deepEqual(w.ziel.kachel, { wort: "Noch", kcal: 220, warnung: false });
  assert.equal(w.ziel.marke, 1);
});

// ---------- 0.39.0: „Letzte Messung“ mit Kurve und Tempo-Skala (Plan .planning/grafiken-auswahl.md, Stelle 2) ----------

const messung = (liste, freigaben = [], tag = "2026-11-05") => messungWerte({ gewichte: liste, freigaben, tag });

test("0.39.0: messungWerte ohne Gewicht: „keine“", () => {
  assert.deepEqual(messung([]), { art: "keine" });
});

test("0.39.0: messungWerte mit einem Gewicht oder zwei am selben Tag: „ohneVergleich“", () => {
  const eins = messung([G("2026-11-05", 6.12)]);
  assert.equal(eins.art, "ohneVergleich");
  assert.equal(eins.letzte.kg, 6.12);
  assert.equal(eins.letzte.datum, "2026-11-05");
  // Zwei am selben Tag: tempoRueckmeldung findet keine frühere, also kein Vergleich und kein NaN.
  const gleicherTag = messung([{ ...G("2026-11-05", 6.2), id: "a" }, { ...G("2026-11-05", 6.12), id: "b" }]);
  assert.equal(gleicherTag.art, "ohneVergleich");
  assert.equal(gleicherTag.diffG, undefined);
});

test("0.39.0: messungWerte mit Vergleich: Gramm, Datum davor, Tempo und Kurve", () => {
  const w = messung([G("2026-10-29", 6.24), G("2026-11-05", 6.12)]);
  assert.equal(w.art, "mitVergleich");
  assert.equal(w.letzte.kg, 6.12);
  assert.deepEqual(w.vorher, { datum: "2026-10-29", kg: 6.24 });
  assert.equal(w.diffG, -120);
  nahe(w.prozent, (0.12 / 6.24) * 100);
  nahe(w.prozent, 1.92, 0.01);
  assert.equal(w.bewertung, "neutral");
  assert.equal(w.kurve.length, 2);
  assert.deepEqual(w.kurve.map((g) => g.datum), ["2026-10-29", "2026-11-05"]);
});

test("0.39.0: messungWerte gleiches Gewicht: diffG ist 0, nicht -0", () => {
  const w = messung([G("2026-10-29", 6.12), G("2026-11-05", 6.12)]);
  assert.ok(Object.is(w.diffG, 0));
  // Winzige Zunahme, die auf 0 g rundet, ergibt ebenfalls 0 statt -0.
  assert.ok(Object.is(messung([G("2026-10-29", 6.1204), G("2026-11-05", 6.1201)]).diffG, 0));
});

test("0.39.0: messungWerte Vergleich mit einer Messung älter als 8 Wochen: keine Kurve", () => {
  const w = messung([G("2026-08-01", 6.6), G("2026-11-05", 6.12)]);
  assert.equal(w.art, "mitVergleich");
  assert.equal(w.vorher.datum, "2026-08-01");
  assert.equal(w.kurve, null);
});

test("0.39.0: messungWerte ohne Freigabe: über 2 % rot, darunter neutral; mit Freigabe gut", () => {
  const schnell = messung([G("2026-10-29", 6.24), G("2026-11-05", 6.084)]);
  nahe(schnell.prozent, 2.5);
  assert.equal(schnell.bewertung, "zu-schnell");
  const ruhig = messung([G("2026-10-29", 6.24), G("2026-11-05", 6.19)]);
  nahe(ruhig.prozent, 0.8, 0.01);
  assert.equal(ruhig.bewertung, "neutral");
  const mitFreigabe = messung([G("2026-10-29", 6.24), G("2026-11-05", 6.19)], [{ ...freigabe, datum: "2026-10-01" }]);
  assert.equal(mitFreigabe.bewertung, "gut");
});

test("0.39.0: messungWerte vergangener Tag: nur Messungen bis zu diesem Tag zählen für die Kurve", () => {
  // Die Liste ist schon bis zum Tag gefiltert (gewichteBis); die Kurve reicht 56 Tage vor den Tag zurück.
  const w = messung([G("2026-08-20", 6.6), G("2026-09-05", 6.5), G("2026-10-01", 6.4), G("2026-10-29", 6.24)], [], "2026-10-29");
  assert.deepEqual(w.kurve.map((g) => g.datum), ["2026-09-05", "2026-10-01", "2026-10-29"]);
  assert.equal(w.vorher.datum, "2026-10-01");
});

// ---------- 0.40.1: Funde der Gesamtprüfung ----------

// Beispiel aus der Prüfung: Freigabe 01.10., letzte Woche 1,0 %, im Mittel über 14 Tage aber über 2 %.
const MITTEL = [G("2026-11-01", 9.32), G("2026-11-08", 8.99), G("2026-11-15", 8.9)];
const MITTEL_FREIGABE = [{ ...freigabe, datum: "2026-10-01" }];

test("0.40.1: Beispiel der Prüfung: Warnung „zu schnell“ aktiv, letzte Woche allein „gut“", () => {
  const liste = warnungen({
    name: "Kito", tag: "2026-11-15", heute: "2026-11-15", kcal: 220, leckerli: 0,
    freigabe: MITTEL_FREIGABE[0], gewichte: MITTEL, fruehereMahlzeiten: true,
  });
  assert.ok(liste.some((w) => w.id === "zu-schnell"));
  const w = messungWerte({ gewichte: MITTEL, freigaben: MITTEL_FREIGABE, tag: "2026-11-15" });
  assert.equal(w.bewertung, "gut");
  assert.equal(w.mittelZuSchnell, false);
});

test("0.40.1: messungWerte mit mittelZuSchnell: Karte folgt der Warnung", () => {
  const w = messungWerte({ gewichte: MITTEL, freigaben: MITTEL_FREIGABE, tag: "2026-11-15", mittelZuSchnell: true });
  assert.equal(w.bewertung, "zu-schnell");
  assert.equal(w.mittelZuSchnell, true);
  nahe(w.prozent, 1.0, 0.01);
  // Letzte Woche selbst schon über 2 %: bleibt die eigene Bewertung, kein Hinweis aufs Mittel.
  const selbst = messungWerte({
    gewichte: [G("2026-10-29", 6.24), G("2026-11-05", 6.084)], freigaben: [], tag: "2026-11-05", mittelZuSchnell: true,
  });
  assert.equal(selbst.bewertung, "zu-schnell");
  assert.equal(selbst.mittelZuSchnell, false);
  // Ohne Vergleich bleibt alles wie bisher.
  assert.equal(messungWerte({ gewichte: [G("2026-11-05", 6.1)], freigaben: [], tag: "2026-11-05", mittelZuSchnell: true }).art, "ohneVergleich");
});

test("0.40.1: tempoZahl: nahe an den Grenzen zwei Stellen, in Richtung des Urteils gerundet", () => {
  assert.equal(tempoZahl(2.036), "2,04");
  assert.equal(tempoZahl(0.452), "0,45");
  assert.equal(tempoZahl(1.0), "1,0");
  assert.equal(tempoZahl(GRENZEN.abnahmeMax), "2,0");
  assert.equal(tempoZahl(GRENZEN.abnahmeMin), "0,5");
  // Gleitkomma genau an der Grenze (10 → 9,6 kg in 14 Tagen) bleibt „2,0“ und erlaubt.
  assert.equal(tempoZahl(((10 - 9.6) / 10 / 2) * 100), "2,0");
  // Knapp über 2 % nie „2,00“, knapp unter 0,5 % nie „0,50“.
  assert.equal(tempoZahl(2.0000001), "2,01");
  assert.equal(tempoZahl(0.4999), "0,49");
  // Im erlaubten Bereich nahe der Grenze: nach innen gerundet.
  assert.equal(tempoZahl(1.968), "1,96");
  assert.equal(tempoZahl(0.541), "0,55");
  // Weiter weg eine Stelle; Zunahme ohne Vorzeichen und ohne „-0“.
  assert.equal(tempoZahl(2.5), "2,5");
  assert.equal(tempoZahl(-0.452), "0,5");
  assert.equal(tempoZahl(-0.01), "0,0");
  // Die angezeigte Zahl steht nie auf der falschen Seite der Grenze.
  for (let p = 0.3; p < 2.3; p += 0.0013) {
    const z = Number(tempoZahl(p).replace(",", "."));
    if (p > GRENZEN.abnahmeMax + 1e-9) assert.ok(z > GRENZEN.abnahmeMax, `${p} → ${z}`);
    else if (p >= GRENZEN.abnahmeMin) assert.ok(z >= GRENZEN.abnahmeMin && z <= GRENZEN.abnahmeMax, `${p} → ${z}`);
    else assert.ok(z < GRENZEN.abnahmeMin, `${p} → ${z}`);
  }
});
