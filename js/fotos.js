// Fotos an Wägungen (ab 0.25.0): höchstens eins je Tier und Kalenderwoche, Vorher/Nachher im Verlauf.
// Reine Funktionen ohne Browser, damit sie testbar sind. Format und Prüfung wie beim Profilbild (fotoGueltig).
import { fotoGueltig } from "./daten.js";

// Montag der Woche (Montag bis Sonntag, wie im deutschen Kalender). Rechnung in UTC, damit die Zeitumstellung nicht stört.
export function wochenStart(datum) {
  const [j, m, t] = datum.split("-").map(Number);
  const tag = new Date(Date.UTC(j, m - 1, t));
  tag.setUTCDate(tag.getUTCDate() - ((tag.getUTCDay() + 6) % 7));
  return tag.toISOString().slice(0, 10);
}

// Nur Wägungen mit gültigem Datum zählen: eine eingelesene Sicherung kann kaputte Einträge enthalten.
const DATUM = /^\d{4}-\d{2}-\d{2}$/;
const mitFoto = (gewichte, tierId) =>
  gewichte.filter((g) => g?.tierId === tierId && typeof g.datum === "string" && DATUM.test(g.datum) && fotoGueltig(g.foto));

// Wägung desselben Tiers mit Foto in derselben Woche, sonst null.
export function fotoInWoche(gewichte, tierId, datum) {
  const woche = wochenStart(datum);
  return mitFoto(gewichte, tierId).find((g) => wochenStart(g.datum) === woche) ?? null;
}

// Älteste und neueste Wägung mit Foto. Bei nur einem Foto ist es „vorher“, „nachher“ bleibt leer.
export function vorherNachher(gewichte, tierId) {
  const liste = mitFoto(gewichte, tierId).sort((a, b) => a.datum.localeCompare(b.datum) || String(a.id).localeCompare(String(b.id)));
  return { vorher: liste[0] ?? null, nachher: liste.length > 1 ? liste.at(-1) : null };
}
