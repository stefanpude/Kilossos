// 0.58.0: Seite „Häufige Fragen“ unter „Wissen“ (Ideen-Tafel „Tipps & Tricks, FAQ“, Stefan 06.11.2026: Weg B).
// Kurze Antworten zur App selbst. Fachliches steht auf den Erklärseiten: Hier wird nur darauf verwiesen,
// damit kein Ratschlag und keine Grenze in zwei Fassungen auseinanderläuft.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const lies = (datei) => readFileSync(new URL(`../${datei}`, import.meta.url), "utf8");
const blatt = (html, id) => html.match(new RegExp(`<dialog id="${id}">([\\s\\S]*?)</dialog>`))?.[1] ?? "";
const nurText = (html) => html.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ");

test("Eintrag unter „Wissen“ direkt nach „Tipps fürs Abnehmen“, öffnet die Seite", () => {
  const html = lies("index.html");
  const wissen = html.slice(html.indexOf('<h3 class="gruppe-titel">Wissen</h3>'), html.indexOf('<h3 class="gruppe-titel">Einstellungen</h3>'));
  const aktionen = [...wissen.matchAll(/data-aktion="([^"]+)"/g)].map((m) => m[1]);
  assert.deepEqual(aktionen.slice(0, 3), ["anleitung-erklaerung", "tipps-erklaerung", "fragen-erklaerung"]);
  assert.ok(wissen.includes('<span class="text">Häufige Fragen</span>'));
  assert.ok(lies("app.js").includes('case "fragen-erklaerung":\n      return $("dialog-fragen").showModal();'));
});

test("Seite: Überschrift mit Fokus, jede Frage als h3, Knopf „Verstanden“", () => {
  const seite = blatt(lies("index.html"), "dialog-fragen");
  assert.ok(seite.includes('<h2 tabindex="-1" autofocus>Häufige Fragen</h2>'));
  const fragen = [...seite.matchAll(/<h3>([^<]+)<\/h3>/g)].map((m) => m[1]);
  assert.ok(fragen.length >= 8, `nur ${fragen.length} Fragen`);
  for (const f of fragen) assert.ok(f.endsWith("?"), f);
  assert.ok(seite.includes('<button value="abbrechen" class="knopf-haupt">Verstanden</button>'));
});

test("Jeder Verweis führt zu einer Seite, die es gibt", () => {
  const html = lies("index.html");
  const js = lies("app.js");
  const seite = blatt(html, "dialog-fragen");
  const verweise = [...seite.matchAll(/data-aktion="([^"]+)"/g)].map((m) => m[1]);
  assert.ok(verweise.length >= 5);
  for (const aktion of verweise) {
    const fall = js.match(new RegExp(`case "${aktion}":\\s*return \\$\\("([^"]+)"\\)\\.showModal\\(\\);`));
    assert.ok(fall, `kein Klick-Fall für ${aktion}`);
    assert.ok(html.includes(`<dialog id="${fall[1]}">`), `kein Blatt ${fall[1]}`);
  }
  assert.ok(seite.includes('href="datenschutz.html"'));
});

test("Sicherheit: Notfallsatz wörtlich wie in der Anleitung, im roten Kasten", () => {
  const html = lies("index.html");
  const satz = "Frisst deine Katze einen Tag oder länger gar nicht, gehört sie sofort zum Tierarzt.";
  assert.ok(nurText(blatt(html, "dialog-anleitung")).includes(satz));
  const kasten = blatt(html, "dialog-fragen").match(/<p class="notfall-hinweis">([\s\S]*?)<\/p>/)?.[1] ?? "";
  assert.ok(nurText(kasten).includes(satz));
});

test("Antworten nennen nur, was die App wirklich hat", () => {
  const html = lies("index.html");
  const text = nurText(blatt(html, "dialog-fragen"));
  for (const knopf of ["Sicherung speichern", "Sicherung einlesen", "Freigabe eintragen", "Tier hinzufügen"]) {
    assert.ok(text.includes(`„${knopf}“`), knopf);
    assert.ok(nurText(html.replace(blatt(html, "dialog-fragen"), "")).includes(knopf), `${knopf} fehlt in der App`);
  }
  assert.doesNotMatch(text, /\d+\s*(g|kcal|%)/); // Mengen und Grenzen nur auf den Erklärseiten
  assert.doesNotMatch(text, /[—–]/);
});
