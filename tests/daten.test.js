import { test } from "node:test";
import assert from "node:assert/strict";
import { laden, speichern, istGueltig, demoModus, verschiebeDaten } from "../js/daten.js";

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
  assert.deepEqual(daten.futter.map((f) => [f.kcalPro100g, f.kcalQuelle]), [[71, "hersteller"], [327.5, "hersteller"]]);
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

test("alter Sheba-Startwert (77, Packung) wird durch Rezeptur „Huhn, Geflügel & Truthahn“ ersetzt", () => {
  const speicher = testSpeicher();
  const daten = laden(speicher);
  const sheba = daten.futter.find((f) => f.name.startsWith("Sheba"));
  Object.assign(sheba, { kcalPro100g: 77, kcalQuelle: "packung", notiz: "" });
  speichern(daten, speicher);
  const neu = laden(speicher).futter.find((f) => f.id === sheba.id);
  assert.deepEqual([neu.kcalPro100g, neu.kcalQuelle], [71, "hersteller"]);
  assert.match(neu.notiz, /4770608260286/);
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

test("Demo-Modus schreibt in einen eigenen Speicherplatz, echte Daten bleiben unberührt", () => {
  const speicher = testSpeicher();
  const echt = laden(speicher);
  echt.gewichte.push({ id: "echt", tierId: echt.tiere[0].id, kg: 9.32, datum: "2026-10-25", notiz: "" });
  speichern(echt, speicher);
  demoModus(true);
  try {
    const demo = laden(speicher);
    assert.equal(demo.gewichte.length, 0);
    demo.gewichte.push({ id: "demo", tierId: demo.tiere[0].id, kg: 7.2, datum: "2026-11-01", notiz: "" });
    speichern(demo, speicher);
  } finally {
    demoModus(false);
  }
  assert.deepEqual(laden(speicher).gewichte.map((g) => g.id), ["echt"]);
});

test("verschiebeDaten verschiebt Tage, Uhrzeit bleibt (auch über die Zeitumstellung)", () => {
  const daten = {
    version: 1,
    tiere: [],
    futter: [],
    mahlzeiten: [{ zeitpunkt: new Date(2026, 2, 20, 7, 30).toISOString() }],
    gewichte: [{ datum: "2026-03-20" }],
    freigaben: [{ datum: "2026-12-30" }],
  };
  const neu = verschiebeDaten(daten, 10);
  assert.equal(neu.gewichte[0].datum, "2026-03-30");
  assert.equal(neu.freigaben[0].datum, "2027-01-09");
  const zeit = new Date(neu.mahlzeiten[0].zeitpunkt);
  assert.deepEqual([zeit.getDate(), zeit.getHours(), zeit.getMinutes()], [30, 7, 30]);
  assert.equal(daten.gewichte[0].datum, "2026-03-20"); // Original unverändert
});
