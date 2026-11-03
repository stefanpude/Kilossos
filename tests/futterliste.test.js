import { test } from "node:test";
import assert from "node:assert/strict";
import {
  FUTTERLISTE,
  nachrechnung,
  sucheFutter,
  ausListe,
  normalesFutterKcal,
  eanGueltig,
  eanAusEingabe,
  findeNachEan,
  eanBereinigen,
} from "../js/futterliste.js";

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

test("eanGueltig prüft Länge und Prüfziffer (EAN-13 und EAN-8)", () => {
  assert.equal(eanGueltig("4770608260286"), true); // Sheba Megapack
  assert.equal(eanGueltig("4770608260287"), false);
  assert.equal(eanGueltig("96385074"), true);
  assert.equal(eanGueltig("477060826028"), false);
  assert.equal(eanGueltig(4770608260286), false);
});

test("EAN-Nummern sind gültig und gehören nur zu einem Eintrag", () => {
  const gesehen = new Map();
  for (const e of FUTTERLISTE.filter((e) => e.ean !== undefined)) {
    assert.ok(Array.isArray(e.ean) && e.ean.length > 0, e.id);
    for (const ean of e.ean) {
      assert.ok(eanGueltig(ean), `${e.id}: ${ean}`);
      assert.ok(!gesehen.has(ean), `${ean} bei ${gesehen.get(ean)} und ${e.id}`);
      gesehen.set(ean, e.id);
    }
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

test("Kitos Sorten stehen mit den Werten ihrer Packungen in der Liste", () => {
  const sheba = FUTTERLISTE.find((e) => e.id === "sheba-fresh-fine-huhn-gefluegel-truthahn");
  const purina = FUTTERLISTE.find((e) => e.id === "purina-one-light-trocken");
  assert.equal(sheba.kcalPro100g, 77); // Umkarton, Foto vom 03.11.2026
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

// ---------- Strichcode-Scanner (0.22.0) ----------

test("eanAusEingabe macht aus Scan oder Eingabe eine gültige EAN-13 oder EAN-8, sonst null", () => {
  assert.equal(eanAusEingabe("4770608260286"), "4770608260286");
  assert.equal(eanAusEingabe(" 4 770608 260286 "), "4770608260286"); // abgetippt mit Leerzeichen
  assert.equal(eanAusEingabe("4770608-260286"), "4770608260286");
  assert.equal(eanAusEingabe("052742918709"), "0052742918709"); // UPC-A (12 Stellen) aus dem Scanner
  assert.equal(eanAusEingabe("96385074"), "96385074");
  assert.equal(eanAusEingabe("4770608260287"), null); // falsche Prüfziffer
  assert.equal(eanAusEingabe("12345"), null);
  assert.equal(eanAusEingabe(""), null);
  assert.equal(eanAusEingabe(undefined), null);
});

test("findeNachEan findet Kitos Sheba zuerst in seiner eigenen Liste (Kopie über listeId)", () => {
  const eigene = [{ id: "sheba", listeId: "sheba-fresh-fine-huhn-gefluegel-truthahn", name: "Sheba" }];
  const treffer = findeNachEan("4770608260286", eigene);
  assert.equal(treffer.art, "eigene");
  assert.equal(treffer.futter.id, "sheba");
  assert.equal(treffer.eintrag.id, "sheba-fresh-fine-huhn-gefluegel-truthahn");
});

test("findeNachEan findet eine Sorte der Futterliste, die noch nicht übernommen ist", () => {
  const treffer = findeNachEan("4770608260286", []);
  assert.equal(treffer.art, "liste");
  assert.equal(treffer.eintrag.id, "sheba-fresh-fine-huhn-gefluegel-truthahn");
  assert.equal(treffer.futter, undefined);
});

test("findeNachEan findet eine eigene Sorte über ihre gespeicherte Nummer", () => {
  const eigene = [{ id: "coshida", name: "Coshida Huhn", ean: ["96385074"] }];
  const treffer = findeNachEan("96385074", eigene);
  assert.equal(treffer.art, "eigene");
  assert.equal(treffer.futter.id, "coshida");
  assert.equal(treffer.eintrag, undefined);
});

test("findeNachEan gibt null für unbekannte Nummern", () => {
  assert.equal(findeNachEan("96385074", [{ id: "x", name: "ohne Nummer" }]), null);
});

test("jede Listen-Nummer wird gefunden", () => {
  for (const e of FUTTERLISTE.filter((e) => e.ean)) {
    for (const ean of e.ean) assert.equal(findeNachEan(ean, []).eintrag.id, e.id, ean);
  }
});

test("EAN-Angaben stehen in eigenen Feldern, nicht in Quelle, Hinweis oder Notiz", () => {
  for (const e of FUTTERLISTE) {
    assert.doesNotMatch(e.quelle, /EAN/, e.id);
    assert.doesNotMatch(e.hinweis, /EAN/, e.id);
    assert.doesNotMatch(ausListe(e, "x").notiz, /EAN|Nummer gehört|Nummern gehören/, e.id);
    for (const feld of ["eanQuelle", "eanHinweis"]) {
      if (feld in e) {
        assert.ok(e.ean, `${e.id}: ${feld} ohne ean`);
        assert.ok(typeof e[feld] === "string" && e[feld].length > 3, `${e.id}: ${feld}`);
      }
    }
  }
});

test("eanBereinigen entfernt ungültige Nummern aus einer eingelesenen Sicherung, der Rest bleibt", () => {
  const daten = {
    futter: [
      { id: "a", name: "A", ean: ["96385074", "123", "<script>"] },
      { id: "b", name: "B", ean: "96385074" },
      { id: "c", name: "C", ean: ["4770608260287"] },
      { id: "d", name: "D" },
    ],
  };
  assert.equal(eanBereinigen(daten), 4);
  assert.deepEqual(daten.futter[0].ean, ["96385074"]);
  assert.equal("ean" in daten.futter[1], false);
  assert.equal("ean" in daten.futter[2], false);
  assert.equal("ean" in daten.futter[3], false);
  assert.equal(eanBereinigen(daten), 0);
});
