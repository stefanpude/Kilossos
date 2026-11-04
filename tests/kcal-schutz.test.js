// kJ-Schutz und kcal-Rechner im Fenster „Eigene Sorte“ (0.32.0, Plan .planning/kcal-rechner-kj.md).
import { test } from "node:test";
import assert from "node:assert/strict";
import { kcalPruefen, kcalKasten, rechnerPruefen, KCAL_GRENZEN } from "../js/rechnen.js";
import { FUTTERLISTE } from "../js/futterliste.js";

const NBSP = " ";
// Zwischen Zahl und Einheit darf kein normales Leerzeichen stehen, sonst bricht „100“ / „g“ um.
const ohneUmbruch = (text) => assert.doesNotMatch(text, /\d (kcal|kJ|g\b|%)/, text);

// ---------- Prüfung des kcal-Werts ----------

test("Grenzen: Nass 150, Trocken und Leckerli 450, 20 bis 700", () => {
  assert.deepEqual(KCAL_GRENZEN, { min: 20, max: 700, nass: 150, trocken: 450, leckerli: 450 });
});

test("Nass 307 (Bozita, kJ auf der Packung) → Rückfrage mit 73,4 und 30,7", () => {
  assert.deepEqual(kcalPruefen(307, "nass"), { stufe: "rueckfrage", kj: 73.4, proKg: 30.7 });
});

test("Nass 607 (kcal pro kg) → Rückfrage mit 60,7 und 145,1", () => {
  assert.deepEqual(kcalPruefen(607, "nass"), { stufe: "rueckfrage", kj: 145.1, proKg: 60.7 });
});

test("Genau auf der Grenze ist in Ordnung", () => {
  assert.equal(kcalPruefen(150, "nass").stufe, "ok");
  assert.equal(kcalPruefen(150.1, "nass").stufe, "rueckfrage");
  assert.equal(kcalPruefen(450, "trocken").stufe, "ok");
  assert.equal(kcalPruefen(451, "trocken").stufe, "rueckfrage");
  assert.equal(kcalPruefen(438, "leckerli").stufe, "ok");
  assert.equal(kcalPruefen(20, "nass").stufe, "ok");
  assert.equal(kcalPruefen(700, "trocken").stufe, "rueckfrage");
});

test("Trocken 1370 (kJ) → unmöglich, 327,4 und 137", () => {
  assert.deepEqual(kcalPruefen(1370, "trocken"), { stufe: "unmoeglich", kj: 327.4, proKg: 137 });
});

test("Nass 160 → nur die kJ-Umrechnung, 16 wäre zu wenig", () => {
  assert.deepEqual(kcalPruefen(160, "nass"), { stufe: "rueckfrage", kj: 38.2, proKg: null });
});

test("19 und keine Zahl → Fehler; 701 → unmöglich; 8000 → unmöglich ohne Umrechnung", () => {
  assert.equal(kcalPruefen(19, "nass").stufe, "fehler");
  assert.equal(kcalPruefen(null, "nass").stufe, "fehler");
  assert.deepEqual(kcalPruefen(701, "nass"), { stufe: "unmoeglich", kj: 167.5, proKg: 70.1 });
  assert.deepEqual(kcalPruefen(8000, "trocken"), { stufe: "unmoeglich", kj: null, proKg: null });
});

test("Ohne Art wird nicht nach der Einheit gefragt", () => {
  assert.equal(kcalPruefen(307, "").stufe, "ok");
  assert.equal(kcalPruefen(19, "").stufe, "fehler");
});

test("Kein Fehlalarm bei einer Sorte der Kilossos-Futterliste", () => {
  for (const sorte of FUTTERLISTE) assert.equal(kcalPruefen(sorte.kcalPro100g, sorte.typ).stufe, "ok", sorte.id);
});

// ---------- Texte im roten Kasten ----------

test("Kasten bei Nass 307: Überschrift, Spanne der Liste, Hinweis auf Trockenfutter, drei Antworten", () => {
  const k = kcalKasten(307, "nass", [61, 126]);
  assert.equal(k.stufe, "rueckfrage");
  assert.equal(k.ueberschrift, `307${NBSP}kcal pro 100${NBSP}g sind für Nassfutter viel zu viel.`);
  assert.deepEqual(k.saetze, [
    `Nassfutter hat in der Kilossos-Futterliste 61 bis 126${NBSP}kcal. Was steht auf der Packung hinter der 307?`,
    "Ist es Trockenfutter? Dann ändere oben die Art.",
  ]);
  assert.deepEqual(k.antworten, [
    { aktion: "kcal-kj", wert: 73.4, titel: "Dort steht kJ", klein: `Kilossos trägt 73,4${NBSP}kcal ein` },
    { aktion: "kcal-kg", wert: 30.7, titel: "Dort steht kcal pro kg", klein: `Kilossos trägt 30,7${NBSP}kcal ein` },
    { aktion: "kcal-stimmt", titel: `Dort steht kcal pro 100${NBSP}g`, klein: "Die 307 stimmen, so speichern" },
  ]);
});

test("Kasten bei Nass 500: kein Hinweis auf Trockenfutter (das wäre auch zu viel)", () => {
  const k = kcalKasten(500, "nass", [61, 126]);
  assert.equal(k.saetze.length, 1);
});

test("Kasten bei Trocken 1370: unmöglich, ohne „stimmt so“", () => {
  const k = kcalKasten(1370, "trocken", [304, 396]);
  assert.equal(k.stufe, "unmoeglich");
  assert.equal(k.ueberschrift, `Mehr als 700${NBSP}kcal pro 100${NBSP}g kann Kilossos nicht speichern.`);
  assert.deepEqual(k.saetze, ["Was steht auf der Packung hinter der 1370?"]);
  assert.deepEqual(k.antworten.map((a) => a.aktion), ["kcal-kj", "kcal-kg"]);
  assert.equal(k.antworten[0].klein, `Kilossos trägt 327,4${NBSP}kcal ein`);
  assert.equal(k.antworten[1].klein, `Kilossos trägt 137${NBSP}kcal ein`);
});

test("Kasten bei 8000: passt zu keiner Einheit, keine Antworten", () => {
  const k = kcalKasten(8000, "trocken", [304, 396]);
  assert.deepEqual(k.saetze, ["Diese Zahl passt zu keiner Einheit. Bitte vergleiche sie mit der Packung."]);
  assert.deepEqual(k.antworten, []);
});

test("Kasten bei Nass 160: nur kJ und „stimmt so“", () => {
  assert.deepEqual(kcalKasten(160, "nass", [61, 126]).antworten.map((a) => a.aktion), ["kcal-kj", "kcal-stimmt"]);
});

test("Kasten bei Leckerli und Trockenfutter: Art im Text", () => {
  const l = kcalKasten(500, "leckerli", [328, 438]);
  assert.equal(l.ueberschrift, `500${NBSP}kcal pro 100${NBSP}g sind für Leckerli viel zu viel.`);
  assert.match(l.saetze[0], /^Leckerli haben in der Kilossos-Futterliste 328 bis 438/);
  const t = kcalKasten(451, "trocken", [304, 396]);
  assert.match(t.ueberschrift, /für Trockenfutter viel zu viel/);
  assert.match(t.saetze[0], /^Trockenfutter hat in der Kilossos-Futterliste 304 bis 396/);
});

test("Kein Kasten, wenn der Wert passt", () => {
  assert.equal(kcalKasten(77, "nass", [61, 126]), null);
  assert.equal(kcalKasten(19, "nass", [61, 126]), null);
});

test("Kommazahl im Kasten mit Komma", () => {
  const k = kcalKasten(307.5, "nass", [61, 126]);
  assert.match(k.ueberschrift, /^307,5/);
  assert.match(k.saetze[0], /hinter der 307,5\?/);
});

test("Kasten-Texte brechen nicht zwischen Zahl und Einheit um", () => {
  for (const [kcal, typ] of [[307, "nass"], [1370, "trocken"], [8000, "trocken"], [500, "leckerli"]]) {
    const k = kcalKasten(kcal, typ, [61, 126]);
    for (const text of [k.ueberschrift, ...k.saetze, ...k.antworten.flatMap((a) => [a.titel, a.klein])]) ohneUmbruch(text);
  }
});

// ---------- Rechner „Keine kcal auf der Packung?“ ----------

const SHEBA = { protein: "7,9", fett: "4,4", asche: "1,4", faser: "0,3", feuchte: "84" };
const PURINA = { protein: "37", fett: "9,5", asche: "7,5", faser: "6", feuchte: "" };

test("Rechner: Sheba als Nassfutter → etwa 77 kcal", () => {
  assert.deepEqual(rechnerPruefen(SHEBA, "nass"), {
    art: "ergebnis",
    kcal: 77,
    analyse: { protein: 7.9, fett: 4.4, asche: 1.4, faser: 0.3, feuchte: 84 },
    angenommen: false,
    viel: false,
    uebernehmbar: true,
  });
});

test("Rechner: Purina ohne Feuchte als Trockenfutter → 346, Feuchte 8 % angenommen", () => {
  const r = rechnerPruefen(PURINA, "trocken");
  assert.equal(r.art, "ergebnis");
  assert.equal(r.kcal, 346);
  assert.equal(r.angenommen, true);
  assert.equal(r.analyse.feuchte, null);
});

test("Rechner: ohne Feuchte bei Nassfutter → Fehler", () => {
  assert.deepEqual(rechnerPruefen(PURINA, "nass"), { art: "feuchteFehlt" });
});

test("Rechner: 79 statt 7,9 → zusammen 169,1 %", () => {
  assert.deepEqual(rechnerPruefen({ ...SHEBA, protein: "79" }, "nass"), { art: "zuViel", summe: 169.1, angenommen: false });
});

test("Rechner: Summe genau 100 trotz Kommazahlen ist erlaubt", () => {
  // 10,3 + 5,9 + 2,1 + 0,3 + 81,4 ergibt in JavaScript 100,00000000000001.
  const werte = { protein: "10,3", fett: "5,9", asche: "2,1", faser: "0,3", feuchte: "81,4" };
  assert.equal(rechnerPruefen(werte, "nass").art, "ergebnis");
});

test("Rechner: Feuchte 100 → kein Teilen durch null", () => {
  const nullen = { protein: "0", fett: "0", asche: "0", faser: "0", feuchte: "100" };
  assert.deepEqual(rechnerPruefen(nullen, "nass"), { art: "feuchte100" });
  assert.equal(rechnerPruefen({ ...SHEBA, feuchte: "100" }, "nass").art, "zuViel");
});

test("Rechner: leere Pflichtfelder und Text statt Zahl", () => {
  assert.deepEqual(rechnerPruefen({ ...SHEBA, protein: "" }, "nass"), { art: "leer", leer: ["Protein"] });
  assert.deepEqual(rechnerPruefen({ ...SHEBA, protein: " ", fett: "" }, "nass"), { art: "leer", leer: ["Protein", "Fett"] });
  assert.deepEqual(rechnerPruefen({ ...SHEBA, faser: "< 0,5" }, "nass"), { art: "keineZahl", felder: ["faser"] });
});

test("Rechner: alle Felder leer → nichts", () => {
  assert.deepEqual(rechnerPruefen({ protein: "", fett: "", asche: "", faser: "", feuchte: "" }, "nass"), { art: "nichts" });
  assert.deepEqual(rechnerPruefen({ protein: "", fett: "", asche: "", faser: "", feuchte: "" }, ""), { art: "nichts" });
});

test("Rechner: Prozentzeichen und Punkt werden verstanden", () => {
  const r = rechnerPruefen({ protein: "7.9 %", fett: "4,4%", asche: "1,4", faser: "0,3", feuchte: "84 %" }, "nass");
  assert.equal(r.kcal, 77);
});

test("Rechner: viel für die Art → Zusatzhinweis, Ergebnis bleibt", () => {
  const roh = { protein: "18", fett: "15", asche: "1", faser: "0", feuchte: "65" };
  const r = rechnerPruefen(roh, "nass");
  assert.equal(r.art, "ergebnis");
  assert.ok(r.kcal > 150);
  assert.equal(r.viel, true);
  assert.equal(rechnerPruefen(roh, "trocken").viel, false);
});

// ---------- Datenformat: futter[i].analyse (freiwillig, VERSION bleibt 1) ----------
import { laden, speichern, analyseGueltig, analyseBereinigen } from "../js/daten.js";
import { sicherungPruefen } from "../js/sicherung.js";

function speicher() {
  const inhalt = new Map();
  return { getItem: (s) => (inhalt.has(s) ? inhalt.get(s) : null), setItem: (s, w) => inhalt.set(s, String(w)) };
}

const GUT = { protein: 7.9, fett: 4.4, asche: 1.4, faser: 0.3, feuchte: 84 };

function datenMit(...analysen) {
  return {
    version: 1,
    tiere: [{ id: "t1", name: "Kito", art: "katze", kastriert: true }],
    futter: analysen.map((analyse, i) => ({ id: `f${i}`, name: `Sorte ${i}`, typ: "nass", kcalPro100g: 77, kcalQuelle: "geschaetzt", notiz: "", analyse })),
    mahlzeiten: [],
    gewichte: [],
    freigaben: [],
  };
}

test("analyseGueltig: Packungswerte, Feuchte darf fehlen", () => {
  assert.equal(analyseGueltig(GUT), true);
  assert.equal(analyseGueltig({ ...GUT, feuchte: null }), true);
  assert.equal(analyseGueltig({ protein: 37, fett: 9.5, asche: 7.5, faser: 6, feuchte: null }), true);
  assert.equal(analyseGueltig({ protein: 10.3, fett: 5.9, asche: 2.1, faser: 0.3, feuchte: 81.4 }), true);
});

test("analyseGueltig: Text, Werte über 100, Summe über 100, fehlendes Protein, Feuchte 100", () => {
  assert.equal(analyseGueltig("7,9"), false);
  assert.equal(analyseGueltig(null), false);
  assert.equal(analyseGueltig([GUT]), false);
  assert.equal(analyseGueltig({ ...GUT, protein: "7,9" }), false);
  assert.equal(analyseGueltig({ ...GUT, protein: 120, feuchte: null }), false);
  assert.equal(analyseGueltig({ ...GUT, protein: -1 }), false);
  assert.equal(analyseGueltig({ ...GUT, protein: 79 }), false);
  assert.equal(analyseGueltig({ fett: 4.4, asche: 1.4, faser: 0.3, feuchte: 84 }), false);
  assert.equal(analyseGueltig({ protein: 0, fett: 0, asche: 0, faser: 0, feuchte: 100 }), false);
  assert.equal(analyseGueltig({ ...GUT, feuchte: Number.NaN }), false);
});

test("Sicherung einlesen: gültiges analyse bleibt, ungültiges wird entfernt, die Sorte bleibt", () => {
  const neu = datenMit(GUT, { ...GUT, protein: 79 }, "kaputt");
  const pruefung = sicherungPruefen(neu, "2026-11-05");
  assert.equal(pruefung.angaben, 2);
  assert.equal(neu.futter.length, 3);
  assert.deepEqual(neu.futter[0].analyse, GUT);
  assert.equal("analyse" in neu.futter[1], false);
  assert.equal("analyse" in neu.futter[2], false);
});

test("laden() entfernt ungültiges analyse auch, zweiter Durchlauf ändert nichts", () => {
  const s = speicher();
  speichern(datenMit(GUT, { ...GUT, feuchte: 100 }), s);
  const daten = laden(s);
  assert.deepEqual(daten.futter[0].analyse, GUT);
  assert.equal("analyse" in daten.futter[1], false);
  assert.equal(analyseBereinigen(daten), 0);
});

test("Sorten ohne analyse bleiben unberührt", () => {
  const neu = datenMit(GUT);
  delete neu.futter[0].analyse;
  assert.equal(analyseBereinigen(neu), 0);
  assert.equal("analyse" in neu.futter[0], false);
});

// ---------- Nach dem Review (05.11.2026) ----------

test("Rechner: Summe knapp über 100 wird aufgerundet genannt, nie „100 %, mehr als 100 %“", () => {
  const werte = { protein: "10,31", fett: "5,9", asche: "2,1", faser: "0,3", feuchte: "81,4" };
  assert.deepEqual(rechnerPruefen(werte, "nass"), { art: "zuViel", summe: 100.1, angenommen: false });
  assert.deepEqual(rechnerPruefen({ ...SHEBA, protein: "79" }, "nass"), { art: "zuViel", summe: 169.1, angenommen: false });
});

test("Rechner: über 100 mit angenommener Feuchte sagt, dass 8 % angenommen sind", () => {
  const snack = { protein: "75", fett: "15", asche: "5", faser: "1", feuchte: "" };
  assert.deepEqual(rechnerPruefen(snack, "leckerli"), { art: "zuViel", summe: 104, angenommen: true });
});

test("Rechner: riesige Zahl ist keine Zahl (kein „Infinity %“)", () => {
  assert.deepEqual(rechnerPruefen({ ...SHEBA, protein: "9".repeat(400) }, "nass"), { art: "keineZahl", felder: ["protein"] });
});

test("Rechner: „7,“ beim Tippen gilt als 7, nicht als Fehler", () => {
  assert.equal(rechnerPruefen({ ...SHEBA, protein: "7," }, "nass").art, "ergebnis");
});

test("Rechner: Ergebnis außerhalb 20 bis 700 lässt sich nicht übernehmen", () => {
  assert.equal(rechnerPruefen(SHEBA, "nass").uebernehmbar, true);
  const fett = { protein: "30", fett: "70", asche: "0", faser: "0", feuchte: "0" };
  assert.equal(rechnerPruefen(fett, "trocken").uebernehmbar, false);
  const faser = { protein: "0", fett: "0", asche: "0", faser: "100", feuchte: "" };
  assert.equal(rechnerPruefen(faser, "trocken").art, "zuViel"); // 100 + 8 angenommen
  const faser0 = { protein: "0", fett: "0", asche: "0", faser: "100", feuchte: "0" };
  assert.equal(rechnerPruefen(faser0, "trocken").uebernehmbar, false);
});
