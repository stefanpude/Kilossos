// „Besonderer Tag“ (seit 0.33.0): Ausnahmen wie krank, genascht oder mehr Bewegung als eintägiges Ereignis oder als
// Phase über mehrere Tage. Nur zum Festhalten: keine kcal, keine Gramm, kein Einfluss auf Grenzen und Warnungen.
// Spezifikation: .planning/besonderer-tag.md. Datenformat: js/daten.js (Liste besondereTage).
// Alle Tage als "JJJJ-MM-TT"; bis gleich von = ein Tag, bis null = Phase läuft noch.

// Die Arten stehen nur hier (Schlüssel, Anzeigetext, Beenden-Text), damit sich die Liste nach dem Tierarzttermin
// leicht ändern lässt. Die Form passt direkt zu auswahlFeld (wert, text, zusatz).
export const BESONDERE_ARTEN = [
  { wert: "mehr-bewegung", text: "Mehr Bewegung", zusatz: "z. B. draußen gewesen, viel gespielt" },
  { wert: "weniger-bewegung", text: "Weniger Bewegung", zusatz: "z. B. nur drinnen, verletzt geschont" },
  { wert: "krank", text: "Krank", ende: "Wieder gesund" },
  { wert: "futter-verweigert", text: "Futter verweigert", notfall: true },
  {
    wert: "genascht",
    text: "Außer der Reihe genascht",
    zusatz: "Beute, Futter eines anderen Tiers, Essen vom Tisch",
    hinweis: "Die Menge musst du nicht wissen.",
  },
  { wert: "fressen-auffaellig", text: "Auffälligkeit beim Fressen", zusatz: "nur die Hälfte gefressen, erbrochen, sehr gierig" },
  { wert: "futterumstellung", text: "Futterumstellung", zusatz: "Mischen über mehrere Tage" },
  { wert: "sonstiges", text: "Sonstiges", notizPflicht: true },
];

// Hält Infoblase, Zeitleiste und PDF-Tabelle lesbar (andere Notizen in Kilossos haben keine Grenze).
export const NOTIZ_MAX = 200;

const SONSTIGES = BESONDERE_ARTEN.find((a) => a.wert === "sonstiges");

// Unbekannte Schlüssel (z. B. aus einer Sicherung einer neueren Fassung) werden als „Sonstiges“ angezeigt.
export function artVon(wert) {
  return BESONDERE_ARTEN.find((a) => a.wert === wert) ?? SONSTIGES;
}

export function betrifftTag(eintrag, tag) {
  return eintrag.von <= tag && (eintrag.bis === null || eintrag.bis >= tag);
}

const nachBeginn = (a, b) => a.von.localeCompare(b.von);

// Einträge eines Tiers, die den gezeigten Tag betreffen (eintägige dieses Tages und Phasen, die über ihn laufen).
export function eintraegeAm(liste, tierId, tag) {
  return liste.filter((e) => e.tierId === tierId && betrifftTag(e, tag)).sort(nachBeginn);
}

// Berührt der Eintrag den Zeitraum von–bis? (von null = von Anfang an)
export function beruehrt(eintrag, von, bis) {
  return eintrag.von <= bis && (eintrag.bis === null || von === null || eintrag.bis >= von);
}

// Einträge eines Tiers, die den Zeitraum von–bis berühren (von null = von Anfang an), nach Beginn sortiert.
export function imZeitraum(liste, tierId, von, bis) {
  return liste.filter((e) => e.tierId === tierId && beruehrt(e, von, bis)).sort(nachBeginn);
}

const datum = (iso) => {
  const [j, m, t] = iso.split("-").map(Number);
  return new Date(j, m - 1, t);
};
const format = (iso, optionen) => datum(iso).toLocaleDateString("de-DE", optionen);
const MIT_WOCHENTAG = { weekday: "short", day: "numeric", month: "short" };

// „Di., 3. Nov.“, „seit Di., 3. Nov.“, „1. bis 3. Nov.“, „30. Okt. bis 2. Nov.“, „30. Dez. 2026 bis 2. Jan. 2027“.
export function zeitraumText(eintrag) {
  const { von, bis } = eintrag;
  if (bis === null) return `seit ${format(von, MIT_WOCHENTAG)}`;
  if (bis === von) return format(von, MIT_WOCHENTAG);
  if (von.slice(0, 4) !== bis.slice(0, 4)) {
    const mitJahr = { day: "numeric", month: "short", year: "numeric" };
    return `${format(von, mitJahr)} bis ${format(bis, mitJahr)}`;
  }
  const ende = format(bis, { day: "numeric", month: "short" });
  if (von.slice(0, 7) === bis.slice(0, 7)) return `${Number(von.slice(8))}. bis ${ende}`;
  return `${format(von, { day: "numeric", month: "short" })} bis ${ende}`;
}

const istTag = (x) => typeof x === "string" && /^\d{4}-\d{2}-\d{2}$/.test(x) && !Number.isNaN(Date.parse(x));

// Prüft die Eingaben des Fensters „Besonderer Tag“ (Texte aus FormData, mehrere = Häkchen „Dauert mehrere Tage“).
// Häkchen aus: ein Tag am Startdatum. Häkchen an und „bis“ leer: die Phase läuft noch (bis null).
export function eintragAusFormular({ art, von, mehrere, bis, notiz }, heute) {
  const text = String(notiz ?? "").trim();
  if (!BESONDERE_ARTEN.some((a) => a.wert === art)) return { fehler: "Bitte wähle aus, was an diesem Tag besonders war." };
  if (!istTag(von)) return { fehler: "Bitte ein Datum angeben." };
  if (von > heute) return { fehler: "Das Datum darf nicht in der Zukunft liegen." };
  let ende = von;
  if (mehrere) {
    if (!bis) ende = null;
    else if (!istTag(bis)) return { fehler: "Bitte ein Datum angeben." };
    else ende = bis;
  }
  if (ende !== null && ende < von) return { fehler: "„bis“ darf nicht vor dem Startdatum liegen." };
  if (ende !== null && ende > heute) return { fehler: "„bis“ darf nicht in der Zukunft liegen." };
  if (text.length > NOTIZ_MAX) return { fehler: `Die Notiz darf höchstens ${NOTIZ_MAX} Zeichen lang sein.` };
  if (artVon(art).notizPflicht && !text) return { fehler: "Bitte schreib bei „Sonstiges“ kurz dazu, was war." };
  return { eintrag: { art, von, bis: ende, notiz: text } };
}

// Meldung nach dem Speichern (seit 0.71.0): nennt Art und Zeitraum, weil ein Eintrag für frühere Tage am gezeigten
// Tag nicht zu sehen ist (Stefan 06.11.). Wiederfinden lässt er sich in der Zeitleiste im Verlauf.
export function speicherMeldung(eintrag) {
  return `✓ Gespeichert: ${artVon(eintrag.art).text}, ${zeitraumText(eintrag)}`;
}

// „Wieder gesund“ bzw. „Beendet“: Die Phase endet am gezeigten Tag.
export function beenden(eintrag, tag) {
  eintrag.bis = tag < eintrag.von ? eintrag.von : tag;
}

const gesternVon = (heute) => {
  const d = datum(heute);
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

// Roter Notfall-Kasten auf „Heute“: nur, solange es jetzt dringend ist. „Futter verweigert“ betrifft heute oder
// gestern (echtes Datum, nicht der gezeigte Tag) oder läuft noch. Gehört bewusst nicht in warnungen() (js/rechnen.js),
// sonst zählte er im PDF unter „Auffälligkeiten“.
export function notfallJetzt(liste, tierId, heute) {
  const gestern = gesternVon(heute);
  return liste.some(
    (e) => e.tierId === tierId && artVon(e.art).notfall === true && e.von <= heute && (e.bis === null || e.bis >= gestern)
  );
}
