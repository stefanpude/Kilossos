// Erzeugt eine SIMULIERTE Kilossos-Sicherung mit zwei Katzen, innerhalb aller Grenzen aus docs/sicherheitsgrenzen.md:
// seit 0.55.0 ein ganzes Jahr (52 Wochen) für den Tierarzttermin: Kito 9,32 → 6,0 kg, Zuki 7,0 → 4,0 kg, beide Ziele
// am Ende erreicht. Die Zielgewichte sind Beispiele von Stefan, kein Wert vom Tierarzt. Alle Zahlen sind ausgedacht.
// Die App zeigt die Sicherung im Demo-Modus (Link mit "?demo") in einem eigenen Speicherplatz an.
// Nie über "Sicherung einlesen" laden – das würde die echten Einträge ersetzen.
// Aufruf: node werkzeuge/erzeuge-testdaten.js  →  demo/kito-simulation.json (Name bleibt, enthält Kito und Zuki)
// Jeder simulierte Tag wird je Tier mit den Warnregeln der App geprüft; bei einer Warnung bricht das Skript ab.
// Seit 0.76.0 „wie aus dem Alltag“ (Stefan 06.11.2026): Zeiten schwanken, am Wochenende später, mal 1 oder 3 Beutel
// Sheba, Trockenfutter in runden Grammzahlen, verschiedene Leckerlis aus der Futterliste, Wiegetag mal einen Tag
// früher oder später. Kito bekommt an 5 von 7 Tagen ca. 20 g Tatar (Stefans Alltag), Zuki nie.

import { writeFileSync } from "node:fs";
import { VERSION } from "../js/daten.js";
import { FUTTERLISTE, ausListe } from "../js/futterliste.js";
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
  {
    id: "tatar",
    name: "Rindertatar, roh, ungewürzt",
    typ: "frischfleisch",
    kcalPro100g: 137,
    kcalQuelle: "ungefaehr",
    notiz:
      "Wert aus USDA FoodData Central 171790 (Rinderhack 95 % mager / 5 % Fett, roh). Tatar hat in Deutschland " +
      "höchstens etwa 6 % Fett. Steht auf der Packung ein Wert, gilt die Packung.",
  },
  // Leckerlis als Kopien aus der Kilossos-Futterliste, wie beim Antippen von „Aus der Futterliste wählen“.
  ...[
    ["dreamies", "dreamies-huhn"],
    ["crispies", "felix-crispies"],
    ["knuspertaschen", "whiskas-knuspertaschen-huhn-kaese"],
  ].map(([id, listeId]) => ausListe(FUTTERLISTE.find((e) => e.id === listeId), id)),
];
const futterMap = new Map(futter.map((f) => [f.id, f]));
const LECKERLIS = futter.filter((f) => f.typ === "leckerli");
const BEUTEL_G = 50;
const kcal = (id, gramm) => (gramm * futterMap.get(id).kcalPro100g) / 100;

// Zeitpunkt aus Tag und Minuten nach Mitternacht (über 59 Minuten rechnet Date selbst in Stunden um).
const zeit = (tag, minuten) => {
  const d = new Date(tag);
  d.setHours(0, Math.round(minuten), 0, 0);
  return d.toISOString();
};
const uhr = ([stunde, minute]) => stunde * 60 + minute;
const auf5 = (gramm) => Math.round(gramm / 5) * 5;

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
  // Wiegetag (seit 0.76.0): ab und zu einen Tag früher oder später, nie zwei Wochen nacheinander (Abstand bleibt 6–8
  // Tage). Erstes Wiegen (Tierarzt, Tag der ersten Freigabe) und letztes (Verschiebung auf heute) bleiben fest.
  let verschoben = 0;
  for (let w = 0; w <= p.wochen; w++) {
    const wuerfel = zufall();
    verschoben = w === 0 || w === p.wochen || verschoben !== 0 || wuerfel >= 0.2 ? 0 : wuerfel < 0.1 ? -1 : 1;
    if (w > 0) wahr *= Math.exp(faktor * Math.log(1 - roh[w - 1] / 100));
    // Waage auf 10 g genau, dazu eine kleine Messschwankung; der Start (Tierarzt) exakt, bei "zielGenau" auch das Ende.
    const exakt = w === 0 ? p.startKg : p.zielGenau && w === p.wochen ? p.zielKg : null;
    const gemessen = exakt ?? Math.round((wahr + zwischen(-p.schwankung, p.schwankung)) * 100) / 100;
    gewichte.push({
      id: `${p.praefix}gewicht-${w}`,
      tierId: p.tier.id,
      kg: gemessen,
      datum: tagSchluessel(tagNr(w * 7 + verschoben)),
      notiz: w === 0 ? "Tierarzt (Simulation)" : "",
    });
  }

  // Mahlzeiten wie im Alltag (seit 0.76.0): meist morgens und abends je ein 50-g-Beutel Sheba, an manchen Tagen nur
  // einer oder ein dritter mittags. Kito bekommt an 5 von 7 Tagen mittags ca. 20 g Tatar, ab und zu gibt es ein
  // Leckerli. Trockenfutter füllt den Rest bis zur Freigabe (±2,5 %), auf 5 g gerundet in zwei Portionen; ist zu wenig
  // herausgekommen, landen schon mal 1–2 g mehr im Napf. Am Wochenende gibt es Frühstück 1 bis 1,5 Stunden später.
  const mahlzeiten = [];
  const z = p.zeiten;
  let tatarTage = new Set();
  for (let n = 0; n <= letzterTag; n++) {
    const tag = tagNr(n);
    if (n % 7 === 0) {
      // Je Woche (ab dem Starttag) genau „p.tatar.tage“ Tatar-Tage, zufällig verteilt.
      const reihe = [0, 1, 2, 3, 4, 5, 6].map((t) => [zufall(), t]).sort((a, b) => a[0] - b[0]);
      tatarTage = new Set(p.tatar ? reihe.slice(0, p.tatar.tage).map(([, t]) => n + t) : []);
    }
    const wochenende = [0, 6].includes(tag.getDay());
    const spaeter = wochenende ? zwischen(60, 90) : 0;
    const freigabe = aktuelleFreigabe(freigaben, tagSchluessel(tag));
    const ziel = freigabe.kcalProTag * zwischen(0.975, 1.025);

    const wurf = zufall();
    const beutel = wurf < 0.06 ? 1 : wurf < 0.12 ? 3 : 2;
    const tatar = tatarTage.has(n) ? Math.round(zwischen(p.tatar.von, p.tatar.bis)) : 0;
    const leckerliSorte = LECKERLIS[Math.floor(zufall() * LECKERLIS.length)].id;
    const leckerli = zufall() < p.leckerli.anteil ? Math.round(zwischen(p.leckerli.von, p.leckerli.bis)) : 0;

    const rest = ziel - kcal("sheba", beutel * BEUTEL_G) - kcal("tatar", tatar) - kcal(leckerliSorte, leckerli);
    const genau = rest / (futterMap.get("purina").kcalPro100g / 100);
    const trocken = auf5(genau);
    const morgens = auf5(trocken * 0.55);
    // Abgerundet: Abends rutscht noch etwas nach (1–2 g), wie beim Einfüllen ohne genaues Nachwiegen.
    const nachgerutscht = trocken < genau - 0.5 && zufall() < 0.5 ? Math.round(zwischen(1, 2)) : 0;

    const neu = (futterId, gramm, minuten) =>
      gramm > 0 &&
      mahlzeiten.push({
        id: `${p.praefix}m-${mahlzeiten.length}`,
        tierId: p.tier.id,
        futterId,
        gramm,
        zeitpunkt: zeit(tag, minuten),
      });
    const fruehstueck = uhr(z.nassMorgens) + spaeter + zwischen(-15, 25);
    neu("sheba", BEUTEL_G, fruehstueck);
    neu("purina", morgens, fruehstueck + zwischen(15, 35));
    if (beutel === 3) neu("sheba", BEUTEL_G, uhr([13, 0]) + zwischen(-40, 40));
    neu("tatar", tatar, uhr(z.tatar ?? [12, 30]) + zwischen(-45, 45));
    neu(leckerliSorte, leckerli, zwischen(uhr([14, 0]), uhr([20, 0])));
    if (beutel >= 2) neu("sheba", BEUTEL_G, uhr(z.nassAbends) + zwischen(-20, 35) + spaeter / 3);
    neu("purina", trocken - morgens + nachgerutscht, uhr(z.trockenAbends) + zwischen(-30, 40));
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

// Kito (seit 0.55.0): ein Jahr, 9,32 → 6,0 kg (im Mittel gut 0,8 % pro Woche). Kontrolle alle 12 Wochen mit neuer
// Freigabe; die kcal sinken mit dem Gewicht, bleiben aber über RER(6,0 kg) ≈ 268 kcal, damit normales Futter reicht
// (sonst Diätfutter-Hinweis, AAHA 2021). Realistisch: anfangs schneller, über die Feiertage (Wochen 6–8) langsamer,
// später langsamer. BCS sinkt von 8 auf 5.
const kito = simuliere({
  tier: { id: "kito", name: "Kito", art: "katze", geschlecht: "kater", kastriert: true },
  praefix: "",
  zufall: zufallsStrom(20261101),
  wochen: 52,
  versatz: 0,
  startKg: 9.32,
  zielKg: 6.0,
  zielGenau: true,
  rate: (w) => (w >= 6 && w <= 8 ? 0.65 : w < 12 ? 1.05 : w < 24 ? 0.95 : w < 36 ? 0.8 : 0.7),
  schwankung: 0.015,
  freigaben: [
    { woche: 0, kcalProTag: 300, bcs: 8, mcs: "normal", notiz: "Simulation: Start, Ziel 6,0 kg als Beispiel" },
    { woche: 12, kcalProTag: 290, bcs: 8, mcs: "normal", notiz: "Simulation: Kontrolle, Abnahme gut, etwas weniger" },
    { woche: 24, kcalProTag: 280, bcs: 7, mcs: "normal", notiz: "Simulation: Kontrolle, an das neue Gewicht angepasst" },
    { woche: 36, kcalProTag: 275, bcs: 6, mcs: "normal", notiz: "Simulation: Kontrolle, Plan bleibt fast gleich" },
    { woche: 48, kcalProTag: 270, bcs: 5, mcs: "normal", notiz: "Simulation: Ziel fast erreicht, danach Gewicht halten besprechen" },
  ],
  leckerli: { anteil: 3 / 7, von: 2, bis: 5 },
  // Tatar (seit 0.76.0): an 5 von 7 Tagen 18–23 g, 137 kcal/100 g (USDA FDC 171790), zählt in die Tageskalorien.
  tatar: { tage: 5, von: 18, bis: 23 },
  zeiten: { nassMorgens: [7, 10], tatar: [12, 30], nassAbends: [18, 5], trockenAbends: [21, 30] },
  // Kein „Futter verweigert“, sonst stünde in der Demo der rote Notfall-Kasten. Eine laufende Phase zeigt auf
  // „Heute“ den Knopf „Beendet“.
  besondereTage: (letzterTag) => [
    { art: "genascht", von: 40, bis: 40, notiz: "Simulation: ein paar Stücke vom Hundefutter" },
    { art: "genascht", von: 47, bis: 47, notiz: "Simulation: Feiertage, vom Festessen genascht" },
    { art: "mehr-bewegung", von: 61, bis: 61, notiz: "Simulation: lange im Garten gewesen" },
    { art: "genascht", von: 75, bis: 75, notiz: "Simulation: Maus gefangen" },
    { art: "krank", von: 15 * 7 + 2, bis: 15 * 7 + 4, notiz: "Simulation: Magen verstimmt, Tierarzt angerufen" },
    { art: "genascht", von: 130, bis: 130, notiz: "Simulation: vom Teller stibitzt" },
    { art: "futterumstellung", von: 20 * 7, bis: 20 * 7 + 6, notiz: "Simulation: neue Sorte langsam untergemischt" },
    { art: "mehr-bewegung", von: 30 * 7, bis: 32 * 7, notiz: "Simulation: Baustelle fertig, wieder draußen" },
    { art: "genascht", von: letzterTag - 12, bis: letzterTag - 12, notiz: "Simulation: ein paar Stücke vom Hundefutter" },
    { art: "weniger-bewegung", von: letzterTag - 9, bis: null, notiz: "Simulation: Regenwetter, nur drinnen" },
  ],
});

// Zuki (seit 0.55.0): zierlich, im Verhältnis dicker als Kito, ein Jahr 7,0 → 4,0 kg (im Mittel gut 1 % pro Woche).
// Freigaben sinken von 230 auf 200 kcal, bleiben über RER(4,0 kg) ≈ 198 kcal. BCS 9 → 5. Gewogen 2 Tage vor Kito,
// damit die Demo beim Verschieben auf heute (neuestes Gewicht über alle Tiere = Kitos) beide sinnvoll zeigt.
// Kleinere Leckerlis, damit sie bei der kleineren Tagesmenge unter 10 % bleiben. Getrennt gefüttert, eigene Zeiten.
const zuki = simuliere({
  tier: { id: "zuki", name: "Zuki", art: "katze", geschlecht: "katze", kastriert: true, koerperbau: "zierlich" },
  praefix: "zuki-",
  zufall: zufallsStrom(20261106),
  wochen: 52,
  versatz: 2,
  startKg: 7.0,
  zielKg: 4.0,
  zielGenau: true,
  rate: (w) => (w >= 6 && w <= 8 ? 0.8 : w < 12 ? 1.3 : w < 24 ? 1.15 : w < 36 ? 1.0 : 0.9),
  schwankung: 0.008,
  freigaben: [
    { woche: 0, kcalProTag: 230, bcs: 9, mcs: "normal", notiz: "Simulation: Start, Ziel 4,0 kg als Beispiel" },
    { woche: 12, kcalProTag: 220, bcs: 8, mcs: "normal", notiz: "Simulation: Kontrolle, Abnahme gut, etwas weniger" },
    { woche: 24, kcalProTag: 210, bcs: 7, mcs: "normal", notiz: "Simulation: Kontrolle, an das neue Gewicht angepasst" },
    { woche: 36, kcalProTag: 205, bcs: 6, mcs: "normal", notiz: "Simulation: Kontrolle, Plan bleibt fast gleich" },
    { woche: 48, kcalProTag: 200, bcs: 5, mcs: "normal", notiz: "Simulation: Ziel fast erreicht, danach Gewicht halten besprechen" },
  ],
  leckerli: { anteil: 2 / 7, von: 1, bis: 3 },
  tatar: null, // Zuki bekommt kein Tatar
  zeiten: { nassMorgens: [6, 45], nassAbends: [17, 50], trockenAbends: [21, 15] },
  besondereTage: () => [
    { art: "genascht", von: 48, bis: 48, notiz: "Simulation: Feiertage, Sahne vom Tisch geschleckt" },
    { art: "mehr-bewegung", von: 9 * 7 + 3, bis: 9 * 7 + 3, notiz: "Simulation: lange mit der Federangel gespielt" },
    { art: "futterumstellung", von: 20 * 7, bis: 20 * 7 + 6, notiz: "Simulation: neue Sorte langsam untergemischt" },
    { art: "genascht", von: 33 * 7 + 4, bis: 33 * 7 + 4, notiz: "Simulation: am Napf von Kito genascht" },
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
