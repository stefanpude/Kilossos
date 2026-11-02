// Alle Daten von Kilossos liegen als ein JSON-Dokument im Speicher des Geräts (kein Server, keine Cloud).
// Aufbau (Version 1):
//   tiere:      { id, name, art, geschlecht, kastriert, foto? }
//               foto: optional, "data:image/jpeg;base64,…" (256 × 256 px, in der App zugeschnitten)
//   futter:     { id, name, typ: "nass" | "trocken" | "leckerli", kcalPro100g, kcalQuelle, notiz, listeId? }
//               listeId: Kennung in der Kilossos-Futterliste (js/futterliste.js), wenn die Sorte von dort stammt
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
        listeId: "sheba-fresh-fine-huhn-gefluegel-truthahn",
        name: "Sheba Fresh n Fine in Sauce mit Geflügel",
        typ: "nass",
        kcalPro100g: 71,
        kcalQuelle: "hersteller",
        notiz:
          "Rezeptur „Huhn, Geflügel & Truthahn in Sauce“ (EAN 4770608260286), Angaben laut zooplus.de (11/2026): Protein 7,7 %, Fett 3,9 %, Asche 1,8 %, Faser 0,2 %, Feuchte 84,7 %; 35,5 kcal je 50-g-Beutel. Eigene Nachrechnung (NRC 2006): 70,7.",
      },
      {
        id: neueId(),
        listeId: "purina-one-light-trocken",
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

// Profilbild: nur echte JPEG- oder PNG-Bilder und nicht zu groß – eine Sicherungsdatei kann von irgendwoher kommen.
export const FOTO_MAX_ZEICHEN = 300 * 1024;

// Nach dem Präfix nur Base64-Zeichen: so kann kein Anführungszeichen oder Code in die Seite gelangen.
const FOTO_MUSTER = /^data:image\/(jpeg|png);base64,[A-Za-z0-9+/]+={0,2}$/;

export function fotoGueltig(foto) {
  return typeof foto === "string" && foto.length <= FOTO_MAX_ZEICHEN && FOTO_MUSTER.test(foto);
}

// Entfernt ungültige Profilbilder (z. B. aus einer eingelesenen Sicherung); alle anderen Daten bleiben.
export function fotoBereinigen(daten) {
  let entfernt = 0;
  for (const tier of daten.tiere) {
    if ("foto" in tier && !fotoGueltig(tier.foto)) {
      delete tier.foto;
      entfernt += 1;
    }
  }
  return entfernt;
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
    const altPurina =
      futter.name === "Purina One Light" &&
      ((futter.kcalPro100g === 360 && futter.kcalQuelle === "ungefaehr") ||
        (futter.kcalPro100g === 346 && futter.kcalQuelle === "geschaetzt"));
    // Bis 0.5.0 stand hier der Wert einer anderen Sheba-Rezeptur (77 kcal, "Huhn, Truthahn & Ente").
    const altSheba =
      futter.name === "Sheba Fresh n Fine in Sauce mit Geflügel" &&
      futter.kcalPro100g === 77 &&
      futter.kcalQuelle === "packung" &&
      !futter.notiz;
    const alt = altPurina || altSheba;
    if (alt) {
      const neu = neueStartwerte.find((f) => f.name === futter.name);
      Object.assign(futter, { kcalPro100g: neu.kcalPro100g, kcalQuelle: neu.kcalQuelle, notiz: neu.notiz });
      geaendert = true;
    }
    // Seit 0.6.0 wissen die beiden Startsorten, zu welchem Eintrag der Futterliste sie gehören.
    const start = neueStartwerte.find((f) => f.name === futter.name);
    if (start && !futter.listeId) {
      futter.listeId = start.listeId;
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

// ---------- Sicherungs-Erinnerung ----------
// Der Tag der letzten Sicherung liegt in einem eigenen Schlüssel, nicht in den Daten selbst:
// So bleibt er beim Einlesen einer alten Sicherung richtig und steckt nicht in der Sicherungsdatei.
const SICHERUNG_SCHLUESSEL = "kilossos-letzte-sicherung";
export const SICHERUNG_ALLE_TAGE = 14;
const ERSTE_SICHERUNG_NACH_TAGEN = 7;

export function letzteSicherung(speicher = localStorage) {
  return speicher.getItem(SICHERUNG_SCHLUESSEL);
}

export function sicherungMerken(tag, speicher = localStorage) {
  speicher.setItem(SICHERUNG_SCHLUESSEL, tag);
}

// Wann eine Erinnerung fällig ist (alle Tage als "JJJJ-MM-TT"); null = keine Erinnerung.
// Ohne Einträge gibt es nichts zu sichern. Noch nie gesichert: 7 Tage nach dem ersten Eintrag.
// Sonst: wenn die letzte Sicherung 14 Tage oder länger her ist und es danach neue Einträge gab.
export function sicherungsHinweis({ letzte, ersterEintrag, letzterEintrag, heute }) {
  if (!ersterEintrag) return null;
  const tage = (von, bis) => {
    const ms = (iso) => {
      const [j, m, t] = iso.split("-").map(Number);
      return Date.UTC(j, m - 1, t);
    };
    return Math.round((ms(bis) - ms(von)) / 86400000);
  };
  if (!letzte) {
    const seit = tage(ersterEintrag, heute);
    return seit >= ERSTE_SICHERUNG_NACH_TAGEN ? { nieGesichert: true, tage: seit } : null;
  }
  const seit = tage(letzte, heute);
  if (seit < SICHERUNG_ALLE_TAGE || letzterEintrag <= letzte) return null;
  return { nieGesichert: false, tage: seit };
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
