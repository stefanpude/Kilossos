// Erklärseite „Was hilft einer schweren Katze im Alltag?“ (0.48.0, Ideen-Tafel „Tipps schwere Katze“).
// Belege: International Cat Care, Cornell, VCA, Scarlett & Donoghue 1998, Dantas 2016 (Recherche und Faktencheck 06.11.2026).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const lies = (datei) => readFileSync(new URL(`../${datei}`, import.meta.url), "utf8");
const blatt = (html, id) => html.match(new RegExp(`<dialog id="${id}">([\\s\\S]*?)</dialog>`))?.[1] ?? "";
const nurText = (html) => html.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ");

// Seit 0.60.0 nicht mehr direkt unter „Wissen“, sondern über „Tipps fürs Abnehmen“ erreichbar.
test("Verweis in „Tipps fürs Abnehmen“ nach „Warum nimmt meine Katze nicht ab?“, öffnet die Seite", () => {
  const html = lies("index.html");
  const tipps = blatt(html, "dialog-tipps");
  assert.ok(tipps.indexOf('data-aktion="warum-nicht-ab"') < tipps.indexOf('data-aktion="alltag-erklaerung"'));
  assert.ok(tipps.includes('data-aktion="alltag-erklaerung">Was hilft einer schweren Katze im Alltag?</button>'));
  assert.ok(lies("app.js").includes('case "alltag-erklaerung":\n      return $("dialog-alltag").showModal();'));
});

test("Seite: Überschrift mit Fokus, alle Abschnitte, Knopf „Verstanden“", () => {
  const seite = blatt(lies("index.html"), "dialog-alltag");
  assert.ok(seite.includes('<h2 tabindex="-1" autofocus>Was hilft einer schweren Katze im Alltag?</h2>'));
  for (const h3 of ["Stufen an die Lieblingsplätze", "Eine bequeme Toilette", "Hilfe bei der Fellpflege", "Bewegung in kleinen Portionen", "Richtig hochheben", "Wann zum Tierarzt?"]) {
    assert.ok(seite.includes(`<h3>${h3}</h3>`), h3);
  }
  assert.ok(seite.includes('<button value="abbrechen" class="knopf-haupt">Verstanden</button>'));
});

test("Sicherheit: Notfallsatz unverändert im roten Kasten, „ersetzt keinen Tierarzt“, keine Futtermengen", () => {
  const seite = blatt(lies("index.html"), "dialog-alltag");
  const kasten = seite.match(/<p class="notfall-hinweis">([\s\S]*?)<\/p>/)?.[1] ?? "";
  assert.ok(nurText(kasten).includes("Frisst eine Katze einen Tag oder länger gar nicht, gehört sie sofort zum Tierarzt."));
  const text = nurText(seite);
  assert.ok(text.includes("ersetzen aber keinen Tierarzt"));
  assert.doesNotMatch(text, /\d+\s*(g|kcal)\b/);
  assert.doesNotMatch(text, /[—–]/);
});

// 0.66.0 (Ideen-Tafel achxdhkktk0axucplfmn, Einwand von Nadja, Stefan 06.11. „mach das“): Abschnitt „Genug Wasser“
// direkt vor dem roten Kasten. Belegt: Nassfutter bringt mehr Wasser (Kosmal 2025), Katzen mit Fettleber kommen oft
// ausgetrocknet (Webb 2018), Austrocknung senkt die Durchblutung der Nieren (Merck), bei kranken Nieren schlimmer (Kosmal).
// Keine Trinkmenge, kein Trinkbrunnen-Rat ohne Beleg; den Weg zu mehr Wasser legt die Praxis fest.
test("0.66.0: Abschnitt „Genug Wasser“ vor dem roten Kasten, mit Quellen, ohne Mengen", () => {
  const seite = blatt(lies("index.html"), "dialog-alltag");
  const wasser = seite.indexOf("<h3>Genug Wasser</h3>");
  assert.ok(wasser > 0, "Abschnitt fehlt");
  assert.ok(wasser < seite.indexOf('<p class="notfall-hinweis">'), "steht vor dem roten Kasten");
  assert.ok(wasser > seite.indexOf("<h3>Bewegung in kleinen Portionen</h3>"));
  const text = nurText(seite);
  assert.ok(text.includes("Katzen mit Nassfutter nehmen insgesamt mehr Wasser auf als mit Trockenfutter"));
  assert.ok(text.includes("Bekommt deine Katze zum Abnehmen weniger Futter, bekommt sie damit auch weniger Wasser."));
  assert.ok(text.includes("belastet das neben der Leber auch die Nieren"));
  assert.ok(text.includes("ob die Nierenwerte vorher bestimmt werden sollen"));
  assert.ok(text.includes("wiege das Futter, bevor du das Wasser dazugibst"));
  for (const q of ["Kosmal et al. 2025", "Webb 2018", "Merck Veterinary Manual"]) assert.ok(text.includes(q), q);
  assert.doesNotMatch(text, /\d+\s*(ml|Milliliter|Liter)\b/);
});

test("Belegte Aussagen so wie im Faktencheck: 4,9-mal, Springen erleichtern statt verbieten, Napf nicht höher", () => {
  const text = nurText(blatt(lies("index.html"), "dialog-alltag"));
  assert.ok(text.includes("4,9-mal so oft eine Lahmheit, die tierärztlich behandelt werden musste"));
  assert.ok(text.includes("Ist sie fit, darf sie weiter springen und klettern"));
  assert.ok(text.includes("(nicht höher)"));
  assert.ok(text.includes("mindestens anderthalbmal so lang"));
  assert.ok(text.includes("Gib ihr nie Schmerzmittel für Menschen"));
  assert.ok(text.includes("Quellen: International Cat Care"));
});
