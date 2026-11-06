// 0.73.0: Erklärseite „Wie wiege ich meine Katze genau?“ (Ideen-Tafel „Info zu Wiege Methoden und Genauigkeiten“,
// Plan .planning/wiegen-erklaerseite.md, Text mit Stefans Ja vom 06.11.2026). Erreichbar als dritter Abschnitt auf
// „Tipps fürs Abnehmen“ und über einen Link im Fenster „Gewicht eintragen“, nicht zusätzlich unter „Wissen“.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { GRENZEN } from "../js/rechnen.js";

const lies = (datei) => readFileSync(new URL(`../${datei}`, import.meta.url), "utf8");
const blatt = (html, id) => html.match(new RegExp(`<dialog id="${id}">([\\s\\S]*?)</dialog>`))?.[1] ?? "";
const nurText = (html) => html.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
const NBSP = String.fromCharCode(160);

const html = lies("index.html");
const seite = blatt(html, "dialog-wiegen");
const text = nurText(seite).replaceAll(NBSP, " ");

test("Seite: Überschrift mit Fokus, drei Abschnitte, Quellen, Knopf „Verstanden“", () => {
  assert.ok(seite.includes('<h2 tabindex="-1" autofocus>Wie wiege ich meine Katze genau?</h2>'));
  const abschnitte = [...seite.matchAll(/<h3>([^<]+)<\/h3>/g)].map((m) => m[1]);
  assert.deepEqual(abschnitte, ["Welche Waage?", "Immer gleich wiegen", "Wenn ein Wert nicht passt"]);
  assert.match(seite, /<p class="leise">Quellen: Association for Pet Obesity Prevention, Ratgeber zum Wiegen zu Hause; AAHA 2014 und\s+Flanagan et al\. 2018 \(0,5 bis 2&nbsp;% pro Woche\)\.<\/p>/);
  assert.ok(seite.includes('<button value="abbrechen" class="knopf-haupt">Verstanden</button>'));
});

test("Beispielzahlen passen zu den Grenzen der App (5-kg-Katze)", () => {
  const min = Math.round(5000 * GRENZEN.abnahmeMin / 100);
  const max = Math.round(5000 * GRENZEN.abnahmeMax / 100);
  assert.ok(text.includes(`Die Leitlinien nennen ${GRENZEN.abnahmeMin.toString().replace(".", ",")} bis ${GRENZEN.abnahmeMax} % des Körpergewichts pro Woche.`), text);
  assert.ok(text.includes(`Bei einer 5-kg-Katze sind das nur ${min} bis ${max} g.`), text);
});

test("Wortlaut der Kernsätze (Stefans Ja)", () => {
  for (const satz of [
    "Tier- oder Babywaage: zeigt meist 10-g-Schritte. Für Katzen ist sie zu Hause die beste Wahl.",
    "leere Box auf die Waage, „Tara“ drücken, Katze hinein. Die Waage zeigt dann ihr Gewicht. Auf die Höchstlast achten.",
    "Personenwaage mit Katze auf dem Arm: am gröbsten.",
    "kann das Ergebnis leicht 100 g oder mehr danebenliegen, so viel wie eine ganze Woche Abnahme.",
    "Nimm immer dieselbe Waage, am gleichen Wochentag („Wiegetag“ unter „Mehr“) und etwa zur gleichen Uhrzeit, wenn möglich vor dem Füttern.",
    "Halsband oder Geschirr vorher ab.",
    "wiege erst nach: mit einer genauen Waage oder in der Tierarztpraxis. Ändere die Futtermenge nur mit deinem Tierarzt.",
  ]) {
    assert.ok(text.includes(satz), satz);
  }
});

test("Kein Name der eigenen Katzen, keine Futtermenge, keine Gedankenstriche, Zahl und Einheit mit NBSP", () => {
  assert.doesNotMatch(text, /Kito|Zuki/);
  assert.doesNotMatch(text, /g pro Tag|g\/Tag|kcal/);
  assert.doesNotMatch(text, /[—–]/);
  assert.doesNotMatch(seite, /\d\s+(kg|g|%)[\s.,)]/, "normales Leerzeichen zwischen Zahl und Einheit");
});

test("Tipps: dritter Abschnitt „Richtig wiegen“ mit Link, Einleitung nennt drei Seiten, Stichworte stehen auf der Seite", () => {
  const tipps = blatt(html, "dialog-tipps");
  assert.ok(nurText(tipps).includes("Die Tipps stehen auf drei Seiten"));
  const abschnitte = [...tipps.matchAll(/<h3>([^<]+)<\/h3>/g)].map((m) => m[1]);
  assert.deepEqual(abschnitte, ["Wenn die Waage stehen bleibt", "Für den Alltag", "Richtig wiegen"]);
  const wiegen = tipps.slice(tipps.indexOf("<h3>Richtig wiegen</h3>"));
  assert.ok(wiegen.includes('<button type="button" class="knopf-text" data-aktion="wiegen-erklaerung">Wie wiege ich meine Katze genau?</button>'));
  assert.ok(nurText(wiegen).includes("Welche Waage, immer gleich wiegen, wenn ein Wert nicht passt."));
  for (const stichwort of ["Welche Waage", "Immer gleich wiegen", "Wenn ein Wert nicht passt"]) assert.ok(text.includes(stichwort), stichwort);
});

test("Gewicht-Fenster: Link zur Seite direkt nach „Auf dem Arm gewogen?“", () => {
  const gewicht = blatt(html, "dialog-gewicht");
  const nachArm = gewicht.slice(gewicht.indexOf("</details>", gewicht.indexOf('id="arm-bereich"')));
  assert.match(
    nachArm,
    /^<\/details>\s*<p class="wiegen-link"><button type="button" class="knopf-text" data-aktion="wiegen-erklaerung">Wie wiege ich meine Katze genau\?<\/button><\/p>/,
  );
});

test("app.js öffnet die Seite, nicht unter „Wissen“", () => {
  assert.ok(lies("app.js").includes('case "wiegen-erklaerung":\n      return $("dialog-wiegen").showModal();'));
  const wissen = html.slice(html.indexOf('<h3 class="gruppe-titel">Wissen</h3>'), html.indexOf('<h3 class="gruppe-titel">Einstellungen</h3>'));
  assert.ok(!wissen.includes("wiegen-erklaerung"));
});

test("styles.css: Abstände der Seite wie bei den anderen Erklärseiten", () => {
  const css = lies("styles.css");
  assert.match(css, /#dialog-wiegen p, #dialog-wiegen li \{ margin: 0 0 10px; \}/);
  assert.match(css, /#dialog-wiegen h3 \{ margin: 4px 0 0; font-size: 1\.0625rem; \}/);
  assert.match(css, /#dialog-wiegen h2:focus \{ outline: none; \}/);
});
