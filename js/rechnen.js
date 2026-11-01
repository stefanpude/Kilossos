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

// Summe eines Tages. "unsicher" ist wahr, sobald ein Futter keinen genau abgelesenen kcal-Wert hat.
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
    if (futter.kcalQuelle !== "packung") unsicher = true;
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
