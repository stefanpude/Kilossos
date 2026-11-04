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
  istErsterStart,
  ersteDaten,
  alteStartsorten,
} from "../js/daten.js";

// Ersatz für den Browserspeicher, damit die Tests ohne Browser laufen.
function testSpeicher() {
  const inhalt = new Map();
  return {
    getItem: (schluessel) => (inhalt.has(schluessel) ? inhalt.get(schluessel) : null),
    setItem: (schluessel, wert) => inhalt.set(schluessel, wert),
  };
}

// Stand einer Installation vor 0.27.0: Kito mit seinen beiden Startsorten, so wie ihn die App damals angelegt hat.
function alterStand(speicher = testSpeicher()) {
  const daten = {
    version: 1,
    tiere: [{ id: "kito", name: "Kito", art: "katze", geschlecht: "kater", kastriert: true }],
    futter: alteStartsorten(),
    mahlzeiten: [],
    gewichte: [],
    freigaben: [],
  };
  speichern(daten, speicher);
  return laden(speicher);
}

test("erster Start (0.27.0): kein Kito, kein Futter, nichts gespeichert", () => {
  const speicher = testSpeicher();
  assert.equal(istErsterStart(speicher), true);
  const daten = laden(speicher);
  assert.equal(daten.tiere.length, 1);
  assert.notEqual(daten.tiere[0].name, "Kito");
  assert.equal(daten.futter.length, 0);
  assert.ok(istGueltig(daten));
  assert.equal(speicher.getItem("kilossos-daten"), null);
  assert.equal(istErsterStart(speicher), true);
});

test("ersteDaten legt genau die eingegebene Katze an, alle Listen leer", () => {
  const daten = ersteDaten({ name: "Mia", geschlecht: "katze", kastriert: true, wiegetag: 3 });
  assert.ok(istGueltig(daten));
  assert.equal(daten.tiere.length, 1);
  const { id, ...rest } = daten.tiere[0];
  assert.equal(typeof id, "string");
  assert.deepEqual(rest, { name: "Mia", art: "katze", geschlecht: "katze", kastriert: true, wiegetag: 3 });
  for (const feld of ["futter", "mahlzeiten", "gewichte", "freigaben"]) assert.deepEqual(daten[feld], []);
});

test("ersteDaten ohne Wiegetag und Foto lässt die Schlüssel ganz weg, mit Foto übernimmt es das Foto", () => {
  const ohne = ersteDaten({ name: "Max", geschlecht: "kater", kastriert: false });
  assert.equal("wiegetag" in ohne.tiere[0], false);
  assert.equal("foto" in ohne.tiere[0], false);
  const mit = ersteDaten({ name: "Max", geschlecht: "kater", kastriert: false, foto: "data:image/jpeg;base64,AAAA", wiegetag: 0 });
  assert.equal(mit.tiere[0].foto, "data:image/jpeg;base64,AAAA");
  assert.equal(mit.tiere[0].wiegetag, 0);
});

test("bestehende Daten (Kito) sind kein erster Start und bleiben beim Laden unverändert", () => {
  const speicher = testSpeicher();
  const vorher = alterStand(speicher);
  assert.equal(istErsterStart(speicher), false);
  assert.deepEqual(laden(speicher), vorher);
  assert.equal(laden(speicher).tiere[0].name, "Kito");
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
  const daten = alterStand(speicher);
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

test("alter Sheba-Startwert aus 0.5 (77, Packung) bleibt stehen, bekommt aber seine Kennung", () => {
  const speicher = testSpeicher();
  const daten = alterStand(speicher);
  const sheba = daten.futter.find((f) => f.name.startsWith("Sheba"));
  Object.assign(sheba, { kcalPro100g: 77, kcalQuelle: "packung", notiz: "" });
  delete sheba.listeId;
  speichern(daten, speicher);
  const neu = laden(speicher).futter.find((f) => f.id === sheba.id);
  assert.deepEqual([neu.kcalPro100g, neu.kcalQuelle, neu.notiz], [77, "packung", ""]);
  assert.equal(neu.listeId, "sheba-fresh-fine-huhn-gefluegel-truthahn");
});

// Speichert Sheba mit den angegebenen Werten und lädt danach neu, wie beim nächsten App-Start.
function shebaNachNeustart(werte, speicher = testSpeicher()) {
  const daten = alterStand(speicher);
  const sheba = daten.futter.find((f) => f.listeId === "sheba-fresh-fine-huhn-gefluegel-truthahn");
  Object.assign(sheba, werte);
  speichern(daten, speicher);
  const neu = laden(speicher).futter.find((f) => f.id === sheba.id);
  return neu;
}

const SHEBA_ZOOPLUS_START =
  "Rezeptur „Huhn, Geflügel & Truthahn in Sauce“ (EAN 4770608260286), Angaben laut zooplus.de (11/2026): Protein 7,7 %, Fett 3,9 %, Asche 1,8 %, Faser 0,2 %, Feuchte 84,7 %; 35,5 kcal je 50-g-Beutel. Eigene Nachrechnung (NRC 2006): 70,7.";
const SHEBA_ZOOPLUS_LISTE =
  "Laut zooplus.de: Protein 7,7 %, Fett 3,9 %, Asche 1,8 %, Faser 0,2 %, Feuchte 84,7 %. Megapack, EAN 4770608260286. 50-g-Beutel = 35,5 kcal. Aus der Kilossos-Futterliste, Stand 01.11.2026. Bei Abweichung gilt die Packung.";

test("Sheba mit dem alten zooplus-Wert (71) bekommt die Packungswerte (77)", () => {
  for (const notiz of [SHEBA_ZOOPLUS_START, SHEBA_ZOOPLUS_LISTE]) {
    const neu = shebaNachNeustart({ kcalPro100g: 71, kcalQuelle: "hersteller", notiz });
    assert.deepEqual([neu.kcalPro100g, neu.kcalQuelle], [77, "geschaetzt"]);
    assert.match(neu.notiz, /Umkarton/);
    assert.match(neu.notiz, /Fett 4,4 %/);
  }
});

test("selbst geänderte Sheba-Werte bleiben stehen", () => {
  for (const werte of [
    { kcalPro100g: 77, kcalQuelle: "packung", notiz: "selbst eingetragen" },
    { kcalPro100g: 80, kcalQuelle: "hersteller", notiz: SHEBA_ZOOPLUS_START },
    { kcalPro100g: 71, kcalQuelle: "hersteller", notiz: "eigene Notiz" },
    { kcalPro100g: 71, kcalQuelle: "packung", notiz: SHEBA_ZOOPLUS_START },
  ]) {
    const neu = shebaNachNeustart(werte);
    assert.deepEqual([neu.kcalPro100g, neu.kcalQuelle, neu.notiz], [werte.kcalPro100g, werte.kcalQuelle, werte.notiz]);
  }
});

test("Sheba-Umstellung läuft nur einmal und lässt Mahlzeiten verknüpft", () => {
  const speicher = testSpeicher();
  const daten = alterStand(speicher);
  const sheba = daten.futter.find((f) => f.listeId === "sheba-fresh-fine-huhn-gefluegel-truthahn");
  Object.assign(sheba, { kcalPro100g: 71, kcalQuelle: "hersteller", notiz: SHEBA_ZOOPLUS_START });
  daten.mahlzeiten.push({ id: "m1", tierId: daten.tiere[0].id, futterId: sheba.id, gramm: 50, zeitpunkt: "2026-11-03T08:00:00.000Z" });
  speichern(daten, speicher);
  const einmal = laden(speicher);
  const zweimal = laden(speicher);
  assert.deepEqual(zweimal, einmal);
  assert.equal(zweimal.mahlzeiten[0].futterId, sheba.id);
  assert.equal(zweimal.futter.find((f) => f.id === sheba.id).kcalPro100g, 77);
});

test("selbst geänderte Purina-Werte bleiben stehen", () => {
  const neu = purinaNachNeustart({ kcalPro100g: 352, kcalQuelle: "packung", notiz: "eigene" });
  assert.deepEqual([neu.kcalPro100g, neu.kcalQuelle, neu.notiz], [352, "packung", "eigene"]);
});

test("Startsorten aus älteren Versionen bekommen ihre Kennung in der Futterliste, eigene Sorten nicht", () => {
  const speicher = testSpeicher();
  const daten = alterStand(speicher);
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

test("fotoBereinigen verwirft ungültige Wägungsfotos, die Wägung bleibt (0.25.0)", () => {
  const daten = laden(testSpeicher());
  daten.gewichte.push(
    { id: "w1", tierId: daten.tiere[0].id, kg: 9.32, datum: "2026-11-02", notiz: "", foto: '"><img src=x onerror=alert(1)>' },
    { id: "w2", tierId: daten.tiere[0].id, kg: 9.2, datum: "2026-11-09", notiz: "", foto: "data:image/jpeg;base64,AAAA" },
  );
  assert.equal(fotoBereinigen(daten), 1);
  assert.equal(daten.gewichte.length, 2);
  assert.equal("foto" in daten.gewichte.find((g) => g.id === "w1"), false);
  assert.equal(daten.gewichte.find((g) => g.id === "w2").foto, "data:image/jpeg;base64,AAAA");
  assert.ok(istGueltig(daten));
});

test("fotoBereinigen stürzt bei kaputten Einträgen nicht ab", () => {
  const daten = laden(testSpeicher());
  daten.gewichte.push(null, "kaputt", 5);
  assert.equal(fotoBereinigen(daten), 0);
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
