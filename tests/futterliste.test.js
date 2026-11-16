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
  listenGruppen,
  LISTEN_GRUPPEN,
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
    [
      "hills-metabolic-trocken",
      "hills-metabolic-nass",
      "hills-metabolic-meeresfisch-nass",
      "hills-metabolic-lachs-trocken",
      "hills-metabolic-mobility-trocken",
      "hills-cd-stress-metabolic-trocken",
      "hills-cd-stress-metabolic-nass",
      "hills-metabolic-stew-nass", // seit 0.86.0
      "hills-metabolic-mousse-nass", // seit 0.86.0
      "hills-metabolic-mobility-nass", // seit 0.86.0
    ]
  );
  assert.deepEqual(
    sucheFutter("metabolic meeresfisch").map((e) => e.id),
    ["hills-metabolic-meeresfisch-nass"]
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
  assert.match(futter.notiz, /^Diätfutter – nur nach tierärztlicher Rücksprache\./);
  assert.match(futter.notiz, /Protein 48 %, Fett 8 %, Asche 8 %, Faser 7,5 %, Feuchte nicht angegeben/);
  assert.match(futter.notiz, /Stand 05\.11\.2026\. Bei Abweichung gilt die Packung\.$/);
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

// ---------- 0.37.0: Diätfutter, vierte Runde (docs/futter-recherche.md) ----------

test("0.37.0: jedes Diätfutter hat einen kcal-Wert vom Hersteller, keinen geschätzten", () => {
  const diaet = FUTTERLISTE.filter((e) => e.diaet);
  assert.ok(diaet.length >= 17, String(diaet.length));
  for (const e of diaet) assert.equal(e.kcalQuelle, "hersteller", e.id);
});

test("0.37.0: neue Diätsorten mit den Werten der Hersteller", () => {
  const kcal = (id) => FUTTERLISTE.find((e) => e.id === id)?.kcalPro100g;
  assert.equal(kcal("hills-metabolic-meeresfisch-nass"), 66.5);
  assert.equal(kcal("hills-metabolic-lachs-trocken"), 344.5);
  assert.equal(kcal("hills-metabolic-mobility-trocken"), 346.1);
  assert.equal(kcal("hills-cd-stress-metabolic-trocken"), 340.9);
  assert.equal(kcal("hills-cd-stress-metabolic-nass"), 69);
  assert.equal(kcal("josera-help-weight-diabetic-nass"), 72.8);
  assert.equal(kcal("virbac-hpm-weight-loss-control-w2-trocken"), 342);
  assert.equal(kcal("virbac-hpm-weight-loss-diabetes-w1-trocken"), 331);
  assert.equal(kcal("farmina-vet-life-obesity-trocken"), 336.9);
  assert.equal(kcal("hills-wd-nass"), 81.3); // vorher geschätzt 86, jetzt Herstellerwert
});

test("0.37.0: Hill's w/d sagt, dass es nicht zum Abnehmen deklariert ist", () => {
  const wd = FUTTERLISTE.find((e) => e.id === "hills-wd-nass");
  assert.match(wd.hinweis, /Diabetes/);
  assert.match(wd.hinweis, /nicht zum Abnehmen/);
});

test("0.37.0: liegt ein gemessener Energiewert unter dem Packungswert, steht er im Hinweis", () => {
  const hinweis = (id) => FUTTERLISTE.find((e) => e.id === id).hinweis;
  assert.match(hinweis("virbac-hpm-weight-loss-control-w2-trocken"), /325 kcal/);
  assert.match(hinweis("virbac-hpm-weight-loss-diabetes-w1-trocken"), /306 kcal/);
  assert.match(hinweis("purina-om-trocken"), /322 kcal/);
});

// ---------- 0.80.0: fünfte Runde, Breite (docs/futter-recherche.md) ----------

test("0.80.0 bis 0.86.0: Runde 5 bringt 39 Sorten, Runde 6 34, Runde 7 (Leckerlis) 32, Runde 8 (Nass und Haupt) 12, Runde 9 (Diät) 6, zusammen 181 (mit Runde 10 seit 0.87.0: 202)", () => {
  assert.equal(FUTTERLISTE.length, 181 + 21 + 14 + 10); // + 14 aus Runde 11 (0.91.0), + 10 aus Runde 12 (0.92.0)
  assert.equal(FUTTERLISTE.filter((e) => e.abgerufen === "2026-11-08").length, 39 + 34 + 32 + 12 + 6 - 1); // Perfect Fit Indoor trocken seit 0.91.0 mit Stand 16.11.
});

test("0.81.0: Runde 6 mit Herstellerwerten (Josera, Bozita in kJ, Royal Canin, Kitekat in Gelee)", () => {
  const kcal = (id) => FUTTERLISTE.find((e) => e.id === id)?.kcalPro100g;
  assert.equal(kcal("josera-catelux-trocken"), 391.2);
  assert.equal(kcal("josera-culinesse-trocken"), 373.5);
  assert.equal(kcal("josicat-sterilised-classic-trocken"), 353.7);
  assert.equal(kcal("bozita-active-sterilised-lamm-trocken"), 390.3); // 1633 kJ / 4,184 (bozita.com, seit 0.82.0)
  assert.equal(kcal("royal-canin-indoor-sterilised-sosse"), 80);
  assert.equal(kcal("kitekat-gelee-gefluegel-allerlei"), 69.4); // 59 kcal je 85 g
  assert.equal(kcal("whiskas-pure-delight-gefluegel-ragout"), 77); // whiskas.de (seit 0.82.0, vorher 70,6 von rossmann.de)
  assert.equal(findeNachEan("4008429157226", []).eintrag.id, "kitekat-gelee-gefluegel-allerlei");
});

test("0.81.0: Eigenmarken von dm und Rossmann sind über die Suche zu finden", () => {
  assert.equal(sucheFutter("dein bestes").length, 6 + 2); // 1 aus Runde 2, 5 aus Runde 6 (mit Leckerli), 2 Leckerlis aus Runde 12
  assert.equal(sucheFutter("winston").length, 6); // 1 aus Runde 2, 5 aus Runde 6
});

test("0.80.0: neue Sorten mit Herstellerwert", () => {
  const kcal = (id) => FUTTERLISTE.find((e) => e.id === id)?.kcalPro100g;
  assert.equal(kcal("select-gold-medica-reduktion-diabetes-trocken"), 313.8);
  assert.equal(kcal("concept-for-life-light-trocken"), 349.1);
  assert.equal(kcal("concept-for-life-light-sosse-nass"), 68.2);
  assert.equal(kcal("sheba-classics-pastete"), 83.5); // 71 kcal je 85 g
  assert.equal(kcal("sheba-selection-sauce-gefluegel"), 84.7); // 72 kcal je 85 g
  assert.equal(kcal("whiskas-tasty-mix-sauce"), 72.9); // 62 kcal je 85 g
  assert.equal(kcal("whiskas-1plus-rind-trocken"), 374);
  assert.equal(kcal("purizon-adult-huhn-lachs-nass"), 114);
  assert.equal(kcal("sheba-creamy-snacks"), 54);
});

test("0.80.0: Select Gold Medica ist Diätfutter, Handelsmarken und Eigenmarken sind es nicht", () => {
  const e = (id) => FUTTERLISTE.find((x) => x.id === id);
  assert.equal(e("select-gold-medica-reduktion-diabetes-trocken").diaet, true);
  assert.match(e("select-gold-medica-reduktion-diabetes-trocken").hinweis, /Verringerung von Übergewicht/);
  for (const id of ["rewe-ja-feine-haeppchen-nass", "select-gold-light-nass", "concept-for-life-light-trocken"]) assert.equal(e(id).diaet, false, id);
});

test("0.80.0: Ergänzungsfutter sagt das im Hinweis", () => {
  for (const id of ["miamor-feine-filets-jelly-huhn", "cosma-original-jelly-huhn", "sheba-creamy-snacks", "felix-party-mix"]) {
    assert.match(FUTTERLISTE.find((e) => e.id === id).hinweis, /Ergänzungsfuttermittel, kein Alleinfutter/, id);
  }
});

test("0.80.0: der Scanner findet die neuen Nummern", () => {
  assert.equal(findeNachEan("7613036898775", []).eintrag.id, "felix-sensations-gelee");
  assert.equal(findeNachEan("3065890158207", []).eintrag.id, "sheba-selection-sauce-gefluegel");
  assert.equal(findeNachEan("8410136052323", []).eintrag.id, "perfect-fit-indoor-sauce");
  assert.equal(findeNachEan("4008429119798", []).eintrag.id, "sheba-creamy-snacks");
});

test("0.80.0: Suche findet REWE ja! und Premiere über ein Wort", () => {
  assert.equal(sucheFutter("ja!").length, 4);
  assert.deepEqual(
    sucheFutter("premiere").map((e) => e.id),
    ["premiere-meat-menu-sterilised-trocken", "premiere-finest-jelly-royal-ragout", "premiere-meat-menu-gefluegel-trocken"]
  );
});

test("0.69.0: listenGruppen teilt die Futterliste in Diätfutter, Nassfutter, Trockenfutter und Leckerlis", () => {
  const gruppen = listenGruppen(FUTTERLISTE);
  assert.deepEqual(
    gruppen.map((g) => g.id),
    ["liste-diaet", "liste-nass", "liste-trocken", "liste-leckerli"]
  );
  assert.deepEqual(
    gruppen.map((g) => g.titel),
    ["Diätfutter – nur nach tierärztlicher Rücksprache", "Nassfutter", "Trockenfutter", "Leckerlis"]
  );
  // Jede Sorte steht genau einmal, Diätfutter nur in der Diät-Gruppe.
  assert.equal(gruppen.reduce((summe, g) => summe + g.eintraege.length, 0), FUTTERLISTE.length);
  assert.ok(gruppen[0].eintraege.every((e) => e.diaet));
  for (const g of gruppen.slice(1)) assert.ok(g.eintraege.every((e) => !e.diaet && g.id === `liste-${e.typ}`));
  assert.ok(gruppen[3].eintraege.some((e) => e.id === "dreamies-huhn"));
});

test("0.69.0: listenGruppen lässt leere Gruppen weg (z. B. bei einer Suche)", () => {
  const gruppen = listenGruppen(sucheFutter("dreamies"));
  assert.deepEqual(gruppen.map((g) => g.id), ["liste-leckerli"]);
  assert.deepEqual(listenGruppen([]), []);
});

test("0.69.0: LISTEN_GRUPPEN nennt alle Gruppen (Auf/Zu vor einer Suche merken)", () => {
  assert.deepEqual(LISTEN_GRUPPEN, ["liste-diaet", "liste-nass", "liste-trocken", "liste-leckerli"]);
});

// ---------- 0.82.0: EAN-Gegenprüfung für Runde 5 und 6 (docs/futter-recherche.md) ----------

test("0.82.0: 18 neue Nummern, jede von zwei Firmen bestätigt, gehören zur richtigen Sorte", () => {
  const neu = {
    "applaws-adult-huhn-lachs-trocken": "5060122491433",
    "bozita-active-sterilised-lamm-trocken": "7311030313217",
    "felix-tasty-shreds": "8445290411297",
    "josera-catelux-trocken": "4032254749066",
    "josera-culinesse-trocken": "4032254749158",
    "josicat-crunchy-chicken-trocken": "4032254776017",
    "josicat-sterilised-classic-trocken": "4032254753438",
    "macs-senior-light-gefluegel-trocken": "4027245805524",
    "macs-superfood-adult-trocken": "4027245805227",
    "sanabelle-light-low-calorie-trocken": "4015598025508",
    "sanabelle-sterilized-trocken": "4015598025409",
    "purina-one-indoor-trocken": "8445290067289",
    "royal-canin-indoor-sterilised-sosse": "9003579013793",
    "felix-doppelt-lecker-gelee": "7613036898638",
    "whiskas-pure-delight-gefluegel-ragout": "5900951302299",
    "whiskas-1plus-rind-trocken": "5900951258770",
    "happy-cat-minkas-sterilised-trocken": "4001967074208",
    "happy-cat-minkas-perfect-mix-trocken": "4001967074314",
  };
  for (const [id, ean] of Object.entries(neu)) {
    assert.equal(findeNachEan(ean, []).eintrag.id, id, ean);
    const e = FUTTERLISTE.find((x) => x.id === id);
    assert.match(e.eanQuelle, /, /, `${id}: zwei Firmen`);
    assert.ok(e.eanHinweis, id);
  }
  // Gesamtzahl seit 0.83.0 im Test „der Scanner findet die neuen Whiskas-Nummern“ (69 + 5).
});

test("0.82.0: Werte vom Hersteller statt veralteter Händlerangaben", () => {
  const e = (id) => FUTTERLISTE.find((x) => x.id === id);
  assert.deepEqual(e("bozita-active-sterilised-lamm-trocken").analyse, { protein: 33, fett: 20, asche: 7, faser: 4, feuchte: 9 });
  assert.equal(e("bozita-active-sterilised-lamm-trocken").kcalQuelle, "hersteller");
  assert.deepEqual(e("whiskas-pure-delight-gefluegel-ragout").analyse, { protein: 12.9, fett: 2.8, asche: 1.1, faser: 0.25, feuchte: 83.2 });
  assert.match(e("whiskas-pure-delight-gefluegel-ragout").hinweis, /65,5 kcal/);
  assert.deepEqual(e("happy-cat-minkas-sterilised-trocken").analyse, { protein: 34.5, fett: 9.5, asche: 7.5, faser: 5.5, feuchte: null });
  assert.equal(e("happy-cat-minkas-sterilised-trocken").kcalPro100g, 347);
  assert.deepEqual(e("happy-cat-minkas-perfect-mix-trocken").analyse, { protein: 30, fett: 12, asche: 7, faser: 3, feuchte: null });
  assert.equal(e("happy-cat-minkas-perfect-mix-trocken").kcalPro100g, 368);
});

// ---------- 0.83.0: siebte Runde, Leckerlis mit Stückgewicht (docs/futter-recherche.md) ----------

test("0.83.0: 42 Leckerlis, jedes sagt, was ein Stück oder ein Beutel bringt, oder dass das Stückgewicht fehlt", () => {
  const leckerlis = FUTTERLISTE.filter((e) => e.typ === "leckerli");
  assert.equal(leckerlis.length, 10 + 32 + 7 + 2); // + 7 aus Runde 10 (0.87.0), + 2 aus Runde 12 (0.92.0)
  for (const e of leckerlis) {
    assert.match(e.hinweis, /≈ [\d,]+ kcal|Stückgewicht nicht angegeben/, e.id);
  }
});

test("0.83.0: jedes neue Leckerli sagt, dass es nur zusätzlich zu einem Alleinfutter gehört", () => {
  const neu = FUTTERLISTE.filter((e) => e.typ === "leckerli" && FUTTERLISTE.indexOf(e) > FUTTERLISTE.findIndex((x) => x.id === "dm-dein-bestes-dental-knabbertaschen"));
  assert.equal(neu.length, 32 + 7 + 2); // + 7 aus Runde 10 (0.87.0), + 2 aus Runde 12, stehen am Ende der Liste
  for (const e of neu) assert.match(e.hinweis, /Ergänzungsfuttermittel, kein Alleinfutter/, e.id);
});

test("0.83.0: Stück-Angaben passen zu den kcal pro 100 g (von Hand nachgerechnet)", () => {
  const e = (id) => FUTTERLISTE.find((x) => x.id === id);
  // Stückgewicht × kcal pro 100 g / 100
  assert.equal(Math.round(5 * e("dreamies-meaty-sticks").kcalPro100g) / 100, 17.5);
  assert.equal(Math.round(6 * e("whiskas-sticks-huhn").kcalPro100g / 100), 21);
  assert.equal(Math.round(5 * e("catessy-sticks").kcalPro100g / 100), 16);
  assert.equal(Math.round(12 * e("sheba-creamy-snacks-kaese").kcalPro100g / 10) / 10, 11.8);
  assert.equal(Math.round(30 * e("vitakraft-katzen-drink").kcalPro100g / 100), 9);
  assert.match(e("dreamies-meaty-sticks").hinweis, /1 Stick = 5 g ≈ 17,5 kcal/);
  assert.match(e("whiskas-sticks-huhn").hinweis, /1 Stick = 6 g ≈ 21 kcal/);
});

test("0.83.0: Herstellerwerte der neuen Leckerlis", () => {
  const kcal = (id) => FUTTERLISTE.find((e) => e.id === id)?.kcalPro100g;
  assert.equal(kcal("dreamies-shake-ups-multivitamins"), 414);
  assert.equal(kcal("dreamies-meaty-sticks"), 350);
  assert.equal(kcal("whiskas-sticks-huhn"), 355);
  assert.equal(kcal("whiskas-dentabites"), 325);
  assert.equal(kcal("whiskas-crunch"), 358);
  assert.equal(kcal("whiskas-snacks-relax-pounce-groom"), 407);
  assert.equal(kcal("whiskas-knuspertaschen-anti-hairball"), 411);
  assert.equal(kcal("sheba-creamy-snacks-kaese"), 98);
  assert.equal(kcal("felix-deli-moments"), 57.1);
});

test("0.83.0: der Scanner findet die neuen Whiskas-Nummern (whiskas.de und zooplus.de)", () => {
  const neu = {
    "5998749146583": "whiskas-knuspertaschen-anti-hairball",
    "5998749145616": "whiskas-snacks-relax-pounce-groom",
    "5998749146590": "whiskas-dentabites",
    "5998749146637": "whiskas-crunch",
    "4008429048432": "whiskas-sticks-huhn",
  };
  for (const [ean, id] of Object.entries(neu)) {
    assert.equal(findeNachEan(ean, []).eintrag.id, id, ean);
    assert.match(FUTTERLISTE.find((e) => e.id === id).eanQuelle, /whiskas\.de, zooplus\.de/, id);
  }
  // Gesamtzahl seit 0.84.0 im Test „0.84.0: zwei neue Nummern“ (69 + 5 + 2).
});

test("0.83.0: Suche findet den Felix Party Mix auch als KnabberMix, Leckerli-Gruppe zeigt alle 42", () => {
  assert.deepEqual(sucheFutter("knabbermix").map((e) => e.id), ["felix-party-mix"]);
  const gruppe = listenGruppen(FUTTERLISTE).find((g) => g.id === "liste-leckerli");
  assert.equal(gruppe.eintraege.length, 42 + 7 + 2); // + 7 aus Runde 10 (0.87.0), + 2 aus Runde 12
});

test("0.83.0: keine Paste über der Leckerli-Grenze in der Liste (GimCat- und Trixie-Malzpasten bleiben draußen)", () => {
  for (const e of FUTTERLISTE.filter((x) => x.typ === "leckerli")) assert.ok(e.kcalPro100g <= 450, e.id);
  assert.equal(sucheFutter("malt-soft").length, 0);
  assert.equal(sucheFutter("katzenmalz").length, 0);
});

// ---------- 0.84.0: achte Runde, Nass- und Hauptfutter (docs/futter-recherche.md) ----------

test("0.84.0 und 0.86.0: Runde 8 bringt 5 Trockenfutter und 7 Nassfutter, Runde 9 sechs Diätfutter, die Gruppen zählen 24/71/44/42", () => {
  assert.deepEqual(
    listenGruppen(FUTTERLISTE).map((g) => g.eintraege.length),
    [18 + 6, 64 + 7 + 10 + 4 + 8, 39 + 5 + 4 + 10, 42 + 7 + 2] // + Runde 12 (0.92.0): 8 nass, 2 Leckerli; + Runde 10 (0.87.0): 10 nass, 4 trocken, 7 Leckerli; + Runde 11 (0.91.0): 4 nass, 10 trocken
  );
});

test("0.84.0: Herstellerwerte (Bozita in kJ, Sheba je Schale)", () => {
  const kcal = (id) => FUTTERLISTE.find((e) => e.id === id)?.kcalPro100g;
  assert.equal(kcal("bozita-haeppchen-gelee-rentier"), 81.5); // 341 kJ / 4,184
  assert.equal(kcal("bozita-sterilised-haeppchen-gelee-huhn-rind"), 69.3); // 290 kJ / 4,184
  assert.equal(kcal("sheba-sauce-lover-huhn"), 84.7); // 72 kcal je 85 g
  assert.equal(Math.round((341 / 4.184) * 10) / 10, 81.5);
  assert.equal(Math.round((290 / 4.184) * 10) / 10, 69.3);
  assert.equal(Math.round((72 / 85) * 1000) / 10, 84.7);
});

test("0.84.0: zwei neue Nummern, je von Fressnapf und zooplus bestätigt", () => {
  assert.equal(findeNachEan("3182550702157", []).eintrag.id, "royal-canin-regular-fit-32-trocken");
  assert.equal(findeNachEan("8710255150550", []).eintrag.id, "iams-sterilised-huhn-trocken");
  for (const id of ["royal-canin-regular-fit-32-trocken", "iams-sterilised-huhn-trocken"]) {
    assert.equal(FUTTERLISTE.find((e) => e.id === id).eanQuelle, "fressnapf.de, zooplus.de", id);
  }
  // Nummern nur bei einer Firma (Royal Canin Instinctive, Leonardo, Wildes Land, Felix, Gourmet) bleiben draußen.
  for (const ean of ["9003579309544", "9003579308738", "4002633758132", "4250839505641", "7613036730358", "7613033057991"]) {
    assert.equal(findeNachEan(ean, []), null, ean);
  }
  assert.equal(FUTTERLISTE.filter((e) => e.ean).length, 69 + 5 + 2 + 2 + 3 + 4 + 8); // + 2 aus Runde 9 (0.86.0), + 3 Sorten aus Runde 10 (0.87.0), + 4 aus Runde 11 (0.91.0)
});

// ---------- 0.86.0: neunte Runde, Diätfutter aus der Medpets-Liste „Übergewicht“ (docs/futter-recherche.md) ----------

const RUNDE_9 = {
  "hills-metabolic-stew-nass": 78.6, // 786 kcal/kg, medpets.de
  "hills-metabolic-mousse-nass": 79.2, // 792 kcal/kg, medpets.de
  "hills-metabolic-mobility-nass": 68.8, // 688 kcal/kg, hillspet.de
  "brit-veterinary-obesity-trocken": 348, // 3480 kcal/kg, medpets.de und zooplus.de
  "affinity-advance-weight-balance-trocken": 340.8, // 3408 kcal/kg berechnet, medpets.de
  "prins-vitalcare-weight-reduction-diabetic-trocken": 354, // 3540 kcal/kg, medpets.de
};

test("0.86.0: Runde 9 bringt sechs Diätfutter, alle mit Herstellerwert", () => {
  for (const [id, kcal] of Object.entries(RUNDE_9)) {
    const e = FUTTERLISTE.find((x) => x.id === id);
    assert.ok(e, id);
    assert.equal(e.diaet, true, id);
    assert.equal(e.kcalQuelle, "hersteller", id);
    assert.equal(e.kcalPro100g, kcal, id);
    assert.equal(e.abgerufen, "2026-11-08", id);
  }
});

test("0.86.0: Nachrechnung der neuen Diätfutter von Hand (NRC 2006, kcalAusBestandteilen)", () => {
  const nr = (id) => Math.round(nachrechnung(FUTTERLISTE.find((e) => e.id === id)) * 10) / 10;
  assert.equal(nr("hills-metabolic-stew-nass"), 82.8);
  assert.equal(nr("hills-metabolic-mousse-nass"), 82.7);
  assert.equal(nr("hills-metabolic-mobility-nass"), 72.4);
  assert.equal(nr("brit-veterinary-obesity-trocken"), 346);
  assert.equal(nr("affinity-advance-weight-balance-trocken"), 329.7);
  assert.equal(nr("prins-vitalcare-weight-reduction-diabetic-trocken"), 331.9);
});

test("0.86.0: zwei neue Nummern, je von medpets.de und zooplus.de bestätigt", () => {
  assert.equal(findeNachEan("8595602528479", []).eintrag.id, "brit-veterinary-obesity-trocken");
  assert.equal(findeNachEan("8410650239132", []).eintrag.id, "affinity-advance-weight-balance-trocken");
  for (const id of ["brit-veterinary-obesity-trocken", "affinity-advance-weight-balance-trocken"]) {
    assert.equal(FUTTERLISTE.find((e) => e.id === id).eanQuelle, "medpets.de, zooplus.de", id);
  }
  // Nummern nur bei einer Firma (Hill's Stew, Mousse, Metabolic + Mobility Beutel, Prins) bleiben draußen.
  for (const ean of ["0052742021638", "0052742087405", "0052742085586", "8713595740078"]) {
    assert.equal(findeNachEan(ean, []), null, ean);
  }
});

test("0.86.0: Suche findet die neuen Diätfutter über ein Wort", () => {
  assert.equal(sucheFutter("stew")[0]?.id, "hills-metabolic-stew-nass");
  assert.equal(sucheFutter("metabolic ragout")[0]?.id, "hills-metabolic-stew-nass");
  assert.equal(sucheFutter("mousse")[0]?.id, "hills-metabolic-mousse-nass");
  assert.equal(sucheFutter("brit obesity")[0]?.id, "brit-veterinary-obesity-trocken");
  assert.equal(sucheFutter("affinity")[0]?.id, "affinity-advance-weight-balance-trocken");
  assert.equal(sucheFutter("prins")[0]?.id, "prins-vitalcare-weight-reduction-diabetic-trocken");
});

test("0.86.0: Hinweise nennen Messwert (Affinity) und Beutel-kcal (Hill's), Brit-Dose und Trovet bleiben draußen", () => {
  const hinweis = (id) => FUTTERLISTE.find((e) => e.id === id).hinweis;
  assert.match(hinweis("affinity-advance-weight-balance-trocken"), /350 kcal/);
  assert.match(hinweis("hills-metabolic-mobility-nass"), /58,5 kcal/);
  assert.match(hinweis("hills-metabolic-stew-nass"), /64,5 kcal/);
  assert.equal(Math.round(78.6 * 0.82 * 10) / 10, 64.5);
  assert.equal(sucheFutter("trovet").length, 0);
  assert.equal(sucheFutter("brit dose").length, 0);
  assert.equal(sucheFutter("sanimed").length, 0);
});

// ---------- 0.87.0: zehnte Runde, Purina Gourmet und Felix (docs/futter-recherche.md) ----------

const RUNDE_10 = {
  // Nassfutter (Alleinfutter)
  "felix-original-gelee": ["nass", 71],
  "felix-koestliche-scheibchen": ["nass", 74],
  "felix-so-gut-junior": ["nass", 90],
  "felix-so-gut-senior": ["nass", 82],
  "gourmet-gold-feine-komposition": ["nass", 79],
  "gourmet-gold-saftig-feine-streifen": ["nass", 86],
  "gourmet-gold-terrine": ["nass", 98],
  "gourmet-natures-creations": ["nass", 85],
  "gourmet-natures-creations-gravy-heart": ["nass", 101],
  "gourmet-revelations-mousse": ["nass", 86],
  // Suppen, Saucen und Snacks (Ergänzungsfutter, zählen als Leckerli)
  "gourmet-soup-royale": ["leckerli", 53],
  "felix-soup-time-original": ["leckerli", 49],
  "felix-soup-time-tender-strips": ["leckerli", 49],
  "felix-sauce-time": ["leckerli", 25],
  "felix-tasty-nuggets-lachs-forelle": ["leckerli", 405],
  "felix-tasty-nuggets-rind-lamm": ["leckerli", 398],
  "felix-play-tubes": ["leckerli", 414],
  // Trockenfutter
  "felix-doppelt-lecker-trocken": ["trocken", 360],
  "felix-inhome-doppelt-lecker-trocken": ["trocken", 356],
  "felix-junior-doppelt-lecker-trocken": ["trocken", 372],
  "felix-senior-doppelt-lecker-trocken": ["trocken", 355],
};

test("0.87.0: Runde 10 bringt 21 Sorten von Gourmet und Felix (10 nass, 7 Leckerli, 4 trocken), zusammen 202", () => {
  for (const [id, [typ, kcal]] of Object.entries(RUNDE_10)) {
    const e = FUTTERLISTE.find((x) => x.id === id);
    assert.ok(e, id);
    assert.equal(e.typ, typ, id);
    assert.equal(e.kcalPro100g, kcal, id);
    assert.equal(e.diaet, false, id);
    assert.equal(e.abgerufen, "2026-11-09", id);
    assert.match(e.name, /^(Gourmet|Felix) /, id);
  }
  assert.equal(FUTTERLISTE.filter((e) => e.abgerufen === "2026-11-09").length, 21);
  assert.equal(FUTTERLISTE.length, 202 + 14 + 10); // + 14 aus Runde 11 (0.91.0), + 10 aus Runde 12
});

test("0.87.0: nur Sauce Time hat einen Herstellerwert (10 kcal je 40-g-Beutel, zooplus.de und rossmann.de)", () => {
  const neu = FUTTERLISTE.filter((e) => e.abgerufen === "2026-11-09");
  assert.deepEqual(neu.filter((e) => e.kcalQuelle === "hersteller").map((e) => e.id), ["felix-sauce-time"]);
  assert.equal((10 / 40) * 100, 25);
  assert.equal(Math.round(nachrechnung(FUTTERLISTE.find((e) => e.id === "felix-sauce-time")) * 10) / 10, 23.8);
  assert.match(FUTTERLISTE.find((e) => e.id === "felix-sauce-time").hinweis, /10 kcal/);
});

test("0.87.0: Suppen und Saucen sind Ergänzungsfutter, sagen das und nennen die kcal je Beutel", () => {
  const hinweis = (id) => FUTTERLISTE.find((e) => e.id === id).hinweis;
  for (const id of ["gourmet-soup-royale", "felix-soup-time-original", "felix-soup-time-tender-strips", "felix-sauce-time", "felix-tasty-nuggets-lachs-forelle", "felix-tasty-nuggets-rind-lamm", "felix-play-tubes"]) {
    assert.match(hinweis(id), /Ergänzungsfuttermittel, kein Alleinfutter/, id);
  }
  // Beutelgewicht × kcal pro 100 g / 100, von Hand: 45 × 53 = 23,85; 48 × 49 = 23,52; 40 × 25 = 10
  assert.match(hinweis("gourmet-soup-royale"), /45-g-Beutel ≈ 23,9 kcal/);
  assert.match(hinweis("felix-soup-time-original"), /48-g-Beutel ≈ 23,5 kcal/);
  assert.match(hinweis("felix-soup-time-tender-strips"), /48-g-Beutel ≈ 23,5 kcal/);
  assert.match(hinweis("felix-sauce-time"), /40-g-Beutel ≈ 10 kcal/);
  // 13 g ≈ 30 Stück: 0,43 g × 405 = 1,75; 0,43 g × 398 = 1,72
  assert.match(hinweis("felix-tasty-nuggets-lachs-forelle"), /1 Stück ≈ 0,4 g ≈ 1,8 kcal/);
  assert.match(hinweis("felix-tasty-nuggets-rind-lamm"), /1 Stück ≈ 0,4 g ≈ 1,7 kcal/);
  assert.match(hinweis("felix-play-tubes"), /Stückgewicht nicht angegeben/);
});

test("0.87.0: fünf neue Nummern, je von rossmann.de und zooplus.de bestätigt", () => {
  const neu = {
    "7613036631952": "felix-soup-time-original", // 6 × 48 g vom Land
    "7613036631976": "felix-soup-time-original", // 6 × 48 g aus dem Wasser
    "8445291989993": "felix-sauce-time", // 6 × 40 g
    "8445291848467": "gourmet-soup-royale", // 6 × 45 g Fleischauswahl
    "8445291848702": "gourmet-soup-royale", // 6 × 45 g Fischauswahl
  };
  for (const [ean, id] of Object.entries(neu)) assert.equal(findeNachEan(ean, []).eintrag.id, id, ean);
  for (const id of ["felix-soup-time-original", "felix-sauce-time", "gourmet-soup-royale"]) {
    assert.equal(FUTTERLISTE.find((e) => e.id === id).eanQuelle, "rossmann.de, zooplus.de", id);
  }
  // Nur bei einer Firma gefunden, deshalb ohne Nummer: Tender Strips (zooplus 7613287068798, Fressnapf 7613287611864),
  // Felix in Gelee, Köstliche Scheibchen, Junior, Senior, Gourmet Gold, Nature's Creations, Revelations, Trockenfutter, Nuggets.
  for (const ean of ["7613287068798", "7613287611864", "7613287334497", "7613287762962", "7613036894623", "8445290502438", "8445291678637", "8445290518200"]) {
    assert.equal(findeNachEan(ean, []), null, ean);
  }
  assert.equal(FUTTERLISTE.filter((e) => e.ean).length, 69 + 5 + 2 + 2 + 3 + 4 + 8); // + 4 aus Runde 11 (0.91.0)
});

test("0.87.0: Suche findet die neuen Sorten über ein Wort, Stefans zwei Suppen zuerst", () => {
  assert.deepEqual(sucheFutter("soup royale").map((e) => e.id), ["gourmet-soup-royale"]);
  assert.deepEqual(sucheFutter("tender strips").map((e) => e.id), ["felix-soup-time-tender-strips"]);
  assert.deepEqual(sucheFutter("soup time").map((e) => e.id), ["felix-soup-time-original", "felix-soup-time-tender-strips"]);
  assert.equal(sucheFutter("sauce time")[0]?.id, "felix-sauce-time");
  assert.equal(sucheFutter("tasty nuggets").length, 3);
  assert.equal(sucheFutter("doppelt lecker trocken").length, 4);
  assert.equal(sucheFutter("mousse")[0]?.id, "hills-metabolic-mousse-nass"); // Diätfutter bleibt vorn
  assert.equal(sucheFutter("gourmet").length, 7 + 7);
  assert.equal(sucheFutter("felix").length, 9 + 14);
});

// ---------- 0.91.0: elfte Runde, Perfect Fit (docs/futter-recherche.md) ----------

const RUNDE_11 = {
  // Trockenfutter, Werte von perfect-fit.de (Lachs & Weißfisch nur bei dm.de)
  "perfect-fit-adult-huhn-trocken": ["trocken", 386],
  "perfect-fit-adult-lachs-trocken": ["trocken", 387],
  "perfect-fit-adult-rind-trocken": ["trocken", 385],
  "perfect-fit-anti-hairball-huhn-trocken": ["trocken", 377],
  "perfect-fit-sensitive-truthahn-trocken": ["trocken", 383],
  "perfect-fit-natural-vitality-huhn-truthahn-trocken": ["trocken", 395],
  "perfect-fit-natural-vitality-rind-huhn-trocken": ["trocken", 395],
  "perfect-fit-natural-vitality-lachs-weissfisch-trocken": ["trocken", 393],
  "perfect-fit-senior-7-huhn-trocken": ["trocken", 379],
  "perfect-fit-senior-11-huhn-trocken": ["trocken", 387],
  // Nassfutter
  "perfect-fit-adult-sauce": ["nass", 75],
  "perfect-fit-sensitive-sauce": ["nass", 75],
  "perfect-fit-natural-vitality-nass": ["nass", 80],
  "perfect-fit-senior-7-sauce": ["nass", 75],
};

test("0.91.0: Runde 11 bringt 14 Sorten von Perfect Fit (10 trocken, 4 nass), alle mit Herstellerwert, zusammen 216", () => {
  for (const [id, [typ, kcal]] of Object.entries(RUNDE_11)) {
    const e = FUTTERLISTE.find((x) => x.id === id);
    assert.ok(e, id);
    assert.equal(e.typ, typ, id);
    assert.equal(e.kcalPro100g, kcal, id);
    assert.equal(e.kcalQuelle, "hersteller", id);
    assert.equal(e.diaet, false, id);
    assert.equal(e.abgerufen, "2026-11-16", id);
    assert.match(e.name, /^Perfect Fit /, id);
  }
  // + 2 korrigierte alte Einträge (Indoor und Sterile trocken) mit neuem Abrufdatum
  assert.equal(FUTTERLISTE.filter((e) => e.abgerufen === "2026-11-16").length, 14 + 2 + 10); // + 10 aus Runde 12, gleicher Tag
  assert.equal(FUTTERLISTE.length, 216 + 10); // + 10 aus Runde 12
  assert.equal(FUTTERLISTE.filter((e) => /^Perfect Fit /.test(e.name)).length, 3 + 14);
});

test("0.91.0: Nachrechnung von Hand (NRC 2006, Trockenfutter mit 8 % Feuchte) liegt 1 bis 2 % unter dem Herstellerwert", () => {
  const nach = (id) => Math.round(nachrechnung(FUTTERLISTE.find((e) => e.id === id)) * 10) / 10;
  assert.equal(nach("perfect-fit-adult-huhn-trocken"), 378.8);
  assert.equal(nach("perfect-fit-natural-vitality-rind-huhn-trocken"), 387.3);
  assert.equal(nach("perfect-fit-senior-11-huhn-trocken"), 379.3);
  assert.equal(nach("perfect-fit-adult-sauce"), 75.1);
  assert.equal(nach("perfect-fit-natural-vitality-nass"), 80.5);
});

test("0.91.0: Indoor und Sterile trocken mit den Werten von perfect-fit.de (370 statt 369, 373 statt 374)", () => {
  const e = (id) => FUTTERLISTE.find((x) => x.id === id);
  assert.equal(e("perfect-fit-indoor-huhn-trocken").kcalPro100g, 370);
  assert.deepEqual(e("perfect-fit-indoor-huhn-trocken").analyse, { protein: 37, fett: 12, asche: 8.9, faser: 3.7, feuchte: null });
  assert.equal(e("perfect-fit-sterile-huhn-trocken").kcalPro100g, 373);
  assert.deepEqual(e("perfect-fit-sterile-huhn-trocken").analyse, { protein: 34, fett: 12, asche: 8.5, faser: 2.8, feuchte: null });
  for (const id of ["perfect-fit-indoor-huhn-trocken", "perfect-fit-sterile-huhn-trocken"]) {
    assert.equal(e(id).abgerufen, "2026-11-16", id);
    assert.match(e(id).quelle, /perfect-fit\.de/, id);
  }
  assert.equal(e("perfect-fit-indoor-sauce").kcalPro100g, 74); // passt schon
});

test("0.91.0: Beutel-kcal im Hinweis (von Hand: 85 × 0,75 = 63,75; 50 × 0,80 = 40)", () => {
  const hinweis = (id) => FUTTERLISTE.find((e) => e.id === id).hinweis;
  for (const id of ["perfect-fit-adult-sauce", "perfect-fit-sensitive-sauce", "perfect-fit-senior-7-sauce"]) {
    assert.match(hinweis(id), /85-g-Beutel ≈ 63,8 kcal/, id);
  }
  assert.match(hinweis("perfect-fit-natural-vitality-nass"), /50-g-Beutel ≈ 40 kcal/);
  assert.match(hinweis("perfect-fit-sensitive-truthahn-trocken"), /387 kcal/); // große Säcke
  assert.match(hinweis("perfect-fit-adult-rind-trocken"), /Active 1\+/);
});

test("0.91.0: fünf neue Nummern, je von rossmann.de und dm.de bestätigt", () => {
  const neu = {
    "5900951307775": "perfect-fit-adult-rind-trocken", // 750 g, „Active 1+ mit Rind“
    "5900951307546": "perfect-fit-senior-7-huhn-trocken", // 750 g
    "8410136052248": "perfect-fit-sensitive-sauce", // 12 × 85 g
    "4770608259549": "perfect-fit-natural-vitality-nass", // 6 × 50 g Truthahn & Huhn
    "4770608259556": "perfect-fit-natural-vitality-nass", // 6 × 50 g Hochseefisch & Lachs
  };
  for (const [ean, id] of Object.entries(neu)) assert.equal(findeNachEan(ean, []).eintrag.id, id, ean);
  for (const id of new Set(Object.values(neu))) {
    assert.equal(FUTTERLISTE.find((e) => e.id === id).eanQuelle, "rossmann.de, dm.de", id);
  }
  // Nur bei einer Firma gefunden, deshalb ohne Nummer: Adult Huhn und Lachs (Rossmann), Natural Vitality trocken,
  // Sensitive 750 g (dm), Indoor trocken (Rossmann 4008429159404 und 4008429159411, dm 5900951307553).
  for (const ean of ["4008429159473", "4008429159497", "4008429136030", "4008429136061", "4008429135996", "4008429160318", "4008429159404", "5900951307553"]) {
    assert.equal(findeNachEan(ean, []), null, ean);
  }
  assert.equal(FUTTERLISTE.filter((e) => e.ean).length, 69 + 5 + 2 + 2 + 3 + 4 + 8);
});

test("0.91.0: Suche findet die neuen Sorten über ein Wort, Junior bleibt draußen", () => {
  assert.equal(sucheFutter("perfect fit").length, 17);
  assert.equal(sucheFutter("natural vitality").length, 4);
  assert.deepEqual(sucheFutter("anti hairball").map((e) => e.id), ["whiskas-knuspertaschen-anti-hairball", "perfect-fit-anti-hairball-huhn-trocken"]);
  assert.equal(sucheFutter("perfect fit junior").length, 0);
  assert.deepEqual(
    listenGruppen(FUTTERLISTE).map((g) => g.eintraege.length),
    [24, 81 + 4 + 8, 48 + 10, 49 + 2]
  );
});

// ---------- 0.92.0: zwölfte Runde, Eigenmarken über Packungsfotos (docs/futter-recherche.md) ----------

const RUNDE_12 = [
  ["lidl-coshida-msc-seelachs-tomatengelee", 91],
  ["lidl-coshida-baellchen-rind-leber-sauce", 89],
  ["netto-attica-pastete-huhn", 88],
  ["netto-attica-ragout-pute", 89],
  ["netto-attica-pastete-wild", 88],
  ["netto-attica-senior-pastete-lamm", 84],
  ["kaufland-k-classic-pastete-thunfisch", 85],
  ["edeka-bio-pastete-huhn-pute", 88],
  ["dm-dein-bestes-knabberstaebchen-huhn-ente", 328],
  ["dm-dein-bestes-pudding-kaese", 62],
];

test("0.92.0: Runde 12 bringt 10 Eigenmarken, alle geschätzt aus einem Packungsfoto ab 2023, zusammen 226", () => {
  assert.equal(FUTTERLISTE.length, 226);
  for (const [id, kcal] of RUNDE_12) {
    const e = FUTTERLISTE.find((x) => x.id === id);
    assert.ok(e, id);
    assert.equal(e.kcalQuelle, "geschaetzt", id);
    assert.equal(e.kcalPro100g, kcal, id);
    assert.equal(e.kcalPro100g, Math.round(nachrechnung(e)), id);
    assert.equal(e.abgerufen, "2026-11-16", id);
    assert.match(e.url, /^https:\/\/world\.openpetfoodfacts\.org\/product\/\d+$/, id);
    const foto = e.quelle.match(/^Packungsfoto vom \d{2}\.\d{2}\.(\d{4}) \(Open Pet Food Facts\)$/);
    assert.ok(foto, id);
    assert.ok(Number(foto[1]) >= 2023, `${id}: Foto zu alt`);
    assert.match(e.hinweis, /mit deiner Packung vergleichen/, id);
  }
});

test("0.92.0: acht Eigenmarken haben die Nummer vom Strichcode auf dem Foto, der Scanner findet sie", () => {
  const mitNummer = RUNDE_12.map(([id]) => FUTTERLISTE.find((x) => x.id === id)).filter((e) => e.ean);
  assert.equal(mitNummer.length, 8);
  for (const e of mitNummer) {
    assert.equal(e.eanQuelle, "Strichcode auf dem Packungsfoto", e.id);
    assert.equal(findeNachEan(e.ean[0], []).eintrag.id, e.id);
  }
  // Coshida: Strichcode auf dem Foto nicht lesbar bzw. nicht im Bild
  assert.equal(FUTTERLISTE.find((x) => x.id === "lidl-coshida-baellchen-rind-leber-sauce").ean, undefined);
});

test("0.92.0: Suche findet die Eigenmarken über den Laden", () => {
  assert.equal(sucheFutter("lidl").length, 2);
  assert.equal(sucheFutter("netto").length, 4);
  assert.equal(sucheFutter("kaufland").length, 1);
  assert.equal(sucheFutter("edeka").length, 1);
  assert.equal(sucheFutter("aldi").length, 0); // Cachet erst mit Stefans Packungsfotos
});
