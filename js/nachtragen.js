// Uhrzeit im Fenster „Mahlzeit eintragen“ (seit 0.54.0, als reine Funktion seit 0.54.1, damit sie mit festen Daten
// testbar ist). Neue Mahlzeit heute: Uhrzeit „jetzt“. Neue Mahlzeit für einen anderen Tag: Uhrzeit leer und ein Hinweis
// mit dem Datum, sonst lägen mehrere nachgetragene Fütterungen Minuten auseinander und zählten in der Übersicht für den
// Tierarzt als eine Mahlzeit. Mahlzeit ändern: ihre gespeicherte Uhrzeit, kein Hinweis.
import { tagSchluessel } from "./rechnen.js";
import { datumText } from "./mehr.js";

const hhmm = (zeit) => `${String(zeit.getHours()).padStart(2, "0")}:${String(zeit.getMinutes()).padStart(2, "0")}`;

// Kalender am Tagestitel auf „Heute“ (seit 0.70.0, Stefan 06.11.): Wert des Datumsfelds ("JJJJ-MM-TT") → Tag um
// Mitternacht (Ortszeit) oder null, wenn leer, kein echtes Datum oder in der Zukunft (dann bleibt der gezeigte Tag).
export function tagAusKalender(wert, jetzt) {
  const teile = /^(\d{4})-(\d{2})-(\d{2})$/.exec(wert ?? "");
  if (!teile) return null;
  const [j, m, t] = teile.slice(1).map(Number);
  const tag = new Date(j, m - 1, t);
  if (tag.getFullYear() !== j || tag.getMonth() !== m - 1 || tag.getDate() !== t) return null;
  return tagSchluessel(tag) > tagSchluessel(jetzt) ? null : tag;
}

// → { uhrzeit: "HH:MM" oder "", tipp: Text oder null }
export function uhrzeitVorbelegung({ mahlzeit = null, gewaehlterTag, jetzt }) {
  if (mahlzeit) return { uhrzeit: hhmm(new Date(mahlzeit.zeitpunkt)), tipp: null };
  const tag = tagSchluessel(gewaehlterTag);
  if (tag === tagSchluessel(jetzt)) return { uhrzeit: hhmm(jetzt), tipp: null };
  return {
    uhrzeit: "",
    tipp: `Du trägst für den ${datumText(tag)} nach: Bitte die Uhrzeit der Fütterung eintragen. Nur so zählt die Übersicht für die Praxis die Mahlzeiten richtig.`,
  };
}
