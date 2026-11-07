// 0.79.0 (Stefan, 07.11.2026): Kito wird von einer Tierärztin behandelt, andere Halter haben vielleicht auch eine.
// Nutzertexte sprechen deshalb neutral von „Tierarztpraxis“, „tierärztlich“ oder „Praxis“, nie von „der Tierarzt“.
// Gespeicherte Schlüssel wie tier.tierarzt bleiben (Datenformat unverändert).
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const lies = (datei) => fs.readFileSync(new URL("../" + datei, import.meta.url), "utf8");
const ohneHtmlKommentare = (text) => text.replace(/<!--[\s\S]*?-->/g, "");
const ohneJsKommentare = (text) => text.split("\n").filter((z) => !z.trim().startsWith("//")).join("\n");

// „Tierarzt“ als ganzes Wort mit Artikel oder Präposition davor, auch über einen Zeilenumbruch.
const MAENNLICH = /\b(der|den|dem|des|dein|deinem|deinen|zum|vom|beim|keinen|einen|einem)\s+Tierarzt(es)?(?![a-zäöüß-])/i;
const PLURAL = /Tierärzte(?![a-zäöüß])|Tierärzteverb/;

const SEITEN = ["index.html", "datenschutz.html", "nutzungsbedingungen.html"];
const SKRIPTE = ["app.js", ...fs.readdirSync(new URL("../js/", import.meta.url)).map((d) => "js/" + d)];

test("0.79.0: Seiten sprechen nicht von „der Tierarzt“ oder „Tierärzten“", () => {
  for (const datei of SEITEN) {
    const text = ohneHtmlKommentare(lies(datei));
    assert.doesNotMatch(text, MAENNLICH, datei);
    assert.doesNotMatch(text, PLURAL, datei);
  }
});

test("0.79.0: Texte in den Skripten sprechen nicht von „der Tierarzt“", () => {
  for (const datei of SKRIPTE) {
    const text = ohneJsKommentare(lies(datei));
    assert.doesNotMatch(text, MAENNLICH, datei);
    assert.doesNotMatch(text, PLURAL, datei);
  }
});

test("0.79.0: neue Bezeichnungen unter „Mehr“, im Freigabe-Fenster und im PDF", () => {
  const html = lies("index.html");
  assert.match(html, /id="titel-tierarzt">Tierarztpraxis</);
  assert.match(html, /<h2 id="freigabe-titel">Tierärztliche Freigabe<\/h2>/);
  assert.match(html, /<h3 class="gruppe-titel">Übersicht für die Praxis<\/h3>/);
  assert.match(lies("js/bericht.js"), /<h1>Kilossos – Übersicht für die Tierarztpraxis<\/h1>/);
});

test("0.79.0: Notfallsatz überall gleich und neutral, auch in den Nutzungsbedingungen", () => {
  const satz = /einen Tag lang nichts oder kaum etwas, gehört sie sofort in die Tierarztpraxis\./;
  assert.match(lies("nutzungsbedingungen.html"), satz);
  assert.doesNotMatch(lies("nutzungsbedingungen.html"), /gar nicht, gehört/);
});
