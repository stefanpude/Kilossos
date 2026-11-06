// Alle Daten von Kilossos liegen als ein JSON-Dokument im Speicher des Geräts (kein Server, keine Cloud).
// Seit 0.27.0 wird erst gespeichert, wenn der Halter beim ersten Start seine Katze angelegt hat (ohne Startfutter).
// Aufbau (Version 1):
//   tiere:      { id, name, art, geschlecht, kastriert, foto?, geburtsdatum?, koerperbau?, haltung?, schlankKg?,
//                 tierarzt?: { praxis?, telefon?, adresse? }, wiegetag? }
//               foto: optional, "data:image/jpeg;base64,…" (256 × 256 px, in der App zugeschnitten)
//               übrige Profilfelder: siehe js/profil.js (dort auch die Prüfung beim Einlesen)
//   futter:     { id, name, typ: "nass" | "trocken" | "leckerli", kcalPro100g, kcalQuelle, notiz, listeId? }
//               listeId: Kennung in der Kilossos-Futterliste (js/futterliste.js), wenn die Sorte von dort stammt
//               analyse: optional, { protein, fett, asche, faser, feuchte } in % von der Packung, feuchte null = nicht
//                        angegeben; aus dem Rechner im Fenster „Eigene Sorte“ (seit 0.32.0). Ältere Sorten haben das Feld
//                        nicht, Kopien aus der Futterliste auch nicht (dort stehen die Werte in der Notiz).
//               kcalQuelle: "packung" (genau abgelesen) | "hersteller" (Herstellerangabe, z. B. Website)
//                         | "geschaetzt" (aus Bestandteilen berechnet) | "ungefaehr"
//   mahlzeiten: { id, tierId, futterId, gramm, zeitpunkt (ISO-Zeit) }
//   gewichte:   { id, tierId, kg, datum ("JJJJ-MM-TT"), notiz, foto? }
//               foto: optional, wie beim Tier (256 × 256 px JPEG), Monatsfoto, Regeln in js/fotos.js (seit 0.25.0, monatlich seit 0.26.0)
//   freigaben:  { id, tierId, datum, zielgewichtKg, kcalProTag, tierarzt, notiz, bcs?, mcs? }
//               bcs: optional, Body Condition Score vom Tierarzt, ganze Zahl 1–9 (seit 0.12.0)
//               mcs: optional, Muscle Condition Score vom Tierarzt, Schlüssel aus MCS (seit 0.12.0)
//               Ältere Freigaben haben beide Felder nicht – sie bleiben ohne Umwandlung gültig.
//   besondereTage: { id, tierId, art, von ("JJJJ-MM-TT"), bis ("JJJJ-MM-TT" | null), notiz } (seit 0.33.0)
//               Ereignis oder Phase, z. B. krank oder genascht; ohne kcal und Gramm, ohne Einfluss auf Rechnungen.
//               bis gleich von: ein Tag; bis später: abgeschlossene Phase; bis null: Phase läuft noch.
//               art: Schlüssel aus js/besondere-tage.js; unbekannte Schlüssel (neuere Fassung) bleiben und heißen „Sonstiges“.
//               Ältere Daten haben die Liste nicht: eintraegeBereinigen legt sie leer an (istGueltig verlangt sie nicht).
// Die kcal einer Mahlzeit werden immer aus dem aktuellen Futterwert berechnet: Wird ein ungefährer Wert
// später durch den genauen Packungswert ersetzt, stimmen damit auch alle früheren Tage.

const SCHLUESSEL = "kilossos-daten";
const DEMO_SCHLUESSEL = "kilossos-demo";
export const VERSION = 1;

// Im Demo-Modus (Link mit "?demo") gehen alle Lese- und Schreibzugriffe in einen eigenen Speicherplatz.
// Die echten Einträge unter "kilossos-daten" werden dabei nie angefasst.
// Einträge, die laden() als beschädigt aussortiert hat (nur zur Sicherheit aufgehoben, die App liest sie nicht).
export const ENTFERNT_SCHLUESSEL = "kilossos-entfernt";
let schluessel = SCHLUESSEL;
export function demoModus(an) {
  schluessel = an ? DEMO_SCHLUESSEL : SCHLUESSEL;
}

export function neueId() {
  return crypto.randomUUID();
}

// „Gewicht ändern“ (0.31.0): ändert die gespeicherte Wägung selbst, statt eine zweite anzulegen.
// Kennung, Tier und Monatsfoto bleiben; die Notiz wird wie beim Eintragen ohne Leerzeichen am Rand gespeichert.
export function waegungAendern(waegung, { kg, datum, notiz }) {
  Object.assign(waegung, { kg, datum, notiz: String(notiz ?? "").trim() });
}

// Die beiden Sorten, mit denen Installationen bis 0.26.0 starteten (Kitos Futter). Seit 0.27.0 legt eine
// frische Installation kein Futter mehr an; die Liste wird nur noch gebraucht, um alte Stände umzustellen
// (startwerteAktualisieren) und in den Tests. Jeder Aufruf liefert neue Kennungen.
export function alteStartsorten() {
  return [
    {
      id: neueId(),
      listeId: "sheba-fresh-fine-huhn-gefluegel-truthahn",
      name: "Sheba Fresh n Fine in Sauce mit Geflügel",
      typ: "nass",
      kcalPro100g: 77,
      kcalQuelle: "geschaetzt",
      notiz:
        "Rezeptur „Huhn, Geflügel & Truthahn in Sauce“ (EAN 4770608260286), Angaben vom Umkarton (Megapack, 11/2026): Protein 7,9 %, Fett 4,4 %, Asche 1,4 %, Faser 0,3 %, Feuchte 84,0 %. Die Packung nennt keine kcal; aus den Bestandteilen berechnet (NRC 2006): 76,6, also etwa 38,5 kcal je 50-g-Beutel.",
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
  ];
}

// Neue Daten mit genau einem Tier, so wie es der Halter in der Einrichtung beim ersten Start angibt.
// Kein Futter vorbelegt (seit 0.27.0). Wiegetag und Foto sind freiwillig und fehlen dann ganz.
export function ersteDaten({ name, geschlecht, kastriert, foto, wiegetag }) {
  const tier = { id: neueId(), name, art: "katze" };
  if (geschlecht !== undefined) tier.geschlecht = geschlecht;
  tier.kastriert = kastriert;
  if (foto !== undefined) tier.foto = foto;
  if (wiegetag !== undefined) tier.wiegetag = wiegetag;
  return { version: VERSION, tiere: [tier], futter: [], mahlzeiten: [], gewichte: [], freigaben: [], besondereTage: [] };
}

// Noch nichts gespeichert: frische Installation (oder nach „Alle Daten löschen“). Dann zeigt die App die Einrichtung.
export function istErsterStart(speicher = localStorage) {
  return speicher.getItem(schluessel) === null;
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

// ---------- Einträge prüfen (Sicherungen können von irgendwoher kommen) ----------
// Wirft Einträge raus, deren Pflichtfelder fehlen oder den falschen Typ haben. Sonst stürzt das Zeichnen ab
// (Fund 04.11.2026: ein null in "gewichte" legte „Heute“ lahm). Gibt die Zahl der Änderungen zurück.
const istObjekt = (x) => x !== null && typeof x === "object" && !Array.isArray(x);
const istText = (x) => typeof x === "string" && x.length > 0;
const istZahl = (x) => typeof x === "number" && Number.isFinite(x) && x > 0;
const istTag = (x) => typeof x === "string" && /^\d{4}-\d{2}-\d{2}$/.test(x) && !Number.isNaN(Date.parse(x));
const istZeitpunkt = (x) => typeof x === "string" && !Number.isNaN(Date.parse(x));

const PFLICHT = {
  tiere: (t) => istText(t.id), // Name wird unten repariert: wegen eines kaputten Namens darf kein Tier samt Einträgen verschwinden.
  futter: (f) => istText(f.id) && typeof f.name === "string" && istZahl(f.kcalPro100g),
  // futterId darf fehlen oder null sein (vor 0.7.0 möglich); die App zeigt dann „Gelöschte Sorte“.
  mahlzeiten: (m) => istText(m.id) && istText(m.tierId) && istZahl(m.gramm) && istZeitpunkt(m.zeitpunkt),
  gewichte: (g) => istText(g.id) && istText(g.tierId) && istZahl(g.kg) && istTag(g.datum),
  freigaben: (f) => istText(f.id) && istText(f.tierId) && istTag(f.datum) && istZahl(f.zielgewichtKg) && istZahl(f.kcalProTag),
  // bis fehlt ganz (undefined): ungültig, denn ein Tag hat bis gleich von und eine laufende Phase bis null.
  besondereTage: (b) =>
    istText(b.id) && istText(b.tierId) && istText(b.art) && istTag(b.von) && (b.bis === null || (istTag(b.bis) && b.bis >= b.von)),
};

// entfernt: optionale Liste, in die die verworfenen Einträge kommen (laden() hebt sie auf, damit nichts still verloren geht).
export function eintraegeBereinigen(daten, entfernt = []) {
  let geaendert = 0;
  // Die Liste besondereTage gibt es erst seit 0.33.0: Fehlt sie, ist sie leer (keine Korrektur). Ist sie kein Array,
  // wird der Wert wie ein kaputter Eintrag aufgehoben.
  if (daten.besondereTage == null) daten.besondereTage = [];
  else if (!Array.isArray(daten.besondereTage)) {
    entfernt.push({ feld: "besondereTage", eintrag: daten.besondereTage });
    daten.besondereTage = [];
    geaendert += 1;
  }
  for (const [feld, gueltig] of Object.entries(PFLICHT)) {
    const behalten = [];
    for (const e of daten[feld]) {
      if (istObjekt(e) && gueltig(e)) behalten.push(e);
      else entfernt.push({ feld, eintrag: e });
    }
    geaendert += daten[feld].length - behalten.length;
    daten[feld] = behalten;
    if (feld === "tiere") {
      for (const t of daten.tiere) {
        if (typeof t.name !== "string" || !t.name.trim()) {
          t.name = "Tier"; // wie profilBereinigen in js/profil.js
          geaendert += 1;
        }
      }
    }
    // Notizen werden als Text angezeigt: alles andere wird geleert statt den Eintrag zu verwerfen.
    for (const e of daten[feld]) {
      if ("notiz" in e && typeof e.notiz !== "string") {
        e.notiz = "";
        geaendert += 1;
      }
    }
  }
  return geaendert;
}

// Profilbild: nur echte JPEG- oder PNG-Bilder und nicht zu groß – eine Sicherungsdatei kann von irgendwoher kommen.
export const FOTO_MAX_ZEICHEN = 300 * 1024;

// Nach dem Präfix nur Base64-Zeichen: so kann kein Anführungszeichen oder Code in die Seite gelangen.
const FOTO_MUSTER = /^data:image\/(jpeg|png);base64,[A-Za-z0-9+/]+={0,2}$/;

export function fotoGueltig(foto) {
  return typeof foto === "string" && foto.length <= FOTO_MAX_ZEICHEN && FOTO_MUSTER.test(foto);
}

// Entfernt ungültige Fotos an Tieren und Wägungen (z. B. aus einer eingelesenen Sicherung); alle anderen Daten bleiben.
export function fotoBereinigen(daten) {
  let entfernt = 0;
  for (const eintrag of [...daten.tiere, ...daten.gewichte]) {
    if (eintrag && typeof eintrag === "object" && "foto" in eintrag && !fotoGueltig(eintrag.foto)) {
      delete eintrag.foto;
      entfernt += 1;
    }
  }
  return entfernt;
}

// Analytische Bestandteile einer eigenen Sorte (seit 0.32.0): vier Zahlen von 0 bis 100, Feuchte fehlt (null) oder
// liegt unter 100, zusammen höchstens 100 (fehlende Feuchte als 0; auf 0,01 gerundet wegen Kommazahlen).
const istProzent = (x) => typeof x === "number" && Number.isFinite(x) && x >= 0 && x <= 100;

export function analyseGueltig(a) {
  if (!istObjekt(a)) return false;
  if (![a.protein, a.fett, a.asche, a.faser].every(istProzent)) return false;
  if (a.feuchte != null && !(istProzent(a.feuchte) && a.feuchte < 100)) return false;
  const summe = a.protein + a.fett + a.asche + a.faser + (a.feuchte ?? 0);
  return Math.round(summe * 100) / 100 <= 100;
}

// Entfernt ungültige Analysewerte an Sorten (z. B. aus einer eingelesenen Sicherung); die Sorte selbst bleibt.
export function analyseBereinigen(daten) {
  let entfernt = 0;
  for (const futter of daten.futter) {
    if ("analyse" in futter && !analyseGueltig(futter.analyse)) {
      delete futter.analyse;
      entfernt += 1;
    }
  }
  return entfernt;
}

// ---------- BCS und MCS (nur vom Tierarzt, keine Selbst-Einstufung) ----------
// Stufen des Muscle Condition Score nach der WSAVA-Tafel.
export const MCS = {
  normal: "normale Muskeln",
  leicht: "leichter Muskelabbau",
  maessig: "mäßiger Muskelabbau",
  stark: "starker Muskelabbau",
};

export function bcsGueltig(bcs) {
  return Number.isInteger(bcs) && bcs >= 1 && bcs <= 9;
}

// Entfernt ungültige BCS- und MCS-Angaben (z. B. aus einer eingelesenen Sicherung); der Rest der Freigabe bleibt.
export function freigabenBereinigen(daten) {
  let entfernt = 0;
  for (const freigabe of daten.freigaben) {
    if ("bcs" in freigabe && !bcsGueltig(freigabe.bcs)) {
      delete freigabe.bcs;
      entfernt += 1;
    }
    if ("mcs" in freigabe && !Object.hasOwn(MCS, freigabe.mcs)) {
      delete freigabe.mcs;
      entfernt += 1;
    }
  }
  return entfernt;
}

// "BCS 8 von 9 · leichter Muskelabbau"; leer, wenn der Tierarzt beides nicht angegeben hat.
export function befundText(freigabe) {
  const teile = [];
  if (bcsGueltig(freigabe.bcs)) teile.push(`BCS ${freigabe.bcs} von 9`);
  if (Object.hasOwn(MCS, freigabe.mcs)) teile.push(MCS[freigabe.mcs]);
  return teile.join(" · ");
}

export function laden(speicher = localStorage) {
  const text = speicher.getItem(schluessel);
  // Erster Start: nur ein Platzhalter im Arbeitsspeicher, nichts wird gespeichert.
  // Gespeichert wird erst, wenn der Halter in der Einrichtung seine Katze angelegt hat (app.js).
  if (text === null) return ersteDaten({ name: "Deine Katze", kastriert: false });
  const daten = JSON.parse(text);
  // Kaputte Einträge (z. B. aus einer Sicherung, die vor 0.28.2 eingelesen wurde) nicht anzeigen.
  // Was dabei wegfällt, kommt unter einen eigenen Schlüssel, damit es nicht still verloren geht.
  if (istGueltig(daten)) {
    const entfernt = [];
    eintraegeBereinigen(daten, entfernt);
    analyseBereinigen(daten); // nur im Arbeitsspeicher; der Rechner zeigt sonst Unsinn an
    if (entfernt.length) {
      try {
        const alt = JSON.parse(speicher.getItem(ENTFERNT_SCHLUESSEL) ?? "[]");
        speicher.setItem(ENTFERNT_SCHLUESSEL, JSON.stringify([...alt, ...entfernt]));
      } catch {
        // Speicher voll oder gesperrt: dann nur nicht anzeigen.
      }
    }
  }
  if (!istGueltig(daten)) {
    throw new Error("Die gespeicherten Daten haben ein unbekanntes Format.");
  }
  if (startwerteAktualisieren(daten)) {
    try {
      speichern(daten, speicher);
    } catch {
      // Speicher voll oder gesperrt: Die Umstellung gilt trotzdem im Arbeitsspeicher und wird beim nächsten
      // Speichern mitgeschrieben. Sonst stünde wegen vollem Speicher die Fehlerkarte „beschädigt“ da.
    }
  }
  return daten;
}

// Ersetzt veraltete Startwerte aus früheren Versionen – aber nur, wenn sie noch unverändert sind.
// Was Stefan selbst geändert hat, bleibt immer stehen.
function startwerteAktualisieren(daten) {
  const neueStartwerte = alteStartsorten();
  let geaendert = false;
  for (const futter of daten.futter) {
    // Seit 0.6.0 wissen die beiden Startsorten, zu welchem Eintrag der Futterliste sie gehören.
    // Zuerst, damit eine Sicherung aus 0.5 (Sheba 71, noch ohne listeId) gleich beim ersten Laden umgestellt wird.
    const start = neueStartwerte.find((f) => f.name === futter.name);
    if (start && !futter.listeId) {
      futter.listeId = start.listeId;
      geaendert = true;
    }
    const altPurina =
      futter.name === "Purina One Light" &&
      ((futter.kcalPro100g === 360 && futter.kcalQuelle === "ungefaehr") ||
        (futter.kcalPro100g === 346 && futter.kcalQuelle === "geschaetzt"));
    // Sheba: Bis 0.5.0 stand hier 77 kcal (Packung), von 0.6.0 bis 0.18.0 irrtümlich der zooplus-Wert 71.
    // Kitos Umkarton bestätigt 77. Die 71 werden ersetzt (Startwert und Kopien aus der Futterliste), solange kcal,
    // Quelle und Notiz unverändert sind; alte 77 bleiben stehen.
    const zooplusSheba =
      futter.listeId === "sheba-fresh-fine-huhn-gefluegel-truthahn" &&
      futter.kcalPro100g === 71 &&
      futter.kcalQuelle === "hersteller" &&
      typeof futter.notiz === "string" &&
      futter.notiz.includes("zooplus.de") &&
      futter.notiz.includes("Protein 7,7 %");
    const alt = altPurina || zooplusSheba;
    if (alt) {
      const neu = neueStartwerte.find((f) => (zooplusSheba ? f.listeId === futter.listeId : f.name === futter.name));
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
    besondereTage: (daten.besondereTage ?? []).map((b) => ({ ...b, von: tag(b.von), bis: b.bis === null ? null : tag(b.bis) })),
  };
}

export function futterNachId(daten) {
  return new Map(daten.futter.map((futter) => [futter.id, futter]));
}
