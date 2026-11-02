// Aufklappbare Karten: zugeklappt nur eine Zusammenfassung, aufgeklappt die Einträge. Verschachtelung geht.
// aufklappKarte() liefert nur HTML-Text (testbar ohne Browser); aufklappenAnmelden() hört einmal auf alle Klicks.
// Der Auf/Zu-Zustand wird je id gemerkt, damit offene Bereiche nach dem Neuzeichnen offen bleiben
// (z. B. nach dem Speichern einer Mahlzeit). Gespeichert wird er nicht.

const zustand = new Map();

export function merkeZustand(id, offen) {
  zustand.set(id, offen);
}

export function zustandVergessen() {
  zustand.clear();
}

// kopf und inhalt sind fertiges HTML – Text darin schützt der Aufrufer selbst.
export function aufklappKarte({ id, kopf, inhalt, offen = false, klasse = "" }) {
  const auf = zustand.has(id) ? zustand.get(id) : offen;
  return `<div class="aufklapp${auf ? " offen" : ""}${klasse ? " " + klasse : ""}" data-aufklapp="${id}">
    <button type="button" class="aufklapp-kopf" aria-expanded="${auf}" aria-controls="ak-${id}">${kopf}<span class="pfeil" aria-hidden="true">⌄</span></button>
    <div class="aufklapp-inhalt" id="ak-${id}"><div>${inhalt}</div></div>
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
