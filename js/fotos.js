// Fotos an Wägungen (ab 0.25.0), Vorher/Nachher im Verlauf.
// Ab 0.26.0: ein Monatsfoto je Tier. Foto-Tag ist der letzte Wiegetag im Monat; nur dann steht das Foto-Feld offen.
// Verpasst: bis zum nächsten Foto-Tag nachholbar, es zählt dann noch zum alten Zeitraum. Ohne Wiegetag: Kalendermonat.
// Reine Funktionen ohne Browser, damit sie testbar sind. Rechnung in UTC, damit die Zeitumstellung nicht stört.
import { fotoGueltig } from "./daten.js";

const DATUM = /^\d{4}-\d{2}-\d{2}$/;
const gueltigerTag = (tag) => Number.isInteger(tag) && tag >= 0 && tag <= 6;
const iso = (tag) => tag.toISOString().slice(0, 10);

// Letzter Tag im Monat (1–12) mit diesem Wochentag (0–6 wie Date.getDay(), 0 = Sonntag).
export function letzterWiegetag(jahr, monat, wiegetag) {
  const tag = new Date(Date.UTC(jahr, monat, 0)); // Tag 0 des Folgemonats = Monatsletzter
  tag.setUTCDate(tag.getUTCDate() - ((tag.getUTCDay() - wiegetag + 7) % 7));
  return iso(tag);
}

// Beginn des Foto-Zeitraums, in den das Datum fällt.
export function fotoZeitraum(datum, wiegetag) {
  if (!gueltigerTag(wiegetag)) return datum.slice(0, 8) + "01";
  const [j, m] = datum.split("-").map(Number);
  const dieserMonat = letzterWiegetag(j, m, wiegetag);
  if (datum >= dieserMonat) return dieserMonat;
  return m === 1 ? letzterWiegetag(j - 1, 12, wiegetag) : letzterWiegetag(j, m - 1, wiegetag);
}

export function istFotoTag(datum, wiegetag) {
  if (!gueltigerTag(wiegetag) || typeof datum !== "string" || !DATUM.test(datum)) return false;
  const [j, m] = datum.split("-").map(Number);
  return datum === letzterWiegetag(j, m, wiegetag);
}

// Nur Wägungen mit gültigem Datum zählen: eine eingelesene Sicherung kann kaputte Einträge enthalten.
const mitFoto = (gewichte, tierId) =>
  gewichte.filter((g) => g?.tierId === tierId && typeof g.datum === "string" && DATUM.test(g.datum) && fotoGueltig(g.foto));

// Wägung desselben Tiers mit Foto im selben Foto-Zeitraum, sonst null.
export function fotoImZeitraum(gewichte, tierId, datum, wiegetag) {
  const start = fotoZeitraum(datum, wiegetag);
  return mitFoto(gewichte, tierId).find((g) => fotoZeitraum(g.datum, wiegetag) === start) ?? null;
}

// Was der Gewicht-Dialog zum Foto anbietet (immer freiwillig):
// "fototag"   = Datum ist der letzte Wiegetag im Monat → Feld offen;
// "nachholen" = anderer Tag (oder kein Wiegetag), Monatsfoto fehlt → nur ein ruhiger Link;
// "keins"     = anderer Tag, der Zeitraum hat schon ein Foto.
export function fotoAngebot({ gewichte, tierId, datum, wiegetag }) {
  if (typeof datum !== "string" || !DATUM.test(datum)) return "keins";
  if (istFotoTag(datum, wiegetag)) return "fototag";
  return fotoImZeitraum(gewichte, tierId, datum, wiegetag) ? "keins" : "nachholen";
}

// Älteste und neueste Wägung mit Foto. Bei nur einem Foto ist es „vorher“, „nachher“ bleibt leer.
export function vorherNachher(gewichte, tierId) {
  const liste = mitFoto(gewichte, tierId).sort((a, b) => a.datum.localeCompare(b.datum) || String(a.id).localeCompare(String(b.id)));
  return { vorher: liste[0] ?? null, nachher: liste.length > 1 ? liste.at(-1) : null };
}
