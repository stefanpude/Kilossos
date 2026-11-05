// Mehrere Tiere: welches Tier gerade angezeigt wird, neue Tiere anlegen, Tiere entfernen.
// Das aktive Tier liegt in einem eigenen Schlüssel, nicht in den Daten: Es ist eine Einstellung dieses Geräts
// und gehört nicht in die Sicherungsdatei. Die Demo hat einen eigenen Schlüssel, damit sie die Wahl nicht überschreibt.

const SCHLUESSEL = "kilossos-aktives-tier";
const DEMO_SCHLUESSEL = "kilossos-demo-aktives-tier";

// Fehlt die gemerkte Kennung oder gehört sie zu keinem Tier mehr: das erste Tier.
export function aktivesTier(daten, gemerkteId) {
  return daten.tiere.find((t) => t.id === gemerkteId) ?? daten.tiere[0];
}

export function leseAktivesTier(demo, speicher = localStorage) {
  try {
    return speicher.getItem(demo ? DEMO_SCHLUESSEL : SCHLUESSEL);
  } catch {
    return null;
  }
}

// Speicher gesperrt: die Wahl gilt dann nur bis zum Schließen der App.
export function merkeAktivesTier(id, demo, speicher = localStorage) {
  try {
    speicher.setItem(demo ? DEMO_SCHLUESSEL : SCHLUESSEL, id);
  } catch {
    // nichts zu tun
  }
}

export function neuesTier(id, name) {
  return { id, name, art: "katze" };
}

// Listen mit Einträgen je Tier. besondereTage gibt es erst seit 0.33.0 und kann in älteren Daten fehlen.
const LISTEN = ["mahlzeiten", "gewichte", "freigaben", "besondereTage"];

export function eintraegeVon(daten, tierId) {
  const zaehle = (liste) => (Array.isArray(liste) ? liste.filter((e) => e.tierId === tierId).length : 0);
  return Object.fromEntries(LISTEN.map((feld) => [feld, zaehle(daten[feld])]));
}

// Entfernt das Tier samt Mahlzeiten, Gewichten, Freigaben und besonderen Tagen. Futtersorten sind gemeinsam und bleiben.
// Das letzte Tier bleibt immer stehen (die App braucht mindestens eins). Gibt zurück, ob etwas entfernt wurde.
export function tierEntfernen(daten, tierId) {
  if (daten.tiere.length <= 1 || !daten.tiere.some((t) => t.id === tierId)) return false;
  daten.tiere = daten.tiere.filter((t) => t.id !== tierId);
  for (const feld of LISTEN) {
    if (Array.isArray(daten[feld])) daten[feld] = daten[feld].filter((e) => e.tierId !== tierId);
  }
  return true;
}
