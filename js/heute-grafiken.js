// Grafiken auf „Heute“ als reine HTML-Funktionen (ab 0.38.0), damit sie ohne Bildschirm testbar sind
// (tests/heute-grafiken.test.js). Die Werte kommen fertig gerechnet aus js/zusammenfassung.js; hier wird nichts bewertet.
// Plan: .planning/grafiken-auswahl.md. Grafiken sind aria-hidden, jede wichtige Aussage steht zusätzlich als Text.

// Geschütztes Leerzeichen zwischen Zahl und Einheit („9 kcal“ bricht nie um).
const NB = " ";

// Deutsche Zahl; was auf die gewünschten Stellen gerundet 0 ergibt, wird „0“ (V8 schreibt sonst „-0“).
export const zahl = (wert, stellen = 0) =>
  (Number(wert.toFixed(stellen)) === 0 ? 0 : wert).toLocaleString("de-DE", {
    minimumFractionDigits: stellen,
    maximumFractionDigits: stellen,
  });

export const sicher = (text) =>
  String(text).replace(/[&<>"']/g, (z) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[z]);

const ART_NAMEN = { nass: "Nass", trocken: "Trocken", leckerli: "Leckerli" };

// „Gefüttert“ (Mischung kompakt): Balken mit einem Stück je Mahlzeit, Legende je Art, zwei Kacheln.
// Ohne Freigabe nur Legende, Satz und Knopf „Warum kein Ziel?“ (kein Balken, kein Ziel, keine Bewertung).
// Kopfzeile (große Zahl, „von … kcal vom Tierarzt“) und ca.-Hinweis stehen in index.html.
export function gefuettertHtml(werte) {
  const legende = werte.arten.length
    ? `<div class="gef-legende">${werte.arten
        .map((a) => `<span><i class="gef-chip ${a.typ}" aria-hidden="true"></i>${ART_NAMEN[a.typ]} ${sicher(zahl(a.kcal))}</span>`)
        .join("")}</div>`
    : "";
  if (!werte.ziel)
    return (
      legende +
      `<p class="kcal-rest">Ziel kommt mit der Freigabe vom Tierarzt.</p>` +
      `<button type="button" class="knopf-text" data-aktion="warum-kein-ziel">Warum kein Ziel?</button>`
    );

  const { soll, marke, ueberdeckung, kachel } = werte.ziel;
  const stuecke = werte.stuecke
    .map((s) => `<i class="gef-st ${s.typ}" style="flex-grow:${sicher(s.kcal.toFixed(1))}"></i>`)
    .join("");
  const rest = soll - werte.kcal;
  const restTeil = rest > 0 ? `<i class="gef-st rest" style="flex-grow:${sicher(rest.toFixed(1))}"></i>` : "";
  const links = `left:${sicher((marke * 100).toFixed(1))}%`;
  const drueber =
    ueberdeckung === "keine" ? "" : `<span class="gef-drueber${ueberdeckung === "bernstein" ? " stark" : ""}" style="${links}"></span>`;
  const balken =
    `<div class="gef-feld" aria-hidden="true"><div class="gef-bahn">${stuecke}${restTeil}${drueber}</div>` +
    `<span class="gef-marke" style="${links}"></span></div>`;
  const kachelHtml = (wort, wert, warn) =>
    `<div class="gef-kachel${warn ? " warn" : ""}"><span class="label">${sicher(wort)}</span><strong>${wert}</strong></div>`;
  const kacheln =
    `<div class="gef-kacheln">` +
    kachelHtml(kachel.wort, `${sicher(zahl(kachel.kcal))}${NB}kcal`, kachel.warnung) +
    kachelHtml("Futter", `${sicher(zahl(werte.gramm))}${NB}g`, false) +
    `</div>`;
  return balken + legende + kacheln;
}
