import { test } from "node:test";
import assert from "node:assert/strict";
import { leseAnzeige, merkeAnzeige, aufgeloest } from "../js/anzeige.js";

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
