// Prüfkette für eine eingelesene Sicherungsdatei (vorher direkt in app.js, seit 0.28.3 hier, damit sie testbar ist).
// Eine Sicherung kann aus jeder früheren Version stammen oder von irgendwoher kommen: Ungültiges wird entfernt
// oder repariert, alles Gültige bleibt. Beispiel-Sicherungen aller Versionen liegen in tests/sicherungen/.
import { istGueltig, eintraegeBereinigen, fotoBereinigen, freigabenBereinigen, analyseBereinigen } from "./daten.js";
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
  const angaben = profilBereinigen(neu, heute) + freigabenBereinigen(neu) + eanBereinigen(neu) + analyseBereinigen(neu);
  return { kaputt, fotos, angaben };
}

// Rückfrage vor dem Einlesen: wie viel drin ist und was dabei korrigiert wird.
export function einleseFrage(neu, { kaputt, fotos, angaben }, ersetzen) {
  // besondereTage hat sicherungPruefen schon angelegt (bei alten Sicherungen leer).
  const besondere = neu.besondereTage?.length ?? 0;
  const m = neu.mahlzeiten.length;
  const g = neu.gewichte.length;
  // Dativ nach „mit“, Einzahl bei genau einem Eintrag („1 Mahlzeit und 1 Gewicht“, seit 0.41.0).
  const mahlzeiten = `${m} ${m === 1 ? "Mahlzeit" : "Mahlzeiten"}`;
  const gewichte = `${g} ${g === 1 ? "Gewicht" : "Gewichten"}`;
  const anzahl =
    besondere > 0
      ? `${mahlzeiten}, ${gewichte} und ${besondere} ${besondere === 1 ? "besonderen Tag" : "besonderen Tagen"}`
      : `${mahlzeiten} und ${gewichte}`;
  const kaputtText =
    kaputt > 0
      ? ` ${kaputt === 1 ? "Ein Eintrag war" : `${kaputt} Einträge waren`} beschädigt und ${kaputt === 1 ? "wird" : "werden"} entfernt oder repariert.`
      : "";
  const fotoText = fotos > 0 ? " Ein Foto in der Datei war ungültig und wird nicht übernommen." : "";
  const angabenText =
    angaben > 0
      ? " Einige Angaben im Profil, in den Freigaben, bei den Strichcodes oder bei den Analysewerten waren ungültig und werden nicht übernommen."
      : "";
  return `Sicherung mit ${anzahl} einlesen?${ersetzen}${kaputtText}${fotoText}${angabenText}`;
}
