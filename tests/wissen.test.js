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
// Mengen wie "50 g pro Tag" oder "200 kcal am Tag" darf kein Erklärtext nennen (die Menge legt nur die Tierarztpraxis fest).
const MENGE_PRO_TAG = /\d[\d,.]*\s*(g|Gramm|kcal)\s*(pro|am|je|\/)\s*Tag/i;

// 0.65.0: „Vegan und vegetarisch“ (Ideen-Tafel, Stefan 06.11.2026 „so umsetzen“): neutral, mit Quelle, ohne Mengen,
// ohne Sorten; Umstellung nur mit der Tierarztpraxis. Beim Termin am 13.11. gegenlesen lassen.
test("0.65.0: Begriff „Vegan und vegetarisch“ neutral, mit Quellen beider Seiten und Verweis auf den Tierarzt", () => {
  const b = BEGRIFFE.find((x) => x.id === "vegan");
  assert.ok(b, "Begriff fehlt");
  assert.equal(b.begriff, "Vegan und vegetarisch");
  assert.match(b.text, /Taurin, Arachidonsäure und Vitamin A/);
  assert.match(b.text, /besprich eine Umstellung vorher mit der Tierarztpraxis\.$/);
  assert.match(b.text, /Fett und nicht Muskeln/);
  assert.doesNotMatch(b.text, /gefährlich|ungesund|gesünder|Tierquälerei/i);
  for (const quelle of ["NRC 2006", "Domínguez-Oliva et al. 2023", "Knight et al. 2023", "British Veterinary Association 2024", "AAHA 2014"]) {
    assert.ok(b.quelle.includes(quelle), quelle);
  }
});

test("Begriffe: die 13 Begriffe aus dem Plan, alphabetisch sortiert", () => {
  assert.deepEqual(BEGRIFFE.map((b) => b.begriff), [
    "Alleinfutter und Ergänzungsfutter",
    "Analytische Bestandteile",
    "BARF",
    "BCS und MCS",
    "Diätfutter aus der Tierarztpraxis",
    "Fettleber (hepatische Lipidose)",
    "Freigabe (tierärztlich)",
    "kcal und ME",
    "Light und Sterilised",
    "Nassfutter und Trockenfutter",
    "RER (Ruheenergiebedarf)",
    "Vegan und vegetarisch",
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
  // 0.60.0 kurz nur in „Häufige Fragen“, seit 0.61.0 wieder direkt unter „Wissen“.
  assert.match(html, /data-aktion="begriffe-erklaerung">\s*<span data-symbol="buch"><\/span><span class="text">Begriffe kurz erklärt</);
  assert.match(html, /data-aktion="warum-nicht-ab">Warum nimmt meine Katze nicht ab\?</);
  for (const id of ["dialog-begriffe", "dialog-nicht-ab"]) assert.match(blatt(html, id), /<h2 tabindex="-1" autofocus>/, id);
  assert.match(blatt(html, "dialog-begriffe"), /<div id="begriffe-liste"><\/div>/);
});

test("„Warum nimmt meine Katze nicht ab?“: Fettleber-Kasten offen sichtbar, keine Futtermengen", () => {
  const text = blatt(lies("index.html"), "dialog-nicht-ab");
  assert.match(text, /<p class="notfall-hinweis"><strong>Bitte nie hungern lassen\.<\/strong>/);
  assert.match(text, /sofort in die Tierarztpraxis/);
  assert.match(text, /<h3>Bitte nicht selbst kürzen<\/h3>/);
  assert.match(text, /<p class="leise">Quellen:/);
  assert.match(text, /Merck/);
  assert.match(text, /Besprich dann den Plan mit der Tierarztpraxis/);
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
  assert.match(html, /<p class="willkommen-unter">Sicher abnehmen nach tierärztlichen Leitlinien<\/p>/);
  assert.match(html, /<span>Du wiegst das Futter, Kilossos rechnet die Kalorien<\/span>/);
  assert.doesNotMatch(html, /ohne Fettleber-Risiko|für jede Sorte/);
});

test("Version 0.81.0: Cache v143 mit js/rueckfrage.js, js/nachtragen.js und der Demo (Kito und Zuki), Versionszeile unter „Mehr“", () => {
  const sw = lies("sw.js");
  assert.match(sw, /const CACHE_NAME = "kilossos-v143";/);
  assert.match(sw, /"js\/nachtragen\.js",/);
  assert.match(sw, /"js\/rueckfrage\.js",/);
  assert.match(sw, /"demo\/kito-simulation\.json",/);
  assert.match(sw, /"js\/wissen\.js",/);
  assert.match(sw, /"js\/besondere-tage\.js",/);
  assert.match(sw, /"js\/freigaben\.js",/);
  assert.match(sw, /"js\/heute-grafiken\.js",/);
  assert.match(lies("index.html"), /id="version">Version 0.81.0</);
});

// 0.42.7: Wiege-Tipp Transportbox im Bereich „Auf dem Arm gewogen?“ (Ideen-Tafel, Halter 06.11.2026).
test("0.42.7: Transportbox-Tipp steht im Arm-Bereich nach dem Satz zur Tier- oder Babywaage", () => {
  const html = lies("index.html");
  const arm = html.slice(html.indexOf('<details class="arm"'), html.indexOf("</details>", html.indexOf('<details class="arm"')));
  assert.match(arm, /Ohne Tierwaage geht es genauer mit der Transportbox: leere Box auf eine Küchen- oder Paketwaage, „Tara“ drücken, Katze hinein\. Die Waage zeigt dann ihr Gewicht\. Auf die Höchstlast achten\./);
  assert.doesNotMatch(arm, /bis die Anzeige 0 zeigt|schaffen nur 5/);
  assert.ok(arm.indexOf("Babywaage") < arm.indexOf("Transportbox"), "Tipp steht nach dem Satz zur Babywaage");
});

// Zwei Absätze: „Warum ungenau“ (mit den Zahlen je Tier) und „So geht es genauer“. Kein Satz des Sicherheitstexts fällt weg.
test("0.42.7: Hinweis im Arm-Bereich in zwei Absätze geteilt, alle Sätze bleiben", () => {
  const html = lies("index.html");
  const arm = html.slice(html.indexOf('<details class="arm"'), html.indexOf("</details>", html.indexOf('<details class="arm"')));
  const absaetze = [...arm.matchAll(/<p class="tipp">([^]*?)<\/p>/g)].map((m) => m[1].replace(/\s+/g, " ").trim());
  const [, warum, genauer] = absaetze;
  assert.equal(absaetze.length, 3, "Tipp oben + zwei Absätze unten");
  assert.match(warum, /^Personenwaagen zeigen meist nur 100-g-Schritte[^]*leicht 100 g oder mehr danebenliegen\. <span id="arm-zahlen"><\/span>$/);
  assert.match(genauer, /^Für den Wiegetag ist eine Tier- oder Babywaage \(10-g-Schritte\) deutlich genauer\. Ohne Tierwaage/);
  assert.match(genauer, /Auf die Höchstlast achten\. Immer dieselbe Waage nehmen\. Bei einer Warnung zum Tempo erst mit einer genauen Waage oder in der Tierarztpraxis nachwiegen\.$/);
});

// Zahl und Einheit im Text je Tier nie über zwei Zeilen („1 / % des Gewichts“, „0,5–2 / % pro Woche“).
test("0.42.7: Zahlen im Arm-Text mit geschütztem Leerzeichen vor der Einheit", () => {
  const app = lies("app.js");
  const block = app.slice(app.indexOf('$("arm-zahlen").textContent'), app.indexOf("Schon 100 g sind bei einer Katze oft"));
  const nb = String.fromCharCode(160);
  for (const stelle of [
    `sind 1${nb}% des Gewichts`,
    `prozentInGramm(letzte.kg, 1)}${nb}g.`,
    `Schon 100${nb}g sind`,
    `1)}${nb}kg bei einem Menschen mit 75${nb}kg.`,
    `GRENZEN.abnahmeMax}${nb}% pro Woche`,
    `GRENZEN.abnahmeMax)}${nb}g.`,
  ]) {
    assert.ok(block.includes(stelle), stelle);
  }
});

test("0.41.0: Foto im Profil-Fenster (auch beim Anlegen), gilt erst beim Speichern", () => {
  const html = lies("index.html");
  const profil = html.slice(html.indexOf('<dialog id="dialog-profil">'), html.indexOf("</dialog>", html.indexOf('<dialog id="dialog-profil">')));
  assert.match(profil, /id="profil-foto-datei"/);
  assert.match(profil, /data-aktion="profil-foto-waehlen"/);
  assert.match(profil, /data-aktion="profil-foto-entfernen"/);
  const app = lies("app.js");
  assert.match(app, /setze\("foto", profilFoto\)/);
  assert.match(app, /case "profil-foto-waehlen":/);
  assert.match(app, /case "profil-foto-entfernen":/);
});

test("0.41.0: close-Handler setzen ihren Merker nur bei wirklich geschlossenem Fenster zurück", () => {
  const app = lies("app.js");
  // Seit 0.43.0 setzt der Block auch den Merker „Foto entfernt“ zurück
  assert.match(app, /if \(!\$\("dialog-gewicht"\)\.open\) \{\s*bearbeiteteWaegung = null;\s*fotoEntfernt = false;\s*\}/);
  assert.match(app, /if \(\$\("dialog-foto"\)\.open\) return;/);
  assert.match(app, /if \(!\$\("dialog-besonders"\)\.open\) bearbeiteterTag = null;/);
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
  assert.match(lies("js/verlauf.js"), /Jeder Punkt steht für ein Wiegen, verglichen mit der Messung mindestens 7 Tage davor und auf 7 Tage umgerechnet\./);
});
