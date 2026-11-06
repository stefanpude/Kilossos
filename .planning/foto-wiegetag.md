# Fotos: Monatsfoto am Wiegetag, Foto ansehen/tauschen, Speicheranzeige, Fotos im Bericht (Version 0.26.0)

Ausgangslage 0.25.0: Foto-Feld im Gewicht-Dialog immer sichtbar, höchstens 1 Foto je Tier und Kalenderwoche.

## Monatsfoto
- **Foto-Tag** = letzter Wiegetag im Monat (Datum im Dialog). Nur dann ist das Foto-Feld offen, freiwillig.
- **Zeitraum** = vom Foto-Tag bis zum Tag vor dem nächsten Foto-Tag. Verpasst: an anderen Tagen nur ein ruhiger Link
  „Monatsfoto nachholen“, solange der Zeitraum noch kein Foto hat; das Foto zählt dann zum alten Zeitraum.
- **Ohne Wiegetag:** Kalendermonat, nur Link, dazu Tipp „Wiegetag unter Mehr festlegen“.
- Rückfrage „Foto ersetzen?“ bleibt als Sicherung. Hinweis auf „Heute“ nennt das Foto nur am Foto-Tag.
- Warum monatlich: Von Woche zu Woche sieht man kaum Unterschiede; etwa 12 statt 52 Fotos pro Jahr und Tier.
- Bestehende Fotos bleiben. Datenformat bleibt Version 1.

## Foto ansehen, tauschen, entfernen
- Vorschaubild in der Wägungsliste ist ein Knopf (48 px) → Blatt mit großem Foto, „Anderes Foto“, „Foto entfernen“ (Wägung bleibt).
- Aktionsnamen `waegung-foto-*` (Achtung: `foto-entfernen` gehört dem Profilbild).

## Speicheranzeige
- `js/speicher.js`: Anteil an etwa 5 Mio. Zeichen, Anzeige nur in Prozent, Hinweis ab 70 % (knapp) und 90 % (voll).
- Demo-Reste (`kilossos-demo`) werden außerhalb der Demo beim Start gelöscht.

## Fotos im Bericht
- Haken „Fotos mitnehmen“ unter „Mehr“ → erstes und letztes Foto im Zeitraum mit Datum und kg.
  (Seit 0.45.0 heißt er „Fotos zeigen“ und steht oben in der Übersicht selbst, nicht mehr unter „Mehr“.)

## Geprüft
- `npm test`, Browser 375 px hell/dunkel, 150 % Schrift, Code-Reviews eingearbeitet.
