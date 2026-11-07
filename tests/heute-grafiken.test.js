import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { gefuettertHtml, gefuettertMehrHtml, zahl, sicher, URTEIL_KURZ, skalaPunkt, messungHtml } from "../js/heute-grafiken.js";
import { gefuettertWerte, gefuettertMehr, messungWerte } from "../js/zusammenfassung.js";
import { GRENZEN } from "../js/rechnen.js";

// Beispiel-Katze mit Freigabe 220 kcal und drei Sorten (nur Testdaten).
const freigabe = { id: "f", tierId: "k", datum: "2026-10-08", zielgewichtKg: 7.2, kcalProTag: 220, tierarzt: "T", notiz: "" };
const SORTEN = new Map([
  ["n", { id: "n", name: "Nass", typ: "nass", kcalPro100g: 100, kcalQuelle: "hersteller", notiz: "" }],
  ["t", { id: "t", name: "Trocken", typ: "trocken", kcalPro100g: 400, kcalQuelle: "hersteller", notiz: "" }],
  ["l", { id: "l", name: "Leckerli", typ: "leckerli", kcalPro100g: 100, kcalQuelle: "hersteller", notiz: "" }],
]);
const MZ = (futterId, gramm, uhr) => ({ id: futterId + uhr, tierId: "k", futterId, gramm, zeitpunkt: `2026-11-05T${uhr}:00` });
const html = (mahlzeiten, mitFreigabe = true) =>
  gefuettertHtml(
    gefuettertWerte({ mahlzeiten, futterNachId: SORTEN, freigabe: mitFreigabe ? freigabe : null, tag: "2026-11-05", heute: "2026-11-05" })
  );
// 89 + 120 + 2 = 211 kcal, 121 g
const DREI = [MZ("n", 89, "08:00"), MZ("t", 30, "12:00"), MZ("l", 2, "18:00")];
// Nass in Gramm = kcal, dazu 25 g Trocken = 100 kcal.
const tagMit = (kcal) => [MZ("n", kcal - 100, "08:00"), MZ("t", 25, "12:00")];
const anzahl = (text, muster) => (text.match(muster) ?? []).length;

test("0.38.0: gefuettertHtml mit Freigabe: Stücke, Rest, Marke, Legende, Kacheln", () => {
  const h = html(DREI);
  assert.match(h, /Noch/);
  assert.ok(h.includes("9 kcal"), "9 kcal mit geschütztem Leerzeichen");
  assert.match(h, /class="gef-marke" style="left:100\.0%"/);
  assert.match(h, /class="gef-st nass" style="flex-grow:89\.0"/);
  assert.match(h, /class="gef-st trocken" style="flex-grow:120\.0"/);
  assert.match(h, /class="gef-st leckerli" style="flex-grow:2\.0"/);
  assert.match(h, /class="gef-st rest" style="flex-grow:9\.0"/);
  assert.equal(anzahl(h, /class="gef-st /g), 4);
  assert.match(h, /<span class="label">Futter<\/span><strong>121 g<\/strong>/);
  assert.match(h, /class="gef-feld" aria-hidden="true"/);
  assert.doesNotMatch(h, /gef-drueber/);
  assert.doesNotMatch(h, /Warum kein Ziel\?/);
  assert.doesNotMatch(h, /warn/);
});

test("0.38.0: gefuettertHtml über der Tagesmenge: grau bis zum Spielraum, darüber Bernstein", () => {
  const grau = html(tagMit(230));
  assert.match(grau, /Darüber/);
  assert.ok(grau.includes("10 kcal"));
  // Seit 0.42.2 mit Lücken-Ausgleich: 1 Lücke davor (2 px) − 95,65 % von 1 Lücke = 0,1 px.
  assert.match(grau, /class="gef-drueber" style="left:calc\(95\.7% \+ 0\.1px\)"/);
  assert.match(grau, /class="gef-marke" style="left:calc\(95\.7% \+ 0\.1px\)"/);
  assert.doesNotMatch(grau, /stark|warn/);
  assert.doesNotMatch(grau, /gef-st rest/);

  const stark = html(tagMit(245));
  assert.match(stark, /class="gef-drueber stark"/);
  assert.match(stark, /class="gef-kachel warn"><span class="label">Darüber<\/span><strong>25 kcal<\/strong>/);
  // Genau an der Grenze (Tagesmenge plus Spielraum) noch grau.
  const grenze = html(tagMit(Math.round((1 + GRENZEN.spielraum) * 220)));
  assert.match(grenze, /class="gef-drueber"/);
  assert.doesNotMatch(grenze, /stark|warn/);
});

test("0.38.0: gefuettertHtml ohne Freigabe: Legende, Satz und Knopf, kein Balken, keine Kachel", () => {
  const h = html(DREI, false);
  assert.match(h, /Ziel kommt mit der tierärztlichen Freigabe\./);
  assert.match(h, /data-aktion="warum-kein-ziel"/);
  assert.match(h, /Warum kein Ziel\?/);
  assert.match(h, /gef-legende/);
  assert.match(h, /Nass 89/);
  assert.doesNotMatch(h, /gef-bahn|gef-feld|gef-marke|gef-kachel|Noch|Darüber|Darunter/);
});

test("0.38.0: gefuettertHtml ohne Mahlzeit mit Freigabe: Balken nur Rest, keine Legende, „Noch 220 kcal“", () => {
  const h = html([]);
  assert.doesNotMatch(h, /gef-legende/);
  assert.equal(anzahl(h, /class="gef-st /g), 1);
  assert.match(h, /class="gef-st rest" style="flex-grow:220\.0"/);
  assert.match(h, /<span class="label">Noch<\/span><strong>220 kcal<\/strong>/);
  assert.match(h, /<span class="label">Futter<\/span><strong>0 g<\/strong>/);
  assert.match(h, /class="gef-marke" style="left:100\.0%"/);
});

test("0.38.0: gefuettertHtml vergangener Tag und genau getroffen: „Darunter“ und „Noch 0 kcal“ ohne „-0“", () => {
  const gestern = gefuettertHtml(
    gefuettertWerte({ mahlzeiten: tagMit(150), futterNachId: SORTEN, freigabe, tag: "2026-11-04", heute: "2026-11-05" })
  );
  assert.match(gestern, /<span class="label">Darunter<\/span><strong>70 kcal<\/strong>/);
  const genau = html([MZ("n", 220.4, "08:00")]);
  assert.match(genau, /<span class="label">Noch<\/span><strong>0 kcal<\/strong>/);
  assert.doesNotMatch(genau, /-0/);
});

test("0.38.0: Legende nur für vorkommende Arten, in fester Reihenfolge", () => {
  const h = html(DREI);
  assert.match(h, /Nass 89[^]*Trocken 120[^]*Leckerli 2/);
  assert.equal(anzahl(h, /class="gef-chip /g), 3);
  const nurNass = html([MZ("n", 89, "08:00")]);
  assert.match(nurNass, /Nass 89/);
  assert.doesNotMatch(nurNass, /Trocken|Leckerli/);
  assert.equal(anzahl(nurNass, /class="gef-chip /g), 1);
});

test("0.38.0: keine Futtermenge als Empfehlung, kein „Wägung“", () => {
  const faelle = [html(DREI), html(DREI, false), html([]), html(tagMit(245)), html(tagMit(230))];
  for (const h of faelle) {
    assert.doesNotMatch(h, /Wägung/i);
    assert.doesNotMatch(h, /g Trocken/);
    assert.doesNotMatch(h, /\d+\s*g\s+(Nass|Trocken)/);
    assert.doesNotMatch(h, /NaN|undefined|Infinity/);
  }
});

test("0.38.0: zahl ohne „-0“, sicher maskiert HTML", () => {
  assert.equal(zahl(-0), "0");
  assert.equal(zahl(-0.3), "0");
  assert.equal(zahl(-0.004, 2), "0,00");
  assert.equal(zahl(1234.5, 1), "1.234,5");
  assert.equal(zahl(-12), "-12");
  assert.equal(sicher(`<b a="x">'&`), "&lt;b a=&quot;x&quot;&gt;&#39;&amp;");
});

// ---------- 0.39.0: „Letzte Messung“ mit Kurve und Tempo-Skala (Plan .planning/grafiken-auswahl.md, Stelle 2) ----------

const NB = "\u00a0";
const G = (datum, kg) => ({ id: datum, tierId: "k", datum, kg, notiz: "" });
const mess = (liste, mitFreigabe = false, tag = "2026-11-05") =>
  messungHtml(messungWerte({ gewichte: liste, freigaben: mitFreigabe ? [{ ...freigabe, datum: "2026-09-01" }] : [], tag }));
const ohneKommentare = (text) =>
  text
    .replace(/\/\*[^]*?\*\//g, "")
    .replace(/(^|[^:"'\\])\/\/.*$/gm, "$1");

test("0.39.0: URTEIL_KURZ je Bewertung, Zahlen aus GRENZEN", () => {
  assert.equal(URTEIL_KURZ.gut, "sicher");
  assert.equal(URTEIL_KURZ.langsam, `langsamer als 0,5${NB}%`);
  assert.equal(URTEIL_KURZ["zu-schnell"], `schneller als 2${NB}%`);
  assert.equal(URTEIL_KURZ.zunahme, "im Blick behalten");
  assert.equal(URTEIL_KURZ.neutral, "noch ohne Bewertung");
  // Keine Grenzwerte als Zahl im Quelltext (ohne Kommentare): alles aus GRENZEN gebildet.
  const quelle = ohneKommentare(readFileSync(new URL("../js/heute-grafiken.js", import.meta.url), "utf8"));
  assert.doesNotMatch(quelle, /als 0,5|als 2 %|>0,5<|>2</);
});

test("0.39.0: skalaPunkt: −0,5 bis 3 % auf 12 bis 288, außerhalb am Rand festgehalten", () => {
  assert.deepEqual(skalaPunkt(-0.5), { x: 12, raus: null });
  assert.deepEqual(skalaPunkt(3), { x: 288, raus: null });
  assert.deepEqual(skalaPunkt(3.4), { x: 288, raus: "rechts" });
  assert.deepEqual(skalaPunkt(-1), { x: 12, raus: "links" });
  assert.equal(skalaPunkt(0).x, Math.round((12 + (0.5 / 3.5) * 276) * 10) / 10);
  assert.equal(skalaPunkt(GRENZEN.abnahmeMax).x, Math.round((12 + (2.5 / 3.5) * 276) * 10) / 10);
});

test("0.39.0: messungHtml ohne Gewicht: Satz wie bisher, kein Knopf „Verlauf ›“", () => {
  const h = mess([]);
  assert.match(h, /Noch nicht gewogen\./);
  assert.match(h, /Am besten 1× pro Woche, immer zur gleichen Zeit\./);
  assert.doesNotMatch(h, /data-ziel="verlauf"/);
  assert.match(h, /aria-label="Letzte Messung"/);
});

test("0.39.0: messungHtml mit einem Gewicht: Kopf mit Datum und Knopf, Satz zum Tempo, keine Kurve, keine Skala", () => {
  const h = mess([G("2026-11-05", 6.12)]);
  assert.match(h, /<span class="label">Letzte Messung · [^<]*5\.? Nov[^<]*<\/span>/);
  assert.ok(h.includes(`6,12<small>${NB}kg</small>`));
  assert.match(h, /<button type="button" class="mess-link" data-ziel="verlauf">Verlauf<span aria-hidden="true"> ›<\/span><\/button>/);
  assert.match(h, /Das Tempo erscheint ab dem zweiten Wiegen\./);
  assert.doesNotMatch(h, /mess-kurve|mess-skala|mess-urteil/);
  assert.doesNotMatch(h, /g seit/);
  assert.match(h, /aria-label="Letzte Messung"/);
});

test("0.39.0: messungHtml mit Vergleich und Kurve: Gramm seit, Kurve, Skala, Urteil", () => {
  const h = mess([G("2026-09-10", 6.5), G("2026-10-29", 6.24), G("2026-11-05", 6.12)]);
  assert.ok(h.includes(`−120${NB}g seit 29.10.`), "Vorzeichen −, Datum ohne führende Null");
  assert.match(h, /<svg class="mess-kurve" viewBox="0 0 320 58" aria-hidden="true">/);
  assert.match(h, /<svg class="mess-skala" viewBox="0 0 300 35" aria-hidden="true">/);
  // 1,92 % liegt näher als 0,1 an 2 %: seit 0.40.1 zwei Nachkommastellen (tempoZahl).
  assert.ok(h.includes(`<p class="mess-urteil neutral"><b>1,92${NB}% pro Woche</b> · noch ohne Bewertung</p>`));
  // Erstes und letztes Datum unter der Kurve, Gewicht neben dem letzten Punkt, Hilfslinien mit kg.
  assert.match(h, />10\.9\.</);
  assert.match(h, />5\.11\.</);
  assert.match(h, /class="mess-end neutral"/);
  assert.match(h, />6,12<\/text>/);
  assert.match(h, />6,6<\/text>/); // oben: 6,5 + 0,05 aufgerundet
  assert.match(h, />6,0<\/text>/); // unten: 6,12 − 0,08 abgerundet
  // Skala: Striche aus GRENZEN, grüner Bereich, Punkt in der Farbe der Bewertung.
  assert.match(h, />0,5</);
  assert.match(h, />2</);
  assert.match(h, />3 %</);
  assert.match(h, /class="mess-sk-zone"/);
  assert.match(h, /class="mess-sk-punkt neutral" cx="[\d.]+" cy="10" r="6"/);
  assert.doesNotMatch(h, /[‹›]<\/text>/);
});

test("0.39.0: messungHtml Bewertungen: sicher, zu schnell, Zunahme", () => {
  const gut = mess([G("2026-10-29", 6.24), G("2026-11-05", 6.19)], true);
  assert.ok(gut.includes(`<p class="mess-urteil gut"><b>0,8${NB}% pro Woche</b> · sicher</p>`));
  assert.match(gut, /class="mess-sk-punkt gut"/);
  assert.match(gut, /class="mess-end gut"/);
  const schnell = mess([G("2026-10-29", 6.24), G("2026-11-05", 6.084)]);
  assert.ok(schnell.includes(`<p class="mess-urteil zu-schnell"><b>2,5${NB}% pro Woche</b> · schneller als 2${NB}%</p>`));
  const zunahme = mess([G("2026-10-29", 6.12), G("2026-11-05", 6.14)], true);
  assert.ok(zunahme.includes(`<p class="mess-urteil zunahme"><b>Zunahme 0,3${NB}% pro Woche</b> · im Blick behalten</p>`));
  assert.ok(zunahme.includes(`+20${NB}g seit 29.10.`));
  // Außerhalb der Skala: Punkt am Rand, daneben „›“ bzw. „‹“.
  const sehrSchnell = mess([G("2026-10-29", 6.24), G("2026-11-05", 5.9)]);
  assert.match(sehrSchnell, /class="mess-sk-punkt zu-schnell" cx="288"/);
  assert.match(sehrSchnell, />›<\/text>/);
  const sehrViel = mess([G("2026-10-29", 6.0), G("2026-11-05", 6.1)]);
  assert.match(sehrViel, /class="mess-sk-punkt neutral" cx="12"/);
  assert.match(sehrViel, />‹<\/text>/);
});

test("0.39.0: messungHtml Vergleich ohne Kurve (Messung davor älter als 8 Wochen): Skala ja, Kurve nein", () => {
  const h = mess([G("2026-08-01", 6.6), G("2026-11-05", 6.12)]);
  assert.doesNotMatch(h, /mess-kurve/);
  assert.match(h, /class="mess-skala"/);
  assert.match(h, /g seit 1\.8\./);
});

test("0.39.0: messungHtml gleiches Gewicht: „±0 g“, kein NaN, kein „-0“", () => {
  const h = mess([G("2026-10-22", 6.12), G("2026-10-29", 6.12), G("2026-11-05", 6.12)]);
  assert.ok(h.includes(`±0${NB}g seit 29.10.`));
  assert.match(h, /class="mess-kurve"/);
  assert.doesNotMatch(h, /NaN|undefined|Infinity|-0[^.,\d]/);
  // Zwei Messungen am selben Tag in der Kurve: keine Teilung durch 0.
  const gleicherTag = mess([G("2026-08-01", 6.3), { ...G("2026-11-05", 6.2), id: "a" }, { ...G("2026-11-05", 6.12), id: "b" }]);
  assert.doesNotMatch(gleicherTag, /NaN|undefined|Infinity/);
});

test("0.39.0: messungHtml: kein „Wägung“, alle SVG aria-hidden, Texte maskiert", () => {
  const faelle = [
    mess([]),
    mess([G("2026-11-05", 6.12)]),
    mess([G("2026-10-29", 6.24), G("2026-11-05", 6.12)]),
    mess([G("2026-10-29", 6.24), G("2026-11-05", 6.19)], true),
    mess([G("2026-08-01", 6.6), G("2026-11-05", 6.12)]),
  ];
  for (const h of faelle) {
    assert.doesNotMatch(h, /Wägung/i);
    assert.doesNotMatch(h, /NaN|undefined|Infinity/);
    assert.equal((h.match(/<svg /g) ?? []).length, (h.match(/<svg [^>]*aria-hidden="true"/g) ?? []).length);
  }
  // Fremde Werte (z. B. aus einer veränderten Sicherung) landen maskiert im HTML.
  const fremd = messungHtml({
    art: "mitVergleich",
    letzte: { datum: "2026-11-05", kg: 6.12 },
    vorher: { datum: "2026-10-29", kg: 6.24 },
    diffG: -120,
    prozent: 1.9,
    bewertung: '"><script>',
    kurve: null,
  });
  assert.doesNotMatch(fremd, /<script>|undefined/);
});

// ---------- 0.40.1: Funde der Gesamtprüfung ----------

const MITTEL = [G("2026-11-01", 9.32), G("2026-11-08", 8.99), G("2026-11-15", 8.9)];
const messMittel = (mittelZuSchnell) =>
  messungHtml(
    messungWerte({ gewichte: MITTEL, freigaben: [{ ...freigabe, datum: "2026-10-01" }], tag: "2026-11-15", mittelZuSchnell })
  );

test("0.40.1: „Letzte Messung“ folgt der Warnung „zu schnell“ (Mittel über 2 Wochen)", () => {
  const h = messMittel(true);
  const wochen = (GRENZEN.tageZuSchnell / 7).toLocaleString("de-DE");
  assert.ok(
    h.includes(`<p class="mess-urteil zu-schnell"><b>1,0${NB}% letzte Woche</b> · im Mittel über ${wochen}${NB}Wochen zu schnell</p>`),
    h
  );
  assert.match(h, /class="mess-sk-punkt zu-schnell"/);
  assert.match(h, /class="mess-end zu-schnell"/);
  assert.doesNotMatch(h, /sicher<\/p>/);
  // Ohne Warnung: unverändert „sicher“.
  const ohne = messMittel(false);
  assert.ok(ohne.includes(`<p class="mess-urteil gut"><b>1,0${NB}% pro Woche</b> · sicher</p>`));
  assert.match(ohne, /class="mess-sk-punkt gut"/);
  // Letzte Woche selbst über 2 %: bisheriger Text.
  const selbst = messungHtml(
    messungWerte({ gewichte: [G("2026-10-29", 6.24), G("2026-11-05", 6.084)], freigaben: [], tag: "2026-11-05", mittelZuSchnell: true })
  );
  assert.ok(selbst.includes(`<p class="mess-urteil zu-schnell"><b>2,5${NB}% pro Woche</b> · schneller als 2${NB}%</p>`));
});

test("0.40.1: app.js gibt die Warnung „zu schnell“ an die Karte weiter, keine zweite Rechnung", () => {
  const app = readFileSync(new URL("../app.js", import.meta.url), "utf8");
  assert.match(app, /mittelZuSchnell: liste\.some\(\(w\) => w\.id === "zu-schnell"\)/);
});

test("0.40.1: „Letzte Messung“ an den Grenzen: Zahl nie auf der falschen Seite", () => {
  // 10 → 9,7964 kg in 7 Tagen = 2,036 % pro Woche; 10 → 9,9548 kg = 0,452 %.
  const schnell = mess([G("2026-10-29", 10), G("2026-11-05", 9.7964)], true);
  assert.ok(schnell.includes(`<b>2,04${NB}% pro Woche</b> · schneller als 2${NB}%`), schnell);
  const langsam = mess([G("2026-10-29", 10), G("2026-11-05", 9.9548)], true);
  assert.ok(langsam.includes(`<b>0,45${NB}% pro Woche</b> · langsamer als 0,5${NB}%`), langsam);
});

test("0.40.1: kein Reststück im Balken, wenn die Kachel „Noch 0 kcal“ zeigt", () => {
  for (const kcal of [219.6, 219.5]) {
    const h = html([MZ("n", kcal, "08:00")]);
    assert.ok(h.includes(`<span class="label">Noch</span><strong>0${NB}kcal</strong>`), String(kcal));
    assert.doesNotMatch(h, /gef-st rest/, String(kcal));
  }
  // Ab 1 kcal Rest bleibt das Reststück.
  assert.match(html([MZ("n", 219, "08:00")]), /class="gef-st rest" style="flex-grow:1\.0"/);
});

test("0.40.1: Linie der Kurve mit pathLength=1, CSS zeichnet mit Strichlänge 1", () => {
  const h = mess([G("2026-09-10", 6.5), G("2026-10-29", 6.24), G("2026-11-05", 6.12)]);
  assert.match(h, /<polyline class="mess-linie" pathLength="1" points="/);
  const css = readFileSync(new URL("../styles.css", import.meta.url), "utf8");
  const regel = css.match(/\.mess-linie \{[^}]*\}/)[0];
  assert.match(regel, /stroke-dasharray: 1;/);
  assert.match(regel, /stroke-dashoffset: 1;/);
  assert.doesNotMatch(regel, /600/);
});

// ---------- 0.42.1: linkes Ende der Tempo-Skala beschriftet (Stefan 05.11.: „klare Abgrenzung“) ----------
test("0.42.1: Tempo-Skala zeigt am linken Ende Strich und „−0,5“ (Bereich für eine kleine Zunahme)", () => {
  const h = mess([G("2026-10-29", 6.24), G("2026-11-05", 6.19)], true);
  assert.match(h, /<line class="mess-sk-strich" x1="12" x2="12" y1="17" y2="21"\/>/);
  assert.match(h, /<text class="achse" x="12" y="32" text-anchor="middle">−0,5<\/text>/, "echtes Minuszeichen U+2212");
  assert.doesNotMatch(h, />-0,5</, "kein Bindestrich als Minus");
});

// ---------- 0.42.2: Grafik-Kleinigkeiten aus der Gesamtprüfung (Ledger grafiken-umsetzung) ----------
test("0.42.2: Kurve erst ab zwei verschiedenen Tagen (sonst senkrechter Strich), Skala bleibt", () => {
  const h = mess([G("2026-08-01", 6.6), { ...G("2026-11-05", 6.2), id: "a" }, { ...G("2026-11-05", 6.1), id: "b" }]);
  assert.doesNotMatch(h, /mess-kurve/);
  assert.match(h, /class="mess-skala"/);
});

test("0.42.2: „Verlauf ›“ liest sich vor als „Verlauf“ (Pfeil aria-hidden)", () => {
  const h = mess([G("2026-10-29", 6.24), G("2026-11-05", 6.19)]);
  assert.match(h, /<button type="button" class="mess-link" data-ziel="verlauf">Verlauf<span aria-hidden="true"> ›<\/span><\/button>/);
});

test("0.42.2: Legende ergibt zusammen die große Zahl (Rest geht an den größten Nachkommarest)", () => {
  // 120,3 + 99,4 = 219,7 → 220. Einzeln gerundet wären es 120 + 99 = 219.
  const w = gefuettertWerte({
    mahlzeiten: [MZ("n", 120.3, "08:00"), MZ("t", 24.85, "12:00")],
    futterNachId: SORTEN, freigabe, tag: "2026-11-05", heute: "2026-11-05",
  });
  assert.deepEqual(w.arten.map((a) => a.kcal), [120, 100]);
  assert.equal(w.arten.reduce((s, a) => s + a.kcal, 0), Math.round(w.kcal));
  // Ohne Rundungsrest bleibt alles wie bisher: 89 / 120 / 2.
  const drei = gefuettertWerte({ mahlzeiten: DREI, futterNachId: SORTEN, freigabe, tag: "2026-11-05", heute: "2026-11-05" });
  assert.deepEqual(drei.arten.map((a) => a.kcal), [89, 120, 2]);
});

test("0.42.2: Marke rechnet die 2-px-Lücken zwischen den Stücken mit ein", () => {
  // 150 Nass + 100 Trocken = 250, Ziel 220: Marke bei 88 % der Fläche ohne Lücken, plus eine Lücke (2 px) davor,
  // minus 88 % der einen Lücke im ganzen Balken: 2 − 1,76 = 0,24 px.
  const h = html(tagMit(250));
  assert.match(h, /class="gef-marke" style="left:calc\(88\.0% \+ 0\.2px\)"/);
  assert.match(h, /class="gef-drueber stark" style="left:calc\(88\.0% \+ 0\.2px\)"/);
  // Unter dem Ziel steht die Marke am Ende des Reststücks, ohne Korrektur.
  assert.match(html(DREI), /class="gef-marke" style="left:100\.0%"/);
});

// ---------- 0.44.0 (Funde 06.11., Paket B): „Mehr zur Fütterung“ in der Karte „Gefüttert“ ----------

const NBSP = String.fromCharCode(160);
// Kitos Beispiel: Sheba 77 kcal/100 g (geschätzt) 2 × 50 g, Purina One Light 327,5 kcal/100 g (Hersteller) 20 g + 21 g.
const KITO_SORTEN = new Map([
  ["s", { id: "s", name: "Sheba Fresh n Fine in Sauce mit Geflügel", typ: "nass", kcalPro100g: 77, kcalQuelle: "geschaetzt", notiz: "" }],
  ["p", { id: "p", name: "Purina One Light", typ: "trocken", kcalPro100g: 327.5, kcalQuelle: "hersteller", notiz: "" }],
  ["l", { id: "l", name: "Knabberstange", typ: "leckerli", kcalPro100g: 300, kcalQuelle: "ungefaehr", notiz: "" }],
]);
const KITO_FREIGABE = { ...freigabe, datum: "2026-10-01", kcalProTag: 220 };
const KITO_TAG = [MZ("s", 50, "07:00"), MZ("p", 20, "09:00"), MZ("s", 50, "13:00"), MZ("p", 21, "18:00")];
const mehr = (mahlzeiten, { mitFreigabe = true, tag = "2026-11-05", sorten = KITO_SORTEN } = {}) =>
  gefuettertMehr({ mahlzeiten, futterNachId: sorten, freigabe: mitFreigabe ? KITO_FREIGABE : null, tag, heute: "2026-11-05" });

test("0.44.0: gefuettertMehr mit Kitos Tag: Noch 9 kcal, Nass 100 g/77, Trocken 41 g/134 (Leckerlis seit 0.78.0 über leckerliKachel)", () => {
  const w = mehr(KITO_TAG);
  assert.equal(w.heute, true);
  assert.deepEqual(w.ziel, { art: "noch", kcal: 9, soll: 220, datum: "2026-10-01" });
  assert.deepEqual(
    w.arten.map((a) => [a.typ, a.gramm, a.kcal]),
    [["nass", 100, 77], ["trocken", 41, 134]]
  );
  assert.equal("leckerli" in w, false);
  assert.deepEqual(w.geschaetzt, ["Sheba Fresh n Fine in Sauce mit Geflügel"]);
  assert.equal(w.geloescht, false);
});

test("0.44.0: gefuettertMehr ohne Mahlzeit: nichts (keine aufklappbare Zeile)", () => {
  assert.equal(mehr([]), null);
  assert.equal(mehr([], { mitFreigabe: false }), null);
  assert.equal(gefuettertMehrHtml(null), "");
});

test("0.44.0: gefuettertMehr Satz in die Tierarztpraxis: darüber, vergangener Tag darunter, genau erreicht (gleiche Rundung wie die Kachel)", () => {
  // 220 + 12: 12 kcal Leckerli mehr (4 g × 300 kcal/100 g)
  const ueber = mehr([...KITO_TAG, MZ("p", 2.75, "19:00"), MZ("l", 4, "20:00")]);
  assert.equal(ueber.ziel.art, "ueber");
  assert.equal(ueber.ziel.kcal, Math.round(ueber.kcal - 220));
  const gestern = mehr(KITO_TAG, { tag: "2026-11-04" });
  assert.equal(gestern.heute, false);
  assert.deepEqual(gestern.ziel, { art: "unter", kcal: 9, soll: 220, datum: "2026-10-01" });
  // 211,3 + 8,6 = 219,9 → gerundet 0 Abstand: „erreicht“, nicht „Noch 0 kcal“ und kein „-0“.
  const genau = mehr([...KITO_TAG, MZ("p", 2.63, "19:00")]);
  assert.equal(genau.ziel.art, "erreicht");
  assert.equal(genau.ziel.kcal, 0);
  // Kachel und Satz rechnen gleich.
  const kachel = gefuettertWerte({ mahlzeiten: KITO_TAG, futterNachId: KITO_SORTEN, freigabe: KITO_FREIGABE, tag: "2026-11-05", heute: "2026-11-05" }).ziel.kachel;
  assert.equal(kachel.kcal, mehr(KITO_TAG).ziel.kcal);
});

test("0.44.0: gefuettertMehr ohne Freigabe: nur Arten und ca.-Sorten, kein Tierarzt-Satz", () => {
  const w = mehr(KITO_TAG, { mitFreigabe: false });
  assert.equal(w.ziel, null);
  assert.equal(w.arten.length, 2);
  assert.deepEqual(w.geschaetzt, ["Sheba Fresh n Fine in Sauce mit Geflügel"]);
});

test("0.44.0: gefuettertMehr: ca.-Sorten nur einmal und nur ohne genaue Quelle; gelöschte Sorte gemerkt", () => {
  const w = mehr([...KITO_TAG, MZ("l", 2, "20:00"), MZ("l", 1, "21:00"), MZ("weg", 30, "22:00")]);
  assert.deepEqual(w.geschaetzt, ["Sheba Fresh n Fine in Sauce mit Geflügel", "Knabberstange"]);
  assert.equal(w.geloescht, true);
  assert.deepEqual(w.arten.map((a) => a.typ), ["nass", "trocken", "leckerli"]);
  // Die gelöschte Sorte hat keine Art; ihre Gramm stehen in keiner Zeile.
  assert.equal(w.arten.reduce((s, a) => s + a.gramm, 0), 144);
  // Nur genaue Sorten: kein ca.-Satz.
  assert.deepEqual(mehr([MZ("p", 20, "09:00")]).geschaetzt, []);
});

test("0.44.0: gefuettertMehrHtml mit Kitos Tag: zugeklappt, Kopf, Satz, Zeilen, ca.-Satz (Leckerli-Block: tests/leckerli-aufklapp.test.js)", () => {
  const h = gefuettertMehrHtml(mehr(KITO_TAG));
  assert.match(h, /data-aufklapp="gef-mehr"/);
  assert.match(h, /class="aufklapp gef-mehr"/);
  assert.match(h, /aria-expanded="false"/);
  assert.match(h, />Mehr zur Fütterung heute</);
  assert.ok(h.includes(`Noch <b>9${NBSP}kcal</b> bis zur freigegebenen Tagesmenge (220${NBSP}kcal, Freigabe vom 1. Okt. 2026).`));
  assert.ok(h.includes(`<span>Nassfutter</span><span>100${NBSP}g</span><b>77${NBSP}kcal</b>`));
  assert.ok(h.includes(`<span>Trockenfutter</span><span>41${NBSP}g</span><b>134${NBSP}kcal</b>`));
  // Seit 0.78.0 kein Satz „Leckerlis: … von höchstens …“ mehr; ohne leckerliKachel auch kein Leckerli-Block.
  assert.doesNotMatch(h, /Leckerlis:|höchstens|gef-leckerli/);
  assert.ok(h.includes("„ca.“, weil der kcal-Wert von Sheba Fresh n Fine in Sauce mit Geflügel nur geschätzt ist."));
  // Zahl und Einheit nie mit normalem Leerzeichen (Umbruch „9 / kcal“).
  assert.doesNotMatch(h, /\d (kcal|g|%)/);
});

test("0.44.0: gefuettertMehrHtml: andere Tage, darüber, darunter, erreicht", () => {
  const gestern = gefuettertMehrHtml(mehr(KITO_TAG, { tag: "2026-11-04" }));
  assert.match(gestern, />Mehr zur Fütterung an diesem Tag</);
  assert.ok(gestern.includes(`<b>9${NBSP}kcal</b> unter der freigegebenen Tagesmenge (220${NBSP}kcal, Freigabe vom 1. Okt. 2026).`));
  const ueber = gefuettertMehrHtml(mehr([...KITO_TAG, MZ("p", 6.4, "19:00")]));
  assert.ok(ueber.includes(`<b>12${NBSP}kcal</b> über der freigegebenen Tagesmenge (`));
  const genau = gefuettertMehrHtml(mehr([...KITO_TAG, MZ("p", 2.63, "19:00")]));
  assert.ok(genau.includes("Freigegebene Tagesmenge erreicht (220"));
  assert.doesNotMatch(genau, /Noch|-0/);
});

test("0.44.0: gefuettertMehrHtml ohne Freigabe: nur Zeilen und ca.-Satz", () => {
  const h = gefuettertMehrHtml(mehr(KITO_TAG, { mitFreigabe: false }));
  assert.match(h, /Nassfutter/);
  assert.match(h, /„ca.“/);
  assert.doesNotMatch(h, /Tierarzt|Leckerlis:|höchstens|Noch/);
});

test("0.44.0: gefuettertMehrHtml: mehrere ca.-Sorten mit „und“, gelöschte Sorte, Namen maskiert", () => {
  const sorten = new Map(KITO_SORTEN);
  sorten.set("x", { id: "x", name: "Bio <Huhn>", typ: "nass", kcalPro100g: 80, kcalQuelle: "geschaetzt", notiz: "" });
  const drei = gefuettertMehrHtml(mehr([...KITO_TAG, MZ("l", 2, "20:00"), MZ("x", 10, "21:00")], { sorten }));
  assert.ok(drei.includes("„ca.“, weil die kcal-Werte von Sheba Fresh n Fine in Sauce mit Geflügel, Knabberstange und Bio &lt;Huhn&gt; nur geschätzt sind."));
  assert.ok(drei.includes(`<span>Leckerli</span><span>2${NBSP}g</span><b>6${NBSP}kcal</b>`));
  const weg = gefuettertMehrHtml(mehr([MZ("p", 20, "09:00"), MZ("weg", 30, "10:00")]));
  assert.ok(weg.includes("„ca.“, weil eine gelöschte Sorte keinen kcal-Wert mehr hat."));
  const beides = gefuettertMehrHtml(mehr([MZ("s", 50, "09:00"), MZ("weg", 30, "10:00")]));
  assert.ok(beides.includes("nur geschätzt ist und eine gelöschte Sorte keinen kcal-Wert mehr hat."));
});

test("0.44.0: „Mehr zur Fütterung“ nennt nie eine Futtermenge", () => {
  const faelle = [
    gefuettertMehrHtml(mehr(KITO_TAG)),
    gefuettertMehrHtml(mehr(KITO_TAG, { mitFreigabe: false })),
    gefuettertMehrHtml(mehr([...KITO_TAG, MZ("p", 6.4, "19:00")])),
  ];
  for (const h of faelle) {
    assert.doesNotMatch(h, /füttern|noch \d+.?g|entspricht|Wägung/i);
    assert.doesNotMatch(h, /NaN|undefined|Infinity/);
  }
});

test("0.44.0: app.js hängt „Mehr zur Fütterung“ an die Karte, vor der ca.-Zeile", () => {
  const app = readFileSync(new URL("../app.js", import.meta.url), "utf8");
  assert.match(app, /gefuettertHtml\(gefuettert\) \+\s*gefuettertMehrHtml\(\s*gefuettertMehr\(\{ mahlzeiten, futterNachId: futter, freigabe, tag, heute \}\),\s*leckerliKachel\(/);
  const css = readFileSync(new URL("../styles.css", import.meta.url), "utf8");
  assert.match(css, /\.gef-zeilen \{[^}]*grid-template-columns/);
  assert.match(css, /\.gef-zeilen [^{]*\{[^}]*white-space: nowrap/);
});
