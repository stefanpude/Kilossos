// Wie voll der Speicher auf dem Gerät (localStorage) ist. Fotos sind der größte Teil.
// Browser erlauben meist rund 5 Millionen Zeichen je Adresse; abfragen lässt sich die genaue Grenze nicht, deshalb „etwa“.
// Angezeigt wird nur der Anteil in Prozent: Zeichen sind je nach Browser 1 oder 2 Byte, eine MB-Angabe wäre ungenau.
// Reine Funktionen, damit sie ohne Browser testbar sind.
export const GRENZE_ZEICHEN = 5_000_000;
const KNAPP = 0.7;
const VOLL = 0.9;

// Zeichen aller Einträge (Schlüssel + Wert), auch Demo und Einstellungen: Sie teilen sich denselben Platz.
// null, wenn der Speicher gesperrt ist.
export function belegteZeichen(speicher) {
  try {
    let summe = 0;
    for (let i = 0; i < speicher.length; i++) {
      const schluessel = speicher.key(i);
      if (schluessel === null) continue;
      summe += schluessel.length + (speicher.getItem(schluessel)?.length ?? 0);
    }
    return summe;
  } catch {
    return null;
  }
}

export function speicherAnzeige(zeichen, grenze = GRENZE_ZEICHEN) {
  if (!Number.isFinite(zeichen)) return null;
  const anteil = Math.min(1, Math.max(0, zeichen / grenze));
  const prozent = Math.round(anteil * 100);
  const stufe = anteil >= VOLL ? "voll" : anteil >= KNAPP ? "knapp" : "ok";
  const hinweis = {
    ok: "",
    knapp: "Der Speicher wird knapp. Speichere eine Sicherung, damit nichts verloren geht.",
    voll: "Der Speicher ist fast voll. Speichere eine Sicherung und entferne ältere Fotos (Foto in der Liste unter „Gewicht“ antippen), sonst lassen sich bald keine Einträge mehr speichern.",
  }[stufe];
  return { prozent, stufe, hinweis, text: prozent < 1 ? "Speicher: fast leer (unter 1 % belegt)." : `Speicher: etwa ${prozent} % belegt.` };
}
