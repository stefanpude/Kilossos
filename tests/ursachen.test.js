// 0.62.0: Erklärseite „Warum ist meine Katze zu schwer geworden?“ (Ideen-Tafel h1b2wfe9s8hy5ksjrkhm, Stefan 06.11.2026:
// „setzen wir jetzt schon um“, Text mit Stefans Ja; Plan und Quellen in .planning/ursachen-seite.md).
// Erreichbar über „Tipps fürs Abnehmen“ → „Bevor es losgeht“. Was es schon gibt, steht nur als Verweis da.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const lies = (datei) => readFileSync(new URL(`../${datei}`, import.meta.url), "utf8");
const blatt = (html, id) => html.match(new RegExp(`<dialog id="${id}">([\\s\\S]*?)</dialog>`))?.[1] ?? "";
const nurText = (html) => html.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();

const UEBERSCHRIFTEN = [
  "Futter steht den ganzen Tag bereit",
  "Nach der Kastration",
  "Wenig Bewegung",
  "Langeweile und Stress",
  "Mehr im Napf, als man denkt",
  "Krankheiten und Medikamente",
];

test("Blatt: Überschrift mit Fokus, sechs Abschnitte, Knopf „Verstanden“, öffnet über app.js", () => {
  const seite = blatt(lies("index.html"), "dialog-ursachen");
  assert.ok(seite.includes('<h2 tabindex="-1" autofocus>Warum ist meine Katze zu schwer geworden?</h2>'));
  const h3 = [...seite.matchAll(/<h3>([^<]+)<\/h3>/g)].map((m) => m[1]);
  assert.deepEqual(h3, UEBERSCHRIFTEN);
  assert.ok(seite.includes('<button value="abbrechen" class="knopf-haupt">Verstanden</button>'));
  assert.match(lies("app.js"), /case "ursachen-erklaerung":\s*return \$\("dialog-ursachen"\)\.showModal\(\);/);
});

test("„Tipps“: erster Abschnitt „Bevor es losgeht“ mit Verweis, Stichworte = Überschriften der Seite", () => {
  const tipps = blatt(lies("index.html"), "dialog-tipps");
  const aktionen = [...tipps.matchAll(/data-aktion="([^"]+)"/g)].map((m) => m[1]);
  assert.deepEqual(aktionen, ["ursachen-erklaerung", "warum-nicht-ab", "alltag-erklaerung"]);
  assert.ok(tipps.indexOf("<h3>Bevor es losgeht</h3>") < tipps.indexOf("<h3>Wenn die Waage stehen bleibt</h3>"));
  assert.ok(tipps.includes('<button type="button" class="knopf-text" data-aktion="ursachen-erklaerung">Warum ist meine Katze zu schwer geworden?</button>'));
  assert.ok(nurText(tipps).includes("Die Tipps stehen auf drei Seiten"));
  const stichworte = nurText(tipps.slice(tipps.indexOf("<h3>Bevor es losgeht</h3>"), tipps.indexOf("<h3>Wenn die Waage stehen bleibt</h3>")));
  assert.ok(stichworte.includes("Futter steht den ganzen Tag bereit, nach der Kastration, wenig Bewegung, Langeweile und Stress, Krankheiten und Medikamente."));
});

test("Sicherheit: roter Kasten wörtlich wie „Bitte nicht selbst kürzen“ auf „Warum nimmt meine Katze nicht ab?“", () => {
  const html = lies("index.html");
  const nichtAb = blatt(html, "dialog-nicht-ab");
  const vorlage = nurText(nichtAb.match(/<h3>Bitte nicht selbst kürzen<\/h3>\s*<p>([\s\S]*?)<\/p>/)[1]);
  const kasten = blatt(html, "dialog-ursachen").match(/<p class="notfall-hinweis">([\s\S]*?)<\/p>/)?.[1] ?? "";
  assert.equal(nurText(kasten), vorlage);
  assert.ok(nurText(blatt(html, "dialog-ursachen")).includes("Setz ein Medikament nie selbst ab."));
});

test("Verweise statt doppelter Texte: Alltag und „Nicht ab“, beide mit Klick-Fall", () => {
  const seite = blatt(lies("index.html"), "dialog-ursachen");
  const js = lies("app.js");
  const verweise = [...seite.matchAll(/data-aktion="([^"]+)"/g)].map((m) => m[1]);
  assert.deepEqual(verweise, ["alltag-erklaerung", "warum-nicht-ab"]);
  for (const a of verweise) assert.match(js, new RegExp(`case "${a}":`));
});

test("Quellen genannt, keine Mengen, keine Diagnose, keine Gedankenstriche", () => {
  const seite = blatt(lies("index.html"), "dialog-ursachen");
  const quellen = nurText(seite.match(/<p class="leise">Quellen:([\s\S]*?)<\/p>/)?.[1] ?? "");
  for (const q of ["Cornell Feline Health Center", "Larsen 2017", "AAFP/ISFM-Konsens zur Fütterung von Katzen 2018", "Öhlund et al. 2018", "Merck Veterinary Manual"]) {
    assert.ok(quellen.includes(q), q);
  }
  const ohneQuellen = nurText(seite.replace(/<p class="leise">Quellen:[\s\S]*?<\/p>/, ""));
  assert.doesNotMatch(ohneQuellen, /\d/); // keine Zahlen, also auch keine Mengen
  assert.doesNotMatch(ohneQuellen, /depressiv/i);
  assert.doesNotMatch(nurText(seite), /[—–]/);
});

test("Stil: Abstände wie die anderen Erklärseiten", () => {
  const css = lies("styles.css");
  assert.match(css, /#dialog-tipps p, #dialog-fragen p, #dialog-ursachen p \{ margin: 0 0 10px; \}/);
  assert.match(css, /#dialog-tipps h3, #dialog-fragen h3, #dialog-ursachen h3 \{ margin: 4px 0 0; font-size: 1\.0625rem; \}/);
  assert.match(css, /#dialog-fragen \.notfall-hinweis, #dialog-ursachen \.notfall-hinweis \{ margin: 0 0 12px; \}/);
});
