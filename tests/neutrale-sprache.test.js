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
// 0.90.1 (Stefan, 10.11.): Erlaubt ist die Doppelform in der Anrede, z. B. „deiner Tierärztin oder deinem Tierarzt“.
// Sie ersetzt einzelne „Tierarztpraxis“, damit das Wort nicht drei-, viermal hintereinander steht.
const ohneDoppelform = (text) => text.replace(/Tierärztin\s+oder\s+(?:dein|deinem|deinen|der|dem|den|ein|einem|einen)?\s*Tierarzt(?![a-zäöüß-])/g, "");

const SEITEN = ["index.html", "datenschutz.html", "nutzungsbedingungen.html"];
const SKRIPTE = ["app.js", ...fs.readdirSync(new URL("../js/", import.meta.url)).map((d) => "js/" + d)];

test("0.79.0: Seiten sprechen nicht von „der Tierarzt“ oder „Tierärzten“", () => {
  for (const datei of SEITEN) {
    const text = ohneDoppelform(ohneHtmlKommentare(lies(datei)));
    assert.doesNotMatch(text, MAENNLICH, datei);
    assert.doesNotMatch(text, PLURAL, datei);
  }
});

test("0.79.0: Texte in den Skripten sprechen nicht von „der Tierarzt“", () => {
  for (const datei of SKRIPTE) {
    const text = ohneDoppelform(ohneJsKommentare(lies(datei)));
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

// 0.90.1 (Stefan, 10.11.): In Punkt 1 stand „Tierarztpraxis“ viermal in Überschrift und drei Sätzen.
// Jetzt abwechselnd; nur der Notfallsatz behält das Wort (überall wortgleich).
test("0.90.1: Punkt 1 der Nutzungsbedingungen wechselt die Bezeichnungen ab", () => {
  const nb = ohneHtmlKommentare(lies("nutzungsbedingungen.html"));
  const punkt1 = nb.slice(nb.indexOf("<h3>1."), nb.indexOf("<h3>2."));
  assert.match(punkt1, /<h3>1\. Was Kilossos nicht ersetzt<\/h3>/);
  assert.match(punkt1, /Zielgewicht und Tagesmenge legt\s+immer die Praxis fest, die deine Katze behandelt\./);
  assert.match(punkt1, /Sprich mit deiner Tierärztin oder deinem Tierarzt\./);
  assert.match(punkt1, /<strong>Die App ersetzt keine tierärztliche Untersuchung und ist kein Medizinprodukt\.<\/strong>/);
  assert.equal(punkt1.split("Tierarztpraxis").length - 1, 1, "nur im Notfallsatz");
});

// 0.90.2 (Stefan, 10.11.): Drei weitere Absätze in index.html nannten „Tierarztpraxis“ zweimal.
test("0.90.2: Profil-Tipp, MCS-Erklärung und Anleitung nennen „Tierarztpraxis“ nur einmal", () => {
  const html = ohneHtmlKommentare(lies("index.html"));
  const absatz = (anfang) => {
    const start = html.indexOf(anfang);
    assert.ok(start >= 0, anfang);
    return html.slice(html.lastIndexOf("<p", start), html.indexOf("</p>", start));
  };
  const zaehle = (text) => text.split("Tierarztpraxis").length - 1;
  assert.match(html, /<p class="tipp">Hilft beim Festlegen des Zielgewichts\. Das Zielgewicht selbst legt nur die Tierarztpraxis fest\.<\/p>/);
  assert.match(html, /Deshalb prüft die Praxis beides bei jeder Kontrolle\./);
  assert.match(html, /Die Übersicht zeigt der Praxis dann, was deine/);
  for (const anfang of ["Hilft beim Festlegen", "Muscle Condition Score (MCS)", "Lass deine Katze untersuchen"]) {
    assert.equal(zaehle(absatz(anfang)), 1, anfang);
  }
});

test("0.90.1: Die Doppelform ist erlaubt, „deinem Tierarzt“ allein nicht", () => {
  assert.doesNotMatch(ohneDoppelform("Sprich mit deiner Tierärztin oder deinem Tierarzt."), MAENNLICH);
  assert.match(ohneDoppelform("Sprich mit deinem Tierarzt."), MAENNLICH);
});
