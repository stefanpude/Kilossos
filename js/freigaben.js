// Freigabe ändern und löschen (seit 0.34.0, Entwurf .planning/freigabe-aendern.md): reine Regeln und Texte,
// damit sie ohne Browser testbar sind. Alle Listen sind die Freigaben EINES Tiers, der Aufrufer filtert nach tierId.
// "heute" kommt immer als Parameter ("JJJJ-MM-TT"), damit Tests nicht vom echten Datum abhängen.
import { aktuelleFreigabe, GRENZEN } from "./rechnen.js";
import { datumText } from "./mehr.js";

const zahl = (wert, stellen = 0) =>
  wert.toLocaleString("de-DE", { minimumFractionDigits: stellen, maximumFractionDigits: stellen });

export const HINWEIS_AENDERN =
  "Nur für Fehler beim Eintragen. Hat die Tierarztpraxis einen neuen Plan festgelegt, trag ihn über „Freigabe eintragen“ neu ein. " +
  "So bleibt der alte Plan im Verlauf.";
// Die falsche kann die auf der Tafel oder die unter „Frühere Freigaben“ sein, deshalb kein Hinweis auf nur einen Ort.
export const TEXT_ZWEI_AM_TAG = "An diesem Tag gibt es zwei Freigaben. Bitte prüf beide und lösche zuerst die falsche.";
export const TEXT_ANDERE_AM_TAG = "An diesem Tag gibt es schon eine andere Freigabe. Bitte das Datum prüfen.";
export const TEXT_GLEICHER_TAG_NICHT_GESPEICHERT = "Nicht gespeichert: Für diesen Tag gibt es schon eine Freigabe.";
export const TEXT_DATUM_PRUEFEN = "Nicht gespeichert: Bitte das Datum prüfen.";
export const TEXT_DATUM_KORRIGIEREN =
  "Nicht gespeichert: Bitte das Datum prüfen. Ein neuer tierärztlicher Plan kommt über „Freigabe eintragen“ dazu.";
export const TEXT_ZIEL_PRUEFEN = "Nicht gespeichert: Bitte das Zielgewicht prüfen.";

// Ändert die Freigabe an Ort und Stelle; id und tierId bleiben. BCS/MCS ohne Angabe fehlen danach ganz.
export function freigabeAendern(freigabe, { datum, zielgewichtKg, kcalProTag, tierarzt, notiz, bcs, mcs }) {
  Object.assign(freigabe, {
    datum,
    zielgewichtKg,
    kcalProTag,
    tierarzt: String(tierarzt ?? "").trim(),
    notiz: String(notiz ?? "").trim(),
  });
  for (const [feld, wert] of [["bcs", bcs], ["mcs", mcs]]) {
    if (wert === undefined || wert === null || wert === "") delete freigabe[feld];
    else freigabe[feld] = wert;
  }
}

// Freigaben mit genau diesem Datum; beim Ändern ohne die Freigabe selbst.
export function freigabenAmTag(freigaben, datum, ohneId = null) {
  return freigaben.filter((f) => f.datum === datum && f.id !== ohneId);
}

// Alle außer der geltenden, neueste zuerst; bei gleichem Datum die später eingetragene zuerst.
export function fruehereFreigaben(freigaben) {
  const geltende = aktuelleFreigabe(freigaben);
  return freigaben
    .map((f, stelle) => ({ f, stelle }))
    .filter(({ f }) => f !== geltende)
    .sort((a, b) => b.f.datum.localeCompare(a.f.datum) || b.stelle - a.stelle)
    .map(({ f }) => f);
}

// "Ziel 5,50 kg, 210 kcal" mit geschützten Leerzeichen zwischen Zahl und Einheit.
export function freigabeKurz(f) {
  return `Ziel ${zahl(f.zielgewichtKg, 2)} kg, ${zahl(f.kcalProTag)} kcal`;
}

export function ersetzenFrage(vorhandene) {
  return `Für den ${datumText(vorhandene.datum)} gibt es schon eine Freigabe (${freigabeKurz(vorhandene)}). Soll die neue sie ersetzen?`;
}

// Rückfrage vor dem Löschen: sagt, welche Freigabe danach gilt (oder dass keine mehr gilt).
export function loeschFrage(freigaben, freigabe, name, heute) {
  const frage = `Freigabe vom ${datumText(freigabe.datum)} (${freigabeKurz(freigabe)}) löschen?`;
  if (aktuelleFreigabe(freigaben, heute) !== freigabe) return frage;
  const danach = aktuelleFreigabe(freigaben.filter((f) => f !== freigabe), heute);
  return danach
    ? `${frage} Danach gilt wieder die Freigabe vom ${datumText(danach.datum)} (${freigabeKurz(danach)}).`
    : `${frage} Danach hat ${name} keine Freigabe mehr: Kilossos zeichnet nur noch auf und zeigt kein Ziel und keine Tagesmenge.`;
}

// Entscheidet beim Speichern, was passiert, ohne etwas zu ändern oder zu fragen (nach dem Review rein und testbar).
// freigaben: alle (die Funktion filtert selbst nach tierId); alt: die bearbeitete Freigabe oder null (neu eintragen).
// gewichte: alle Wägungen (gefiltert wird hier nach tierId), nur für die Zielfrage; ohne sie keine Prüfung.
// Ergebnis: { fehler } oder { ueberschrieben, datumFrage, zielFrage, frage, ersetzen }:
//   ueberschrieben – die Freigabe, die die neuen Werte bekommt (beim Ändern sie selbst, beim Neu-Eintragen die
//                    vorhandene am selben Tag), sonst null (neue Freigabe anlegen);
//   datumFrage     – Rückfrage „Stimmt das Datum?“ beim Korrigieren mit altem Datum (datumsFrage) oder null;
//   zielFrage      – Rückfrage „Stimmt das Ziel?“ bei unplausiblem Zielgewicht (zielFrage) oder null;
//   frage          – Rückfrage „welche Freigabe gilt“ oder null; ersetzen – vorher „Soll die neue sie ersetzen?“ fragen.
// app.js fragt in dieser Reihenfolge: datumFrage, zielFrage, 60-%-Rückfrage, frage, ersetzen.
export function speicherPlan({ freigaben, tierId, alt, datum, zielgewichtKg, kcalProTag, heute, gewichte = [] }) {
  const eigene = freigaben.filter((f) => f.tierId === tierId);
  const andere = freigabenAmTag(eigene, datum, alt?.id ?? null);
  // Zwei Freigaben am selben Tag gibt es nur aus alten Daten; dann erst eine löschen (sonst gälte still die andere).
  if (alt ? andere.length >= 1 : andere.length >= 2) {
    return { fehler: alt && datum !== alt.datum ? TEXT_ANDERE_AM_TAG : TEXT_ZWEI_AM_TAG };
  }
  const ueberschrieben = alt ?? andere[0] ?? null;
  const id = ueberschrieben?.id ?? "vorlaeufig-neu"; // nur zum Vergleichen in geltungsFrage (echte ids sind UUIDs)
  const nachher = ueberschrieben
    ? eigene.map((f) => (f === ueberschrieben ? { ...f, datum, zielgewichtKg, kcalProTag } : f))
    : [...eigene, { id, datum, zielgewichtKg, kcalProTag }];
  return {
    ueberschrieben,
    datumFrage: datumsFrage({ alt, datum, zielgewichtKg, kcalProTag, heute }),
    zielFrage: zielFrage({ alt, datum, zielgewichtKg, gewichte: gewichte.filter((g) => g.tierId === tierId) }),
    frage: geltungsFrage({ vorher: eigene, nachher, id, neu: !alt, heute }),
    ersetzen: !alt && ueberschrieben !== null,
  };
}

// Rückfrage beim Korrigieren (seit 0.36.5, Review B-F2): Ziel oder kcal geändert, das alte Datum vor heute aber stehen
// gelassen. Dann gälten die neuen Werte rückwirkend ab diesem Tag, etwa eine echte Freigabe über einer Test-Freigabe.
// Keine Frage beim Neu-Eintragen, bei geändertem Datum (das prüft geltungsFrage) und bei einer Freigabe von heute.
export function datumsFrage({ alt, datum, zielgewichtKg, kcalProTag, heute }) {
  if (!alt || datum !== alt.datum || datum >= heute) return null;
  if (zielgewichtKg === alt.zielgewichtKg && kcalProTag === alt.kcalProTag) return null;
  return (
    `Du hast Ziel oder Tagesmenge geändert, das Datum ist aber noch der ${datumText(datum)}. ` +
    `Die neuen Werte (${freigabeKurz({ zielgewichtKg, kcalProTag })}) gelten dann rückwirkend ab diesem Tag, ` +
    "auch in der Übersicht für die Praxis. Stimmt das Datum?"
  );
}

// Vergleichsgewicht für die Zielfrage: die letzte Wägung bis zum Datum der Freigabe (bei gleichem Datum die zuletzt
// eingetragene), sonst die erste danach, ohne Wägung null.
function vergleichsGewicht(gewichte, datum) {
  let bis = null;
  let danach = null;
  for (const g of gewichte) {
    if (g.datum <= datum) {
      if (!bis || g.datum >= bis.datum) bis = g;
    } else if (!danach || g.datum < danach.datum) {
      danach = g;
    }
  }
  return bis ?? danach;
}

// Rückfrage bei unplausiblem Zielgewicht (seit 0.36.6, Review B-F3), etwa ein Zahlendreher „2,7“ statt „7,2“:
// Ziel nicht unter dem Vergleichsgewicht oder darunter als „Gewicht ÷ 1,4“ (GRENZEN.teilerOhneFreigabe: selbst bei
// BCS 9 etwa 40 % Übergewicht). Nur eine Frage, keine Sperre: sehr dicke Katzen können darüber liegen.
// Beim Korrigieren nur, wenn sich das Ziel geändert hat; ohne Wägung keine Prüfung.
export function zielFrage({ alt, datum, zielgewichtKg, gewichte }) {
  if (alt && zielgewichtKg === alt.zielgewichtKg) return null;
  const g = vergleichsGewicht(gewichte, datum);
  if (!g) return null;
  const vergleich = `dem letzten Gewicht (${zahl(g.kg, 2)} kg am ${datumText(g.datum)})`;
  const pruefen = "Bitte prüf, ob sich ein Zahlendreher eingeschlichen hat. Stimmt das Ziel?";
  if (zielgewichtKg >= g.kg) {
    return `Das Ziel ${zahl(zielgewichtKg, 2)} kg liegt nicht unter ${vergleich}. ${pruefen}`;
  }
  if (zielgewichtKg < g.kg / GRENZEN.teilerOhneFreigabe) {
    const prozent = Math.round(((g.kg - zielgewichtKg) / g.kg) * 100);
    return (
      `Das Ziel ${zahl(zielgewichtKg, 2)} kg liegt ${prozent} % unter ${vergleich}. ` +
      `Das ist ungewöhnlich viel. ${pruefen}`
    );
  }
  return null;
}

// Rückfrage, wenn sich durch das Datum ändert, welche Freigabe heute gilt; sonst null.
// vorher/nachher: Listen vor und nach dem Speichern, in nachher steht die gespeicherte Freigabe mit "id".
export function geltungsFrage({ vorher, nachher, id, neu, heute }) {
  const davor = aktuelleFreigabe(vorher, heute);
  const danach = aktuelleFreigabe(nachher, heute);
  if (!danach) return null;
  if (neu) {
    return danach.id === id
      ? null
      : `Die Freigabe vom ${datumText(danach.datum)} ist neuer und gilt weiter. Diese wird als frühere Freigabe gespeichert. Stimmt das Datum?`;
  }
  const galt = davor?.id === id;
  const gilt = danach.id === id;
  if (galt && !gilt) {
    return `Mit diesem Datum gilt nicht mehr diese Freigabe, sondern wieder die vom ${datumText(danach.datum)} (${freigabeKurz(danach)}). Stimmt das Datum?`;
  }
  if (!galt && gilt && davor) {
    return `Mit diesem Datum gilt diese Freigabe ab sofort statt der vom ${datumText(davor.datum)} (${freigabeKurz(davor)}). Stimmt das Datum?`;
  }
  return null;
}
