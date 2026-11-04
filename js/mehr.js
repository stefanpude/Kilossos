// Bausteine für den Bereich „Mehr“ (ab 0.24.0): reine Funktionen, damit sie ohne Browser testbar sind.
import { MCS, bcsGueltig } from "./daten.js";

const zahl = (wert, stellen = 0) =>
  wert.toLocaleString("de-DE", { minimumFractionDigits: stellen, maximumFractionDigits: stellen });

// "2026-11-13" → "13. Nov. 2026"
export function datumText(iso) {
  const [j, m, t] = iso.split("-").map(Number);
  return new Date(j, m - 1, t).toLocaleDateString("de-DE", { day: "numeric", month: "short", year: "numeric" });
}

// Freigabe als Eckdaten-Tafel (Ziel | kcal/Tag | BCS), darunter Praxis und Datum, MCS und Notiz.
// Ohne Freigabe null. Werte sind reiner Text; escapen muss, wer sie in HTML einsetzt.
export function freigabeTafel(freigabe) {
  if (!freigabe) return null;
  return {
    felder: [
      { titel: "Ziel", wert: `${zahl(freigabe.zielgewichtKg, 2)} kg` },
      { titel: "kcal/Tag", wert: zahl(freigabe.kcalProTag) },
      { titel: "BCS", wert: bcsGueltig(freigabe.bcs) ? `${freigabe.bcs} von 9` : "–" },
    ],
    zeile: `${freigabe.tierarzt}, ${datumText(freigabe.datum)}`,
    befund: Object.hasOwn(MCS, freigabe.mcs ?? "") ? MCS[freigabe.mcs] : "",
    notiz: freigabe.notiz ?? "",
  };
}
