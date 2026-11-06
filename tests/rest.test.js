// Rest zurückwiegen (0.46.0, Ideen-Tafel „rest-zurueckwiegen“, Weg 1 ohne Datenformat-Änderung):
// Im Fenster „Mahlzeit ändern“ den Rest im Napf eintragen, Kilossos zieht ihn ab. Gespeichert wird nur,
// was gefressen wurde; „gegeben“ und „übrig“ werden nicht gespeichert.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { restAbziehen } from "../js/rechnen.js";

const lies = (datei) => readFileSync(new URL(`../${datei}`, import.meta.url), "utf8");

test("restAbziehen: 50 g gegeben, 12 g übrig → 38 g gefressen", () => {
  assert.deepEqual(restAbziehen(50, 12), { gramm: 38 });
});

test("restAbziehen: auf 0,1 g genau, ohne Rundungsfehler", () => {
  assert.deepEqual(restAbziehen(50, 12.3), { gramm: 37.7 });
  assert.deepEqual(restAbziehen(42.5, 0.4), { gramm: 42.1 });
  assert.deepEqual(restAbziehen(0.3, 0.1), { gramm: 0.2 });
});

test("restAbziehen: fehlende Werte", () => {
  assert.match(restAbziehen(null, 12).fehler, /beide/i);
  assert.match(restAbziehen(50, null).fehler, /beide/i);
});

test("restAbziehen: gegebene Menge wie beim Speichern 0,1–1000 g", () => {
  assert.match(restAbziehen(0, 0).fehler, /0,1 und 1000 g/);
  assert.match(restAbziehen(1001, 10).fehler, /0,1 und 1000 g/);
  assert.deepEqual(restAbziehen(1000, 1), { gramm: 999 });
});

test("restAbziehen: Rest 0 ist kein Rest", () => {
  assert.match(restAbziehen(50, 0).fehler, /größer als 0/);
});

test("restAbziehen: Rest größer als gegeben", () => {
  assert.match(restAbziehen(50, 60).fehler, /mehr als gegeben/);
});

test("restAbziehen: alles übrig → nicht als 0 g speichern, sondern Mahlzeit löschen", () => {
  const { fehler } = restAbziehen(50, 50);
  assert.match(fehler, /löschen/);
  assert.match(fehler, /Futter verweigert/);
  // 50 − 49,95 wäre gerundet 0 g: gilt ebenfalls als „alles übrig“.
  assert.match(restAbziehen(50, 49.95).fehler, /löschen/);
});

test("Fenster: Bereich „Etwas übrig gelassen?“ im Mahlzeit-Fenster, Felder ohne name (nie gespeichert)", () => {
  const html = lies("index.html");
  const dialog = html.slice(html.indexOf('<dialog id="dialog-mahlzeit">'), html.indexOf("</dialog>", html.indexOf('<dialog id="dialog-mahlzeit">')));
  const bereich = dialog.slice(dialog.indexOf('<details class="arm rest" id="rest-bereich"'), dialog.indexOf("</details>"));
  assert.ok(bereich.length > 0, "Bereich fehlt");
  assert.match(bereich, /<summary>Etwas übrig gelassen\?/);
  assert.match(bereich, /id="rest-gegeben"/);
  assert.match(bereich, /id="rest-uebrig"/);
  assert.doesNotMatch(bereich, /\sname=/);
  assert.match(bereich, /id="rest-ergebnis" role="status"/);
  assert.match(bereich, /id="rest-fehler"/);
  // Steht nach der kcal-Vorschau und vor dem Fehlertext des Fensters.
  assert.ok(dialog.indexOf('id="mahlzeit-vorschau"') < dialog.indexOf('id="rest-bereich"'));
  assert.ok(dialog.indexOf('id="rest-bereich"') < dialog.indexOf('id="mahlzeit-fehler"'));
});

test("app.js: Bereich nur beim Ändern sichtbar, „gegeben“ aus der gespeicherten Menge", () => {
  const app = lies("app.js");
  const oeffnen = app.slice(app.indexOf("function oeffneMahlzeit("), app.indexOf("function zeigeMahlzeitVorschau("));
  assert.match(oeffnen, /restZuruecksetzen\(mahlzeit\)/);
  const zurueck = app.slice(app.indexOf("function restZuruecksetzen("), app.indexOf("function restRechnen("));
  assert.match(zurueck, /\$\("rest-bereich"\)\.hidden = !mahlzeit/);
  assert.match(zurueck, /\$\("rest-bereich"\)\.open = false/);
  // Enter in den Rest-Feldern speichert nicht (wie im Arm-Bereich).
  assert.match(app, /\$\("rest-bereich"\)\.addEventListener\("keydown"/);
});

test("app.js: Speichern ist gesperrt, solange ein eingetragener Rest nicht abgezogen werden konnte", () => {
  // Sonst würde z. B. bei „alles übrig“ still die volle Menge gespeichert und eine Futterverweigerung verdeckt.
  const app = lies("app.js");
  const speichern = app.slice(app.indexOf('beimSpeichern("form-mahlzeit"'), app.indexOf("// Gewicht eintragen: große Zahl"));
  assert.match(speichern, /restUngeklaert\(\)/);
  assert.match(speichern, /TEXT_REST_OFFEN/);
  assert.match(app, /const TEXT_REST_OFFEN = "Der Rest ist noch nicht abgezogen/);
  // Klappt das Abziehen danach, verschwindet die alte Sperr-Meldung (im Browser gefunden).
  const rechnen = app.slice(app.indexOf("function restRechnen("), app.indexOf("function restUngeklaert("));
  assert.match(rechnen, /\$\("mahlzeit-fehler"\)\.textContent === TEXT_REST_OFFEN\) zeigeFehler\("mahlzeit-fehler", ""\)/);
});

// Prüfer-Funde 06.11. (vor dem Commit):
test("Prüfer 1: „Anfangs gegeben“ wird nicht vorbelegt (sonst doppelt abgezogen beim zweiten Ändern)", () => {
  const html = lies("index.html");
  assert.ok(html.includes("<label>Anfangs gegeben (g)"));
  assert.ok(html.includes("Schon einmal einen Rest abgezogen?"));
  const app = lies("app.js");
  const zurueck = app.slice(app.indexOf("function restZuruecksetzen("), app.indexOf("function restRechnen("));
  assert.ok(zurueck.includes('$("rest-gegeben").value = "";'));
  assert.ok(zurueck.includes('$("rest-gegeben").placeholder = mahlzeit ? `z. B. ${'));
});

test("Prüfer 3: Menge oben von Hand geändert → Rest-Bereich leert „Übrig“ und sagt es", () => {
  const app = lies("app.js");
  assert.ok(app.includes("function restNachHandAenderung() {"));
  assert.ok(app.includes("Menge oben von Hand geändert"));
  const schritt = app.slice(app.indexOf("function grammSchritt("), app.indexOf("function grammSchritt(") + 400);
  assert.ok(schritt.includes("restNachHandAenderung();"));
});

test("Prüfer 4: nur eine Menge ausgefüllt → Meldung beim Verlassen, beim Speichern Fokus ins leere Feld", () => {
  const app = lies("app.js");
  const rechnen = app.slice(app.indexOf("function restRechnen("), app.indexOf("function restUngeklaert("));
  assert.ok(rechnen.includes("Bitte beide Mengen eintragen."));
  const speichern = app.slice(app.indexOf('beimSpeichern("form-mahlzeit"'), app.indexOf("// Gewicht eintragen: große Zahl"));
  assert.ok(speichern.includes(".focus();"));
});
