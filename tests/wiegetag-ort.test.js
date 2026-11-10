// 0.85.0 (Stefan 07.11., gebaut 08.11.): Der Wiegetag zog von „Mehr“ → „Wiegen“ auf die Seite „Gewicht“, und das
// Fenster „Neues Tier“ fragt ihn mit ab.
// 0.90.0 (Stefan 10.11.): Den Wiegetag legt man meist einmal fest; auf der Seite „Gewicht“, die man jede Woche
// öffnet, nahm er nur Platz weg. Er steht jetzt im Profil unter „Haltung“, beim Anlegen und beim Bearbeiten.
// Auf „Gewicht“ bleibt nur der Tipp, der auf das Profil zeigt.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { wiegetagAusAuswahl } from "../js/profil.js";

const lies = (datei) => readFileSync(new URL(`../${datei}`, import.meta.url), "utf8");
// Kommentare (sie erklären den Umzug und nennen dabei alte Orte) zählen nicht als Text der App.
const html = lies("index.html").replace(/<!--[\s\S]*?-->/g, "");
const js = lies("app.js");
const ansicht = (name) => {
  const a = html.indexOf(`<section class="ansicht" data-ansicht="${name}"`);
  return html.slice(a, html.indexOf("</section>", a));
};
const profil = (() => {
  const a = html.indexOf('<dialog id="dialog-profil">');
  return html.slice(a, html.indexOf("</dialog>", a));
})();

test("0.90.0: Seite „Gewicht“ hat keine Wiegetag-Auswahl mehr, nur den Tipp mit Verweis aufs Profil", () => {
  const g = ansicht("gewicht");
  assert.doesNotMatch(g, /eintrag-auswahl|wiegetag-feld|label-wiegetag|wiegetag-tier/);
  assert.ok(
    g.includes(
      "<p class=\"tipp\">Am besten 1× pro Woche wiegen: gleicher Wochentag, gleiche Uhrzeit, gleiche Waage. Einen festen Wiegetag stellst du im Profil deiner Katze ein (unter „Mehr“ → „Tiere“), dann erinnert „Heute“ daran.</p>",
    ),
  );
  assert.equal(g.split("Am besten 1× pro Woche wiegen").length, 2);
  // Die Seite-„Gewicht“-Auswahl ist auch im Code weg (sie speicherte sofort mit eigener Meldung).
  assert.ok(!js.includes("function zeichneWiegetag("));
  assert.ok(!js.includes("✓ Wiegetag gespeichert"));
  assert.ok(!js.includes('name !== "wiegetag"'));
});

// 0.86.1 (Stefan 08.11.): Mit einem Jahr Daten lag „Gewicht eintragen“ unter der Monatsliste weit unten.
test("0.86.1: „Gewicht eintragen“ steht direkt unter der Gewicht-Karte, vor Tipp und Monaten", () => {
  const g = ansicht("gewicht");
  const knopf = g.indexOf('data-aktion="gewicht-neu"');
  assert.ok(knopf > g.indexOf('id="gewicht-trend"'), "nach der Gewicht-Karte");
  assert.ok(knopf < g.indexOf("Am besten 1× pro Woche wiegen"), "vor dem Tipp");
  assert.ok(knopf < g.indexOf('id="gewicht-monate"'), "vor den Monaten");
  assert.equal(g.split('data-aktion="gewicht-neu"').length, 2, "nur ein Knopf auf der Seite");
});

test("0.85.0: unter „Mehr“ gibt es keinen Wiegetag", () => {
  assert.doesNotMatch(ansicht("mehr"), /wiegetag|Wiegen<\/h3>|Wochentag/i);
});

test("0.90.0: Profil zeigt den Wiegetag unter „Haltung“, beim Anlegen und beim Bearbeiten", () => {
  assert.match(profil, /<div class="feld" id="profil-wiegetag-bereich"><span id="label-profil-wiegetag">Wiegetag \(optional\)<\/span><div id="profil-wiegetag"><\/div><\/div>/);
  const bereich = profil.indexOf("profil-wiegetag-bereich");
  assert.ok(bereich > profil.indexOf('id="profil-haltung"'), "nach der Haltung");
  assert.ok(bereich < profil.indexOf('name="schlank"'), "vor dem Gewicht in der schlanken Zeit");
  assert.equal(html.split('id="profil-wiegetag"').length, 2, "nur ein Feld");

  const oeffnen = js.slice(js.indexOf("function oeffneProfil("), js.indexOf('beimSpeichern("form-profil"'));
  assert.ok(!oeffnen.includes('$("profil-wiegetag-bereich").hidden'), "nicht mehr beim Bearbeiten versteckt");
  assert.ok(oeffnen.includes('name: "profil-wiegetag",'));
  assert.ok(oeffnen.includes('beschriftung: "label-profil-wiegetag",'));
  assert.ok(oeffnen.includes('wert: Number.isInteger(p.wiegetag) ? String(p.wiegetag) : "",'), "bisheriger Tag vorausgewählt");

  const speichern = js.slice(js.indexOf('beimSpeichern("form-profil"'), js.indexOf("daten.tiere.push(ziel);"));
  assert.ok(speichern.includes('  setze("wiegetag", wiegetagAusAuswahl(werte.get("profil-wiegetag")));'));
  assert.ok(!speichern.includes('if (!bearbeitetesTier) setze("wiegetag"'));
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

test("0.90.0: kein Text schickt für den Wiegetag noch unter „Gewicht“ oder „Mehr“", () => {
  // „unter „Mehr“ → „Tiere““ ist der Weg zum Profil und erlaubt.
  assert.doesNotMatch(html, /Wiegetag[^<]{0,40}unter „Gewicht“|unter „Gewicht“[^<]{0,40}Wiegetag/);
  assert.doesNotMatch(html, /Wiegetag[^<]{0,40}unter „Mehr“(?! → „Tiere“)|unter „Mehr“(?! → „Tiere“)[^<]{0,40}Wiegetag/);
  assert.ok(html.includes("Tipp: Lege im Profil deiner Katze einen Wiegetag fest (unter „Mehr“ → „Tiere“). Am letzten Wiegetag im Monat fragt die App dann nach dem Foto."));
  assert.match(html, /Den Tag stellst du im Profil deiner Katze\s+bei „Wiegetag“ ein \(unter „Mehr“ → „Tiere“\), dann erinnert dich „Heute“ daran\./);
  assert.ok(html.includes("am gleichen Wochentag („Wiegetag“ im Profil deiner Katze)"));
});
