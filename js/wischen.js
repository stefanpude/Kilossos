// Wischen zwischen den Bereichen der Leiste unten (Ideen-Tafel, 0.15.0).
// wischRichtung() und nachbarAnsicht() sind reine Rechnungen (testbar ohne Browser);
// wischenAnmelden() hört im Browser auf die Berührungen.

// Streifen am linken und rechten Rand, in dem Wischen nichts tut: dort liegt Androids Zurück-Geste.
export const RAND_PX = 24;
const MIN_WEG_PX = 60;
const MAX_DAUER_MS = 800;

const ACHSE_PX = 10;

// Richtung der ersten Millimeter (0.59.0, wie bei Bildergalerien): null = noch zu wenig bewegt.
// Bei Gleichstand gewinnt „senkrecht“: lieber scrollen als aus Versehen den Bereich wechseln.
export function wischAchse(dx, dy) {
  if (!Number.isFinite(dx) || !Number.isFinite(dy) || Math.hypot(dx, dy) < ACHSE_PX) return null;
  return Math.abs(dx) > Math.abs(dy) ? "waagrecht" : "senkrecht";
}

// 1 = zum nächsten Bereich (nach links gewischt), -1 = zum vorherigen, 0 = kein Wischen.
// achse (aus wischAchse): „senkrecht“ begonnen = Scrollen, nie Wechsel; „waagrecht“ begonnen = ein Daumen-Bogen
// zählt bis knapp 45 Grad. Ohne achse (kein touchmove gemeldet) gilt die strenge Regel: doppelt so weit waagrecht.
export function wischRichtung({ startX, startY, endX, endY, dauerMs, breite, achse = null } = {}) {
  const zahlen = [startX, startY, endX, endY, dauerMs, breite];
  if (!zahlen.every(Number.isFinite)) return 0;
  if (achse === "senkrecht") return 0;
  if (startX < RAND_PX || startX > breite - RAND_PX) return 0;
  if (dauerMs > MAX_DAUER_MS) return 0;
  const dx = endX - startX;
  const dy = endY - startY;
  if (Math.abs(dx) < Math.max(MIN_WEG_PX, breite * 0.16)) return 0;
  const faktor = achse === "waagrecht" ? 1 : 2;
  if (Math.abs(dx) < faktor * Math.abs(dy)) return 0;
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
      start = { x: t.clientX, y: t.clientY, zeit: performance.now(), achse: null };
    },
    { passive: true },
  );
  // Die erste klare Richtung merken; danach ändert sie sich bis zum Loslassen nicht mehr.
  bereich.addEventListener(
    "touchmove",
    (ereignis) => {
      if (!start || start.achse || ereignis.touches.length !== 1) return;
      const t = ereignis.touches[0];
      start.achse = wischAchse(t.clientX - start.x, t.clientY - start.y);
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
        dauerMs: performance.now() - start.zeit, breite: window.innerWidth, achse: start.achse,
      });
      start = null;
      if (!richtung || String(window.getSelection?.() ?? "")) return;
      const ziel = nachbarAnsicht(leiste(), aktuell(), richtung);
      if (ziel) wechseln(ziel, richtung);
    },
    { passive: true },
  );
}
