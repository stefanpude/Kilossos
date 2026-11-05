# Gewicht ändern (Version 0.31.0)

Stand: 04.11.2026. Status: **gebaut** als 0.31.0 (von Stefan freigegeben mit „Ja, so bauen“).
Nach dem Review (frischer Agent, drei kleine Funde) ergänzt: Knopf füllt die ganze Zeilenhöhe (vorher wurde die Zeile
niedriger), Zielmonat klappt auf, Platzhalter/±10 g/Arm-Rücknahme beziehen sich auf die geänderte Wägung, Zurücksetzen
beim Schließen.

Anlass: Beim Ausprobieren auf eine gespeicherte Wägung getippt, es öffnete sich nichts. Bei Mahlzeiten (seit 0.11.0)
und eigenen Sorten heißt Antippen „ändern“, bei Wägungen fehlte das. Bisheriger Ausweg: löschen und neu eintragen;
ein Monatsfoto an der Wägung geht dabei verloren. Keine Wägung war falsch, es ist kein Notfall, aber Tester werden
genauso tippen.

## Verhalten

- In der Gewichtsliste (Bereich „Gewicht“, Monatskarten) wird der Teil mit Gewicht, Datum, Notiz und Marke (±g)
  ein eigener Knopf (`data-aktion="gewicht-bearbeiten"`). Das kleine Foto links (ansehen) und das Lösch-Kreuz rechts
  bleiben eigene Knöpfe daneben, nichts wird ineinander geschachtelt.
- Antippen öffnet das gewohnte Wiege-Fenster `dialog-gewicht` mit der Überschrift „Gewicht von <Name> ändern“.
  Gewicht (genau der gespeicherte Wert, mit Komma), Datum und Notiz sind ausgefüllt.
- „Speichern“ ändert die Wägung an Ort und Stelle: gleiche `id`, gleiches `tierId`, das Foto bleibt. Es entsteht
  keine zweite Wägung. „Abbrechen“ ändert nichts.
- Gleiche Prüfung wie beim Eintragen: 0,5 bis 20 kg mit demselben Fehlertext, Datum höchstens heute.
- Die Tempo-Rückmeldung im Fenster vergleicht mit der Wägung vor dem gewählten Datum, aber nie mit der Wägung, die
  gerade geändert wird (sonst vergliche sie mit sich selbst, sobald das Datum nach hinten rückt).
- Kurve, Verlauf, Warnungen, Monatskarten, Vorher/Nachher und PDF lesen ohnehin `daten.gewichte` und zeigen die
  Änderung danach von selbst.
- Rutscht die Wägung durch ein neues Datum in einen anderen Monat, klappt dieser Monat auf (`merkeZustand`): Man sieht,
  wohin sie gerutscht ist, und die Fokus-Rückgabe findet ihren Knopf (in einer zugeklappten Karte ginge der Fokus sonst
  verloren).
- Platzhalter, ±10 g bei leerem Feld und die Zahlen im Arm-Bereich beziehen sich beim Ändern auf die Wägung selbst,
  nicht auf die neueste. Wird ein Arm-Wert wieder gelöscht, steht das gespeicherte Gewicht wieder im Feld (beim
  Eintragen wie bisher ein leeres Feld).
- Sicherheitsnetz: Beim Schließen des Fensters wird `bearbeiteteWaegung` zurückgesetzt. Öffnet später jemand das
  Fenster ohne `oeffneGewicht()`, entsteht beim Speichern eine neue Wägung statt eine alte zu überschreiben.
- Zeile: Der Knopf füllt die ganze Zeilenhöhe (Rand und Polster je 7 px heben sich auf). Zeilenhöhe und Lage des Texts
  sind genau wie vorher (gemessen: 56,6 px bei 100 %, 76,9 px bei 150 % Schrift, vorher und nachher gleich).
- Speicher voll beim Ändern: wie bei „Mahlzeit ändern“ über `sichern()`: Die Änderung wird verworfen, der gespeicherte
  Stand neu geladen und ein Hinweis gezeigt; nichts halb gespeichert.
- Vorlesefunktion: Knopf liest Gewicht, Datum, Notiz, Marke und „, ändern“ (wie bei Mahlzeiten und Sorten).
  Nach dem Schließen springt der Fokus zurück auf den Knopf der Wägung (vorhandene Regel über `oeffner`).

## Entscheidungen (Claude, Stefan hat sie mit der Beschreibung gesehen)

- Kein Foto-Bereich im Ändern-Fenster. Foto ansehen, tauschen und entfernen weiter über das kleine Bild
  (`dialog-foto`). Ein Foto nachträglich an eine alte Wägung hängen geht wie bisher nicht (wäre eine eigene Idee).
  **Nachtrag 0.41.0 (Wunsch aus Stefans Test):** Hat die Wägung noch kein Foto, zeigt das Fenster den ruhigen Link
  „Foto nachtragen (freiwillig)“, an jedem Tag. Gleiche Regel wie beim Eintragen: höchstens ein Foto je Foto-Zeitraum,
  ein vorhandenes ersetzt das neue nur nach Rückfrage. Mit Foto bleibt es beim kleinen Bild in der Liste.
- Datum geändert: Das Foto wandert mit. Liegt danach ein zweites Foto im selben Foto-Zeitraum, bleibt es so.
  Der Bericht zeigt ohnehin nur das erste und das letzte Foto, Vorher/Nachher nimmt das älteste und das neueste.
- „Auf dem Arm gewogen?“ bleibt im Fenster nutzbar (zum Nachrechnen). Die Arm-Notiz wird nur vorgeschlagen, wenn
  die Notiz leer ist (wie bisher).
- Kein neues Datenformat (Version bleibt 1), alte Sicherungen bleiben unverändert gültig.
- Der Eintragen-Weg bleibt, wie er ist (Foto-Rückfrage, Speicher-voll-Rücknahme).

## Tests (zuerst rot, dann grün)

- `waegungAendern` (in `js/daten.js`, Tests in `tests/daten.test.js`): setzt Gewicht, Datum und Notiz der Wägung
  selbst (Notiz ohne Leerzeichen am Rand, fehlende Notiz wird leer); `id`, `tierId` und `foto` bleiben.
- `tempoRueckmeldung` mit `ohneId` (Test in `tests/zusammenfassung.test.js`): Rückt das Datum einer Wägung nach
  hinten, vergleicht die Rückmeldung mit der Wägung davor statt mit sich selbst; gibt es davor keine andere Wägung,
  gibt es keine Rückmeldung. Ohne `ohneId` rechnet sie wie bisher.
- Die Verdrahtung in `app.js` (Knopf, Klick-Verteiler, Fenster im Ändern-Modus) hat keinen Quelltext-Test; sie wird im
  Browser geprüft (siehe unten), wie die übrigen Fenster.

Browser-Prüfung (`preview_start` Name `kilossos`, Demo `/?demo`): Wägung antippen, Gewicht und Notiz ändern,
speichern (Liste, Kurve, keine zweite Wägung); Datum in einen anderen Monat; Abbrechen; Fehler bei 25 kg; Tempo-Kasten;
neue Wägung eintragen geht wie vorher; Tastatur (Tab, Enter, Fokus zurück); 375 px, hell, dunkel, 150 % Schrift;
keine Konsolenfehler.

## Version

0.31.0: `CACHE_NAME` in `sw.js` auf `kilossos-v57`, `#version` in `index.html`, Versionstest in
`tests/wissen.test.js`. Der kJ-Schutz mit kcal-Rechner (`.planning/kcal-rechner-kj.md`) wird damit 0.32.0 (v58).
