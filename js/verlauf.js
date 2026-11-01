// Ansicht "Verlauf": Kennzahlen und drei Diagramme (Gewicht, Abnahme pro Woche, kcal pro Tag) als SVG,
// ohne Zusatzpakete. Farben kommen aus styles.css (--reihe-1, --reihe-2, --gut, --rand, --text-leise).

import { GRENZEN, gewichteSortiert, tagesSumme, leckerliKcal, tagSchluessel, aktuelleFreigabe } from "./rechnen.js";

const B = 340; // Breite der Zeichenfläche (viewBox); das SVG skaliert auf die Bildschirmbreite
const H = 190;
const RAND = { links: 34, rechts: 52, oben: 12, unten: 22 };
const innenB = B - RAND.links - RAND.rechts;
const innenH = H - RAND.oben - RAND.unten;

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

function gewichtDiagramm(gewichte, freigaben) {
  const liste = [...gewichteSortiert(gewichte)].reverse();
  const erste = freigaben.length ? [...freigaben].sort((a, b) => a.datum.localeCompare(b.datum))[0] : null;
  const ziel = aktuelleFreigabe(freigaben)?.zielgewichtKg;
  const vonMs = ms(liste[0].datum);
  const bisMs = ms(liste.at(-1).datum);
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
       <circle class="endpunkt" cx="${x(bisMs)}" cy="${y(letzte.kg)}" r="4"/>
       <text class="beschriftung stark" x="${B - RAND.rechts + 4}" y="${y(letzte.kg) - 4}">${zahl(letzte.kg, 2)} kg</text>` +
      punkte,
    "Gewichtsverlauf in kg"
  );
}

function abnahmeDiagramm(gewichte) {
  const liste = [...gewichteSortiert(gewichte)].reverse();
  const raten = liste.slice(1).map((g, i) => {
    const alt = liste[i];
    const wochen = (ms(g.datum) - ms(alt.datum)) / (7 * TAG_MS);
    return { datum: g.datum, prozent: ((alt.kg - g.kg) / alt.kg / wochen) * 100 };
  });
  const yMin = Math.min(0, ...raten.map((r) => r.prozent));
  const yMax = Math.max(2.5, ...raten.map((r) => r.prozent));
  const y = skala(yMin, yMax, H - RAND.unten, RAND.oben);
  const slot = innenB / raten.length;
  const breite = Math.min(24, Math.max(3, slot - 2));
  const x = (i) => RAND.links + slot * (i + 0.5);
  const ecke = Math.min(4, breite / 2);
  const saeulen = raten
    .map((r, i) => {
      const y0 = y(0);
      const y1 = y(r.prozent);
      const hoch = Math.abs(y0 - y1);
      // Abgerundet nur am Datenende, gerade an der Nulllinie.
      const pfad =
        r.prozent >= 0
          ? `M${x(i) - breite / 2},${y0} V${y1 + ecke} Q${x(i) - breite / 2},${y1} ${x(i) - breite / 2 + ecke},${y1} H${x(i) + breite / 2 - ecke} Q${x(i) + breite / 2},${y1} ${x(i) + breite / 2},${y1 + ecke} V${y0} Z`
          : `M${x(i) - breite / 2},${y0} V${y0 + hoch} H${x(i) + breite / 2} V${y0} Z`;
      return treffer(x(i), slot, `Woche bis ${kurzDatum(r.datum)}: ${zahl(r.prozent, 2)} % pro Woche`, `<path class="saeule" d="${pfad}"/>`);
    })
    .join("");
  const vonMs = ms(liste[0].datum);
  const bisMs = ms(liste.at(-1).datum);
  const xZeit = skala(vonMs, bisMs, RAND.links, B - RAND.rechts);
  return svg(
    `<rect class="band" x="${RAND.links}" width="${innenB}" y="${y(GRENZEN.abnahmeMax)}" height="${y(GRENZEN.abnahmeMin) - y(GRENZEN.abnahmeMax)}"/>
     <text class="beschriftung" x="${B - RAND.rechts + 4}" y="${y(GRENZEN.abnahmeMax) + 4}">2 %</text>
     <text class="beschriftung" x="${B - RAND.rechts + 4}" y="${y(GRENZEN.abnahmeMin) + 4}">0,5 %</text>` +
      yAchse(schritte(yMin, yMax), y, 1, "") +
      zeitAchse(vonMs, bisMs, xZeit) +
      saeulen,
    "Abnahme pro Woche in Prozent"
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

function kcalDiagramm(mahlzeiten, futterNachId, freigaben) {
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

function kennzahlen(gewichte) {
  const liste = [...gewichteSortiert(gewichte)].reverse();
  const erste = liste[0];
  const letzte = liste.at(-1);
  const wochen = (ms(letzte.datum) - ms(erste.datum)) / (7 * TAG_MS);
  const prozent = ((erste.kg - letzte.kg) / erste.kg) * 100;
  const proWoche = wochen > 0 ? (1 - (letzte.kg / erste.kg) ** (1 / wochen)) * 100 : 0;
  const kachel = (titel, wert, zusatz) =>
    `<div class="kachel"><span class="leise">${titel}</span><strong>${wert}</strong><span class="leise">${zusatz}</span></div>`;
  return `<div class="kacheln">
    ${kachel("Start", `${zahl(erste.kg, 2)} kg`, kurzDatum(erste.datum))}
    ${kachel("Jetzt", `${zahl(letzte.kg, 2)} kg`, kurzDatum(letzte.datum))}
    ${kachel("Abgenommen", `${zahl((erste.kg - letzte.kg) * 1000)} g`, `${zahl(prozent, 1)} % in ${zahl(wochen)} Wochen`)}
    ${kachel("Ø pro Woche", `${zahl(proWoche, 2)} %`, `sicher: ${zahl(GRENZEN.abnahmeMin, 1)}–${zahl(GRENZEN.abnahmeMax)} %`)}
  </div>`;
}

export function zeichneVerlauf({ gewichte, mahlzeiten, freigaben, futterNachId }) {
  if (gewichte.length < 2) {
    return `<p class="leer">Sobald mindestens zwei Gewichte eingetragen sind, erscheint hier der Verlauf.</p>`;
  }
  const karte = (titel, unter, inhalt, legende = "") =>
    `<div class="karte"><h2>${titel}</h2><p class="leise">${unter}</p>${legende}${inhalt}</div>`;
  return (
    kennzahlen(gewichte) +
    karte(
      "Gewicht",
      "in kg – grüne Fläche: sichere Abnahme von 0,5 bis 2 % pro Woche ab der ersten Freigabe",
      gewichtDiagramm(gewichte, freigaben)
    ) +
    karte("Abnahme pro Woche", "in % des Körpergewichts, je Wägung", abnahmeDiagramm(gewichte)) +
    (mahlzeiten.length
      ? karte(
          "Kalorien pro Tag",
          "Durchschnitt je Woche",
          kcalDiagramm(mahlzeiten, futterNachId, freigaben),
          `<ul class="legende">
            <li><span class="schluessel reihe-1"></span>Futter</li>
            <li><span class="schluessel reihe-2"></span>Leckerli</li>
            <li><span class="schluessel strich"></span>Freigabe</li>
          </ul>`
        )
      : "") +
    `<p class="tipp">Tippe auf einen Punkt oder eine Säule, um den genauen Wert zu sehen. Alle Gewichte als Liste stehen unter „Gewicht“.</p>`
  );
}
