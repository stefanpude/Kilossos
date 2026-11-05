// Rechnungen für die Oberfläche: Zusammenfassungen, Gruppen und Werte für Ring und Kacheln.
// Reine Funktionen ohne Bildschirm und Speicher – dadurch automatisch testbar (tests/zusammenfassung.test.js).
// Die Grenzen selbst kommen unverändert aus rechnen.js; hier wird nichts neu bewertet, nur zusammengefasst.

import { GRENZEN, gewichteSortiert, tagesSumme, tagSchluessel, aktuelleFreigabe, leckerliKcal, kcalFuer } from "./rechnen.js";

const TAG_MS = 86400000;
const datumVon = (iso) => {
  const [j, m, t] = iso.split("-").map(Number);
  return new Date(j, m - 1, t);
};
const tageZwischen = (von, bis) => Math.round((datumVon(bis) - datumVon(von)) / TAG_MS);
const plusTage = (iso, tage) => {
  const d = datumVon(iso);
  d.setDate(d.getDate() + tage);
  return tagSchluessel(d);
};
const montagVon = (iso) => {
  const d = datumVon(iso);
  return plusTage(iso, -((d.getDay() + 6) % 7));
};

// Erster Tag des Zeitraums im Verlauf; "alles" hat keinen Anfang.
export function zeitraumStart(zeitraum, heute) {
  if (zeitraum === "1m") return plusTage(heute, -31);
  if (zeitraum === "3m") return plusTage(heute, -92);
  return null;
}

// Abnahme je Wägung, auf 7 Tage umgerechnet (wie das frühere Balkendiagramm). Neueste zuerst.
// Rot (über 2 %) gilt immer; Grün und Gelb nur für Wochen, die nach der ersten Freigabe beginnen.
export function wochenRaten(gewichte, freigaben) {
  const liste = [...gewichteSortiert(gewichte)].reverse();
  const ersteFreigabe = [...freigaben].sort((a, b) => a.datum.localeCompare(b.datum))[0];
  const raten = [];
  for (let i = 1; i < liste.length; i++) {
    const alt = liste[i - 1];
    const neu = liste[i];
    const wochen = tageZwischen(alt.datum, neu.datum) / 7;
    if (wochen <= 0) continue;
    const prozent = ((alt.kg - neu.kg) / alt.kg / wochen) * 100;
    const nachFreigabe = Boolean(ersteFreigabe) && alt.datum >= ersteFreigabe.datum;
    let bewertung = "neutral";
    if (prozent > GRENZEN.abnahmeMax + 1e-9) bewertung = "zu-schnell"; // 1e-9: genau 2 % ist erlaubt (wie warnungen)
    else if (nachFreigabe) bewertung = prozent >= GRENZEN.abnahmeMin ? "gut" : "langsam";
    raten.push({ datum: neu.datum, vonDatum: alt.datum, prozent, bewertung, nachFreigabe });
  }
  return raten.reverse();
}

export function abnahmeZusammenfassung(raten) {
  return {
    durchschnitt: raten.length ? raten.reduce((s, r) => s + r.prozent, 0) / raten.length : null,
    imBereich: raten.filter((r) => r.bewertung === "gut").length,
    bewertet: raten.filter((r) => r.nachFreigabe).length,
    anzahl: raten.length,
  };
}

// Ein Eintrag je Tag mit mindestens einer Mahlzeit, neueste zuerst. "ueber" erst ab +10 % Spielraum.
export function futterTage(mahlzeiten, futterNachId, freigaben) {
  const proTag = new Map();
  for (const m of mahlzeiten) {
    const tag = tagSchluessel(new Date(m.zeitpunkt));
    if (!proTag.has(tag)) proTag.set(tag, []);
    proTag.get(tag).push(m);
  }
  return [...proTag.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([tag, liste]) => {
      const summe = tagesSumme(liste, futterNachId);
      const freigabeKcal = aktuelleFreigabe(freigaben, tag)?.kcalProTag ?? null;
      return {
        tag,
        kcal: summe.kcal,
        gramm: summe.gramm,
        unsicher: summe.unsicher,
        leckerli: leckerliKcal(liste, futterNachId),
        freigabeKcal,
        ueber: freigabeKcal !== null && summe.kcal > (1 + GRENZEN.spielraum) * freigabeKcal,
        mahlzeiten: [...liste].sort((a, b) => a.zeitpunkt.localeCompare(b.zeitpunkt)),
      };
    });
}

// Der laufende Tag ist noch nicht vorbei und zählt deshalb nicht mit.
export function futterZusammenfassung(tage, heute) {
  const fertig = tage.filter((t) => t.tag !== heute);
  return {
    durchschnitt: fertig.length ? fertig.reduce((s, t) => s + t.kcal, 0) / fertig.length : null,
    anzahl: fertig.length,
    ueber: fertig.filter((t) => t.ueber).length,
  };
}

// Kalenderwoche nach ISO 8601: Woche 1 ist die mit dem ersten Donnerstag des Jahres.
export function kalenderwoche(tag) {
  const d = datumVon(tag);
  const donnerstag = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const jahresAnfang = new Date(donnerstag.getFullYear(), 0, 1);
  const tage = Math.round((donnerstag - jahresAnfang) / TAG_MS); // runden: Zeitumstellung verschiebt um 1 Stunde
  return 1 + Math.floor(tage / 7);
}

export function wochenGruppen(tage, heute) {
  const dieseWoche = montagVon(heute);
  const letzteWoche = plusTage(dieseWoche, -7);
  const gruppen = [];
  for (const eintrag of tage) {
    const montag = montagVon(eintrag.tag);
    const titel =
      montag === dieseWoche ? "Diese Woche" : montag === letzteWoche ? "Letzte Woche" : `KW ${kalenderwoche(montag)}`;
    const gruppe = gruppen.find((g) => g.montag === montag);
    if (gruppe) gruppe.tage.push(eintrag);
    else gruppen.push({ montag, titel, tage: [eintrag] });
  }
  return gruppen.map(({ titel, tage }) => ({ titel, tage }));
}

// Wägungen je Monat, neueste zuerst; diffKg ist die Änderung zur zeitlich davor liegenden Wägung.
export function monatsGruppen(gewichte) {
  const aufsteigend = [...gewichteSortiert(gewichte)].reverse();
  const mitDiff = aufsteigend.map((g, i) => ({ ...g, diffKg: i === 0 ? null : g.kg - aufsteigend[i - 1].kg }));
  const gruppen = new Map();
  for (const g of mitDiff.reverse()) {
    const schluessel = g.datum.slice(0, 7);
    if (!gruppen.has(schluessel)) gruppen.set(schluessel, []);
    gruppen.get(schluessel).push(g);
  }
  return [...gruppen.entries()].map(([schluessel, eintraege]) => ({
    schluessel,
    titel: datumVon(schluessel + "-01").toLocaleDateString("de-DE", { month: "long", year: "numeric" }),
    eintraege,
    durchschnitt: eintraege.reduce((s, g) => s + g.kg, 0) / eintraege.length,
  }));
}

// Ohne Freigabe gibt es kein Ziel: kein Füllstand, nichts "offen".
export function ringWerte(kcal, freigabe) {
  if (!freigabe) return { anteil: null, offen: 0, darueber: 0, ueber: false };
  const soll = freigabe.kcalProTag;
  return {
    anteil: Math.min(1, kcal / soll),
    offen: Math.max(0, soll - kcal),
    darueber: Math.max(0, kcal - soll),
    ueber: kcal > (1 + GRENZEN.spielraum) * soll,
  };
}

// Feste Reihenfolge der Futterarten in der Legende von „Gefüttert“.
const ARTEN = ["nass", "trocken", "leckerli"];

// Werte für die Karte „Gefüttert“ (ab 0.38.0): Stücke im Balken, Legende je Art, Marke, Überdeckung und erste Kachel.
// mahlzeiten: die des Tages, nach Uhrzeit sortiert (wie mahlzeitenAm). Mahlzeiten ohne Sorte (gelöscht) ergeben kein
// Stück; ihre Gramm zählen über tagesSumme trotzdem mit, und „unsicher“ bleibt wahr. Ohne Freigabe kein Ziel (null).
// Sorten ohne bekannte Art (fremde Sicherungen) zählen als Nassfutter, damit ihr Stück nicht aus der Legende fällt.
export function gefuettertWerte({ mahlzeiten, futterNachId, freigabe, tag, heute }) {
  const summe = tagesSumme(mahlzeiten, futterNachId);
  const stuecke = [];
  for (const m of mahlzeiten) {
    const futter = futterNachId.get(m.futterId);
    if (!futter) continue;
    stuecke.push({ typ: ARTEN.includes(futter.typ) ? futter.typ : "nass", kcal: kcalFuer(m.gramm, futter.kcalPro100g) });
  }
  const arten = ARTEN.filter((typ) => stuecke.some((s) => s.typ === typ)).map((typ) => ({
    typ,
    kcal: Math.round(stuecke.filter((s) => s.typ === typ).reduce((a, s) => a + s.kcal, 0)),
  }));
  let ziel = null;
  if (freigabe) {
    const soll = freigabe.kcalProTag;
    const d = Math.round(summe.kcal - soll);
    let ueberdeckung = "keine";
    let kachel;
    if (d > 0) {
      const warnung = ringWerte(summe.kcal, freigabe).ueber;
      ueberdeckung = warnung ? "bernstein" : "grau";
      kachel = { wort: "Darüber", kcal: d, warnung };
    } else {
      // Math.abs macht aus Math.round(-0,4) = -0 eine echte 0 (sonst „-0 kcal“).
      kachel = { wort: tag >= heute ? "Noch" : "Darunter", kcal: Math.abs(d), warnung: false };
    }
    ziel = { soll, marke: soll / Math.max(soll, summe.kcal), ueberdeckung, kachel };
  }
  return { kcal: summe.kcal, gramm: summe.gramm, unsicher: summe.unsicher, stuecke, arten, ziel };
}

// Gleiche Basis wie die Leckerli-Warnung in warnungen(); die Farbe kommt nur von der Warnung selbst.
export function leckerliKachel({ tag, heute, kcal, leckerli, freigabe, warnungAktiv }) {
  const stufe = warnungAktiv ? "achtung" : "normal";
  if (freigabe) return { kcal: leckerli, anteil: leckerli / Math.max(kcal, freigabe.kcalProTag), amTagesende: false, stufe };
  if (tag >= heute) return { kcal: leckerli, anteil: null, amTagesende: true, stufe };
  return { kcal: leckerli, anteil: kcal > 0 ? leckerli / kcal : null, amTagesende: false, stufe };
}

// ---------- Rückmeldung beim Gewicht eintragen (ab 0.23.0) ----------

const prozentText = (wert) => Math.abs(wert).toLocaleString("de-DE", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const kgText = (wert) =>
  (Math.round(wert * 100) === 0 ? "±" : wert > 0 ? "+" : "−") +
  Math.abs(wert).toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const kurzTag = (iso) => `${iso.slice(8, 10)}.${iso.slice(5, 7)}.`;

// Vergleicht ein neues Gewicht mit der letzten Messung vor seinem Datum. Gleiche Regeln wie wochenRaten:
// über 2 % pro Woche immer markiert, „sicher“ und „langsamer“ nur, wenn die letzte Messung nach der ersten
// Freigabe liegt. Bewertet nur zur Information – gewarnt wird weiterhin erst über das Mittel von zwei Wochen.
// bewertung: "gut" | "langsam" | "zunahme" | "zu-schnell" | "neutral". prozent: positiv = Abnahme.
// ohneId (seit 0.31.0, „Gewicht ändern“): diese Wägung zählt nicht mit, sonst vergliche sie sich mit sich selbst.
export function tempoRueckmeldung({ gewichte, freigaben, kg, datum, ohneId }) {
  if (!kg || !datum) return null;
  const andere = ohneId === undefined ? gewichte : gewichte.filter((g) => g.id !== ohneId);
  const vorher = gewichteSortiert(andere).find((g) => g.datum < datum);
  if (!vorher) return null;
  const wochen = tageZwischen(vorher.datum, datum) / 7;
  const diffKg = kg - vorher.kg;
  const prozent = ((vorher.kg - kg) / vorher.kg / wochen) * 100;
  const ersteFreigabe = [...freigaben].sort((a, b) => a.datum.localeCompare(b.datum))[0];
  const nachFreigabe = Boolean(ersteFreigabe) && vorher.datum >= ersteFreigabe.datum;
  const p = prozentText(prozent);
  let bewertung = "neutral";
  let text;
  if (prozent > GRENZEN.abnahmeMax + 1e-9) {
    bewertung = "zu-schnell";
    text =
      `${p} % pro Woche, schneller als 2 %. Das Gewicht schwankt von Mal zu Mal; Kilossos warnt, wenn das Mittel über zwei Wochen ` +
      "zu schnell ist. Nicht selbst die Menge ändern, bei Sorge mit dem Tierarzt sprechen.";
  } else if (!nachFreigabe) {
    text = `${prozent < 0 ? `Zunahme von ${p} %` : `${p} %`} pro Woche. Bewertet wird das Tempo erst mit einer Freigabe vom Tierarzt.`;
  } else if (prozent >= GRENZEN.abnahmeMin) {
    bewertung = "gut";
    text = `${p} % pro Woche, im sicheren Bereich (0,5 bis 2 %).`;
  } else if (prozent < 0) {
    bewertung = "zunahme";
    text = `Zunahme von ${p} % pro Woche. Das Gewicht schwankt von Mal zu Mal; behalte den Verlauf im Blick.`;
  } else {
    bewertung = "langsam";
    text =
      `${p} % pro Woche, langsamer als 0,5 %. Das Gewicht schwankt von Mal zu Mal; bleibt es vier Wochen so, ` +
      "rät Kilossos, den Plan mit dem Tierarzt zu besprechen.";
  }
  return { seit: vorher.datum, diffKg, prozent, bewertung, titel: `${kgText(diffKg)} kg seit dem ${kurzTag(vorher.datum)}`, text };
}

// Wägungen der letzten 8 Wochen (56 Tage bis "heute"), älteste zuerst – für die Mini-Kurve auf „Heute“.
export function achtWochen(gewichte, heute) {
  const von = plusTage(heute, -56);
  return [...gewichteSortiert(gewichte)].reverse().filter((g) => g.datum >= von && g.datum <= heute);
}
