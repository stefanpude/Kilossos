import { test } from "node:test";
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
import { berichtDaten, berichtHtml, waegungsMonate, WAEGUNGEN_PRO_ZEILE } from "../js/bericht.js";

const futter = [
  { id: "sheba", name: "Sheba", typ: "nass", kcalPro100g: 77, kcalQuelle: "packung" },
  { id: "purina", name: "Purina One Light", typ: "trocken", kcalPro100g: 327.5, kcalQuelle: "hersteller" },
  { id: "snack", name: "Snack", typ: "leckerli", kcalPro100g: 350, kcalQuelle: "packung" },
];
const um = (tag, stunde) => {
  const [j, m, t] = tag.split("-").map(Number);
  return new Date(j, m - 1, t, stunde).toISOString();
};
const mahlzeiten = [
  { futterId: "sheba", gramm: 100, zeitpunkt: um("2026-11-02", 8) },
  { futterId: "purina", gramm: 50, zeitpunkt: um("2026-11-02", 20) },
  { futterId: "sheba", gramm: 100, zeitpunkt: um("2026-11-03", 8) },
  { futterId: "purina", gramm: 45, zeitpunkt: um("2026-11-03", 20) },
  { futterId: "snack", gramm: 4, zeitpunkt: um("2026-11-03", 15) },
  { futterId: "sheba", gramm: 50, zeitpunkt: um("2026-11-04", 8) }, // heute: Tag noch nicht vorbei
];
const gewichte = [
  { kg: 9.4, datum: "2026-10-25" },
  { kg: 9.32, datum: "2026-11-01" },
  { kg: 9.28, datum: "2026-11-04" },
];
const freigabe = { datum: "2026-11-01", zielgewichtKg: 7.2, kcalProTag: 245, tierarzt: "Praxis" };
const eingabe = {
  tier: { name: "Kito" },
  gewichte,
  mahlzeiten,
  freigaben: [freigabe],
  futter,
  von: "2026-11-01",
  bis: "2026-11-04",
  heute: "2026-11-04",
};

test("berichtDaten: Fütterung nur über abgeschlossene Tage ab dem ersten Eintrag", () => {
  const b = berichtDaten(eingabe);
  assert.deepEqual([b.fuetterung.von, b.fuetterung.bis, b.fuetterung.tage, b.fuetterung.tageMitEintrag], ["2026-11-02", "2026-11-03", 2, 2]);
  assert.ok(Math.abs(b.fuetterung.kcalProTag - 239.5625) < 1e-9);
  assert.deepEqual(
    b.fuetterung.sorten.map((s) => [s.name, s.grammProTag, Math.round(s.kcalProTag * 100) / 100, s.quelle]),
    [
      ["Purina One Light", 47.5, 155.56, "hersteller"],
      ["Sheba", 100, 77, "packung"],
      ["Snack", 2, 7, "packung"],
    ]
  );
  assert.equal(b.fuetterung.leckerliAnteil.toFixed(4), "0.0292");
});

test("berichtDaten: Gewichte im Zeitraum mit Änderung zur Messung davor", () => {
  const b = berichtDaten(eingabe);
  assert.deepEqual(
    b.gewichte.map((g) => [g.datum, g.kg, g.diffG, g.prozentProWoche.toFixed(2)]),
    [
      ["2026-11-01", 9.32, -80, "0.85"],
      ["2026-11-04", 9.28, -40, "1.00"],
    ]
  );
  assert.deepEqual([b.abnahme.startKg, b.abnahme.endKg, b.abnahme.diffG], [9.32, 9.28, 40]);
  assert.equal(b.abnahme.prozent.toFixed(2), "0.43");
});

// Dieselben Mengen, aber als Diätfutter aus der Futterliste: dann gibt es keinen Diätfutter-Hinweis.
const diaetFutter = futter.map((f) =>
  f.typ === "leckerli" ? f : { ...f, listeId: f.typ === "nass" ? "purina-om-nass" : "purina-om-trocken" }
);

test("berichtDaten: ohne Auffälligkeiten ist die Liste leer", () => {
  assert.deepEqual(berichtDaten({ ...eingabe, futter: diaetFutter }).auffaelligkeiten, []);
});

test("berichtDaten: Auffälligkeiten werden je Art gezählt", () => {
  const b = berichtDaten({ ...eingabe, futter: diaetFutter, freigaben: [{ ...freigabe, kcalProTag: 300 }] });
  assert.deepEqual(
    b.auffaelligkeiten.map((a) => [a.id, a.anzahl, a.erster, a.letzter]),
    [["unter-freigabe", 2, "2026-11-02", "2026-11-03"]]
  );
});

test("berichtDaten: Handelsfutter bei einer Freigabe unter RER(Ziel) wird je Tag gezählt", () => {
  const b = berichtDaten(eingabe);
  assert.deepEqual(
    b.auffaelligkeiten.map((a) => [a.id, a.anzahl, a.erster, a.letzter]),
    [["diaetfutter", 3, "2026-11-02", "2026-11-04"]]
  );
});

test("berichtDaten: ein Zeitraum ohne Daten ergibt leere Werte statt Fehler", () => {
  const b = berichtDaten({ ...eingabe, gewichte: [], mahlzeiten: [], freigaben: [] });
  assert.equal(b.abnahme, null);
  assert.equal(b.fuetterung, null);
  assert.deepEqual(b.gewichte, []);
});

test("berichtHtml zeigt ein gültiges Profilbild neben dem Namen, sonst keins", () => {
  const html = (foto) => {
    const tier = { name: "Kito", geschlecht: "kater", kastriert: true, ...(foto ? { foto } : {}) };
    const b = berichtDaten({ ...eingabe, tier });
    return berichtHtml(b, { tier, gewichte, mahlzeiten, freigaben: [freigabe], futterNachId: new Map(futter.map((f) => [f.id, f])), erstellt: "2026-11-04", demo: false });
  };
  assert.match(html("data:image/jpeg;base64,AAAA"), /<img class="bericht-foto" src="data:image\/jpeg;base64,AAAA"/);
  assert.doesNotMatch(html(null), /bericht-foto/);
  assert.doesNotMatch(html("javascript:x"), /<img/);
});

test("berichtHtml: Freigaben-Tabelle zeigt BCS und MCS, ohne Angabe einen Strich", () => {
  const html = (fr) => {
    const b = berichtDaten({ ...eingabe, freigaben: [fr] });
    return berichtHtml(b, { tier: { name: "Kito" }, gewichte, mahlzeiten, freigaben: [fr], futterNachId: new Map(futter.map((f) => [f.id, f])), erstellt: "2026-11-04", demo: false });
  };
  const mit = html({ ...freigabe, bcs: 8, mcs: "leicht" });
  assert.match(mit, /<th>BCS<\/th><th>MCS<\/th>/);
  assert.match(mit, /<td>8<\/td><td>leichter Muskelabbau<\/td>/);
  assert.match(html(freigabe), /<td>–<\/td><td>–<\/td>/);
});

test("berichtHtml: Fotos nur auf Wunsch, erstes und letztes Foto im Zeitraum mit Datum und kg", () => {
  const A = "data:image/jpeg;base64,AAAA";
  const B = "data:image/jpeg;base64,BBBB";
  const mitFotos = [
    { kg: 9.4, datum: "2026-10-25", foto: "data:image/jpeg;base64,ALT" }, // vor dem Zeitraum
    { kg: 9.32, datum: "2026-11-01", foto: A },
    { kg: 9.3, datum: "2026-11-02", foto: "kaputt" },
    { kg: 9.28, datum: "2026-11-04", foto: B },
  ];
  const html = (fotos, gw = mitFotos) =>
    berichtHtml(berichtDaten({ ...eingabe, gewichte: gw }), {
      tier: { name: "Kito" }, gewichte: gw, mahlzeiten, freigaben: [freigabe],
      futterNachId: new Map(futter.map((f) => [f.id, f])), erstellt: "2026-11-04", demo: false, fotos,
    });
  assert.doesNotMatch(html(false), /bericht-vn/);
  const mit = html(true);
  assert.match(mit, /<h2>Fotos<\/h2>/);
  assert.match(mit, /src="data:image\/jpeg;base64,AAAA"[\s\S]*01\.11\.2026 · 9,32 kg[\s\S]*src="data:image\/jpeg;base64,BBBB"[\s\S]*9,28 kg/);
  assert.doesNotMatch(mit, /ALT|kaputt/);
  // nur ein Foto im Zeitraum: einzeln
  const eins = html(true, [{ kg: 9.32, datum: "2026-11-01", foto: A }]);
  assert.equal((eins.match(/class="bericht-vn-bild"/g) ?? []).length, 1);
  // kein Foto im Zeitraum: Satz statt Bildern
  assert.match(html(true, gewichte), /Im Zeitraum gibt es kein Foto/);
});

test("berichtHtml: Legende „Freigabe“ nur, wenn das Diagramm eine Freigabe-Linie zeichnet", () => {
  const html = (frs) =>
    berichtHtml(berichtDaten({ ...eingabe, freigaben: frs }), {
      tier: { name: "Kito" }, gewichte, mahlzeiten, freigaben: frs,
      futterNachId: new Map(futter.map((f) => [f.id, f])), erstellt: "2026-11-04", demo: false,
    });
  const legende = /<span class="schluessel strich"><\/span>Freigabe/;
  assert.match(html([freigabe]), legende);
  assert.match(html([freigabe]), /class="freigabe-linie"/);
  assert.doesNotMatch(html([]), legende);
  // Freigabe erst nach dem gezeigten Zeitraum: keine Linie, also auch keine Legende
  const spaeter = { ...freigabe, datum: "2026-12-01" };
  assert.doesNotMatch(html([spaeter]), /class="freigabe-linie"/);
  assert.doesNotMatch(html([spaeter]), legende);
  // Futter und Leckerli stehen immer in der Legende
  assert.match(html([]), /reihe-1"><\/span>Futter<\/li><li><span class="schluessel reihe-2"><\/span>Leckerli/);
});

// ---------- 0.33.0: Besondere Tage im Bericht ----------
const BT = (felder) => ({ id: "b" + Math.random(), tierId: "kito", art: "krank", von: "2026-11-02", bis: "2026-11-02", notiz: "", ...felder });
const besondere = [
  BT({ id: "laufend", art: "weniger-bewegung", von: "2026-11-03", bis: null }),
  BT({ id: "davor", von: "2026-10-20", bis: "2026-10-20" }),
  BT({ id: "phase", von: "2026-10-30", bis: "2026-11-02", notiz: "<b>Durchfall</b>" }),
  BT({ id: "tag", art: "genascht", von: "2026-11-02", bis: "2026-11-02" }),
  BT({ id: "neu", art: "zukunft-art", von: "2026-11-04", bis: "2026-11-04", notiz: "aus einer neueren Fassung" }),
];
const mitBesonderen = (liste, extra = {}) => {
  const b = berichtDaten({ ...eingabe, besondereTage: liste, ...extra });
  return berichtHtml(b, {
    tier: { name: "Kito" }, gewichte, mahlzeiten, freigaben: [freigabe], besondereTage: liste,
    futterNachId: new Map(futter.map((f) => [f.id, f])), erstellt: "2026-11-04", demo: false, ...extra,
  });
};

test("berichtDaten: besondere Tage, die den Zeitraum berühren, nach Beginn sortiert", () => {
  const b = berichtDaten({ ...eingabe, besondereTage: besondere });
  assert.deepEqual(b.besondereTage.map((e) => e.id), ["phase", "tag", "laufend", "neu"]);
  assert.deepEqual(berichtDaten(eingabe).besondereTage, []);
});

// ---------- 0.35.0: Besondere Tage als Liste direkt unter Kurve und Streifen ----------
// Wunsch des Halters 05.11.2026: Der Tierarzt soll sehen, was war, ohne weiter unten in einer Tabelle zu suchen.
// Zeilen der Liste als [Nummer?, Zeitraum, Art, Notiz, "notfall"?]; Tags in den Zellen (Nummernkreis) entfernt.
const listenZeilen = (html) => {
  const liste = html.match(/<table class="bt-liste">([^]*?)<\/table>/)[1];
  return [...liste.matchAll(/<tr( class="notfall")?>([^]*?)<\/tr>/g)].map((m) => [
    ...[...m[2].matchAll(/<td>([^]*?)<\/td>/g)].map((z) => z[1].replace(/<[^>]+>/g, "")),
    ...(m[1] ? ["notfall"] : []),
  ]);
};
const streifenVon = (html) => html.match(/<svg[^>]*class="bt-leiste"[^]*?<\/svg>/)[0];
const streifenNummern = (html) => [...streifenVon(html).matchAll(/class="bt-nr( notfall)?"[^>]*>(\d+)</g)].map((m) => m[2] + (m[1] ?? ""));

test("berichtHtml: besondere Tage stehen im Abschnitt Gewicht: Kurve, Streifen, Liste, dann die Wägungen", () => {
  const html = mitBesonderen(besondere);
  const gewicht = html.indexOf("<h2>Gewicht</h2>");
  const streifen = html.indexOf('class="bt-leiste"');
  const liste = html.indexOf("<h3>Besondere Tage");
  const waegungen = html.indexOf('<table class="wg-raster">');
  assert.ok(gewicht < streifen && streifen < liste && liste < waegungen, [gewicht, streifen, liste, waegungen].join());
  assert.ok(waegungen < html.indexOf("<h2>Fütterung</h2>"));
  assert.match(html, /<h3>Besondere Tage <small>vom Halter festgehalten, ohne Mengen<\/small><\/h3>/);
  // kein eigener Abschnitt weiter unten und keine Erklärzeile mehr (0.34.1)
  assert.doesNotMatch(html, /<h2>Besondere Tage<\/h2>/);
  assert.doesNotMatch(html, /zl-text|Streifen unter der Kurve/);
});

test("berichtHtml: Liste mit Nummer, kurzem Zeitraum ohne Jahr, Art und maskierter Notiz", () => {
  const html = mitBesonderen(besondere);
  assert.deepEqual(listenZeilen(html), [
    ["1", "30.10.–2.11.", "Krank", "&lt;b&gt;Durchfall&lt;/b&gt;"],
    ["2", "2.11.", "Außer der Reihe genascht", ""],
    ["3", "seit 3.11.", "Weniger Bewegung", "läuft noch"],
    ["4", "4.11.", "Sonstiges", "aus einer neueren Fassung"],
  ]);
  assert.match(html, /<td><span class="bt-nr-kreis">1<\/span><\/td>/);
  assert.deepEqual(streifenNummern(html), ["1", "2", "3", "4"]);
  assert.doesNotMatch(html, /20\.10\./); // liegt vor dem Zeitraum
  assert.doesNotMatch(html, /<b>Durchfall/);
});

test("berichtHtml: „Futter verweigert“ hervorgehoben, „läuft noch“ hinter der Notiz", () => {
  const html = mitBesonderen([
    BT({ art: "futter-verweigert", von: "2026-11-02", bis: "2026-11-02" }),
    BT({ art: "weniger-bewegung", von: "2026-11-01", bis: null, notiz: "nur drinnen" }),
  ]);
  assert.deepEqual(listenZeilen(html), [
    ["1", "seit 1.11.", "Weniger Bewegung", "nur drinnen · läuft noch"],
    ["2", "2.11.", "Futter verweigert", "", "notfall"],
  ]);
  assert.match(html, /<td><span class="bt-nr-kreis notfall">2<\/span><\/td>/);
  assert.deepEqual(streifenNummern(html), ["1", "2 notfall"]);
});

test("berichtHtml: ein Eintrag vor der ersten Wägung steht mit Nummer in der Liste, aber nicht im Streifen", () => {
  // Zeitraum ab 30.10., erste Wägung darin am 01.11.: dort beginnt die Achse
  const html = mitBesonderen([BT({ von: "2026-10-31", bis: "2026-10-31" }), BT({ art: "genascht", von: "2026-11-02", bis: "2026-11-02" })], {
    von: "2026-10-30",
  });
  assert.deepEqual(listenZeilen(html).map((z) => z.slice(0, 2)), [["1", "31.10."], ["2", "2.11."]]);
  assert.deepEqual(streifenNummern(html), ["2"]);
});

test("berichtHtml: liegt ein Datum in einem anderen Jahr als das Berichtsende, steht in jeder Zeile das Jahr", () => {
  const html = mitBesonderen([BT({ art: "weniger-bewegung", von: "2025-12-30", bis: null }), BT({ von: "2026-11-02", bis: "2026-11-03" })]);
  assert.deepEqual(listenZeilen(html).map((z) => z.slice(0, 2)), [["1", "seit 30.12.2025"], ["2", "02.11.2026 bis 03.11.2026"]]);
});

test("berichtHtml: Kurve und Streifen in einem Rahmen (gleiche Breite im Druck), die Liste gleich danach", () => {
  // Review 05.11.: Im Druck war das Diagramm auf 150 mm begrenzt, die Zeitleiste nicht; die Tage lagen versetzt.
  const html = mitBesonderen(besondere);
  assert.match(
    html,
    /<div class="bericht-grafik"><svg viewBox="0 0 340 \d+" class="diagramm"[^]*?<\/svg><svg viewBox="0 0 340 [\d.]+" class="bt-leiste"[^]*?<\/svg><\/div><div class="bericht-besonders"><h3>/
  );
  // ohne besondere Tage steht das Diagramm allein im Rahmen
  assert.match(mitBesonderen([]), /<div class="bericht-grafik"><svg viewBox="0 0 340 \d+" class="diagramm"[^]*?<\/svg><\/div>/);
  // Bericht bis zum 10.11., letzte Wägung am 04.11.: Endpunkt links vom rechten Rand (288)
  const spaeter = mitBesonderen(besondere, { bis: "2026-11-10", heute: "2026-11-10" });
  const endX = Number(spaeter.match(/class="endpunkt" cx="([\d.]+)"/)[1]);
  assert.ok(endX < 288, `Endpunkt bei ${endX}`);
  assert.doesNotMatch(spaeter, /NaN/);
});

test("berichtHtml: ohne besondere Tage weder Streifen noch Liste", () => {
  const html = mitBesonderen([]);
  assert.doesNotMatch(html, /Besondere Tage/);
  assert.doesNotMatch(html, /bt-leiste|bt-liste/);
  assert.doesNotMatch(mitBesonderen([BT({ von: "2026-10-20", bis: "2026-10-20" })]), /Besondere Tage/);
});

test("berichtHtml: ohne Kurve (nur eine Wägung) eigener Abschnitt mit derselben Liste, ohne Nummern", () => {
  const html = mitBesonderen(besondere, { von: "2026-11-03" }); // im Zeitraum nur die Wägung vom 04.11.
  const gewichtTeil = html.slice(html.indexOf("<h2>Gewicht</h2>"), html.indexOf("</section>", html.indexOf("<h2>Gewicht</h2>")));
  assert.doesNotMatch(gewichtTeil, /class="diagramm"|bt-leiste|Besondere Tage/);
  const abschnitt = html.indexOf("<h2>Besondere Tage</h2>");
  assert.ok(abschnitt > html.indexOf("<h2>Gewicht</h2>") && abschnitt < html.indexOf("<h2>Fütterung</h2>"));
  assert.doesNotMatch(html, /bt-nr-kreis/);
  assert.deepEqual(listenZeilen(html), [
    ["seit 3.11.", "Weniger Bewegung", "läuft noch"],
    ["4.11.", "Sonstiges", "aus einer neueren Fassung"],
  ]);
});

// ---------- 0.36.0: Wägungen nebeneinander, eine Zeile je Monat ----------
// Wunsch des Halters 05.11.2026: „höchstens 4, 5 Wägungen im Monat … optisch angenehmer“. Spezifikation: .planning/waegungen-pdf.md.
// Kitos Beispiel bis zum Termin: 7 Wägungen vom 2.10. bis 13.11.2026, eine davon auf dem Arm.
const W = (datum, kg, diffG = null, notiz = "") => ({ datum, kg, diffG, notiz });
const plusTag = (iso, n) => {
  const [j, m, t] = iso.split("-").map(Number);
  const d = new Date(j, m - 1, t + n, 12);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const kitoWaegungen = [
  W("2026-10-02", 9.32), W("2026-10-09", 9.3, -20), W("2026-10-16", 9.27, -30), W("2026-10-23", 9.25, -20, "auf dem Arm gewogen"),
  W("2026-10-30", 9.26, 10), W("2026-11-06", 9.2, -60), W("2026-11-13", 9.16, -40),
];

test("waegungsMonate: eine Gruppe je Monat mit kurzem Titel, bis zu 5 Wägungen je Zeile", () => {
  assert.equal(WAEGUNGEN_PRO_ZEILE, 5);
  const { monate } = waegungsMonate(kitoWaegungen);
  assert.deepEqual(monate.map((m) => m.titel), ["Okt 2026", "Nov 2026"]);
  assert.deepEqual(monate.map((m) => m.zeilen.map((z) => z.map((g) => g.datum.slice(8)))), [
    [["02", "09", "16", "23", "30"]],
    [["06", "13"]],
  ]);
  // Monatsnamen fest, nicht vom Browser: Node und Chrome kürzen unterschiedlich („Mär“/„März“).
  const titel = waegungsMonate(["01", "03", "06", "07", "09", "12"].map((m) => W(`2026-${m}-15`, 9))).monate.map((m) => m.titel);
  assert.deepEqual(titel, ["Jan 2026", "März 2026", "Juni 2026", "Juli 2026", "Sep 2026", "Dez 2026"]);
});

test("waegungsMonate: mehr als 5 Wägungen im Monat rutschen in eine weitere Zeile desselben Monats", () => {
  const taeglich = Array.from({ length: 12 }, (_, i) => W(`2026-10-${String(i + 1).padStart(2, "0")}`, 9.3 - i / 100, i ? -10 : null));
  const { monate } = waegungsMonate(taeglich);
  assert.equal(monate.length, 1);
  assert.deepEqual(monate[0].zeilen.map((z) => z.length), [5, 5, 2]);
});

test("waegungsMonate: Bilanz ab der letzten Wägung des Vormonats, im ersten Monat ab seiner ersten Wägung", () => {
  const [okt, nov] = waegungsMonate(kitoWaegungen).monate;
  // Oktober: 2.10. 9,32 → 30.10. 9,26 in 4 Wochen: −60 g, 0,06 / 9,32 / 4 = 0,161 % KM/Woche
  assert.equal(okt.bilanz.diffG, -60);
  assert.equal(okt.bilanz.prozentProWoche.toFixed(2), "0.16");
  // November: 30.10. 9,26 → 13.11. 9,16 in 2 Wochen: −100 g, 0,10 / 9,26 / 2 = 0,540 % KM/Woche
  assert.equal(nov.bilanz.diffG, -100);
  assert.equal(nov.bilanz.prozentProWoche.toFixed(2), "0.54");
  // Nur eine Wägung im ersten Monat: keine Bilanz
  assert.equal(waegungsMonate([W("2026-10-30", 9.26), W("2026-11-06", 9.2, -60)]).monate[0].bilanz, null);
  // Zunahme: negative Prozentzahl
  const zu = waegungsMonate([W("2026-10-02", 9.0), W("2026-10-16", 9.1, 100)]).monate[0].bilanz;
  assert.equal(zu.diffG, 100);
  assert.ok(zu.prozentProWoche < 0);
});

test("waegungsMonate: Notizen bekommen Buchstaben in Reihenfolge, nach z geht es mit aa weiter", () => {
  const { monate, notizen } = waegungsMonate(kitoWaegungen);
  assert.deepEqual(notizen, [{ buchstabe: "a", datum: "2026-10-23", notiz: "auf dem Arm gewogen" }]);
  assert.equal(monate[0].zeilen[0][3].buchstabe, "a");
  assert.equal(monate[0].zeilen[0][2].buchstabe, null);
  const viele = Array.from({ length: 28 }, (_, i) => W(plusTag("2026-01-01", i), 9, null, "n" + i));
  assert.deepEqual(waegungsMonate(viele).notizen.map((n) => n.buchstabe).slice(24), ["y", "z", "aa", "ab"]);
});

const mitWaegungen = (gw, extra = {}) => {
  const ein = { ...eingabe, gewichte: gw, von: gw[0].datum, bis: gw.at(-1).datum, heute: gw.at(-1).datum, ...extra };
  return berichtHtml(berichtDaten(ein), {
    tier: { name: "Kito" }, gewichte: gw, mahlzeiten, freigaben: [freigabe],
    futterNachId: new Map(futter.map((f) => [f.id, f])), erstellt: ein.bis, demo: false,
  });
};
const G2 = (datum, kg, notiz) => ({ datum, kg, ...(notiz ? { notiz } : {}) });
const kitoRoh = kitoWaegungen.map((g) => G2(g.datum, g.kg, g.notiz));
// Zellen des Rasters als Text: Monat | Tag kg Änderung | … | Bilanz
const rasterZeilen = (html) =>
  [...html.match(/<table class="wg-raster">([^]*?)<\/table>/)[1].matchAll(/<tr( class="wg-letzte")?>([^]*?)<\/tr>/g)]
    .filter((m) => !m[2].includes("Wägungen in kg"))
    .map((m) => [...m[2].matchAll(/<t[hd][^>]*>([^]*?)<\/t[hd]>/g)].map((z) => z[1].replace(/<(span|b|small|sup)[^>]*>/g, " ").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim()));

test("berichtHtml: Wägungen als Monatsraster statt Tabelle untereinander", () => {
  const html = mitWaegungen(kitoRoh);
  assert.doesNotMatch(html, /<th>Datum<\/th><th>kg<\/th>/);
  assert.match(html, /<th colspan="5">Wägungen in kg <span class="wg-erkl">Datum, Gewicht, Änderung zur Wägung davor<\/span><\/th><th>Monat<\/th>/);
  assert.deepEqual(rasterZeilen(html), [
    ["Okt 2026", "2.10. 9,32 –", "9.10. 9,30 −20 g", "16.10. 9,27 −30 g", "23.10. 9,25 a −20 g", "30.10. 9,26 +10 g", "−60 g 0,16 % KM/Woche"],
    ["Nov 2026", "6.11. 9,20 −60 g", "13.11. 9,16 −40 g", "", "", "", "−100 g 0,54 % KM/Woche"],
  ]);
  assert.match(html, /<th scope="row" class="wg-monat" rowspan="1">Okt 2026<\/th>/);
});

test("berichtHtml: Notizen als Buchstabe am Gewicht und ausgeschrieben unter dem Raster, maskiert", () => {
  const html = mitWaegungen([G2("2026-10-02", 9.32), G2("2026-10-09", 9.3, "<i>Arm</i>"), G2("2026-10-16", 9.27, "andere Waage")]);
  assert.match(html, /9,30<sup class="wg-marke">a<\/sup>/);
  assert.match(html, /<p class="wg-notizen"><span><sup>a<\/sup> 9\.10\. &lt;i&gt;Arm&lt;\/i&gt;<\/span><span><sup>b<\/sup> 16\.10\. andere Waage<\/span><\/p>/);
  assert.doesNotMatch(mitWaegungen([G2("2026-10-02", 9.32), G2("2026-10-09", 9.3)]), /wg-notizen/);
  // Der Kopf der Übersicht verweist auf die Anmerkungen statt auf die alte Spalte „Notiz“.
  assert.match(html, /andere Wiegeart steht als Anmerkung unter den Wägungen/);
  assert.doesNotMatch(html, /Spalte Notiz/);
});

test("berichtHtml: Notiz aus einem anderen Jahr als das Berichtsende steht mit Jahr", () => {
  const html = mitWaegungen([G2("2025-12-19", 9.4, "auf dem Arm"), G2("2026-01-09", 9.32)]);
  assert.match(html, /<span><sup>a<\/sup> 19\.12\.2025 auf dem Arm<\/span>/);
  assert.deepEqual(rasterZeilen(html).map((z) => z[0]), ["Dez 2025", "Jan 2026"]);
});

test("berichtHtml: Zunahme im Monat steht als „Zunahme … % KM/Woche“, nicht mit Minus", () => {
  const html = mitWaegungen([G2("2026-10-02", 9.0), G2("2026-10-16", 9.1)]);
  assert.equal(rasterZeilen(html)[0].at(-1), "+100 g Zunahme 0,56 % KM/Woche");
});

test("berichtHtml: mehr als 5 Wägungen im Monat: Monat und Bilanz über beide Zeilen", () => {
  const gw = Array.from({ length: 7 }, (_, i) => G2(plusTag("2026-10-01", i * 4), 9.3 - i / 100));
  const html = mitWaegungen(gw);
  assert.match(html, /<th scope="row" class="wg-monat" rowspan="2">Okt 2026<\/th>/);
  assert.match(html, /<td class="wg-summe" rowspan="2">/);
  const zeilen = rasterZeilen(html);
  assert.equal(zeilen.length, 2);
  assert.equal(zeilen[1].length, 5); // zweite Zeile ohne Monat und Bilanz (rowspan), 2 Wägungen + 3 leere Felder
});

// ---------- 0.36.1: Raster passt am PC in den Kasten der Übersicht ----------
// Fund des Halters 05.11.2026 (Screenshot am PC): rechts war „KM/Woche“ abgeschnitten, weil die Mindestbreite
// des Rasters (34rem = 544 px) größer war als der Platz im Kasten (main max. 560 px, je 16 px Seitenrand,
// je 1 px Linie und je 16 px Innenabstand der Übersicht = 494 px). Auf dem Handy scrollt es weiter innen.
test("styles.css: Monatsraster passt am PC ohne Wischen in die Übersicht", () => {
  const css = readFileSync(new URL("../styles.css", import.meta.url), "utf8");
  const main = Number(css.match(/\nmain \{\s*max-width: (\d+)px;/)[1]);
  const platz = main - 2 * 16 - 2 * 1 - 2 * 16;
  const m = css.match(/\.bericht table\.wg-raster \{[^}]*min-width: ([\d.]+)rem/);
  assert.ok(m, "Mindestbreite des Rasters in rem");
  assert.ok(Number(m[1]) * 16 <= platz, `${m[1]}rem = ${Number(m[1]) * 16} px, Platz ${platz} px`);
});
