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

// Quellen, deren kcal-Wert als genau gilt. Alles andere macht eine Summe zu "ca.".
const GENAUE_QUELLEN = ["packung", "hersteller"];

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
  leckerliMax: 0.1, // Anteil an den Tageskalorien – AAHA 2014
  freigabeTage: 90,
};

const QUELLEN = {
  abnahme: "AAHA Weight Management Guidelines 2014; Flanagan et al. 2018",
  fettleber: "Armstrong 2011 (WSAVA); Merck Veterinary Manual; AAHA 2014",
  untergrenze: "AAHA 2014; Flanagan et al. 2018",
  leckerli: "AAHA Weight Management Guidelines 2014",
  kontrolle: "AAHA 2014: Kontrolle alle 2–4 Wochen",
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
export function aktuelleFreigabe(freigaben, stichtag = "9999-12-31") {
  return [...freigaben].filter((f) => f.datum <= stichtag).sort((a, b) => b.datum.localeCompare(a.datum))[0] ?? null;
}

// Gewichte, die an einem Tag schon bekannt waren – für den Blick auf vergangene Tage.
export function gewichteBis(gewichte, stichtag) {
  return gewichte.filter((g) => g.datum <= stichtag);
}

// Alle Warnungen für einen Tag, die dringendsten zuerst. art: "sofort" | "achtung" | "hinweis".
// tag/heute: "JJJJ-MM-TT"; kcal und leckerli: Summe des Tages; fruehereMahlzeiten: gab es vor "tag" schon Einträge?
// freigabe und gewichte so übergeben, wie sie an "tag" galten (aktuelleFreigabe mit Stichtag, gewichteBis).
export function warnungen({ name, tag, heute, kcal, leckerli, freigabe, gewichte, fruehereMahlzeiten }) {
  const liste = [];
  const neuestes = gewichteSortiert(gewichte)[0];
  const tagVorbei = tag < heute;
  const k = Math.round(kcal);

  // Grenze, unter der ein abgeschlossener Tag als "zu wenig" gilt.
  const soll = freigabe ? freigabe.kcalProTag : neuestes ? untergrenzeOhneFreigabe(neuestes.kg) : null;
  const leererTag = kcal === 0 && !fruehereMahlzeiten;
  if (soll && tagVorbei && !leererTag) {
    if (kcal < GRENZEN.wenigGefressen * soll) {
      liste.push({
        art: "sofort",
        id: "wenig-gefressen",
        text:
          (kcal === 0 ? "Für diesen Tag ist keine Mahlzeit eingetragen." : `An diesem Tag sind nur ${k} kcal eingetragen.`) +
          ` Hat ${name} normal gefressen? Wenn eine Katze 24 Stunden lang nichts oder kaum etwas frisst: ` +
          "am selben Tag den Tierarzt anrufen – Gefahr einer Fettleber.",
        quelle: QUELLEN.fettleber,
      });
    } else if (freigabe && kcal < (1 - GRENZEN.spielraum) * soll) {
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

  const schnell = abnahmeProWoche(gewichte, GRENZEN.tageZuSchnell);
  if (schnell && schnell.prozent > GRENZEN.abnahmeMax) {
    liste.push({
      art: "achtung",
      id: "zu-schnell",
      text:
        `${name} nimmt zu schnell ab: ${schnell.prozent.toFixed(1).replace(".", ",")} % pro Woche (erlaubt bis 2 %). ` +
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
          "besprechen (üblich: 10 % weniger kcal) – nicht selbst kürzen.",
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
