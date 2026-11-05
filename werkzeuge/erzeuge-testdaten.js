// Erzeugt eine SIMULIERTE Kilossos-Sicherung: Kito nimmt in 34 Wochen von 9,32 auf 7,2 kg ab,
// innerhalb aller Grenzen aus docs/sicherheitsgrenzen.md. Die App zeigt sie im Demo-Modus (Link mit "?demo")
// in einem eigenen Speicherplatz an. Nie über "Sicherung einlesen" laden – das würde die echten Einträge ersetzen.
// Aufruf: node werkzeuge/erzeuge-testdaten.js  →  demo/kito-simulation.json
// Jeder simulierte Tag wird mit den Warnregeln der App geprüft; bei einer Warnung bricht das Skript ab.

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

// Fester Startwert für den Zufall: Jeder Lauf ergibt dieselben Daten.
let saat = 20261101;
function zufall() {
  saat = (saat * 1103515245 + 12345) % 2147483648;
  return saat / 2147483648;
}
const zwischen = (von, bis) => von + (bis - von) * zufall();

const WOCHEN = 34;
const START_KG = 9.32;
const ZIEL_KG = 7.2;
const heute = new Date();
heute.setHours(0, 0, 0, 0);
const start = new Date(heute.getFullYear(), heute.getMonth(), heute.getDate() - WOCHEN * 7);
const tagNr = (n) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + n);

const kito = { id: "kito", name: "Kito", art: "katze", geschlecht: "kater", kastriert: true };
const futter = [
  { id: "sheba", name: "Sheba Fresh n Fine in Sauce mit Geflügel", typ: "nass", kcalPro100g: 77, kcalQuelle: "geschaetzt", notiz: "Rezeptur Huhn, Geflügel & Truthahn (Werte vom Umkarton)" },
  { id: "purina", name: "Purina One Light", typ: "trocken", kcalPro100g: 327.5, kcalQuelle: "hersteller", notiz: "" },
  { id: "snack", name: "Leckerli (Simulation)", typ: "leckerli", kcalPro100g: 350, kcalQuelle: "packung", notiz: "" },
];

// Tierarzt-Kontrollen: Start mit 0,8 × RER(7,2 kg) ≈ 245 kcal; nach 12 Wochen wird die Abnahme langsamer
// → 10 % weniger (AAHA 2014); danach Kontrollen spätestens alle 3 Monate.
const freigaben = [
  { woche: 0, kcalProTag: 245, bcs: 8, mcs: "normal", notiz: "Simulation: Start 0,8 × RER(Ziel)" },
  { woche: 12, kcalProTag: 220, bcs: 7, mcs: "normal", notiz: "Simulation: Abnahme langsamer, −10 %" },
  { woche: 24, kcalProTag: 220, bcs: 6, mcs: "normal", notiz: "Simulation: Kontrolle, Plan bleibt" },
].map((f, i) => ({
  id: `freigabe-${i + 1}`,
  tierId: kito.id,
  datum: tagSchluessel(tagNr(f.woche * 7)),
  zielgewichtKg: ZIEL_KG,
  kcalProTag: f.kcalProTag,
  tierarzt: "Testpraxis (Simulation)",
  notiz: f.notiz,
  bcs: f.bcs,
  mcs: f.mcs,
}));

// Wochenabnahme in %: anfangs schneller, später langsamer – dann so skaliert, dass genau das Ziel herauskommt.
const roh = Array.from({ length: WOCHEN }, (_, w) => (w < 12 ? 0.95 : w < 24 ? 0.8 : 0.65) + zwischen(-0.1, 0.1));
const faktor = Math.log(ZIEL_KG / START_KG) / roh.reduce((s, r) => s + Math.log(1 - r / 100), 0);
let wahr = START_KG;
const gewichte = [];
for (let w = 0; w <= WOCHEN; w++) {
  if (w > 0) wahr *= Math.exp(faktor * Math.log(1 - roh[w - 1] / 100));
  // Waage auf 10 g genau, dazu ±15 g Messschwankung; Start und Ende exakt.
  const gemessen = w === 0 ? START_KG : w === WOCHEN ? ZIEL_KG : Math.round((wahr + zwischen(-0.015, 0.015)) * 100) / 100;
  gewichte.push({ id: `gewicht-${w}`, tierId: kito.id, kg: gemessen, datum: tagSchluessel(tagNr(w * 7)), notiz: w === 0 ? "Tierarzt (Simulation)" : "" });
}

// Mahlzeiten: morgens und abends je ein 50-g-Beutel Sheba, dazu Trockenfutter in zwei Portionen,
// an etwa drei Tagen pro Woche ein kleines Leckerli. Die Tagesmenge schwankt um ±4 % um die Freigabe.
const mahlzeiten = [];
const zeit = (tag, stunde, minute) => {
  const d = new Date(tag);
  d.setHours(stunde, minute, 0, 0);
  return d.toISOString();
};
for (let n = 0; n <= WOCHEN * 7; n++) {
  const tag = tagNr(n);
  const freigabe = aktuelleFreigabe(freigaben, tagSchluessel(tag));
  const ziel = freigabe.kcalProTag * zwischen(0.96, 1.04);
  const leckerli = zufall() < 3 / 7 ? Math.round(zwischen(2, 5)) : 0;
  const trocken = Math.round((ziel - 77 - leckerli * 3.5) / 3.275);
  const morgens = Math.round(trocken * 0.55);
  const neu = (futterId, gramm, stunde, minute) =>
    gramm > 0 && mahlzeiten.push({ id: `m-${mahlzeiten.length}`, tierId: kito.id, futterId, gramm, zeitpunkt: zeit(tag, stunde, minute) });
  neu("sheba", 50, 7, 10 + Math.floor(zwischen(0, 20)));
  neu("purina", morgens, 7, 35);
  neu("snack", leckerli, 15, 0);
  neu("sheba", 50, 18, 5 + Math.floor(zwischen(0, 20)));
  neu("purina", trocken - morgens, 21, 30);
}

// Prüfung mit den Regeln der App: Kein Tag darf eine Warnung auslösen – erlaubt ist nur "Ziel erreicht".
const heuteSchluessel = tagSchluessel(heute);
const futterMap = new Map(futter.map((f) => [f.id, f]));
const fehler = [];
for (let n = 0; n <= WOCHEN * 7; n++) {
  const tag = tagSchluessel(tagNr(n));
  const amTag = mahlzeitenAm(mahlzeiten, tag);
  const liste = warnungen({
    name: kito.name,
    tag,
    heute: heuteSchluessel,
    kcal: tagesSumme(amTag, futterMap).kcal,
    leckerli: leckerliKcal(amTag, futterMap),
    freigabe: aktuelleFreigabe(freigaben, tag),
    gewichte: gewichteBis(gewichte, tag),
    fruehereMahlzeiten: n > 0,
  }).filter((w) => w.id !== "ziel-erreicht");
  for (const w of liste) fehler.push(`${tag}: ${w.id} – ${w.text}`);
}
if (fehler.length) {
  console.error("Die Simulation verletzt Grenzen:\n" + fehler.join("\n"));
  process.exit(1);
}

// Besondere Tage (seit 0.33.0): ohne Zufall, damit Gewichte und Mahlzeiten gleich bleiben. Kein „Futter verweigert“,
// sonst stünde in der Demo der rote Notfall-Kasten. Eine laufende Phase zeigt auf „Heute“ den Knopf „Beendet“.
const letzterTag = WOCHEN * 7;
const besondereTage = [
  { art: "genascht", von: 40, bis: 40, notiz: "Simulation: ein paar Stücke vom Hundefutter" },
  { art: "mehr-bewegung", von: 61, bis: 61, notiz: "Simulation: lange im Garten gewesen" },
  { art: "genascht", von: 75, bis: 75, notiz: "Simulation: Maus gefangen" },
  { art: "krank", von: 15 * 7 + 2, bis: 15 * 7 + 4, notiz: "Simulation: Magen verstimmt, Tierarzt angerufen" },
  { art: "genascht", von: 130, bis: 130, notiz: "Simulation: vom Teller stibitzt" },
  { art: "futterumstellung", von: 20 * 7, bis: 20 * 7 + 6, notiz: "Simulation: neue Sorte langsam untergemischt" },
  { art: "genascht", von: letzterTag - 12, bis: letzterTag - 12, notiz: "Simulation: ein paar Stücke vom Hundefutter" },
  { art: "weniger-bewegung", von: letzterTag - 9, bis: null, notiz: "Simulation: Regenwetter, nur drinnen" },
].map((b, i) => ({
  id: `besonders-${i + 1}`,
  tierId: kito.id,
  art: b.art,
  von: tagSchluessel(tagNr(b.von)),
  bis: b.bis === null ? null : tagSchluessel(tagNr(b.bis)),
  notiz: b.notiz,
}));

const sicherung = { version: VERSION, tiere: [kito], futter, mahlzeiten, gewichte, freigaben, besondereTage };
writeFileSync(new URL("../demo/kito-simulation.json", import.meta.url), JSON.stringify(sicherung));
const wochenRaten = gewichte.slice(1).map((g, i) => ((gewichte[i].kg - g.kg) / gewichte[i].kg) * 100);
console.log(
  `OK: ${WOCHEN} Wochen (${tagSchluessel(start)} bis ${heuteSchluessel}), ${gewichte.length} Wägungen, ` +
    `${mahlzeiten.length} Mahlzeiten, ${freigaben.length} Freigaben, ${besondereTage.length} besondere Tage – keine Warnung.\n` +
    `Abnahme pro Woche: ${Math.min(...wochenRaten).toFixed(2)} bis ${Math.max(...wochenRaten).toFixed(2)} % (einzelne Wochen), ` +
    `über 4 Wochen zuletzt ${abnahmeProWoche(gewichte, 28).prozent.toFixed(2)} %.`
);
