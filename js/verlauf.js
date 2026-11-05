// Ansicht "Verlauf": Eckdaten, Zeitraum-Umschalter, Gewichtskurve auf Millimeterpapier, Tempo pro Woche und
// zwei aufklappbare Karten (Futter pro Tag, Befunde vom Tierarzt) – alles als HTML-Text, ohne Zusatzpakete.
// gewichtDiagramm und kcalDiagramm sind die älteren Diagramme; sie dienen nur noch dem PDF-Bericht.
// Farben kommen aus styles.css (--reihe-1, --reihe-2, --akzent, --gut, --rand, --text-leise).

import { GRENZEN, gewichteSortiert, tagesSumme, leckerliKcal, tagSchluessel, aktuelleFreigabe, kcalFuer } from "./rechnen.js";
import { zeitraumStart, wochenRaten, abnahmeZusammenfassung, futterTage, futterZusammenfassung, wochenGruppen, tempoZahl } from "./zusammenfassung.js";
import { aufklappKarte } from "./aufklappen.js";
import { befundText } from "./daten.js";
import { SYMBOL } from "./symbole.js";
import { artVon, zeitraumText, beruehrt } from "./besondere-tage.js";

const B = 340; // Breite der Zeichenfläche (viewBox); das SVG skaliert auf die Bildschirmbreite
const H = 190;
const RAND = { links: 34, rechts: 52, oben: 12, unten: 22 };
const innenB = B - RAND.links - RAND.rechts;
const innenH = H - RAND.oben - RAND.unten;
// Ränder der Zeitachse: Die Zeitleiste der besonderen Tage nutzt dieselben, damit Balken und Kurve übereinanderstehen.
export const PDF_RAND = { links: RAND.links, rechts: RAND.rechts };
const KURVE_RAND = { links: 34, rechts: 40 };
// Ende der Zeitachse (seit 0.33.0): heute bzw. Berichtsende, mindestens aber die letzte Wägung (falsche Geräteuhr).
const achsenEnde = (bis, letzteWaegung) => Math.max(bis ? ms(bis) : -Infinity, ms(letzteWaegung));

const zahl = (wert, stellen = 0) =>
  wert.toLocaleString("de-DE", { minimumFractionDigits: stellen, maximumFractionDigits: stellen });
const sicher = (text) =>
  String(text).replace(/[&<>"']/g, (z) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[z]);
const ms = (iso) => {
  const [j, m, t] = iso.split("-").map(Number);
  return new Date(j, m - 1, t).getTime();
};
const kurzDatum = (iso) => new Date(ms(iso)).toLocaleDateString("de-DE", { day: "numeric", month: "short" });
const TAG_MS = 86400000;

function skala(von, bis, nach0, nach1) {
  return (wert) => nach0 + ((wert - von) / (bis - von || 1)) * (nach1 - nach0);
}

// Runde Achsenschritte, z. B. 0,5 kg oder 50 kcal.
function schritte(min, max, anzahl = 4) {
  const roh = (max - min) / anzahl;
  const basis = 10 ** Math.floor(Math.log10(roh));
  const schritt = [1, 2, 2.5, 5, 10].map((f) => f * basis).find((s) => s >= roh);
  const werte = [];
  for (let w = Math.ceil(min / schritt) * schritt; w <= max + 1e-9; w += schritt) werte.push(Math.round(w * 1000) / 1000);
  return werte;
}

function yAchse(werte, y, stellen = 0, einheit = "") {
  return werte
    .map(
      (w) => `<line class="gitter" x1="${RAND.links}" x2="${B - RAND.rechts}" y1="${y(w)}" y2="${y(w)}"/>
      <text class="achse" x="${RAND.links - 6}" y="${y(w) + 3.5}" text-anchor="end">${zahl(w, stellen)}${einheit}</text>`
    )
    .join("");
}

// Beschriftung der Zeitachse (PDF-Diagramme). Seit 0.35.0 genauer (Wunsch 05.11.2026: „Jetzt steht da nur November“):
// bis 6 Wochen jeder Montag als „5.10.“, bis 12 Wochen jeder zweite Montag, darüber die Monatsanfänge (bei mehr als
// 8 Monaten nur jeder zweite oder dritte). So überlappen die Beschriftungen nicht (höchstens 6 Daten oder 8 Monate).
// Kleine Striche an der Grundlinie zeigen, wo die Tage liegen.
// unten/hoehe (seit 0.40.0): Grundlinie und Höhe der Zeichenfläche; das PDF ruft ohne sie auf (190 hoch, Grundlinie 168).
function zeitAchse(vonMs, bisMs, x, unten = H - RAND.unten, hoehe = H) {
  const tage = Math.round((bisMs - vonMs) / TAG_MS); // gerundet: Zeitumstellung
  const marken = [];
  const d = new Date(vonMs);
  if (tage <= 84) {
    const schritt = tage <= 42 ? 7 : 14;
    d.setDate(d.getDate() + ((8 - d.getDay()) % 7)); // erster Montag ab dem Start
    for (; d.getTime() <= bisMs; d.setDate(d.getDate() + schritt)) marken.push([d.getTime(), `${d.getDate()}.${d.getMonth() + 1}.`]);
  } else {
    d.setDate(1);
    d.setMonth(d.getMonth() + 1);
    const monate = [];
    for (; d.getTime() <= bisMs; d.setMonth(d.getMonth() + 1)) monate.push(d.getTime());
    const schritt = Math.ceil(monate.length / 8); // Monatsnamen sind kurz: 8 passen nebeneinander
    monate
      .filter((_, i) => i % schritt === 0)
      .forEach((t) => marken.push([t, new Date(t).toLocaleDateString("de-DE", { month: "short" })]));
  }
  return marken
    .map(([t, text]) => {
      const mx = Math.round(x(t) * 10) / 10;
      return `<line class="achsen-strich" x1="${mx}" x2="${mx}" y1="${unten}" y2="${unten + 4}"/><text class="achse" x="${mx}" y="${hoehe - 6}" text-anchor="middle">${text}</text>`;
    })
    .join("");
}

const svg = (inhalt, titel) =>
  `<svg viewBox="0 0 ${B} ${H}" class="diagramm" role="img" aria-label="${sicher(titel)}">${inhalt}</svg>`;

// Unsichtbare, breite Trefferflächen: Tippen oder Zeigen blendet den Tooltip ein (app.js).
const treffer = (x, breite, tip, extra = "") =>
  `<g class="treffer" data-tip="${sicher(tip)}">${extra}<rect x="${x - breite / 2}" y="${RAND.oben}" width="${breite}" height="${innenH}" fill="transparent"/></g>`;

// bis: letzter Tag des Berichtszeitraums; die Achse endet dort (seit 0.33.0), die Linie an der letzten Wägung.
// alle: alle Wägungen des Tiers (nicht nur die im Zeitraum) – daraus das Startgewicht des sicheren Bereichs (seit 0.36.2).
export function gewichtDiagramm(gewichte, freigaben, bis = null, alle = gewichte) {
  const liste = [...gewichteSortiert(gewichte)].reverse();
  const erste = freigaben.length ? [...freigaben].sort((a, b) => a.datum.localeCompare(b.datum))[0] : null;
  const ziel = aktuelleFreigabe(freigaben)?.zielgewichtKg;
  const vonMs = ms(liste[0].datum);
  const bisMs = achsenEnde(bis, liste.at(-1).datum);
  const kgs = liste.map((g) => g.kg).concat(ziel ?? []);
  const yMin = Math.floor((Math.min(...kgs) - 0.2) * 2) / 2;
  const yMax = Math.ceil((Math.max(...kgs) + 0.2) * 2) / 2;
  const x = skala(vonMs, bisMs, RAND.links, B - RAND.rechts);
  const y = skala(yMin, yMax, H - RAND.unten, RAND.oben);

  // Sicherer Bereich ab der ersten Freigabe: 0,5–2 % pro Woche vom Gewicht an diesem Tag.
  // Startgewicht aus allen Wägungen; liegt die Freigabe vor dem Zeitraum, beginnt das Band am Achsenanfang,
  // gerechnet ab dem Freigabe-Datum (wie weicheKurve in der App). Vorher sank es am Achsenanfang schon um Wochen
  // ab, und eine Katze mit 1 % pro Woche sah „zu langsam“ aus (Sicherheits-Review 05.11.2026).
  let band = "";
  const alleSortiert = [...gewichteSortiert(alle)].reverse();
  if (erste && ms(erste.datum) < bisMs && alleSortiert.length) {
    const startG = alleSortiert.filter((g) => g.datum <= erste.datum).at(-1) ?? alleSortiert[0];
    const anker = ms(startG.datum > erste.datum ? startG.datum : erste.datum);
    const s = Math.max(anker, vonMs);
    const punkte = [];
    for (let t = s; t <= bisMs + 1; t += 7 * TAG_MS) punkte.push(t);
    if (punkte.at(-1) < bisMs) punkte.push(bisMs);
    const kg = (t, rate) => Math.min(yMax, Math.max(yMin, startG.kg * (1 - rate / 100) ** ((t - anker) / (7 * TAG_MS))));
    const oben = punkte.map((t) => `${x(t)},${y(kg(t, GRENZEN.abnahmeMin))}`);
    const unten = punkte.map((t) => `${x(t)},${y(kg(t, GRENZEN.abnahmeMax))}`).reverse();
    band = `<polygon class="band" points="${oben.concat(unten).join(" ")}"/>
      <text class="band-text" x="${x(s) + 6}" y="${y(kg(s + 21 * TAG_MS, GRENZEN.abnahmeMax)) + 2}">sicherer Bereich</text>`;
  }
  const zielLinie = ziel
    ? `<line class="ziel" x1="${RAND.links}" x2="${B - RAND.rechts}" y1="${y(ziel)}" y2="${y(ziel)}"/>
       <text class="beschriftung" x="${B - RAND.rechts + 4}" y="${y(ziel) + 12}">Ziel ${zahl(ziel, 1)}</text>`
    : "";
  const linie = liste.map((g) => `${x(ms(g.datum))},${y(g.kg)}`).join(" ");
  const letzte = liste.at(-1);
  const letzteX = x(ms(letzte.datum));
  const breite = Math.max(8, innenB / liste.length);
  const punkte = liste
    .map((g) =>
      treffer(x(ms(g.datum)), breite, `${kurzDatum(g.datum)}: ${zahl(g.kg, 2)} kg`, `<circle class="marker" cx="${x(ms(g.datum))}" cy="${y(g.kg)}" r="4"/>`)
    )
    .join("");
  return svg(
    yAchse(schritte(yMin, yMax), y, 1) +
      zeitAchse(vonMs, bisMs, x) +
      band +
      zielLinie +
      `<polyline class="linie" points="${linie}"/>
       <circle class="endpunkt" cx="${letzteX}" cy="${y(letzte.kg)}" r="4"/>
       <text class="beschriftung stark" x="${letzteX + 6}" y="${y(letzte.kg) - 4}">${zahl(letzte.kg, 2)} kg</text>` +
      punkte,
    "Gewichtsverlauf in kg"
  );
}

// Durchschnitt pro Woche (Montag bis Sonntag), damit auch lange Zeiträume lesbar bleiben.
function wochenKcal(mahlzeiten, futterNachId) {
  const proTag = new Map();
  for (const m of mahlzeiten) {
    const tag = tagSchluessel(new Date(m.zeitpunkt));
    if (!proTag.has(tag)) proTag.set(tag, []);
    proTag.get(tag).push(m);
  }
  const wochen = new Map();
  for (const [tag, liste] of proTag) {
    const d = new Date(ms(tag));
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    const montag = tagSchluessel(d);
    const w = wochen.get(montag) ?? { montag, tage: 0, kcal: 0, leckerli: 0 };
    w.tage += 1;
    w.kcal += tagesSumme(liste, futterNachId).kcal;
    w.leckerli += leckerliKcal(liste, futterNachId);
    wochen.set(montag, w);
  }
  return [...wochen.values()]
    .sort((a, b) => a.montag.localeCompare(b.montag))
    .map((w) => ({ montag: w.montag, kcal: w.kcal / w.tage, leckerli: w.leckerli / w.tage }));
}

export function kcalDiagramm(mahlzeiten, futterNachId, freigaben) {
  const wochen = wochenKcal(mahlzeiten, futterNachId);
  const sortiert = [...freigaben].sort((a, b) => a.datum.localeCompare(b.datum));
  const yMax = Math.max(...wochen.map((w) => w.kcal), ...sortiert.map((f) => f.kcalProTag)) * 1.1;
  const y = skala(0, yMax, H - RAND.unten, RAND.oben);
  // Ein Feld je Kalenderwoche von der ersten bis zur letzten, auch für Wochen ohne Einträge (seit 0.36.2; vorher
  // rückten die Säulen nach einer leeren Woche nach links und standen über der falschen Beschriftung).
  const vonMs = ms(wochen[0].montag);
  const [bj, bm, bt] = wochen.at(-1).montag.split("-").map(Number);
  const bisMs = new Date(bj, bm - 1, bt + 7).getTime(); // Kalender statt + 7 × 24 h: sonst fehlt bei Zeitumstellung die letzte Achsenmarke
  const wocheNr = (montag) => Math.round((ms(montag) - vonMs) / (7 * TAG_MS));
  const anzahl = wocheNr(wochen.at(-1).montag) + 1;
  const slot = innenB / anzahl;
  const breite = Math.min(24, Math.max(3, slot - 2));
  const x = (i) => RAND.links + slot * (i + 0.5);
  const ecke = Math.min(4, breite / 2);
  const saeulen = wochen
    .map((w) => {
      const i = wocheNr(w.montag);
      const links = x(i) - breite / 2;
      const rechts = x(i) + breite / 2;
      const yFutter = y(w.kcal - w.leckerli);
      const yGesamt = y(w.kcal);
      // Futter unten, Leckerli oben mit 2 px Lücke; das obere Stück bekommt die runde Ecke.
      const futterTeil = w.leckerli > 0 ? `<rect class="saeule" x="${links}" y="${yFutter}" width="${breite}" height="${y(0) - yFutter}"/>` : "";
      const oben = w.leckerli > 0 ? yGesamt : yFutter;
      const unten = w.leckerli > 0 ? yFutter - 2 : y(0);
      const klasse = w.leckerli > 0 ? "saeule-2" : "saeule";
      const kappe = `<path class="${klasse}" d="M${links},${unten} V${oben + ecke} Q${links},${oben} ${links + ecke},${oben} H${rechts - ecke} Q${rechts},${oben} ${rechts},${oben + ecke} V${unten} Z"/>`;
      // Wie die Stufenlinie: die Freigabe, die am Sonntag der Woche galt (vorher Montag, Tooltip und Linie wichen ab).
      const [wj, wm, wt] = w.montag.split("-").map(Number);
      const freigabe = aktuelleFreigabe(sortiert, tagSchluessel(new Date(wj, wm - 1, wt + 6, 12)));
      const tip =
        `Woche ab ${kurzDatum(w.montag)}: Ø ${zahl(w.kcal)} kcal/Tag, davon ${zahl(w.leckerli)} Leckerli` +
        (freigabe ? ` · freigegeben ${zahl(freigabe.kcalProTag)}` : "");
      return treffer(x(i), slot, tip, futterTeil + kappe);
    })
    .join("");
  // Freigabe als Stufenlinie über die Wochen.
  let stufen = "";
  const punkte = [];
  for (let i = 0; i < anzahl; i++) {
    // Sonntag der Woche i; Kalenderrechnung statt + 6 × 24 h wegen der Zeitumstellung.
    const montag = new Date(vonMs);
    const sonntag = new Date(montag.getFullYear(), montag.getMonth(), montag.getDate() + 7 * i + 6, 12);
    const f = aktuelleFreigabe(sortiert, tagSchluessel(sonntag));
    if (f) punkte.push([RAND.links + slot * i, y(f.kcalProTag)], [RAND.links + slot * (i + 1), y(f.kcalProTag)]);
  }
  if (punkte.length) {
    stufen = `<polyline class="freigabe-linie" points="${punkte.map((p) => p.join(",")).join(" ")}"/>
      <text class="beschriftung" x="${B - RAND.rechts + 4}" y="${punkte.at(-1)[1] + 4}">Freigabe</text>`;
  }
  return svg(
    yAchse(schritte(0, yMax), y) + zeitAchse(vonMs, bisMs, skala(vonMs, bisMs, RAND.links, B - RAND.rechts)) + saeulen + stufen,
    "Kalorien pro Tag, Wochendurchschnitt"
  );
}

// ---------- Verlauf-Ansicht „Wiegeprotokoll“ (ab 0.23.0, vorher weiche Kurve seit 0.7.0) ----------

const TYP_SYMBOL = { nass: SYMBOL.nass, trocken: SYMBOL.trocken, leckerli: SYMBOL.leckerli };
const ZEITRAEUME = [
  ["1m", "1 Monat"],
  ["3m", "3 Monate"],
  ["alles", "Alles"],
];

// Wägungen ab "von" (oder alle), älteste zuerst.
export function verlaufGewichte(gewichte, von) {
  return [...gewichteSortiert(gewichte)].reverse().filter((g) => !von || g.datum >= von);
}

// Weiche Linie durch alle Punkte (Catmull-Rom als kubische Bézierkurven). Wird nicht mehr gezeichnet, bleibt für Erweiterungen.
export function glatt(p) {
  let d = `M${p[0][0]},${p[0][1]}`;
  for (let i = 0; i < p.length - 1; i++) {
    const a = p[i - 1] || p[i];
    const b = p[i];
    const c = p[i + 1];
    const n = p[i + 2] || c;
    d += ` C${b[0] + (c[0] - a[0]) / 6},${b[1] + (c[1] - a[1]) / 6} ${c[0] - (n[0] - b[0]) / 6},${c[1] - (n[1] - b[1]) / 6} ${c[0]},${c[1]}`;
  }
  return d;
}

// Gewichtskurve auf Millimeterpapier: gerade Linie von Wägung zu Wägung (wie von Hand eingetragen),
// Ziel vom Tierarzt gestrichelt, Freigaben als senkrechte Marken, sicherer Bereich als blasse Fläche.
// Gezeichnet werden die Wägungen ab "von"; der sichere Bereich rechnet aber vom Gewicht am Tag der ersten
// Freigabe, das auch vor dem Zeitraum liegen kann – deshalb bekommt die Funktion immer alle Wägungen.
// Der Name bleibt aus der Zeit der weichen Kurve, damit Aufrufer und Tests gleich bleiben.
// bis (seit 0.33.0): Ende der Zeitachse, im Verlauf heute. Rechts von der letzten Wägung bleibt bis dahin freie Fläche,
// sicherer Bereich, Monate und Freigabe-Marken laufen mit. Ohne bis endet die Achse an der letzten Wägung.
export function weicheKurve(gewichte, freigaben, von = null, bis = null) {
  const alle = verlaufGewichte(gewichte, null);
  const liste = verlaufGewichte(gewichte, von);
  if (liste.length < 2) return "";
  const KB = 340;
  const KH = 220;
  const R = { ...KURVE_RAND, oben: 14, unten: 24 };
  const kgs = liste.map((g) => g.kg);
  const yMin = Math.floor((Math.min(...kgs) - 0.15) * 10) / 10;
  const yMax = Math.ceil((Math.max(...kgs) + 0.15) * 10) / 10;
  const vonMs = ms(liste[0].datum);
  const bisMs = achsenEnde(bis, liste.at(-1).datum);
  const x = skala(vonMs, bisMs, R.links, KB - R.rechts);
  const y = skala(yMin, yMax, KH - R.unten, R.oben);
  const unten = KH - R.unten;

  const achse = schritte(yMin, yMax, 4)
    .map((w) => `<text class="achse" x="${R.links - 6}" y="${y(w) + 4}" text-anchor="end">${zahl(w, 1)}</text>`)
    .join("");
  const monate = [];
  const d = new Date(vonMs);
  d.setDate(1);
  d.setMonth(d.getMonth() + 1);
  for (; d.getTime() <= bisMs; d.setMonth(d.getMonth() + 1)) {
    monate.push(`<text class="achse" x="${x(d.getTime())}" y="${KH - 6}" text-anchor="middle">${d.toLocaleDateString("de-DE", { month: "short" })}</text>`);
  }

  // Sicherer Bereich wie im PDF-Diagramm: ab der ersten Freigabe 0,5–2 % pro Woche vom Gewicht an diesem Tag.
  const sortiert = [...freigaben].sort((a, b) => a.datum.localeCompare(b.datum));
  const erste = sortiert[0] ?? null;
  let band = "";
  if (erste && ms(erste.datum) < bisMs) {
    const startG = alle.filter((g) => g.datum <= erste.datum).at(-1) ?? alle[0];
    const s = Math.max(ms(erste.datum), vonMs);
    const zeiten = [];
    for (let t = s; t <= bisMs + 1; t += 7 * TAG_MS) zeiten.push(t);
    if (zeiten.at(-1) < bisMs) zeiten.push(bisMs);
    const kg = (t, rate) => Math.min(yMax, Math.max(yMin, startG.kg * (1 - rate / 100) ** ((t - ms(erste.datum)) / (7 * TAG_MS))));
    const oben = zeiten.map((t) => `${x(t)},${y(kg(t, GRENZEN.abnahmeMin))}`);
    const unterkante = zeiten.map((t) => `${x(t)},${y(kg(t, GRENZEN.abnahmeMax))}`).reverse();
    band = `<polygon class="band" points="${oben.concat(unterkante).join(" ")}"/>`;
  }

  // Freigaben im Zeitraum als senkrechte Marken; Beschriftung versetzt, wenn zwei dicht beieinander liegen.
  let letzteMarke = -Infinity;
  let reihe = 0;
  const marken = sortiert
    .filter((f) => ms(f.datum) >= vonMs && ms(f.datum) <= bisMs)
    .map((f) => {
      const fx = Math.round(x(ms(f.datum)) * 10) / 10;
      reihe = fx - letzteMarke < 64 ? 1 - reihe : 0;
      letzteMarke = fx;
      const rechtsBuendig = fx > KB - R.rechts - 50;
      return `<line class="freigabe-marke" x1="${fx}" x2="${fx}" y1="${R.oben}" y2="${unten}"/>
        <text class="freigabe-text" x="${rechtsBuendig ? fx - 4 : fx + 4}" y="${R.oben + 10 + reihe * 13}"${rechtsBuendig ? ' text-anchor="end"' : ""}>${zahl(f.kcalProTag)} kcal</text>`;
    })
    .join("");

  // Ziellinie nur mit Freigabe und nur, wenn das Ziel im sichtbaren Bereich liegt.
  const ziel = aktuelleFreigabe(freigaben)?.zielgewichtKg;
  const zielLinie =
    ziel && ziel >= yMin && ziel <= yMax
      ? `<line class="ziel" x1="${R.links}" x2="${KB - R.rechts}" y1="${y(ziel)}" y2="${y(ziel)}"/>
         <text class="ziel-text" x="${R.links + 6}" y="${y(ziel) - 6}">Ziel ${zahl(ziel, 2)} kg</text>`
      : "";

  const punkte = liste.map((g) => [Math.round(x(ms(g.datum)) * 10) / 10, Math.round(y(g.kg) * 10) / 10]);
  const pfad = "M" + punkte.map((p) => p.join(",")).join(" L");
  const tips = liste.map((g, i) => [...punkte[i], `${kurzDatum(g.datum)}: ${zahl(g.kg, 2)} kg`]);
  const [lx, ly] = punkte.at(-1);
  const endText = ly < R.oben + 16 ? ly + 18 : ly - 9;
  return `<svg viewBox="0 0 ${KB} ${KH}" class="kurve" role="img" aria-label="Gewichtsverlauf von ${zahl(liste[0].kg, 2)} auf ${zahl(liste.at(-1).kg, 2)} kg" data-punkte="${sicher(JSON.stringify(tips))}">
    ${band}${achse}${monate.join("")}
    <line class="grundlinie" x1="${R.links}" x2="${KB - R.rechts}" y1="${unten}" y2="${unten}"/>
    ${marken}${zielLinie}
    <path class="linie" d="${pfad}"/>
    <circle class="punkt" cx="${lx}" cy="${ly}" r="4.5"/>
    <text class="end-text" x="${Math.min(lx + 6, KB - 2)}" y="${endText}" text-anchor="${lx > KB - R.rechts - 4 ? "end" : "start"}">${zahl(liste.at(-1).kg, 2)}</text>
    <line class="hilfslinie" x1="0" x2="0" y1="${R.oben}" y2="${unten}" visibility="hidden"/>
    <circle class="punkt aktiv" cx="0" cy="0" r="6" visibility="hidden"/>
  </svg>`;
}

// Legende passend zu dem, was die Kurve gerade zeigt: Ziel, Freigabe und sicherer Bereich nur, wenn die fertige Kurve
// sie enthält (Ziel unter dem Ausschnitt; Handy-Test 05.11.2026). „Besonderer Tag“ nur mit Zeitleiste (0.33.0).
function legende(kurve, mitZeitleiste) {
  const teile = ['<span><i></i>Gewicht</span>'];
  if (kurve.includes('class="ziel"')) teile.push('<span><i class="ziel"></i>Ziel vom Tierarzt</span>');
  if (kurve.includes('class="freigabe-marke"')) teile.push('<span><i class="freigabe"></i>Freigabe</span>');
  if (kurve.includes('class="band"')) teile.push('<span><i class="band"></i>sicher: 0,5 bis 2 % pro Woche</span>');
  if (mitZeitleiste) teile.push('<span><i class="besonders"></i>Besonderer Tag</span>');
  return `<p class="legende-zeile">${teile.join("")}</p>`;
}

// ---------- Zeitleiste der besonderen Tage (seit 0.33.0) ----------
// Schmaler Streifen unter der Gewichtskurve im Verlauf der App, mit derselben Zeitachse (gleiche Breite, gleiche
// Ränder). Phasen als Balken mit runden Enden, eintägige Ereignisse als Punkte; überlappende in einer zweiten Reihe.
// Antippen zeigt, was war (app.js). Das PDF hat seit 0.35.0 einen eigenen Streifen mit Nummern (pdfZeitleiste, unten).
// eintraege: nur die des Tiers. vonTag/bisTag: Anfang und Ende der Achse ("JJJJ-MM-TT"). Leer ohne Einträge im Zeitraum.
// minHoehe: Höhe in Einheiten, mindestens; die Reihen stehen dann in der Mitte. Im Verlauf 56, damit der Streifen bei
// 375 px Breite rund 48 px hoch ist (Tippfläche, Review 05.11.).
const ZL = { halb: 4, abstand: 5, oben: 9, reihe: 14 };
const kurzNotiz = (text) => (text.length > 60 ? `${text.slice(0, 59).trimEnd()}…` : text);

export function zeitleiste(eintraege, { vonTag, bisTag, links, rechts, minHoehe = 0 }) {
  const liste = eintraege.filter((e) => beruehrt(e, vonTag, bisTag)).sort((a, b) => a.von.localeCompare(b.von));
  if (liste.length === 0) return "";
  const vonMs = ms(vonTag);
  const bisMs = ms(bisTag);
  const x = skala(vonMs, bisMs, links, B - rechts);
  const rund = (wert) => Math.round(wert * 10) / 10;
  const enden = [-Infinity, -Infinity];
  const teile = liste.map((e) => {
    const x1 = rund(x(Math.max(ms(e.von), vonMs)));
    const x2 = rund(x(Math.min(e.bis === null ? bisMs : ms(e.bis), bisMs)));
    const frei = enden.findIndex((ende) => x1 - ZL.halb >= ende + ZL.abstand);
    const reihe = frei >= 0 ? frei : enden[0] <= enden[1] ? 0 : 1;
    enden[reihe] = Math.max(enden[reihe], x2 + ZL.halb);
    const text = `${artVon(e.art).text}: ${zeitraumText(e)}${e.notiz ? ` · ${kurzNotiz(e.notiz)}` : ""}`;
    return { e, x1, x2, reihe, text };
  });
  const reihenHoehe = teile.some((t) => t.reihe === 1) ? ZL.oben * 2 + ZL.reihe : ZL.oben * 2;
  const hoehe = Math.max(reihenHoehe, minHoehe);
  const versatz = (hoehe - reihenHoehe) / 2;
  for (const t of teile) t.y = ZL.oben + t.reihe * ZL.reihe + versatz;
  // Erst die Balken, dann die Punkte: Ein einzelner Tag bleibt auch auf einer Phase in derselben Reihe sichtbar
  // (drei Einträge am selben Tag passen nicht ohne Überlappung in zwei Reihen).
  const istTag = (t) => t.e.bis === t.e.von;
  const formen = [...teile]
    .sort((a, b) => istTag(a) - istTag(b))
    .map(({ e, x1, x2, y, text }) => {
      const notfall = artVon(e.art).notfall ? " notfall" : "";
      const form =
        e.bis === e.von
          ? `<circle class="zl-punkt${notfall}" cx="${x1}" cy="${y}" r="${ZL.halb}"/>`
          : `<line class="zl-balken${notfall}" x1="${x1}" x2="${x2}" y1="${y}" y2="${y}"/>`;
      return `<g class="zl-eintrag"><title>${sicher(text)}</title>${form}</g>`;
    })
    .join("");
  const daten = teile.map(({ x1, x2, y, text }) => [x1, x2, y, text]);
  return `<svg viewBox="0 0 ${B} ${hoehe}" class="zeitleiste" role="img" aria-label="Besondere Tage im Zeitraum: ${liste.length}" data-eintraege="${sicher(JSON.stringify(daten))}">${formen}</svg>`;
}

// Antippen der Zeitleiste: der Eintrag mit dem kleinsten Abstand (waagerecht plus senkrecht; auf einem Balken oder
// Punkt samt rundem Ende zählt waagerecht 0). Bei Gleichstand gewinnt der schmalere, also ein Punkt auf einem Balken.
// liste: [[x1, x2, y, text], …] aus data-eintraege.
export function naechsterZeitleistenEintrag(liste, x, y) {
  const abstand = ([x1, x2, ey]) => Math.max(0, x1 - ZL.halb - x, x - x2 - ZL.halb) + Math.abs(y - ey);
  const breite = ([x1, x2]) => x2 - x1;
  return liste.reduce((a, b) => {
    const da = abstand(a);
    const db = abstand(b);
    return db < da || (db === da && breite(b) < breite(a)) ? b : a;
  });
}

// ---------- Streifen der besonderen Tage im PDF (seit 0.35.0) ----------
// Ruhiger als die Zeitleiste der App: dünne Linien, am Anfang ein Kreis mit der Nummer aus der Liste darunter
// (bericht.js). Ein Tag = nur der Kreis; mehrere Tage = Linie mit Querstrich am letzten Tag; läuft noch (oder geht über
// das Achsenende hinaus) = Linie mit Pfeil bis zum rechten Rand. „Futter verweigert“: Kreis gefüllt in der Notfall-Farbe,
// auch im Schwarzweiß-Druck erkennbar. Überlappende Einträge kommen in die nächste freie Reihe, so viele wie nötig.
// eintraege: die Liste des Berichts (nach Beginn sortiert); die Nummer ist der Platz darin, auch wenn ein Eintrag nicht
// auf der Achse liegt. vonTag/bisTag: Anfang und Ende der Achse wie bei gewichtDiagramm (Ränder PDF_RAND).
// Leer, wenn kein Eintrag die Achse berührt. Spezifikation: .planning/besondere-tage-pdf.md.
const PZ = { radius: 5.5, luft: 1.5, oben: 7, reihe: 14 };

export function pdfZeitleiste(eintraege, { vonTag, bisTag }) {
  const vonMs = ms(vonTag);
  const bisMs = ms(bisTag);
  const x = skala(vonMs, bisMs, PDF_RAND.links, B - PDF_RAND.rechts);
  const rund = (wert) => Math.round(wert * 10) / 10;
  const belegt = []; // je Reihe: bis wohin sie schon belegt ist
  const teile = eintraege
    .map((e, i) => ({ e, nr: i + 1 }))
    .filter(({ e }) => beruehrt(e, vonTag, bisTag))
    .map(({ e, nr }) => {
      const x1 = rund(x(Math.max(ms(e.von), vonMs)));
      const weiter = e.bis === null || ms(e.bis) > bisMs;
      const x2 = rund(x(weiter ? bisMs : ms(e.bis)));
      let reihe = belegt.findIndex((ende) => x1 - PZ.radius - PZ.luft >= ende);
      if (reihe < 0) reihe = belegt.push(-Infinity) - 1;
      belegt[reihe] = Math.max(x2 + 2, x1 + PZ.radius) + PZ.luft;
      return { e, nr, x1, x2, weiter, y: PZ.oben + reihe * PZ.reihe };
    });
  if (teile.length === 0) return "";
  const formen = teile.map(({ e, nr, x1, x2, weiter, y }) => {
    const art = artVon(e.art);
    const notfall = art.notfall ? " notfall" : "";
    const ende = weiter
      ? `<path class="bt-pfeil${notfall}" d="M${rund(x2 - 4)},${y - 3} L${x2},${y} L${rund(x2 - 4)},${y + 3}"/>`
      : `<line class="bt-ende${notfall}" x1="${x2}" x2="${x2}" y1="${y - 3}" y2="${y + 3}"/>`;
    const linie = x2 > x1 ? `<line class="bt-linie${notfall}" x1="${x1}" x2="${x2}" y1="${y}" y2="${y}"/>${ende}` : "";
    const text = `${nr} · ${art.text}: ${zeitraumText(e)}${e.notiz ? ` · ${kurzNotiz(e.notiz)}` : ""}`;
    return `<g class="bt-eintrag"><title>${sicher(text)}</title>${linie}<circle class="bt-kreis${notfall}" cx="${x1}" cy="${y}" r="${PZ.radius}"/><text class="bt-nr${notfall}" x="${x1}" y="${rund(y + 2.6)}">${nr}</text></g>`;
  });
  const hoehe = Math.max(...teile.map((t) => t.y)) + PZ.oben;
  return `<svg viewBox="0 0 ${B} ${hoehe}" class="bt-leiste" role="img" aria-label="Besondere Tage auf der Zeitachse, Nummern wie in der Liste darunter">${formen.join("")}</svg>`;
}

// Eckdaten wie auf einer Gewichtskarte: Start, Jetzt und – mit Freigabe – wie weit es noch bis zum Ziel ist.
function eckdaten(liste, freigaben) {
  const erste = liste[0];
  const letzte = liste.at(-1);
  const ziel = aktuelleFreigabe(freigaben)?.zielgewichtKg;
  const wochen = (ms(letzte.datum) - ms(erste.datum)) / (7 * TAG_MS);
  const diff = erste.kg - letzte.kg;
  const prozent = (diff / erste.kg) * 100;
  const feld = (titel, wert, zusatz) => `<div><span class="label">${titel}</span><strong>${wert}</strong><small>${zusatz}</small></div>`;
  const drittes = ziel
    ? letzte.kg <= ziel
      ? feld("Bis zum Ziel", "erreicht", `Ziel ${zahl(ziel, 2)} kg`)
      : feld("Bis zum Ziel", `${zahl(letzte.kg - ziel, 2)} kg`, `Ziel ${zahl(ziel, 2)} kg`)
    : feld(diff >= 0 ? "Abgenommen" : "Zugenommen", `${zahl(Math.abs(diff), 2)} kg`, `${zahl(Math.abs(prozent), 1)} %`);
  return `<div class="eckdaten">
    ${feld("Start", `${zahl(erste.kg, 2)} kg`, kurzDatum(erste.datum))}
    ${feld("Jetzt", `${zahl(letzte.kg, 2)} kg`, kurzDatum(letzte.datum))}
    ${drittes}
  </div>
  <p class="tipp">${diff >= 0 ? "Abgenommen" : "Zugenommen"}: ${zahl(Math.abs(diff), 2)} kg (${zahl(Math.abs(prozent), 1)} %) in ${zahl(wochen)} ${Math.round(wochen) === 1 ? "Woche" : "Wochen"}.</p>`;
}

const vorzeichen = (wert, stellen) => (wert > 0 ? "+" : wert < 0 ? "−" : "±") + zahl(Math.abs(wert), stellen);

const NB = " "; // geschütztes Leerzeichen zwischen Zahl und Einheit
const grenzeText = (wert) => wert.toLocaleString("de-DE"); // Grenze aus GRENZEN als Text, z. B. „2“ oder „0,5“
// Zahl mit echtem Minuszeichen; nie „-0“ oder „−0,0“ (zahl(-0) ergibt in V8 „-0“).
const mitMinus = (wert, stellen) => {
  const text = zahl(Math.abs(wert), stellen);
  return wert < 0 && /[1-9]/.test(text) ? `−${text}` : text;
};

// Höhe des Tempo-Diagramms (seit 0.40.0) in % pro Woche: von 0 (bei Zunahmen tiefer: Minimum − 0,1, auf 0,5
// abgerundet) bis 0,5 über der oberen Grenze (2,5) oder Maximum + 0,2, auf 0,5 aufgerundet. 1e-9 gleicht
// Rundungsfehler aus (2,8 + 0,2 ist im Rechner nicht genau 3). hi liegt immer über lo: nie Teilen durch 0.
// Begrenzt (Fix-Runde 1, Review 05.11.2026): höchstens 2,5 × obere Grenze (5), mindestens −(obere Grenze + 0,5)
// (−2,5). Wiegen an aufeinanderfolgenden Tagen ergibt sonst Wochenraten von 15 % und mehr; die Achse wurde
// unlesbar. Werte darüber hinaus zeichnet tempoDiagramm am Rand mit Pfeil.
export function tempoAchse(werte) {
  const hiMax = 2.5 * GRENZEN.abnahmeMax;
  const loMin = -(GRENZEN.abnahmeMax + 0.5);
  const hi = Math.min(hiMax, Math.max(GRENZEN.abnahmeMax + 0.5, Math.ceil((Math.max(...werte) + 0.2) * 2 - 1e-9) / 2));
  const lo = Math.max(loMin, Math.min(0, Math.floor((Math.min(...werte) - 0.1) * 2 + 1e-9) / 2));
  return { lo: lo || 0, hi }; // || 0: kein -0
}

// Tempo pro Woche (seit 0.40.0): jede Wägung im Zeitraum ein Punkt über der Zeit, auf Millimeterpapier wie die
// Gewichtskurve. vonMs/bisMs: dieselbe Zeitachse wie die Kurve darüber (gleiche Ränder KURVE_RAND, Breite 340),
// damit die Punkte unter den Wägungen der Kurve stehen. Band aus GRENZEN, Farben wie die Bewertung in wochenRaten,
// Ø als kurzer Strich am rechten Rand. Nur Bild (aria-hidden); die Aussagen stehen in Kopfzeile und Erklärsatz.
const TEMPO = { breite: 340, hoehe: 176, oben: 10, unten: 22 };

function tempoDiagramm(raten, { vonMs, bisMs }, durchschnitt) {
  const W = TEMPO.breite;
  const TH = TEMPO.hoehe;
  const L = KURVE_RAND.links;
  const R = KURVE_RAND.rechts;
  const grund = TH - TEMPO.unten;
  const r1 = (v) => Math.round(v * 10) / 10;
  const liste = [...raten].reverse(); // älteste zuerst
  const { lo, hi } = tempoAchse(liste.map((r) => r.prozent));
  const sx = skala(vonMs, bisMs, L, W - R);
  const sy = skala(lo, hi, grund, TEMPO.oben);
  const x = (t) => r1(sx(t));
  const y = (v) => r1(sy(v));
  const yk = (v) => y(Math.min(hi, Math.max(lo, v))); // Ausreißer am Rand der Zeichenfläche

  // Hilfslinien alle 0,5 %, Zahlen bei 0,5 und ganzen Werten, die oberste ganze Zahl mit „%“; Nulllinie kräftiger.
  // Bei großer Spanne (über 4 %) Linien alle 1 % und nur ganze Zahlen; so liegen die Zahlen mindestens 14 Einheiten
  // auseinander (144 Einheiten Höhe: 0,5 % ≥ 18, 1 % ≥ 19,2).
  const schritt = hi - lo > 4 ? 1 : 0.5;
  const stufen = [];
  for (let v = schritt === 1 ? Math.ceil(lo) : lo; v <= hi + 1e-9; v += schritt) stufen.push(Math.round(v * 10) / 10 || 0);
  const obersteGanze = Math.max(...stufen.filter(Number.isInteger));
  const gitter = stufen
    .map((v) => {
      const linie = `<line class="${v === 0 ? "tempo-null" : "gitter"}" x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}"/>`;
      if (!Number.isInteger(v) && (v !== 0.5 || schritt === 1)) return linie;
      const text = mitMinus(v, Number.isInteger(v) ? 0 : 1) + (v === obersteGanze ? `${NB}%` : "");
      return `${linie}<text class="achse" x="${L - 5}" y="${r1(y(v) + 4)}" text-anchor="end">${sicher(text)}</text>`;
    })
    .join("");

  const yOben = y(GRENZEN.abnahmeMax);
  const band = `<rect class="tempo-band" x="${L}" y="${yOben}" width="${W - L - R}" height="${r1(y(GRENZEN.abnahmeMin) - yOben)}"/>
    <text class="tempo-band-text" x="${L + 5}" y="${r1(yOben + 12)}">sicherer Bereich</text>`;

  const linie =
    liste.length > 1 ? `<polyline class="tempo-verbindung" points="${liste.map((r) => `${x(ms(r.datum))},${yk(r.prozent)}`).join(" ")}"/>` : "";
  // Punkte außerhalb der Achse stehen am Rand, mit „▲“ (darüber) oder „▼“ (darunter); der Titel nennt den echten Wert.
  const punkte = liste
    .map((r, i) => {
      const titel = `${kurzDatum(r.datum)}: ${zahl(Math.abs(r.prozent), 2)}${NB}% ${r.prozent < 0 ? "zugenommen" : "abgenommen"}`;
      const cx = x(ms(r.datum));
      const cy = yk(r.prozent);
      const pfeil = r.prozent > hi + 1e-9 ? "▲" : r.prozent < lo - 1e-9 ? "▼" : "";
      // Nahe am rechten Rand links vom Punkt, sonst ragt der Pfeil in die Ø-Spalte (0.42.2; Pfeil etwa 8 breit).
      const pfeilLinks = cx + 6 + 8 > W - R;
      const pfeilText = pfeilLinks
        ? `<text class="tempo-pfeil" x="${r1(cx - 6)}" y="${r1(cy + 3.5)}" text-anchor="end">${pfeil}</text>`
        : `<text class="tempo-pfeil" x="${r1(cx + 6)}" y="${r1(cy + 3.5)}">${pfeil}</text>`;
      return (
        `<circle class="tempo-p ${sicher(r.bewertung)}" cx="${cx}" cy="${cy}" r="${i === liste.length - 1 ? 5 : 3.5}"><title>${sicher(titel)}</title></circle>` +
        (pfeil ? pfeilText : "")
      );
    })
    .join("");

  // Wert der neuesten Wägung links über ihrem Punkt; ganz links (nur ein Punkt) rechts daneben, damit er nicht in die Zahlen läuft.
  const letzte = liste.at(-1);
  const lx = x(ms(letzte.datum));
  const ly = yk(letzte.prozent);
  const links = lx - 2 > L + 34;
  const endY = r1(ly - 9 < TEMPO.oben ? ly + 16 : ly - 9); // am oberen Rand (Ausreißer) unter den Punkt
  // Zahl nahe den Grenzen mit zwei Stellen in Richtung des Urteils (tempoZahl, seit 0.40.1); Zunahme mit echtem Minus.
  const endZahl = tempoZahl(letzte.prozent);
  const endWert = letzte.prozent < 0 && /[1-9]/.test(endZahl) ? `−${endZahl}` : endZahl;
  const endText = `<text class="tempo-end-text" x="${links ? r1(lx - 2) : r1(lx + 8)}" y="${endY}" text-anchor="${links ? "end" : "start"}">${sicher(endWert)}${NB}%</text>`;

  // Ø im rechten Rand, wenn der Text dort hineinpasst (geschätzt 6 Einheiten je Zeichen, 4 Einheiten Innenabstand
  // des Papiers dürfen mitgenutzt werden); sonst innen am rechten Rand. Innen weicht der Text dem Wert des neuesten
  // Punkts aus (Grundlinien mindestens 12 Einheiten auseinander), der Strich bleibt beim Durchschnitt.
  const yd = yk(durchschnitt);
  const dText = `Ø ${mitMinus(durchschnitt, 2)}`;
  const imRand = W - R + 8 + dText.length * 6 <= W + 4;
  let dy = r1(yd + 4);
  if (!imRand && links && Math.abs(dy - endY) < 12) {
    const drueber = r1(endY - 12);
    const drunter = r1(endY + 12);
    dy = (dy < endY && drueber >= TEMPO.oben) || drunter > grund ? drueber : drunter;
  }
  const durch = imRand
    ? `<line class="tempo-durch" x1="${W - R}" x2="${W - R + 6}" y1="${yd}" y2="${yd}"/><text class="tempo-durch-text" x="${W - R + 8}" y="${dy}">${sicher(dText)}</text>`
    : `<line class="tempo-durch" x1="${W - R - 6}" x2="${W - R}" y1="${yd}" y2="${yd}"/><text class="tempo-durch-text" x="${W - R - 8}" y="${dy}" text-anchor="end">${sicher(dText)}</text>`;

  return `<div class="papier"><svg class="tempo-diagramm" viewBox="0 0 ${W} ${TH}" aria-hidden="true">
    ${band}${gitter}${durch}${linie}${punkte}${endText}${zeitAchse(vonMs, bisMs, sx, grund, TH)}
  </svg></div>`;
}

// heute (seit 0.40.0): Ende der Zeitachse wie bei der Gewichtskurve.
function tempoKarte(gewichte, freigaben, von, heute) {
  const raten = wochenRaten(gewichte, freigaben).filter((r) => !von || r.datum >= von);
  if (raten.length === 0) return "";
  const z = abnahmeZusammenfassung(raten);
  const bereich = z.bewertet > 0 ? ` · ${z.imBereich} von ${z.bewertet} ${z.bewertet === 1 ? "Woche" : "Wochen"} im sicheren Bereich` : "";
  // Zeitachse wie weicheKurve: von der ersten Wägung im Zeitraum bis heute, mindestens bis zur letzten Wägung.
  // Ohne Kurve darüber (weniger als 2 Wägungen im Zeitraum) ab der Wägung vor dem ältesten Punkt.
  const imZeitraum = verlaufGewichte(gewichte, von);
  const vonMs = ms(imZeitraum.length >= 2 ? imZeitraum[0].datum : raten.at(-1).vonDatum);
  const bisMs = achsenEnde(heute, imZeitraum.at(-1).datum);
  const marke = { gut: "marke-gut", langsam: "marke-warnung", "zu-schnell": "marke-gefahr", neutral: "" };
  // Je Woche das Tempo wie im Kopf und auf der Skala: Abnahme ohne Vorzeichen, Zunahme mit „−“ (0.42.3).
  const zeilen = raten
    .map((r) => {
      const d = new Date(ms(r.datum));
      const breite = Math.min(100, Math.max(0, (r.prozent / GRENZEN.abnahmeMax) * 100));
      return `<div class="woche">
        <span class="tag"><b>${d.getDate()}</b>${d.toLocaleDateString("de-DE", { month: "short" })}</span>
        <span class="balken ${r.bewertung}"><i style="--w: ${breite.toFixed(1)}%"></i></span>
        <span class="marke ${marke[r.bewertung]}">${mitMinus(r.prozent, 2)} %</span>
      </div>`;
    })
    .join("");
  const schnell = `${grenzeText(GRENZEN.abnahmeMax)}${NB}%`;
  const erklaerung = freigaben.length
    ? `Jeder Punkt steht für ein Wiegen, auf 7 Tage umgerechnet. Grün: im sicheren Bereich, Bernstein: langsamer, Rot: schneller als ${schnell}. Unter der Nulllinie: zugenommen.` +
      (raten.some((r) => r.bewertung === "neutral") ? " Grau: vor der Freigabe, noch nicht bewertet." : "")
    : `Jeder Punkt steht für ein Wiegen, auf 7 Tage umgerechnet. Bewertet wird erst ab der Freigabe vom Tierarzt; schneller als ${schnell} ist immer rot. Unter der Nulllinie: zugenommen.`;
  return `<section class="karte" aria-labelledby="tempo-titel">
    <h2 id="tempo-titel">Tempo pro Woche</h2>
    <p>Ø ${mitMinus(z.durchschnitt, 2)}${NB}% pro Woche${bereich}</p>
    ${tempoDiagramm(raten, { vonMs, bisMs }, z.durchschnitt)}
    <p class="tipp tempo-erklaerung">${sicher(erklaerung)}</p>
    ${aufklappKarte({
      id: "abnahme",
      klasse: "tag-klapp",
      kopf: `<span class="zusammen">Alle Wochen<small>${raten.length} ${raten.length === 1 ? "Wert" : "Werte"}, neueste zuerst</small></span>`,
      inhalt: zeilen,
    })}
  </section>`;
}

function futterKarte(mahlzeiten, futterNachId, freigaben, von, heute) {
  const tage = futterTage(mahlzeiten, futterNachId, freigaben).filter((t) => !von || t.tag >= von);
  if (tage.length === 0) return "";
  const z = futterZusammenfassung(tage, heute);
  const mitFreigabe = tage.some((t) => t.freigabeKcal !== null);
  const kopf =
    `${z.durchschnitt === null ? "noch kein ganzer Tag" : `Ø ${zahl(z.durchschnitt)} kcal`} · ${z.anzahl} ${z.anzahl === 1 ? "Tag" : "Tage"}` +
    (mitFreigabe ? ` · ${z.ueber}× über der Freigabe` : "");
  const hoechster = Math.max(...tage.map((t) => t.kcal), 1);
  const inhalt = wochenGruppen(tage, heute)
    .map(
      (gruppe) =>
        `<p class="gruppe-titel">${gruppe.titel}</p>` +
        gruppe.tage
          .map((t) => {
            const voll = t.freigabeKcal ?? hoechster;
            const breite = Math.min(100, (t.kcal / voll) * 100);
            const d = new Date(ms(t.tag));
            const name =
              t.tag === heute
                ? "Heute<small>läuft noch</small>"
                : `${d.toLocaleDateString("de-DE", { weekday: "short" })}<small>${kurzDatum(t.tag)}</small>`;
            const zeilen = t.mahlzeiten
              .map((m) => {
                const f = futterNachId.get(m.futterId);
                const uhr = new Date(m.zeitpunkt).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
                return `<div class="zeile"><span class="icon" aria-hidden="true">${TYP_SYMBOL[f?.typ] ?? SYMBOL.unbekannt}</span>
                  <span class="name">${sicher(f ? f.name : "Gelöschte Sorte")}<small>${uhr} · ${zahl(m.gramm)} g</small></span>
                  <span class="kcal">${f ? zahl(kcalFuer(m.gramm, f.kcalPro100g)) : "?"}</span></div>`;
              })
              .join("");
            return aufklappKarte({
              id: "tag-" + t.tag,
              klasse: "tag-klapp",
              kopf: `<span class="tagname">${name}</span><span class="balken${t.ueber ? " ueber" : ""}"><i style="--w: ${breite.toFixed(1)}%"></i></span><span class="kcal">${t.unsicher ? "ca. " : ""}${zahl(t.kcal)}</span>`,
              inhalt: zeilen,
            });
          })
          .join("")
    )
    .join("");
  return aufklappKarte({
    id: "futter-pro-tag",
    klasse: "karte",
    kopf: `<span class="zusammen"><span class="karte-titel">Futter pro Tag</span><br>${kopf}
      <small>${mitFreigabe ? "Balken voll = Freigabe; Bernstein = mehr als 10 % darüber" : "Balken voll = höchster Tag im Zeitraum"}</small></span>`,
    inhalt,
  });
}

// Alle Freigaben, neueste zuerst – unabhängig vom Zeitraum, damit der Verlauf von BCS und MCS sichtbar bleibt.
// Bei gleichem Datum (alte Daten) die zuletzt eingetragene zuerst, wie in aktuelleFreigabe (seit 0.34.0).
function befundKarte(freigaben) {
  if (freigaben.length === 0) return "";
  const sortiert = freigaben
    .map((f, stelle) => ({ f, stelle }))
    .sort((a, b) => b.f.datum.localeCompare(a.f.datum) || b.stelle - a.stelle)
    .map(({ f }) => f);
  const langDatum = (iso) => new Date(ms(iso)).toLocaleDateString("de-DE");
  const zeilen = sortiert
    .map(
      (f) => `<div class="zeile"><span class="icon" aria-hidden="true">${SYMBOL.tierarzt}</span>
        <span class="name">${befundText(f) || "ohne BCS"}<small>${langDatum(f.datum)} · ${sicher(f.tierarzt)}<br>
          Ziel ${zahl(f.zielgewichtKg, 1)} kg · ${zahl(f.kcalProTag)} kcal pro Tag</small></span></div>`
    )
    .join("");
  const neueste = befundText(sortiert[0]) || "ohne BCS";
  return aufklappKarte({
    id: "befunde",
    klasse: "karte",
    kopf: `<span class="zusammen"><span class="karte-titel">Befunde vom Tierarzt</span><br>${neueste}
      <small>${sortiert.length} ${sortiert.length === 1 ? "Freigabe" : "Freigaben"} · neueste zuerst</small></span>`,
    inhalt: zeilen,
  });
}

// fotos: fertige Vorher/Nachher-Karte aus app.js (ab 0.25.0), steht seit 0.29.4 ganz am Ende (freiwillig, ändert sich selten).
// besondereTage (seit 0.33.0): nur die des Tiers; erscheinen als Zeitleiste unter der Kurve.
export function zeichneVerlauf({ gewichte, mahlzeiten, freigaben, besondereTage = [], futterNachId, zeitraum, heute, kopf, fotos = "" }) {
  if (gewichte.length < 2) {
    return `${kopf}<p class="leer">Sobald mindestens zwei Gewichte eingetragen sind, erscheint hier der Verlauf.</p>${fotos}`;
  }
  const von = zeitraumStart(zeitraum, heute);
  const umschalter = `<div class="umschalter" role="group" aria-label="Zeitraum">
    ${ZEITRAEUME.map(([wert, text]) => `<button type="button" data-aktion="zeitraum" data-wert="${wert}" aria-pressed="${wert === zeitraum}">${text}</button>`).join("")}
  </div>`;

  const imZeitraum = verlaufGewichte(gewichte, von);
  const alle = verlaufGewichte(gewichte, null);
  const aktuell = alle.at(-1);
  let aenderung = "";
  if (imZeitraum.length >= 2) {
    const diff = imZeitraum.at(-1).kg - imZeitraum[0].kg;
    // Neutral: ob eine Abnahme gut ist, bewertet nur „Tempo pro Woche“ (mit Freigabe, über 2 % immer markiert).
    aenderung = `<span class="marke">${vorzeichen(diff, 2)} kg</span>`;
  }
  const svg = imZeitraum.length >= 2 ? weicheKurve(gewichte, freigaben, von, heute) : "";
  // Gleiches Achsenende wie die Kurve: heute, mindestens die letzte Wägung.
  const leiste = svg
    ? zeitleiste(besondereTage, { vonTag: imZeitraum[0].datum, bisTag: heute > aktuell.datum ? heute : aktuell.datum, ...KURVE_RAND, minHoehe: 56 })
    : "";
  const tipp = leiste
    ? "Tippe auf die Kurve oder auf einen besonderen Tag darunter, um Einzelheiten zu sehen."
    : "Tippe auf die Kurve, um Datum und Gewicht zu sehen.";
  const kurve =
    imZeitraum.length >= 2
      ? `<div class="papier"><div class="kurve-feld">${svg}${leiste}<div class="infoblase" id="infoblase" hidden></div></div></div>
         ${legende(svg, !!leiste)}
         <p class="tipp">${tipp} Alle Gewichte als Liste stehen unter „Gewicht“.</p>`
      : `<p class="leer">Im gewählten Zeitraum wurde weniger als zweimal gewogen.</p>`;
  const gewichtKarte = `<section class="karte" aria-label="Gewicht">
    <div class="diagramm-kopf">
      <div><span class="label">Gewicht</span><div class="wert">${zahl(aktuell.kg, 2)} <small>kg</small></div></div>
      ${aenderung}
    </div>
    ${kurve}
  </section>`;

  return (
    kopf +
    (imZeitraum.length >= 2 ? eckdaten(imZeitraum, freigaben) : "") +
    umschalter +
    gewichtKarte +
    tempoKarte(gewichte, freigaben, von, heute) +
    (mahlzeiten.length ? futterKarte(mahlzeiten, futterNachId, freigaben, von, heute) : "") +
    befundKarte(freigaben) +
    fotos
  );
}
