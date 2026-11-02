// Darstellung Hell, Dunkel oder „Wie das Handy“. Eine Einstellung dieses Geräts: eigener Speicherschlüssel,
// nicht in den Daten und damit auch nicht in der Sicherung. Gilt ebenso im Demo-Modus.
// Das kleine Skript im <head> von index.html liest denselben Schlüssel, bevor die Seite gezeichnet wird.

export const ANZEIGE_SCHLUESSEL = "kilossos-anzeige";
export const ANZEIGEN = ["hell", "dunkel", "handy"];

export function leseAnzeige(speicher = localStorage) {
  try {
    const wahl = speicher.getItem(ANZEIGE_SCHLUESSEL);
    return ANZEIGEN.includes(wahl) ? wahl : "hell";
  } catch {
    return "hell";
  }
}

export function merkeAnzeige(wahl, speicher = localStorage) {
  speicher.setItem(ANZEIGE_SCHLUESSEL, wahl);
}

export function aufgeloest(wahl, handyDunkel) {
  if (wahl === "handy") return handyDunkel ? "dunkel" : "hell";
  return wahl === "dunkel" ? "dunkel" : "hell";
}
