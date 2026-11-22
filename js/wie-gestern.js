// „Wie gestern“ auf „Heute“ (seit 0.94.0, Ideen-Tafel „mahlzeiten-wie-gestern“, Entwurf
// docs/superpowers/specs/2026-11-20-wie-gestern-design.md). Wer jeden Tag ähnlich füttert, übernimmt die Mahlzeiten des
// letzten Tags mit Einträgen einzeln: Antippen öffnet das Fenster „Mahlzeit“ vorbelegt. Bewusst nie ein ganzer Tag auf
// einmal, sonst sähe ein Tag vollständig aus, an dem die Katze weniger gefressen hat, und die Warnung „zu wenig“ fehlte.
// Nicht in der Vorlage: Leckerlis (sollen keine Gewohnheit werden), gelöschte Sorten, Tage mit „Futter verweigert“.
import { tagSchluessel } from "./rechnen.js";
import { eintraegeAm, artVon } from "./besondere-tage.js";

const hhmm = (zeit) => `${String(zeit.getHours()).padStart(2, "0")}:${String(zeit.getMinutes()).padStart(2, "0")}`;

// tag: gezeigter Tag "JJJJ-MM-TT"; ausgeblendet: Ids der Vorlage-Mahlzeiten, die für diesen Tag weggeixt wurden.
// → { vorlageTag: "JJJJ-MM-TT" | null, offen: [{ futterId, gramm, uhrzeit, quelle }], versteckt: [gleiche Form] }
// (quelle = Id der Vorlage-Mahlzeit; versteckt = ausgeblendete Zeilen fürs Aufklappmenü „Ausgeblendet“, seit 0.95.1)
// Je Mahlzeit am gezeigten Tag fällt genau eine Zeile derselben Sorte weg, auch wenn sie von Hand kam (seit 0.94.1 auch
// bei anderer Menge): zuerst eine mit genau dieser Menge, sonst die früheste dieser Sorte.
export function wieGestern({ mahlzeiten, futterNachId, besondereTage, tierId, tag, ausgeblendet = new Set() }) {
  const eigene = mahlzeiten.filter((m) => m.tierId === tierId);
  const nachTag = new Map();
  for (const m of eigene) {
    const f = futterNachId.get(m.futterId);
    if (!f || f.typ === "leckerli") continue;
    const schluessel = tagSchluessel(new Date(m.zeitpunkt));
    if (schluessel >= tag) continue;
    if (!nachTag.has(schluessel)) nachTag.set(schluessel, []);
    nachTag.get(schluessel).push(m);
  }
  const verweigert = (t) => eintraegeAm(besondereTage, tierId, t).some((e) => artVon(e.art).notfall === true);
  const vorlageTag = [...nachTag.keys()].sort().reverse().find((t) => !verweigert(t)) ?? null;
  if (!vorlageTag) return { vorlageTag: null, offen: [], versteckt: [] };

  const offen = nachTag
    .get(vorlageTag)
    .slice()
    .sort((a, b) => a.zeitpunkt.localeCompare(b.zeitpunkt))
    .map((m) => ({ futterId: m.futterId, gramm: m.gramm, uhrzeit: hhmm(new Date(m.zeitpunkt)), quelle: m.id }));
  for (const m of eigene) {
    if (tagSchluessel(new Date(m.zeitpunkt)) !== tag) continue;
    let i = offen.findIndex((z) => z.futterId === m.futterId && z.gramm === m.gramm);
    if (i < 0) i = offen.findIndex((z) => z.futterId === m.futterId);
    if (i >= 0) offen.splice(i, 1);
  }
  return {
    vorlageTag,
    offen: offen.filter((z) => !ausgeblendet.has(z.quelle)),
    versteckt: offen.filter((z) => ausgeblendet.has(z.quelle)),
  };
}

// Ausgeblendete Zeilen (0.94.1): nur auf diesem Gerät unter eigenem Schlüssel, nicht in den Daten und nicht in der
// Sicherung. Gilt nur für den Tag, an dem ausgeblendet wurde; ein neuer Tag fängt leer an und räumt den alten weg.
// Format: { tag: "JJJJ-MM-TT", tiere: { [tierId]: [Mahlzeit-Ids der Vorlage] } }
export const AUS_SCHLUESSEL = "kilossos-wie-gestern-aus";

function lesen(roh) {
  try {
    const d = JSON.parse(roh);
    return d && typeof d.tag === "string" && d.tiere && typeof d.tiere === "object" ? d : null;
  } catch {
    return null;
  }
}

export function ausgeblendet(roh, tierId, tag) {
  const d = lesen(roh);
  const ids = d && d.tag === tag ? d.tiere[tierId] : null;
  return new Set(Array.isArray(ids) ? ids : []);
}

export function blendeAus(roh, tierId, tag, ids) {
  const alt = lesen(roh);
  const d = alt && alt.tag === tag ? alt : { tag, tiere: {} };
  d.tiere[tierId] = [...ausgeblendet(JSON.stringify(d), tierId, tag), ...ids];
  return JSON.stringify(d);
}

// Holt Zeilen zurück (0.95.1). Gilt der Schlüssel für einen anderen Tag, ist ohnehin nichts ausgeblendet.
export function blendeEin(roh, tierId, tag, ids) {
  const d = lesen(roh);
  if (!d || d.tag !== tag) return JSON.stringify({ tag, tiere: {} });
  const weg = new Set(ids);
  d.tiere[tierId] = [...ausgeblendet(roh, tierId, tag)].filter((id) => !weg.has(id));
  return JSON.stringify(d);
}
