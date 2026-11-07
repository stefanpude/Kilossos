// 0.78.1 (07.11., Vorbereitung Web-Vortest im Bekanntenkreis): Die Datenschutzerklärung nennt alles, was die App auf
// dem Gerät speichert, auch Monatsfotos, Befunde aus der Freigabe und besondere Tage. Das Tester-Blatt für den
// Web-Vortest gibt es als eigene Datei, ohne Play-Store-Schritte und ohne Kontaktdaten (Repo ist öffentlich).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const lies = (datei) => readFileSync(new URL("../" + datei, import.meta.url), "utf8");

test("0.78.1: Datenschutz Abschnitt 2 nennt Monatsfotos, Befunde und besondere Tage", () => {
  const ds = lies("datenschutz.html");
  const teil = ds.slice(ds.indexOf("<h3>2. Was auf deinem Gerät gespeichert wird</h3>"), ds.indexOf("<h3>3."));
  assert.match(teil, /Gewichte mit Monatsfoto, wenn du eins aufnimmst/);
  assert.match(teil, /Freigaben vom Tierarzt mit Befunden \(BCS, Muskelzustand\)/);
  assert.match(teil, /besondere Tage \(zum Beispiel krank oder Futter verweigert\) mit Notiz/);
  assert.match(ds, /Stand: 7\. November 2026/);
});

test("0.78.1: Tester-Blatt für den Web-Vortest: Link, Startbildschirm, iPhone-Hinweis, Sicherung, keine Kontaktdaten", () => {
  const blatt = lies("docs/tester-hinweise-web.md");
  assert.ok(blatt.includes("https://stefanpude.github.io/Kilossos/"));
  assert.ok(blatt.includes("https://stefanpude.github.io/Kilossos/?demo"));
  assert.match(blatt, /Zum Startbildschirm hinzufügen/);
  assert.match(blatt, /Zum Home-Bildschirm/);
  assert.match(blatt, /Keine ausgedachte „Freigabe vom Tierarzt“/);
  assert.match(blatt, /Frisst deine Katze einen Tag lang nichts oder kaum etwas, gehört sie sofort zum Tierarzt\./);
  assert.match(blatt, /Sicherung speichern/);
  assert.match(blatt, /neue Adresse/);
  // Kein Play-Store-Ablauf und keine Kontaktdaten im öffentlichen Repo.
  assert.doesNotMatch(blatt, /Play Store|Teilnahme-Link|14 Tage installiert/);
  assert.doesNotMatch(blatt, /@|\+49|\b0\d{3,}/);
  // Knopfnamen, die das Blatt nennt, gibt es in der App.
  const html = lies("index.html");
  for (const knopf of ["Sicherung speichern", "Sicherung einlesen", "So nutzt du Kilossos", "Etwas übrig gelassen?", "Mahlzeit eintragen", "Gewicht eintragen"]) {
    assert.ok(html.includes(knopf), `Knopf fehlt in der App: ${knopf}`);
  }
});
