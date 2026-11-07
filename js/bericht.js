// Übersicht für die Praxis: eine druckfertige Seite (Drucken → "Als PDF speichern").
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
import { gewichtDiagramm, kcalDiagramm, pdfZeitleiste } from "./verlauf.js";
import { artVon, beruehrt } from "./besondere-tage.js";
import { normalesFutterKcal } from "./futterliste.js";
import { fotoGueltig, bcsGueltig, MCS } from "./daten.js";
import { alterText, HALTUNG } from "./profil.js";

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

// Mahlzeiten eines Tages zählen (seit 0.53.0, Plan .planning/mahlzeiten-pro-tag.md). In der App ist jede Sorte ein
// eigener Eintrag; nass und trocken zur selben Fütterung liegen oft 1–2 Minuten auseinander. Deshalb gehört Futter, das
// weniger als 30 Minuten nach dem ERSTEN Eintrag der laufenden Mahlzeit kommt, noch dazu (kein Ketten-Effekt).
// Leckerlis zählen nicht; eine gelöschte Sorte (Typ unbekannt) zählt als Futter. Die 30 Minuten sind eine Zählregel,
// keine medizinische Grenze. Nur Anzeige für den Tierarzt, keine Zielzahl.
const MAHLZEIT_FENSTER_MS = 30 * 60000;
export function mahlzeitenZaehlen(mahlzeitenDesTages, futterNachId) {
  const zeiten = mahlzeitenDesTages
    .filter((m) => futterNachId.get(m.futterId)?.typ !== "leckerli")
    .map((m) => new Date(m.zeitpunkt).getTime())
    .sort((a, b) => a - b);
  let anzahl = 0;
  let beginn = -Infinity;
  for (const t of zeiten) {
    if (t - beginn >= MAHLZEIT_FENSTER_MS) {
      anzahl += 1;
      beginn = t;
    }
  }
  return anzahl;
}

// tier, gewichte, mahlzeiten, freigaben, besondereTage (alle eines Tieres), futter (alle Sorten), von/bis/heute: "JJJJ-MM-TT".
export function berichtDaten({ tier, gewichte, mahlzeiten, freigaben, besondereTage = [], futter, von, bis, heute }) {
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
      // Tempo erst ab GRENZEN.tageTempo Tagen Abstand, wie in der App (seit 0.77.0 auch hier).
      prozentProWoche: davor && tage >= GRENZEN.tageTempo ? ((davor.kg - g.kg) / davor.kg / (tage / 7)) * 100 : null,
    });
  });
  let abnahme = null;
  const ersteW = gewichteImZeitraum[0];
  const letzteW = gewichteImZeitraum.at(-1);
  // Erst ab zwei verschiedenen Tagen (sonst „−∞ %“). Linear wie die Spalte „Monat“ und die Warnregeln (seit 0.36.2).
  if (gewichteImZeitraum.length >= 2 && tageZwischen(ersteW.datum, letzteW.datum) > 0) {
    const tage = tageZwischen(ersteW.datum, letzteW.datum);
    const wochen = tage / 7;
    abnahme = {
      tage,
      startKg: ersteW.kg,
      endKg: letzteW.kg,
      diffG: Math.round((ersteW.kg - letzteW.kg) * 1000),
      prozent: ((ersteW.kg - letzteW.kg) / ersteW.kg) * 100,
      wochen,
      // Unter GRENZEN.tageTempo Tagen kein Tempo (seit 0.77.0, Prüfer A): 90 g an einem Tag wären sonst „6,70 %“.
      proWoche: tage >= GRENZEN.tageTempo ? ((ersteW.kg - letzteW.kg) / ersteW.kg / wochen) * 100 : null,
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
    // Mahlzeiten pro Tag über dieselben Tage wie kcal/Tag (Tage mit Eintrag); ein Tag nur mit Leckerli zählt als 0.
    const proTagListe = tage
      .map((t) => mahlzeitenAm(imZeitraum, t))
      .filter((liste) => liste.length)
      .map((liste) => mahlzeitenZaehlen(liste, futterMap));
    const mahlzeitenSumme = proTagListe.reduce((a, b) => a + b, 0);
    fuetterung = {
      von: fVon,
      bis: fBis,
      tage: tage.length,
      tageMitEintrag,
      kcalProTag: kcalGesamt / teiler,
      leckerliAnteil: kcalGesamt ? leckerliKcal(imZeitraum, futterMap) / kcalGesamt : 0,
      unsicher: tagesSumme(imZeitraum, futterMap).unsicher,
      mahlzeiten: mahlzeitenSumme
        ? {
            proTag: mahlzeitenSumme / teiler,
            min: Math.min(...proTagListe),
            max: Math.max(...proTagListe),
            tageNurLeckerli: proTagListe.filter((n) => n === 0).length,
          }
        : null,
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
      normalesFutterKcal: normalesFutterKcal(amTag, futterMap),
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
    // Besondere Tage (seit 0.33.0): alle, die den Zeitraum berühren, mit ihrem ganzen Zeitraum.
    besondereTage: besondereTage.filter((e) => beruehrt(e, von, bis)).sort((a, b) => a.von.localeCompare(b.von)),
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
const TYP = { nass: "nass", trocken: "trocken", frischfleisch: "frisch", leckerli: "Leckerli" };
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
  diaetfutter: "Freigabe unter RER(Ziel), aber Handelsfutter gefüttert (AAHA 2021)",
};

function tierText(tier) {
  const geschlecht = { kater: "Kater", katze: "Katze" }[tier.geschlecht] ?? "";
  return [geschlecht, tier.kastriert ? "kastriert" : ""].filter(Boolean).join(", ");
}

// Angaben aus dem Profil (alle freiwillig); ohne Angaben keine Zeile.
function profilZeile(tier, heute) {
  const alter = alterText(tier.geburtsdatum, heute);
  // Nur Praxisname und Telefon; eine Adresse allein (seit 0.49.0 möglich) ergibt keine leere Zeile „Praxis: “.
  const praxis = [tier.tierarzt?.praxis, tier.tierarzt?.telefon].filter(Boolean).join(", ");
  const teile = [
    alter && `Alter ${alter} (geb. ${datum(tier.geburtsdatum)})`,
    tier.koerperbau && `Körperbau: ${tier.koerperbau}`,
    HALTUNG[tier.haltung],
    tier.schlankKg && `Gewicht in der schlanken Zeit laut Halter: ${tier.schlankKg.toLocaleString("de-DE")} kg`,
    praxis && `Praxis: ${praxis}`,
  ].filter(Boolean);
  return teile.length ? `<p>${teile.map(sicher).join(" · ")}</p>` : "";
}

// Zeitraum in der Liste „Besondere Tage“ (seit 0.35.0): kurz ohne Jahr („24.10.“, „28.–30.10.“, „30.10.–2.11.“,
// „seit 20.10.“), das Jahr steht im Kopf des Berichts. Lang mit Jahr („28.10.2026 bis 30.10.2026“, „seit 30.12.2025“),
// wenn ein Datum der Liste nicht im Jahr des Berichtsendes liegt; dann in jeder Zeile, damit die Liste einheitlich bleibt.
const tagMonat = (iso) => `${Number(iso.slice(8))}.${Number(iso.slice(5, 7))}.`;
function besondererZeitraum(e, mitJahr) {
  if (mitJahr) {
    if (e.bis === null) return `seit ${datum(e.von)}`;
    return e.bis === e.von ? datum(e.von) : `${datum(e.von)} bis ${datum(e.bis)}`;
  }
  if (e.bis === null) return `seit ${tagMonat(e.von)}`;
  if (e.bis === e.von) return tagMonat(e.von);
  if (e.von.slice(0, 7) === e.bis.slice(0, 7)) return `${Number(e.von.slice(8))}.–${tagMonat(e.bis)}`;
  return `${tagMonat(e.von)}–${tagMonat(e.bis)}`;
}

// Liste „Besondere Tage“ (seit 0.35.0 statt der Tabelle weiter unten): eine Zeile je Eintrag mit Zeitraum, Art und Notiz,
// „läuft noch“ hinter der Notiz. nummern: Kreis mit der Nummer wie im Streifen unter der Kurve (nur, wenn es ihn gibt).
// „Futter verweigert“ wird hervorgehoben. Spezifikation: .planning/besondere-tage-pdf.md.
function besondereListe(liste, bis, nummern) {
  const jahr = bis.slice(0, 4);
  const mitJahr = liste.some((e) => e.von.slice(0, 4) !== jahr || (e.bis !== null && e.bis.slice(0, 4) !== jahr));
  const zeilen = liste.map((e, i) => {
    const art = artVon(e.art);
    const notfall = art.notfall ? " notfall" : "";
    const notiz = [e.notiz ? sicher(e.notiz) : "", e.bis === null ? "läuft noch" : ""].filter(Boolean).join(" · ");
    const nr = nummern ? `<td><span class="bt-nr-kreis${notfall}">${i + 1}</span></td>` : "";
    return `<tr${notfall ? ' class="notfall"' : ""}>${nr}<td>${besondererZeitraum(e, mitJahr)}</td><td>${sicher(art.text)}</td><td>${notiz}</td></tr>`;
  });
  return `<table class="bt-liste"><tbody>${zeilen.join("")}</tbody></table>`;
}

// ---------- Wägungen als Monatsraster (seit 0.36.0, Spezifikation .planning/waegungen-pdf.md) ----------
// Wunsch des Halters 05.11.2026: „höchstens 4, 5 Wägungen im Monat … optisch angenehmer“. Eine Zeile je Monat mit bis zu
// 5 Wägungen nebeneinander (Datum, kg, Änderung zur Wägung davor); wer öfter wiegt, bekommt weitere Zeilen im selben Monat.
// Bilanz je Monat: von der letzten Wägung des Vormonats bis zur letzten des Monats, im ersten Monat ab seiner ersten Wägung.
// % KM/Woche bezogen auf das Gewicht am Anfang (Regel 1a in docs/sicherheitsgrenzen.md); positiv = Abnahme wie im Kopf.
// Statt einer Prozentzahl je Wägung (schwankt stark) steht der Monatswert da; zu schnell meldet weiter „Auffälligkeiten“.
// Notizen bekommen Buchstaben (a, b, …, z, aa, …), damit man sie nicht mit den Nummern der besonderen Tage verwechselt.
export const WAEGUNGEN_PRO_ZEILE = 5;
// Fest statt toLocaleDateString: Node und Browser kürzen unterschiedlich („Mär“ oder „März“).
const MONATE_KURZ = ["Jan", "Feb", "März", "Apr", "Mai", "Juni", "Juli", "Aug", "Sep", "Okt", "Nov", "Dez"];
const buchstabe = (i) => (i >= 26 ? buchstabe(Math.floor(i / 26) - 1) : "") + String.fromCharCode(97 + (i % 26));

// gewichte: b.gewichte aus berichtDaten (datum, kg, notiz, diffG), nach Datum aufsteigend.
export function waegungsMonate(gewichte) {
  const gruppen = [];
  const notizen = [];
  for (const g of gewichte) {
    const schluessel = g.datum.slice(0, 7);
    if (gruppen.at(-1)?.schluessel !== schluessel) {
      gruppen.push({ schluessel, liste: [], basis: gruppen.at(-1)?.liste.at(-1) ?? null });
    }
    const eintrag = { ...g, buchstabe: null };
    if (g.notiz) {
      eintrag.buchstabe = buchstabe(notizen.length);
      notizen.push({ buchstabe: eintrag.buchstabe, datum: g.datum, notiz: g.notiz });
    }
    gruppen.at(-1).liste.push(eintrag);
  }
  const monate = gruppen.map(({ schluessel, liste, basis }) => {
    const von = basis ?? liste[0];
    const bis = liste.at(-1);
    const tage = tageZwischen(von.datum, bis.datum);
    const zeilen = [];
    for (let i = 0; i < liste.length; i += WAEGUNGEN_PRO_ZEILE) zeilen.push(liste.slice(i, i + WAEGUNGEN_PRO_ZEILE));
    return {
      schluessel,
      titel: `${MONATE_KURZ[Number(schluessel.slice(5, 7)) - 1]} ${schluessel.slice(0, 4)}`,
      zeilen,
      bilanz:
        von === bis || tage <= 0
          ? null
          : {
              diffG: Math.round((bis.kg - von.kg) * 1000),
              prozentProWoche: tage >= GRENZEN.tageTempo ? ((von.kg - bis.kg) / von.kg / (tage / 7)) * 100 : null,
            },
    };
  });
  return { monate, notizen };
}

function waegungsRaster(gewichte, berichtBis) {
  const { monate, notizen } = waegungsMonate(gewichte);
  const zelle = (g) => {
    const marke = g.buchstabe ? `<sup class="wg-marke">${g.buchstabe}</sup>` : "";
    const diff = g.diffG === null ? "–" : `${vorzeichen(g.diffG)} g`;
    return `<td class="wg-zelle"><span class="wg-tag">${tagMonat(g.datum)}</span><b class="wg-kg">${zahl(g.kg, 2)}${marke}</b><span class="wg-diff">${diff}</span></td>`;
  };
  const bilanzText = (b) =>
    !b
      ? "–"
      : b.prozentProWoche === null
        ? `<b>${vorzeichen(b.diffG)} g</b>`
        : `<b>${vorzeichen(b.diffG)} g</b><small>${b.prozentProWoche < 0 ? "Zunahme " : ""}${zahl(Math.abs(b.prozentProWoche), 2)} % KM/Woche</small>`;
  const zeilen = monate.flatMap((m) =>
    m.zeilen.map((liste, i) => {
      const n = m.zeilen.length;
      const kopf = i === 0 ? `<th scope="row" class="wg-monat" rowspan="${n}">${m.titel}</th>` : "";
      const leer = '<td class="wg-zelle"></td>'.repeat(WAEGUNGEN_PRO_ZEILE - liste.length);
      const ende = i === 0 ? `<td class="wg-summe" rowspan="${n}">${bilanzText(m.bilanz)}</td>` : "";
      return `<tr${i === n - 1 ? ' class="wg-letzte"' : ""}>${kopf}${liste.map(zelle).join("")}${leer}${ende}</tr>`;
    })
  );
  // Datum der Anmerkung kurz wie in der Liste „Besondere Tage“; mit Jahr, wenn eins nicht im Jahr des Berichtsendes liegt.
  const mitJahr = notizen.some((n) => n.datum.slice(0, 4) !== berichtBis.slice(0, 4));
  const fuss = notizen.length
    ? `<p class="wg-notizen">${notizen
        .map((n) => `<span><sup>${n.buchstabe}</sup> ${mitJahr ? datum(n.datum) : tagMonat(n.datum)} ${sicher(n.notiz)}</span>`)
        .join("")}</p>`
    : "";
  return `<table class="wg-raster"><thead><tr><th></th><th colspan="${WAEGUNGEN_PRO_ZEILE}">Gewogen (in kg) <span class="wg-erkl">Datum, Gewicht, Änderung seit dem Wiegen davor</span></th><th>Monat</th></tr></thead>
    <tbody>${zeilen.join("")}</tbody></table>${fuss}`;
}

function fotoTeil(gewichte, von, bis) {
  const liste = gewichte
    .filter((g) => typeof g.datum === "string" && g.datum >= von && g.datum <= bis && fotoGueltig(g.foto))
    .sort((x, y) => x.datum.localeCompare(y.datum));
  const auswahl = liste.length > 1 ? [liste[0], liste.at(-1)] : liste;
  const bild = (g) => `<figure class="bericht-vn-seite"><img class="bericht-vn-bild" src="${sicher(g.foto)}" alt="">
      <figcaption>${datum(g.datum)} · ${zahl(g.kg, 2)} kg</figcaption></figure>`;
  return `<section class="bericht-teil bericht-vn"><h2>Fotos</h2>${
    auswahl.length
      ? `<p class="bericht-klein">${auswahl.length > 1 ? "Erstes und letztes Foto im Zeitraum." : "Ein Foto im Zeitraum."} Vom Halter zu Hause aufgenommen.</p>
    <div class="bericht-vn-paar">${auswahl.map(bild).join("")}</div>`
      : "<p>Im Zeitraum gibt es kein Foto.</p>"
  }</section>`;
}

export function berichtHtml(b, { tier, gewichte, mahlzeiten, freigaben, futterNachId, erstellt, demo, fotos = false }) {
  const teile = [];
  teile.push(`<header class="bericht-kopf">
    ${fotoGueltig(tier.foto) ? `<img class="bericht-foto" src="${sicher(tier.foto)}" alt="">` : ""}
    <h1>Kilossos – Übersicht für die Tierarztpraxis</h1>
    <p><strong>${sicher(tier.name)}</strong>${tierText(tier) ? " · " + tierText(tier) : ""} · Zeitraum ${datum(b.von)} bis ${datum(b.bis)} · erstellt am ${datum(erstellt)}</p>
    ${profilZeile(tier, erstellt)}
    ${demo ? `<p class="bericht-demo">DEMO – simulierte Daten, nicht von ${sicher(tier.name)}</p>` : ""}
    <p class="bericht-klein">Alle Werte hat der Halter zu Hause erfasst: Futter mit der Küchenwaage, Gewicht mit der eigenen Waage
      (andere Wiegeart steht als Anmerkung beim jeweiligen Gewicht, z. B. „auf dem Arm gewogen“). Die Warnregeln der App
      beruhen auf den Sicherheitsgrenzen in docs/sicherheitsgrenzen.md (AAHA 2014, WSAVA 2011, Flanagan et al. 2018)
      und gelten erst nach tierärztlicher Prüfung. Kilossos ist kein Medizinprodukt.</p>
  </header>`);

  // Gewicht
  const a = b.abnahme;
  teile.push(`<section class="bericht-teil"><h2>Gewicht</h2>`);
  if (a) {
    // Zunahme ausgeschrieben statt mit Minus vor der Rate (seit 0.36.2), wie in der Spalte „Monat“.
    const zunahme = a.diffG < 0;
    const gText = a.diffG === 0 ? "±0 g" : `${zunahme ? "+" : "−"}${zahl(Math.abs(a.diffG))} g`;
    const dauer = a.proWoche === null ? `${a.tage} ${a.tage === 1 ? "Tag" : "Tagen"}` : `${zahl(a.wochen, 1)} Wochen`;
    const tempo =
      a.proWoche === null
        ? `Tempo pro Woche erst ab ${GRENZEN.tageTempo} Tagen Abstand`
        : `im Mittel <strong>${zunahme ? "Zunahme " : ""}${zahl(Math.abs(a.proWoche), 2)} % KM/Woche</strong>`;
    teile.push(`<p>${zahl(a.startKg, 2)} kg → <strong>${zahl(a.endKg, 2)} kg</strong> in ${dauer}:
      ${gText} (${zahl(Math.abs(a.prozent), 1)} %${zunahme ? " Zunahme" : ""}), ${tempo}
      (Zielbereich ${zahl(GRENZEN.abnahmeMin, 1)}–${zahl(GRENZEN.abnahmeMax)} %).</p>`);
    const imZeitraum = gewichte.filter((g) => g.datum >= b.von && g.datum <= b.bis);
    // Streifen der besonderen Tage mit derselben Achse: von der ersten Wägung im Zeitraum bis zum Berichtsende.
    // Beide in einem Rahmen: Im Druck gilt die Breite für beide gleich, und ein Seitenumbruch trennt sie nicht.
    // Gleich darunter die Liste mit denselben Nummern (seit 0.35.0; vorher eigener Abschnitt weiter unten).
    const erste = imZeitraum.map((g) => g.datum).sort()[0];
    const besondere = b.besondereTage ?? [];
    const leiste = pdfZeitleiste(besondere, { vonTag: erste, bisTag: b.bis });
    teile.push(
      `<div class="bericht-grafik">${gewichtDiagramm(imZeitraum, freigaben.filter((f) => f.datum <= b.bis), b.bis, gewichte.filter((g) => g.datum <= b.bis))}${leiste}</div>`
    );
    if (besondere.length) {
      teile.push(
        `<div class="bericht-besonders"><h3>Besondere Tage <small>vom Halter festgehalten, ohne Mengen</small></h3>${besondereListe(besondere, b.bis, leiste !== "")}</div>`
      );
    }
  }
  if (b.gewichte.length) {
    teile.push(waegungsRaster(b.gewichte, b.bis));
  } else {
    teile.push(`<p>Im Zeitraum ist kein Gewicht eingetragen.</p>`);
  }
  teile.push(`</section>`);

  // Fotos (nur auf Wunsch, ab 0.26.0): erstes und letztes Foto im Zeitraum, zum Vergleich.
  if (fotos) teile.push(fotoTeil(gewichte, b.von, b.bis));

  // Besondere Tage ohne Kurve (weniger als zwei Wägungen im Zeitraum): eigener Abschnitt mit derselben Liste, ohne Nummern.
  // Mit Kurve stehen sie seit 0.35.0 direkt darunter (oben). Ohne Einträge kein Abschnitt.
  if (!a && b.besondereTage?.length) {
    teile.push(`<section class="bericht-teil"><h2>Besondere Tage</h2>
    <p class="bericht-klein">Vom Halter festgehalten, ohne Mengen.</p>${besondereListe(b.besondereTage, b.bis, false)}</section>`);
  }

  // Fütterung
  const f = b.fuetterung;
  teile.push(`<section class="bericht-teil"><h2>Fütterung</h2>`);
  if (f) {
    teile.push(`<p>Durchschnitt pro Tag über ${f.tageMitEintrag} von ${f.tage} abgeschlossenen Tagen mit Einträgen
      (${datum(f.von)} bis ${datum(f.bis)}): <strong>${f.unsicher ? "ca. " : ""}${zahl(f.kcalProTag)} kcal/Tag</strong>,
      davon Leckerlis ${zahl(f.leckerliAnteil * 100, 1)} %.</p>
      ${
        f.mahlzeiten
          ? `<p>Im Schnitt ${zahl(f.mahlzeiten.proTag, 1)} Mahlzeiten pro Tag (${
              f.mahlzeiten.min === f.mahlzeiten.max ? `jeden Tag ${f.mahlzeiten.min}` : `${f.mahlzeiten.min} bis ${f.mahlzeiten.max}`
            }${
              // Eine 0 heißt: an dem Tag nur Leckerli eingetragen, nicht „nichts bekommen“ (Prüfer-Fund 0.53.0).
              f.mahlzeiten.tageNurLeckerli
                ? `; an ${f.mahlzeiten.tageNurLeckerli === 1 ? "1 Tag" : `${f.mahlzeiten.tageNurLeckerli} Tagen`} nur Leckerli eingetragen`
                : ""
            }).<br><span class="bericht-klein">Gezählt nach der eingetragenen Uhrzeit: Futter-Einträge innerhalb von 30 Minuten gelten als eine Mahlzeit, Leckerlis zählen nicht mit.</span></p>`
          : ""
      }
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
      // Nur Freigaben bis zum Ende der Fütterungsdaten, wie bei der Gewichtskurve (Prüfer-Fund 5: am Termin
      // eingetragene Freigabe erschien sonst in der letzten Woche).
      const diagramm = kcalDiagramm(mz, futterNachId, freigaben.filter((fr) => fr.datum <= f.bis));
      // „Freigabe“ und Band nur in der Legende, wenn das Diagramm sie auch zeichnet (ohne Freigabe im Zeitraum keine);
      // dann steht stattdessen ein Satz unter dem Diagramm (seit 0.68.0).
      const mitFreigabe = diagramm.includes('class="freigabe-linie"');
      const freigabeTeil = mitFreigabe
        ? `<li><span class="schluessel strich"></span>Freigabe</li><li><span class="schluessel kcal-band-s"></span>±${zahl(GRENZEN.spielraum * 100)} % gilt als eingehalten</li>`
        : "";
      teile.push(`<h3>Kalorien pro Tag, Durchschnitt je Woche</h3>
        <ul class="legende"><li><span class="schluessel kcal-punkt-s"></span>Wochen-Ø (inkl. Leckerli)</li>${freigabeTeil}<li><span class="schluessel kcal-leck-s"></span>Leckerli-Anteil</li></ul>
        ${diagramm}${mitFreigabe ? "" : `<p class="bericht-klein">Noch keine Freigabe im Zeitraum: nur die Wochenwerte, ohne Band.</p>`}`);
    }
  } else {
    teile.push(`<p>Im Zeitraum sind keine Mahlzeiten an abgeschlossenen Tagen eingetragen.</p>`);
  }
  teile.push(`</section>`);

  // Freigaben
  teile.push(`<section class="bericht-teil"><h2>Tierärztliche Freigaben</h2>
    ${
      b.freigaben.length
        ? `<table><thead><tr><th>Datum</th><th>Zielgewicht</th><th>kcal/Tag</th><th>BCS</th><th>MCS</th><th>Praxis</th><th>Notiz</th></tr></thead><tbody>
          ${b.freigaben
            .map(
              (fr) => `<tr><td>${datum(fr.datum)}</td><td>${zahl(fr.zielgewichtKg, 2)} kg</td><td>${zahl(fr.kcalProTag)}</td>
                <td>${bcsGueltig(fr.bcs) ? fr.bcs : "–"}</td><td>${Object.hasOwn(MCS, fr.mcs) ? MCS[fr.mcs] : "–"}</td>
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
  teile.push(`<section class="bericht-teil bericht-notizen"><h2>Notizen aus der Praxis</h2>
    <p>BCS (1–9): ______ &nbsp; MCS: ______ &nbsp; Zielgewicht: ______ kg &nbsp; kcal/Tag: ______ &nbsp; nächste Kontrolle: __________</p>
    <div class="linie"></div><div class="linie"></div><div class="linie"></div>
    <p class="bericht-klein">Datum, Unterschrift / Stempel: ________________________________________</p>
  </section>`);
  return teile.join("");
}
