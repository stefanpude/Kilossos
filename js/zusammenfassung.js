// Rechnungen für die Oberfläche: Zusammenfassungen, Gruppen und Werte für Ring und Kacheln.
// Reine Funktionen ohne Bildschirm und Speicher – dadurch automatisch testbar (tests/zusammenfassung.test.js).
// Die Grenzen selbst kommen unverändert aus rechnen.js; hier wird nichts neu bewertet, nur zusammengefasst.

import {
  GRENZEN,
  GENAUE_QUELLEN,
  gewichteSortiert,
  tagesSumme,
  tagSchluessel,
  aktuelleFreigabe,
  leckerliKcal,
  kcalFuer,
} from "./rechnen.js";

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
// Seit 0.75.0 gegen die Vergleichsmessung (mindestens GRENZEN.tageTempo Tage davor, wie tempoRueckmeldung);
// Wägungen ohne eine solche bekommen keinen Punkt. Wöchentlich gewogen ändert sich nichts.
// Rot (über 2 %) gilt immer; Grün und Gelb nur für Wochen, die nach der ersten Freigabe beginnen.
export function wochenRaten(gewichte, freigaben) {
  const sortiert = gewichteSortiert(gewichte);
  const liste = [...sortiert].reverse();
  const ersteFreigabe = [...freigaben].sort((a, b) => a.datum.localeCompare(b.datum))[0];
  const raten = [];
  for (let i = 1; i < liste.length; i++) {
    const neu = liste[i];
    const alt = vergleichsMessung(sortiert, neu.datum);
    if (!alt) continue;
    const wochen = tageZwischen(alt.datum, neu.datum) / 7;
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
const ARTEN = ["nass", "trocken", "frischfleisch", "leckerli"];

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
  // Legende: ganze kcal je Art, die zusammen die gerundete Summe ergeben (0.42.2, Methode des größten Rests);
  // einzeln gerundet wären es z. B. 120 + 99 = 219 unter einer großen „220“.
  const genau = ARTEN.filter((typ) => stuecke.some((s) => s.typ === typ)).map((typ) => ({
    typ,
    kcal: stuecke.filter((s) => s.typ === typ).reduce((a, s) => a + s.kcal, 0),
  }));
  const arten = genau.map((a) => ({ typ: a.typ, kcal: Math.floor(a.kcal + 1e-9) }));
  let fehlt = Math.round(genau.reduce((a, s) => a + s.kcal, 0)) - arten.reduce((a, s) => a + s.kcal, 0);
  const nachRest = genau.map((a, i) => ({ i, rest: a.kcal - arten[i].kcal })).sort((p, q) => q.rest - p.rest);
  for (const { i } of nachRest) if (fehlt-- > 0) arten[i].kcal += 1;
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

// Werte für „Mehr zur Fütterung“ (ab 0.44.0), aufklappbar unten in der Karte „Gefüttert“. Gleiche Eingaben wie
// gefuettertWerte. Ohne Mahlzeit null (dann keine Zeile). ziel: Abstand zur Tagesmenge mit derselben Rundung wie die
// Kachel (Math.round(kcal − soll)), dazu Tagesmenge und Datum der geltenden Freigabe. arten: Gramm und kcal je Art,
// kcal wie in der Legende (ergeben zusammen die große Zahl). Leckerlis seit 0.78.0 über leckerliKachel.
// geschaetzt: Namen der Sorten des Tages ohne genaue Quelle (je Sorte einmal, nach Uhrzeit); geloescht: eine Mahlzeit
// gehört zu einer gelöschten Sorte. Keine Futtermenge: hier wird nichts in Gramm umgerechnet oder vorgeschlagen.
export function gefuettertMehr({ mahlzeiten, futterNachId, freigabe, tag, heute }) {
  if (!mahlzeiten.length) return null;
  const werte = gefuettertWerte({ mahlzeiten, futterNachId, freigabe, tag, heute });
  const gramm = new Map();
  const geschaetzt = [];
  let geloescht = false;
  for (const m of mahlzeiten) {
    const futter = futterNachId.get(m.futterId);
    if (!futter) {
      geloescht = true;
      continue;
    }
    const typ = ARTEN.includes(futter.typ) ? futter.typ : "nass";
    gramm.set(typ, (gramm.get(typ) ?? 0) + m.gramm);
    if (!GENAUE_QUELLEN.includes(futter.kcalQuelle) && !geschaetzt.includes(futter.name)) geschaetzt.push(futter.name);
  }
  let ziel = null;
  if (freigabe) {
    const soll = freigabe.kcalProTag;
    const d = Math.round(werte.kcal - soll);
    const art = d > 0 ? "ueber" : d === 0 ? "erreicht" : tag >= heute ? "noch" : "unter";
    // Math.abs: aus Math.round(-0,4) = -0 wird 0.
    ziel = { art, kcal: Math.abs(d), soll, datum: freigabe.datum };
  }
  return {
    heute: tag >= heute,
    kcal: werte.kcal,
    ziel,
    arten: werte.arten.map((a) => ({ typ: a.typ, gramm: gramm.get(a.typ) ?? 0, kcal: a.kcal })),
    geschaetzt,
    geloescht,
  };
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

// Text, wenn keine Messung mindestens GRENZEN.tageTempo Tage zurückliegt (0.75.0, Wortlaut mit Stefans Ja).
export const TEXT_TEMPO_ZU_NAH =
  "Für ein Tempo liegen die Messungen noch zu nah beieinander. Es erscheint ab 7 Tagen Abstand. " +
  "Das Gewicht schwankt von Tag zu Tag; am genauesten ist 1× pro Woche zur gleichen Zeit.";

// Vergleichsmessung fürs Tempo (seit 0.75.0): die jüngste Wägung, die mindestens GRENZEN.tageTempo Tage vor "datum"
// liegt. Vorher war es die direkt vorige; dann wurden 90 g an einem Tag zu „7,4 % pro Woche“ (Stefans Handy, 06.11.).
// "sortiert": neueste zuerst (gewichteSortiert).
function vergleichsMessung(sortiert, datum) {
  return sortiert.find((g) => tageZwischen(g.datum, datum) >= GRENZEN.tageTempo);
}

// Vergleicht ein neues Gewicht mit der Vergleichsmessung (siehe oben). Gleiche Regeln wie wochenRaten:
// über 2 % pro Woche immer markiert, „sicher“ und „langsamer“ nur, wenn die Vergleichsmessung nach der ersten
// Freigabe liegt. Bewertet nur zur Information – gewarnt wird weiterhin erst über das Mittel von zwei Wochen.
// bewertung: "gut" | "langsam" | "zunahme" | "zu-schnell" | "neutral". prozent: positiv = Abnahme.
// Gibt es nur jüngere Messungen: kurz = true, prozent = null, neutral, Gramm zur direkt vorigen, Text TEXT_TEMPO_ZU_NAH.
// ohneId (seit 0.31.0, „Gewicht ändern“): diese Wägung zählt nicht mit, sonst vergliche sie sich mit sich selbst.
export function tempoRueckmeldung({ gewichte, freigaben, kg, datum, ohneId }) {
  if (!kg || !datum) return null;
  const andere = ohneId === undefined ? gewichte : gewichte.filter((g) => g.id !== ohneId);
  const sortiert = gewichteSortiert(andere);
  const direkt = sortiert.find((g) => g.datum < datum);
  if (!direkt) return null;
  const vorher = vergleichsMessung(sortiert, datum);
  if (!vorher) {
    const diff = kg - direkt.kg;
    return {
      seit: direkt.datum,
      vorher: { datum: direkt.datum, kg: direkt.kg },
      diffKg: diff,
      prozent: null,
      bewertung: "neutral",
      kurz: true,
      titel: `${kgText(diff)} kg seit dem ${kurzTag(direkt.datum)}`,
      text: TEXT_TEMPO_ZU_NAH,
    };
  }
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
      "zu schnell ist. Nicht selbst die Menge ändern, bei Sorge mit der Tierarztpraxis sprechen.";
  } else if (!nachFreigabe) {
    text = `${prozent < 0 ? `Zunahme von ${p} %` : `${p} %`} pro Woche. Bewertet wird das Tempo erst mit einer tierärztlichen Freigabe.`;
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
      "rät Kilossos, den Plan mit der Tierarztpraxis zu besprechen.";
  }
  return {
    seit: vorher.datum,
    vorher: { datum: vorher.datum, kg: vorher.kg },
    diffKg,
    prozent,
    bewertung,
    titel: `${kgText(diffKg)} kg seit dem ${kurzTag(vorher.datum)}`,
    text,
  };
}

// Wägungen der letzten 8 Wochen (56 Tage bis "heute"), älteste zuerst – für die Kurve auf „Heute“.
export function achtWochen(gewichte, heute) {
  const von = plusTage(heute, -56);
  return [...gewichteSortiert(gewichte)].reverse().filter((g) => g.datum >= von && g.datum <= heute);
}

// Tempo in % pro Woche als Text ohne Vorzeichen (seit 0.40.1), für „Letzte Messung“ und den Wert am neuesten
// Tempo-Punkt. Normal eine Nachkommastelle. Liegt eine Abnahme näher als 0,1 an einer Grenze aus GRENZEN, zwei
// Stellen, in Richtung des Urteils gerundet (über der Grenze auf-, sonst zur Grenze hin nach innen gerundet), damit
// die Zahl nie auf der falschen Seite steht (wie die Warnung in rechnen.js). Genau auf der Grenze bleibt es bei „2,0“.
// Die Schwellen sind dieselben wie in tempoRueckmeldung und wochenRaten (über 2 % erst ab 1e-9 darüber).
export function tempoZahl(prozent) {
  const text = (wert, stellen) => wert.toLocaleString("de-DE", { minimumFractionDigits: stellen, maximumFractionDigits: stellen });
  const min = GRENZEN.abnahmeMin;
  const max = GRENZEN.abnahmeMax;
  const nah = (grenze) => Math.abs(prozent - grenze) < 0.1 - 1e-9;
  // 1e-6 gleicht Gleitkomma-Reste aus (2,01 · 100 = 200,99999…); die Grenzfälle sichern max/min darunter ab.
  const auf = (p) => Math.ceil(p * 100 - 1e-6) / 100;
  const ab = (p) => Math.floor(p * 100 + 1e-6) / 100;
  if (nah(max)) {
    if (prozent > max + 1e-9) return text(Math.max(auf(prozent), max + 0.01), 2);
    const r = ab(prozent);
    return r >= max ? text(max, 1) : text(r, 2);
  }
  if (nah(min)) {
    if (prozent < min) return text(Math.min(Math.floor(prozent * 100) / 100, min - 0.01), 2);
    const r = auf(prozent);
    return r <= min ? text(min, 1) : text(r, 2);
  }
  // Math.abs: Zunahme ohne Vorzeichen; −0,04 wird „0,0“, nie „-0,0“.
  return text(Math.abs(prozent), 1);
}

// Werte für die Karte „Letzte Messung“ (ab 0.39.0). gewichte und freigaben: nur dieses Tier und nur bis „tag“.
// Vergleich und Bewertung genau wie tempoRueckmeldung (Wägung davor = letzte mit früherem Datum; zwei am selben
// Tag ergeben also keinen Vergleich). Die Kurve braucht mindestens zwei Wägungen in den 8 Wochen bis „tag“.
// mittelZuSchnell (seit 0.40.1): Ist an diesem Tag die Warnung „zu schnell“ aktiv (Mittel über GRENZEN.tageZuSchnell
// Tage, gerechnet in warnungen()), folgt die Karte ihr: rot, mit Hinweis aufs Mittel. Keine zweite Rechnung hier.
// War die letzte Woche selbst schon zu schnell, bleibt es bei deren Text (mittelZuSchnell dann false).
export function messungWerte({ gewichte, freigaben, tag, mittelZuSchnell = false }) {
  const sortiert = gewichteSortiert(gewichte);
  const letzte = sortiert[0];
  if (!letzte) return { art: "keine" };
  const r = tempoRueckmeldung({ gewichte, freigaben, kg: letzte.kg, datum: letzte.datum });
  if (!r) return { art: "ohneVergleich", letzte };
  // Seit 0.75.0 kommt „vorher“ aus tempoRueckmeldung: Gramm im Kopf und Tempo beziehen sich auf dieselbe Messung.
  // r.kurz: keine Messung mindestens 7 Tage davor; Gramm zur direkt vorigen, statt Tempo ein Hinweis (heute-grafiken).
  const { vorher } = r;
  const kurve = achtWochen(gewichte, tag);
  const mittel = Boolean(mittelZuSchnell) && !r.kurz && r.bewertung !== "zu-schnell";
  return {
    art: "mitVergleich",
    ...(r.kurz ? { kurz: true } : {}),
    letzte,
    vorher,
    // „|| 0“: Math.round(-0,3) ergibt -0, das würde als „-0 g“ erscheinen.
    diffG: Math.round((letzte.kg - vorher.kg) * 1000) || 0,
    prozent: r.prozent,
    bewertung: mittel ? "zu-schnell" : r.bewertung,
    mittelZuSchnell: mittel,
    kurve: kurve.length >= 2 ? kurve : null,
  };
}
