// 0.76.0: Die Demo sieht aus wie aus dem Alltag gegriffen (Stefan 06.11.2026): Fütterungszeiten schwanken, am
// Wochenende später, mal 1 oder 3 Beutel Sheba, Trockenfutter in runden Grammzahlen, verschiedene Leckerlis aus der
// Futterliste, Wiegetag mal einen Tag früher oder später. Kito bekommt an 5 von 7 Tagen ca. 20 g Tatar, Zuki nie.
// Tatar: 137 kcal pro 100 g laut USDA FoodData Central 171790 (Rinderhack 95 % mager / 5 % Fett, roh).
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { futterNachId } from "../js/daten.js";
import { FUTTERLISTE } from "../js/futterliste.js";
import { tagSchluessel, mahlzeitenAm, tagesSumme, leckerliKcal, aktuelleFreigabe } from "../js/rechnen.js";

const demo = JSON.parse(fs.readFileSync(new URL("../demo/kito-simulation.json", import.meta.url), "utf8"));
const sorten = futterNachId(demo);
const vonTier = (feld, tierId) => demo[feld].filter((e) => e.tierId === tierId);
const tagVon = (m) => tagSchluessel(new Date(m.zeitpunkt));
const tageZwischen = (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / 86400000);
const typVon = (m) => sorten.get(m.futterId).typ;

test("0.76.0: Tatar steht als Frischfleisch mit 137 kcal und Quelle USDA in der Demo", () => {
  const tatar = demo.futter.filter((f) => f.typ === "frischfleisch");
  assert.equal(tatar.length, 1);
  assert.equal(tatar[0].kcalPro100g, 137);
  assert.match(tatar[0].name, /tatar/i);
  assert.match(tatar[0].notiz, /USDA/);
  assert.match(tatar[0].notiz, /171790/);
});

test("0.76.0: Kito bekommt in jeder vollen Woche an genau 5 Tagen 15–25 g Tatar, Zuki nie", () => {
  const start = vonTier("gewichte", "kito").map((g) => g.datum).sort()[0];
  const tatar = vonTier("mahlzeiten", "kito").filter((m) => typVon(m) === "frischfleisch");
  assert.ok(tatar.every((m) => m.gramm >= 15 && m.gramm <= 25), "Menge um 20 g");
  const proWoche = new Map();
  const tageMitTatar = new Set();
  for (const m of tatar) {
    const tag = tagVon(m);
    assert.ok(!tageMitTatar.has(tag), `${tag}: Tatar nur einmal am Tag`);
    tageMitTatar.add(tag);
    const woche = Math.floor(tageZwischen(start, tag) / 7);
    proWoche.set(woche, (proWoche.get(woche) ?? 0) + 1);
  }
  for (let w = 0; w < 52; w++) assert.equal(proWoche.get(w), 5, `Woche ${w + 1}`);
  assert.ok(vonTier("mahlzeiten", "zuki").every((m) => typVon(m) !== "frischfleisch"));
});

test("0.76.0: Kitos Tage halten die Freigabe ein (±10 %), Leckerli unter 10 %", () => {
  const mahlzeiten = vonTier("mahlzeiten", "kito");
  const freigaben = vonTier("freigaben", "kito");
  const tage = [...new Set(mahlzeiten.map(tagVon))];
  assert.ok(tage.length >= 52 * 7);
  for (const tag of tage) {
    const amTag = mahlzeitenAm(mahlzeiten, tag);
    const soll = aktuelleFreigabe(freigaben, tag).kcalProTag;
    const kcal = tagesSumme(amTag, sorten).kcal;
    assert.ok(kcal >= 0.9 * soll && kcal <= 1.1 * soll, `${tag}: ${kcal} kcal bei ${soll}`);
    assert.ok(leckerliKcal(amTag, sorten) < 0.1 * kcal, `${tag}: Leckerli`);
  }
});

test("0.76.0: Leckerlis sind echte Sorten aus der Futterliste, mehrere verschiedene", () => {
  const leckerlis = demo.futter.filter((f) => f.typ === "leckerli");
  assert.ok(leckerlis.length >= 2);
  for (const f of leckerlis) {
    const eintrag = FUTTERLISTE.find((e) => e.id === f.listeId);
    assert.ok(eintrag, `${f.name} aus der Futterliste`);
    assert.equal(f.kcalPro100g, eintrag.kcalPro100g);
  }
  assert.ok(!demo.futter.some((f) => /Simulation/.test(f.name)));
  for (const tierId of ["kito", "zuki"]) {
    const benutzt = new Set(vonTier("mahlzeiten", tierId).filter((m) => typVon(m) === "leckerli").map((m) => m.futterId));
    assert.ok(benutzt.size >= 2, `${tierId}: verschiedene Leckerlis`);
  }
});

for (const tierId of ["kito", "zuki"]) {
  test(`0.76.0: ${tierId}: Fütterung wie im Alltag (Zeiten schwanken, Wochenende später, mal 1 oder 3 Beutel)`, () => {
    const mahlzeiten = vonTier("mahlzeiten", tierId);
    // Erste Nassfutter-Mahlzeit des Tages: am Wochenende im Mittel mindestens eine halbe Stunde später.
    const ersteNass = new Map();
    for (const m of mahlzeiten.filter((m) => typVon(m) === "nass")) {
      const tag = tagVon(m);
      if (!ersteNass.has(tag) || m.zeitpunkt < ersteNass.get(tag).zeitpunkt) ersteNass.set(tag, m);
    }
    const minuten = (m) => {
      const d = new Date(m.zeitpunkt);
      return d.getHours() * 60 + d.getMinutes();
    };
    const mittel = (liste) => liste.reduce((s, x) => s + x, 0) / liste.length;
    const wochenende = [...ersteNass.values()].filter((m) => [0, 6].includes(new Date(m.zeitpunkt).getDay())).map(minuten);
    const werktags = [...ersteNass.values()].filter((m) => ![0, 6].includes(new Date(m.zeitpunkt).getDay())).map(minuten);
    assert.ok(mittel(wochenende) - mittel(werktags) >= 30, `${mittel(wochenende)} vs ${mittel(werktags)}`);
    assert.ok(new Set(werktags).size >= 20, "Uhrzeiten schwanken");

    // Beutel pro Tag: meist 2, an einigen Tagen 1 oder 3.
    const beutel = new Map();
    for (const m of mahlzeiten.filter((m) => typVon(m) === "nass")) beutel.set(tagVon(m), (beutel.get(tagVon(m)) ?? 0) + m.gramm / 50);
    const zahlen = [...beutel.values()];
    assert.ok(zahlen.every((z) => [1, 2, 3].includes(z)));
    assert.ok(zahlen.filter((z) => z === 2).length > zahlen.length * 0.75, "meist 2 Beutel");
    assert.ok(zahlen.some((z) => z === 1) && zahlen.some((z) => z === 3), "mal 1, mal 3 Beutel");

    // Trockenfutter meist in runden Grammzahlen (durch 5 teilbar).
    const trocken = mahlzeiten.filter((m) => typVon(m) === "trocken");
    assert.ok(trocken.filter((m) => m.gramm % 5 === 0).length > trocken.length * 0.6, "meist runde Grammzahlen");
    assert.ok(trocken.some((m) => m.gramm % 5 !== 0), "manchmal etwas mehr eingefüllt");
  });

  test(`0.76.0: ${tierId}: gewogen ungefähr jede Woche, mal einen Tag früher oder später`, () => {
    const daten = vonTier("gewichte", tierId).map((g) => g.datum).sort();
    const abstaende = daten.slice(1).map((d, i) => tageZwischen(daten[i], d));
    assert.ok(abstaende.every((a) => a >= 6 && a <= 8), abstaende.join(","));
    assert.ok(abstaende.filter((a) => a !== 7).length >= 4, "Wiegetag verschiebt sich manchmal");
  });
}
