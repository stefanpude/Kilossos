// Prüfkette für eine eingelesene Sicherungsdatei (vorher direkt in app.js, seit 0.28.3 hier, damit sie testbar ist).
// Eine Sicherung kann aus jeder früheren Version stammen oder von irgendwoher kommen: Ungültiges wird entfernt
// oder repariert, alles Gültige bleibt. Beispiel-Sicherungen aller Versionen liegen in tests/sicherungen/.
import { istGueltig, eintraegeBereinigen, fotoBereinigen, freigabenBereinigen } from "./daten.js";
import { profilBereinigen } from "./profil.js";
import { eanBereinigen } from "./futterliste.js";

// neu: das aus der Datei gelesene JSON (wird verändert), heute: "JJJJ-MM-TT".
// Ergebnis: null, wenn es keine Kilossos-Sicherung ist; sonst die Zahl der Korrekturen je Art.
export function sicherungPruefen(neu, heute) {
  if (!istGueltig(neu)) return null;
  // Zuerst kaputte Einträge entfernen: Die übrigen Prüfungen erwarten echte Einträge.
  const kaputt = eintraegeBereinigen(neu);
  if (!istGueltig(neu)) return null;
  const fotos = fotoBereinigen(neu);
  const angaben = profilBereinigen(neu, heute) + freigabenBereinigen(neu) + eanBereinigen(neu);
  return { kaputt, fotos, angaben };
}
