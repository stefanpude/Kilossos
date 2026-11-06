// 0.54.0: Beim Nachtragen einer Mahlzeit für einen anderen Tag ist die Uhrzeit leer statt „jetzt“.
// Grund (Prüfer-Fund 0.53.0): Mehrere Fütterungen eines Tages, auf einmal nachgetragen, lagen 1–2 Minuten auseinander
// und zählten in der Übersicht für den Tierarzt als eine Mahlzeit (Plan .planning/mahlzeiten-pro-tag.md).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { uhrzeitVorbelegung } from "../js/nachtragen.js";

const lies = (datei) => readFileSync(new URL(`../${datei}`, import.meta.url), "utf8");
const abschnitt = (quelle, anfang, ende) => {
  const a = quelle.indexOf(anfang);
  assert.ok(a >= 0, `nicht gefunden: ${anfang}`);
  return quelle.slice(a, quelle.indexOf(ende, a + anfang.length));
};

const FEHLER = "Bitte die Uhrzeit der Fütterung eintragen.";
const tippFuer = (datum) =>
  `Du trägst für den ${datum} nach: Bitte die Uhrzeit der Fütterung eintragen. Nur so zählt die Übersicht für den Tierarzt die Mahlzeiten richtig.`;

// 0.54.1: Verhalten als reine Funktion, mit festen Daten geprüft (Vorschlag des Prüfers zu 0.54.0).
// Monate in new Date(j, m, t) zählen ab 0: 10 = November.
test("uhrzeitVorbelegung: neue Mahlzeit heute → Uhrzeit jetzt, kein Hinweis", () => {
  const jetzt = new Date(2026, 10, 6, 18, 30);
  assert.deepEqual(uhrzeitVorbelegung({ gewaehlterTag: new Date(2026, 10, 6, 9, 0), jetzt }), { uhrzeit: "18:30", tipp: null });
});

test("uhrzeitVorbelegung: Stunden und Minuten zweistellig", () => {
  const jetzt = new Date(2026, 10, 6, 7, 5);
  assert.equal(uhrzeitVorbelegung({ gewaehlterTag: jetzt, jetzt }).uhrzeit, "07:05");
});

test("uhrzeitVorbelegung: neue Mahlzeit für einen anderen Tag → Uhrzeit leer, Hinweis nennt das Datum", () => {
  const jetzt = new Date(2026, 10, 6, 18, 30);
  assert.deepEqual(uhrzeitVorbelegung({ gewaehlterTag: new Date(2026, 10, 4, 12, 0), jetzt }), {
    uhrzeit: "",
    tipp: tippFuer("4. Nov. 2026"),
  });
});

test("uhrzeitVorbelegung: kurz nach Mitternacht für gestern nachtragen → Hinweis mit gestrigem Datum", () => {
  const jetzt = new Date(2026, 10, 7, 0, 5);
  const ergebnis = uhrzeitVorbelegung({ gewaehlterTag: new Date(2026, 10, 6, 23, 59), jetzt });
  assert.equal(ergebnis.uhrzeit, "");
  assert.equal(ergebnis.tipp, tippFuer("6. Nov. 2026"));
});

test("uhrzeitVorbelegung: über den Jahreswechsel zählt der Kalendertag, nicht nur Tag und Monat", () => {
  const jetzt = new Date(2027, 0, 1, 8, 0);
  assert.equal(uhrzeitVorbelegung({ gewaehlterTag: new Date(2026, 0, 1, 8, 0), jetzt }).tipp, tippFuer("1. Jan. 2026"));
});

test("uhrzeitVorbelegung: Mahlzeit ändern → ihre gespeicherte Uhrzeit, kein Hinweis (heute und an anderen Tagen)", () => {
  const jetzt = new Date(2026, 10, 6, 18, 30);
  const alt = { zeitpunkt: new Date(2026, 10, 4, 6, 45).toISOString() };
  assert.deepEqual(uhrzeitVorbelegung({ mahlzeit: alt, gewaehlterTag: new Date(2026, 10, 4), jetzt }), { uhrzeit: "06:45", tipp: null });
  const heute = { zeitpunkt: new Date(2026, 10, 6, 12, 10).toISOString() };
  assert.deepEqual(uhrzeitVorbelegung({ mahlzeit: heute, gewaehlterTag: jetzt, jetzt }), { uhrzeit: "12:10", tipp: null });
});

test("index.html: Hinweis zum Nachtragen unter der Uhrzeit, anfangs versteckt und leer (Text kommt mit Datum aus app.js)", () => {
  const form = abschnitt(lies("index.html"), '<form method="dialog" id="form-mahlzeit">', "</form>");
  assert.match(form, /<input name="uhrzeit" type="time" required>/);
  assert.ok(form.includes('<p class="tipp" id="uhrzeit-tipp" hidden></p>'));
  assert.ok(form.indexOf('id="uhrzeit-tipp"') > form.indexOf('name="uhrzeit"'));
  assert.ok(form.indexOf('id="uhrzeit-tipp"') < form.indexOf('id="gramm-label"'));
});

test("oeffneMahlzeit: nutzt uhrzeitVorbelegung, Hinweis nur sichtbar, wenn es einen gibt", () => {
  const app = lies("app.js");
  assert.match(app, /import \{ uhrzeitVorbelegung \} from "\.\/js\/nachtragen\.js";/);
  const block = abschnitt(app, "function oeffneMahlzeit(", "\n}\n");
  assert.match(block, /const \{ uhrzeit, tipp \} = uhrzeitVorbelegung\(\{ mahlzeit, gewaehlterTag, jetzt: new Date\(\) \}\);/);
  assert.match(block, /form\.uhrzeit\.value = uhrzeit;/);
  assert.match(block, /\$\("uhrzeit-tipp"\)\.textContent = tipp \?\? "";/);
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
