# Plan: Design „Wiegeprotokoll“ (Version 0.23.0)

Stand 04.11.2026. Vorlage: freigegebener HTML-Prototyp „Wiegeprotokoll“ (sachlich, Tierarzt-Gewichtskarte, Millimeterpapier).
Nur Look und Darstellung ändern. Keine Funktion, Warnung, Sicherheitsregel oder Freigabe-Texte entfernen oder abschwächen.

## Schritte
1. **Schriften lokal:** `fonts/literata.woff2` (variabel, opsz + wght, Latin) und `fonts/atkinson-hyperlegible-next.woff2`
   (variabel, wght, Latin), Lizenzen `fonts/OFL-*.txt`. Keine Verbindung zu Google Fonts. Im Service Worker cachen.
2. **Design-Tokens** in `styles.css`: Papier `#f3f5f2`, Blatt `#fbfcfa`, Tinte `#1d2b2a`, Tinte leise `#5b6b68`,
   Raster `#dbe3dd`/`#c3cfc6`, Salbei `#c9ddcf`, Tanne `#2f6b5e` (Aktionen), Bernstein `#a65a12` (Warnungen).
   Radien 6 px (Knöpfe, Felder) und 12 px (Blätter). Rahmen statt Schatten. Rot bleibt für Sofort-Warnungen
   (Fettleber), damit nichts abgeschwächt wird. Dunkel-Modus mit gleichen Rollen, Kontraste per Skript geprüft (WCAG AA).
   Die alten Variablennamen bleiben (`--akzent`, `--flaeche` …), nur die Werte ändern sich: weniger Umbau, gleiche Logik.
3. **Linien-Icons statt Emoji:** neue Datei `js/symbole.js` (Inline-SVG, `stroke: currentColor`). Tab-Leiste,
   Futterarten, Tierarzt, Telefon, Kamera, Löschen, Pfeile. Avatar ohne Foto: Initiale auf Salbei.
4. **Heute:** Kalorien-Lineal statt Ring („173 von 220 kcal“, „Noch X kcal bis zur Tagesmenge vom Tierarzt“).
   Ohne Freigabe kein Lineal und kein Ziel (wie bisher beim Ring). Mahlzeiten als Protokoll (Uhrzeit, Futter, Gramm, kcal),
   Knopf in der Karte. Gewichtsblatt mit Mini-Kurve der letzten 8 Wochen, Änderung zur letzten Messung und Tempo.
   Leckerli-Zeile bleibt. Notfall-Hinweis immer sichtbar mit Bernstein-Linie.
5. **Gewicht eintragen:** Blatt von unten, große Zahl als Eingabefeld, ±10-g-Knöpfe (starten bei leerem Feld vom letzten
   Gewicht, das Feld wird nicht vorausgefüllt, damit nie ungewogen gespeichert wird). Sofortige Rückmeldung:
   kg seit letzter Messung, % pro Woche, Bewertung nach den bestehenden Grenzen (`tempoRueckmeldung` in
   `js/zusammenfassung.js`, gleiche Regeln wie `wochenRaten`: über 2 % immer markiert, „sicher“/„langsamer“ nur nach
   einer Freigabe; der Hinweis sagt, dass erst das Mittel über zwei Wochen warnt).
6. **Verlauf:** Eckdaten Start/Jetzt/Bis zum Ziel (ohne Freigabe: Abgenommen), Zeitraum-Umschalter, Diagramm auf
   Millimeterpapier mit gerader Linie, Ziellinie gestrichelt, Freigaben als senkrechte Marken, sicherer Bereich bleibt.
   Tempo-pro-Woche-Balken im Band 0,5 bis 2 % (Balkenliste weiter aufklappbar), Futter- und Befund-Karten im neuen Stil.
7. **Alle übrigen Ansichten** (Futter, Mehr, Bericht, Willkommen, Rechtsseiten, Dialoge, Menüs, Toast) laufen über die
   Tokens. PDF-Bericht bleibt hell, Diagrammfarben Tanne/Bernstein.
8. **Tests** für `tempoRueckmeldung`, bestehende Tests bleiben grün. Version 0.23.0, Cache v38.
9. **Prüfen** mit `?demo` in Hell und Dunkel, alle Ansichten per Screenshot.

## Risiken
- Bei sehr großer Handy-Schrift wird das Lineal enger; Werte stehen darum zusätzlich als Text daneben.
- Literata ist eine Serifenschrift; sie steht nur bei Zahlen und Überschriften, Fließtext bleibt Atkinson.
- Schriften kosten etwa 120 KB beim ersten Laden, danach aus dem Cache.
