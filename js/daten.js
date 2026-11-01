// Alle Daten von Kilossos liegen als ein JSON-Dokument im Speicher des Geräts (kein Server, keine Cloud).
// Aufbau (Version 1):
//   tiere:      { id, name, art, geschlecht, kastriert }
//   futter:     { id, name, typ: "nass" | "trocken" | "leckerli", kcalPro100g, kcalQuelle, notiz }
//               kcalQuelle: "packung" (genau abgelesen) | "ungefaehr" | "geschaetzt" (aus Bestandteilen berechnet)
//   mahlzeiten: { id, tierId, futterId, gramm, zeitpunkt (ISO-Zeit) }
//   gewichte:   { id, tierId, kg, datum ("JJJJ-MM-TT"), notiz }
//   freigaben:  { id, tierId, datum, zielgewichtKg, kcalProTag, tierarzt, notiz }  – Oberfläche folgt in Schritt 4
// Die kcal einer Mahlzeit werden immer aus dem aktuellen Futterwert berechnet: Wird ein ungefährer Wert
// später durch den genauen Packungswert ersetzt, stimmen damit auch alle früheren Tage.

const SCHLUESSEL = "kilossos-daten";
export const VERSION = 1;

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
        kcalPro100g: 346,
        kcalQuelle: "geschaetzt",
        notiz:
          "Packung nennt keine kcal. Berechnet aus Protein 37 %, Fett 9,5 %, Asche 7,5 %, Faser 6 %, Feuchte angenommen 8 % (NRC 2006); Spanne 339–353.",
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
  const text = speicher.getItem(SCHLUESSEL);
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
    const alt = futter.name === "Purina One Light" && futter.kcalPro100g === 360 && futter.kcalQuelle === "ungefaehr";
    if (alt) {
      const neu = neueStartwerte.find((f) => f.name === futter.name);
      Object.assign(futter, { kcalPro100g: neu.kcalPro100g, kcalQuelle: neu.kcalQuelle, notiz: neu.notiz });
      geaendert = true;
    }
  }
  return geaendert;
}

export function speichern(daten, speicher = localStorage) {
  speicher.setItem(SCHLUESSEL, JSON.stringify(daten));
}

// Bittet den Browser, die Daten nicht bei Speicherknappheit automatisch zu löschen.
export async function dauerhaftSpeichern() {
  if (navigator.storage && navigator.storage.persist) {
    return navigator.storage.persist();
  }
  return false;
}

export function futterNachId(daten) {
  return new Map(daten.futter.map((futter) => [futter.id, futter]));
}
