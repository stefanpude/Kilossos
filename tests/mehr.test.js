import { test } from "node:test";
import assert from "node:assert/strict";
import { freigabeTafel, datumText } from "../js/mehr.js";
import { MCS } from "../js/daten.js";

const mcsSchluessel = Object.keys(MCS)[1];

test("datumText schreibt ein ISO-Datum kurz auf Deutsch", () => {
  assert.equal(datumText("2026-11-13"), "13. Nov. 2026");
});

test("freigabeTafel: Kitos Beispiel mit BCS, MCS und Notiz", () => {
  const tafel = freigabeTafel({
    zielgewichtKg: 7.2, kcalProTag: 245, datum: "2026-11-13", tierarzt: "Praxis Beispiel",
    bcs: 8, mcs: mcsSchluessel, notiz: "Kontrolle in 4 Wochen",
  });
  assert.deepEqual(tafel.felder, [
    { titel: "Ziel", wert: "7,20 kg" },
    { titel: "kcal/Tag", wert: "245" },
    { titel: "BCS", wert: "8 von 9" },
  ]);
  assert.equal(tafel.zeile, "Praxis Beispiel, 13. Nov. 2026");
  assert.equal(tafel.befund, MCS[mcsSchluessel]);
  assert.equal(tafel.notiz, "Kontrolle in 4 Wochen");
});

test("freigabeTafel: ohne BCS, MCS und Notiz keine leeren Angaben", () => {
  const tafel = freigabeTafel({ zielgewichtKg: 7.2, kcalProTag: 245, datum: "2026-11-13", tierarzt: "Praxis Beispiel" });
  assert.equal(tafel.felder[2].wert, "–");
  assert.equal(tafel.befund, "");
  assert.equal(tafel.notiz, "");
});

test("freigabeTafel: ohne Freigabe null", () => {
  assert.equal(freigabeTafel(undefined), null);
});
