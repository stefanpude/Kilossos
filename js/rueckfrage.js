// Eigene Rückfrage (seit 0.52.0) statt des Browser-Fensters confirm(): ein Blatt im Kilossos-Stil mit klar
// beschrifteten Knöpfen. Sperrt ein Browser seine Fenster, galt jede Rückfrage still als „Abbrechen“.
// Braucht nichts aus app.js: Auch der Bildschirm „Daten konnten nicht geladen werden“ fragt hiermit nach.
//
// Antwort: "ja", "dritte" (nur mit dritte-Knopf) oder "nein". Escape, Zurück-Taste, Wischen und Tippen auf den
// Hintergrund zählen immer als "nein". Vorgewählt ist der Nein-Knopf.
export const KLICKSPERRE_MS = 400;

export function frage({ text, ja, nein = "Abbrechen", dritte = null, gefahr = false }, dialog = document.getElementById("dialog-rueckfrage")) {
  // Schon eine Frage offen (z. B. doppelt getippt): die erste bleibt, die zweite gilt als Nein.
  if (dialog.open) return Promise.resolve("nein");
  const teil = (name) => dialog.querySelector(`#rueckfrage-${name}`);
  const vorher = dialog.ownerDocument.activeElement;
  teil("text").textContent = text; // nie innerHTML: Namen von Tieren und Sorten stehen in den Fragen
  teil("ja").textContent = ja;
  teil("ja").classList.toggle("knopf-gefahr", gefahr);
  teil("ja").classList.toggle("knopf-haupt", !gefahr);
  teil("nein").textContent = nein;
  teil("dritte").hidden = !dritte;
  teil("dritte").textContent = dritte ?? "";
  dialog.returnValue = ""; // sonst gälte der Knopf vom letzten Mal
  // Kurz gesperrt (Prüfer-Fund 0.52.0): Das Blatt hängt unten wie das Fenster darunter. Der zweite Tipp eines
  // Doppeltipps auf „Speichern“ träfe sonst den Ja-Knopf an derselben Stelle, auch bei der Sicherheitsfrage.
  teil("ja").disabled = true;
  teil("dritte").disabled = true;
  setTimeout(() => {
    teil("ja").disabled = false;
    teil("dritte").disabled = false;
  }, KLICKSPERRE_MS);
  return new Promise((fertig) => {
    dialog.addEventListener(
      "close",
      () => {
        const wert = dialog.returnValue;
        if (vorher?.isConnected) vorher.focus({ preventScroll: true });
        fertig(wert === "ja" || (wert === "dritte" && dritte) ? wert : "nein");
      },
      { once: true }
    );
    dialog.showModal();
    teil("nein").focus();
  });
}

export async function bestaetigt(optionen, dialog) {
  return (await frage(optionen, dialog)) === "ja";
}
