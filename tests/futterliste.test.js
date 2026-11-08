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

test("0.80.0 und 0.81.0: Runde 5 bringt 39 Sorten, Runde 6 weitere 34, zusammen 131", () => {
  assert.equal(FUTTERLISTE.length, 131);
  assert.equal(FUTTERLISTE.filter((e) => e.abgerufen === "2026-11-08").length, 39 + 34);
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
  assert.equal(sucheFutter("dein bestes").length, 6); // 1 aus Runde 2, 5 aus Runde 6 (mit Leckerli)
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
  assert.equal(FUTTERLISTE.filter((e) => e.ean).length, 51 + 18);
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
