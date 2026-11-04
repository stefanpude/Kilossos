// Aufklappbare Karten: zugeklappt nur eine Zusammenfassung, aufgeklappt die Einträge. Verschachtelung geht.
// aufklappKarte() liefert nur HTML-Text (testbar ohne Browser); aufklappenAnmelden() hört einmal auf alle Klicks.
// Der Auf/Zu-Zustand wird je id gemerkt, damit offene Bereiche nach dem Neuzeichnen offen bleiben
// (z. B. nach dem Speichern einer Mahlzeit). Gespeichert wird er nicht.
import { SYMBOL } from "./symbole.js";

const zustand = new Map();
const sicher = (text) =>
  String(text).replace(/[&<>"']/g, (z) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[z]);

export function merkeZustand(id, offen) {
  zustand.set(id, offen);
}

// Gemerkter Zustand oder undefined, wenn die Karte noch nie gezeichnet bzw. umgeschaltet wurde.
export function zustandVon(id) {
  return zustand.get(id);
}

export function zustandVergessen(id) {
  if (id === undefined) zustand.clear();
  else zustand.delete(id);
}

// kopf und inhalt sind fertiges HTML – Text darin schützt der Aufrufer selbst.
// festhalten: der Standard "offen" gilt nur beim ersten Zeichnen; danach bleibt die Karte, wie sie war
// (sonst klappt z. B. die 6. Futtersorte alle Gruppen auf einmal zu).
export function aufklappKarte({ id, kopf, inhalt, offen = false, klasse = "", festhalten = false }) {
  if (festhalten && !zustand.has(id)) zustand.set(id, offen);
  const auf = zustand.has(id) ? zustand.get(id) : offen;
  const i = sicher(id);
  return `<div class="aufklapp${auf ? " offen" : ""}${klasse ? " " + klasse : ""}" data-aufklapp="${i}">
    <button type="button" class="aufklapp-kopf" aria-expanded="${auf}" aria-controls="ak-${i}">${kopf}<span class="pfeil" aria-hidden="true">${SYMBOL.runter}</span></button>
    <div class="aufklapp-inhalt" id="ak-${i}"><div>${inhalt}</div></div>
  </div>`;
}

export function aufklappenAnmelden(wurzel) {
  wurzel.addEventListener("click", (ereignis) => {
    const kopf = ereignis.target.closest?.(".aufklapp-kopf");
    if (!kopf) return;
    // Knöpfe in der Kopfzeile (z. B. Löschen) sollen nicht auf- und zuklappen.
    if (ereignis.target.closest("[data-aktion]") && ereignis.target.closest("[data-aktion]") !== kopf) return;
    const karte = kopf.closest(".aufklapp");
    const auf = !karte.classList.contains("offen");
    karte.classList.toggle("offen", auf);
    kopf.setAttribute("aria-expanded", String(auf));
    merkeZustand(karte.dataset.aufklapp, auf);
  });
}
