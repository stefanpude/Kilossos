// Sicherungen aus allen früheren Versionen müssen sich einlesen lassen, ohne dass etwas verloren geht.
// Die Beispiel-Sicherungen in tests/sicherungen/ sind eingefroren: je Format-Stand eine Datei
// (Übersicht in .planning/alte-sicherungen.md). Nie an das neue Format anpassen, sonst prüft der Test nichts mehr.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { laden, speichern, futterNachId } from "../js/daten.js";
import { sicherungPruefen, einleseFrage } from "../js/sicherung.js";
import { berichtDaten, berichtHtml } from "../js/bericht.js";
import { zeichneVerlauf } from "../js/verlauf.js";
import { wochenRaten, futterTage, monatsGruppen, achtWochen } from "../js/zusammenfassung.js";
import { rer, abnahmeProWoche, tagSchluessel, mahlzeitenAm, tagesSumme, leckerliKcal, aktuelleFreigabe } from "../js/rechnen.js";

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

test("Es gibt Beispiel-Sicherungen von 0.2 bis 0.33", () => {
  assert.ok(DATEIEN.length >= 15);
  assert.ok(DATEIEN.includes("kilossos-0.02.json"));
  assert.ok(DATEIEN.includes("kilossos-0.28.json"));
  assert.ok(DATEIEN.includes("kilossos-0.33.json"));
});

test("0.33: besondere Tage aller Formen überstehen das Einlesen, die Rückfrage nennt sie", () => {
  const original = lies("kilossos-0.33.json");
  const { daten } = einlesen("kilossos-0.33.json");
  assert.equal(daten.besondereTage.length, 5);
  assert.ok(daten.besondereTage.some((b) => b.bis === null), "laufende Phase");
  assert.ok(daten.besondereTage.some((b) => b.art === "zukunft-art"), "unbekannte Art bleibt");
  assert.deepEqual(daten.futter.find((f) => f.analyse).analyse, original.futter.find((f) => f.analyse).analyse);
  const neu = lies("kilossos-0.33.json");
  const frage = einleseFrage(neu, sicherungPruefen(neu, HEUTE), "");
  assert.match(frage, /, \d+ Gewichten und 5 besonderen Tagen einlesen\?/);
  const alt = lies("kilossos-0.28.json");
  assert.doesNotMatch(einleseFrage(alt, sicherungPruefen(alt, HEUTE), ""), /besonder/);
  const einer = lies("kilossos-0.33.json");
  einer.besondereTage = einer.besondereTage.slice(0, 1);
  assert.match(einleseFrage(einer, sicherungPruefen(einer, HEUTE), ""), /und 1 besonderen Tag einlesen\?/);
  assert.match(einleseFrage(alt, sicherungPruefen(alt, HEUTE), ""), /Mahlzeiten und \d+ Gewichten einlesen\?/);
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
    assert.deepEqual(daten.besondereTage, original.besondereTage ?? [], "besondereTage");
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
      const [mahlzeiten, gewichte, freigaben, besondereTage] = [daten.mahlzeiten, daten.gewichte, daten.freigaben, daten.besondereTage].map(vonTier);
      wochenRaten(gewichte, freigaben);
      monatsGruppen(gewichte);
      achtWochen(gewichte, HEUTE);
      futterTage(mahlzeiten, sorten, freigaben);
      const html = zeichneVerlauf({ gewichte, mahlzeiten, freigaben, besondereTage, futterNachId: sorten, zeitraum: "alles", heute: HEUTE, kopf: true });
      assert.equal(typeof html, "string");
      const b = berichtDaten({ tier, gewichte, mahlzeiten, freigaben, besondereTage, futter: daten.futter, von: "2026-10-01", bis: HEUTE, heute: HEUTE });
      const bericht = berichtHtml(b, { tier, gewichte, mahlzeiten, freigaben, besondereTage, futterNachId: sorten, erstellt: HEUTE, demo: false, fotos: true });
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

test("Demo-Simulation hat besondere Tage: abgeschlossene Phase „Krank“, mehrmals genascht, eine laufende Phase", () => {
  const demo = JSON.parse(fs.readFileSync(new URL("../demo/kito-simulation.json", import.meta.url), "utf8"));
  const arten = demo.besondereTage.map((b) => b.art);
  assert.ok(demo.besondereTage.some((b) => b.art === "krank" && b.bis !== null && b.bis > b.von));
  assert.ok(arten.filter((a) => a === "genascht").length >= 3);
  assert.equal(demo.besondereTage.filter((b) => b.bis === null).length, 1);
  assert.ok(!arten.includes("futter-verweigert"));
  assert.ok(demo.besondereTage.every((b) => b.notiz.startsWith("Simulation:")));
});

test("Eine Sicherung aus der Demo hat dasselbe Format und wird ohne Korrekturen angenommen", () => {
  const demo = JSON.parse(fs.readFileSync(new URL("../demo/kito-simulation.json", import.meta.url), "utf8"));
  assert.deepEqual(sicherungPruefen(demo, HEUTE), { kaputt: 0, fotos: 0, angaben: 0 });
});

// 0.47.0: Die Demo zeigt zwei simulierte Katzen, damit Tester das Wechseln oben auf „Heute“ sehen (Ideen-Tafel).
const demoDaten = () => JSON.parse(fs.readFileSync(new URL("../demo/kito-simulation.json", import.meta.url), "utf8"));
const tageZwischen = (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / 86400000);

test("0.47.0: Demo hat Kito und Zuki, Kito steht vorn (ist beim Öffnen aktiv)", () => {
  const demo = demoDaten();
  assert.deepEqual(
    demo.tiere.map((t) => t.id),
    ["kito", "zuki"],
  );
  const zuki = demo.tiere[1];
  assert.equal(zuki.name, "Zuki");
  assert.equal(zuki.art, "katze");
  assert.equal(zuki.geschlecht, "katze");
  assert.equal(zuki.kastriert, true);
  assert.ok(!("foto" in zuki));
});

test("0.47.0: Jeder Eintrag der Demo gehört zu einem vorhandenen Tier, Kennungen sind eindeutig", () => {
  const demo = demoDaten();
  const tiere = new Set(demo.tiere.map((t) => t.id));
  const futter = new Set(demo.futter.map((f) => f.id));
  for (const feld of ["mahlzeiten", "gewichte", "freigaben", "besondereTage"]) {
    assert.ok(demo[feld].every((e) => tiere.has(e.tierId)), feld);
    assert.ok(demo[feld].some((e) => e.tierId === "zuki"), `${feld} ohne Zuki`);
    assert.equal(new Set(demo[feld].map((e) => e.id)).size, demo[feld].length, `${feld}: doppelte Kennung`);
  }
  assert.ok(demo.mahlzeiten.every((m) => futter.has(m.futterId)));
  assert.ok(demo.gewichte.every((g) => !("foto" in g)), "keine Fotos in der Demo-Datei");
});

// 0.55.0: Demo für den Tierarzttermin, ein ganzes Jahr. Zielgewichte sind Stefans Beispiele (Kito 6,0, Zuki 4,0 kg).
for (const { id, startKg, zielKg, startBcs } of [
  { id: "kito", startKg: 9.32, zielKg: 6.0, startBcs: 8 },
  { id: "zuki", startKg: 7.0, zielKg: 4.0, startBcs: 9 },
]) {
  test(`0.55.0: ${id} in der Demo: ein Jahr ${startKg} → ${zielKg} kg, Kontrolle alle 12 Wochen, kcal nie unter RER(Ziel)`, () => {
    const demo = demoDaten();
    const gewichte = demo.gewichte.filter((g) => g.tierId === id).sort((a, b) => a.datum.localeCompare(b.datum));
    const freigaben = demo.freigaben.filter((f) => f.tierId === id).sort((a, b) => a.datum.localeCompare(b.datum));
    assert.equal(gewichte[0].kg, startKg);
    assert.equal(gewichte.at(-1).kg, zielKg, "Ziel am Ende erreicht");
    assert.equal(tageZwischen(gewichte[0].datum, gewichte.at(-1).datum), 52 * 7, "ein Jahr");
    assert.equal(freigaben[0].datum, gewichte[0].datum);
    assert.equal(freigaben.length, 5);
    assert.ok(freigaben.every((f) => f.zielgewichtKg === zielKg));
    assert.equal(freigaben[0].bcs, startBcs);
    assert.equal(freigaben.at(-1).bcs, 5);
    // kcal sinken mit dem Gewicht, bleiben aber über dem Ruhebedarf beim Ziel (sonst Diätfutter-Hinweis).
    for (let i = 1; i < freigaben.length; i++) assert.ok(freigaben[i].kcalProTag <= freigaben[i - 1].kcalProTag);
    assert.ok(freigaben.every((f) => f.kcalProTag >= rer(zielKg)), "über RER(Ziel)");
    assert.ok(freigaben.every((f) => f.tierarzt === "Testpraxis (Simulation)" && f.notiz.startsWith("Simulation:")));
    // Spätestens alle 3 Monate eine Kontrolle, sonst stünde „Freigabe älter als 3 Monate“ da.
    for (let i = 1; i < freigaben.length; i++) assert.ok(tageZwischen(freigaben[i - 1].datum, freigaben[i].datum) <= 90);
    assert.ok(tageZwischen(freigaben.at(-1).datum, gewichte.at(-1).datum) <= 90);
  });
}

test("0.55.0: Kito nimmt sicher ab (2 Wochen höchstens 2 %, 4 Wochen mindestens 0,5 %)", () => {
  const gewichte = demoDaten().gewichte.filter((g) => g.tierId === "kito").sort((a, b) => a.datum.localeCompare(b.datum));
  for (let i = 2; i < gewichte.length; i++) {
    const r = abnahmeProWoche(gewichte.slice(0, i + 1), 14).prozent;
    assert.ok(r <= 2, `2 Wochen bis ${gewichte[i].datum}: ${r.toFixed(2)} %`);
  }
  for (let i = 4; i < gewichte.length; i++) {
    const r = abnahmeProWoche(gewichte.slice(0, i + 1), 28).prozent;
    assert.ok(r >= 0.5, `4 Wochen bis ${gewichte[i].datum}: ${r.toFixed(2)} %`);
  }
});

test("0.47.0: Zuki nimmt 0,5–2 % pro Woche ab (Mittel über 2 Wochen wie die App, und insgesamt)", () => {
  const demo = demoDaten();
  const gewichte = demo.gewichte.filter((g) => g.tierId === "zuki").sort((a, b) => a.datum.localeCompare(b.datum));
  assert.ok(gewichte.length >= 19);
  for (let i = 1; i < gewichte.length; i++) {
    assert.equal(tageZwischen(gewichte[i - 1].datum, gewichte[i].datum), 7, "einmal pro Woche gewogen");
    assert.ok(gewichte[i].kg < gewichte[i - 1].kg, `nimmt in Woche ${i} nicht zu`);
  }
  for (let i = 2; i < gewichte.length; i++) {
    const r = abnahmeProWoche(gewichte.slice(0, i + 1), 14).prozent;
    assert.ok(r >= 0.5 && r <= 2, `2 Wochen bis ${gewichte[i].datum}: ${r.toFixed(2)} %`);
  }
  const gesamt = abnahmeProWoche(gewichte, 7 * (gewichte.length - 1)).prozent;
  assert.ok(gesamt >= 0.5 && gesamt <= 2, `${gesamt}`);
});

test("0.47.0: Zukis Tage in der Demo: Freigabe eingehalten, Leckerli unter 10 %, getrennt von Kito gefüttert", () => {
  const demo = demoDaten();
  const futter = futterNachId(demo);
  const mahlzeiten = demo.mahlzeiten.filter((m) => m.tierId === "zuki");
  const freigaben = demo.freigaben.filter((f) => f.tierId === "zuki");
  const tage = [...new Set(mahlzeiten.map((m) => tagSchluessel(new Date(m.zeitpunkt))))];
  assert.ok(tage.length >= 18 * 7);
  let mitLeckerli = 0;
  for (const tag of tage) {
    const amTag = mahlzeitenAm(mahlzeiten, tag);
    const soll = aktuelleFreigabe(freigaben, tag).kcalProTag;
    const kcal = tagesSumme(amTag, futter).kcal;
    assert.ok(kcal >= 0.9 * soll && kcal <= 1.1 * soll, `${tag}: ${kcal} kcal bei ${soll}`);
    const leckerli = leckerliKcal(amTag, futter);
    assert.ok(leckerli < 0.1 * kcal, `${tag}: Leckerli ${leckerli} kcal`);
    if (leckerli > 0) mitLeckerli += 1;
  }
  assert.ok(mitLeckerli > 0 && mitLeckerli < tage.length / 2, "ab und zu ein Leckerli");
  // Getrennt gefüttert: keine Mahlzeit gehört beiden, Kito und Zuki haben eigene Kennungen.
  assert.ok(mahlzeiten.every((m) => m.id.startsWith("zuki-")));
});

test("0.47.0: Neuestes Gewicht der Demo ist Kitos (Verschiebung auf heute), Zuki höchstens eine Woche davor", () => {
  const demo = demoDaten();
  const neuestes = (tierId) =>
    demo.gewichte
      .filter((g) => g.tierId === tierId)
      .map((g) => g.datum)
      .sort()
      .at(-1);
  const alle = demo.gewichte.map((g) => g.datum).sort().at(-1);
  assert.equal(neuestes("kito"), alle);
  const abstand = tageZwischen(neuestes("zuki"), alle);
  assert.ok(abstand >= 0 && abstand < 7, `${abstand} Tage`);
  // Zukis Mahlzeiten reichen bis zum selben letzten Tag wie Kitos.
  const letzterTag = (tierId) =>
    tagSchluessel(new Date(demo.mahlzeiten.filter((m) => m.tierId === tierId).map((m) => m.zeitpunkt).sort().at(-1)));
  assert.equal(letzterTag("zuki"), letzterTag("kito"));
  // Zukis besondere Tage sind abgeschlossen; die eine laufende Phase bleibt Kitos.
  const zukiTage = demo.besondereTage.filter((b) => b.tierId === "zuki");
  assert.ok(zukiTage.length >= 1);
  assert.ok(zukiTage.every((b) => b.bis !== null && b.notiz.startsWith("Simulation:")));
});

test("0.47.0: app.js setzt in der Demo beim Öffnen das erste Tier der Simulation (Kito) als aktiv", () => {
  const app = fs.readFileSync(new URL("../app.js", import.meta.url), "utf8");
  const block = app.slice(app.indexOf("if (demo) {\n  demoModus(true);"), app.indexOf("} else {", app.indexOf("demoModus(true);")));
  assert.match(block, /merkeAktivesTier\(simulation\.tiere\[0\]\.id, true\);/);
  assert.ok(app.indexOf("merkeAktivesTier(simulation.tiere[0].id, true)") < app.indexOf("let tier = aktivesTier(daten, leseAktivesTier(demo));"));
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
    "Sicherung mit 16 Mahlzeiten und 4 Gewichten einlesen?", // seit 0.33.0 im Dativ
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

test("0.41.0: einleseFrage mit Einzahl bei genau einer Mahlzeit bzw. einem Gewicht", async () => {
  const { einleseFrage } = await import("../js/sicherung.js");
  const ohne = { kaputt: 0, fotos: 0, angaben: 0 };
  const mit = (m, g, b = 0) => ({ mahlzeiten: Array(m).fill({}), gewichte: Array(g).fill({}), besondereTage: Array(b).fill({}) });
  assert.equal(einleseFrage(mit(1, 1), ohne, ""), "Sicherung mit 1 Mahlzeit und 1 Gewicht einlesen?");
  assert.equal(einleseFrage(mit(1, 2), ohne, ""), "Sicherung mit 1 Mahlzeit und 2 Gewichten einlesen?");
  assert.equal(einleseFrage(mit(0, 1, 1), ohne, ""), "Sicherung mit 0 Mahlzeiten, 1 Gewicht und 1 besonderen Tag einlesen?");
  assert.equal(einleseFrage(mit(3, 0, 2), ohne, ""), "Sicherung mit 3 Mahlzeiten, 0 Gewichten und 2 besonderen Tagen einlesen?");
});
