import { test } from "node:test";
import assert from "node:assert/strict";
import {
  verlaufGewichte,
  weicheKurve,
  zeichneVerlauf,
  zeitleiste,
  naechsterZeitleistenEintrag,
  gewichtDiagramm,
  PDF_RAND,
  pdfZeitleiste,
  kcalDiagramm,
} from "../js/verlauf.js";

const G = (datum, kg) => ({ id: datum, tierId: "k", datum, kg, notiz: "" });
const gewichte = [G("2026-10-15", 9.0), G("2026-10-01", 9.32), G("2026-10-08", 9.25)];
const freigabe = { id: "f", tierId: "k", datum: "2026-10-08", zielgewichtKg: 7.2, kcalProTag: 220, tierarzt: "T", notiz: "" };

test("verlaufGewichte: nur ab dem Starttag, aufsteigend", () => {
  assert.deepEqual(verlaufGewichte(gewichte, "2026-10-08").map((g) => g.datum), ["2026-10-08", "2026-10-15"]);
  assert.deepEqual(verlaufGewichte(gewichte, null).map((g) => g.datum), ["2026-10-01", "2026-10-08", "2026-10-15"]);
});

test("weicheKurve: erst ab zwei Wägungen, ohne NaN", () => {
  assert.equal(weicheKurve([G("2026-10-01", 9.32)], []), "");
  const kurve = weicheKurve(gewichte, []);
  assert.match(kurve, /<svg[^>]*class="kurve"/);
  assert.match(kurve, /<path/);
  assert.match(kurve, /data-punkte=/);
  assert.doesNotMatch(kurve, /NaN/);
  assert.doesNotMatch(kurve, /class="ziel"/);
});

test("weicheKurve: Ziellinie nur mit Freigabe und nur im sichtbaren Bereich", () => {
  assert.doesNotMatch(weicheKurve(gewichte, [freigabe]), /class="ziel"/); // 7,2 kg liegt weit unter 9 kg
  assert.match(weicheKurve(gewichte, [{ ...freigabe, zielgewichtKg: 9.1 }]), /class="ziel"/);
  assert.match(weicheKurve(gewichte, [freigabe]), /class="band"/);
});

test("weicheKurve: Korridor im Zeitraum rechnet vom Gewicht am Tag der ersten Freigabe", () => {
  const lang = [G("2026-03-09", 9.32), G("2026-08-03", 7.9), G("2026-08-10", 7.85)];
  const f = { ...freigabe, datum: "2026-03-09" };
  const kurve = weicheKurve(lang, [f], "2026-08-01");
  // 0,5 %/Woche ab 9,32 kg liegt Anfang August noch über 8,3 kg, also über dem sichtbaren Bereich: oberer Rand oben.
  const ersterPunktY = Number(kurve.match(/class="band" points="[\d.]+,([\d.]+)/)[1]);
  assert.ok(ersterPunktY < 20, `oberer Rand bei y=${ersterPunktY}`);
  assert.equal((kurve.match(/data-punkte="([^"]*)"/)[1].match(/kg/g) ?? []).length, 2); // nur Punkte im Zeitraum
});

test("zeichneVerlauf: Zeitraum mit weniger als zwei Wägungen zeigt einen Satz statt einer Kurve", () => {
  const html = zeichneVerlauf({
    gewichte,
    mahlzeiten: [],
    freigaben: [],
    futterNachId: new Map(),
    zeitraum: "1m",
    heute: "2026-11-24",
    kopf: "",
  });
  assert.match(html, /Im gewählten Zeitraum wurde weniger als zweimal gewogen\./);
  assert.doesNotMatch(html, /class="kurve"/);
  assert.match(html, /data-aktion="zeitraum"/);
});

test("zeichneVerlauf: Zeitraum-Umschalter sind Umschaltknöpfe (aria-pressed), keine Tabs", () => {
  const html = zeichneVerlauf({ gewichte, mahlzeiten: [], freigaben: [], futterNachId: new Map(), zeitraum: "3m", heute: "2026-10-20", kopf: "" });
  assert.doesNotMatch(html, /role="tab/);
  assert.match(html, /data-wert="3m" aria-pressed="true"/);
  assert.match(html, /data-wert="1m" aria-pressed="false"/);
});

test("zeichneVerlauf: Änderungs-Marke ist neutral (kein Grün ohne Bewertung)", () => {
  const html = zeichneVerlauf({ gewichte, mahlzeiten: [], freigaben: [], futterNachId: new Map(), zeitraum: "alles", heute: "2026-10-20", kopf: "" });
  const marke = html.match(/<span class="marke[^"]*">[^<]* kg<\/span>/)[0];
  assert.doesNotMatch(marke, /marke-(gut|warnung|gefahr)/);
});

test("zeichneVerlauf: Kennzahl-Kacheln folgen dem Zeitraum", () => {
  const mitAlt = [G("2026-08-01", 9.6), ...gewichte];
  const html = zeichneVerlauf({ gewichte: mitAlt, mahlzeiten: [], freigaben: [], futterNachId: new Map(), zeitraum: "1m", heute: "2026-10-20", kopf: "" });
  assert.match(html, /Start<\/span><strong>9,32 kg/);
  assert.doesNotMatch(html, /9,60 kg/);
  const alles = zeichneVerlauf({ gewichte: mitAlt, mahlzeiten: [], freigaben: [], futterNachId: new Map(), zeitraum: "alles", heute: "2026-10-20", kopf: "" });
  assert.match(alles, /Start<\/span><strong>9,60 kg/);
});

test("zeichneVerlauf: ohne Freigabe kein „im sicheren Bereich“", () => {
  const html = zeichneVerlauf({ gewichte, mahlzeiten: [], freigaben: [], futterNachId: new Map(), zeitraum: "alles", heute: "2026-10-20", kopf: "" });
  assert.match(html, /Ø [\d,]+ % pro Woche/);
  assert.doesNotMatch(html, /im sicheren Bereich/);
  const mit = zeichneVerlauf({ gewichte, mahlzeiten: [], freigaben: [freigabe], futterNachId: new Map(), zeitraum: "alles", heute: "2026-10-20", kopf: "" });
  assert.match(mit, /von 1 Wochen? im sicheren Bereich/);
});

test("zeichneVerlauf: Karte „Befunde vom Tierarzt“ nur mit Freigaben, mit BCS und MCS", () => {
  const ohne = zeichneVerlauf({ gewichte, mahlzeiten: [], freigaben: [], futterNachId: new Map(), zeitraum: "alles", heute: "2026-10-20", kopf: "" });
  assert.doesNotMatch(ohne, /Befunde vom Tierarzt/);
  const mit = zeichneVerlauf({
    gewichte,
    mahlzeiten: [],
    freigaben: [{ ...freigabe, bcs: 8, mcs: "leicht" }, { ...freigabe, id: "g", datum: "2026-10-15" }],
    futterNachId: new Map(),
    zeitraum: "alles",
    heute: "2026-10-20",
    kopf: "",
  });
  assert.match(mit, /Befunde vom Tierarzt/);
  assert.match(mit, /BCS 8 von 9 · leichter Muskelabbau/);
  assert.match(mit, /ohne BCS/);
  // neueste Freigabe zuerst
  assert.ok(mit.indexOf("15.10.") < mit.indexOf("8.10."));
});

// Seit 0.34.0 gilt bei zwei Freigaben am selben Tag (alte Daten) die zuletzt eingetragene; die Karte muss dieselbe
// als „neueste“ zeigen wie Tafel und Rechnung (Review-Fund).
test("zeichneVerlauf: Befunde-Karte zeigt bei gleichem Datum die zuletzt eingetragene als neueste", () => {
  const html = zeichneVerlauf({
    gewichte,
    mahlzeiten: [],
    freigaben: [{ ...freigabe, id: "a", datum: "2026-10-13", bcs: 8 }, { ...freigabe, id: "b", datum: "2026-10-13", bcs: 7 }],
    futterNachId: new Map(),
    zeitraum: "alles",
    heute: "2026-10-20",
    kopf: "",
  });
  const kopf = html.match(/Befunde vom Tierarzt<\/span><br>\s*([^<]*)/)[1].trim();
  assert.equal(kopf, "BCS 7 von 9");
  const liste = html.slice(html.indexOf('id="ak-befunde"'));
  assert.ok(liste.includes("BCS 8 von 9"));
  assert.ok(liste.indexOf("BCS 7 von 9") < liste.indexOf("BCS 8 von 9"));
});

test("zeichneVerlauf: Vorher/Nachher-Karte steht ganz am Ende, hinter den Befunden (0.29.4)", () => {
  const html = zeichneVerlauf({ gewichte, mahlzeiten: [], freigaben: [freigabe], futterNachId: new Map(), zeitraum: "3m", heute: "2026-10-20", kopf: "", fotos: "<section id=\"fotos-test\"></section>" });
  const tempo = html.indexOf("Tempo pro Woche");
  const befunde = html.indexOf("Befunde vom Tierarzt");
  const fotos = html.indexOf('id="fotos-test"');
  assert.ok(tempo >= 0 && befunde > tempo && fotos > befunde);
  assert.ok(html.trimEnd().endsWith('<section id="fotos-test"></section>'));
});

test("zeichneVerlauf: Tipp zur Kurve steht in der Gewichtskarte unter der Legende (0.29.4)", () => {
  const html = zeichneVerlauf({ gewichte, mahlzeiten: [], freigaben: [], futterNachId: new Map(), zeitraum: "3m", heute: "2026-10-20", kopf: "" });
  const legende = html.indexOf('class="legende-zeile"');
  const tipp = html.indexOf("Tippe auf die Kurve");
  assert.ok(legende >= 0 && tipp > legende);
  assert.ok(tipp < html.indexOf("</section>", legende)); // noch in der Gewichtskarte
  assert.ok(tipp < html.indexOf("Tempo pro Woche"));
  // Zeitraum ohne Kurve: kein Tipp zur Kurve
  const ohneKurve = zeichneVerlauf({ gewichte, mahlzeiten: [], freigaben: [], futterNachId: new Map(), zeitraum: "1m", heute: "2026-11-24", kopf: "" });
  assert.doesNotMatch(ohneKurve, /Tippe auf die Kurve/);
});

test("zeichneVerlauf: Legende nennt Ziel und sicheren Bereich nur, wenn die Kurve sie zeigt (0.32.1)", () => {
  const verlauf = (freigaben, heute = "2026-10-15") =>
    zeichneVerlauf({ gewichte, mahlzeiten: [], freigaben, futterNachId: new Map(), zeitraum: "3m", heute, kopf: "" });
  const legende = (text) => {
    const start = text.indexOf('class="legende-zeile"');
    return text.slice(start, text.indexOf("</p>", start));
  };
  // Ziel 7,2 kg liegt weit unter der Kurve (9,0 bis 9,32 kg): keine Linie, also auch kein Eintrag.
  assert.doesNotMatch(legende(verlauf([freigabe])), /Ziel vom Tierarzt/);
  assert.match(legende(verlauf([{ ...freigabe, zielgewichtKg: 9.1 }])), /Ziel vom Tierarzt/);
  // Freigabe am Tag der letzten Wägung (z. B. Wiegen beim Tierarzt): noch kein sicherer Bereich gezeichnet.
  const amEnde = { ...freigabe, datum: "2026-10-15" };
  assert.doesNotMatch(weicheKurve(gewichte, [amEnde]), /class="band"/);
  assert.doesNotMatch(legende(verlauf([amEnde])), /sicher:/);
  assert.match(legende(verlauf([amEnde])), /Freigabe/);
  assert.match(legende(verlauf([freigabe])), /sicher: 0,5 bis 2 % pro Woche/);
});

test("zeichneVerlauf: Fotos erscheinen auch, wenn es noch keinen Verlauf gibt", () => {
  const html = zeichneVerlauf({ gewichte: gewichte.slice(0, 1), mahlzeiten: [], freigaben: [], futterNachId: new Map(), zeitraum: "3m", heute: "2026-10-20", kopf: "", fotos: "<section id=\"fotos-test\"></section>" });
  assert.match(html, /Sobald mindestens zwei Gewichte/);
  assert.match(html, /id="fotos-test"/);
});


// ---------- 0.33.0: Zeitachse bis heute ----------
const letztesX = (kurve) => JSON.parse(kurve.match(/data-punkte="([^"]*)"/)[1].replace(/&quot;/g, '"')).at(-1)[0];

test("weicheKurve: Zeitachse endet heute, die Linie an der letzten Wägung", () => {
  assert.equal(letztesX(weicheKurve(gewichte, [])), 300); // ohne „bis“ wie bisher
  assert.equal(letztesX(weicheKurve(gewichte, [], null, "2026-10-15")), 300); // heute gewogen: wie bisher
  const bisHeute = weicheKurve(gewichte, [], null, "2026-10-29");
  assert.ok(letztesX(bisHeute) < 300, `letzter Punkt bei x=${letztesX(bisHeute)}`);
  assert.doesNotMatch(bisHeute, /NaN/);
  // „bis“ vor der letzten Wägung (falsche Uhr am Gerät): die Achse reicht trotzdem bis zur letzten Wägung.
  assert.equal(letztesX(weicheKurve(gewichte, [], null, "2026-10-10")), 300);
});

test("zeichneVerlauf: Freigabe nach der letzten Wägung erscheint als Marke, sicherer Bereich läuft bis heute", () => {
  const verlauf = (freigaben) =>
    zeichneVerlauf({ gewichte, mahlzeiten: [], freigaben, futterNachId: new Map(), zeitraum: "3m", heute: "2026-10-20", kopf: "" });
  const legende = (text) => {
    const start = text.indexOf('class="legende-zeile"');
    return text.slice(start, text.indexOf("</p>", start));
  };
  const amEnde = { ...freigabe, datum: "2026-10-15" };
  assert.match(verlauf([amEnde]), /class="band"/);
  assert.match(legende(verlauf([amEnde])), /sicher: 0,5 bis 2 % pro Woche/);
  const danach = { ...freigabe, datum: "2026-10-18" };
  assert.match(verlauf([danach]), /class="freigabe-marke"/);
  assert.match(legende(verlauf([danach])), /Freigabe/);
});

test("gewichtDiagramm (PDF): Achse bis zum Berichtsende, Endpunkt an der letzten Wägung", () => {
  const endX = (svg) => Number(svg.match(/class="endpunkt" cx="([\d.]+)"/)[1]);
  assert.equal(endX(gewichtDiagramm(gewichte, [])), 340 - PDF_RAND.rechts);
  const bisEnde = gewichtDiagramm(gewichte, [freigabe], "2026-10-31");
  assert.ok(endX(bisEnde) < 340 - PDF_RAND.rechts);
  assert.doesNotMatch(bisEnde, /NaN/);
  assert.deepEqual(PDF_RAND, { links: 34, rechts: 52 });
});

// ---------- 0.33.0: Zeitleiste der besonderen Tage ----------
const BT = (felder) => ({ id: "b" + Math.random(), tierId: "k", art: "krank", von: "2026-10-05", bis: "2026-10-09", notiz: "", ...felder });
const OKT = { vonTag: "2026-10-01", bisTag: "2026-10-31", links: 34, rechts: 40 };
const unmaskiert = (text) =>
  text.replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&#39;/g, "'").replace(/&amp;/g, "&");
const eintraegeVon = (svg) => JSON.parse(unmaskiert(svg.match(/data-eintraege="([^"]*)"/)[1]));

test("zeitleiste: leer, wenn kein Eintrag den Zeitraum berührt", () => {
  assert.equal(zeitleiste([], OKT), "");
  assert.equal(zeitleiste([BT({ von: "2026-09-01", bis: "2026-09-03" }), BT({ von: "2026-11-02", bis: "2026-11-02" })], OKT), "");
});

test("zeitleiste: Phase als Balken, Tag als Punkt, gleiche Achse wie die Kurve", () => {
  const svg = zeitleiste([BT({}), BT({ art: "genascht", von: "2026-10-20", bis: "2026-10-20" })], OKT);
  assert.match(svg, /<svg viewBox="0 0 340 18" class="zeitleiste"/);
  assert.equal((svg.match(/class="zl-balken/g) ?? []).length, 1);
  assert.equal((svg.match(/class="zl-punkt/g) ?? []).length, 1);
  assert.match(svg, /aria-label="Besondere Tage im Zeitraum: 2"/);
  assert.match(svg, /<title>Krank: 5\. bis 9\. Okt\.<\/title>/);
  assert.doesNotMatch(svg, /NaN/);
  const [balken, punkt] = eintraegeVon(svg);
  assert.ok(balken[0] > 34 && balken[1] > balken[0]);
  assert.equal(punkt[0], punkt[1]);
});

test("zeitleiste: laufende Phase reicht bis zum rechten Rand, frühere Phase beginnt am linken", () => {
  const [laufend] = eintraegeVon(zeitleiste([BT({ von: "2026-10-25", bis: null })], OKT));
  assert.equal(laufend[1], 300);
  const [frueher] = eintraegeVon(zeitleiste([BT({ von: "2026-09-20", bis: "2026-10-03" })], OKT));
  assert.equal(frueher[0], 34);
});

test("zeitleiste: „Futter verweigert“ in der Notfall-Farbe, überlappende Phasen in zwei Reihen", () => {
  assert.match(zeitleiste([BT({ art: "futter-verweigert" })], OKT), /class="zl-balken notfall"/);
  const zwei = zeitleiste([BT({}), BT({ art: "weniger-bewegung", von: "2026-10-07", bis: "2026-10-12" })], OKT);
  assert.match(zwei, /viewBox="0 0 340 32"/);
  assert.deepEqual(eintraegeVon(zwei).map((e) => e[2]), [9, 23]);
});

test("zeitleiste: Notiz gekürzt und maskiert, unbekannte Art heißt „Sonstiges“", () => {
  const svg = zeitleiste([BT({ art: "zukunft-art", notiz: "<script>alert(1)</script>" + "x".repeat(80) })], OKT);
  assert.doesNotMatch(svg, /<script/);
  const text = eintraegeVon(svg)[0][3];
  assert.match(text, /^Sonstiges: 5\. bis 9\. Okt\. · <script>/);
  assert.ok(text.endsWith("…"));
  assert.ok(text.length < 100);
});

test("naechsterZeitleistenEintrag: Treffer im Balken gewinnt, bei zwei Reihen entscheidet die Höhe", () => {
  const liste = [
    [100, 160, 9, "oben"],
    [120, 200, 23, "unten"],
    [170, 170, 9, "Punkt"],
  ];
  assert.equal(naechsterZeitleistenEintrag(liste, 110, 9)[3], "oben");
  assert.equal(naechsterZeitleistenEintrag(liste, 140, 22)[3], "unten");
  assert.equal(naechsterZeitleistenEintrag(liste, 140, 10)[3], "oben");
  assert.equal(naechsterZeitleistenEintrag(liste, 169, 9)[3], "Punkt");
  assert.equal(naechsterZeitleistenEintrag(liste, 20, 9)[3], "oben");
});

test("zeichneVerlauf: Zeitleiste unter der Kurve, Legende und Tipp nur mit Einträgen", () => {
  const verlauf = (besondereTage, g = gewichte) =>
    zeichneVerlauf({ gewichte: g, mahlzeiten: [], freigaben: [], besondereTage, futterNachId: new Map(), zeitraum: "3m", heute: "2026-10-20", kopf: "" });
  const mit = verlauf([BT({ von: "2026-10-16", bis: null })]);
  const feld = mit.slice(mit.indexOf('class="kurve-feld"'), mit.indexOf('class="infoblase"'));
  assert.ok(feld.indexOf('class="kurve"') < feld.indexOf('class="zeitleiste"'), "Zeitleiste nach der Kurve im Kurvenfeld");
  assert.match(mit, /<i class="besonders"><\/i>Besonderer Tag/);
  assert.match(mit, /Tippe auf die Kurve oder auf einen besonderen Tag darunter/);
  // laufende Phase seit dem 16.: reicht bis heute (rechter Rand)
  assert.equal(eintraegeVon(mit)[0][1], 300);
  const ohne = verlauf([]);
  assert.doesNotMatch(ohne, /class="zeitleiste"/);
  assert.doesNotMatch(ohne, /Besonderer Tag/);
  assert.match(ohne, /Tippe auf die Kurve, um Datum und Gewicht zu sehen/);
  // weniger als zwei Wägungen: keine Kurve, keine Zeitleiste
  assert.doesNotMatch(verlauf([BT({})], gewichte.slice(0, 1)), /zeitleiste/);
});

test("zeitleiste: Punkte liegen über den Balken, damit ein Tag in einer Phase sichtbar bleibt", () => {
  // drei Einträge am selben Tag: in zwei Reihen nicht ohne Überlappung unterzubringen
  const svg = zeitleiste(
    [
      BT({ art: "genascht", von: "2026-10-20", bis: "2026-10-20" }),
      BT({ art: "futterumstellung", von: "2026-10-20", bis: "2026-10-25" }),
      BT({ art: "weniger-bewegung", von: "2026-10-20", bis: null }),
    ],
    OKT,
  );
  assert.ok(svg.lastIndexOf('class="zl-balken') < svg.indexOf('class="zl-punkt'), "erst Balken, dann Punkte");
});

test("naechsterZeitleistenEintrag: Punkt auf einem Balken gewinnt gegen den Balken", () => {
  const liste = [
    [100, 200, 9, "Balken"],
    [150, 150, 9, "Punkt"],
  ];
  assert.equal(naechsterZeitleistenEintrag(liste, 150, 9)[3], "Punkt");
  assert.equal(naechsterZeitleistenEintrag([liste[1], liste[0]], 151, 9)[3], "Punkt");
  assert.equal(naechsterZeitleistenEintrag(liste, 120, 9)[3], "Balken");
});

test("zeichneVerlauf: Zeitleiste ist hoch genug zum Antippen (mindestens 56 Einheiten), Reihen in der Mitte", () => {
  // Review 05.11.: 18 Einheiten waren bei 375 px nur etwa 16 px hoch; Tippflächen brauchen 48 px.
  const verlauf = (besondereTage) =>
    zeichneVerlauf({ gewichte, mahlzeiten: [], freigaben: [], besondereTage, futterNachId: new Map(), zeitraum: "3m", heute: "2026-10-20", kopf: "" });
  const eine = verlauf([BT({ von: "2026-10-16", bis: null })]);
  assert.match(eine, /<svg viewBox="0 0 340 56" class="zeitleiste"/);
  assert.deepEqual(eintraegeVon(eine).map((e) => e[2]), [28]);
  const zwei = verlauf([BT({ von: "2026-10-05", bis: "2026-10-09" }), BT({ von: "2026-10-07", bis: "2026-10-12" })]);
  assert.match(zwei, /<svg viewBox="0 0 340 56" class="zeitleiste"/);
  assert.deepEqual(eintraegeVon(zwei).map((e) => e[2]), [21, 35]);
  // im PDF bleibt sie schmal (direkter Aufruf ohne Mindesthöhe)
  assert.match(zeitleiste([BT({})], OKT), /viewBox="0 0 340 18"/);
});

// ---------- 0.35.0: Besondere Tage im PDF: Streifen mit Nummern, genauere Zeitachse ----------
// Achse wie im PDF (PDF_RAND): 1. Nov. bei 34, 30. Nov. bei 288; im November gibt es keine Zeitumstellung.
const NOV = { vonTag: "2026-11-01", bisTag: "2026-11-30" };
const kreise = (svg) =>
  [...svg.matchAll(/<circle class="bt-kreis( notfall)?" cx="([\d.]+)" cy="([\d.]+)"[^>]*\/><text class="bt-nr(?: notfall)?"[^>]*>(\d+)<\/text>/g)].map(
    (m) => ({ nr: Number(m[4]), x: Number(m[2]), y: Number(m[3]), notfall: Boolean(m[1]) })
  );
const linien = (svg, klasse) =>
  [...svg.matchAll(new RegExp(`<line class="${klasse}(?: notfall)?" x1="([\\d.]+)" x2="([\\d.]+)"`, "g"))].map((m) => [Number(m[1]), Number(m[2])]);
const hoehe = (svg) => Number(svg.match(/viewBox="0 0 340 ([\d.]+)"/)[1]);

test("pdfZeitleiste: leer, wenn kein Eintrag die Achse berührt", () => {
  assert.equal(pdfZeitleiste([], NOV), "");
  assert.equal(pdfZeitleiste([BT({ von: "2026-10-20", bis: "2026-10-31" }), BT({ von: "2026-12-01", bis: "2026-12-01" })], NOV), "");
});

test("pdfZeitleiste: ein Tag nur als Kreis, mehrere Tage als Linie mit Querstrich, laufende Phase mit Pfeil bis zum Rand", () => {
  const svg = pdfZeitleiste(
    [
      BT({ von: "2026-11-01", bis: "2026-11-09" }),
      BT({ art: "genascht", von: "2026-11-05", bis: "2026-11-05" }),
      BT({ art: "weniger-bewegung", von: "2026-11-20", bis: null }),
    ],
    NOV
  );
  assert.match(svg, /^<svg viewBox="0 0 340 [\d.]+" class="bt-leiste" role="img" aria-label="[^"]+">/);
  assert.doesNotMatch(svg, /NaN/);
  assert.deepEqual(kreise(svg).map(({ nr, x }) => [nr, x]), [[1, 34], [2, 69], [3, 200.4]]);
  assert.deepEqual(linien(svg, "bt-linie"), [[34, 104.1], [200.4, 288]]); // der einzelne Tag (2) hat keine Linie
  assert.deepEqual(linien(svg, "bt-ende").map(([x1]) => x1), [104.1]); // Querstrich nur an der beendeten Phase
  assert.equal((svg.match(/class="bt-pfeil"/g) ?? []).length, 1);
  assert.match(svg, /class="bt-pfeil" d="M[\d.]+,[\d.]+ L288,/);
});

test("pdfZeitleiste: geht eine Phase über das Achsenende hinaus, steht dort der Pfeil statt des Querstrichs", () => {
  // Bericht für einen früheren Zeitraum: Die Phase endete erst danach.
  const svg = pdfZeitleiste([BT({ von: "2026-11-20", bis: "2026-12-05" })], NOV);
  assert.deepEqual(linien(svg, "bt-linie"), [[200.4, 288]]);
  assert.equal((svg.match(/class="bt-pfeil"/g) ?? []).length, 1);
  assert.doesNotMatch(svg, /bt-ende/);
});

test("pdfZeitleiste: Nummer = Platz in der Liste, auch wenn ein früherer Eintrag vor der Achse liegt", () => {
  const svg = pdfZeitleiste([BT({ von: "2026-10-20", bis: "2026-10-22" }), BT({ von: "2026-11-05", bis: "2026-11-05" })], NOV);
  assert.deepEqual(kreise(svg).map((k) => k.nr), [2]);
});

test("pdfZeitleiste: überlappende Einträge rutschen in die nächste Reihe, so viele wie nötig", () => {
  const eine = pdfZeitleiste([BT({ von: "2026-11-02", bis: "2026-11-12" })], NOV);
  const drei = pdfZeitleiste(
    [BT({ von: "2026-11-02", bis: "2026-11-12" }), BT({ von: "2026-11-04", bis: "2026-11-08" }), BT({ von: "2026-11-06", bis: "2026-11-06" })],
    NOV
  );
  const ys = kreise(drei).map((k) => k.y);
  assert.ok(ys[0] < ys[1] && ys[1] < ys[2], ys.join());
  assert.ok(hoehe(drei) > hoehe(eine));
  // weit auseinander: alle in der ersten Reihe, Streifen so niedrig wie mit einem Eintrag
  const auseinander = pdfZeitleiste(
    [BT({ von: "2026-11-02", bis: "2026-11-04" }), BT({ von: "2026-11-15", bis: "2026-11-15" }), BT({ von: "2026-11-25", bis: "2026-11-27" })],
    NOV
  );
  assert.equal(new Set(kreise(auseinander).map((k) => k.y)).size, 1);
  assert.equal(hoehe(auseinander), hoehe(eine));
});

test("pdfZeitleiste: „Futter verweigert“ als gefüllter Kreis, Titel maskiert, unbekannte Art heißt „Sonstiges“", () => {
  const svg = pdfZeitleiste(
    [
      BT({ art: "futter-verweigert", von: "2026-11-05", bis: "2026-11-06" }),
      BT({ art: "zukunft-art", von: "2026-11-20", bis: "2026-11-20", notiz: "<script>x</script>" }),
    ],
    NOV
  );
  assert.deepEqual(kreise(svg).map((k) => k.notfall), [true, false]);
  assert.match(svg, /<line class="bt-linie notfall"/);
  assert.doesNotMatch(svg, /<script/);
  assert.match(svg, /<title>2 · Sonstiges: [^<]*20\. Nov\.[^<]* · &lt;script&gt;x&lt;\/script&gt;<\/title>/);
});

// Beschriftung der Zeitachse in den PDF-Diagrammen (y = 184, Mitte), Wunsch 05.11.2026: „Jetzt steht da nur November.“
const achsenText = (svg) => [...svg.matchAll(/<text class="achse" x="[\d.]+" y="184" text-anchor="middle">([^<]+)<\/text>/g)].map((m) => m[1]);
const zwischen = (von, bis) => gewichtDiagramm([G(von, 9.3), G(bis, 9.1)], [], bis);

test("gewichtDiagramm (PDF): bis 6 Wochen steht jeder Montag an der Achse, mit Strich an der Grundlinie", () => {
  const svg = zwischen("2026-10-02", "2026-11-13"); // genau 42 Tage, über die Zeitumstellung am 25.10.
  assert.deepEqual(achsenText(svg), ["5.10.", "12.10.", "19.10.", "26.10.", "2.11.", "9.11."]);
  assert.equal((svg.match(/class="achsen-strich"/g) ?? []).length, 6);
});

test("gewichtDiagramm (PDF): bis 12 Wochen jeder zweite Montag, darüber die Monatsanfänge", () => {
  assert.deepEqual(achsenText(zwischen("2026-09-01", "2026-11-13")), ["7.9.", "21.9.", "5.10.", "19.10.", "2.11."]);
  assert.deepEqual(achsenText(zwischen("2026-08-21", "2026-11-13")), ["24.8.", "7.9.", "21.9.", "5.10.", "19.10.", "2.11."]); // 84 Tage
  assert.deepEqual(achsenText(zwischen("2026-08-20", "2026-11-13")), ["Sep", "Okt", "Nov"]); // 85 Tage
  assert.deepEqual(achsenText(zwischen("2026-06-01", "2026-11-13")), ["Jul", "Aug", "Sep", "Okt", "Nov"]);
});

test("gewichtDiagramm (PDF): bis 8 Monate jeder Monat, darüber nur jeder zweite, damit nichts überlappt", () => {
  assert.deepEqual(achsenText(zwischen("2026-03-12", "2026-11-05")), ["Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov"]);
  assert.deepEqual(achsenText(zwischen("2025-11-01", "2026-11-13")), ["Dez", "Feb", "Apr", "Jun", "Aug", "Okt"]);
});

// ---------- 0.36.2: sicherer Bereich im PDF auch bei „letzte 4/12 Wochen“ (Sicherheits-Review 05.11.2026) ----------
// Fund zweier Prüfer: Lag die erste Freigabe vor dem Berichtszeitraum, begann das Band am Freigabe-Datum mit dem Gewicht
// der ersten Wägung im Zeitraum – am Achsenanfang war es dann schon um Wochen abgesunken. Eine Katze mit genau 1 % pro
// Woche lag „über dem Band“ und sah für den Tierarzt nach „zu langsam“ aus.
const plusWochen = (iso, n) => {
  const [j, m, t] = iso.split("-").map(Number);
  const d = new Date(j, m - 1, t + 7 * n, 12);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
// Band als Ober- und Unterkante (y im SVG wächst nach unten) an der Stelle x, linear zwischen den Eckpunkten.
function bandBei(svgText, x) {
  const p = svgText.match(/class="band" points="([^"]+)"/)[1].split(" ").map((s) => s.split(",").map(Number));
  const halb = p.length / 2;
  const oben = p.slice(0, halb);
  const unten = p.slice(halb).reverse();
  const bei = (kante) => {
    for (let i = 1; i < kante.length; i++) {
      const [x0, y0] = kante[i - 1];
      const [x1, y1] = kante[i];
      if (x >= x0 - 0.01 && x <= x1 + 0.01) return x1 === x0 ? y0 : y0 + ((y1 - y0) * (x - x0)) / (x1 - x0);
    }
    return null;
  };
  return { oben: bei(oben), unten: bei(unten) };
}
const marker = (svgText) => [...svgText.matchAll(/<circle class="marker" cx="([\d.]+)" cy="([\d.]+)"/g)].map((m) => [Number(m[1]), Number(m[2])]);

test("gewichtDiagramm (PDF): Freigabe vor dem Zeitraum – Katze mit 1 % pro Woche liegt im sicheren Bereich", () => {
  const start = "2026-11-13";
  const alle = Array.from({ length: 16 }, (_, i) => G(plusWochen(start, i), Math.round(9.32 * 0.99 ** i * 100) / 100));
  const fg = { ...freigabe, datum: start };
  const bis = alle.at(-1).datum; // 26.02.2027
  const imZeitraum = alle.slice(-5); // „letzte 4 Wochen“
  const svgText = gewichtDiagramm(imZeitraum, [fg], bis, alle);
  const punkte = marker(svgText);
  assert.equal(punkte.length, 5);
  for (const [x, yPunkt] of punkte) {
    const { oben, unten } = bandBei(svgText, x);
    assert.ok(oben !== null && unten !== null, `Band reicht bis x=${x}`);
    assert.ok(yPunkt >= oben - 0.5 && yPunkt <= unten + 0.5, `Punkt bei x=${x} (y=${yPunkt}) im Band ${oben}–${unten}`);
  }
  // Das Band beginnt am Achsenanfang, nicht links davon.
  const ersterX = Number(svgText.match(/class="band" points="([\d.-]+),/)[1]);
  assert.equal(ersterX, PDF_RAND.links);
});

// Das Band rechnet ab der Freigabe insgesamt; zu schnelle Phasen meldet der Abschnitt „Auffälligkeiten“.
test("gewichtDiagramm (PDF): durchgehend zu schnell (2,5 % pro Woche) liegt auch bei „letzte 4 Wochen“ unter dem Band", () => {
  const start = "2026-11-13";
  const alle = Array.from({ length: 16 }, (_, i) => G(plusWochen(start, i), Math.round(9.32 * 0.975 ** i * 100) / 100));
  const svgText = gewichtDiagramm(alle.slice(-5), [{ ...freigabe, datum: start }], alle.at(-1).datum, alle);
  const [x, yPunkt] = marker(svgText).at(-1);
  const { unten } = bandBei(svgText, x);
  assert.ok(yPunkt > unten + 0.5, `letzter Punkt (y=${yPunkt}) unter dem Band (Unterkante ${unten})`);
});

// 0.36.2: Freigabe genau am Berichtsende (PDF am Tag des Termins nach dem Eintragen) – kein Band ohne Breite,
// dessen Text „sicherer Bereich“ sonst im rechten Rand über der Ziel-Beschriftung stand (Gegenprüfung 05.11.2026).
test("gewichtDiagramm (PDF): Freigabe am Berichtsende zeichnet kein leeres Band", () => {
  const svgText = gewichtDiagramm(gewichte, [{ ...freigabe, datum: "2026-10-15" }], "2026-10-15");
  assert.doesNotMatch(svgText, /class="band"/);
  assert.doesNotMatch(svgText, /sicherer Bereich/);
});

// 0.36.2: kcal-Säulen im PDF stehen nach Datum, nicht nach Reihenfolge (Sicherheits-Review 05.11.2026). Fehlte eine
// Woche ohne Einträge, rückten die folgenden Säulen nach links und standen über der falschen Wochen-Beschriftung.
test("kcalDiagramm (PDF): Woche ohne Einträge bleibt als Lücke, die Säulen stehen an ihrer Woche", () => {
  const futterNachId = new Map([["s", { id: "s", typ: "nass", kcalPro100g: 77 }]]);
  const M = (tag) => ({ tierId: "k", futterId: "s", gramm: 200, zeitpunkt: new Date(`${tag}T08:00:00`).toISOString() });
  const svgText = kcalDiagramm([M("2026-10-05"), M("2026-10-12"), M("2026-10-26")], futterNachId, []);
  const mitten = [...svgText.matchAll(/<g class="treffer"[^>]*>[^]*?<rect x="([\d.]+)" y="[\d.]+" width="([\d.]+)"[^>]*fill="transparent"\/><\/g>/g)].map(
    (m) => Number(m[1]) + Number(m[2]) / 2
  );
  const innen = 340 - PDF_RAND.links - PDF_RAND.rechts;
  const soll = [0.5, 1.5, 3.5].map((k) => PDF_RAND.links + (innen * k) / 4); // 4 Wochen: 5.10., 12.10., (19.10. leer), 26.10.
  assert.equal(mitten.length, 3);
  mitten.forEach((x, i) => assert.ok(Math.abs(x - soll[i]) < 0.01, `Säule ${i + 1} bei x=${x}, erwartet ${soll[i]}`));
});
