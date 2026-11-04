# Vorher/Nachher-Foto am Gewichtseintrag – Umsetzungsplan (Version 0.25.0)

> **Für ausführende Agenten:** Pflicht-Skill: superpowers:executing-plans. Schritte mit Checkbox (`- [ ]`).

**Ziel:** Beim Eintragen eines Gewichts kann freiwillig ein Foto dazukommen. Der Verlauf zeigt das erste und das neueste Foto nebeneinander (Vorher/Nachher). Wo noch kein Foto da ist, steht eine gezeichnete Katzenkopf-Linie als Platzhalter.

**Aufbau:** Das Foto hängt als optionales Feld `foto` an der Wägung (`gewichte[i].foto`), im gleichen Format und mit der gleichen Prüfung wie das Profilbild (`fotoGueltig`, 256 × 256 px JPEG über `fotoZuschneiden`). Die Regeln „ein Foto pro Woche“ und „welches ist vorher, welches nachher“ stehen als reine, getestete Funktionen in der neuen Datei `js/fotos.js`.

**Vorgabe:** `.planning/konkurrenz-umsetzung.md`, A5 („optional, 1 Foto je Wägung, klein gerechnet; max. 1 Foto pro Woche, 256 px“), Stefan am 04.11.2026: „für die Fotos nehmen wir einfach Platzhalter … irgendein Katzenkopf, Comiczeichnung“.

## Feste Regeln
- Das Foto ist freiwillig. Ohne Foto funktioniert alles wie bisher.
- Datenformat bleibt **Version 1**: `foto` ist ein neues optionales Feld wie `bcs`/`mcs` in 0.12.0. Alte Sicherungen bleiben ohne Umwandlung gültig.
- Fotos verlassen das Gerät nie (nur in der Sicherungsdatei, die der Nutzer selbst speichert).
- Höchstens **ein Foto je Tier und Kalenderwoche (Montag bis Sonntag)**. Gibt es in der Woche schon eins, fragt die App, ob das neue es ersetzen soll. Bei „Abbrechen“ wird das Gewicht ohne Foto gespeichert.
- Passt das Foto nicht mehr in den Speicher: Gewicht wird nicht gespeichert, Fehlermeldung im Dialog, alle übrigen Daten bleiben unverändert.
- Eine eingelesene Sicherung mit ungültigem Wägungsfoto: Foto wird verworfen, die Wägung bleibt (wie beim Profilbild).
- Platzhalter: Linienzeichnung eines Katzenkopfs im Wiegeprotokoll-Stil (Strich in `currentColor`, kein Emoji), mit Text „Noch kein Foto“.
- Tippflächen ≥ 48 px, Hell und Dunkel, Version 0.25.0, Cache `kilossos-v41`, `js/fotos.js` in `DATEIEN`.
- Nicht in diesem Schritt: Foto im PDF-Bericht, Foto an einer schon gespeicherten Wägung nachträglich ändern.

## Review-Schwerpunkte
1. Speicher voll beim Speichern mit Foto: kein halber Eintrag, verständliche Meldung.
2. Zwei Tiere: Vorher/Nachher und Wochenregel nur für das aktive Tier.
3. Wägung mit Foto löschen: Vorher/Nachher springt auf das nächste vorhandene Foto.
4. Nur ein Foto: Vorher zeigt es, Nachher den Platzhalter.
5. Dialog zweimal öffnen: Vorschau vom letzten Mal ist weg.

---

### Aufgabe 1: Regeln mit Tests (`js/fotos.js`, `tests/fotos.test.js`)
- `export function wochenStart(datum: "JJJJ-MM-TT"): "JJJJ-MM-TT"` → Montag derselben Woche (`"2026-11-08"` Sonntag → `"2026-11-02"`).
- `export function fotoInWoche(gewichte, tierId, datum): Wägung | null` → Wägung desselben Tiers mit gültigem `foto` in derselben Kalenderwoche.
- `export function vorherNachher(gewichte, tierId): { vorher: Wägung | null, nachher: Wägung | null }` → älteste und neueste Wägung mit gültigem Foto (nach `datum`); bei nur einem Foto `nachher: null`.
- Tests: Sonntag/Montag-Grenze; anderes Tier zählt nicht; ungültiges Foto zählt nicht; 0, 1 und 3 Fotos bei `vorherNachher`.

### Aufgabe 2: Prüfung beim Einlesen (`js/daten.js`)
- `fotoBereinigen` verwirft auch ungültige `gewichte[i].foto` und zählt sie mit. Kopfkommentar um `foto?` bei `gewichte` ergänzen.
- Test in `tests/daten.test.js`: ungültiges Wägungsfoto weg, Wägung bleibt; gültiges bleibt.
- Meldung beim Einlesen in `app.js` von „Das Profilbild …“ auf „Ein Foto in der Datei …“ verallgemeinern.

### Aufgabe 3: Gewicht-Dialog (`index.html`, `app.js`, `styles.css`)
- Unter „Notiz“: Feld „Foto (freiwillig)“ mit Knopf „Foto hinzufügen“ (Kamera-Icon), Vorschau 72 px, Knopf „Entfernen“, verstecktes `input type=file accept="image/*"` (Klasse `nur-vorlesen`), Tipp „Ein Foto pro Woche reicht. Es bleibt auf diesem Handy.“
- `oeffneGewicht()` setzt Vorschau und Merker zurück. Speichern: Wochenregel mit `fotoInWoche`, dann `try { sichern() } catch { … }` mit Rücknahme.

### Aufgabe 4: Anzeige (`app.js`, `js/symbole.js`, `styles.css`)
- `SYMBOL.katzenkopf` (Linienzeichnung).
- Gewicht-Ansicht: Wägungen mit Foto zeigen ein kleines Vorschaubild (40 px, runde Ecken) vor dem Gewicht.
- Verlauf: Karte „Vorher / Nachher“ oben unter den Eckdaten (zwei Bilder nebeneinander, darunter Datum und kg, bei zwei Fotos die Differenz in kg). Platzhalter, wo ein Foto fehlt. Gefüllt aus `vorherNachher`.

### Aufgabe 5: Prüfen
- `npm test` grün.
- Browser `/?demo` bei 375 px, Hell und Dunkel: ohne Foto (zwei Platzhalter), ein Foto, zwei Fotos (Testbilder per Canvas erzeugt), Wochenregel-Rückfrage, Löschen einer Wägung mit Foto, 150 % Schrift, keine Konsolenfehler.
- Code-Review durch frischen Reviewer, Befunde einarbeiten, Screenshots für Stefan. **Commit und Push erst nach Stefans Ja.**
