// 0.62.0: Erklärseite „Warum ist meine Katze zu schwer geworden?“ (Ideen-Tafel h1b2wfe9s8hy5ksjrkhm, Stefan 06.11.2026:
// „setzen wir jetzt schon um“, Text mit Stefans Ja; Plan und Quellen in .planning/ursachen-seite.md).
// Seit 0.63.0 erreichbar über „Mehr“ → „Wissen“, ganz oben (vorher „Tipps“ → „Bevor es losgeht“).
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

// 0.63.0 (Stefan 06.11.): Die Seite steht unter „Wissen“ ganz oben, „Tipps“ hat nur noch zwei Abschnitte.
test("0.63.0: Eintrag ganz oben unter „Wissen“, „Tipps“ ohne „Bevor es losgeht“", () => {
  const html = lies("index.html");
  const wissen = html.slice(html.indexOf('<h3 class="gruppe-titel">Wissen</h3>'), html.indexOf('<h3 class="gruppe-titel">Wiegen</h3>'));
  const aktionen = [...wissen.matchAll(/data-aktion="([^"]+)"/g)].map((m) => m[1]);
  assert.equal(aktionen[0], "ursachen-erklaerung");
  const tipps = blatt(html, "dialog-tipps");
  // 0.73.0: dritter Abschnitt „Richtig wiegen“ (tests/wiegen.test.js)
  assert.deepEqual([...tipps.matchAll(/data-aktion="([^"]+)"/g)].map((m) => m[1]), ["warum-nicht-ab", "alltag-erklaerung", "wiegen-erklaerung"]);
  assert.ok(!tipps.includes("Bevor es losgeht"));
  assert.ok(nurText(tipps).includes("Die Tipps stehen auf drei Seiten"));
});

test("Sicherheit: roter Kasten wörtlich wie „Bitte nicht selbst kürzen“ auf „Warum nimmt meine Katze nicht ab?“", () => {
  const html = lies("index.html");
  const nichtAb = blatt(html, "dialog-nicht-ab");
  const vorlage = nurText(nichtAb.match(/<h3>Bitte nicht selbst kürzen<\/h3>\s*<p>([\s\S]*?)<\/p>/)[1]);
  const kasten = blatt(html, "dialog-ursachen").match(/<p class="notfall-hinweis">([\s\S]*?)<\/p>/)?.[1] ?? "";
  assert.equal(nurText(kasten), vorlage);
  assert.ok(nurText(blatt(html, "dialog-ursachen")).includes("Setz ein Medikament nie selbst ab."));
});

// 0.62.1 (Stefan 06.11.2026): Alltag und „Nicht ab“ stehen auf „Tipps“ direkt unter „Bevor es losgeht“ als eigene
// Punkte. Die Seite öffnet nur über „Tipps“, nach „Verstanden“ ist man dort zurück. Darum keine Links mehr auf der
// Seite, nur ein Schlusssatz, der die Abschnitte auf „Tipps“ beim Namen nennt.
// 0.63.0: Die Seite öffnet jetzt über „Wissen“, der Schlusssatz nennt deshalb den Eintrag „Tipps fürs Abnehmen“.
test("0.62.1/0.63.0: keine Links auf der Seite, Schlusssatz nennt „Tipps fürs Abnehmen“", () => {
  const html = lies("index.html");
  const seite = blatt(html, "dialog-ursachen");
  assert.doesNotMatch(seite, /data-aktion=/);
  assert.doesNotMatch(seite, /<a /);
  const text = nurText(seite);
  assert.ok(!text.includes("Ideen für mehr Bewegung"));
  assert.ok(text.includes("ungenaues Abmessen: So kommt leicht mehr zusammen, als man denkt."));
  const schluss = "Wie es weitergeht, steht unter „Tipps fürs Abnehmen“.";
  assert.ok(text.includes(schluss));
  assert.ok(text.indexOf(schluss) < text.indexOf("Quellen:"));
  assert.ok(!text.includes("auf „Tipps“ unter"));
  const wissen = html.slice(html.indexOf('<h3 class="gruppe-titel">Wissen</h3>'), html.indexOf('<h3 class="gruppe-titel">Wiegen</h3>'));
  assert.ok(wissen.includes('<span class="text">Tipps fürs Abnehmen</span>'));
  assert.ok(lies("app.js").includes('case "ursachen-erklaerung":'));
  const aufrufer = [...html.matchAll(/data-aktion="ursachen-erklaerung"/g)].length;
  assert.equal(aufrufer, 1); // nur über „Wissen“ erreichbar, sonst stimmt der Schlusssatz nicht
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
