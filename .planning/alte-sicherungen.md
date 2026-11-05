# Alte Sicherungen aller Versionen einlesen (Punkt 4 der Abarbeitungsliste, 04.11.2026)

Ziel: Eine Sicherungsdatei aus jeder früheren Version (0.2 bis 0.28) lässt sich in die aktuelle App einlesen,
ohne dass etwas verloren geht, und die App zeigt sie fehlerfrei an.

## Format-Stände (aus `git log -p -- js/daten.js` und den Speicher-Stellen in `app.js`)
Das Datenformat ist seit 0.2 durchgehend Version 1. Neue Felder kamen immer nur optional dazu:

| Stand | Commit | Was neu ist |
|---|---|---|
| 0.2 | eda70b8 | Grundform; Startsorten Sheba 77 (packung), Purina 360 (ungefaehr) |
| 0.3 | e253f1f | Purina 346 (geschaetzt) |
| 0.4 | b3a2310 / a950ef7 | Purina 327,5 (hersteller); Freigaben über die Oberfläche |
| 0.5 | e85b797 | Sheba 71 (hersteller, zooplus) |
| 0.6 | 48ccb2a | `futter.listeId`, Kopien aus der Futterliste |
| 0.7 | abf3cfd | `tiere.foto` |
| 0.8 | 96c2e9a | Profil: geburtsdatum, koerperbau, haltung, schlankKg, tierarzt, wiegetag |
| 0.9 | – | mehrere Tiere |
| 0.12 | 3e32910 | `freigaben.bcs`, `freigaben.mcs` (0.12b: Sheba-Kopie aus der alten Futterliste mit 71) |
| 0.19 | 6134571 | Sheba 77 (geschaetzt), Umstellung 71 → 77 |
| 0.22 | f0c0ab6 | `futter.ean` (eigene Sorten) |
| 0.25/0.26 | b860cc2 / d6e7750 | `gewichte.foto` |
| 0.27 | da7675e | Einrichtung: kein Startfutter, `geschlecht` darf fehlen |
| 0.32 | d145940 | `futter.analyse` (Rechner „Eigene Sorte“); keine eigene Datei, steckt in `kilossos-0.33.json` |
| 0.33 | – | Liste `besondereTage` (fehlt sie, gilt sie als leer; `istGueltig` verlangt sie nicht) |

## Umsetzung
- Prüfkette beim Einlesen aus `app.js` in eine reine Funktion `sicherungPruefen` (`js/sicherung.js`) verschieben,
  damit Node sie testen kann. Verhalten bleibt gleich.
- Je Stand eine eingefrorene Beispiel-Sicherung in `tests/sicherungen/` (ohne persönliche Angaben).
- Test `tests/alte-sicherungen.test.js`: jede Datei läuft durch `sicherungPruefen` und `laden`, nichts wird verworfen,
  alle Einträge bleiben, veraltete Startwerte werden wie vorgesehen umgestellt, zweites Laden ändert nichts mehr.
- Browser: jede Datei über „Sicherung einlesen“ einlesen, alle Ansichten und den Bericht öffnen, keine Konsolenfehler.
