import { test } from "node:test";
import assert from "node:assert/strict";
import { freigabeTafel, datumText } from "../js/mehr.js";
import { MCS } from "../js/daten.js";
import { SYMBOL } from "../js/symbole.js";
import { readFileSync } from "node:fs";

const lies = (datei) => readFileSync(new URL(`../${datei}`, import.meta.url), "utf8");

const mcsSchluessel = Object.keys(MCS)[1];

test("datumText schreibt ein ISO-Datum kurz auf Deutsch", () => {
  assert.equal(datumText("2026-11-13"), "13. Nov. 2026");
});

test("freigabeTafel: Kitos Beispiel mit BCS, MCS und Notiz", () => {
  const tafel = freigabeTafel({
    zielgewichtKg: 7.2, kcalProTag: 245, datum: "2026-11-13", tierarzt: "Praxis Beispiel",
    bcs: 8, mcs: mcsSchluessel, notiz: "Kontrolle in 4 Wochen",
  });
  assert.deepEqual(tafel.felder, [
    { titel: "Ziel", wert: "7,20 kg" },
    { titel: "kcal/Tag", wert: "245" },
    { titel: "BCS", wert: "8 von 9" },
  ]);
  assert.equal(tafel.zeile, "Praxis Beispiel, 13. Nov. 2026");
  assert.equal(tafel.befund, MCS[mcsSchluessel]);
  assert.equal(tafel.notiz, "Kontrolle in 4 Wochen");
});

test("freigabeTafel: ohne BCS, MCS und Notiz keine leeren Angaben", () => {
  const tafel = freigabeTafel({ zielgewichtKg: 7.2, kcalProTag: 245, datum: "2026-11-13", tierarzt: "Praxis Beispiel" });
  assert.equal(tafel.felder[2].wert, "–");
  assert.equal(tafel.befund, "");
  assert.equal(tafel.notiz, "");
});

test("freigabeTafel: ohne Freigabe null", () => {
  assert.equal(freigabeTafel(undefined), null);
});

// 0.35.1: Stefan wusste nicht, dass man die Tafel antippen kann (Handy-Test 05.11.2026). Deshalb steht es jetzt sichtbar da.
// „Korrigieren“ statt „Ändern“: Ändern ist nur für Fehler, ein neuer Plan kommt über „Freigabe eintragen“ dazu.
const zeichneFreigabe = () => {
  const js = lies("app.js");
  const start = js.indexOf("function zeichneFreigabe()");
  return js.slice(start, js.indexOf("// ---------- Profil", start));
};

test("Stift-Symbol für „korrigieren“", () => {
  assert.match(SYMBOL.stift, /^<svg class="ico" viewBox="0 0 24 24" aria-hidden="true" focusable="false">/);
});

test("Freigabe-Tafel zeigt sichtbar „Korrigieren oder löschen“ mit Stift, die ganze Tafel bleibt der Knopf", () => {
  const block = zeichneFreigabe();
  assert.match(block, /class="freigabe-knopf tippbar" data-aktion="freigabe-bearbeiten"/);
  assert.match(block, /<span class="freigabe-hinweis">\$\{SYMBOL\.stift\}Korrigieren oder löschen<\/span><\/button>/);
  // Der alte, nur vorgelesene Zusatz „, ändern“ entfällt: Der sichtbare Text wird jetzt mit vorgelesen.
  assert.doesNotMatch(block, /nur-vorlesen">, ändern/);
});

test("Frühere Freigaben: jede Zeile mit kleinem Stift, vorgelesen „korrigieren oder löschen“", () => {
  const block = zeichneFreigabe();
  assert.match(block, /class="waegung-knopf freigabe-zeile tippbar" data-aktion="freigabe-bearbeiten"/);
  assert.match(
    block,
    /<span class="stift" aria-hidden="true">\$\{SYMBOL\.stift\}<\/span><span class="nur-vorlesen">, korrigieren oder löschen<\/span><\/button>/,
  );
});

test("styles.css: Hinweis als umrandetes Feld, Stift in der Zeile leise", () => {
  const css = lies("styles.css");
  assert.match(css, /\.freigabe-hinweis \{[^}]*border: 1px solid var\(--akzent\);/);
  assert.match(css, /\.freigabe-hinweis \{[^}]*color: var\(--akzent-stark\);/);
  assert.match(css, /\.freigabe-zeile \.stift \{[^}]*color: var\(--text-leise\);/);
});

// 0.36.4: Neue Mahlzeit ohne vorgewählte Sorte (Sicherheits-Review 05.11.2026, Entscheidung des Halters). Vorher stand die
// erste Sorte schon drin: 50 g „Sheba“ bei vorgewähltem Purina zählten 164 statt 38,5 kcal. Nur eine Sorte: bleibt vorgewählt.
test("app.js: neue Mahlzeit wählt keine Sorte vor, außer es gibt nur eine", () => {
  const app = lies("app.js");
  assert.doesNotMatch(app, /futterMenue\(mahlzeit \? mahlzeit\.futterId : daten\.futter\[0\]\?\.id\)/);
  assert.match(app, /futterMenue\(mahlzeit \? mahlzeit\.futterId : daten\.futter\.length === 1 \? daten\.futter\[0\]\.id : null\)/);
});

// 0.42.5: Im Freigabe-Fenster stehen Plan (Ziel, Tagesmenge) und Befund (BCS, MCS) unter eigenen Überschriften.
test("0.42.5: Freigabe-Fenster trennt Plan und Befund", () => {
  const html = lies("index.html");
  const fenster = html.slice(html.indexOf('<dialog id="dialog-freigabe">'), html.indexOf("</dialog>", html.indexOf('<dialog id="dialog-freigabe">')));
  const stelle = (muster) => {
    const i = fenster.search(muster);
    assert.ok(i >= 0, `fehlt: ${muster}`);
    return i;
  };
  const plan = stelle(/<h3 class="form-abschnitt">Plan vom Tierarzt<\/h3>/);
  const befund = stelle(/<h3 class="form-abschnitt befund">Befund am Tag der Freigabe <small>\(freiwillig\)<\/small><\/h3>/);
  const reihe = [plan, stelle(/name="ziel"/), stelle(/name="kcal"/), stelle(/name="datum"/), stelle(/name="tierarzt"/), stelle(/name="notiz"/),
    befund, stelle(/id="label-bcs">BCS vom Tierarzt</), stelle(/id="label-mcs">Muskelzustand \(MCS\) vom Tierarzt</), stelle(/data-aktion="bcs-erklaerung"/)];
  assert.deepEqual([...reihe].sort((a, b) => a - b), reihe);
  assert.doesNotMatch(fenster, /\(optional\)<\/span>/);
  assert.match(lies("styles.css"), /\.form-abschnitt\s*\{/);
});

// 0.45.0: „Mehr“ aufgeräumt (Funde 06.11.2026, Lösung C). Unter „Tierarzt“ steht nur, womit man etwas tut; alle Erklärungen
// stehen unter „Wissen“. Der Fotos-Haken sitzt jetzt in der geöffneten Übersicht.
const ansichtMehr = () => {
  const html = lies("index.html");
  const start = html.indexOf('<section class="ansicht" data-ansicht="mehr"');
  return html.slice(start, html.indexOf("</section>", start));
};
const abschnitt = (mehr, titel) => {
  const start = mehr.search(titel);
  assert.ok(start >= 0, `fehlt: ${titel}`);
  const ende = mehr.indexOf('<h3 class="gruppe-titel"', start + 1);
  return mehr.slice(start, ende < 0 ? undefined : ende);
};

test("0.45.0: Erklärungen stehen unter „Wissen“ nach „Begriffe kurz erklärt“, vor „Warum nimmt meine Katze nicht ab?“", () => {
  const wissen = abschnitt(ansichtMehr(), /<h3 class="gruppe-titel">Wissen<\/h3>/);
  const reihe = ["begriffe-erklaerung", "warum-kein-ziel", "bcs-erklaerung", "grenzen-erklaerung", "warum-nicht-ab"].map((aktion) => {
    const i = wissen.indexOf(`data-aktion="${aktion}"`);
    assert.ok(i >= 0, `fehlt unter Wissen: ${aktion}`);
    return i;
  });
  assert.deepEqual([...reihe].sort((a, b) => a - b), reihe);
  assert.match(wissen, /<span class="text">Warum keine Futtermenge\?<\/span>/);
  assert.match(wissen, /<span class="text">Was ist der BCS\?<\/span>/);
  assert.match(wissen, /<span class="text">Welche Grenzen gelten\?<\/span>/);
});

test("0.45.0: Unter „Tierarzt“ bleibt nur „Praxis anrufen“, die Liste ist ohne Telefon ganz versteckt", () => {
  const tierarzt = abschnitt(ansichtMehr(), /id="titel-tierarzt">Tierarzt<\/h3>/);
  assert.doesNotMatch(tierarzt, /warum-kein-ziel|bcs-erklaerung|grenzen-erklaerung/);
  assert.match(tierarzt, /<div class="liste" id="tierarzt-liste" hidden>\s*<a class="eintrag" id="praxis-anrufen" hidden><\/a>\s*<\/div>/);
  // Kein leerer Kasten: die Liste hat eine eigene display-Regel, darum braucht [hidden] eine eigene Regel.
  assert.match(lies("styles.css"), /\.liste\[hidden\] \{ display: none; \}/);
  assert.match(zeichneFreigabe(), /\$\("tierarzt-liste"\)\.hidden = !link;/);
});

test("0.45.0: „Fotos mitnehmen“ steht nicht mehr unter „Mehr“, der Zeitraum bleibt dort", () => {
  const mehr = ansichtMehr();
  assert.doesNotMatch(mehr, /Fotos mitnehmen|id="bericht-fotos"/);
  const uebersicht = abschnitt(mehr, /<h3 class="gruppe-titel">Übersicht für den Tierarzt<\/h3>/);
  assert.match(uebersicht, /id="bericht-zeitraum-feld"/);
  assert.match(uebersicht, /data-aktion="bericht-oeffnen"/);
});

test("0.45.0: Schalter „Fotos zeigen“ in der geöffneten Übersicht nach dem Druck-Tipp, standardmäßig aus", () => {
  const html = lies("index.html");
  const start = html.indexOf('<div class="bericht-werkzeuge">');
  const werkzeuge = html.slice(start, html.indexOf('<article class="bericht"', start));
  const tipp = werkzeuge.indexOf("Im Druckfenster als Drucker");
  const schalter = werkzeuge.indexOf('<label class="bericht-schalter">');
  assert.ok(tipp >= 0 && schalter > tipp, "Schalter steht nach dem Druck-Tipp");
  assert.match(
    werkzeuge,
    /<label class="bericht-schalter">\s*<input type="checkbox" id="bericht-fotos">\s*<span>Fotos zeigen<small>erstes und letztes Foto im Zeitraum<\/small><\/span>\s*<\/label>/,
  );
  assert.doesNotMatch(werkzeuge, /id="bericht-fotos"[^>]*checked/);
  // Im Druck verschwinden die Werkzeuge samt Schalter (bestehende Regel).
  assert.match(lies("styles.css"), /@media print[\s\S]*\.bericht-werkzeuge,[^{]*\{ display: none !important; \}/);
});

test("0.45.0: Umschalten zeichnet die Übersicht sofort neu, zeichneBericht liest weiter den Haken", () => {
  const app = lies("app.js");
  assert.match(app, /\$\("bericht-fotos"\)\.addEventListener\("change", zeichneBericht\);/);
  assert.match(app, /fotos: \$\("bericht-fotos"\)\.checked,/);
  // Der Weg zur Übersicht bleibt: „Übersicht öffnen“ zeichnet und zeigt sie, „Drucken / als PDF speichern“ druckt.
  assert.match(app, /case "bericht-oeffnen":\s*zeichneBericht\(\);\s*zeigeAnsicht\("bericht"\);/);
  assert.match(app, /case "bericht-drucken":\s*return window\.print\(\);/);
});

test("0.45.0: Schalter in der Übersicht mit mindestens 48 px Tippfläche", () => {
  const css = lies("styles.css");
  assert.match(css, /\.bericht-schalter \{[^}]*min-height: 48px;/);
  assert.match(css, /\.bericht-schalter input\[type="checkbox"\] \{[^}]*width: 24px; height: 24px;/);
});

// Lösung D: nur der erste Satz unter „Über Kilossos“ ist neu, der Rest bleibt wörtlich.
test("0.45.0: erster Absatz „Über Kilossos“ mit neuem ersten Satz, Rest wörtlich gleich", () => {
  const ueber = abschnitt(ansichtMehr(), /<h3 class="gruppe-titel">Über Kilossos<\/h3>/);
  assert.match(
    ueber,
    /<p class="leise">Kilossos begleitet deine Katze beim Abnehmen: Es zeichnet auf, rechnet nach und warnt, wenn etwas aus dem\s+sicheren Bereich läuft\.\s+<strong>Es ersetzt keinen Tierarzt<\/strong> und ist kein Medizinprodukt\. Zielgewicht und Tagesmenge legt immer der Tierarzt fest\.<\/p>/,
  );
  assert.doesNotMatch(lies("index.html"), /begleitet die Abnahme von Kito und anderen Katzen/);
  assert.match(
    ueber,
    /<p class="leise"><strong>Ist deine Katze krank<\/strong> \(zum Beispiel Diabetes, Nieren-, Schilddrüsen- oder Lebererkrankung\) oder frisst sie\s+plötzlich schlecht, besprich jede Änderung am Futter vorher mit deinem Tierarzt\.\s+<strong>Frisst eine Katze einen Tag oder länger gar nicht, gehört sie sofort zum Tierarzt\.<\/strong><\/p>/,
  );
});
