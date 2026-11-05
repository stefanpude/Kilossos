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
