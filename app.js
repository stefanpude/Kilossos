// Offline-Fähigkeit: den Service Worker anmelden, sobald die Seite geladen ist.
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch((fehler) => {
      console.error("Service Worker konnte nicht angemeldet werden:", fehler);
    });
  });
}

const status = document.getElementById("status");
const zeigeVerbindung = () => {
  status.textContent = navigator.onLine ? "Version 0.1" : "Version 0.1 · offline";
};
window.addEventListener("online", zeigeVerbindung);
window.addEventListener("offline", zeigeVerbindung);
zeigeVerbindung();
