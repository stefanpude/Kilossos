// Sicherungen aus allen früheren Versionen müssen sich einlesen lassen, ohne dass etwas verloren geht.
// Die Beispiel-Sicherungen in tests/sicherungen/ sind eingefroren: je Format-Stand eine Datei
// (Übersicht in .planning/alte-sicherungen.md). Nie an das neue Format anpassen, sonst prüft der Test nichts mehr.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { laden, speichern, futterNachId } from "../js/daten.js";
import { sicherungPruefen } from "../js/sicherung.js";
import { berichtDaten, berichtHtml } from "../js/bericht.js";
import { zeichneVerlauf } from "../js/verlauf.js";
import { wochenRaten, futterTage, monatsGruppen, achtWochen } from "../js/zusammenfassung.js";

const ORDNER = new URL("./sicherungen/", import.meta.url);
const HEUTE = "2026-11-04";
const DATEIEN = fs.readdirSync(ORDNER).filter((d) => d.endsWith(".json")).sort();

function lies(datei) {
  return JSON.parse(fs.readFileSync(new URL(datei, ORDNER), "utf8"));
}

function speicher() {
  const inhalt = new Map();
  return {
    getItem: (s) => (inhalt.has(s) ? inhalt.get(s) : null),
    setItem: (s, w) => inhalt.set(s, String(w)),
    removeItem: (s) => inhalt.delete(s),
  };
}

// Wie „Sicherung einlesen“ in app.js: prüfen, speichern, App neu laden.
function einlesen(datei) {
  const neu = lies(datei);
  const pruefung = sicherungPruefen(neu, HEUTE);
  const s = speicher();
  speichern(neu, s);
  return { pruefung, s, daten: laden(s) };
}

test("Es gibt Beispiel-Sicherungen von 0.2 bis 0.28", () => {
  assert.ok(DATEIEN.length >= 14);
  assert.ok(DATEIEN.includes("kilossos-0.02.json"));
  assert.ok(DATEIEN.includes("kilossos-0.28.json"));
});

for (const datei of DATEIEN) {
  test(`${datei}: wird ohne Verluste eingelesen`, () => {
    const original = lies(datei);
    const { pruefung, daten } = einlesen(datei);
    assert.deepEqual(pruefung, { kaputt: 0, fotos: 0, angaben: 0 });
    for (const feld of ["tiere", "futter", "mahlzeiten", "gewichte", "freigaben"]) {
      assert.deepEqual(
        daten[feld].map((e) => e.id),
        original[feld].map((e) => e.id),
        `${feld} vollständig`,
      );
    }
    // Einträge bleiben Feld für Feld gleich (nur Futterwerte dürfen durch die Startwert-Umstellung wechseln).
    for (const feld of ["tiere", "mahlzeiten", "gewichte", "freigaben"]) assert.deepEqual(daten[feld], original[feld], feld);
    // Jede Mahlzeit zeigt auf eine vorhandene Sorte.
    const sorten = futterNachId(daten);
    for (const m of daten.mahlzeiten) assert.ok(sorten.has(m.futterId), `Sorte zu ${m.id}`);
  });

  test(`${datei}: zweites Laden ändert nichts mehr`, () => {
    const { s, daten } = einlesen(datei);
    const gespeichert = s.getItem("kilossos-daten");
    assert.deepEqual(laden(s), daten);
    assert.equal(s.getItem("kilossos-daten"), gespeichert);
    assert.equal(s.getItem("kilossos-entfernt"), null);
  });

  test(`${datei}: Verlauf und Tierarzt-Bericht lassen sich für jedes Tier erstellen`, () => {
    const { daten } = einlesen(datei);
    const sorten = futterNachId(daten);
    for (const tier of daten.tiere) {
      const vonTier = (liste) => liste.filter((e) => e.tierId === tier.id);
      const [mahlzeiten, gewichte, freigaben] = [daten.mahlzeiten, daten.gewichte, daten.freigaben].map(vonTier);
      wochenRaten(gewichte, freigaben);
      monatsGruppen(gewichte);
      achtWochen(gewichte, HEUTE);
      futterTage(mahlzeiten, sorten, freigaben);
      const html = zeichneVerlauf({ gewichte, mahlzeiten, freigaben, futterNachId: sorten, zeitraum: "alles", heute: HEUTE, kopf: true });
      assert.equal(typeof html, "string");
      const b = berichtDaten({ tier, gewichte, mahlzeiten, freigaben, futter: daten.futter, von: "2026-10-01", bis: HEUTE, heute: HEUTE });
      const bericht = berichtHtml(b, { tier, gewichte, mahlzeiten, freigaben, futterNachId: sorten, erstellt: HEUTE, demo: false, fotos: true });
      assert.match(bericht, new RegExp(tier.name));
    }
  });
}

// ---------- Umstellung veralteter Startwerte ----------
const sorte = (daten, name) => daten.futter.find((f) => f.name === name);

test("Purina 360 (0.2) und 346 (0.3) werden auf die Herstellerangabe 327,5 umgestellt", () => {
  for (const datei of ["kilossos-0.02.json", "kilossos-0.03.json"]) {
    const purina = sorte(einlesen(datei).daten, "Purina One Light");
    assert.equal(purina.kcalPro100g, 327.5, datei);
    assert.equal(purina.kcalQuelle, "hersteller", datei);
    assert.equal(purina.listeId, "purina-one-light-trocken", datei);
  }
});

test("Sheba 77 von der Packung (bis 0.4) bleibt stehen und bekommt die listeId", () => {
  const sheba = sorte(einlesen("kilossos-0.02.json").daten, "Sheba Fresh n Fine in Sauce mit Geflügel");
  assert.equal(sheba.kcalPro100g, 77);
  assert.equal(sheba.kcalQuelle, "packung");
  assert.equal(sheba.listeId, "sheba-fresh-fine-huhn-gefluegel-truthahn");
});

test("Sheba 71 von zooplus (0.5 bis 0.18) wird auf 77 vom Umkarton umgestellt", () => {
  for (const datei of ["kilossos-0.05.json", "kilossos-0.06.json", "kilossos-0.12.json"]) {
    const sheba = sorte(einlesen(datei).daten, "Sheba Fresh n Fine in Sauce mit Geflügel");
    assert.equal(sheba.kcalPro100g, 77, datei);
    assert.equal(sheba.kcalQuelle, "geschaetzt", datei);
    assert.match(sheba.notiz, /Umkarton/, datei);
  }
});

test("Sheba-Kopie aus der alten Futterliste (0.6 bis 0.18, 71 laut zooplus) wird auf 77 umgestellt", () => {
  const { daten } = einlesen("kilossos-0.12b.json");
  const sheba = daten.futter.find((f) => f.listeId === "sheba-fresh-fine-huhn-gefluegel-truthahn");
  assert.equal(sheba.name, "Sheba Fresh & Fine in Sauce – Huhn, Geflügel & Truthahn"); // Name bleibt
  assert.equal(sheba.kcalPro100g, 77);
  assert.equal(sheba.kcalQuelle, "geschaetzt");
});

test("Eine Sicherung aus der Demo hat dasselbe Format und wird ohne Korrekturen angenommen", () => {
  const demo = JSON.parse(fs.readFileSync(new URL("../demo/kito-simulation.json", import.meta.url), "utf8"));
  assert.deepEqual(sicherungPruefen(demo, HEUTE), { kaputt: 0, fotos: 0, angaben: 0 });
});

test("Neuere Stände (ab 0.19) behalten alle Futterwerte unverändert", () => {
  for (const datei of ["kilossos-0.19.json", "kilossos-0.22.json", "kilossos-0.25.json", "kilossos-0.27.json", "kilossos-0.28.json"]) {
    assert.deepEqual(einlesen(datei).daten.futter, lies(datei).futter, datei);
  }
});

test("Profilbild, Wägungsfoto, Strichcode und BCS/MCS überstehen das Einlesen", () => {
  const { daten } = einlesen("kilossos-0.28.json");
  assert.match(daten.tiere[0].foto, /^data:image\/jpeg;base64,/);
  assert.ok(daten.gewichte.some((g) => g.foto));
  assert.equal(daten.futter.find((f) => f.ean).ean.length, 1);
  assert.equal(daten.freigaben[0].bcs, 8);
  assert.equal(daten.freigaben[0].mcs, "normal");
  assert.equal(daten.tiere[0].tierarzt.telefon, "01234 567890");
});

test("Keine Kilossos-Sicherung: sicherungPruefen gibt null zurück", () => {
  assert.equal(sicherungPruefen({ version: 2, tiere: [] }, HEUTE), null);
  assert.equal(sicherungPruefen(null, HEUTE), null);
  const ohneTiere = lies("kilossos-0.02.json");
  ohneTiere.tiere = [null];
  assert.equal(sicherungPruefen(ohneTiere, HEUTE), null);
});

test("einleseFrage nennt Anzahl und alle Korrekturen", async () => {
  const { einleseFrage } = await import("../js/sicherung.js");
  const neu = lies("kilossos-0.28.json");
  assert.equal(
    einleseFrage(neu, { kaputt: 0, fotos: 0, angaben: 0 }, ""),
    "Sicherung mit 16 Mahlzeiten und 4 Gewichte einlesen?",
  );
  const text = einleseFrage(neu, { kaputt: 2, fotos: 1, angaben: 1 }, " X.");
  assert.match(text, /einlesen\? X\. 2 Einträge waren beschädigt und werden entfernt/);
  assert.match(text, /Ein Foto in der Datei war ungültig/);
  assert.match(text, /Einige Angaben im Profil/);
  assert.match(einleseFrage(neu, { kaputt: 1, fotos: 0, angaben: 0 }, ""), /Ein Eintrag war beschädigt und wird/);
});

test("Speicher voll beim Umstellen alter Startwerte: laden() zeigt die Daten trotzdem", () => {
  const s = speicher();
  s.setItem("kilossos-daten", JSON.stringify(lies("kilossos-0.05.json")));
  s.setItem = () => {
    throw new DOMException("voll", "QuotaExceededError");
  };
  const daten = laden(s);
  assert.equal(daten.futter.find((f) => f.listeId === "sheba-fresh-fine-huhn-gefluegel-truthahn").kcalPro100g, 77);
});
