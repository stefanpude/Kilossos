// Übersicht für den Tierarzt: eine druckfertige Seite (Drucken → "Als PDF speichern").
// berichtDaten rechnet (testbar in tests/bericht.test.js), berichtHtml baut daraus die Seite.

import {
  GRENZEN,
  tagSchluessel,
  tagesSumme,
  mahlzeitenAm,
  leckerliKcal,
  gewichteSortiert,
  aktuelleFreigabe,
  gewichteBis,
  warnungen,
} from "./rechnen.js";
import { gewichtDiagramm, kcalDiagramm } from "./verlauf.js";

const TAG_MS = 86400000;
const ms = (iso) => {
  const [j, m, t] = iso.split("-").map(Number);
  return new Date(j, m - 1, t).getTime();
};
const plusTage = (iso, n) => tagSchluessel(new Date(ms(iso) + n * TAG_MS + 12 * 3600000)); // Mittag: sicher über die Zeitumstellung
const tageZwischen = (von, bis) => Math.round((ms(bis) - ms(von)) / TAG_MS);

function tageVon(von, bis) {
  const tage = [];
  for (let t = von; t <= bis; t = plusTage(t, 1)) tage.push(t);
  return tage;
}

// tier, gewichte, mahlzeiten, freigaben (alle eines Tieres), futter (alle Sorten), von/bis/heute: "JJJJ-MM-TT".
export function berichtDaten({ tier, gewichte, mahlzeiten, freigaben, futter, von, bis, heute }) {
  const futterMap = new Map(futter.map((f) => [f.id, f]));
  const alleGewichte = [...gewichteSortiert(gewichte)].reverse();

  // Gewichte im Zeitraum; die Änderung bezieht sich auf die Messung davor, auch wenn die vor dem Zeitraum liegt.
  const gewichteImZeitraum = [];
  alleGewichte.forEach((g, i) => {
    if (g.datum < von || g.datum > bis) return;
    const davor = alleGewichte[i - 1];
    const tage = davor ? tageZwischen(davor.datum, g.datum) : 0;
    gewichteImZeitraum.push({
      datum: g.datum,
      kg: g.kg,
      notiz: g.notiz ?? "",
      diffG: davor ? Math.round((g.kg - davor.kg) * 1000) : null,
      prozentProWoche: davor && tage > 0 ? ((davor.kg - g.kg) / davor.kg / (tage / 7)) * 100 : null,
    });
  });
  let abnahme = null;
  if (gewichteImZeitraum.length >= 2) {
    const erste = gewichteImZeitraum[0];
    const letzte = gewichteImZeitraum.at(-1);
    const wochen = tageZwischen(erste.datum, letzte.datum) / 7;
    abnahme = {
      startKg: erste.kg,
      endKg: letzte.kg,
      diffG: Math.round((erste.kg - letzte.kg) * 1000),
      prozent: ((erste.kg - letzte.kg) / erste.kg) * 100,
      wochen,
      proWoche: (1 - (letzte.kg / erste.kg) ** (1 / wochen)) * 100,
    };
  }

  // Fütterung: nur abgeschlossene Tage, ab dem ersten Eintrag – sonst drücken leere Tage den Durchschnitt.
  const ersterEintrag = mahlzeiten.map((m) => tagSchluessel(new Date(m.zeitpunkt))).sort()[0];
  const gestern = plusTage(heute, -1);
  const fVon = ersterEintrag && ersterEintrag > von ? ersterEintrag : von;
  const fBis = bis < gestern ? bis : gestern;
  let fuetterung = null;
  if (ersterEintrag && fVon <= fBis) {
    const tage = tageVon(fVon, fBis);
    const imZeitraum = tage.flatMap((t) => mahlzeitenAm(mahlzeiten, t));
    const proSorte = new Map();
    for (const m of imZeitraum) {
      const f = futterMap.get(m.futterId);
      const s = proSorte.get(m.futterId) ?? { name: f?.name ?? "Gelöschte Sorte", typ: f?.typ, quelle: f?.kcalQuelle, gramm: 0, kcal: 0 };
      s.gramm += m.gramm;
      if (f) s.kcal += (m.gramm * f.kcalPro100g) / 100;
      proSorte.set(m.futterId, s);
    }
    const tageMitEintrag = new Set(imZeitraum.map((m) => tagSchluessel(new Date(m.zeitpunkt)))).size;
    const teiler = tageMitEintrag || 1;
    const kcalGesamt = tagesSumme(imZeitraum, futterMap).kcal;
    fuetterung = {
      von: fVon,
      bis: fBis,
      tage: tage.length,
      tageMitEintrag,
      kcalProTag: kcalGesamt / teiler,
      leckerliAnteil: kcalGesamt ? leckerliKcal(imZeitraum, futterMap) / kcalGesamt : 0,
      unsicher: tagesSumme(imZeitraum, futterMap).unsicher,
      sorten: [...proSorte.values()]
        .map((s) => ({ name: s.name, typ: s.typ, quelle: s.quelle, grammProTag: s.gramm / teiler, kcalProTag: s.kcal / teiler }))
        .sort((a, b) => b.kcalProTag - a.kcalProTag),
    };
  }

  // Auffälligkeiten: dieselben Regeln wie auf "Heute", Tag für Tag, je Art gezählt.
  const zaehler = new Map();
  for (const tag of tageVon(von, bis)) {
    const amTag = mahlzeitenAm(mahlzeiten, tag);
    const liste = warnungen({
      name: tier.name,
      tag,
      heute,
      kcal: tagesSumme(amTag, futterMap).kcal,
      leckerli: leckerliKcal(amTag, futterMap),
      freigabe: aktuelleFreigabe(freigaben, tag),
      gewichte: gewichteBis(gewichte, tag),
      fruehereMahlzeiten: Boolean(ersterEintrag && ersterEintrag < tag),
    });
    for (const w of liste) {
      const z = zaehler.get(w.id) ?? { id: w.id, art: w.art, anzahl: 0, erster: tag, letzter: tag, text: w.text };
      z.anzahl += 1;
      z.letzter = tag;
      z.text = w.text;
      zaehler.set(w.id, z);
    }
  }

  return {
    von,
    bis,
    gewichte: gewichteImZeitraum,
    abnahme,
    fuetterung,
    freigaben: [...freigaben].sort((a, b) => a.datum.localeCompare(b.datum)),
    auffaelligkeiten: [...zaehler.values()],
  };
}

// ---------- Seite ----------

const zahl = (wert, stellen = 0) =>
  wert.toLocaleString("de-DE", { minimumFractionDigits: stellen, maximumFractionDigits: stellen });
const sicher = (text) =>
  String(text).replace(/[&<>"']/g, (z) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[z]);
const datum = (iso) => new Date(ms(iso)).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
const vorzeichen = (wert, stellen = 0) => (wert > 0 ? "+" : wert < 0 ? "−" : "±") + zahl(Math.abs(wert), stellen);

const QUELLE = { packung: "Packung", hersteller: "Hersteller", geschaetzt: "geschätzt", ungefaehr: "ungefähr" };
const TYP = { nass: "nass", trocken: "trocken", leckerli: "Leckerli" };
const AUFFAELLIG = {
  "wenig-gefressen": "Weniger als die Hälfte der Tagesmenge erfasst",
  "unter-freigabe": "Unter 90 % der freigegebenen Menge",
  "unter-untergrenze": "Ohne Freigabe unter RER(KM ÷ 1,4)",
  "ueber-freigabe": "Über 110 % der freigegebenen Menge",
  leckerli: "Leckerlis über 10 % der Tagesenergie",
  "zu-schnell": "Abnahme über 2 % KM/Woche (Mittel 2 Wochen)",
  stillstand: "Abnahme unter 0,5 % KM/Woche (Mittel 4 Wochen)",
  "ziel-erreicht": "Zielgewicht erreicht",
  "freigabe-alt": "Freigabe älter als 3 Monate",
};

function tierText(tier) {
  const geschlecht = { kater: "Kater", katze: "Katze" }[tier.geschlecht] ?? "";
  return [geschlecht, tier.kastriert ? "kastriert" : ""].filter(Boolean).join(", ");
}

export function berichtHtml(b, { tier, gewichte, mahlzeiten, freigaben, futterNachId, erstellt, demo }) {
  const teile = [];
  teile.push(`<header class="bericht-kopf">
    <h1>Kilossos – Übersicht für den Tierarzt</h1>
    <p><strong>${sicher(tier.name)}</strong>${tierText(tier) ? " · " + tierText(tier) : ""} · Zeitraum ${datum(b.von)} bis ${datum(b.bis)} · erstellt am ${datum(erstellt)}</p>
    ${demo ? `<p class="bericht-demo">DEMO – simulierte Daten, nicht von ${sicher(tier.name)}</p>` : ""}
    <p class="bericht-klein">Alle Werte hat der Halter zu Hause erfasst (Küchenwaage, eigene Katzenwaage). Die Warnregeln der App
      beruhen auf den Sicherheitsgrenzen in docs/sicherheitsgrenzen.md (AAHA 2014, WSAVA 2011, Flanagan et al. 2018)
      und gelten erst nach tierärztlicher Prüfung. Kilossos ist kein Medizinprodukt.</p>
  </header>`);

  // Gewicht
  const a = b.abnahme;
  teile.push(`<section class="bericht-teil"><h2>Gewicht</h2>`);
  if (a) {
    teile.push(`<p>${zahl(a.startKg, 2)} kg → <strong>${zahl(a.endKg, 2)} kg</strong> in ${zahl(a.wochen, 1)} Wochen:
      ${a.diffG >= 0 ? "−" : "+"}${zahl(Math.abs(a.diffG))} g (${zahl(a.prozent, 1)} %), im Mittel <strong>${zahl(a.proWoche, 2)} % KM/Woche</strong>
      (Zielbereich ${zahl(GRENZEN.abnahmeMin, 1)}–${zahl(GRENZEN.abnahmeMax)} %).</p>`);
    const imZeitraum = gewichte.filter((g) => g.datum >= b.von && g.datum <= b.bis);
    teile.push(gewichtDiagramm(imZeitraum, freigaben.filter((f) => f.datum <= b.bis)));
  }
  if (b.gewichte.length) {
    teile.push(`<table><thead><tr><th>Datum</th><th>kg</th><th>Änderung</th><th>% KM/Woche</th><th>Notiz</th></tr></thead><tbody>
      ${b.gewichte
        .map(
          (g) => `<tr><td>${datum(g.datum)}</td><td>${zahl(g.kg, 2)}</td><td>${g.diffG === null ? "–" : vorzeichen(g.diffG) + " g"}</td>
            <td>${g.prozentProWoche === null ? "–" : zahl(g.prozentProWoche, 2)}</td><td>${sicher(g.notiz)}</td></tr>`
        )
        .join("")}</tbody></table>`);
  } else {
    teile.push(`<p>Im Zeitraum ist kein Gewicht eingetragen.</p>`);
  }
  teile.push(`</section>`);

  // Fütterung
  const f = b.fuetterung;
  teile.push(`<section class="bericht-teil"><h2>Fütterung</h2>`);
  if (f) {
    teile.push(`<p>Durchschnitt pro Tag über ${f.tageMitEintrag} von ${f.tage} abgeschlossenen Tagen mit Einträgen
      (${datum(f.von)} bis ${datum(f.bis)}): <strong>${f.unsicher ? "ca. " : ""}${zahl(f.kcalProTag)} kcal/Tag</strong>,
      davon Leckerlis ${zahl(f.leckerliAnteil * 100, 1)} %.</p>
      <table><thead><tr><th>Sorte</th><th>Art</th><th>g/Tag</th><th>kcal/Tag</th><th>kcal-Wert laut</th></tr></thead><tbody>
      ${f.sorten
        .map(
          (s) => `<tr><td>${sicher(s.name)}</td><td>${TYP[s.typ] ?? "–"}</td><td>${zahl(s.grammProTag, 1)}</td>
            <td>${zahl(s.kcalProTag)}</td><td>${QUELLE[s.quelle] ?? "–"}</td></tr>`
        )
        .join("")}</tbody></table>`);
    const mz = mahlzeiten.filter((m) => {
      const t = tagSchluessel(new Date(m.zeitpunkt));
      return t >= f.von && t <= f.bis;
    });
    if (mz.length) {
      teile.push(`<h3>Kalorien pro Tag, Durchschnitt je Woche</h3>
        <ul class="legende"><li><span class="schluessel reihe-1"></span>Futter</li><li><span class="schluessel reihe-2"></span>Leckerli</li><li><span class="schluessel strich"></span>Freigabe</li></ul>
        ${kcalDiagramm(mz, futterNachId, freigaben)}`);
    }
  } else {
    teile.push(`<p>Im Zeitraum sind keine Mahlzeiten an abgeschlossenen Tagen eingetragen.</p>`);
  }
  teile.push(`</section>`);

  // Freigaben
  teile.push(`<section class="bericht-teil"><h2>Tierärztliche Freigaben</h2>
    ${
      b.freigaben.length
        ? `<table><thead><tr><th>Datum</th><th>Zielgewicht</th><th>kcal/Tag</th><th>Tierarzt</th><th>Notiz</th></tr></thead><tbody>
          ${b.freigaben
            .map(
              (fr) => `<tr><td>${datum(fr.datum)}</td><td>${zahl(fr.zielgewichtKg, 1)} kg</td><td>${zahl(fr.kcalProTag)}</td>
                <td>${sicher(fr.tierarzt)}</td><td>${sicher(fr.notiz ?? "")}</td></tr>`
            )
            .join("")}</tbody></table>`
        : `<p>Noch keine Freigabe eingetragen – die App zeichnet bisher nur auf.</p>`
    }</section>`);

  // Auffälligkeiten
  teile.push(`<section class="bericht-teil"><h2>Auffälligkeiten im Zeitraum</h2>
    ${
      b.auffaelligkeiten.length
        ? `<table><thead><tr><th>Regel</th><th>Tage</th><th>erstmals</th><th>zuletzt</th></tr></thead><tbody>
          ${b.auffaelligkeiten
            .map(
              (z) => `<tr><td>${AUFFAELLIG[z.id] ?? sicher(z.id)}</td><td>${z.anzahl}</td><td>${datum(z.erster)}</td><td>${datum(z.letzter)}</td></tr>`
            )
            .join("")}</tbody></table>`
        : `<p>Keine – an keinem Tag wurde eine Warnregel ausgelöst.</p>`
    }</section>`);

  // Platz für den Tierarzt
  teile.push(`<section class="bericht-teil bericht-notizen"><h2>Notizen des Tierarztes</h2>
    <p>BCS (1–9): ______ &nbsp; MCS: ______ &nbsp; Zielgewicht: ______ kg &nbsp; kcal/Tag: ______ &nbsp; nächste Kontrolle: __________</p>
    <div class="linie"></div><div class="linie"></div><div class="linie"></div>
    <p class="bericht-klein">Datum, Unterschrift / Stempel: ________________________________________</p>
  </section>`);
  return teile.join("");
}
