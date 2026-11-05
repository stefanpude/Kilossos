import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { BEGRIFFE, begriffKarte, begriffeHtml, kcalSpanne, hinweisKnopf } from "../js/wissen.js";
import { FUTTERLISTE } from "../js/futterliste.js";
import { zustandVergessen } from "../js/aufklappen.js";
import { GRENZEN } from "../js/rechnen.js";

const lies = (datei) => readFileSync(new URL(`../${datei}`, import.meta.url), "utf8");
const saetze = (text) => text.split(/(?<=[.!?])\s+/).filter(Boolean);
const blatt = (html, id) => html.match(new RegExp(`<dialog id="${id}">([\\s\\S]*?)</dialog>`))?.[1] ?? "";
// Mengen wie "50 g pro Tag" oder "200 kcal am Tag" darf kein Erklärtext nennen (die Menge legt nur der Tierarzt fest).
const MENGE_PRO_TAG = /\d[\d,.]*\s*(g|Gramm|kcal)\s*(pro|am|je|\/)\s*Tag/i;

test("Begriffe: die 12 Begriffe aus dem Plan, alphabetisch sortiert", () => {
  assert.deepEqual(BEGRIFFE.map((b) => b.begriff), [
    "Alleinfutter und Ergänzungsfutter",
    "Analytische Bestandteile",
    "BARF",
    "BCS und MCS",
    "Diätfutter vom Tierarzt",
    "Fettleber (hepatische Lipidose)",
    "Freigabe vom Tierarzt",
    "kcal und ME",
    "Light und Sterilised",
    "Nassfutter und Trockenfutter",
    "RER (Ruheenergiebedarf)",
    "Zielgewicht",
  ]);
  const sortiert = [...BEGRIFFE].sort((a, b) => a.begriff.localeCompare(b.begriff, "de"));
  assert.deepEqual(sortiert, BEGRIFFE);
});

test("Begriffe: eindeutige ids, je 1 bis 3 Sätze, jede Erklärung mit Quelle", () => {
  assert.equal(new Set(BEGRIFFE.map((b) => b.id)).size, BEGRIFFE.length);
  for (const b of BEGRIFFE) {
    const anzahl = saetze(b.text).length;
    assert.ok(anzahl >= 1 && anzahl <= 3, `${b.begriff}: ${anzahl} Sätze`);
    assert.ok(b.quelle?.length > 10, `${b.begriff}: Quelle fehlt`);
  }
});

test("Zahl und Einheit bleiben in einer Zeile (geschütztes Leerzeichen vor % und g)", () => {
  const getrennt = /\d (%|g\b)/;
  for (const b of BEGRIFFE) assert.doesNotMatch(b.text, getrennt, b.begriff);
  assert.doesNotMatch(blatt(lies("index.html"), "dialog-nicht-ab").replace(/&nbsp;/g, " "), getrennt);
});

test("Begriffe nennen keine Futtermenge pro Tag", () => {
  for (const b of BEGRIFFE) assert.doesNotMatch(b.text, MENGE_PRO_TAG, b.begriff);
});

test("Nass- und Trockenfutter: die kcal-Spannen stammen aus der Futterliste", () => {
  const spanne = (typ) => {
    const werte = FUTTERLISTE.filter((f) => f.typ === typ).map((f) => f.kcalPro100g);
    return [Math.round(Math.min(...werte)), Math.round(Math.max(...werte))];
  };
  assert.deepEqual(kcalSpanne("trocken"), spanne("trocken"));
  assert.deepEqual(kcalSpanne("nass"), spanne("nass"));
  const text = BEGRIFFE.find((b) => b.id === "nass-trocken").text;
  const [tMin, tMax] = spanne("trocken");
  const [nMin, nMax] = spanne("nass");
  assert.ok(text.includes(`${tMin} bis ${tMax} kcal pro 100 g, Nassfutter ${nMin} bis ${nMax})`), text);
  for (const zahl of [tMin, tMax, nMin, nMax]) assert.ok(Number.isFinite(zahl), String(zahl));
  // „ein Vielfaches“ stimmt nur, solange das kalorienreichste Nassfutter unter dem leichtesten Trockenfutter liegt.
  assert.ok(nMax < tMin, `Nassfutter bis ${nMax}, Trockenfutter ab ${tMin}`);
  assert.doesNotMatch(text, /NaN|Infinity/);
});

test("Light und Sterilised: Die Aussage zu Sterilised-Beuteln passt zur Futterliste", () => {
  const nass = FUTTERLISTE.filter((f) => f.typ === "nass");
  const steril = nass.filter((f) => /steril/i.test(f.name)).map((f) => f.kcalPro100g);
  const normal = nass.filter((f) => !/steril|light/i.test(f.name) && !f.diaet).map((f) => f.kcalPro100g);
  assert.ok(Math.max(...steril) > Math.min(...normal));
});

test("kcal und ME: Energiewert ist freiwillig, Umrechnung für kcal pro Kilogramm und kJ", () => {
  const text = BEGRIFFE.find((b) => b.id === "kcal-me").text;
  assert.match(text, /Steht ein Energiewert auf der Packung/);
  assert.match(text, /kcal pro Kilogramm teilst du durch 10/);
  assert.match(text, /kJ pro 100 g durch 4,2/);
});

test("Alleinfutter: Bedarf gedeckt in der Tagesmenge laut Packung (passt zum Begriff Diätfutter)", () => {
  assert.match(BEGRIFFE.find((b) => b.id === "allein-ergaenzung").text, /in der Tagesmenge laut Packung/);
});

test("begriffeHtml: je Begriff ein Aufklapp-Eintrag mit Quelle, nur type=button", () => {
  zustandVergessen();
  const html = begriffeHtml();
  assert.equal(html.match(/class="aufklapp[ "]/g)?.length, BEGRIFFE.length);
  for (const b of BEGRIFFE) assert.ok(html.includes(`data-aufklapp="begriff-${b.id}"`), b.id);
  assert.equal(html.match(/class="quelle"/g)?.length, BEGRIFFE.length);
  assert.doesNotMatch(html, /<button(?![^>]*type="button")/);
  assert.match(html, /aria-expanded="false"/);
  assert.doesNotMatch(html, /aria-expanded="true"/);
});

test("begriffeHtml: „BCS und MCS“ verweist auf die BCS-Erklärung", () => {
  zustandVergessen();
  const karte = begriffKarte(BEGRIFFE.find((b) => b.id === "bcs-mcs"));
  assert.match(karte, /<button type="button" class="knopf-text" data-aktion="bcs-erklaerung">Mehr zum BCS<\/button>/);
});

test("begriffKarte schützt Text vor HTML", () => {
  const karte = begriffKarte({ id: "x", begriff: "<b>B</b>", text: "<i>T</i>", quelle: "<u>Q</u>" });
  assert.doesNotMatch(karte, /<b>B<\/b>|<i>T<\/i>|<u>Q<\/u>/);
  assert.match(karte, /&lt;b&gt;B&lt;\/b&gt;/);
});

test("hinweisKnopf: nur der Hinweis „Abnahme stockt“ führt zur Erklärseite", () => {
  assert.equal(
    hinweisKnopf("stillstand"),
    '<button type="button" class="knopf-text" data-aktion="warum-nicht-ab">Warum nimmt meine Katze nicht ab?</button>'
  );
  assert.equal(hinweisKnopf("diaetfutter"), "");
  assert.equal(hinweisKnopf(undefined), "");
});

test("index.html: Gruppe „Wissen“ mit beiden Einträgen und beiden Blättern", () => {
  const html = lies("index.html");
  assert.match(html, /<h3 class="gruppe-titel">Wissen<\/h3>/);
  assert.match(html, /data-aktion="begriffe-erklaerung">\s*<span data-symbol="buch"><\/span><span class="text">Begriffe kurz erklärt</);
  assert.match(html, /data-aktion="warum-nicht-ab">\s*<span data-symbol="frage"><\/span><span class="text">Warum nimmt meine Katze nicht ab\?</);
  for (const id of ["dialog-begriffe", "dialog-nicht-ab"]) assert.match(blatt(html, id), /<h2 tabindex="-1" autofocus>/, id);
  assert.match(blatt(html, "dialog-begriffe"), /<div id="begriffe-liste"><\/div>/);
});

test("„Warum nimmt meine Katze nicht ab?“: Fettleber-Kasten offen sichtbar, keine Futtermengen", () => {
  const text = blatt(lies("index.html"), "dialog-nicht-ab");
  assert.match(text, /<p class="notfall-hinweis"><strong>Bitte nie hungern lassen\.<\/strong>/);
  assert.match(text, /sofort zum Tierarzt/);
  assert.match(text, /<h3>Bitte nicht selbst kürzen<\/h3>/);
  assert.match(text, /<p class="leise">Quellen:/);
  assert.match(text, /Merck/);
  assert.match(text, /Besprich dann den Plan mit dem Tierarzt/);
  assert.match(text, /ein paar Stück von der Tagesmenge/);
  assert.match(text, /als Leckerli ein, damit Kilossos sie mitzählt/);
  assert.doesNotMatch(text, /aufklapp/);
  assert.doesNotMatch(text, MENGE_PRO_TAG);
});

test("„Warum nimmt meine Katze nicht ab?“: Zahlen passen zu den Grenzen in js/rechnen.js", () => {
  const text = blatt(lies("index.html"), "dialog-nicht-ab");
  const komma = (zahl) => String(zahl).replace(".", ",");
  assert.ok(text.includes(`${komma(GRENZEN.abnahmeMin)} bis ${komma(GRENZEN.abnahmeMax)}&nbsp;%`));
  assert.ok(text.includes(`höchstens ${GRENZEN.leckerliMax * 100}&nbsp;%`));
  assert.equal(GRENZEN.tageStillstand / 7, 4);
  assert.ok(text.includes(`vier Wochen lang weniger als ${komma(GRENZEN.abnahmeMin)}&nbsp;%`));
});

test("Jede Aktion der Erklärseiten hat einen Fall im Klick-switch von app.js", () => {
  const js = lies("app.js");
  const aktionen = new Set(["begriffe-erklaerung", "warum-nicht-ab"]);
  for (const b of BEGRIFFE) if (b.mehr) aktionen.add(b.mehr.aktion);
  aktionen.add(hinweisKnopf("stillstand").match(/data-aktion="([^"]+)"/)[1]);
  for (const aktion of aktionen) assert.match(js, new RegExp(`case "${aktion}":`), aktion);
});

test("app.js: öffnet beide Blätter, setzt die Begriffe ein, Knopf im Hinweis", () => {
  const js = lies("app.js");
  assert.match(js, /case "begriffe-erklaerung":\s*return \$\("dialog-begriffe"\)\.showModal\(\);/);
  assert.match(js, /case "warum-nicht-ab":\s*return \$\("dialog-nicht-ab"\)\.showModal\(\);/);
  // Fehlt der Platz (zum Beispiel alte index.html aus einem Zwischenspeicher), darf der Start nicht abbrechen.
  assert.match(js, /const ort = \$\("begriffe-liste"\);\s*if \(ort\) ort\.innerHTML = begriffeHtml\(\);/);
  assert.match(js, /hinweisKnopf\(w\.id\)/);
});

test("Willkommensseite verspricht nichts, was die App nicht halten kann (Stefan, 04.11.2026)", () => {
  const html = lies("index.html");
  assert.match(html, /<p class="willkommen-unter">Sicher abnehmen nach den Leitlinien der Tierärzte<\/p>/);
  assert.match(html, /<span>Du wiegst das Futter, Kilossos rechnet die Kalorien<\/span>/);
  assert.doesNotMatch(html, /ohne Fettleber-Risiko|für jede Sorte/);
});

test("Version 0.36.8: Cache v74 mit js/freigaben.js, Versionszeile unter „Mehr“", () => {
  const sw = lies("sw.js");
  assert.match(sw, /const CACHE_NAME = "kilossos-v74";/);
  assert.match(sw, /"js\/wissen\.js",/);
  assert.match(sw, /"js\/besondere-tage\.js",/);
  assert.match(sw, /"js\/freigaben\.js",/);
  assert.match(lies("index.html"), /id="version">Version 0\.36\.8</);
});

// 0.36.8: „gewogen“ statt „Wägung“ in allen sichtbaren Texten (Entscheidung des Halters, 05.11.2026).
// Kommentare und Namen im Code dürfen „Wägung“/„waegung“ behalten.
const ohneKommentare = (text) =>
  text
    .replace(/<!--[^]*?-->/g, "")
    .replace(/\/\*[^]*?\*\//g, "")
    .replace(/(^|[^:"'\\])\/\/.*$/gm, "$1");

test("0.36.8: kein „Wägung“ mehr in sichtbaren Texten von App, Erklärseiten und PDF", () => {
  const dateien = ["app.js", "index.html", ...readdirSync(new URL("../js/", import.meta.url)).filter((d) => d.endsWith(".js")).map((d) => `js/${d}`)];
  assert.ok(dateien.length > 10);
  for (const datei of dateien) assert.doesNotMatch(ohneKommentare(lies(datei)), /Wägung/i, datei);
});

test("0.36.8: die neuen Formulierungen mit „gewogen“", () => {
  const app = lies("app.js");
  assert.match(app, /=== 1 \? "einmal gewogen" : `\$\{monat\.eintraege\.length\}-mal gewogen`/);
  assert.equal(lies("js/zusammenfassung.js").match(/Das Gewicht schwankt von Mal zu Mal;/g)?.length, 3);
  const html = lies("index.html");
  assert.match(html, /Einmal wiegen reicht dafür nicht, weil Waagen zu Hause schwanken\./);
  assert.match(html, /und das Gewicht schwankt von Mal zu Mal\./);
  assert.match(lies("js/speicher.js"), /Foto in der Liste unter „Gewicht“ antippen/);
  assert.match(lies("js/verlauf.js"), /Für jedes Wiegen auf 7 Tage umgerechnet\./);
});
