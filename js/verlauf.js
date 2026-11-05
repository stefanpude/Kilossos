// Ansicht "Verlauf": Eckdaten, Zeitraum-Umschalter, Gewichtskurve auf Millimeterpapier, Tempo pro Woche und
// zwei aufklappbare Karten (Futter pro Tag, Befunde vom Tierarzt) – alles als HTML-Text, ohne Zusatzpakete.
// gewichtDiagramm und kcalDiagramm sind die älteren Diagramme; sie bleiben unverändert für den PDF-Bericht.
// Farben kommen aus styles.css (--reihe-1, --reihe-2, --akzent, --gut, --rand, --text-leise).

import { GRENZEN, gewichteSortiert, tagesSumme, leckerliKcal, tagSchluessel, aktuelleFreigabe, kcalFuer } from "./rechnen.js";
import { zeitraumStart, wochenRaten, abnahmeZusammenfassung, futterTage, futterZusammenfassung, wochenGruppen } from "./zusammenfassung.js";
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

// Monatsanfänge als Beschriftung der Zeitachse.
function zeitAchse(vonMs, bisMs, x) {
  const teile = [];
  const d = new Date(vonMs);
  d.setDate(1);
  d.setMonth(d.getMonth() + 1);
  for (; d.getTime() <= bisMs; d.setMonth(d.getMonth() + 1)) {
    teile.push(
      `<text class="achse" x="${x(d.getTime())}" y="${H - 6}" text-anchor="middle">${d.toLocaleDateString("de-DE", { month: "short" })}</text>`
    );
  }
  return teile.join("");
}

const svg = (inhalt, titel) =>
  `<svg viewBox="0 0 ${B} ${H}" class="diagramm" role="img" aria-label="${sicher(titel)}">${inhalt}</svg>`;

// Unsichtbare, breite Trefferflächen: Tippen oder Zeigen blendet den Tooltip ein (app.js).
const treffer = (x, breite, tip, extra = "") =>
  `<g class="treffer" data-tip="${sicher(tip)}">${extra}<rect x="${x - breite / 2}" y="${RAND.oben}" width="${breite}" height="${innenH}" fill="transparent"/></g>`;

// bis: letzter Tag des Berichtszeitraums; die Achse endet dort (seit 0.33.0), die Linie an der letzten Wägung.
export function gewichtDiagramm(gewichte, freigaben, bis = null) {
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
  let band = "";
  if (erste) {
    const startG = liste.filter((g) => g.datum <= erste.datum).at(-1) ?? liste[0];
    const s = ms(erste.datum);
    const punkte = [];
    for (let t = s; t <= bisMs + 1; t += 7 * TAG_MS) punkte.push(t);
    if (punkte.at(-1) < bisMs) punkte.push(bisMs);
    const kg = (t, rate) => Math.max(yMin, startG.kg * (1 - rate / 100) ** ((t - s) / (7 * TAG_MS)));
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
  const slot = innenB / wochen.length;
  const breite = Math.min(24, Math.max(3, slot - 2));
  const x = (i) => RAND.links + slot * (i + 0.5);
  const ecke = Math.min(4, breite / 2);
  const saeulen = wochen
    .map((w, i) => {
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
      const freigabe = aktuelleFreigabe(sortiert, w.montag);
      const tip =
        `Woche ab ${kurzDatum(w.montag)}: Ø ${zahl(w.kcal)} kcal/Tag, davon ${zahl(w.leckerli)} Leckerli` +
        (freigabe ? ` · freigegeben ${zahl(freigabe.kcalProTag)}` : "");
      return treffer(x(i), slot, tip, futterTeil + kappe);
    })
    .join("");
  // Freigabe als Stufenlinie über die Wochen.
  let stufen = "";
  const punkte = [];
  wochen.forEach((w, i) => {
    const f = aktuelleFreigabe(sortiert, tagSchluessel(new Date(ms(w.montag) + 6 * TAG_MS)));
    if (f) punkte.push([RAND.links + slot * i, y(f.kcalProTag)], [RAND.links + slot * (i + 1), y(f.kcalProTag)]);
  });
  if (punkte.length) {
    stufen = `<polyline class="freigabe-linie" points="${punkte.map((p) => p.join(",")).join(" ")}"/>
      <text class="beschriftung" x="${B - RAND.rechts + 4}" y="${punkte.at(-1)[1] + 4}">Freigabe</text>`;
  }
  const vonMs = ms(wochen[0].montag);
  const bisMs = ms(wochen.at(-1).montag) + 7 * TAG_MS;
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
// Schmaler Streifen unter der Gewichtskurve bzw. dem PDF-Diagramm, mit derselben Zeitachse (gleiche Breite, gleiche
// Ränder). Phasen als Balken mit runden Enden, eintägige Ereignisse als Punkte; überlappende in einer zweiten Reihe.
// eintraege: nur die des Tiers. vonTag/bisTag: Anfang und Ende der Achse ("JJJJ-MM-TT"). Leer ohne Einträge im Zeitraum.
// minHoehe: Höhe in Einheiten, mindestens; die Reihen stehen dann in der Mitte. Im Verlauf 56, damit der Streifen bei
// 375 px Breite rund 48 px hoch ist (Tippfläche, Review 05.11.); im PDF schmal.
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

// Tempo pro Woche: Säulen der letzten 12 Wochenraten im Band 0,5 bis 2 %. Farben wie die Bewertung in wochenRaten.
function tempoDiagramm(raten) {
  const liste = raten.slice(0, 12).reverse();
  const TB = 300;
  const TH = 90;
  const breite = 268;
  const oben = 6;
  const unten = TH - 6;
  const y = skala(-0.5, 2.6, unten, oben);
  const klemm = (v) => Math.min(2.6, Math.max(-0.5, v));
  const slot = breite / liste.length;
  const saeulen = liste
    .map((r, i) => {
      const v = klemm(r.prozent);
      const y0 = y(0);
      const y1 = y(v);
      const w = Math.min(14, slot * 0.5);
      return `<rect class="saeule ${r.bewertung}" x="${(i * slot + (slot - w) / 2).toFixed(1)}" y="${Math.min(y0, y1).toFixed(1)}" width="${w.toFixed(1)}" height="${Math.max(1.5, Math.abs(y1 - y0)).toFixed(1)}" rx="1.5"/>`;
    })
    .join("");
  return `<svg class="tempo" viewBox="0 0 ${TB} ${TH}" aria-hidden="true">
    <rect class="band" x="0" y="${y(GRENZEN.abnahmeMax)}" width="${breite}" height="${y(GRENZEN.abnahmeMin) - y(GRENZEN.abnahmeMax)}"/>
    <text class="achse" x="${TB}" y="${y(GRENZEN.abnahmeMax) + 4}" text-anchor="end">2 %</text>
    <text class="achse" x="${TB}" y="${y(GRENZEN.abnahmeMin) + 4}" text-anchor="end">0,5 %</text>
    <line class="grundlinie" x1="0" x2="${breite}" y1="${y(0)}" y2="${y(0)}"/>
    ${saeulen}
  </svg>`;
}

function tempoKarte(gewichte, freigaben, von) {
  const raten = wochenRaten(gewichte, freigaben).filter((r) => !von || r.datum >= von);
  if (raten.length === 0) return "";
  const z = abnahmeZusammenfassung(raten);
  const bereich = z.bewertet > 0 ? ` · ${z.imBereich} von ${z.bewertet} ${z.bewertet === 1 ? "Woche" : "Wochen"} im sicheren Bereich` : "";
  const marke = { gut: "marke-gut", langsam: "marke-warnung", "zu-schnell": "marke-gefahr", neutral: "" };
  const zeilen = raten
    .map((r) => {
      const d = new Date(ms(r.datum));
      const breite = Math.min(100, Math.max(0, (r.prozent / GRENZEN.abnahmeMax) * 100));
      return `<div class="woche">
        <span class="tag"><b>${d.getDate()}</b>${d.toLocaleDateString("de-DE", { month: "short" })}</span>
        <span class="balken ${r.bewertung}"><i style="--w: ${breite.toFixed(1)}%"></i></span>
        <span class="marke ${marke[r.bewertung]}">${r.prozent >= 0 ? "−" : "+"}${zahl(Math.abs(r.prozent), 2)} %</span>
      </div>`;
    })
    .join("");
  const erklaerung = freigaben.length
    ? "Band: 0,5 bis 2 % pro Woche gelten als sicher. Je Wägung, auf 7 Tage umgerechnet."
    : "Band: 0,5 bis 2 % pro Woche gelten als sicher. Bewertet wird erst ab der Freigabe vom Tierarzt; über 2 % ist immer markiert.";
  return `<section class="karte" aria-labelledby="tempo-titel">
    <h2 id="tempo-titel">Tempo pro Woche</h2>
    <p>Ø ${zahl(z.durchschnitt, 2)} % pro Woche${bereich}</p>
    ${tempoDiagramm(raten)}
    <p class="tipp">${erklaerung}</p>
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
      : `<p class="leer">Im gewählten Zeitraum gibt es weniger als zwei Wägungen.</p>`;
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
    tempoKarte(gewichte, freigaben, von) +
    (mahlzeiten.length ? futterKarte(mahlzeiten, futterNachId, freigaben, von, heute) : "") +
    befundKarte(freigaben) +
    fotos
  );
}
