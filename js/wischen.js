// Wischen zwischen den Bereichen der Leiste unten (Ideen-Tafel, 0.15.0).
// wischRichtung() und nachbarAnsicht() sind reine Rechnungen (testbar ohne Browser);
// wischenAnmelden() hört im Browser auf die Berührungen.

// Streifen am linken und rechten Rand, in dem Wischen nichts tut: dort liegt Androids Zurück-Geste.
export const RAND_PX = 24;
const MIN_WEG_PX = 60;
const MAX_DAUER_MS = 800;

// 1 = zum nächsten Bereich (nach links gewischt), -1 = zum vorherigen, 0 = kein Wischen.
export function wischRichtung({ startX, startY, endX, endY, dauerMs, breite } = {}) {
  const zahlen = [startX, startY, endX, endY, dauerMs, breite];
  if (!zahlen.every(Number.isFinite)) return 0;
  if (startX < RAND_PX || startX > breite - RAND_PX) return 0;
  if (dauerMs > MAX_DAUER_MS) return 0;
  const dx = endX - startX;
  const dy = endY - startY;
  if (Math.abs(dx) < Math.max(MIN_WEG_PX, breite * 0.16)) return 0;
  if (Math.abs(dx) < 2 * Math.abs(dy)) return 0;
  return dx < 0 ? 1 : -1;
}

// Nachbar in der Reihenfolge der Leiste; an den Enden geht es nicht im Kreis weiter.
export function nachbarAnsicht(leiste, aktuell, richtung) {
  const i = leiste.indexOf(aktuell);
  if (i < 0 || !richtung) return null;
  return leiste[i + richtung] ?? null;
}

// Hier startet kein Wischen: Kurven mit Infoblase, Eingabefelder, Menüs, offene Dialoge
// und alles, was selbst waagrecht scrollt.
const NICHT_WISCHEN = ".kurve, .diagramm, input, select, textarea, dialog, [role=menu], [data-kein-wischen]";

function scrolltWaagrecht(el, grenze) {
  for (let e = el; e && e !== grenze; e = e.parentElement) {
    if (e.scrollWidth > e.clientWidth + 1 && /(auto|scroll)/.test(getComputedStyle(e).overflowX)) return true;
  }
  return false;
}

// bereich: Element oder document, in dem gewischt wird. leiste(): Namen der Bereiche in Leistenreihenfolge.
// aktuell(): sichtbarer Bereich. wechseln(name, richtung): zeigt den Bereich. gesperrt(): z. B. Willkommensseite offen.
export function wischenAnmelden(bereich, { leiste, aktuell, wechseln, gesperrt = () => false }) {
  let start = null;
  bereich.addEventListener(
    "touchstart",
    (ereignis) => {
      start = null;
      if (ereignis.touches.length !== 1 || gesperrt()) return;
      const ziel = ereignis.target;
      if (ziel.closest?.(NICHT_WISCHEN) || scrolltWaagrecht(ziel, bereich)) return;
      const t = ereignis.touches[0];
      start = { x: t.clientX, y: t.clientY, zeit: performance.now() };
    },
    { passive: true },
  );
  bereich.addEventListener("touchcancel", () => (start = null), { passive: true });
  bereich.addEventListener(
    "touchend",
    (ereignis) => {
      if (!start || ereignis.changedTouches.length !== 1) return;
      const t = ereignis.changedTouches[0];
      const richtung = wischRichtung({
        startX: start.x, startY: start.y, endX: t.clientX, endY: t.clientY,
        dauerMs: performance.now() - start.zeit, breite: window.innerWidth,
      });
      start = null;
      if (!richtung || String(window.getSelection?.() ?? "")) return;
      const ziel = nachbarAnsicht(leiste(), aktuell(), richtung);
      if (ziel) wechseln(ziel, richtung);
    },
    { passive: true },
  );
}
