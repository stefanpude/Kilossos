// „Wie gestern“ auf „Heute“ (seit 0.94.0, Ideen-Tafel „mahlzeiten-wie-gestern“, Entwurf
// docs/superpowers/specs/2026-11-20-wie-gestern-design.md). Wer jeden Tag ähnlich füttert, übernimmt die Mahlzeiten des
// letzten Tags mit Einträgen einzeln: Antippen öffnet das Fenster „Mahlzeit“ vorbelegt. Bewusst nie ein ganzer Tag auf
// einmal, sonst sähe ein Tag vollständig aus, an dem die Katze weniger gefressen hat, und die Warnung „zu wenig“ fehlte.
// Nicht in der Vorlage: Leckerlis (sollen keine Gewohnheit werden), gelöschte Sorten, Tage mit „Futter verweigert“.
import { tagSchluessel } from "./rechnen.js";
import { eintraegeAm, artVon } from "./besondere-tage.js";

const hhmm = (zeit) => `${String(zeit.getHours()).padStart(2, "0")}:${String(zeit.getMinutes()).padStart(2, "0")}`;

// tag: gezeigter Tag "JJJJ-MM-TT". → { vorlageTag: "JJJJ-MM-TT" | null, offen: [{ futterId, gramm, uhrzeit }] }
// Je Mahlzeit am gezeigten Tag mit gleicher Sorte und Menge fällt genau eine Zeile weg, auch wenn sie von Hand kam.
export function wieGestern({ mahlzeiten, futterNachId, besondereTage, tierId, tag }) {
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
  if (!vorlageTag) return { vorlageTag: null, offen: [] };

  const offen = nachTag
    .get(vorlageTag)
    .slice()
    .sort((a, b) => a.zeitpunkt.localeCompare(b.zeitpunkt))
    .map((m) => ({ futterId: m.futterId, gramm: m.gramm, uhrzeit: hhmm(new Date(m.zeitpunkt)) }));
  for (const m of eigene) {
    if (tagSchluessel(new Date(m.zeitpunkt)) !== tag) continue;
    const i = offen.findIndex((z) => z.futterId === m.futterId && z.gramm === m.gramm);
    if (i >= 0) offen.splice(i, 1);
  }
  return { vorlageTag, offen };
}
