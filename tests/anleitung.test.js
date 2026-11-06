// Erklärseite „So nutzt du Kilossos“ (0.51.0, Ideen-Tafel „kleine Anleitung“). Reine Bedienhilfe: keine Mengen,
// keine Formeln, Zielgewicht und Tagesmenge legt der Tierarzt fest. Jede genannte Stelle muss es in der App geben.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const lies = (datei) => readFileSync(new URL(`../${datei}`, import.meta.url), "utf8");
const blatt = (html, id) => html.match(new RegExp(`<dialog id="${id}">([\\s\\S]*?)</dialog>`))?.[1] ?? "";
const nurText = (html) => html.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ");

test("Eintrag unter „Wissen“ vor „Tipps“ (seit 0.63.0 an zweiter Stelle), öffnet die Seite", () => {
  const html = lies("index.html");
  const wissen = html.slice(html.indexOf('<h3 class="gruppe-titel">Wissen</h3>'), html.indexOf('<h3 class="gruppe-titel">Einstellungen</h3>'));
  const erster = wissen.indexOf('data-aktion="anleitung-erklaerung"');
  assert.ok(erster >= 0);
  assert.ok(erster < wissen.indexOf('data-aktion="tipps-erklaerung"'));
  assert.ok(wissen.includes('<span class="text">So nutzt du Kilossos</span>'));
  assert.ok(lies("app.js").includes('case "anleitung-erklaerung":\n      return $("dialog-anleitung").showModal();'));
});

const SCHRITTE = [
  "1. Erst zum Tierarzt",
  "2. Futtersorten anlegen",
  "3. Jede Mahlzeit wiegen und eintragen",
  "4. Einmal pro Woche wiegen",
  "5. Besondere Tage festhalten",
  "6. Auf die Hinweise achten",
  "7. Regelmäßig sichern",
  "8. Zum Termin die Übersicht mitnehmen",
];

test("Seite: Überschrift mit Fokus, alle Schritte in Reihenfolge, Knopf „Verstanden“", () => {
  const seite = blatt(lies("index.html"), "dialog-anleitung");
  assert.ok(seite.includes('<h2 tabindex="-1" autofocus>So nutzt du Kilossos</h2>'));
  const stellen = SCHRITTE.map((h3) => seite.indexOf(`<h3>${h3}</h3>`));
  stellen.forEach((i, n) => assert.ok(i >= 0, SCHRITTE[n]));
  assert.deepEqual([...stellen].sort((a, b) => a - b), stellen);
  assert.ok(seite.includes("<h3>Mehrere Katzen</h3>"));
  assert.ok(seite.includes('<button value="abbrechen" class="knopf-haupt">Verstanden</button>'));
});

test("Regeln: Tierarzt legt Ziel und Menge fest, Notfallsatz im roten Kasten, keine Mengen, keine Gedankenstriche", () => {
  const seite = blatt(lies("index.html"), "dialog-anleitung");
  const text = nurText(seite);
  assert.ok(text.includes("Zielgewicht und Tagesmenge legt dein Tierarzt fest"));
  assert.ok(text.includes("Mengen schlägt Kilossos nie selbst vor."));
  const kasten = seite.match(/<p class="notfall-hinweis">([\s\S]*?)<\/p>/)?.[1] ?? "";
  assert.ok(nurText(kasten).includes("Frisst deine Katze einen Tag oder länger gar nicht, gehört sie sofort zum Tierarzt."));
  assert.doesNotMatch(text, /\d+\s*(g|kcal)\b|\d+\s*%/);
  assert.doesNotMatch(text, /RER|Formel/);
  assert.doesNotMatch(text, /[—–]/);
});

test("Jede genannte Stelle gibt es in der App wirklich", () => {
  const html = lies("index.html");
  const text = nurText(blatt(html, "dialog-anleitung"));
  const stellen = {
    "„Freigabe eintragen“": ">Freigabe eintragen<",
    "„Aus der Futterliste wählen“": ">Aus der Futterliste wählen<",
    "„Strichcode scannen“": ">Strichcode scannen<",
    "„Eigene Sorte anlegen“": ">Eigene Sorte anlegen<",
    "„Mahlzeit eintragen“": ">Mahlzeit eintragen<",
    "„Etwas übrig gelassen?“": "Etwas übrig gelassen?<",
    "„Gewicht eintragen“": ">Gewicht eintragen<",
    "„Auf dem Arm gewogen?“": "Auf dem Arm gewogen?<",
    "„Wiegetag“": 'id="label-wiegetag">Wiegetag<',
    "„Besonderen Tag eintragen“": ">Besonderen Tag eintragen<",
    "„Sicherung speichern“": "Sicherung speichern<",
    "„Übersicht öffnen“": '<span class="text">Übersicht öffnen',
    "„Drucken / als PDF speichern“": ">Drucken / als PDF speichern<",
    "„Tier hinzufügen“": ">Tier hinzufügen<",
  };
  for (const [imText, inApp] of Object.entries(stellen)) {
    assert.ok(text.includes(imText), `Anleitung nennt ${imText} nicht`);
    assert.ok(html.includes(inApp), `${imText} gibt es in der App nicht`);
  }
  // Die Art „Leckerli / Snack“ steht im Auswahlfeld, das app.js füllt.
  assert.ok(text.includes("„Leckerli / Snack“"));
  assert.ok(lies("app.js").includes('{ wert: "leckerli", text: "Leckerli / Snack" }'));
});

test("Mehrere Katzen: Einträge gelten für die Katze oben, Futtersorten für alle", () => {
  const text = nurText(blatt(lies("index.html"), "dialog-anleitung"));
  assert.ok(text.includes("gilt für die Katze, die gerade oben steht"));
  assert.ok(text.includes("Jede Katze braucht ihre eigene Freigabe vom Tierarzt."));
  assert.ok(text.includes("Deine Futtersorten gelten für alle Katzen."));
});
