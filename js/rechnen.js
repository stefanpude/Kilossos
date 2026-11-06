// Reine Rechenfunktionen ohne Bildschirm und Speicher – dadurch automatisch testbar (tests/rechnen.test.js).

// Liest Zahlen in deutscher Schreibweise: "4,5" und "4.5" ergeben 4.5. Ungültiges ergibt null.
export function leseZahl(text) {
  const bereinigt = String(text).trim().replace(",", ".");
  if (!/^\d+(\.\d+)?$/.test(bereinigt)) return null;
  return Number(bereinigt);
}

export function kcalFuer(gramm, kcalPro100g) {
  return (gramm * kcalPro100g) / 100;
}

// Schätzt die umsetzbare Energie (kcal pro 100 g) aus den "Analytischen Bestandteilen" der Packung,
// alle Angaben in Prozent. Formel: NRC 2006, "Nutrient Requirements of Dogs and Cats", modifizierte
// Atwater-Faktoren für Katzen. Typische Abweichung vom echten Wert: bis etwa 10 %.
// Trockenfutter nennt die Feuchte oft nicht (Pflicht erst ab 14 %); dann sind 8 % ein üblicher Annahmewert.
export function kcalAusBestandteilen({ protein, fett, asche, faser, feuchte }) {
  const kohlenhydrate = 100 - protein - fett - asche - faser - feuchte;
  const bruttoEnergie = 5.7 * protein + 9.4 * fett + 4.1 * (kohlenhydrate + faser);
  const faserInTrockenmasse = (faser / (100 - feuchte)) * 100;
  const verdaulichProzent = 87.9 - 0.88 * faserInTrockenmasse;
  const verdaulicheEnergie = (bruttoEnergie * verdaulichProzent) / 100;
  return verdaulicheEnergie - 0.77 * protein;
}

// Trockenfutter nennt die Feuchte oft nicht. Für die Nachrechnung wird dann dieser Wert angenommen.
export const FEUCHTE_TROCKEN_ANNAHME = 8;

// ---------- kJ-Schutz im Fenster „Eigene Sorte“ (seit 0.32.0, Plan .planning/kcal-rechner-kj.md) ----------
// Höchstwerte der Kilossos-Futterliste: Nass 126, Trocken 396, Leckerli 438. Kleinster kJ-Wert bei Nassfutter 254,
// kleinster kcal-pro-kg-Wert 607: beide liegen über 150. Ein Wert genau auf der Grenze ist in Ordnung.
export const KCAL_GRENZEN = { min: 20, max: 700, nass: 150, trocken: 450, leckerli: 450 };
export const KJ_PRO_KCAL = 4.184; // thermochemische Kilokalorie

const NBSP = " ";
const komma = (zahl) => String(zahl).replace(".", ",");
const eineStelle = (zahl) => Math.round(zahl * 10) / 10;
const passend = (kcal) => kcal >= KCAL_GRENZEN.min && kcal <= KCAL_GRENZEN.max;
const ART_NAME = { nass: "Nassfutter", trocken: "Trockenfutter", leckerli: "Leckerli" };

// Passt der kcal-Wert pro 100 g zur Art? Ohne Art wird nicht nach der Einheit gefragt (beim Speichern kommt vorher
// „Bitte die Art wählen.“). kj und proKg: der umgerechnete Wert, wenn dort kJ bzw. kcal pro kg stünde; null, wenn er
// nicht zwischen 20 und 700 läge.
export function kcalPruefen(kcal, typ) {
  if (typeof kcal !== "number" || !Number.isFinite(kcal) || kcal < KCAL_GRENZEN.min) return { stufe: "fehler" };
  if (!Object.hasOwn(ART_NAME, typ) || kcal <= KCAL_GRENZEN[typ]) return { stufe: "ok" };
  const kj = eineStelle(kcal / KJ_PRO_KCAL);
  const proKg = eineStelle(kcal / 10);
  return {
    stufe: kcal <= KCAL_GRENZEN.max ? "rueckfrage" : "unmoeglich",
    kj: passend(kj) ? kj : null,
    proKg: passend(proKg) ? proKg : null,
  };
}

// Texte und Antworten für den roten Kasten; null, wenn es nichts zu fragen gibt.
// spanne: [kleinster, größter] kcal-Wert der Art in der Futterliste (kcalSpanne in js/wissen.js, übergibt app.js).
export function kcalKasten(kcal, typ, spanne) {
  const pruefung = kcalPruefen(kcal, typ);
  if (pruefung.stufe !== "rueckfrage" && pruefung.stufe !== "unmoeglich") return null;
  const wert = komma(kcal);
  const art = ART_NAME[typ];
  const antworten = [];
  if (pruefung.kj !== null)
    antworten.push({ aktion: "kcal-kj", wert: pruefung.kj, titel: "Dort steht kJ", klein: `Kilossos trägt ${komma(pruefung.kj)}${NBSP}kcal ein` });
  if (pruefung.proKg !== null)
    antworten.push({ aktion: "kcal-kg", wert: pruefung.proKg, titel: "Dort steht kcal pro kg", klein: `Kilossos trägt ${komma(pruefung.proKg)}${NBSP}kcal ein` });
  if (pruefung.stufe === "unmoeglich") {
    return {
      stufe: "unmoeglich",
      ueberschrift: `Mehr als ${KCAL_GRENZEN.max}${NBSP}kcal pro 100${NBSP}g kann Kilossos nicht speichern.`,
      saetze: [antworten.length ? `Was steht auf der Packung hinter der ${wert}?` : "Diese Zahl passt zu keiner Einheit. Bitte vergleiche sie mit der Packung."],
      antworten,
    };
  }
  antworten.push({ aktion: "kcal-stimmt", titel: `Dort steht kcal pro 100${NBSP}g`, klein: `Die ${wert} stimmen, so speichern` });
  const saetze = [
    `${art} ${typ === "leckerli" ? "haben" : "hat"} in der Kilossos-Futterliste ${spanne[0]} bis ${spanne[1]}${NBSP}kcal. ` +
      `Was steht auf der Packung hinter der ${wert}?`,
  ];
  if (typ === "nass" && kcal <= KCAL_GRENZEN.trocken) saetze.push("Ist es Trockenfutter? Dann ändere oben die Art.");
  return { stufe: "rueckfrage", ueberschrift: `${wert}${NBSP}kcal pro 100${NBSP}g sind für ${art} viel zu viel.`, saetze, antworten };
}

// ---------- Rechner „Keine kcal auf der Packung?“ ----------
export const RECHNER_FELDER = [
  { name: "protein", text: "Protein", packung: "Rohprotein" },
  { name: "fett", text: "Fett", packung: "Fettgehalt" },
  { name: "asche", text: "Asche", packung: "Rohasche" },
  { name: "faser", text: "Faser", packung: "Rohfaser" },
  { name: "feuchte", text: "Feuchte", packung: "Feuchtigkeit" },
];
const PFLICHT_FELDER = RECHNER_FELDER.slice(0, 4);

// Prüft die fünf getippten Prozentwerte (Text, Komma oder Punkt, „%“ am Ende erlaubt) und rechnet, wenn alles passt.
// Ergebnis: { art: "nichts" | "keineZahl" | "leer" | "feuchteFehlt" | "zuViel" | "feuchte100" | "ergebnis", … }
// Bei "zuViel": summe (auf 0,1 aufgerundet, damit nie „100 %, mehr als 100 %“ dasteht; ohne Feuchte-Annahme).
// Bei "ergebnis": kcal (ganz, wie in der Futterliste), analyse zum Speichern (feuchte null = nicht angegeben),
// angenommen (Feuchte fehlte) mit feuchteAnnahme (8 oder weniger, siehe unten), viel (über der Grenze der Art, Übernehmen bleibt möglich),
// uebernehmbar (nur 20 bis 700 kcal passen ins Feld).
export function rechnerPruefen(eingaben, typ) {
  // „7,“ beim Tippen gilt schon als 7, sonst blinkt bei jedem Komma kurz ein Fehler auf.
  const text = Object.fromEntries(
    RECHNER_FELDER.map((f) => [f.name, String(eingaben[f.name] ?? "").trim().replace(/\s*%$/, "").replace(/[.,]$/, "")]),
  );
  if (RECHNER_FELDER.every((f) => text[f.name] === "")) return { art: "nichts" };
  const lies = (t) => {
    const z = leseZahl(t);
    return z !== null && Number.isFinite(z) ? z : null;
  };
  const zahl = Object.fromEntries(RECHNER_FELDER.map((f) => [f.name, text[f.name] === "" ? null : lies(text[f.name])]));
  const keineZahl = RECHNER_FELDER.filter((f) => text[f.name] !== "" && zahl[f.name] === null).map((f) => f.name);
  if (keineZahl.length) return { art: "keineZahl", felder: keineZahl };
  const leer = PFLICHT_FELDER.filter((f) => zahl[f.name] === null).map((f) => f.text);
  if (leer.length) return { art: "leer", leer };
  const angenommen = zahl.feuchte === null;
  if (angenommen && typ === "nass") return { art: "feuchteFehlt" };
  // Auf 0,01 gerundet: 10,3 + 5,9 + 2,1 + 0,3 + 81,4 ergibt sonst 100,00000000000001.
  const hundertstel = (felder) => Math.round(felder.reduce((s, f) => s + (zahl[f.name] ?? 0), 0) * 100);
  const ohneFeuchte = hundertstel(PFLICHT_FELDER);
  // Fehlt die Feuchte, gelten 8 %. Läge die Summe damit über 100 % (gefriergetrocknete Snacks), wird der Rest bis
  // 100 % angenommen (seit 0.42.0): Mehr Feuchte kann es nicht geben, ohne dass die Kohlenhydrate unter 0 fallen.
  const feuchteAnnahme = angenommen
    ? Math.max(0, Math.min(FEUCHTE_TROCKEN_ANNAHME * 100, 10000 - ohneFeuchte)) / 100
    : null;
  const werte = { ...zahl, feuchte: angenommen ? feuchteAnnahme : zahl.feuchte };
  const summe = angenommen ? ohneFeuchte : hundertstel(RECHNER_FELDER);
  if (summe > 10000) return { art: "zuViel", summe: Math.ceil(summe / 10) / 10 };
  if (werte.feuchte >= 100) return { art: "feuchte100" };
  const kcal = Math.round(kcalAusBestandteilen(werte));
  return {
    art: "ergebnis",
    kcal,
    analyse: zahl,
    angenommen,
    ...(angenommen ? { feuchteAnnahme } : {}),
    viel: kcal > (typ === "nass" ? KCAL_GRENZEN.nass : KCAL_GRENZEN.trocken),
    uebernehmbar: passend(kcal),
  };
}

// Quellen, deren kcal-Wert als genau gilt. Alles andere macht eine Summe zu "ca.".
export const GENAUE_QUELLEN = ["packung", "hersteller"];

// Summe eines Tages. "unsicher" ist wahr, sobald ein Futter keinen genauen kcal-Wert hat.
export function tagesSumme(mahlzeiten, futterNachId) {
  let gramm = 0;
  let kcal = 0;
  let unsicher = false;
  for (const mahlzeit of mahlzeiten) {
    const futter = futterNachId.get(mahlzeit.futterId);
    gramm += mahlzeit.gramm;
    if (!futter) {
      unsicher = true;
      continue;
    }
    kcal += kcalFuer(mahlzeit.gramm, futter.kcalPro100g);
    if (!GENAUE_QUELLEN.includes(futter.kcalQuelle)) unsicher = true;
  }
  return { gramm, kcal, unsicher };
}

// "JJJJ-MM-TT" in der Ortszeit des Geräts (nicht UTC – sonst rutschen späte Mahlzeiten in den nächsten Tag).
export function tagSchluessel(datum) {
  const j = datum.getFullYear();
  const m = String(datum.getMonth() + 1).padStart(2, "0");
  const t = String(datum.getDate()).padStart(2, "0");
  return `${j}-${m}-${t}`;
}

export function mahlzeitenAm(mahlzeiten, tag) {
  return mahlzeiten
    .filter((mahlzeit) => tagSchluessel(new Date(mahlzeit.zeitpunkt)) === tag)
    .sort((a, b) => a.zeitpunkt.localeCompare(b.zeitpunkt));
}

// Gewicht auf dem Arm: Halter mit Katze minus Halter allein (Plan .planning/arm-wiegen.md).
// Ergebnis { kg } mit 2 Nachkommastellen oder { fehler }. Die Grenzen 0,5–20 kg sind dieselben wie im kg-Feld.
// Die beiden Halter-Gewichte werden nie gespeichert.
export function armGewicht(mitKatze, allein) {
  if (mitKatze == null || allein == null) return { fehler: "Bitte beide Gewichte eintragen." };
  if ([mitKatze, allein].some((w) => w < 1 || w > 250)) return { fehler: "Bitte Gewichte zwischen 1 und 250 kg eingeben." };
  if (mitKatze <= allein) return { fehler: "Das Gewicht mit Katze muss größer sein als das Gewicht allein." };
  const kg = Math.round((mitKatze - allein) * 100) / 100;
  if (kg < 0.5 || kg > 20) return { fehler: "Die Differenz muss zwischen 0,5 und 20 kg liegen. Bitte beide Zahlen prüfen." };
  return { kg };
}

// Rest zurückwiegen (0.46.0): gegebene Menge minus Rest im Napf = gefressen, auf 0,1 g genau.
// Gespeichert wird nur das Ergebnis. Alles übrig ist keine Mahlzeit mit 0 g, sondern wird gelöscht.
export function restAbziehen(gegeben, uebrig) {
  if (gegeben == null || uebrig == null) return { fehler: "Bitte beide Mengen eintragen." };
  if (gegeben < 0.1 || gegeben > 1000) return { fehler: "Bitte eine gegebene Menge zwischen 0,1 und 1000 g eingeben." };
  if (uebrig <= 0) return { fehler: "Der Rest muss größer als 0 sein." };
  if (uebrig > gegeben) return { fehler: "Der Rest kann nicht mehr als gegeben sein. Bitte beide Zahlen prüfen." };
  const gramm = Math.round((gegeben - uebrig) * 10) / 10;
  if (gramm < 0.1) {
    return {
      fehler:
        "Alles übrig: Dann diese Mahlzeit nicht ändern, sondern in der Liste löschen. " +
        "Frisst deine Katze gar nicht, unter „Besonderer Tag“ „Futter verweigert“ eintragen.",
    };
  }
  return { gramm };
}

// Anteil des Körpergewichts in ganzen Gramm, z. B. 1 % von 9,32 kg = 93 g.
export function prozentInGramm(kg, prozent) {
  return Math.round(kg * prozent * 10);
}

// Wie viel wären „gramm“ bei der Katze beim Menschen? Gleicher Anteil am Körpergewicht, in kg auf 0,1 gerundet.
// Beispiel Kito (9,32 kg): 100 g ≈ 0,8 kg bei einem 75-kg-Menschen. Nur zum Veranschaulichen, kein Grenzwert.
export function menschVergleich(katzeKg, gramm = 100, menschKg = 75) {
  return Math.round((menschKg * gramm * 10) / (katzeKg * 1000)) / 10;
}

// Gewichte, neueste zuerst.
export function gewichteSortiert(gewichte) {
  return [...gewichte].sort((a, b) => b.datum.localeCompare(a.datum));
}

// ---------- Sicherheitsgrenzen (Begründung und Quellen: docs/sicherheitsgrenzen.md) ----------

export const GRENZEN = {
  abnahmeMin: 0.5, // % Körpergewicht pro Woche – AAHA 2014, Flanagan 2018
  abnahmeMax: 2, // % Körpergewicht pro Woche – AAHA 2014, Flanagan 2018
  tageZuSchnell: 14, // "zu schnell" erst im Mittel über 2 Wochen, wegen der Messunsicherheit zu Hause
  tageStillstand: 28,
  harteUntergrenze: 0.6, // × RER beim Zielgewicht – AAHA 2014 (darunter Fachtierarzt für Ernährung)
  teilerOhneFreigabe: 1.4, // Zielgewicht bei BCS 9 – kleinstes Ziel, das der BCS-Schlüssel zulässt
  spielraum: 0.1, // ±10 % um die freigegebene Menge gelten noch als eingehalten
  wenigGefressen: 0.5, // unter der Hälfte: nachfragen, Fettleber-Gefahr
  leckerliMax: 0.1, // Anteil an den Tageskalorien – AAHA 2014 und 2021, WSAVA 2025
  freigabeTage: 90,
};

const QUELLEN = {
  abnahme: "AAHA Weight Management Guidelines 2014; Flanagan et al. 2018; Hoelmkjaer & Bjornvad",
  fettleber: "Armstrong 2011 (WSAVA); Merck Veterinary Manual; AAHA 2014",
  untergrenze: "AAHA 2014 und 2021; Flanagan et al. 2018",
  leckerli: "AAHA 2014 und 2021; WSAVA 2025",
  kontrolle: "AAHA 2014: Kontrolle alle 2 Wochen, später monatlich",
  diaetfutter: "AAHA 2021, Tabelle 8 (Adipositas): unter RER kein Handelsfutter",
};

// Ruheenergiebedarf (RER) in kcal pro Tag – NRC 2006. Für die Abnahme immer mit dem Zielgewicht rechnen.
export function rer(kg) {
  return 70 * kg ** 0.75;
}

// Jeder BCS-Punkt über 5 (9er-Skala) entspricht etwa 10 % Übergewicht – AAHA 2014, Flanagan 2018.
// Geteilt statt abgezogen: Das ergibt das vorsichtigere, höhere Zielgewicht.
export function zielgewichtAusBcs(kg, bcs) {
  return bcs <= 5 ? kg : kg / (1 + 0.1 * (bcs - 5));
}

export function harteUntergrenze(zielKg) {
  return GRENZEN.harteUntergrenze * rer(zielKg);
}

// Ohne Freigabe gibt es kein Zielgewicht: dann gilt der Ruhebedarf beim kleinsten denkbaren Ziel.
export function untergrenzeOhneFreigabe(aktuellKg) {
  return rer(aktuellKg / GRENZEN.teilerOhneFreigabe);
}

function tageZwischen(vonIso, bisIso) {
  const ms = (iso) => {
    const [j, m, t] = iso.split("-").map(Number);
    return Date.UTC(j, m - 1, t);
  };
  return Math.round((ms(bisIso) - ms(vonIso)) / 86400000);
}

// Abnahme in % pro Woche vom jüngsten Gewicht, das mindestens "mindestTage" älter ist, bis zum neuesten.
// Positiv = abgenommen, negativ = zugenommen. Zu wenige Messungen: null.
export function abnahmeProWoche(gewichte, mindestTage) {
  const sortiert = gewichteSortiert(gewichte);
  const bis = sortiert[0];
  const von = bis && sortiert.find((g) => tageZwischen(g.datum, bis.datum) >= mindestTage);
  if (!von) return null;
  const tage = tageZwischen(von.datum, bis.datum);
  return { prozent: ((von.kg - bis.kg) / von.kg / (tage / 7)) * 100, tage, von, bis };
}

export function leckerliKcal(mahlzeiten, futterNachId) {
  let kcal = 0;
  for (const mahlzeit of mahlzeiten) {
    const futter = futterNachId.get(mahlzeit.futterId);
    if (futter?.typ === "leckerli") kcal += kcalFuer(mahlzeit.gramm, futter.kcalPro100g);
  }
  return kcal;
}

// Die neueste Freigabe – mit "stichtag" ("JJJJ-MM-TT") die, die an diesem Tag galt.
// Bei gleichem Datum die zuletzt eingetragene (spätere Stelle in der Liste), seit 0.34.0; vorher galt die erste.
export function aktuelleFreigabe(freigaben, stichtag = "9999-12-31") {
  let beste = null;
  for (const f of freigaben) if (f.datum <= stichtag && (!beste || f.datum >= beste.datum)) beste = f;
  return beste;
}

// Gewichte, die an einem Tag schon bekannt waren – für den Blick auf vergangene Tage.
export function gewichteBis(gewichte, stichtag) {
  return gewichte.filter((g) => g.datum <= stichtag);
}

function wenigGefressenText(kcal, name, gestern) {
  const k = Math.round(kcal);
  const anfang =
    kcal === 0
      ? gestern ? "Für gestern ist keine Mahlzeit eingetragen." : "Für diesen Tag ist keine Mahlzeit eingetragen."
      : gestern ? `Gestern sind nur ${k} kcal eingetragen.` : `An diesem Tag sind nur ${k} kcal eingetragen.`;
  return (
    anfang +
    ` Hat ${name} normal gefressen? Wenn eine Katze 24 Stunden lang nichts oder kaum etwas frisst: ` +
    "am selben Tag den Tierarzt anrufen – Gefahr einer Fettleber."
  );
}

// Für „Heute“: Hat die Katze gestern kaum etwas gefressen? Sonst stünde das nur beim Zurückblättern
// (Sicherheits-Review 05.11.2026). eingaben wie bei warnungen(), aber für den Tag gestern. Ergebnis: Warnung oder null.
export function gesternWenigGefressen(eingaben) {
  if (!warnungen(eingaben).some((w) => w.id === "wenig-gefressen")) return null;
  return {
    art: "sofort",
    id: "wenig-gefressen-gestern",
    text: wenigGefressenText(eingaben.kcal, eingaben.name, true),
    quelle: QUELLEN.fettleber,
  };
}

// Ab dieser Stunde (19:00) erinnert „Heute“ ruhig an einen leeren Tag (0.50.0). Kein medizinischer Grenzwert.
export const ABEND_STUNDE = 19;

// Ruhiger Hinweis am Abend, wenn für das gewählte Tier heute noch keine Mahlzeit eingetragen ist
// (.planning/erinnerung-abends.md Teil 1). Nicht am ersten Tag der Nutzung, nicht beim Zurückblättern und nicht,
// wenn heute „Futter verweigert“ eingetragen ist (dann zeigt der rote Notfall-Kasten, was zu tun ist).
// Bewusst ohne Gesundheitsaussage: Er soll nur an das Eintragen erinnern. Ergebnis: Hinweis oder null.
export function abendHinweis({ name, tag, heute, stunde, mahlzeitenHeute, fruehereMahlzeiten, futterVerweigert }) {
  if (tag !== heute || stunde < ABEND_STUNDE || mahlzeitenHeute > 0 || !fruehereMahlzeiten || futterVerweigert) return null;
  return {
    art: "hinweis",
    id: "abend-nichts-eingetragen",
    text: `Für ${name} ist heute noch keine Mahlzeit eingetragen. Schon gefüttert? Dann trag es jetzt ein, damit der Tag vollständig ist.`,
  };
}

// Alle Warnungen für einen Tag, die dringendsten zuerst. art: "sofort" | "achtung" | "hinweis".
// tag/heute: "JJJJ-MM-TT"; kcal und leckerli: Summe des Tages; fruehereMahlzeiten: gab es vor "tag" schon Einträge?
// normalesFutterKcal: kcal des Tages aus Futter, das kein Diätfutter ist (normalesFutterKcal in futterliste.js).
// freigabe und gewichte so übergeben, wie sie an "tag" galten (aktuelleFreigabe mit Stichtag, gewichteBis).
export function warnungen({ name, tag, heute, kcal, leckerli, freigabe, gewichte, fruehereMahlzeiten, normalesFutterKcal = 0 }) {
  const liste = [];
  const neuestes = gewichteSortiert(gewichte)[0];
  const tagVorbei = tag < heute;
  const k = Math.round(kcal);

  // Grenze, unter der ein abgeschlossener Tag als "zu wenig" gilt.
  const soll = freigabe ? freigabe.kcalProTag : neuestes ? untergrenzeOhneFreigabe(neuestes.kg) : null;
  const leererTag = kcal === 0 && !fruehereMahlzeiten;
  // Ohne Grenze (keine Freigabe, kein Gewicht) fragt wenigstens ein Tag ganz ohne Mahlzeit nach (seit 0.36.2).
  const wenig = tagVorbei && !leererTag && (soll ? kcal < GRENZEN.wenigGefressen * soll : kcal === 0);
  if (wenig) {
    liste.push({ art: "sofort", id: "wenig-gefressen", text: wenigGefressenText(kcal, name, false), quelle: QUELLEN.fettleber });
  } else if (soll && tagVorbei && !leererTag) {
    if (freigabe && kcal < (1 - GRENZEN.spielraum) * soll) {
      liste.push({
        art: "achtung",
        id: "unter-freigabe",
        text: `${k} kcal – weniger als die freigegebenen ${freigabe.kcalProTag} kcal. Nicht dauerhaft unterschreiten.`,
        quelle: QUELLEN.fettleber,
      });
    } else if (!freigabe && kcal < soll) {
      liste.push({
        art: "achtung",
        id: "unter-untergrenze",
        text:
          `${k} kcal – weniger als ${Math.round(soll)} kcal. Das ist schon Diät-Menge, aber es gibt noch keinen Plan ` +
          "vom Tierarzt. Bitte nicht auf eigene Faust kürzen.",
        quelle: QUELLEN.untergrenze,
      });
    }
  }
  if (freigabe && kcal > (1 + GRENZEN.spielraum) * freigabe.kcalProTag) {
    liste.push({
      art: "hinweis",
      id: "ueber-freigabe",
      text: `${k} kcal – mehr als die freigegebenen ${freigabe.kcalProTag} kcal.`,
      quelle: QUELLEN.abnahme,
    });
  }

  // Ohne Freigabe ist der laufende Tag noch unvollständig – ein Leckerli am Morgen wäre sonst gleich "100 %".
  const tagesKcal = freigabe ? Math.max(kcal, freigabe.kcalProTag) : kcal;
  if ((freigabe || tagVorbei) && leckerli > GRENZEN.leckerliMax * tagesKcal) {
    liste.push({
      art: "achtung",
      id: "leckerli",
      text: `Leckerlis: ${Math.round(leckerli)} kcal – mehr als 10 % der Tageskalorien.`,
      quelle: QUELLEN.leckerli,
    });
  }

  // Bei einer Freigabe unter RER(Ziel) reicht normales Futter nicht mehr für Vitamine und Mineralstoffe.
  const ruhebedarf = freigabe ? rer(freigabe.zielgewichtKg) : 0;
  if (freigabe && freigabe.kcalProTag < ruhebedarf && normalesFutterKcal > 0) {
    liste.push({
      art: "hinweis",
      id: "diaetfutter",
      text:
        `Die freigegebenen ${freigabe.kcalProTag} kcal liegen unter dem Ruhebedarf beim Zielgewicht ` +
        `(${Math.round(ruhebedarf)} kcal). Dafür empfehlen die Leitlinien ein Diätfutter vom Tierarzt, weil normales ` +
        `Futter dann zu wenig Vitamine und Mineralstoffe liefert. An diesem Tag kamen ${Math.round(normalesFutterKcal)} ` +
        "kcal aus normalem Futter. Bitte mit dem Tierarzt besprechen.",
      quelle: QUELLEN.diaetfutter,
    });
  }

  const schnell = abnahmeProWoche(gewichte, GRENZEN.tageZuSchnell);
  // 1e-9: genau 2 % (z. B. 10 → 9,6 kg in 14 Tagen) ergibt durch Gleitkomma 2,000…02 und ist noch erlaubt.
  // Knapp darüber 2 Nachkommastellen, aufgerundet – sonst stünde „2,0 % (erlaubt bis 2 %)“ da (seit 0.36.2).
  if (schnell && schnell.prozent > GRENZEN.abnahmeMax + 1e-9) {
    const p = schnell.prozent;
    const anzeige = (p < 2.1 ? (Math.ceil(p * 100) / 100).toFixed(2) : p.toFixed(1)).replace(".", ",");
    liste.push({
      art: "achtung",
      id: "zu-schnell",
      text:
        `${name} nimmt zu schnell ab: ${anzeige} % pro Woche (erlaubt bis 2 %). ` +
        "Bitte in den nächsten Tagen mit dem Tierarzt sprechen – nicht selbst die Menge ändern.",
      quelle: QUELLEN.abnahme,
    });
  }

  if (freigabe) {
    const still = abnahmeProWoche(gewichte, GRENZEN.tageStillstand);
    if (still && still.von.datum >= freigabe.datum && still.prozent < GRENZEN.abnahmeMin) {
      liste.push({
        art: "hinweis",
        id: "stillstand",
        text:
          `Seit ${still.tage} Tagen weniger als 0,5 % Abnahme pro Woche. Beim nächsten Tierarzttermin den Plan ` +
          "besprechen – nicht selbst kürzen.",
        quelle: QUELLEN.abnahme,
      });
    }
    if (neuestes && neuestes.kg <= freigabe.zielgewichtKg) {
      liste.push({
        art: "hinweis",
        id: "ziel-erreicht",
        text: `Zielgewicht erreicht! Jetzt mit dem Tierarzt die Menge zum Halten des Gewichts festlegen.`,
        quelle: QUELLEN.kontrolle,
      });
    }
    if (tageZwischen(freigabe.datum, tag) > GRENZEN.freigabeTage) {
      liste.push({
        art: "hinweis",
        id: "freigabe-alt",
        text: "Die Freigabe ist älter als 3 Monate. Zeit für eine Kontrolle beim Tierarzt.",
        quelle: QUELLEN.kontrolle,
      });
    }
  }

  const rang = { sofort: 0, achtung: 1, hinweis: 2 };
  return liste.sort((a, b) => rang[a.art] - rang[b.art]);
}
