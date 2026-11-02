import { test } from "node:test";
import assert from "node:assert/strict";
import { FUTTERLISTE, nachrechnung, sucheFutter, ausListe, normalesFutterKcal } from "../js/futterliste.js";

test("normalesFutterKcal zählt Handelsfutter und eigene Sorten, aber kein Diätfutter und keine Leckerlis", () => {
  const futter = new Map([
    ["sheba", { typ: "nass", kcalPro100g: 71, listeId: "sheba-fresh-fine-huhn-gefluegel-truthahn" }],
    ["om", { typ: "nass", kcalPro100g: 75, listeId: "purina-om-nass" }],
    ["eigen", { typ: "trocken", kcalPro100g: 350 }],
    ["snack", { typ: "leckerli", kcalPro100g: 416, listeId: "dreamies-huhn" }],
  ]);
  const mahlzeiten = [
    { futterId: "sheba", gramm: 100 },
    { futterId: "om", gramm: 100 },
    { futterId: "eigen", gramm: 10 },
    { futterId: "snack", gramm: 5 },
  ];
  assert.equal(normalesFutterKcal(mahlzeiten, futter), 71 + 35);
});

test("jeder Eintrag ist vollständig und hat eine Quelle mit Datum", () => {
  for (const e of FUTTERLISTE) {
    assert.match(e.id, /^[a-z0-9-]+$/, e.id);
    assert.ok(e.name.length > 3, e.id);
    assert.ok(["nass", "trocken", "leckerli"].includes(e.typ), e.id);
    assert.equal(typeof e.diaet, "boolean", e.id);
    assert.ok(["hersteller", "geschaetzt"].includes(e.kcalQuelle), e.id);
    assert.ok(e.kcalPro100g >= 20 && e.kcalPro100g <= 700, e.id);
    for (const feld of ["protein", "fett", "asche", "faser"]) assert.equal(typeof e.analyse[feld], "number", e.id);
    assert.ok(e.analyse.feuchte === null || typeof e.analyse.feuchte === "number", e.id);
    assert.ok(e.quelle.length > 3, e.id);
    assert.match(e.url, /^https:\/\//, e.id);
    assert.match(e.abgerufen, /^\d{4}-\d{2}-\d{2}$/, e.id);
    assert.equal(typeof e.hinweis, "string", e.id);
  }
});

test("die Kennungen sind eindeutig", () => {
  const ids = FUTTERLISTE.map((e) => e.id);
  assert.equal(new Set(ids).size, ids.length);
});

test("Nassfutter nennt immer die Feuchte", () => {
  for (const e of FUTTERLISTE.filter((e) => e.typ === "nass")) assert.equal(typeof e.analyse.feuchte, "number", e.id);
});

test("Herstellerwerte passen zur Nachrechnung (höchstens 10 % Abweichung)", () => {
  for (const e of FUTTERLISTE.filter((e) => e.kcalQuelle === "hersteller")) {
    const abweichung = Math.abs(nachrechnung(e) - e.kcalPro100g) / e.kcalPro100g;
    assert.ok(abweichung <= 0.1, `${e.id}: ${nachrechnung(e).toFixed(1)} statt ${e.kcalPro100g}`);
  }
});

test("geschätzte Werte sind genau die gerundete Nachrechnung", () => {
  for (const e of FUTTERLISTE.filter((e) => e.kcalQuelle === "geschaetzt")) {
    assert.equal(e.kcalPro100g, Math.round(nachrechnung(e)), e.id);
  }
});

test("Kitos Sorten stehen mit den bisherigen Werten in der Liste", () => {
  const sheba = FUTTERLISTE.find((e) => e.id === "sheba-fresh-fine-huhn-gefluegel-truthahn");
  const purina = FUTTERLISTE.find((e) => e.id === "purina-one-light-trocken");
  assert.equal(sheba.kcalPro100g, 71);
  assert.equal(purina.kcalPro100g, 327.5);
});

test("Suche findet Einträge über mehrere Wörter, ohne auf Groß-/Kleinschreibung zu achten", () => {
  assert.deepEqual(
    sucheFutter("hill metab").map((e) => e.id),
    ["hills-metabolic-trocken", "hills-metabolic-nass"]
  );
  assert.equal(sucheFutter("").length, FUTTERLISTE.length);
  assert.equal(sucheFutter("gibt es nicht").length, 0);
});

test("Übernehmen erzeugt eine eigene Sorte mit Quelle, Stand und Diät-Hinweis", () => {
  const eintrag = FUTTERLISTE.find((e) => e.id === "purina-om-trocken");
  const futter = ausListe(eintrag, "id-1");
  assert.deepEqual(
    { ...futter, notiz: undefined },
    {
      id: "id-1",
      listeId: "purina-om-trocken",
      name: eintrag.name,
      typ: "trocken",
      kcalPro100g: 340,
      kcalQuelle: "hersteller",
      notiz: undefined,
    }
  );
  assert.match(futter.notiz, /^Diätfutter – nur nach Rücksprache mit dem Tierarzt\./);
  assert.match(futter.notiz, /Protein 48 %, Fett 8 %, Asche 8 %, Faser 8 %, Feuchte nicht angegeben/);
  assert.match(futter.notiz, /Stand 02\.11\.2026\. Bei Abweichung gilt die Packung\.$/);
});

test("geschätzte Sorten sagen in der Notiz, dass der Wert berechnet ist", () => {
  const futter = ausListe(FUTTERLISTE.find((e) => e.id === "animonda-carny-adult-rind"), "x");
  assert.equal(futter.kcalQuelle, "geschaetzt");
  assert.match(futter.notiz, /Feuchte 79 %/);
  assert.match(futter.notiz, /aus den Bestandteilen berechnet/);
  assert.doesNotMatch(futter.notiz, /Diätfutter/);
});
