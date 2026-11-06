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

// 0.45.0 stellte die Erklärungen direkt unter „Wissen“; seit 0.60.0 erreicht man sie über „Häufige Fragen“
// (Tests „0.60.0“ am Ende dieser Datei). Die Seiten selbst bleiben:
test("0.45.0: „Warum keine Futtermenge?“ und „Welche Grenzen gelten?“ stehen als Verweis in „Häufige Fragen“", () => {
  const html = lies("index.html");
  const fragen = html.slice(html.indexOf('<dialog id="dialog-fragen">'), html.indexOf("</dialog>", html.indexOf('<dialog id="dialog-fragen">')));
  assert.match(fragen, /data-aktion="warum-kein-ziel">Warum keine Futtermenge\?</);
  assert.match(fragen, /data-aktion="grenzen-erklaerung">Welche Grenzen gelten\?</);
});

// 0.48.1: „Was ist der BCS?“ stand unter „Wissen“ doppelt neben „Begriffe kurz erklärt“ (Halter 06.11.2026).
test("0.48.1: Kein eigener BCS-Eintrag unter „Wissen“, die Seite bleibt über „Mehr zum BCS“ und die Freigabe erreichbar", () => {
  const wissen = abschnitt(ansichtMehr(), /<h3 class="gruppe-titel">Wissen<\/h3>/);
  assert.doesNotMatch(wissen, /bcs-erklaerung|Was ist der BCS\?/);
  const html = lies("index.html");
  assert.match(html, /<dialog id="dialog-bcs">/);
  assert.match(html, /<button type="button" class="knopf-text" data-aktion="bcs-erklaerung">Was ist der BCS\?<\/button>/);
  assert.match(lies("js/wissen.js"), /mehr: \{ aktion: "bcs-erklaerung", text: "Mehr zum BCS" \}/);
  assert.match(lies("app.js"), /case "bcs-erklaerung":/);
});

// Seit 0.49.0 steht unter „Praxis anrufen“ noch „Weg zur Praxis“; die Liste ist nur ohne Telefon UND ohne Adresse versteckt.
test("0.45.0: Unter „Tierarzt“ nur Praxis-Einträge, die Liste ist ohne Telefon und Adresse ganz versteckt", () => {
  const tierarzt = abschnitt(ansichtMehr(), /id="titel-tierarzt">Tierarzt<\/h3>/);
  assert.doesNotMatch(tierarzt, /warum-kein-ziel|bcs-erklaerung|grenzen-erklaerung/);
  assert.match(
    tierarzt,
    /<div class="liste" id="tierarzt-liste" hidden>\s*<a class="eintrag" id="praxis-anrufen" hidden><\/a>\s*<a class="eintrag" id="praxis-weg" target="_blank" rel="noopener" hidden><\/a>\s*<\/div>/,
  );
  // Kein leerer Kasten: die Liste hat eine eigene display-Regel, darum braucht [hidden] eine eigene Regel.
  assert.match(lies("styles.css"), /\.liste\[hidden\] \{ display: none; \}/);
  assert.match(zeichneFreigabe(), /\$\("tierarzt-liste"\)\.hidden = !link && !karte;/);
});

// 0.49.0: „Weg zur Praxis“ (Plan .planning/praxis-im-profil.md). Öffnet Google Maps erst beim Antippen.
test("0.49.0: „Weg zur Praxis“ nur mit Adresse, Link aus kartenLink, unter „Praxis anrufen“", () => {
  const block = zeichneFreigabe();
  assert.match(block, /const karte = kartenLink\(tier\.tierarzt\?\.praxis, tier\.tierarzt\?\.adresse\);/);
  assert.match(block, /\$\("praxis-weg"\)\.hidden = !karte;/);
  assert.match(block, /\$\("praxis-weg"\)\.href = karte;/);
  assert.match(block, /<span data-symbol="ort">\$\{SYMBOL\.ort\}<\/span>/);
  assert.match(block, /<span class="text">Weg zur Praxis<small>öffnet Google Maps<\/small><\/span>/);
  assert.ok(block.indexOf('$("praxis-anrufen").href') < block.indexOf('$("praxis-weg").href'), "Anrufen steht vor dem Weg");
  assert.match(lies("app.js"), /import \{[^}]*kartenLink[^}]*\} from "\.\/js\/profil\.js";/);
});

test("0.49.0: Ort-Symbol für „Weg zur Praxis“", () => {
  assert.match(SYMBOL.ort, /^<svg class="ico" viewBox="0 0 24 24" aria-hidden="true" focusable="false">/);
});

test("0.49.0: Ist der letzte Eintrag einer Liste versteckt, bekommt der vorige die unteren Rundungen", () => {
  assert.match(
    lies("styles.css"),
    /\.liste > \.eintrag:has\(\+ \.eintrag\[hidden\]:last-child\) \{ border-bottom-left-radius: var\(--rund\); border-bottom-right-radius: var\(--rund\); \}/,
  );
});

const profilFenster = () => {
  const html = lies("index.html");
  const start = html.indexOf('<form method="dialog" id="form-profil">');
  return html.slice(start, html.indexOf("</form>", start));
};

test("0.49.0: Profil hat „Adresse der Praxis (optional)“ unter dem Telefon, danach der Übernahme-Hinweis", () => {
  const fenster = profilFenster();
  const telefon = fenster.indexOf('name="telefon"');
  const adresse = fenster.search(
    /<label>Adresse der Praxis \(optional\)\s*<input name="adresse" autocomplete="off" maxlength="80" placeholder="z\. B\. Musterstraße 1, 12345 Musterstadt">\s*<\/label>/,
  );
  const hinweis = fenster.indexOf('<p class="tipp" id="profil-praxis-hinweis" hidden></p>');
  assert.ok(telefon >= 0 && adresse > telefon, "Adresse steht unter dem Telefon");
  assert.ok(hinweis > adresse, "Hinweis steht unter der Adresse");
  assert.doesNotMatch(fenster, /E-Mail der Praxis|name="email"/);
});

const oeffneProfilBlock = () => {
  const js = lies("app.js");
  const start = js.indexOf("function oeffneProfil(einTier)");
  return js.slice(start, js.indexOf("beimSpeichern(\"form-profil\"", start));
};

test("0.49.0: Neues Tier übernimmt die Praxis des gewählten Tiers mit Hinweis, Bearbeiten nicht", () => {
  const block = oeffneProfilBlock();
  assert.match(block, /const vorschlag = einTier \? null : praxisVorschlag\(tier\);/);
  assert.match(block, /const praxisDaten = einTier \? p\.tierarzt : vorschlag;/);
  assert.match(block, /form\.praxis\.value = praxisDaten\?\.praxis \?\? "";/);
  assert.match(block, /form\.telefon\.value = praxisDaten\?\.telefon \?\? "";/);
  assert.match(block, /form\.adresse\.value = praxisDaten\?\.adresse \?\? "";/);
  assert.match(block, /\$\("profil-praxis-hinweis"\)\.hidden = !vorschlag;/);
  assert.match(block, /`Von \$\{tier\.name\} übernommen\. Bei einem anderen Tierarzt einfach ändern\.`/);
  // textContent, nicht innerHTML: der Name kommt vom Halter.
  assert.match(block, /\$\("profil-praxis-hinweis"\)\.textContent = /);
});

test("0.49.0: Speichern übernimmt die Adresse in tierarzt, leer wird weggelassen", () => {
  const app = lies("app.js");
  assert.match(app, /const adresse = werte\.get\("adresse"\)\.trim\(\);/);
  assert.match(app, /const tierarzt = \{ \.\.\.\(praxis && \{ praxis \}\), \.\.\.\(telefon && \{ telefon \}\), \.\.\.\(adresse && \{ adresse \}\) \};/);
});

test("0.49.0: Datenschutzerklärung nennt Adresse und „Weg zur Praxis“", () => {
  const ds = lies("datenschutz.html");
  assert.match(ds, /Profilbild, Tierarztpraxis mit Telefonnummer und Adresse, Wiegetag/);
  const links = ds.slice(ds.indexOf("<h3>6. Links und Anrufe</h3>"), ds.indexOf("<h3>7."));
  assert.match(
    links,
    /Der Knopf „Weg zur Praxis“\s+öffnet Google Maps mit der eingetragenen Adresse der Praxis\. Erst wenn du darauf tippst, gehen Name und Adresse\s+der Praxis an Google; ab dann gelten die Datenschutzbestimmungen von Google\./,
  );
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

// 0.60.0 (Stefan 06.11.: „in Wissen stehen Sachen, die in Unterrubriken bereits vorkommen“):
// Unter „Wissen“ nur noch die drei Einstiege; die Erklärseiten erreicht man über „Tipps“ und „Häufige Fragen“.
test("0.60.0: jede Erklärseite bleibt über „Wissen“, „Tipps“ oder „Häufige Fragen“ erreichbar", () => {
  const html = lies("index.html");
  const blatt = (id) => html.slice(html.indexOf(`<dialog id="${id}">`), html.indexOf("</dialog>", html.indexOf(`<dialog id="${id}">`)));
  const wissen = abschnitt(ansichtMehr(), /<h3 class="gruppe-titel">Wissen<\/h3>/);
  const verweise = wissen + blatt("dialog-tipps") + blatt("dialog-fragen");
  for (const aktion of ["begriffe-erklaerung", "warum-kein-ziel", "grenzen-erklaerung", "warum-nicht-ab", "alltag-erklaerung"]) {
    assert.ok(verweise.includes(`data-aktion="${aktion}"`), `nicht mehr erreichbar: ${aktion}`);
  }
});

// 0.61.0 (Stefan 06.11.: „Warum nimmt meine Katze nicht ab?“ stand in „Tipps“ und in „Häufige Fragen“,
// „So nutzt du Kilossos“ und „Begriffe“ in „Wissen“ bzw. „Häufige Fragen“; Begriffe gehört auf die Hauptseite):
// 0.63.0 (Stefan 06.11.: „Bevor es losgeht“ gehört nach vorn, Begriffe vor die Häufigen Fragen): Die Ursachen-Seite
// zog von „Tipps“ nach „Wissen“ an die erste Stelle, nicht zusätzlich (sonst doppelt verlinkt).
test("0.63.0: „Wissen“ zeigt Ursachen, Anleitung, Tipps, Begriffe und Häufige Fragen", () => {
  const wissen = abschnitt(ansichtMehr(), /<h3 class="gruppe-titel">Wissen<\/h3>/);
  const aktionen = [...wissen.matchAll(/data-aktion="([a-z-]+)"/g)].map((m) => m[1]);
  assert.deepEqual(aktionen, ["ursachen-erklaerung", "anleitung-erklaerung", "tipps-erklaerung", "begriffe-erklaerung", "fragen-erklaerung"]);
  // Kurzer Name, damit die Zeile bei 375 px einzeilig bleibt (der volle Titel brach um, gemessen 06.11.)
  assert.ok(wissen.includes('<span data-symbol="futter"></span><span class="text">Woher kommt das Übergewicht?</span>'));
  assert.ok(wissen.includes('<span data-symbol="buch"></span><span class="text">Begriffe kurz erklärt</span>'));
});

test("0.61.0: keine Seite ist über „Wissen“, „Tipps“ und „Häufige Fragen“ zweimal verlinkt", () => {
  const html = lies("index.html");
  const blatt = (id) => html.slice(html.indexOf(`<dialog id="${id}">`), html.indexOf("</dialog>", html.indexOf(`<dialog id="${id}">`)));
  const wissen = abschnitt(ansichtMehr(), /<h3 class="gruppe-titel">Wissen<\/h3>/);
  const alle = [wissen, blatt("dialog-tipps"), blatt("dialog-fragen")]
    .flatMap((teil) => [...teil.matchAll(/data-aktion="([a-z-]+)"/g)].map((m) => m[1]));
  const doppelt = alle.filter((a, i) => alle.indexOf(a) !== i);
  assert.deepEqual(doppelt, []);
});

// 0.61.2 (Stefan 06.11.: im Profil stand „Entfernen“ schräg unter „Abbrechen | Speichern“): Auf schmalen Bildschirmen
// teilen sich „Abbrechen“ und „Speichern“ die erste Zeile je zur Hälfte, der rote Knopf steht darunter über die volle
// Breite. Drei nebeneinander passen nicht (gemessen 368 px bei 335 px Platz). Gilt für Profil, Futter und Freigabe,
// nicht für die eigene Rückfrage (dort bleibt der rote Ja-Knopf neben „Abbrechen“).
test("0.61.2: Knopfreihe mit rotem Knopf auf dem Handy bündig in zwei Zeilen", () => {
  const css = lies("styles.css");
  // Festes Raster statt Umbruch (Stefan: „zwingend“ kein Verschieben durch die Breite): zwei gleiche Spalten,
  // der rote Knopf über beide; Text bricht im Knopf um (min-width: 0), der Knopf wechselt nie die Zeile.
  assert.match(css, /\.knoepfe:not\(\.rueckfrage-knoepfe\):has\(> \.knopf-gefahr:not\(\[hidden\]\)\) \{ display: grid; grid-template-columns: 1fr 1fr; \}/);
  assert.match(css, /\.knoepfe:not\(\.rueckfrage-knoepfe\):has\(> \.knopf-gefahr:not\(\[hidden\]\)\) > button \{ min-width: 0; padding-inline: 12px; text-align: center; \}/);
  assert.match(css, /\.knoepfe:not\(\.rueckfrage-knoepfe\) > \.knopf-gefahr \{ grid-column: 1 \/ -1; order: 2; margin-right: 0; \}/);
  // Der alte Umbruch per ::before ist weg (wäre im Raster eine leere Zelle).
  assert.doesNotMatch(css, /\.knoepfe:has\(> \.knopf-gefahr:not\(\[hidden\]\)\)::before/);
  const html = lies("index.html");
  for (const id of ["profil-entfernen", "futter-loeschen", "freigabe-loeschen"]) {
    assert.match(html, new RegExp(`<div class="knoepfe">\\s*<button value="[a-z]+" formnovalidate class="knopf-gefahr" id="${id}" hidden>`), id);
  }
});

// 0.63.0 (Stefan 06.11.: „Wiegetag von Kito“ steht nicht neben „Kein fester Tag“ wie bei „Darstellung“):
// Titel und Auswahl waren zusammen breiter als die Zeile (375 px: 294 von 275 px), das Menü rutschte nach unten.
// Jetzt wie „Darstellung“: Titel „Wiegetag“, der Name des Tiers klein darunter, die Vorlesefunktion liest beides.
test("0.63.0: Wiegetag mit kurzem Titel, Tiername klein darunter, beides in der Beschriftung", () => {
  const html = lies("index.html");
  assert.match(html, /<span class="text"><span id="label-wiegetag">Wiegetag<\/span><small id="wiegetag-tier" hidden><\/small><\/span>\s*<div id="wiegetag-feld"><\/div>/);
  const js = lies("app.js");
  const fn = js.slice(js.indexOf("function zeichneWiegetag()"), js.indexOf("document.addEventListener", js.indexOf("function zeichneWiegetag()")));
  assert.ok(!fn.includes("Wiegetag von"));
  assert.ok(fn.includes('beschriftung: "label-wiegetag wiegetag-tier",'));
  assert.ok(fn.includes("klein.hidden = !mehrere;"));
  assert.ok(fn.includes('klein.textContent = mehrere ? `Für ${tier.name}.` : "";'));
  // Platz bei 375 px: 311 px innen = Symbol 22 + Abstand 14 + Text-Mindestbreite + Abstand 14 + Menü 142 (gemessen)
  assert.match(lies("styles.css"), /\.eintrag-auswahl \.text \{ flex: 1 1 6\.5rem; overflow-wrap: normal; \}/);
});
