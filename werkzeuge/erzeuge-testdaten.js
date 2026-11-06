// Erzeugt eine SIMULIERTE Kilossos-Sicherung mit zwei Katzen, innerhalb aller Grenzen aus docs/sicherheitsgrenzen.md:
// Kito nimmt in 34 Wochen von 9,32 auf 7,2 kg ab; Zuki (seit 0.47.0) startet rund 20 Wochen vor heute mit 5,40 kg,
// Ziel 4,30 kg, noch nicht erreicht. Alle Zahlen sind ausgedacht, echte Werte von Zuki gibt es noch nicht.
// Die App zeigt die Sicherung im Demo-Modus (Link mit "?demo") in einem eigenen Speicherplatz an.
// Nie über "Sicherung einlesen" laden – das würde die echten Einträge ersetzen.
// Aufruf: node werkzeuge/erzeuge-testdaten.js  →  demo/kito-simulation.json (Name bleibt, enthält Kito und Zuki)
// Jeder simulierte Tag wird je Tier mit den Warnregeln der App geprüft; bei einer Warnung bricht das Skript ab.

import { writeFileSync } from "node:fs";
import { VERSION } from "../js/daten.js";
import {
  tagSchluessel,
  tagesSumme,
  mahlzeitenAm,
  leckerliKcal,
  aktuelleFreigabe,
  gewichteBis,
  warnungen,
  abnahmeProWoche,
} from "../js/rechnen.js";

// Fester Startwert für den Zufall: Jeder Lauf ergibt dieselben Daten. Jedes Tier hat einen eigenen Zufallsstrom,
// damit Kitos Daten gleich bleiben, egal was bei Zuki geändert wird.
function zufallsStrom(startwert) {
  let saat = startwert;
  const zufall = () => {
    saat = (saat * 1103515245 + 12345) % 2147483648;
    return saat / 2147483648;
  };
  const zwischen = (von, bis) => von + (bis - von) * zufall();
  return { zufall, zwischen };
}

const heute = new Date();
heute.setHours(0, 0, 0, 0);
const heuteSchluessel = tagSchluessel(heute);

const futter = [
  { id: "sheba", name: "Sheba Fresh n Fine in Sauce mit Geflügel", typ: "nass", kcalPro100g: 77, kcalQuelle: "geschaetzt", notiz: "Rezeptur Huhn, Geflügel & Truthahn (Werte vom Umkarton)" },
  { id: "purina", name: "Purina One Light", typ: "trocken", kcalPro100g: 327.5, kcalQuelle: "hersteller", notiz: "" },
  { id: "snack", name: "Leckerli (Simulation)", typ: "leckerli", kcalPro100g: 350, kcalQuelle: "packung", notiz: "" },
];
const futterMap = new Map(futter.map((f) => [f.id, f]));

const zeit = (tag, stunde, minute) => {
  const d = new Date(tag);
  d.setHours(stunde, minute, 0, 0);
  return d.toISOString();
};

// Simuliert ein Tier. Gewogen wird alle 7 Tage ab dem Start; das letzte Wiegen liegt "versatz" Tage vor heute,
// Mahlzeiten gibt es bis heute. Kennungen bekommen "praefix", damit sie über alle Tiere eindeutig sind.
function simuliere(p) {
  const { zufall, zwischen } = p.zufall;
  const letzterTag = p.wochen * 7 + p.versatz;
  const start = new Date(heute.getFullYear(), heute.getMonth(), heute.getDate() - letzterTag);
  const tagNr = (n) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + n);

  const freigaben = p.freigaben.map((f, i) => ({
    id: `${p.praefix}freigabe-${i + 1}`,
    tierId: p.tier.id,
    datum: tagSchluessel(tagNr(f.woche * 7)),
    zielgewichtKg: p.zielKg,
    kcalProTag: f.kcalProTag,
    tierarzt: "Testpraxis (Simulation)",
    notiz: f.notiz,
    bcs: f.bcs,
    mcs: f.mcs,
  }));

  // Wochenabnahme in %; mit "zielGenau" so skaliert, dass am Ende genau das Ziel herauskommt.
  const roh = Array.from({ length: p.wochen }, (_, w) => p.rate(w) + zwischen(-0.1, 0.1));
  const faktor = p.zielGenau ? Math.log(p.zielKg / p.startKg) / roh.reduce((s, r) => s + Math.log(1 - r / 100), 0) : 1;
  let wahr = p.startKg;
  const gewichte = [];
  for (let w = 0; w <= p.wochen; w++) {
    if (w > 0) wahr *= Math.exp(faktor * Math.log(1 - roh[w - 1] / 100));
    // Waage auf 10 g genau, dazu eine kleine Messschwankung; der Start (Tierarzt) exakt, bei "zielGenau" auch das Ende.
    const exakt = w === 0 ? p.startKg : p.zielGenau && w === p.wochen ? p.zielKg : null;
    const gemessen = exakt ?? Math.round((wahr + zwischen(-p.schwankung, p.schwankung)) * 100) / 100;
    gewichte.push({
      id: `${p.praefix}gewicht-${w}`,
      tierId: p.tier.id,
      kg: gemessen,
      datum: tagSchluessel(tagNr(w * 7)),
      notiz: w === 0 ? "Tierarzt (Simulation)" : "",
    });
  }

  // Mahlzeiten: morgens und abends je ein 50-g-Beutel Sheba (zusammen 77 kcal), dazu Trockenfutter in zwei Portionen,
  // an manchen Tagen ein kleines Leckerli. Die Tagesmenge schwankt um ±4 % um die Freigabe.
  const mahlzeiten = [];
  const z = p.zeiten;
  for (let n = 0; n <= letzterTag; n++) {
    const tag = tagNr(n);
    const freigabe = aktuelleFreigabe(freigaben, tagSchluessel(tag));
    const ziel = freigabe.kcalProTag * zwischen(0.96, 1.04);
    const leckerli = zufall() < p.leckerli.anteil ? Math.round(zwischen(p.leckerli.von, p.leckerli.bis)) : 0;
    const trocken = Math.round((ziel - 77 - leckerli * 3.5) / 3.275);
    const morgens = Math.round(trocken * 0.55);
    const neu = (futterId, gramm, [stunde, minute]) =>
      gramm > 0 &&
      mahlzeiten.push({
        id: `${p.praefix}m-${mahlzeiten.length}`,
        tierId: p.tier.id,
        futterId,
        gramm,
        zeitpunkt: zeit(tag, stunde, minute),
      });
    neu("sheba", 50, [z.nassMorgens[0], z.nassMorgens[1] + Math.floor(zwischen(0, 20))]);
    neu("purina", morgens, z.trockenMorgens);
    neu("snack", leckerli, z.leckerli);
    neu("sheba", 50, [z.nassAbends[0], z.nassAbends[1] + Math.floor(zwischen(0, 20))]);
    neu("purina", trocken - morgens, z.trockenAbends);
  }

  // Prüfung mit den Regeln der App, nur mit den Einträgen dieses Tiers (wie in der App):
  // Kein Tag darf eine Warnung auslösen – erlaubt ist nur "Ziel erreicht".
  const fehler = [];
  for (let n = 0; n <= letzterTag; n++) {
    const tag = tagSchluessel(tagNr(n));
    const amTag = mahlzeitenAm(mahlzeiten, tag);
    const liste = warnungen({
      name: p.tier.name,
      tag,
      heute: heuteSchluessel,
      kcal: tagesSumme(amTag, futterMap).kcal,
      leckerli: leckerliKcal(amTag, futterMap),
      freigabe: aktuelleFreigabe(freigaben, tag),
      gewichte: gewichteBis(gewichte, tag),
      fruehereMahlzeiten: n > 0,
    }).filter((w) => w.id !== "ziel-erreicht");
    for (const w of liste) fehler.push(`${p.tier.name} ${tag}: ${w.id} – ${w.text}`);
  }

  // Besondere Tage (seit 0.33.0): ohne Zufall, damit Gewichte und Mahlzeiten gleich bleiben.
  const besondereTage = p.besondereTage(letzterTag).map((b, i) => ({
    id: `${p.praefix}besonders-${i + 1}`,
    tierId: p.tier.id,
    art: b.art,
    von: tagSchluessel(tagNr(b.von)),
    bis: b.bis === null ? null : tagSchluessel(tagNr(b.bis)),
    notiz: b.notiz,
  }));

  return { tier: p.tier, start, freigaben, gewichte, mahlzeiten, besondereTage, fehler };
}

// Kito: Tierarzt-Kontrollen mit 0,8 × RER(7,2 kg) ≈ 245 kcal; nach 12 Wochen wird die Abnahme langsamer
// → 10 % weniger (AAHA 2014); danach Kontrollen spätestens alle 3 Monate.
const kito = simuliere({
  tier: { id: "kito", name: "Kito", art: "katze", geschlecht: "kater", kastriert: true },
  praefix: "",
  zufall: zufallsStrom(20261101),
  wochen: 34,
  versatz: 0,
  startKg: 9.32,
  zielKg: 7.2,
  zielGenau: true,
  rate: (w) => (w < 12 ? 0.95 : w < 24 ? 0.8 : 0.65),
  schwankung: 0.015,
  freigaben: [
    { woche: 0, kcalProTag: 245, bcs: 8, mcs: "normal", notiz: "Simulation: Start 0,8 × RER(Ziel)" },
    { woche: 12, kcalProTag: 220, bcs: 7, mcs: "normal", notiz: "Simulation: Abnahme langsamer, −10 %" },
    { woche: 24, kcalProTag: 220, bcs: 6, mcs: "normal", notiz: "Simulation: Kontrolle, Plan bleibt" },
  ],
  leckerli: { anteil: 3 / 7, von: 2, bis: 5 },
  zeiten: { nassMorgens: [7, 10], trockenMorgens: [7, 35], leckerli: [15, 0], nassAbends: [18, 5], trockenAbends: [21, 30] },
  // Kein „Futter verweigert“, sonst stünde in der Demo der rote Notfall-Kasten. Eine laufende Phase zeigt auf
  // „Heute“ den Knopf „Beendet“.
  besondereTage: (letzterTag) => [
    { art: "genascht", von: 40, bis: 40, notiz: "Simulation: ein paar Stücke vom Hundefutter" },
    { art: "mehr-bewegung", von: 61, bis: 61, notiz: "Simulation: lange im Garten gewesen" },
    { art: "genascht", von: 75, bis: 75, notiz: "Simulation: Maus gefangen" },
    { art: "krank", von: 15 * 7 + 2, bis: 15 * 7 + 4, notiz: "Simulation: Magen verstimmt, Tierarzt angerufen" },
    { art: "genascht", von: 130, bis: 130, notiz: "Simulation: vom Teller stibitzt" },
    { art: "futterumstellung", von: 20 * 7, bis: 20 * 7 + 6, notiz: "Simulation: neue Sorte langsam untergemischt" },
    { art: "genascht", von: letzterTag - 12, bis: letzterTag - 12, notiz: "Simulation: ein paar Stücke vom Hundefutter" },
    { art: "weniger-bewegung", von: letzterTag - 9, bis: null, notiz: "Simulation: Regenwetter, nur drinnen" },
  ],
});

// Zuki (seit 0.47.0): zierlich, im Verhältnis dicker als Kito, startet später. Freigabe 0,8 × RER(4,3 kg)
// = 167 kcal, auf 5 gerundet 165 kcal; Kontrolle nach 12 Wochen, Plan bleibt. Gewogen 2 Tage vor Kito,
// damit die Demo beim Verschieben auf heute (neuestes Gewicht über alle Tiere = Kitos) beide sinnvoll zeigt.
// Kleinere Leckerlis, damit sie bei der kleineren Tagesmenge unter 10 % bleiben. Getrennt gefüttert, eigene Zeiten.
const zuki = simuliere({
  tier: { id: "zuki", name: "Zuki", art: "katze", geschlecht: "katze", kastriert: true, koerperbau: "zierlich" },
  praefix: "zuki-",
  zufall: zufallsStrom(20261106),
  wochen: 20,
  versatz: 2,
  startKg: 5.4,
  zielKg: 4.3,
  zielGenau: false,
  rate: (w) => (w < 10 ? 0.9 : 0.8),
  schwankung: 0.008,
  freigaben: [
    { woche: 0, kcalProTag: 165, bcs: 8, mcs: "normal", notiz: "Simulation: Start 0,8 × RER(Ziel)" },
    { woche: 12, kcalProTag: 165, bcs: 7, mcs: "normal", notiz: "Simulation: Kontrolle, Plan bleibt" },
  ],
  leckerli: { anteil: 2 / 7, von: 1, bis: 3 },
  zeiten: { nassMorgens: [6, 45], trockenMorgens: [7, 20], leckerli: [16, 30], nassAbends: [17, 50], trockenAbends: [21, 15] },
  besondereTage: () => [
    { art: "mehr-bewegung", von: 9 * 7 + 3, bis: 9 * 7 + 3, notiz: "Simulation: lange mit der Federangel gespielt" },
    { art: "genascht", von: 16 * 7 + 4, bis: 16 * 7 + 4, notiz: "Simulation: Sahne vom Tisch geschleckt" },
  ],
});

const tiere = [kito, zuki];
const fehler = tiere.flatMap((t) => t.fehler);
if (fehler.length) {
  console.error("Die Simulation verletzt Grenzen:\n" + fehler.join("\n"));
  process.exit(1);
}

// Kito steht vorn: Die App zeigt beim Öffnen der Demo das erste Tier (app.js setzt es als aktiv).
const alle = (feld) => tiere.flatMap((t) => t[feld]);
const sicherung = {
  version: VERSION,
  tiere: tiere.map((t) => t.tier),
  futter,
  mahlzeiten: alle("mahlzeiten"),
  gewichte: alle("gewichte"),
  freigaben: alle("freigaben"),
  besondereTage: alle("besondereTage"),
};
writeFileSync(new URL("../demo/kito-simulation.json", import.meta.url), JSON.stringify(sicherung));
for (const t of tiere) {
  const g = t.gewichte;
  const wochenRaten = g.slice(1).map((x, i) => ((g[i].kg - x.kg) / g[i].kg) * 100);
  console.log(
    `${t.tier.name}: ${g.length - 1} Wochen (${tagSchluessel(t.start)} bis ${heuteSchluessel}), ${g[0].kg} → ${g.at(-1).kg} kg, ` +
      `${g.length} Gewichte, ${t.mahlzeiten.length} Mahlzeiten, ${t.freigaben.length} Freigaben, ` +
      `${t.besondereTage.length} besondere Tage – keine Warnung.\n` +
      `  Abnahme pro Woche: ${Math.min(...wochenRaten).toFixed(2)} bis ${Math.max(...wochenRaten).toFixed(2)} % (einzelne Wochen), ` +
      `über 4 Wochen zuletzt ${abnahmeProWoche(g, 28).prozent.toFixed(2)} %.`
  );
}
