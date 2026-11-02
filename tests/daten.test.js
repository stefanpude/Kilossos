import { test } from "node:test";
import assert from "node:assert/strict";
import {
  laden,
  speichern,
  istGueltig,
  demoModus,
  verschiebeDaten,
  sicherungsHinweis,
  letzteSicherung,
  sicherungMerken,
  fotoGueltig,
  fotoBereinigen,
  FOTO_MAX_ZEICHEN,
  MCS,
  bcsGueltig,
  befundText,
  freigabenBereinigen,
} from "../js/daten.js";

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

test("Startsorten aus älteren Versionen bekommen ihre Kennung in der Futterliste, eigene Sorten nicht", () => {
  const speicher = testSpeicher();
  const daten = laden(speicher);
  for (const futter of daten.futter) delete futter.listeId;
  daten.futter.push({ id: "eigen", name: "Selbst gekocht", typ: "nass", kcalPro100g: 90, kcalQuelle: "ungefaehr", notiz: "" });
  speichern(daten, speicher);
  const neu = laden(speicher).futter;
  assert.deepEqual(neu.map((f) => f.listeId), ["sheba-fresh-fine-huhn-gefluegel-truthahn", "purina-one-light-trocken", undefined]);
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

test("sicherungsHinweis: ohne Einträge nie, noch nie gesichert erst nach 7 Tagen", () => {
  assert.equal(sicherungsHinweis({ letzte: null, ersterEintrag: undefined, letzterEintrag: undefined, heute: "2026-11-20" }), null);
  const basis = { letzte: null, ersterEintrag: "2026-11-02", letzterEintrag: "2026-11-08", heute: "2026-11-08" };
  assert.equal(sicherungsHinweis(basis), null); // 6 Tage
  assert.deepEqual(sicherungsHinweis({ ...basis, heute: "2026-11-09" }), { nieGesichert: true, tage: 7 });
});

test("sicherungsHinweis: alle 14 Tage, aber nur wenn danach etwas eingetragen wurde", () => {
  const basis = { letzte: "2026-11-01", ersterEintrag: "2026-10-20", letzterEintrag: "2026-11-14", heute: "2026-11-14" };
  assert.equal(sicherungsHinweis(basis), null); // 13 Tage
  assert.deepEqual(sicherungsHinweis({ ...basis, heute: "2026-11-15", letzterEintrag: "2026-11-15" }), { nieGesichert: false, tage: 14 });
  assert.equal(sicherungsHinweis({ ...basis, heute: "2026-11-30", letzterEintrag: "2026-11-01" }), null); // nichts Neues
});

test("letzteSicherung wird getrennt von den Daten gemerkt", () => {
  const speicher = testSpeicher();
  assert.equal(letzteSicherung(speicher), null);
  sicherungMerken("2026-11-02", speicher);
  assert.equal(letzteSicherung(speicher), "2026-11-02");
  assert.equal(speicher.getItem("kilossos-daten"), null);
});

test("fotoGueltig nimmt nur JPEG/PNG bis 300 KB", () => {
  assert.equal(fotoGueltig("data:image/jpeg;base64,AAAA"), true);
  assert.equal(fotoGueltig("data:image/png;base64,AAAA"), true);
  assert.equal(fotoGueltig("data:image/gif;base64,AAAA"), false);
  assert.equal(fotoGueltig("data:image/jpeg;base64," + "A".repeat(FOTO_MAX_ZEICHEN)), false);
  assert.equal(fotoGueltig(42), false);
});

test("fotoGueltig lässt keine Anführungszeichen oder Fremdtext durch (Schutz vor eingeschleustem Code)", () => {
  assert.equal(fotoGueltig('data:image/png;base64,x" onerror="alert(1)'), false);
  assert.equal(fotoGueltig("data:image/jpeg;base64,AAAA<script>"), false);
  assert.equal(fotoGueltig("data:image/jpeg;base64,"), false);
  assert.equal(fotoGueltig("data:image/jpeg;base64,/9j/4AAQSkZJRg=="), true);
});

test("fotoBereinigen verwirft ungültige Fotos, der Rest bleibt", () => {
  const daten = laden(testSpeicher());
  daten.tiere[0].foto = "javascript:alert(1)";
  assert.equal(fotoBereinigen(daten), 1);
  assert.equal("foto" in daten.tiere[0], false);
  assert.ok(istGueltig(daten));
  daten.tiere[0].foto = "data:image/jpeg;base64,AAAA";
  assert.equal(fotoBereinigen(daten), 0);
  assert.equal(daten.tiere[0].foto, "data:image/jpeg;base64,AAAA");
});

test("alte Sicherung ohne foto bleibt gültig", () => {
  const daten = laden(testSpeicher());
  delete daten.tiere[0].foto;
  assert.ok(istGueltig(daten));
  assert.equal(fotoBereinigen(daten), 0);
});

// ---------- BCS und MCS in der Freigabe (0.12.0) ----------
const fr = (mehr = {}) => ({ id: "f", tierId: "k", datum: "2026-11-03", zielgewichtKg: 7.2, kcalProTag: 245, tierarzt: "T", notiz: "", ...mehr });

test("bcsGueltig: nur ganze Zahlen von 1 bis 9", () => {
  for (const bcs of [1, 5, 9]) assert.ok(bcsGueltig(bcs));
  for (const bcs of [0, 10, 7.5, "8", null, undefined, NaN]) assert.equal(bcsGueltig(bcs), false);
});

test("alte Sicherung: Freigabe ohne BCS und MCS bleibt gültig und unverändert", () => {
  const daten = laden(testSpeicher());
  daten.freigaben.push(fr());
  const vorher = JSON.stringify(daten);
  assert.ok(istGueltig(daten));
  assert.equal(freigabenBereinigen(daten), 0);
  assert.equal(JSON.stringify(daten), vorher);
});

test("freigabenBereinigen: gültige Werte bleiben, ungültige werden einzeln entfernt", () => {
  const daten = laden(testSpeicher());
  daten.freigaben.push(fr({ id: "a", bcs: 8, mcs: "leicht" }), fr({ id: "b", bcs: 12, mcs: "<img>" }), fr({ id: "c", bcs: 7.5 }));
  assert.equal(freigabenBereinigen(daten), 3);
  const [a, b, c] = daten.freigaben;
  assert.equal(a.bcs, 8);
  assert.equal(a.mcs, "leicht");
  assert.equal("bcs" in b, false);
  assert.equal("mcs" in b, false);
  assert.equal(b.zielgewichtKg, 7.2); // der Rest der Freigabe bleibt
  assert.equal("bcs" in c, false);
  assert.ok(istGueltig(daten));
});

test("Speichern und Laden behält BCS und MCS", () => {
  const speicher = testSpeicher();
  const daten = laden(speicher);
  daten.freigaben.push(fr({ bcs: 8, mcs: "normal" }));
  speichern(daten, speicher);
  const neu = laden(speicher);
  assert.equal(neu.freigaben[0].bcs, 8);
  assert.equal(neu.freigaben[0].mcs, "normal");
});

test("befundText: BCS und MCS in Worten, leer ohne Angaben", () => {
  assert.equal(befundText(fr({ bcs: 8, mcs: "leicht" })), "BCS 8 von 9 · leichter Muskelabbau");
  assert.equal(befundText(fr({ bcs: 5 })), "BCS 5 von 9");
  assert.equal(befundText(fr({ mcs: "normal" })), "normale Muskeln");
  assert.equal(befundText(fr()), "");
  assert.deepEqual(Object.keys(MCS), ["normal", "leicht", "maessig", "stark"]);
});
