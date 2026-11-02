import { test } from "node:test";
import assert from "node:assert/strict";
import { leseAnzeige, merkeAnzeige, aufgeloest } from "../js/anzeige.js";
import { aufklappKarte, merkeZustand, zustandVergessen } from "../js/aufklappen.js";
import { auswahlFeld } from "../js/auswahl.js";

function testSpeicher() {
  const inhalt = new Map();
  return {
    getItem: (schluessel) => (inhalt.has(schluessel) ? inhalt.get(schluessel) : null),
    setItem: (schluessel, wert) => inhalt.set(schluessel, wert),
  };
}

test("Darstellung: Standard hell, Wahl wird gemerkt, Unsinn ergibt hell", () => {
  const speicher = testSpeicher();
  assert.equal(leseAnzeige(speicher), "hell");
  merkeAnzeige("dunkel", speicher);
  assert.equal(leseAnzeige(speicher), "dunkel");
  speicher.setItem("kilossos-anzeige", "blau");
  assert.equal(leseAnzeige(speicher), "hell");
  const gesperrt = { getItem: () => { throw new Error("gesperrt"); } };
  assert.equal(leseAnzeige(gesperrt), "hell");
});

test("Darstellung: „Wie das Handy“ folgt dem Handy", () => {
  assert.equal(aufgeloest("handy", true), "dunkel");
  assert.equal(aufgeloest("handy", false), "hell");
  assert.equal(aufgeloest("hell", true), "hell");
  assert.equal(aufgeloest("dunkel", false), "dunkel");
});

test("aufklappKarte: Standard zu, offen auf Wunsch, gemerkter Zustand gewinnt", () => {
  zustandVergessen();
  assert.match(aufklappKarte({ id: "a", kopf: "K", inhalt: "I" }), /aria-expanded="false"/);
  assert.match(aufklappKarte({ id: "b", kopf: "K", inhalt: "I", offen: true }), /aria-expanded="true"/);
  merkeZustand("b", false);
  assert.match(aufklappKarte({ id: "b", kopf: "K", inhalt: "I", offen: true }), /aria-expanded="false"/);
  merkeZustand("a", true);
  assert.match(aufklappKarte({ id: "a", kopf: "K", inhalt: "I" }), /class="aufklapp offen/);
  assert.match(aufklappKarte({ id: "a", kopf: "K", inhalt: "I" }), /aria-controls="ak-a"/);
  assert.doesNotMatch(aufklappKarte({ id: "a", kopf: "K", inhalt: "I" }), /<button(?![^>]*type="button")/);
});

test("auswahlFeld: eine Option ohne Menü, mehrere mit Menü, nur type=button", () => {
  const eins = auswahlFeld({ name: "futter", optionen: [{ wert: "x", text: "Sheba" }], wert: "x" });
  assert.doesNotMatch(eins, /aria-haspopup/);
  assert.match(eins, /<input type="hidden" name="futter" value="x">/);
  const zwei = auswahlFeld({ name: "typ", optionen: [{ wert: "nass", text: "Nass" }, { wert: "trocken", text: "Trocken" }], wert: "trocken" });
  assert.match(zwei, /aria-haspopup="listbox"/);
  assert.match(zwei, /data-wert="trocken"[^>]*aria-selected="true"|aria-selected="true"[^>]*data-wert="trocken"/);
  assert.doesNotMatch(zwei, /<button(?![^>]*type="button")/);
  const mitExtra = auswahlFeld({ name: "futter", optionen: [{ wert: "x", text: "Sheba" }], extra: [{ text: "＋ Aus der Futterliste wählen", aktion: "liste-oeffnen" }] });
  assert.match(mitExtra, /data-aktion="liste-oeffnen"/);
  assert.match(mitExtra, /aria-haspopup/);
  const leer = auswahlFeld({ name: "typ", optionen: [{ wert: "nass", text: "Nass" }, { wert: "trocken", text: "Trocken" }] });
  assert.match(leer, /value=""/);
  assert.match(leer, /Bitte wählen/);
});

test("auswahlFeld schützt Text vor HTML", () => {
  const feld = auswahlFeld({ name: "f", optionen: [{ wert: "1", text: "<b>x</b>" }, { wert: "2", text: "y" }] });
  assert.doesNotMatch(feld, /<b>x<\/b>/);
  assert.match(feld, /&lt;b&gt;x&lt;\/b&gt;/);
});
