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
  assert.deepEqual(daten.futter.map((f) => [f.kcalPro100g, f.kcalQuelle]), [[77, "packung"], [327.5, "hersteller"]]);
  assert.ok(istGueltig(daten));
});

test("gespeicherte Einträge kommen beim nächsten Start unverändert zurück", () => {
  const speicher = testSpeicher();
  const daten = laden(speicher);
  daten.gewichte.push({ id: "g1", tierId: daten.tiere[0].id, kg: 9.32, datum: "2026-10-25", notiz: "" });
  speichern(daten, speicher);
  assert.deepEqual(laden(speicher), daten);
});

// Speichert Purina mit den angegebenen Werten und lädt danach neu, wie beim nächsten App-Start.
function purinaNachNeustart(werte) {
  const speicher = testSpeicher();
  const daten = laden(speicher);
  const purina = daten.futter.find((f) => f.name === "Purina One Light");
  Object.assign(purina, werte);
  speichern(daten, speicher);
  const neu = laden(speicher).futter.find((f) => f.name === "Purina One Light");
  assert.equal(neu.id, purina.id); // gleiche Sorte, Mahlzeiten bleiben verknüpft
  return neu;
}

test("alte Purina-Startwerte (360 ungefähr, 346 geschätzt) werden durch die Herstellerangabe ersetzt", () => {
  for (const alt of [
    { kcalPro100g: 360, kcalQuelle: "ungefaehr" },
    { kcalPro100g: 346, kcalQuelle: "geschaetzt" },
  ]) {
    const neu = purinaNachNeustart(alt);
    assert.deepEqual([neu.kcalPro100g, neu.kcalQuelle], [327.5, "hersteller"]);
    assert.match(neu.notiz, /purina\.co\.uk/);
  }
});

test("selbst geänderte Purina-Werte bleiben stehen", () => {
  const neu = purinaNachNeustart({ kcalPro100g: 352, kcalQuelle: "packung", notiz: "eigene" });
  assert.deepEqual([neu.kcalPro100g, neu.kcalQuelle, neu.notiz], [352, "packung", "eigene"]);
});

test("fremde oder kaputte Daten werden nicht übernommen", () => {
  assert.equal(istGueltig(null), false);
  assert.equal(istGueltig({ version: 99, tiere: [{}], futter: [], mahlzeiten: [], gewichte: [], freigaben: [] }), false);
  assert.equal(istGueltig({ version: 1, tiere: [], futter: [], mahlzeiten: [], gewichte: [], freigaben: [] }), false);
  const speicher = testSpeicher();
  speicher.setItem("kilossos-daten", JSON.stringify({ irgendwas: true }));
  assert.throws(() => laden(speicher), /unbekanntes Format/);
});
