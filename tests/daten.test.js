import { test } from "node:test";
import assert from "node:assert/strict";
import { laden, speichern, istGueltig } from "../js/daten.js";

// Ersatz für den Browserspeicher, damit die Tests ohne Browser laufen.
function testSpeicher() {
  const inhalt = new Map();
  return {
    getItem: (schluessel) => (inhalt.has(schluessel) ? inhalt.get(schluessel) : null),
    setItem: (schluessel, wert) => inhalt.set(schluessel, wert),
  };
}

test("erster Start legt Kito und seine beiden Sorten an", () => {
  const speicher = testSpeicher();
  const daten = laden(speicher);
  assert.equal(daten.tiere.length, 1);
  assert.equal(daten.tiere[0].name, "Kito");
  assert.deepEqual(daten.futter.map((f) => [f.kcalPro100g, f.kcalQuelle]), [[77, "packung"], [346, "geschaetzt"]]);
  assert.ok(istGueltig(daten));
});

test("gespeicherte Einträge kommen beim nächsten Start unverändert zurück", () => {
  const speicher = testSpeicher();
  const daten = laden(speicher);
  daten.gewichte.push({ id: "g1", tierId: daten.tiere[0].id, kg: 9.32, datum: "2026-10-25", notiz: "" });
  speichern(daten, speicher);
  assert.deepEqual(laden(speicher), daten);
});

test("alter Purina-Startwert (360, ungefähr) wird einmalig ersetzt, eigene Änderungen bleiben", () => {
  const speicher = testSpeicher();
  const daten = laden(speicher);
  const purina = daten.futter.find((f) => f.name === "Purina One Light");
  Object.assign(purina, { kcalPro100g: 360, kcalQuelle: "ungefaehr", notiz: "alt" });
  speichern(daten, speicher);
  const neu = laden(speicher).futter.find((f) => f.name === "Purina One Light");
  assert.deepEqual([neu.kcalPro100g, neu.kcalQuelle], [346, "geschaetzt"]);
  assert.equal(neu.id, purina.id); // gleiche Sorte, Mahlzeiten bleiben verknüpft

  Object.assign(neu, { kcalPro100g: 352, kcalQuelle: "packung" });
  const datenEigen = laden(speicher);
  datenEigen.futter.find((f) => f.id === neu.id).kcalPro100g = 352;
  speichern(datenEigen, speicher);
  assert.equal(laden(speicher).futter.find((f) => f.id === neu.id).kcalPro100g, 352);
});

test("fremde oder kaputte Daten werden nicht übernommen", () => {
  assert.equal(istGueltig(null), false);
  assert.equal(istGueltig({ version: 99, tiere: [{}], futter: [], mahlzeiten: [], gewichte: [], freigaben: [] }), false);
  assert.equal(istGueltig({ version: 1, tiere: [], futter: [], mahlzeiten: [], gewichte: [], freigaben: [] }), false);
  const speicher = testSpeicher();
  speicher.setItem("kilossos-daten", JSON.stringify({ irgendwas: true }));
  assert.throws(() => laden(speicher), /unbekanntes Format/);
});
