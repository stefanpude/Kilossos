// Profil eines Tiers und tierbezogene Einstellungen (alles optional außer Name):
//   geburtsdatum "JJJJ-MM-TT", koerperbau (Freitext), haltung "wohnung" | "freigang" | "beides",
//   schlankKg (Gewicht aus der schlanken Zeit, nur als Information für den Tierarzt),
//   tierarzt { praxis?, telefon?, adresse? }, wiegetag 0–6 (0 = Sonntag, wie Date.getDay()).
//   adresse seit 0.49.0 (freiwillig, Datenformat bleibt Version 1). Eine ältere App-Version entfernt sie still
//   beim Einlesen einer Sicherung und beim Speichern des Profils (harmlos, nur eine Komfort-Angabe).
// Zielgewicht und Tagesmenge gehören NICHT hierher: die legt nur die Tierarztpraxis fest (Freigabe).

export const WOCHENTAGE = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];
export const HALTUNG = { wohnung: "Wohnungskatze", freigang: "Freigänger", beides: "Wohnung und Freigang" };
export const TEXT_MAX = 80;
export const NAME_MAX = 40;

const TIERARZT_FELDER = ["praxis", "telefon", "adresse"];

// Telefon: nur Ziffern, Leerzeichen, + ( ) / - – so kann über den Anruf-Link kein Code in die Seite gelangen.
const TELEFON_MUSTER = /^[0-9+ ()/-]{3,25}$/;

function datumGueltig(iso, heute) {
  if (typeof iso !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return false;
  const [j, m, t] = iso.split("-").map(Number);
  const d = new Date(Date.UTC(j, m - 1, t));
  const echt = d.getUTCFullYear() === j && d.getUTCMonth() === m - 1 && d.getUTCDate() === t;
  return echt && j >= 1990 && iso <= heute;
}

const textGueltig = (wert, max = TEXT_MAX) => typeof wert === "string" && wert.trim().length > 0 && wert.length <= max;

export function telefonGueltig(telefon) {
  return typeof telefon === "string" && TELEFON_MUSTER.test(telefon);
}

// Prüft die Profilangaben aller Tiere (z. B. aus einer eingelesenen Sicherung). Ungültige Angaben werden
// einzeln entfernt, alle übrigen Daten bleiben. Name und kastriert werden repariert, weil die App sie braucht.
// Gibt die Zahl der entfernten oder reparierten Angaben zurück.
export function profilBereinigen(daten, heute) {
  let anzahl = 0;
  const weg = (objekt, feld) => {
    delete objekt[feld];
    anzahl += 1;
  };
  for (const tier of daten.tiere) {
    if (!textGueltig(tier.name, NAME_MAX)) {
      tier.name = "Tier";
      anzahl += 1;
    }
    if ("geschlecht" in tier && !["kater", "katze"].includes(tier.geschlecht)) weg(tier, "geschlecht");
    if (typeof tier.kastriert !== "boolean") {
      tier.kastriert = false;
      anzahl += 1;
    }
    if ("geburtsdatum" in tier && !datumGueltig(tier.geburtsdatum, heute)) weg(tier, "geburtsdatum");
    if ("koerperbau" in tier && !textGueltig(tier.koerperbau)) weg(tier, "koerperbau");
    if ("haltung" in tier && !(tier.haltung in HALTUNG)) weg(tier, "haltung");
    if ("schlankKg" in tier && !(typeof tier.schlankKg === "number" && tier.schlankKg >= 0.5 && tier.schlankKg <= 20)) {
      weg(tier, "schlankKg");
    }
    if ("wiegetag" in tier && !(Number.isInteger(tier.wiegetag) && tier.wiegetag >= 0 && tier.wiegetag <= 6)) {
      weg(tier, "wiegetag");
    }
    if ("tierarzt" in tier) {
      const ta = tier.tierarzt;
      if (ta === null || typeof ta !== "object" || Array.isArray(ta)) {
        weg(tier, "tierarzt");
      } else {
        for (const feld of Object.keys(ta)) {
          if (!TIERARZT_FELDER.includes(feld)) weg(ta, feld);
        }
        if ("praxis" in ta && !textGueltig(ta.praxis)) weg(ta, "praxis");
        if ("telefon" in ta && !telefonGueltig(ta.telefon)) weg(ta, "telefon");
        if ("adresse" in ta && !textGueltig(ta.adresse)) weg(ta, "adresse");
        if (Object.keys(ta).length === 0) delete tier.tierarzt;
      }
    }
  }
  return anzahl;
}

// Alter als Text, z. B. "7 Jahre, 6 Monate"; null ohne Geburtsdatum.
export function alterText(geburtsdatum, heute) {
  if (!geburtsdatum) return null;
  const [gj, gm, gt] = geburtsdatum.split("-").map(Number);
  const [hj, hm, ht] = heute.split("-").map(Number);
  let monate = (hj - gj) * 12 + (hm - gm) - (ht < gt ? 1 : 0);
  if (monate < 1) return "unter 1 Monat";
  const jahre = Math.floor(monate / 12);
  monate %= 12;
  const teile = [];
  if (jahre) teile.push(jahre === 1 ? "1 Jahr" : `${jahre} Jahre`);
  if (monate) teile.push(monate === 1 ? "1 Monat" : `${monate} Monate`);
  return teile.join(", ");
}

// Anruf-Link aus der Telefonnummer: nur Ziffern und ein führendes Plus.
export function telefonLink(telefon) {
  if (!telefonGueltig(telefon)) return null;
  const nummer = telefon.trim().replace(/(?!^\+)[^0-9]/g, "");
  return nummer.replace(/\D/g, "").length >= 3 ? `tel:${nummer}` : null;
}

// „Weg zur Praxis“ (0.49.0): Suche bei Google Maps in der dokumentierten Form („Maps URLs“), auf Android, iPhone
// und PC gleich. Ohne Adresse null. Ohne Praxisname wird nur die Adresse gesucht.
export function kartenLink(praxis, adresse) {
  if (typeof adresse !== "string" || !adresse.trim()) return null;
  const name = typeof praxis === "string" ? praxis.trim() : "";
  const suche = name ? `${name}, ${adresse.trim()}` : adresse.trim();
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(suche)}`;
}

// Vorschlag für ein neues Tier (0.49.0): Praxis, Telefon und Adresse des gerade gewählten Tiers als Kopie.
// Ohne Angaben null.
export function praxisVorschlag(tier) {
  const ta = tier?.tierarzt;
  if (!ta || typeof ta !== "object") return null;
  const vorschlag = {};
  for (const feld of TIERARZT_FELDER) {
    if (typeof ta[feld] === "string" && ta[feld].trim()) vorschlag[feld] = ta[feld];
  }
  return Object.keys(vorschlag).length ? vorschlag : null;
}

export function istWiegetag(tier, tag) {
  if (!Number.isInteger(tier.wiegetag)) return false;
  const [j, m, t] = tag.split("-").map(Number);
  return new Date(j, m - 1, t).getDay() === tier.wiegetag;
}
