// „Besonderer Tag“ (0.33.0): Regeln für Ereignisse und Phasen. Beispiele aus dem Alltag einer Wohnungskatze.
// Plan: .planning/besonderer-tag-umsetzung.md, Aufgabe 2.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  BESONDERE_ARTEN,
  NOTIZ_MAX,
  artVon,
  betrifftTag,
  eintraegeAm,
  imZeitraum,
  zeitraumText,
  eintragAusFormular,
  beenden,
  notfallJetzt,
} from "../js/besondere-tage.js";

const HEUTE = "2026-11-05";
let zaehler = 0;
const B = (felder) => ({ id: `b${++zaehler}`, tierId: "kito", art: "krank", von: "2026-11-03", bis: "2026-11-03", notiz: "", ...felder });

test("BESONDERE_ARTEN: acht Arten in fester Reihenfolge, Texte wie in der Spezifikation", () => {
  assert.deepEqual(
    BESONDERE_ARTEN.map((a) => a.text),
    [
      "Mehr Bewegung",
      "Weniger Bewegung",
      "Krank",
      "Futter verweigert",
      "Außer der Reihe genascht",
      "Auffälligkeit beim Fressen",
      "Futterumstellung",
      "Sonstiges",
    ],
  );
  assert.equal(artVon("krank").ende, "Wieder gesund");
  assert.equal(artVon("genascht").hinweis, "Die Menge musst du nicht wissen.");
  assert.equal(artVon("sonstiges").notizPflicht, true);
  assert.equal(artVon("futter-verweigert").notfall, true);
  assert.equal(NOTIZ_MAX, 200);
});

test("artVon: unbekannte Art aus einer neueren Fassung heißt „Sonstiges“", () => {
  assert.equal(artVon("zukunft-art").text, "Sonstiges");
  assert.equal(artVon(undefined).text, "Sonstiges");
});

test("betrifftTag: ein Tag, eine abgeschlossene und eine laufende Phase", () => {
  const tag = B({ von: "2026-11-03", bis: "2026-11-03" });
  assert.equal(betrifftTag(tag, "2026-11-03"), true);
  assert.equal(betrifftTag(tag, "2026-11-04"), false);
  const phase = B({ von: "2026-11-01", bis: "2026-11-03" });
  for (const t of ["2026-11-01", "2026-11-02", "2026-11-03"]) assert.equal(betrifftTag(phase, t), true, t);
  for (const t of ["2026-10-31", "2026-11-04"]) assert.equal(betrifftTag(phase, t), false, t);
  const laufend = B({ von: "2026-11-03", bis: null });
  assert.equal(betrifftTag(laufend, "2026-11-05"), true);
  assert.equal(betrifftTag(laufend, "2026-11-20"), true);
  assert.equal(betrifftTag(laufend, "2026-11-02"), false);
});

test("eintraegeAm: nur das gezeigte Tier, nach Beginn sortiert", () => {
  const liste = [
    B({ id: "spaeter", von: "2026-11-05", bis: "2026-11-05" }),
    B({ id: "zuki", tierId: "zuki", von: "2026-11-05", bis: "2026-11-05" }),
    B({ id: "laufend", von: "2026-11-01", bis: null }),
    B({ id: "vorbei", von: "2026-11-01", bis: "2026-11-02" }),
  ];
  assert.deepEqual(eintraegeAm(liste, "kito", "2026-11-05").map((b) => b.id), ["laufend", "spaeter"]);
  assert.deepEqual(eintraegeAm(liste, "zuki", "2026-11-05").map((b) => b.id), ["zuki"]);
});

test("imZeitraum: alles, was den Zeitraum berührt, auch Phasen von davor und laufende", () => {
  const liste = [
    B({ id: "hinein", von: "2026-10-28", bis: "2026-11-02" }),
    B({ id: "lang", von: "2026-09-01", bis: null }),
    B({ id: "davor", von: "2026-10-31", bis: "2026-10-31" }),
    B({ id: "drin", von: "2026-11-04", bis: "2026-11-04" }),
    B({ id: "fremd", tierId: "zuki", von: "2026-11-02", bis: "2026-11-02" }),
  ];
  assert.deepEqual(imZeitraum(liste, "kito", "2026-11-01", HEUTE).map((b) => b.id), ["lang", "hinein", "drin"]);
  assert.deepEqual(imZeitraum(liste, "kito", null, "2026-10-31").map((b) => b.id), ["lang", "hinein", "davor"]);
});

test("zeitraumText: ein Tag, laufend, Phase im Monat, über den Monat und über das Jahr", () => {
  assert.equal(zeitraumText(B({ von: "2026-11-03", bis: "2026-11-03" })), "Di., 3. Nov.");
  assert.equal(zeitraumText(B({ von: "2026-11-03", bis: null })), "seit Di., 3. Nov.");
  assert.equal(zeitraumText(B({ von: "2026-11-01", bis: "2026-11-03" })), "1. bis 3. Nov.");
  assert.equal(zeitraumText(B({ von: "2026-10-30", bis: "2026-11-02" })), "30. Okt. bis 2. Nov.");
  assert.equal(zeitraumText(B({ von: "2026-12-30", bis: "2027-01-02" })), "30. Dez. 2026 bis 2. Jan. 2027");
});

// Werte wie aus dem Formular: Texte, Häkchen als true/false.
const F = (felder) => ({ art: "krank", von: "2026-11-03", mehrere: false, bis: "", notiz: "", ...felder });

test("eintragAusFormular: ein Tag, laufende Phase und abgeschlossene Phase", () => {
  assert.deepEqual(eintragAusFormular(F({ notiz: "  erbrochen  " }), HEUTE), {
    eintrag: { art: "krank", von: "2026-11-03", bis: "2026-11-03", notiz: "erbrochen" },
  });
  assert.deepEqual(eintragAusFormular(F({ mehrere: true }), HEUTE).eintrag.bis, null);
  assert.deepEqual(eintragAusFormular(F({ mehrere: true, bis: "2026-11-04" }), HEUTE).eintrag.bis, "2026-11-04");
  assert.deepEqual(eintragAusFormular(F({ mehrere: true, bis: "2026-11-03" }), HEUTE).eintrag.bis, "2026-11-03");
});

test("eintragAusFormular: Häkchen aus macht eine Phase zu einem Tag am Startdatum", () => {
  // z. B. beim Ändern einer laufenden Phase: „Dauert mehrere Tage“ abgehakt, das alte „bis“ steht noch im Feld.
  assert.equal(eintragAusFormular(F({ mehrere: false, bis: "2026-11-05" }), HEUTE).eintrag.bis, "2026-11-03");
});

test("eintragAusFormular: alle Fehler mit ihrem Text", () => {
  const fehler = (felder) => eintragAusFormular(F(felder), HEUTE).fehler;
  assert.equal(fehler({ art: "" }), "Bitte wähle aus, was an diesem Tag besonders war.");
  assert.equal(fehler({ art: "zukunft-art" }), "Bitte wähle aus, was an diesem Tag besonders war.");
  assert.equal(fehler({ von: "" }), "Bitte ein Datum angeben.");
  assert.equal(fehler({ von: "2026-11-06" }), "Das Datum darf nicht in der Zukunft liegen.");
  assert.equal(fehler({ mehrere: true, bis: "2026-11-02" }), "„bis“ darf nicht vor dem Startdatum liegen.");
  assert.equal(fehler({ mehrere: true, bis: "2026-11-06" }), "„bis“ darf nicht in der Zukunft liegen.");
  assert.equal(fehler({ notiz: "x".repeat(201) }), "Die Notiz darf höchstens 200 Zeichen lang sein.");
  assert.equal(fehler({ notiz: "x".repeat(200) }), undefined);
  assert.equal(fehler({ art: "sonstiges", notiz: "   " }), "Bitte schreib bei „Sonstiges“ kurz dazu, was war.");
  assert.equal(fehler({ art: "sonstiges", notiz: "Tierarzt-Termin verschoben" }), undefined);
});

test("eintragAusFormular: Startdatum hinter „bis“ geschoben ist ein Fehler", () => {
  assert.equal(
    eintragAusFormular(F({ von: "2026-11-05", mehrere: true, bis: "2026-11-04" }), HEUTE).fehler,
    "„bis“ darf nicht vor dem Startdatum liegen.",
  );
});

test("beenden: setzt das Ende auf den gezeigten Tag, nie vor den Beginn", () => {
  const krank = B({ von: "2026-11-03", bis: null });
  beenden(krank, "2026-11-05");
  assert.equal(krank.bis, "2026-11-05");
  const frueh = B({ von: "2026-11-03", bis: null });
  beenden(frueh, "2026-11-01");
  assert.equal(frueh.bis, "2026-11-03");
});

test("notfallJetzt: nur „Futter verweigert“ von heute, gestern oder noch laufend, nur für dieses Tier", () => {
  const v = (felder) => B({ art: "futter-verweigert", ...felder });
  assert.equal(notfallJetzt([v({ von: "2026-11-05", bis: "2026-11-05" })], "kito", HEUTE), true);
  assert.equal(notfallJetzt([v({ von: "2026-11-03", bis: "2026-11-04" })], "kito", HEUTE), true); // bis gestern
  assert.equal(notfallJetzt([v({ von: "2026-11-02", bis: "2026-11-03" })], "kito", HEUTE), false); // bis vorgestern
  assert.equal(notfallJetzt([v({ von: "2026-10-26", bis: null })], "kito", HEUTE), true); // läuft seit 10 Tagen
  assert.equal(notfallJetzt([v({ von: "2026-10-31", bis: "2026-10-31" })], "kito", HEUTE), false); // vor 5 Tagen nachgetragen
  assert.equal(notfallJetzt([v({ tierId: "zuki", von: "2026-11-05", bis: "2026-11-05" })], "kito", HEUTE), false);
  assert.equal(notfallJetzt([B({ art: "krank", von: "2026-11-05", bis: null })], "kito", HEUTE), false);
  assert.equal(notfallJetzt([], "kito", HEUTE), false);
});

test("notfallJetzt: gestern über den Monatswechsel", () => {
  const v = B({ art: "futter-verweigert", von: "2026-10-31", bis: "2026-10-31" });
  assert.equal(notfallJetzt([v], "kito", "2026-11-01"), true);
  assert.equal(notfallJetzt([v], "kito", "2026-11-02"), false);
});
