import { test } from "node:test";
import assert from "node:assert/strict";
import { belegteZeichen, speicherAnzeige, GRENZE_ZEICHEN } from "../js/speicher.js";

// Nachbau von localStorage mit key()/length/getItem.
const speicher = (eintraege) => {
  const schluessel = Object.keys(eintraege);
  return { length: schluessel.length, key: (i) => schluessel[i] ?? null, getItem: (k) => eintraege[k] ?? null };
};

test("belegteZeichen zählt Schlüssel und Werte aller Einträge", () => {
  assert.equal(belegteZeichen(speicher({})), 0);
  assert.equal(belegteZeichen(speicher({ ab: "1234", c: "" })), 7);
});

test("belegteZeichen übersteht einen gesperrten Speicher", () => {
  const kaputt = { get length() { throw new Error("gesperrt"); } };
  assert.equal(belegteZeichen(kaputt), null);
  assert.equal(speicherAnzeige(null), null);
});

test("speicherAnzeige: wenig belegt = ok, Text nur mit Prozent", () => {
  const r = speicherAnzeige(1_200_000);
  assert.equal(r.stufe, "ok");
  assert.equal(r.prozent, 24);
  assert.equal(r.text, "Speicher: etwa 24 % belegt.");
  assert.equal(r.hinweis, "");
});

test("speicherAnzeige: unter 1 % heißt „fast leer“", () => {
  assert.equal(speicherAnzeige(20_000).text, "Speicher: fast leer (unter 1 % belegt).");
  assert.equal(speicherAnzeige(0).text, "Speicher: fast leer (unter 1 % belegt).");
  assert.equal(speicherAnzeige(0).prozent, 0);
  assert.equal(speicherAnzeige(50_000).text, "Speicher: etwa 1 % belegt.");
});

test("speicherAnzeige: ab 70 % knapp, ab 90 % voll, jeweils mit Hinweis", () => {
  assert.equal(speicherAnzeige(GRENZE_ZEICHEN * 0.69).stufe, "ok");
  const knapp = speicherAnzeige(GRENZE_ZEICHEN * 0.7);
  assert.equal(knapp.stufe, "knapp");
  assert.match(knapp.hinweis, /Sicherung/);
  const voll = speicherAnzeige(GRENZE_ZEICHEN * 0.95);
  assert.equal(voll.stufe, "voll");
  assert.match(voll.hinweis, /Fotos/);
  assert.equal(speicherAnzeige(GRENZE_ZEICHEN * 2).prozent, 100); // nie über 100 %
});
