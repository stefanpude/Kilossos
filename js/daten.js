// Alle Daten von Kilossos liegen als ein JSON-Dokument im Speicher des Geräts (kein Server, keine Cloud).
// Aufbau (Version 1):
//   tiere:      { id, name, art, geschlecht, kastriert }
//   futter:     { id, name, typ: "nass" | "trocken" | "leckerli", kcalPro100g, kcalQuelle, notiz }
//               kcalQuelle: "packung" (genau abgelesen) | "hersteller" (Herstellerangabe, z. B. Website)
//                         | "geschaetzt" (aus Bestandteilen berechnet) | "ungefaehr"
//   mahlzeiten: { id, tierId, futterId, gramm, zeitpunkt (ISO-Zeit) }
//   gewichte:   { id, tierId, kg, datum ("JJJJ-MM-TT"), notiz }
//   freigaben:  { id, tierId, datum, zielgewichtKg, kcalProTag, tierarzt, notiz }  – Oberfläche folgt in Schritt 4
// Die kcal einer Mahlzeit werden immer aus dem aktuellen Futterwert berechnet: Wird ein ungefährer Wert
// später durch den genauen Packungswert ersetzt, stimmen damit auch alle früheren Tage.

const SCHLUESSEL = "kilossos-daten";
const DEMO_SCHLUESSEL = "kilossos-demo";
export const VERSION = 1;

// Im Demo-Modus (Link mit "?demo") gehen alle Lese- und Schreibzugriffe in einen eigenen Speicherplatz.
// Die echten Einträge unter "kilossos-daten" werden dabei nie angefasst.
let schluessel = SCHLUESSEL;
export function demoModus(an) {
  schluessel = an ? DEMO_SCHLUESSEL : SCHLUESSEL;
}

export function neueId() {
  return crypto.randomUUID();
}

function startDaten() {
  const kitoId = neueId();
  return {
    version: VERSION,
    tiere: [{ id: kitoId, name: "Kito", art: "katze", geschlecht: "kater", kastriert: true }],
    futter: [
      {
        id: neueId(),
        name: "Sheba Fresh n Fine in Sauce mit Geflügel",
        typ: "nass",
        kcalPro100g: 77,
        kcalQuelle: "packung",
        notiz: "",
      },
      {
        id: neueId(),
        name: "Purina One Light",
        typ: "trocken",
        kcalPro100g: 327.5,
        kcalQuelle: "hersteller",
        notiz:
          "Herstellerangabe purina.co.uk (11/2026), gleiche Nährwerte wie die deutsche Packung (Protein 37 %, Fett 9,5 %, Asche 7,5 %, Faser 6 %). Die Packung selbst nennt keine kcal. Eigene Nachrechnung (NRC 2006): 339–353.",
      },
    ],
    mahlzeiten: [],
    gewichte: [],
    freigaben: [],
  };
}

export function istGueltig(daten) {
  return (
    daten !== null &&
    typeof daten === "object" &&
    daten.version === VERSION &&
    ["tiere", "futter", "mahlzeiten", "gewichte", "freigaben"].every((feld) => Array.isArray(daten[feld])) &&
    daten.tiere.length > 0
  );
}

export function laden(speicher = localStorage) {
  const text = speicher.getItem(schluessel);
  if (text === null) {
    const daten = startDaten();
    speichern(daten, speicher);
    return daten;
  }
  const daten = JSON.parse(text);
  if (!istGueltig(daten)) {
    throw new Error("Die gespeicherten Daten haben ein unbekanntes Format.");
  }
  if (startwerteAktualisieren(daten)) speichern(daten, speicher);
  return daten;
}

// Ersetzt veraltete Startwerte aus früheren Versionen – aber nur, wenn sie noch unverändert sind.
// Was Stefan selbst geändert hat, bleibt immer stehen.
function startwerteAktualisieren(daten) {
  const neueStartwerte = startDaten().futter;
  let geaendert = false;
  for (const futter of daten.futter) {
    const alt =
      futter.name === "Purina One Light" &&
      ((futter.kcalPro100g === 360 && futter.kcalQuelle === "ungefaehr") ||
        (futter.kcalPro100g === 346 && futter.kcalQuelle === "geschaetzt"));
    if (alt) {
      const neu = neueStartwerte.find((f) => f.name === futter.name);
      Object.assign(futter, { kcalPro100g: neu.kcalPro100g, kcalQuelle: neu.kcalQuelle, notiz: neu.notiz });
      geaendert = true;
    }
  }
  return geaendert;
}

export function speichern(daten, speicher = localStorage) {
  speicher.setItem(schluessel, JSON.stringify(daten));
}

// Bittet den Browser, die Daten nicht bei Speicherknappheit automatisch zu löschen.
export async function dauerhaftSpeichern() {
  if (navigator.storage && navigator.storage.persist) {
    return navigator.storage.persist();
  }
  return false;
}

// Verschiebt alle Datumsangaben um "tage" Tage – damit die Demo-Simulation immer am heutigen Tag endet.
export function verschiebeDaten(daten, tage) {
  const tag = (iso) => {
    const [j, m, t] = iso.split("-").map(Number);
    const d = new Date(j, m - 1, t + tage);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };
  const zeitpunkt = (iso) => {
    const d = new Date(iso);
    d.setDate(d.getDate() + tage); // Ortszeit: Uhrzeit bleibt auch über die Zeitumstellung gleich
    return d.toISOString();
  };
  return {
    ...daten,
    mahlzeiten: daten.mahlzeiten.map((m) => ({ ...m, zeitpunkt: zeitpunkt(m.zeitpunkt) })),
    gewichte: daten.gewichte.map((g) => ({ ...g, datum: tag(g.datum) })),
    freigaben: daten.freigaben.map((f) => ({ ...f, datum: tag(f.datum) })),
  };
}

export function futterNachId(daten) {
  return new Map(daten.futter.map((futter) => [futter.id, futter]));
}
