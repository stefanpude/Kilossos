// 0.54.0: Beim Nachtragen einer Mahlzeit für einen anderen Tag ist die Uhrzeit leer statt „jetzt“.
// Grund (Prüfer-Fund 0.53.0): Mehrere Fütterungen eines Tages, auf einmal nachgetragen, lagen 1–2 Minuten auseinander
// und zählten in der Übersicht für den Tierarzt als eine Mahlzeit (Plan .planning/mahlzeiten-pro-tag.md).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const lies = (datei) => readFileSync(new URL(`../${datei}`, import.meta.url), "utf8");
const abschnitt = (quelle, anfang, ende) => {
  const a = quelle.indexOf(anfang);
  assert.ok(a >= 0, `nicht gefunden: ${anfang}`);
  return quelle.slice(a, quelle.indexOf(ende, a + anfang.length));
};

const TIPP = "Du trägst für einen anderen Tag nach: Bitte die Uhrzeit der Fütterung eintragen. Nur so zählt die Übersicht für den Tierarzt die Mahlzeiten richtig.";
const FEHLER = "Bitte die Uhrzeit der Fütterung eintragen.";

test("index.html: Hinweis zum Nachtragen unter der Uhrzeit, anfangs versteckt", () => {
  const form = abschnitt(lies("index.html"), '<form method="dialog" id="form-mahlzeit">', "</form>");
  assert.match(form, /<input name="uhrzeit" type="time" required>/);
  assert.ok(form.includes(`<p class="tipp" id="uhrzeit-tipp" hidden>${TIPP}</p>`));
  assert.ok(form.indexOf('id="uhrzeit-tipp"') > form.indexOf('name="uhrzeit"'));
  assert.ok(form.indexOf('id="uhrzeit-tipp"') < form.indexOf('id="gramm-label"'));
});

test("oeffneMahlzeit: Uhrzeit leer nur bei neuer Mahlzeit für einen anderen Tag als heute", () => {
  const block = abschnitt(lies("app.js"), "function oeffneMahlzeit(", "\n}\n");
  assert.match(block, /const nachtragen = !mahlzeit && tagSchluessel\(gewaehlterTag\) !== tagSchluessel\(new Date\(\)\);/);
  assert.match(block, /form\.uhrzeit\.value = nachtragen \? "" :/);
  assert.match(block, /\$\("uhrzeit-tipp"\)\.hidden = !nachtragen;/);
  // Vorlesefunktion liest den Hinweis nur, wenn er sichtbar ist.
  assert.match(block, /setAttribute\("aria-describedby", "uhrzeit-tipp mahlzeit-fehler"\)/);
  assert.match(block, /removeAttribute\("aria-describedby"\)/);
});

// Prüfer-Fund 0.54.0: Tab über Mitternacht sichtbar → vor einer neuen Mahlzeit erst auf den neuen Tag springen.
test("oeffneMahlzeit: neue Mahlzeit holt einen Tageswechsel nach, Ändern nicht", () => {
  const app = lies("app.js");
  const block = abschnitt(app, "function oeffneMahlzeit(", "\n}\n");
  assert.match(block, /^function oeffneMahlzeit\(mahlzeit = null\) \{\n  if \(!mahlzeit\) tagwechselNachholen\(\);/);
  const nachholen = abschnitt(app, "function tagwechselNachholen()", "\n}\n");
  assert.match(nachholen, /if \(jetzt === tagBeimZeichnen\) return;/);
  // Nur wer auf dem damaligen „Heute“ stand, springt mit; ein bewusst zurückgeblätterter Tag bleibt.
  assert.match(nachholen, /if \(tagSchluessel\(gewaehlterTag\) === tagBeimZeichnen\) gewaehlterTag = new Date\(\);/);
  assert.match(nachholen, /tagBeimZeichnen = jetzt;/);
  assert.match(nachholen, /zeichneAlles\(\);/);
});

test("Speichern ohne Uhrzeit: eigene Meldung und Fokus ins Feld, vor der Mengenprüfung", () => {
  const block = abschnitt(lies("app.js"), 'beimSpeichern("form-mahlzeit"', "\n});\n");
  const pruefung = block.indexOf('if (!werte.get("uhrzeit"))');
  assert.ok(pruefung > 0);
  assert.ok(block.includes(`return "${FEHLER}";`));
  assert.ok(pruefung < block.indexOf("const gramm = leseZahl"));
  assert.match(block.slice(pruefung, pruefung + 200), /\$\("form-mahlzeit"\)\.uhrzeit\.focus\(\)/);
});
