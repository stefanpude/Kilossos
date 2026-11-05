import { test } from "node:test";
import assert from "node:assert/strict";
import { berichtDaten, berichtHtml } from "../js/bericht.js";

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

test("berichtHtml: Abschnitt „Besondere Tage“ nach dem Gewicht, mit ganzem Zeitraum und maskierter Notiz", () => {
  const html = mitBesonderen(besondere);
  const abschnitt = html.indexOf("<h2>Besondere Tage</h2>");
  assert.ok(abschnitt > html.indexOf("<h2>Gewicht</h2>") && abschnitt < html.indexOf("<h2>Fütterung</h2>"));
  const teil = html.slice(abschnitt, html.indexOf("</section>", abschnitt));
  assert.match(teil, /Vom Halter festgehalten, ohne Mengenangaben\./);
  assert.match(teil, /<th>Zeitraum<\/th><th>Art<\/th><th>Notiz<\/th>/);
  assert.match(teil, /<td>30\.10\.2026 bis 02\.11\.2026<\/td><td>Krank<\/td><td>&lt;b&gt;Durchfall&lt;\/b&gt;<\/td>/);
  assert.match(teil, /<td>02\.11\.2026<\/td><td>Außer der Reihe genascht<\/td><td><\/td>/);
  assert.match(teil, /<td>seit 03\.11\.2026, läuft noch<\/td><td>Weniger Bewegung<\/td>/);
  assert.match(teil, /<td>04\.11\.2026<\/td><td>Sonstiges<\/td><td>aus einer neueren Fassung<\/td>/);
  assert.doesNotMatch(teil, /20\.10\.2026/);
  assert.doesNotMatch(html, /<b>Durchfall/);
});

test("berichtHtml: ohne besondere Tage kein Abschnitt und keine Zeitleiste", () => {
  const html = mitBesonderen([]);
  assert.doesNotMatch(html, /Besondere Tage/);
  assert.doesNotMatch(html, /class="zeitleiste"/);
  assert.doesNotMatch(mitBesonderen([BT({ von: "2026-10-20", bis: "2026-10-20" })]), /Besondere Tage/);
});

test("berichtHtml: Zeitleiste direkt unter dem Gewichtsdiagramm, Achse bis zum Berichtsende", () => {
  const html = mitBesonderen(besondere);
  assert.match(html, /<\/svg><svg viewBox="0 0 340 \d+" class="zeitleiste"/);
  assert.doesNotMatch(html, /NaN/);
  // Bericht bis zum 10.11., letzte Wägung am 04.11.: Endpunkt links vom rechten Rand (288)
  const spaeter = mitBesonderen(besondere, { bis: "2026-11-10", heute: "2026-11-10" });
  const endX = Number(spaeter.match(/class="endpunkt" cx="([\d.]+)"/)[1]);
  assert.ok(endX < 288, `Endpunkt bei ${endX}`);
});

test("berichtHtml: Diagramm und Zeitleiste stehen in einem gemeinsamen Rahmen (gleiche Breite im Druck)", () => {
  // Review 05.11.: Im Druck war das Diagramm auf 150 mm begrenzt, die Zeitleiste nicht; die Tage lagen versetzt.
  const html = mitBesonderen(besondere);
  assert.match(html, /<div class="bericht-grafik"><svg viewBox="0 0 340 \d+" class="diagramm"[^]*?<\/svg><svg viewBox="0 0 340 \d+" class="zeitleiste"[^]*?<\/svg><p class="bericht-klein zl-text">[^<]*<\/p><\/div>/);
  // ohne besondere Tage steht das Diagramm allein im Rahmen
  assert.match(mitBesonderen([]), /<div class="bericht-grafik"><svg viewBox="0 0 340 \d+" class="diagramm"[^]*?<\/svg><\/div>/);
});

test("berichtHtml: eine Zeile unter der Zeitleiste erklärt Balken, Punkt und Rot (0.34.1)", () => {
  // Review 0.33.0, Fund b: Ohne Beschriftung versteht der Tierarzt die Streifen erst über die Tabelle weiter unten.
  const html = mitBesonderen(besondere);
  const text = html.match(/<p class="bericht-klein zl-text">([^<]*)<\/p>/)[1];
  assert.equal(
    text,
    "Streifen unter der Kurve: besondere Tage auf derselben Zeitachse. Balken = mehrere Tage, Punkt = ein Tag, rot = Futter verweigert. Einzelheiten im Abschnitt „Besondere Tage“."
  );
  // ohne Zeitleiste keine Zeile, auch wenn ein Eintrag nur vor der ersten Wägung liegt
  assert.doesNotMatch(mitBesonderen([]), /zl-text/);
  assert.doesNotMatch(mitBesonderen([BT({ von: "2026-10-20", bis: "2026-10-20" })]), /zl-text/);
});
