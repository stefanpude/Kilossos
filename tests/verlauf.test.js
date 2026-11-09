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
  tempoAchse,
} from "../js/verlauf.js";
import { wochenRaten } from "../js/zusammenfassung.js";
import { GRENZEN } from "../js/rechnen.js";

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

// 0.89.1 (Stefan, Screenshot 09.11.): Zahl und Änderungs-Marke im Kopf der Gewicht-Karte wiederholten nur „Jetzt“
// und „Abgenommen“ aus den Kacheln darüber. Mit Kurve steht im Kopf nur noch der Titel; ohne Kurve (keine Kacheln)
// bleibt das aktuelle Gewicht, sonst stünde es nirgends auf der Seite.
test("zeichneVerlauf: Gewicht-Karte wiederholt Jetzt und Abgenommen nicht (0.89.1)", () => {
  const html = zeichneVerlauf({ gewichte, mahlzeiten: [], freigaben: [], futterNachId: new Map(), zeitraum: "alles", heute: "2026-10-20", kopf: "" });
  const karte = html.slice(html.indexOf('<section class="karte" aria-'), html.indexOf('class="papier"'));
  assert.match(karte, /<h2 id="gewicht-titel">Gewicht<\/h2>/); // Titel wie bei „Tempo pro Woche“ darunter
  assert.doesNotMatch(karte, /class="wert"/);
  assert.doesNotMatch(karte, /class="marke/);
  assert.match(html, /Jetzt<\/span><strong>9,00 kg/);
  assert.match(html, /Abgenommen: 0,32 kg/);
  const ohneKurve = zeichneVerlauf({ gewichte, mahlzeiten: [], freigaben: [], futterNachId: new Map(), zeitraum: "1m", heute: "2026-11-24", kopf: "" });
  assert.match(ohneKurve, /class="wert">9,00 <small>kg/);
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
  assert.match(html, /Ø −?[\d,]+ % pro Woche/);
  assert.doesNotMatch(html, /im sicheren Bereich/);
  const mit = zeichneVerlauf({ gewichte, mahlzeiten: [], freigaben: [freigabe], futterNachId: new Map(), zeitraum: "alles", heute: "2026-10-20", kopf: "" });
  assert.match(mit, /von 1 Wochen? im sicheren Bereich/);
});

test("zeichneVerlauf: Karte „Tierärztliche Befunde“ nur mit Freigaben, mit BCS und MCS", () => {
  const ohne = zeichneVerlauf({ gewichte, mahlzeiten: [], freigaben: [], futterNachId: new Map(), zeitraum: "alles", heute: "2026-10-20", kopf: "" });
  assert.doesNotMatch(ohne, /Tierärztliche Befunde/);
  const mit = zeichneVerlauf({
    gewichte,
    mahlzeiten: [],
    freigaben: [{ ...freigabe, bcs: 8, mcs: "leicht" }, { ...freigabe, id: "g", datum: "2026-10-15" }],
    futterNachId: new Map(),
    zeitraum: "alles",
    heute: "2026-10-20",
    kopf: "",
  });
  assert.match(mit, /Tierärztliche Befunde/);
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
  const kopf = html.match(/Tierärztliche Befunde<\/span><br>\s*([^<]*)/)[1].trim();
  assert.equal(kopf, "BCS 7 von 9");
  const liste = html.slice(html.indexOf('id="ak-befunde"'));
  assert.ok(liste.includes("BCS 8 von 9"));
  assert.ok(liste.indexOf("BCS 7 von 9") < liste.indexOf("BCS 8 von 9"));
});

test("zeichneVerlauf: Vorher/Nachher-Karte steht ganz am Ende, hinter den Befunden (0.29.4)", () => {
  const html = zeichneVerlauf({ gewichte, mahlzeiten: [], freigaben: [freigabe], futterNachId: new Map(), zeitraum: "3m", heute: "2026-10-20", kopf: "", fotos: "<section id=\"fotos-test\"></section>" });
  const tempo = html.indexOf("Tempo pro Woche");
  const befunde = html.indexOf("Tierärztliche Befunde");
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
  assert.doesNotMatch(legende(verlauf([freigabe])), /Ziel aus der Freigabe/);
  assert.match(legende(verlauf([{ ...freigabe, zielgewichtKg: 9.1 }])), /Ziel aus der Freigabe/);
  // Freigabe am Tag der letzten Wägung (z. B. Wiegen in der Tierarztpraxis): noch kein sicherer Bereich gezeichnet.
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
  // Direkter Aufruf ohne Mindesthöhe bleibt schmal (das PDF nutzt seit 0.35.0 pdfZeitleiste, nicht zeitleiste)
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

test("gewichtDiagramm (PDF): bis 14 Wochen jeder zweite Montag, darüber die Monatsanfänge (Grenze seit 0.67.0)", () => {
  assert.deepEqual(achsenText(zwischen("2026-09-01", "2026-11-13")), ["7.9.", "21.9.", "5.10.", "19.10.", "2.11."]);
  assert.deepEqual(achsenText(zwischen("2026-08-21", "2026-11-13")), ["24.8.", "7.9.", "21.9.", "5.10.", "19.10.", "2.11."]); // 84 Tage
  assert.deepEqual(achsenText(zwischen("2026-08-20", "2026-11-13")), ["24.8.", "7.9.", "21.9.", "5.10.", "19.10.", "2.11."]); // 85 Tage
  assert.deepEqual(achsenText(zwischen("2026-08-06", "2026-11-13")), ["Sep", "Okt", "Nov"]); // 99 Tage
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
test("kcalDiagramm (PDF): Woche ohne Einträge bleibt als Lücke, die Trefferflächen stehen an ihrer Woche", () => {
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

// ---------- 0.40.0: „Tempo pro Woche“ als Punkte über der Zeit ----------
// Beispiel-Katze: 16 Wochen, Freigabe in Woche 6. Davor grau (nicht bewertet), danach gut, langsamer (auch eine
// Zunahme), einmal zu schnell (2,41 %).
const T_START = "2026-08-03";
const T_KG = [9.6, 9.55, 9.5, 9.45, 9.4, 9.3, 9.25, 9.18, 9.2, 9.12, 8.9, 8.86, 8.8, 8.74, 8.68, 8.62];
const tGewichte = T_KG.map((kg, i) => G(plusWochen(T_START, i), kg));
const tFreigabe = { ...freigabe, datum: plusWochen(T_START, 6) };
const tVerlauf = ({ freigaben = [tFreigabe], zeitraum = "alles", heute = plusWochen(T_START, 15), gewichte: g = tGewichte } = {}) =>
  zeichneVerlauf({ gewichte: g, mahlzeiten: [], freigaben, futterNachId: new Map(), zeitraum, heute, kopf: "" });
const tempoSvg = (html) => html.match(/<svg class="tempo-diagramm"[^]*?<\/svg>/)[0];
const tempoPunkte = (html) =>
  [...tempoSvg(html).matchAll(/<circle class="tempo-p ([^"]+)" cx="([\d.]+)" cy="([\d.]+)" r="([\d.]+)"><title>([^<]+)<\/title><\/circle>/g)].map(
    (m) => ({ klasse: m[1], x: Number(m[2]), y: Number(m[3]), r: m[4], titel: m[5] })
  );
const tempoText = (html) => html.match(/<p class="tipp tempo-erklaerung">([^<]*)<\/p>/)[1];
const NB = " ";

test("tempoAchse: 0 bis mindestens 2,5; tiefer bei Zunahme, höher bei Ausreißern", () => {
  assert.deepEqual(tempoAchse([0.6, 1.4]), { lo: 0, hi: 2.5 });
  assert.equal(tempoAchse([-0.3, 1]).lo, -0.5);
  assert.equal(tempoAchse([2.8]).hi, 3);
  const gleich = tempoAchse([1, 1]);
  assert.ok(Number.isFinite(gleich.lo) && Number.isFinite(gleich.hi) && gleich.hi > gleich.lo);
  assert.ok(!Object.is(tempoAchse([0.4]).lo, -0)); // kein „-0“ an der Achse
});

test("Tempo pro Woche: jede Wägung im Zeitraum ein Punkt (mehr als 12), Farbe nach Bewertung", () => {
  const html = tVerlauf();
  const raten = wochenRaten(tGewichte, [tFreigabe]);
  assert.ok(raten.length > 12);
  const punkte = tempoPunkte(html);
  assert.equal((tempoSvg(html).match(/class="tempo-p /g) ?? []).length, raten.length);
  assert.equal(punkte.length, raten.length);
  // älteste zuerst, Klasse = Bewertung aus wochenRaten
  assert.deepEqual(punkte.map((p) => p.klasse), [...raten].reverse().map((r) => r.bewertung));
  for (const klasse of ["gut", "langsam", "zu-schnell", "neutral"]) assert.ok(punkte.some((p) => p.klasse === klasse), klasse);
  assert.match(tempoSvg(html), /aria-hidden="true"/);
  assert.doesNotMatch(html, /NaN/);
});

test("Tempo pro Woche: neuester Punkt groß mit Wert, alle anderen klein, je Punkt ein Titel", () => {
  const html = tVerlauf();
  const punkte = tempoPunkte(html);
  assert.equal(punkte.at(-1).r, "5");
  assert.ok(punkte.slice(0, -1).every((p) => p.r === "3.5"));
  assert.equal((tempoSvg(html).match(/<title>/g) ?? []).length, punkte.length);
  // (8,68 − 8,62) / 8,68 = 0,69 % → „0,7 %“
  assert.match(tempoSvg(html), new RegExp(`class="tempo-end-text"[^>]*>0,7${NB}%</text>`));
  assert.equal(punkte.at(-1).titel, `16. Nov.: 0,69${NB}% abgenommen`);
  assert.ok(punkte.some((p) => p.klasse === "langsam" && p.titel.endsWith(`0,22${NB}% zugenommen`)));
});

test("Tempo pro Woche: Band „sicherer Bereich“ aus GRENZEN, Nulllinie kräftiger", () => {
  const svgText = tempoSvg(tVerlauf());
  const raten = wochenRaten(tGewichte, [tFreigabe]);
  const { lo, hi } = tempoAchse(raten.map((r) => r.prozent));
  assert.deepEqual({ lo, hi }, { lo: -0.5, hi: 3 });
  const y = (v) => 10 + ((hi - v) / (hi - lo)) * (176 - 10 - 22);
  const [, by, bh] = svgText.match(/<rect class="tempo-band" x="34" y="([\d.]+)" width="266" height="([\d.]+)"/).map(Number);
  assert.ok(Math.abs(by - y(GRENZEN.abnahmeMax)) < 0.06, `Band oben bei ${by}`);
  assert.ok(Math.abs(by + bh - y(GRENZEN.abnahmeMin)) < 0.15, `Band unten bei ${by + bh}`);
  assert.match(svgText, /class="tempo-band-text"[^>]*>sicherer Bereich</);
  const nullY = Number(svgText.match(/<line class="tempo-null" x1="34" x2="300" y1="([\d.]+)"/)[1]);
  assert.ok(Math.abs(nullY - y(0)) < 0.06);
  // Hilfslinien alle 0,5 %, Zahlen bei 0,5 und ganzen Werten, oberste ganze Zahl mit „ %“
  assert.equal((svgText.match(/<line class="(gitter|tempo-null)"/g) ?? []).length, 8); // −0,5 bis 3
  const zahlen = [...svgText.matchAll(/<text class="achse" x="29" y="[\d.]+" text-anchor="end">([^<]+)<\/text>/g)].map((m) => m[1]);
  assert.deepEqual(zahlen, ["0", "0,5", "1", "2", `3${NB}%`]);
  // Ø-Marke rechts
  assert.match(svgText, /class="tempo-durch"/);
  assert.match(svgText, /class="tempo-durch-text"[^>]*>Ø [\d,]+</);
});

test("Tempo pro Woche: Erklärsatz mit und ohne Freigabe, „Grau“ nur bei nicht bewerteten Punkten", () => {
  const satz = `Jeder Punkt steht für ein Wiegen, verglichen mit der Messung mindestens 7 Tage davor und auf 7 Tage umgerechnet. Grün: im sicheren Bereich, Bernstein: langsamer, Rot: schneller als 2${NB}%. Unter der Nulllinie: zugenommen.`;
  assert.equal(tempoText(tVerlauf()), `${satz} Grau: vor der Freigabe, noch nicht bewertet.`);
  // Freigabe vor der ersten Wägung: alles bewertet, kein grauer Punkt
  const frueh = tVerlauf({ freigaben: [{ ...freigabe, datum: "2026-08-01" }] });
  assert.ok(tempoPunkte(frueh).every((p) => p.klasse !== "neutral"));
  assert.equal(tempoText(frueh), satz);
  const ohne = tVerlauf({ freigaben: [] });
  assert.equal(
    tempoText(ohne),
    `Jeder Punkt steht für ein Wiegen, verglichen mit der Messung mindestens 7 Tage davor und auf 7 Tage umgerechnet. Bewertet wird erst ab der tierärztlichen Freigabe; schneller als 2${NB}% ist immer rot. Unter der Nulllinie: zugenommen.`
  );
  assert.ok(tempoPunkte(ohne).every((p) => p.klasse === "neutral" || p.klasse === "zu-schnell"));
});

test("Tempo pro Woche: Punkte stehen unter den Wägungen der Gewichtskurve (gleiche Zeitachse)", () => {
  for (const heute of [plusWochen(T_START, 15), "2026-11-25"]) {
    const html = tVerlauf({ zeitraum: "3m", heute });
    const kurveX = JSON.parse(unmaskiert(html.match(/data-punkte="([^"]*)"/)[1])).map((p) => p[0]);
    assert.deepEqual(tempoPunkte(html).map((p) => p.x), kurveX);
    // Beschriftung der Zeitachse wie im PDF, an der Unterkante des Tempo-Diagramms
    assert.match(tempoSvg(html), /<line class="achsen-strich" x1="[\d.]+" x2="[\d.]+" y1="154" y2="158"\/><text class="achse" x="[\d.]+" y="170" text-anchor="middle">/);
  }
  // Letzte Wägung nach „heute“ (falsche Geräteuhr): Achse endet an der letzten Wägung.
  const falsch = tVerlauf({ zeitraum: "3m", heute: "2026-11-10" });
  assert.equal(tempoPunkte(falsch).at(-1).x, 300);
  assert.doesNotMatch(falsch, /NaN/);
});

test("Tempo pro Woche: nur ein Wert im Zeitraum – ein Punkt, Achse ab dem Wiegen davor, kein NaN", () => {
  // „1 Monat“ bis 14.12.: nur das Wiegen am 16.11. liegt im Zeitraum, verglichen mit dem 9.11.
  const html = tVerlauf({ zeitraum: "1m", heute: "2026-12-14" });
  assert.doesNotMatch(html, /class="kurve"/);
  const punkte = tempoPunkte(html);
  assert.equal(punkte.length, 1);
  assert.equal(punkte[0].r, "5");
  // Achse 9.11. bis 14.12. (35 Tage), Punkt am 16.11.: 34 + 7/35 × 266
  assert.equal(punkte[0].x, 87.2);
  assert.match(tempoSvg(html), /class="tempo-end-text"/);
  assert.doesNotMatch(html, /NaN/);
});

// Fix-Runde 1 (Review 05.11.2026): Ausreißer ergeben riesige Wochenraten. Ohne Grenze wurden daraus 64 Hilfslinien,
// Zahlen übereinander und ein Band von wenigen Pixeln. Seit 0.75.0 zählen Folgetage nicht mehr (mindestens 7 Tage
// Abstand); Ausreißer kommen jetzt nur noch von echten Sprüngen oder Tippfehlern im Wochenabstand.
const tAusreisser = [
  G("2026-10-01", 9.4),
  G("2026-10-08", 9.35),
  G("2026-10-15", 9.3),
  G("2026-10-22", 9.25),
  G("2026-10-29", 7.85), // eine Woche später: (9,25 − 7,85) / 9,25 = 15,14 % pro Woche
  G("2026-11-05", 9.07), // und zurück: (9,07 − 7,85) / 7,85 = 15,54 % zugenommen
  G("2026-11-12", 9.0),
];

test("Tempo pro Woche: Achse bei Ausreißern begrenzt, Punkte am Rand mit Pfeil, Zahlen lesbar", () => {
  const raten = wochenRaten(tAusreisser, [freigabe]);
  const achse = tempoAchse(raten.map((r) => r.prozent));
  assert.equal(achse.hi, 2.5 * GRENZEN.abnahmeMax);
  assert.ok(achse.lo >= -(GRENZEN.abnahmeMax + 0.5));
  assert.deepEqual(tempoAchse([30]), { lo: 0, hi: 2.5 * GRENZEN.abnahmeMax });
  assert.equal(tempoAchse([-30]).lo, -(GRENZEN.abnahmeMax + 0.5));
  // innerhalb der Grenzen wie bisher
  assert.equal(tempoAchse([2.8]).hi, 3);
  assert.equal(tempoAchse([-0.3, 1]).lo, -0.5);

  const html = tVerlauf({ gewichte: tAusreisser, freigaben: [freigabe], heute: "2026-11-12" });
  const svgText = tempoSvg(html);
  assert.doesNotMatch(html, /NaN/);
  assert.ok((svgText.match(/<line class="(gitter|tempo-null)"/g) ?? []).length <= 16);
  const zahlenY = [...svgText.matchAll(/<text class="achse" x="29" y="([\d.]+)" text-anchor="end">/g)].map((m) => Number(m[1]));
  assert.ok(zahlenY.length >= 2);
  for (let i = 1; i < zahlenY.length; i++) assert.ok(Math.abs(zahlenY[i] - zahlenY[i - 1]) >= 14, `Zahlen bei y ${zahlenY.join(", ")}`);
  assert.doesNotMatch(svgText, />0,5</); // bei großer Spanne nur ganze Zahlen
  // Ausreißer nach oben: am oberen Rand, Pfeil „▲“, Titel mit dem echten Wert
  const oben = svgText.match(/<circle class="tempo-p zu-schnell" cx="[\d.]+" cy="([\d.]+)" r="[\d.]+"><title>([^<]+)<\/title><\/circle><text class="tempo-pfeil"[^>]*>▲<\/text>/);
  assert.ok(oben, "Punkt mit ▲");
  assert.ok(Number(oben[1]) >= 10 && Number(oben[1]) <= 154, `cy ${oben[1]}`);
  assert.equal(oben[2], `29. Okt.: 15,14${NB}% abgenommen`);
  // nach unten: am unteren Rand, „▼“
  const unten = svgText.match(/cy="([\d.]+)" r="[\d.]+"><title>[^<]*15,54[^<]*zugenommen<\/title><\/circle><text class="tempo-pfeil"[^>]*>▼<\/text>/);
  assert.ok(unten, "Punkt mit ▼");
  assert.ok(Number(unten[1]) <= 154);
  // Band bleibt lesbar breit, „sicherer Bereich“ steht darin
  const [, by, bh] = svgText.match(/<rect class="tempo-band" x="34" y="([\d.]+)" width="266" height="([\d.]+)"/).map(Number);
  const ty = Number(svgText.match(/class="tempo-band-text" x="[\d.]+" y="([\d.]+)"/)[1]);
  assert.ok(bh >= 20 && ty > by && ty < by + bh, `Band ${by}+${bh}, Text bei ${ty}`);
  // Verbindungslinie bleibt in der Zeichenfläche
  const ys = svgText.match(/class="tempo-verbindung" points="([^"]+)"/)[1].split(" ").map((p) => Number(p.split(",")[1]));
  assert.ok(ys.every((yy) => yy >= 10 && yy <= 154), ys.join());
});

test("Tempo pro Woche: Ø-Text innen weicht dem Wert des neuesten Punkts aus", () => {
  // −0,2 % und −0,6 %: „Ø −0,40“ passt nicht in den Rand und steht innen, der neueste Punkt liegt knapp darunter.
  const g = [G("2026-10-01", 9.0), G("2026-10-08", 9.018), G("2026-10-15", 9.0721)];
  // heute zwei Tage nach dem letzten Wiegen: der Punkt liegt weiter innen, sein Wert bleibt links über ihm (seit 0.89.2;
  // am rechten Rand stünde er im Rand und nicht mehr neben dem inneren Ø).
  const svgText = tempoSvg(tVerlauf({ gewichte: g, freigaben: [], heute: "2026-10-17" }));
  const durch = svgText.match(/class="tempo-durch-text" x="([\d.]+)" y="([\d.]+)" text-anchor="end">Ø −0,40</);
  assert.ok(durch, "Ø innen");
  const wert = svgText.match(/class="tempo-end-text" x="[\d.]+" y="([\d.]+)" text-anchor="end"/);
  assert.ok(wert, "Wert links über dem Punkt");
  assert.ok(Math.abs(Number(durch[2]) - Number(wert[1])) >= 14, `Ø bei y ${durch[2]}, Wert bei y ${wert[1]}`);
});

// 0.89.2 (Stefan, Screenshot 09.11.): Bei einem Jahr Wiegungen liegen die Punkte nur etwa 5 Einheiten auseinander; der
// Wert links über dem neuesten Punkt lag auf den letzten Punkten. Am rechten Rand steht er jetzt rechts im Rand wie „Ø“.
const endText = (svgText) => {
  const m = svgText.match(/class="tempo-end-text" x="([\d.]+)" y="([\d.]+)" text-anchor="(start|end)">([^<]*)<\/text>/);
  return { x: Number(m[1]), y: Number(m[2]), anker: m[3], text: m[4] };
};
const tViele = Array.from({ length: 40 }, (_, i) => G(plusWochen(T_START, i), Math.round(9.6 * 0.993 ** i * 1000 + (i % 2) * 15) / 1000));

test("0.89.2: viele Wochen, neuester Punkt am Rand – Wert rechts im Rand, Ø weicht aus", () => {
  const html = tVerlauf({ gewichte: tViele, freigaben: [], heute: tViele.at(-1).datum });
  const svgText = tempoSvg(html);
  const punkte = tempoPunkte(html);
  const letzter = punkte.at(-1);
  assert.equal(letzter.x, 300);
  const wert = endText(svgText);
  assert.equal(wert.anker, "start");
  assert.equal(wert.x, 308); // wie der Ø-Text im Rand
  assert.ok(Math.abs(wert.y - (letzter.y + 4)) < 0.11, `Wert bei y ${wert.y}, Punkt bei y ${letzter.y}`);
  assert.ok(punkte.every((p) => p.x + Number(p.r) < wert.x), "kein Punkt unter dem Wert");
  const durch = svgText.match(/class="tempo-durch-text" x="([\d.]+)" y="([\d.]+)">Ø/);
  assert.ok(durch, "Ø im Rand");
  assert.ok(Math.abs(Number(durch[2]) - wert.y) >= 14, `Ø bei y ${durch[2]}, Wert bei y ${wert.y}`);
  // 0.89.3 (Stefan: „Was sagen die 0,7 % aus?“): klein „zuletzt“ über dem Wert, Ø weicht auch dieser Zeile aus.
  const zuletzt = svgText.match(/class="tempo-end-label" x="([\d.]+)" y="([\d.]+)">zuletzt<\/text>/);
  assert.ok(zuletzt, "„zuletzt“ im Rand");
  assert.equal(Number(zuletzt[1]), 308);
  assert.ok(Math.abs(Number(zuletzt[2]) - (wert.y - 11)) < 0.11, `„zuletzt“ bei y ${zuletzt[2]}`);
  assert.ok(Math.abs(Number(durch[2]) - Number(zuletzt[2])) >= 14, `Ø bei y ${durch[2]}, „zuletzt“ bei y ${zuletzt[2]}`);
  assert.doesNotMatch(html, /NaN/);
});

test("0.89.2: neuester Punkt weiter innen oder Wert zu breit – Wert wie bisher links über dem Punkt", () => {
  // Zwei Wochen nach dem letzten Wiegen: der Punkt liegt etwa 30 Einheiten vor dem Rand.
  const innen = tVerlauf({ heute: plusWochen(T_START, 17) });
  const p = tempoPunkte(innen).at(-1);
  assert.ok(300 - p.x > 12, `Punkt bei x ${p.x}`);
  const wInnen = endText(tempoSvg(innen));
  assert.equal(wInnen.anker, "end");
  assert.equal(wInnen.x, Math.round((p.x - 2) * 10) / 10);
  assert.equal(wInnen.y, Math.round((p.y - 9) * 10) / 10);
  assert.doesNotMatch(tempoSvg(innen), /tempo-end-label/); // „zuletzt“ nur im Rand
  // Große Zunahme am Rand: „−15,5 %“ passt nicht in den Rand.
  const breit = tempoSvg(tVerlauf({ gewichte: [G("2026-10-01", 9.0), G("2026-10-08", 7.85), G("2026-10-15", 9.07)], freigaben: [], heute: "2026-10-15" }));
  const wBreit = endText(breit);
  assert.equal(wBreit.text, `−15,5${NB}%`);
  assert.equal(wBreit.anker, "end");
});

test("Tempo pro Woche: „Alle Wochen“ bleibt, Kopfzeile unverändert", () => {
  const html = tVerlauf();
  assert.match(html, /Alle Wochen<small>15 Werte, neueste zuerst<\/small>/);
  assert.match(html, /<p>Ø −?[\d,]+ % pro Woche · \d+ von 9 Wochen im sicheren Bereich<\/p>/);
  assert.doesNotMatch(html, /class="tempo"/);
  assert.doesNotMatch(html, /saeule/);
});

test("0.40.1: Wert am neuesten Tempo-Punkt an den Grenzen nie auf der falschen Seite", () => {
  const ende = (kgNeu) => {
    const svgText = tempoSvg(
      tVerlauf({ gewichte: [G("2026-10-22", 10), G("2026-10-29", 10), G("2026-11-05", kgNeu)], freigaben: [freigabe], heute: "2026-11-05" })
    );
    return svgText.match(/class="tempo-end-text"[^>]*>([^<]*)<\/text>/)[1];
  };
  assert.equal(ende(9.7964), `2,04${NB}%`); // 2,036 % zu schnell
  assert.equal(ende(9.9548), `0,45${NB}%`); // 0,452 % langsamer
  assert.equal(ende(9.9), `1,0${NB}%`);
  assert.equal(ende(10.1), `−1,0${NB}%`); // Zunahme mit echtem Minus
});

// ---------- 0.42.2: Grafik-Kleinigkeiten aus der Gesamtprüfung ----------
test("0.42.2: Tempo-Kopf mit echtem Minus und geschütztem Leerzeichen vor %", () => {
  const g = [G("2026-10-01", 9.0), G("2026-10-08", 9.018), G("2026-10-15", 9.0721)];
  const html = tVerlauf({ gewichte: g, freigaben: [], heute: "2026-10-15" });
  assert.ok(html.includes(`<p>Ø −0,40${NB}% pro Woche</p>`), html.match(/<p>Ø[^<]*<\/p>/)?.[0]);
  assert.doesNotMatch(html, /Ø -/);
});

test("0.42.2: Pfeil eines Ausreißers am rechten Rand steht links vom Punkt, nicht in der Ø-Spalte", () => {
  // Großer Sprung in einer Woche: 8,98 → 8,40 kg = 6,46 %, weit über der Achse (bis 5 %); heute = letzte Wägung.
  // (Bis 0.74 stand hier ein Wiegen am Folgetag; das ergibt seit 0.75.0 keinen Punkt mehr.)
  const g = [G("2026-10-01", 9.0), G("2026-10-08", 8.98), G("2026-10-15", 8.4)];
  const svgText = tempoSvg(tVerlauf({ gewichte: g, freigaben: [], heute: "2026-10-15" }));
  const pfeil = svgText.match(/<text class="tempo-pfeil" x="([\d.]+)" y="[\d.]+"( text-anchor="end")?>▲<\/text>/);
  assert.ok(pfeil, "Pfeil ▲ vorhanden");
  assert.equal(pfeil[2], ' text-anchor="end"');
  assert.ok(Number(pfeil[1]) <= 340 - 40, `Pfeil bei x ${pfeil[1]}`);
});

// 0.42.3: „Alle Wochen“ schreibt das Tempo wie Kopf und Skala: Abnahme ohne Vorzeichen, Zunahme mit „−“.
test("0.42.3: „Alle Wochen“ mit gleichem Vorzeichen wie der Kopf", () => {
  const g = [G("2026-10-01", 10), G("2026-10-08", 9.97), G("2026-10-15", 10), G("2026-10-22", 10)];
  const html = tVerlauf({ gewichte: g, freigaben: [], heute: "2026-10-22" });
  const marken = [...html.matchAll(/<span class="marke[^"]*">([^<]*%)<\/span>/g)].map((m) => m[1]);
  assert.deepEqual(marken, ["0,00 %", "−0,30 %", "0,30 %"]);
  assert.doesNotMatch(html, /class="marke[^"]*">\+/);
});

// 0.42.4: An den Grenzen rundet „Alle Wochen“ wie der Wert am neuesten Punkt (tempoZahl, in Richtung des Urteils),
// sonst zwei Stellen wie bisher.
test("0.42.4: „Alle Wochen“ rundet an den Grenzen wie der Tempo-Punkt", () => {
  const raten = [0.666, 0.5025, 0.4996, 2.004, 1.997, -0.3];
  const g = [G("2026-09-03", 10)];
  let kg = 10;
  raten.forEach((p, i) => {
    kg *= 1 - p / 100;
    g.push(G(plusWochen("2026-09-03", i + 1), kg));
  });
  const html = tVerlauf({ gewichte: g, freigaben: [], heute: plusWochen("2026-09-03", raten.length) });
  const marken = [...html.matchAll(/<span class="marke[^"]*">([^<]*%)<\/span>/g)].map((m) => m[1]);
  assert.deepEqual(marken, ["−0,30 %", "1,99 %", "2,01 %", "0,49 %", "0,51 %", "0,67 %"]);
});

// 0.42.6: Das Zielgewicht steht überall mit zwei Nachkommastellen, wie auf der Freigabe-Tafel und im Verlauf.
// Vorher machten Befunde-Karte und PDF-Kurve aus 7,25 kg „7,3“.
test("0.42.6: Befunde-Karte und PDF-Kurve zeigen das Ziel mit zwei Nachkommastellen", () => {
  const fg = { ...freigabe, zielgewichtKg: 7.25 };
  const karte = zeichneVerlauf({ gewichte, mahlzeiten: [], freigaben: [fg], futterNachId: new Map(), zeitraum: "alles", heute: "2026-10-20", kopf: "" });
  assert.ok(karte.includes("Ziel 7,25 kg · 220 kcal pro Tag"), "Befunde-Karte");
  assert.ok(!karte.includes("Ziel 7,3"), "nirgends auf eine Stelle gerundet");
  const svgText = gewichtDiagramm(gewichte, [fg]);
  assert.ok(svgText.includes(">Ziel 7,25</text>"), "Beschriftung an der PDF-Kurve");
  // Rechtsbündig am Rand, damit auch „Ziel 10,00“ in die Zeichenfläche (340) passt; linksbündig ab 292 ragte es bis 344.
  const gross = gewichtDiagramm([G("2026-10-01", 12.4), G("2026-10-15", 12.2)], [{ ...fg, zielgewichtKg: 10 }]);
  assert.ok(gross.includes('x="338" y="') && gross.includes('text-anchor="end">Ziel 10,00</text>'));
});

// 0.60.1: Ein Jahr mit 3 Mahlzeiten am Tag – zugeklappt steht keine einzige Mahlzeit-Zeile im HTML.
import { zustandVergessen as vergiss } from "../js/aufklappen.js";
test("0.60.1: „Futter pro Tag“ zugeklappt baut keine Tage und Mahlzeiten (schnell auch bei einem Jahr)", () => {
  vergiss();
  const futter = new Map([["s", { id: "s", name: "Sheba", typ: "nass", kcalProPackung: null, kcalPro100g: 77 }]]);
  const mahlzeiten = [];
  for (let t = 0; t < 365; t++) {
    const tag = new Date(Date.UTC(2025, 9, 21) + t * 86400000).toISOString().slice(0, 10);
    for (const h of ["07", "12", "18"]) mahlzeiten.push({ id: tag + h, tierId: "k", futterId: "s", gramm: 50, zeitpunkt: `${tag}T${h}:00:00` });
  }
  const html = zeichneVerlauf({ gewichte, mahlzeiten, freigaben: [], futterNachId: futter, zeitraum: "alles", heute: "2026-10-20", kopf: "" });
  assert.ok(html.includes("Futter pro Tag"));
  assert.ok(!html.includes('data-aufklapp="tag-'), "keine Tageskarten im zugeklappten Zustand");
  assert.ok(!html.includes("Sheba"), "keine Mahlzeit-Zeilen im zugeklappten Zustand");
  assert.ok(html.length < 60000, `HTML zu groß: ${html.length}`);
});
