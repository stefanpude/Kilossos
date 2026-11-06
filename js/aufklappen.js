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

// Inhalte, die erst beim Aufklappen gebaut werden (0.60.1): id → Funktion, die das HTML liefert.
const spaeter = new Map();

// Liefert das HTML einer zugeklappt gezeichneten Karte mit Inhalt als Funktion, nur einmal; sonst null.
export function spaeterInhalt(id) {
  const bauen = spaeter.get(id);
  if (!bauen) return null;
  spaeter.delete(id);
  return bauen();
}

// kopf und inhalt sind fertiges HTML – Text darin schützt der Aufrufer selbst.
// inhalt darf eine Funktion sein (0.60.1): dann wird er zugeklappt nicht gebaut, sondern erst beim Aufklappen
// (z. B. „Futter pro Tag“ über ein Jahr: tausende Zeilen, die zugeklappt niemand sieht).
// festhalten: der Standard "offen" gilt nur beim ersten Zeichnen; danach bleibt die Karte, wie sie war
// (sonst klappt z. B. die 6. Futtersorte alle Gruppen auf einmal zu).
export function aufklappKarte({ id, kopf, inhalt, offen = false, klasse = "", festhalten = false }) {
  if (festhalten && !zustand.has(id)) zustand.set(id, offen);
  const auf = zustand.has(id) ? zustand.get(id) : offen;
  const i = sicher(id);
  let html = inhalt;
  spaeter.delete(id);
  if (typeof inhalt === "function") {
    if (auf) html = inhalt();
    else {
      html = "";
      spaeter.set(id, inhalt);
    }
  }
  return `<div class="aufklapp${auf ? " offen" : ""}${klasse ? " " + klasse : ""}" data-aufklapp="${i}">
    <button type="button" class="aufklapp-kopf" aria-expanded="${auf}" aria-controls="ak-${i}">${kopf}<span class="pfeil" aria-hidden="true">${SYMBOL.runter}</span></button>
    <div class="aufklapp-inhalt" id="ak-${i}"><div>${html}</div></div>
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
    // Zugeklappt gezeichneter Inhalt (Funktion) wird jetzt gebaut, vor dem Aufklappen, damit die Höhe stimmt.
    const nachgebaut = auf ? spaeterInhalt(karte.dataset.aufklapp) : null;
    if (nachgebaut !== null) karte.querySelector(":scope > .aufklapp-inhalt > div").innerHTML = nachgebaut;
    karte.classList.toggle("offen", auf);
    kopf.setAttribute("aria-expanded", String(auf));
    merkeZustand(karte.dataset.aufklapp, auf);
  });
}
