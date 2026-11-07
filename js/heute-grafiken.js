// Grafiken auf „Heute“ als reine HTML-Funktionen (ab 0.38.0), damit sie ohne Bildschirm testbar sind
// (tests/heute-grafiken.test.js). Die Werte kommen fertig gerechnet aus js/zusammenfassung.js; hier wird nichts bewertet.
// Plan: .planning/grafiken-auswahl.md. Grafiken sind aria-hidden, jede wichtige Aussage steht zusätzlich als Text.

import { GRENZEN } from "./rechnen.js";
import { tempoZahl } from "./zusammenfassung.js";
import { aufklappKarte } from "./aufklappen.js";
import { datumText } from "./mehr.js";

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

const ART_NAMEN = { nass: "Nass", trocken: "Trocken", frischfleisch: "Frisch", leckerli: "Leckerli" };

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
  // Reststück nur, wenn auch die Kachel einen Rest zeigt (gleiche Rundung wie gefuettertWerte: 219,6 von 220 = „Noch 0“).
  const restTeil = Math.round(werte.kcal - soll) < 0 ? `<i class="gef-st rest" style="flex-grow:${sicher(rest.toFixed(1))}"></i>` : "";
  // Zwischen den Stücken liegen je 2 px Lücke (gap in .gef-bahn), die flex-grow nicht mitzählt. Die Marke sitzt bei
  // marke × (Breite − alle Lücken) plus den Lücken davor (0.42.2); px fasst beides zusammen, 0 ergibt reine Prozent.
  const LUECKE = 2;
  const teile = werte.stuecke.length + (restTeil ? 1 : 0);
  let bis = 0;
  const davor = werte.stuecke.filter((s) => (bis += s.kcal) < soll - 1e-9).length;
  const px = Math.round((LUECKE * davor - marke * LUECKE * Math.max(0, teile - 1)) * 10) / 10;
  const prozent = (marke * 100).toFixed(1);
  const links = px === 0 ? `left:${prozent}%` : `left:calc(${prozent}% ${px < 0 ? "-" : "+"} ${Math.abs(px).toFixed(1)}px)`;
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

// ---------- „Mehr zur Fütterung“ (ab 0.44.0, Funde 06.11. Paket B) ----------

const ART_ZEILE = { nass: "Nassfutter", trocken: "Trockenfutter", frischfleisch: "Frischfleisch", leckerli: "Leckerli" };

// „A“, „A und B“, „A, B und C“
const mitUnd = (namen) => (namen.length < 2 ? namen.join("") : `${namen.slice(0, -1).join(", ")} und ${namen.at(-1)}`);

// Leckerli-Block (seit 0.78.0 im Aufklappmenü statt eigener Karte unter „Letzte Messung“).
// lk aus leckerliKachel (js/zusammenfassung.js): gleiche Basis wie die Leckerli-Warnung, Farbe nur von der Warnung.
export function leckerliHtml(lk) {
  const anteil =
    lk.anteil === null
      ? lk.amTagesende
        ? "wird am Tagesende bewertet"
        : ""
      : `${zahl(lk.anteil * 100)}${NB}% der Tages-kcal · Grenze ${zahl(GRENZEN.leckerliMax * 100)}${NB}%`;
  const breite = lk.anteil === null ? 0 : Math.min(100, (lk.anteil / GRENZEN.leckerliMax) * 100);
  return (
    `<div class="gef-leckerli">` +
    `<div class="oben"><span class="label">Leckerli</span><span class="wert">${zahl(lk.kcal)}${NB}<small class="leise">kcal</small></span></div>` +
    (anteil ? `<span class="leise">${anteil}</span>` : "") +
    (lk.anteil === null
      ? ""
      : `<span class="balken sofort${lk.stufe === "achtung" ? " gefahr" : ""}"><i style="--w: ${breite.toFixed(1)}%"></i></span>`) +
    `</div>`
  );
}

// Aufklappbare Zeile unten in der Karte „Gefüttert“ (standardmäßig zu, Zustand nur im Speicher wie überall).
// mehr aus gefuettertMehr (js/zusammenfassung.js); null ergibt nichts. lk aus leckerliKachel (seit 0.78.0), ohne lk
// kein Leckerli-Block. Zahl und Einheit immer mit NB.
export function gefuettertMehrHtml(mehr, lk = null) {
  if (!mehr) return "";
  const kcal = (k, stellen = 0) => `${sicher(k.toLocaleString("de-DE", { maximumFractionDigits: stellen }))}${NB}kcal`;
  const teile = [];
  if (mehr.ziel) {
    const { art, kcal: k, soll, datum } = mehr.ziel;
    const klammer = `(${kcal(soll)}, Freigabe vom ${sicher(datumText(datum))})`;
    const b = `<b>${sicher(zahl(k))}${NB}kcal</b>`;
    const satz = {
      noch: `Noch ${b} bis zur Tagesmenge vom Tierarzt ${klammer}.`,
      ueber: `${b} über der Tagesmenge vom Tierarzt ${klammer}.`,
      unter: `${b} unter der Tagesmenge vom Tierarzt ${klammer}.`,
      erreicht: `Tagesmenge vom Tierarzt erreicht ${klammer}.`,
    }[art];
    teile.push(`<p class="gef-satz">${satz}</p>`);
  }
  if (mehr.arten.length)
    teile.push(
      `<div class="gef-zeilen">${mehr.arten
        .map(
          (a) =>
            `<span>${ART_ZEILE[a.typ]}</span><span>${sicher(zahl(a.gramm))}${NB}g</span><b>${sicher(zahl(a.kcal))}${NB}kcal</b>`
        )
        .join("")}</div>`
    );
  // Bis 0.77.1 stand hier „Leckerlis: … von höchstens …“ (Bezug Freigabe), daneben eine eigene Karte mit anderem
  // Bezug. Seit 0.78.0 nur noch der Block aus leckerliKachel.
  if (lk) teile.push(leckerliHtml(lk));
  const namen = mehr.geschaetzt.map(sicher);
  const geschaetzt = namen.length
    ? namen.length === 1
      ? `der kcal-Wert von ${namen[0]} nur geschätzt ist`
      : `die kcal-Werte von ${mitUnd(namen)} nur geschätzt sind`
    : "";
  const geloescht = mehr.geloescht ? "eine gelöschte Sorte keinen kcal-Wert mehr hat" : "";
  const grund = [geschaetzt, geloescht].filter(Boolean).join(" und ");
  if (grund) teile.push(`<p class="gef-klein">„ca.“, weil ${grund}.</p>`);
  return aufklappKarte({
    id: "gef-mehr",
    klasse: "gef-mehr",
    kopf: `<span class="zusammen">Mehr zur Fütterung ${mehr.heute ? "heute" : "an diesem Tag"}</span>`,
    inhalt: teile.join(""),
  });
}

// ---------- „Letzte Messung“ (ab 0.39.0, Mischung flach ohne Korridor) ----------

// Grenzwert als kurze deutsche Zahl („0,5“, „2“), immer aus GRENZEN gebildet.
const grenzZahl = (wert) => wert.toLocaleString("de-DE", { maximumFractionDigits: 1 });

// Statt Skala, wenn keine Messung mindestens 7 Tage zurückliegt (0.75.0, Wortlaut mit Stefans Ja).
export const TEXT_TEMPO_KURZ = "Das Tempo erscheint, wenn zwei Messungen mindestens 7 Tage auseinanderliegen.";

// Kurzwort hinter dem Tempo, je Bewertung aus tempoRueckmeldung.
export const URTEIL_KURZ = {
  gut: "sicher",
  langsam: `langsamer als ${grenzZahl(GRENZEN.abnahmeMin)}${NB}%`,
  "zu-schnell": `schneller als ${grenzZahl(GRENZEN.abnahmeMax)}${NB}%`,
  zunahme: "im Blick behalten",
  neutral: "noch ohne Bewertung",
};

const r1 = (v) => Math.round(v * 10) / 10;
const ms = (iso) => {
  const [j, m, t] = iso.split("-").map(Number);
  return new Date(j, m - 1, t).getTime();
};
// „29.10.“ ohne führende Nullen
const kurzDatum = (iso) => `${Number(iso.slice(8, 10))}.${Number(iso.slice(5, 7))}.`;
const wochentag = (iso) => new Date(ms(iso)).toLocaleDateString("de-DE", { weekday: "short", day: "numeric", month: "short" });
const vorzeichen = (v) => (v > 0 ? "+" : v < 0 ? "−" : "±");

// Tempo-Skala: Spur von SKALA.von bis SKALA.bis % pro Woche (nur Darstellung, keine Grenze), Zeichenfläche 300 breit.
const SKALA = { W: 300, H: 35, L: 12, R: 12, von: -0.5, bis: 3 };
const skalaX = (v) =>
  r1(SKALA.L + ((Math.min(SKALA.bis, Math.max(SKALA.von, v)) - SKALA.von) / (SKALA.bis - SKALA.von)) * (SKALA.W - SKALA.L - SKALA.R));

// Position des Punkts auf der Skala; außerhalb bleibt er am Rand und „raus“ sagt, auf welcher Seite.
export function skalaPunkt(prozent) {
  return { x: skalaX(prozent), raus: prozent > SKALA.bis ? "rechts" : prozent < SKALA.von ? "links" : null };
}

// Flach: Spur y 10, grüner Bereich y 4 (12 hoch), Striche 17–21, Zahlen y 32, Punkt r 6.
function skalaSvg(prozent, bewertung) {
  const { W, H } = SKALA;
  // Linkes Ende beschriftet (0.42.1): Der Bereich unter 0 steht für eine kleine Zunahme. Echtes Minus „−“.
  const striche = [
    [SKALA.von, grenzZahl(SKALA.von).replace("-", "−")],
    [0, "0"],
    [GRENZEN.abnahmeMin, grenzZahl(GRENZEN.abnahmeMin)],
    [GRENZEN.abnahmeMax, grenzZahl(GRENZEN.abnahmeMax)],
    [SKALA.bis, `${grenzZahl(SKALA.bis)} %`],
  ]
    .map(
      ([v, t]) =>
        `<line class="mess-sk-strich" x1="${skalaX(v)}" x2="${skalaX(v)}" y1="17" y2="21"/>` +
        `<text class="achse" x="${skalaX(v)}" y="32" text-anchor="middle">${sicher(t)}</text>`
    )
    .join("");
  const punkt = skalaPunkt(prozent);
  const pfeil = punkt.raus
    ? `<text class="achse" x="${punkt.x + (punkt.raus === "rechts" ? -12 : 12)}" y="14" text-anchor="middle">${punkt.raus === "rechts" ? "›" : "‹"}</text>`
    : "";
  const zoneVon = skalaX(GRENZEN.abnahmeMin);
  return (
    `<svg class="mess-skala" viewBox="0 0 ${W} ${H}" aria-hidden="true">` +
    `<line class="mess-sk-spur" x1="${skalaX(SKALA.von)}" x2="${skalaX(SKALA.bis)}" y1="10" y2="10"/>` +
    `<rect class="mess-sk-zone" x="${zoneVon}" y="4" width="${r1(skalaX(GRENZEN.abnahmeMax) - zoneVon)}" height="12" rx="6"/>` +
    striche +
    `<circle class="mess-sk-punkt ${sicher(bewertung)}" cx="${punkt.x}" cy="10" r="6"/>` +
    pfeil +
    `</svg>`
  );
}

// Kleine Kurve der letzten 8 Wochen (älteste zuerst), ohne Korridor. Achse nur aus den Wägungen:
// unten Minimum − 0,08 kg, oben Maximum + 0,05 kg, je auf 0,1 kg gerundet.
function kurveSvg(liste, bewertung) {
  const W = 320, H = 58, L = 30, R = 40, O = 6, U = 14;
  const von = ms(liste[0].datum);
  const bis = ms(liste.at(-1).datum);
  // Alle Wägungen am selben Tag: keine Zeitspanne, alle Punkte rechts (sonst Teilung durch 0).
  const x = (t) => (bis > von ? r1(L + ((t - von) / (bis - von)) * (W - L - R)) : W - R);
  const kgs = liste.map((g) => g.kg);
  const lo = Math.floor((Math.min(...kgs) - 0.08) * 10) / 10;
  let hi = Math.ceil((Math.max(...kgs) + 0.05) * 10) / 10;
  if (hi <= lo) hi = lo + 0.1;
  const y = (kg) => r1(O + ((hi - kg) / (hi - lo)) * (H - O - U));
  const linie = liste.map((g) => `${x(ms(g.datum))},${y(g.kg)}`).join(" ");
  const punkte = liste
    .slice(0, -1)
    .map((g) => `<circle class="mess-punkt" cx="${x(ms(g.datum))}" cy="${y(g.kg)}" r="2.5"/>`)
    .join("");
  const letzte = liste.at(-1);
  const lx = x(bis);
  const ly = y(letzte.kg);
  const ersteDatum =
    bis > von ? `<text class="achse" x="${x(von)}" y="${H - 3}" text-anchor="start">${sicher(kurzDatum(liste[0].datum))}</text>` : "";
  return (
    `<svg class="mess-kurve" viewBox="0 0 ${W} ${H}" aria-hidden="true">` +
    `<line class="gitter" x1="${L}" x2="${W - R}" y1="${y(hi)}" y2="${y(hi)}"/>` +
    `<line class="gitter" x1="${L}" x2="${W - R}" y1="${y(lo)}" y2="${y(lo)}"/>` +
    `<text class="achse" x="${L - 5}" y="${y(hi) + 4}" text-anchor="end">${sicher(zahl(hi, 1))}</text>` +
    `<text class="achse" x="${L - 5}" y="${y(lo) + 4}" text-anchor="end">${sicher(zahl(lo, 1))}</text>` +
    // pathLength="1": die Zeichen-Animation (CSS) passt so zu jeder Linienlänge.
    `<polyline class="mess-linie" pathLength="1" points="${linie}"/>${punkte}` +
    `<circle class="mess-end ${sicher(bewertung)}" cx="${lx}" cy="${ly}" r="4.5"/>` +
    `<text class="mess-endtext" x="${lx + 7}" y="${ly + 4}">${sicher(zahl(letzte.kg, 2))}</text>` +
    ersteDatum +
    `<text class="achse" x="${lx}" y="${H - 3}" text-anchor="end">${sicher(kurzDatum(letzte.datum))}</text>` +
    `</svg>`
  );
}

// Karte „Letzte Messung“: Kopf (Datum, „Verlauf ›“, Gewicht, Gramm seit der Messung davor), Kurve, Skala, Urteil.
// werte aus messungWerte (js/zusammenfassung.js). „Verlauf ›“ öffnet den Bereich über data-ziel wie die untere Leiste.
export function messungHtml(werte) {
  const karte = (inhalt) => `<section class="karte mess" aria-label="Letzte Messung">${inhalt}</section>`;
  if (werte.art === "keine")
    return karte(`<p>Noch nicht gewogen.<br><span class="leise">Am besten 1× pro Woche, immer zur gleichen Zeit.</span></p>`);

  const { letzte } = werte;
  const mitVergleich = werte.art === "mitVergleich";
  const diff = mitVergleich
    ? `<span class="leise">${vorzeichen(werte.diffG)}${sicher(zahl(Math.abs(werte.diffG)))}${NB}g seit ${sicher(kurzDatum(werte.vorher.datum))}</span>`
    : "";
  const kopf =
    `<div class="mess-kopf">` +
    `<div class="mess-zeile"><span class="label">Letzte Messung · ${sicher(wochentag(letzte.datum))}</span>` +
    `<button type="button" class="mess-link" data-ziel="verlauf">Verlauf<span aria-hidden="true"> ›</span></button></div>` +
    `<div class="mess-gewicht"><span class="wert">${sicher(zahl(letzte.kg, 2))}<small>${NB}kg</small></span>${diff}</div>` +
    `</div>`;
  if (!mitVergleich) return karte(kopf + `<p class="leise">Das Tempo erscheint ab dem zweiten Wiegen.</p>`);
  const kurve = werte.kurve && new Set(werte.kurve.map((g) => g.datum)).size >= 2 ? kurveSvg(werte.kurve, werte.bewertung) : "";
  // 0.75.0: Keine Messung mindestens 7 Tage davor → keine Skala, sondern der Hinweis (Wortlaut mit Stefans Ja).
  if (werte.kurz) return karte(kopf + kurve + `<p class="leise mess-kurz">${TEXT_TEMPO_KURZ}</p>`);

  const { prozent, bewertung } = werte;
  // Zahl nahe den Grenzen mit zwei Stellen in Richtung des Urteils (tempoZahl), nie „2,0 · schneller als 2 %“.
  const zahlText = `${prozent < 0 ? "Zunahme " : ""}${sicher(tempoZahl(prozent))}${NB}%`;
  // Warnung „zu schnell“ über das Mittel aktiv (seit 0.40.1): Karte folgt ihr, die Woche selbst bleibt als Zahl stehen.
  const wochen = GRENZEN.tageZuSchnell / 7;
  const [tempo, urteil] = werte.mittelZuSchnell
    ? [`${zahlText} letzte Woche`, `im Mittel über ${grenzZahl(wochen)}${NB}${wochen === 1 ? "Woche" : "Wochen"} zu schnell`]
    : [`${zahlText} pro Woche`, URTEIL_KURZ[bewertung] ?? ""];
  return karte(
    kopf +
      // Kurve erst ab zwei verschiedenen Tagen (0.42.2); sonst stünden alle Punkte senkrecht übereinander.
      kurve +
      `<div class="mess-tempo">${skalaSvg(prozent, bewertung)}` +
      `<p class="mess-urteil ${sicher(bewertung)}"><b>${tempo}</b> · ${sicher(urteil)}</p></div>`
  );
}
