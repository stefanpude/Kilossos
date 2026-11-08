// 0.85.0 (Stefan 07.11., Karte „wiegetag-ort“, gebaut 08.11.): Der Wiegetag ist eine Gewohnheit je Tier, keine
// App-Einstellung. Er steht jetzt auf der Seite „Gewicht“ statt unter „Mehr“ → „Wiegen“, und beim Anlegen eines
// weiteren Tiers fragt das Fenster „Neues Tier“ ihn mit ab (bisher wurde ein zweites Tier nie danach gefragt).
// Beim Bearbeiten eines Tiers bleibt das Feld versteckt, damit es nur eine Stelle zum Ändern gibt.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { wiegetagAusAuswahl } from "../js/profil.js";

const lies = (datei) => readFileSync(new URL(`../${datei}`, import.meta.url), "utf8");
// Kommentare (sie erklären den Umzug und nennen dabei „Mehr“) zählen nicht als Text der App.
const html = lies("index.html").replace(/<!--[\s\S]*?-->/g, "");
const js = lies("app.js");
const ansicht = (name) => {
  const a = html.indexOf(`<section class="ansicht" data-ansicht="${name}"`);
  return html.slice(a, html.indexOf("</section>", a));
};

test("0.85.0: Wiegetag steht auf der Seite „Gewicht“ zwischen Gewicht-Karte und Monaten, mit Tipp darunter", () => {
  const g = ansicht("gewicht");
  const zeile = g.indexOf('<div class="eintrag eintrag-auswahl">');
  assert.ok(zeile > g.indexOf('id="gewicht-trend"'), "nach der Gewicht-Karte");
  assert.ok(zeile < g.indexOf('id="gewicht-monate"'), "vor den Monaten");
  assert.match(g, /<div class="liste">\s*<div class="eintrag eintrag-auswahl">\s*<span data-symbol="waage"><\/span><span class="text"><span id="label-wiegetag">Wiegetag<\/span><small id="wiegetag-tier" hidden><\/small><\/span>\s*<div id="wiegetag-feld"><\/div>/);
  assert.ok(
    g.includes("<p class=\"tipp\">Am besten 1× pro Woche wiegen: gleicher Wochentag, gleiche Uhrzeit, gleiche Waage. Am Wiegetag erinnert „Heute“ daran, am letzten Wiegetag im Monat auch an das Monatsfoto.</p>"),
  );
  // Den alten kurzen Tipp gibt es nicht mehr doppelt
  assert.equal(g.split("Am besten 1× pro Woche wiegen").length, 2);
});

// 0.86.1 (Stefan 08.11.): Mit einem Jahr Daten lag „Gewicht eintragen“ unter der Monatsliste weit unten.
// Der Knopf steht jetzt direkt unter der Gewicht-Karte, über dem Wiegetag, und nur einmal auf der Seite.
test("0.86.1: „Gewicht eintragen“ steht direkt unter der Gewicht-Karte, vor Wiegetag und Monaten", () => {
  const g = ansicht("gewicht");
  const knopf = g.indexOf('data-aktion="gewicht-neu"');
  assert.ok(knopf > g.indexOf('id="gewicht-trend"'), "nach der Gewicht-Karte");
  assert.ok(knopf < g.indexOf('<div class="eintrag eintrag-auswahl">'), "vor dem Wiegetag");
  assert.ok(knopf < g.indexOf('id="gewicht-monate"'), "vor den Monaten");
  assert.equal(g.split('data-aktion="gewicht-neu"').length, 2, "nur ein Knopf auf der Seite");
});

test("0.85.0: unter „Mehr“ gibt es keinen Wiegetag mehr", () => {
  const m = ansicht("mehr");
  assert.doesNotMatch(m, /wiegetag|Wiegen<\/h3>|Wochentag/i);
  // Feld, Beschriftung und Tiername gibt es in der ganzen Seite nur einmal
  for (const id of ['id="wiegetag-feld"', 'id="label-wiegetag"', 'id="wiegetag-tier"']) {
    assert.equal(html.split(id).length, 2, id);
  }
});

test("0.85.0: Fenster „Neues Tier“ fragt den Wiegetag freiwillig ab, beim Bearbeiten versteckt", () => {
  const a = html.indexOf('<dialog id="dialog-profil">');
  const profil = html.slice(a, html.indexOf("</dialog>", a));
  assert.match(profil, /<div class="feld" id="profil-wiegetag-bereich" hidden><span id="label-profil-wiegetag">Wiegetag \(freiwillig\)<\/span><div id="profil-wiegetag"><\/div><\/div>/);
  // direkt nach Geschlecht/Kastriert, wie in der Einrichtung
  assert.ok(profil.indexOf("profil-wiegetag-bereich") > profil.indexOf('id="profil-kastriert"'));
  assert.ok(profil.indexOf("profil-wiegetag-bereich") < profil.indexOf('name="geburtsdatum"'));

  // .feld hat display: grid; ohne eigene [hidden]-Regel bliebe das Feld beim Bearbeiten sichtbar (im Browser gefunden).
  assert.match(lies("styles.css"), /#profil-wiegetag-bereich\[hidden\] \{ display: none; \}/);

  const oeffnen = js.slice(js.indexOf("function oeffneProfil("), js.indexOf('beimSpeichern("form-profil"'));
  assert.ok(oeffnen.includes('$("profil-wiegetag-bereich").hidden = Boolean(einTier);'));
  assert.ok(oeffnen.includes('name: "profil-wiegetag",'));
  assert.ok(oeffnen.includes('beschriftung: "label-profil-wiegetag",'));

  const speichern = js.slice(js.indexOf('beimSpeichern("form-profil"'), js.indexOf("daten.tiere.push(ziel);"));
  assert.ok(speichern.includes('if (!bearbeitetesTier) setze("wiegetag", wiegetagAusAuswahl(werte.get("profil-wiegetag")));'));
});

test("0.85.0: wiegetagAusAuswahl macht aus dem Auswahlwert 0–6 oder null", () => {
  assert.equal(wiegetagAusAuswahl("1"), 1);
  assert.equal(wiegetagAusAuswahl("0"), 0); // Sonntag
  assert.equal(wiegetagAusAuswahl("6"), 6);
  assert.equal(wiegetagAusAuswahl(""), null); // „Kein fester Tag“
  assert.equal(wiegetagAusAuswahl(null), null);
  assert.equal(wiegetagAusAuswahl("7"), null);
  assert.equal(wiegetagAusAuswahl("1.5"), null);
  assert.equal(wiegetagAusAuswahl("abc"), null);
});

test("0.85.0: kein Text schickt mehr für den Wiegetag unter „Mehr“", () => {
  assert.doesNotMatch(html, /Wiegetag[^<]{0,40}unter „Mehr“|unter „Mehr“[^<]{0,40}Wiegetag/);
  assert.ok(html.includes("Tipp: Lege unter „Gewicht“ einen Wiegetag fest. Am letzten Wiegetag im Monat fragt die App dann nach dem Foto."));
  assert.match(html, /Den Tag stellst du unter „Gewicht“\s+bei „Wiegetag“ ein, dann erinnert dich „Heute“ daran\./);
  assert.ok(html.includes("am gleichen Wochentag („Wiegetag“ unter „Gewicht“)"));
});
