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
