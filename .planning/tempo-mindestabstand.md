# Tempo erst ab 7 Tagen Abstand (geplant 06.11.2026, Stefan „Ja, so umbauen“)

**Gebaut als 0.75.0** (Texte A, B, C mit Stefans Ja „Texte passen“). Abstand unter der Skala als `gap` am
Behälter `.mess-tempo`, weil `.karte p { margin: 0 }` ein margin am Satz überschreibt.

## Anlass
Stefans Handy, 06.11.2026: Kito am 5.11. und 6.11. gewogen, +90 g. „Letzte Messung“ zeigt
„Zunahme 7,4 % pro Woche · im Blick behalten“. Ursache: `tempoRueckmeldung` (js/zusammenfassung.js) vergleicht
mit der direkt vorigen Wägung und rechnet auf 7 Tage hoch (90 g × 7 = 630 g = 7,4 %). Normale Tagesschwankung
wird so riesig; bei −90 g an einem Tag stünde rot „schneller als 2 %“. Die Warnung selbst (Mittel über 14 Tage,
`abnahmeProWoche` in js/rechnen.js) ist nicht betroffen.

## Regel
Neue Konstante `GRENZEN.tageTempo = 7` (js/rechnen.js, Darstellung, keine medizinische Grenze).
Vergleichsmessung = jüngste Wägung, die mindestens 7 Tage vor der neuen liegt (wie `abnahmeProWoche`).

## Stellen
1. `tempoRueckmeldung` → Vergleich mit der Vergleichsmessung. Gibt es keine, aber eine frühere Wägung:
   Ergebnis mit `bewertung: "neutral"`, `prozent: null`, Titel zur direkt vorigen Wägung, Text unten (A).
2. `messungWerte` / Karte „Letzte Messung“ (js/heute-grafiken.js): Kopfzeile „± g seit …“ zur selben
   Vergleichsmessung wie das Tempo. Ohne Vergleichsmessung: Kopf zur vorigen Wägung, statt Skala und Urteil Text (B).
3. Gewicht-Fenster (app.js `zeigeGewichtRueckmeldung`): nutzt 1. automatisch, Zeichen „i“.
4. Verlauf, Tempo-Diagramm (`wochenRaten`, js/verlauf.js ~778): jeder Punkt = Wägung gegen ihre Vergleichsmessung;
   Wägungen ohne Vergleichsmessung bekommen keinen Punkt. Erklärsatz (C).

## Wortlaut (vor dem Einbau Stefans Ja)
- (A) Gewicht-Fenster: „Für ein Tempo liegen die Messungen noch zu nah beieinander. Es erscheint ab 7 Tagen Abstand.
  Das Gewicht schwankt von Tag zu Tag; am genauesten ist 1× pro Woche zur gleichen Zeit.“
- (B) Karte „Letzte Messung“: „Das Tempo erscheint, wenn zwei Messungen mindestens 7 Tage auseinanderliegen.“
- (C) Verlauf: „Jeder Punkt steht für ein Wiegen, verglichen mit der Messung mindestens 7 Tage davor und auf 7 Tage
  umgerechnet. Bewertet wird erst ab der Freigabe vom Tierarzt; schneller als 2 % ist immer rot. Unter der Nulllinie:
  zugenommen.“

## Dazu (Optik)
`.mess-urteil` etwas Abstand nach oben (Skalenzahlen und Satz lagen ~4 px auseinander), Wert messen.

## Tests (TDD, feste Daten)
- Kito 8,49 kg am 5.11., 8,58 kg am 6.11., sonst nichts: kein Tempo, Text (B), Kopf „+90 g seit 5.11.“.
- Dazu 8,92 kg am 30.10.: Tempo gegen 30.10. (7 Tage): (8,92 − 8,58) / 8,92 = 3,81 % → „zu schnell“; Kopf „−340 g seit 30.10.“.
- Wägungen 23.10. 9,00 / 30.10. 8,95 / 5.11. 8,94 / 6.11. 8,90: Vergleich 6.11. gegen 30.10. = 0,56 % → gut (mit Freigabe).
- Verlauf: Punkt am 6.11. gegen 30.10., am 5.11. keiner, wenn davor nichts ≥ 7 Tage liegt.
- Bestehende Tests in tests/zusammenfassung.test.js, heute-grafiken.test.js, verlauf.test.js, alte-sicherungen.test.js anpassen,
  wo sie Abstände unter 7 Tagen nutzen. Demo (wöchentlich) darf sich nicht ändern.
