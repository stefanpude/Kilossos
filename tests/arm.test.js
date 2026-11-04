// Wiegen mit der Katze auf dem Arm (Plan .planning/arm-wiegen.md), Beispielzahlen von Kito.
import { test } from "node:test";
import assert from "node:assert/strict";
import { armGewicht, prozentInGramm } from "../js/rechnen.js";

test("armGewicht: Differenz mit 2 Nachkommastellen (Kito 74,6 − 65,3 = 9,30)", () => {
  assert.deepEqual(armGewicht(74.6, 65.3), { kg: 9.3 });
  assert.deepEqual(armGewicht(80.15, 70.83), { kg: 9.32 });
});

test("armGewicht: Grenzen der Differenz wie im kg-Feld (0,5–20 kg)", () => {
  assert.deepEqual(armGewicht(70.5, 70), { kg: 0.5 });
  assert.deepEqual(armGewicht(90, 70), { kg: 20 });
  assert.match(armGewicht(70.4, 70).fehler, /0,5 und 20 kg/);
  assert.match(armGewicht(90.1, 70).fehler, /0,5 und 20 kg/);
});

test("armGewicht: mit Katze muss mehr sein als allein", () => {
  assert.match(armGewicht(65.3, 74.6).fehler, /mit Katze/);
  assert.match(armGewicht(70, 70).fehler, /mit Katze/);
});

test("armGewicht: beide Werte 1–250 kg, fehlende Werte", () => {
  assert.match(armGewicht(260, 250).fehler, /1 und 250 kg/);
  assert.match(armGewicht(10, 0.5).fehler, /1 und 250 kg/);
  assert.match(armGewicht(null, 65.3).fehler, /beide/i);
  assert.match(armGewicht(74.6, null).fehler, /beide/i);
});

test("prozentInGramm: Kito 9,32 kg → 1 % = 93 g, 0,5 % = 47 g, 2 % = 186 g", () => {
  assert.equal(prozentInGramm(9.32, 1), 93);
  assert.equal(prozentInGramm(9.32, 0.5), 47);
  assert.equal(prozentInGramm(9.32, 2), 186);
});
