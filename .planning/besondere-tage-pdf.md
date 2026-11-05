# „Besondere Tage“ im PDF verständlicher (geplant als 0.35.0, vor dem 13.11.2026)

_Angelegt 05.11.2026 nach einem Brainstorming mit Stefan (klickbare Entwürfe im Brainstorming-Begleiter, liegen nur lokal
in `.superpowers/brainstorm/`). Von Stefan freigegeben am 05.11.2026: „Den Wurf finde ich so tatsächlich gut … Ansonsten so
bauen“, mit einem Wunsch: die Zeitachse unter der Kurve genauer beschriften („Jetzt steht da nur November“)._

## Warum

Seit 0.33.0 steht unter der Gewichtskurve im PDF ein Streifen mit dicken Balken und Punkten. Der Tierarzt sieht daran nur,
**dass** etwas war, nicht **was**. Die Erklärung steht weit unten in einer eigenen Tabelle, oft erst nach der Tabelle der
Wägungen. Stefan: Das soll weder den Halter noch den Tierarzt erschlagen.

## Geprüfte Entwürfe

| Entwurf | Ergebnis |
|---|---|
| A: Nummern am Streifen, Spalte „Nr.“ in der Tabelle weiter unten | Teil übernommen (Nummern). Allein zu weit weg: Hin- und Herblättern. |
| B: Eine Zeile je Art mit Namen | Verworfen: wird bei vielen Arten hoch (bis 8 Zeilen). |
| C: Text direkt am Balken | Verworfen: bei vielen Einträgen unruhig, gleiche Arten verstreut. |
| Graue Flächen hinter der Kurve | Verworfen: In der Kurve stehen schon Ziel, Freigabe und sicherer Bereich. |
| Nur Zusammenfassung („3 Tage krank“) | Verworfen: Der Tierarzt sieht nicht, wann. |
| Drei feste Gruppen (Gesundheit, Fressen, Bewegung) | Verworfen: Einzelheiten bräuchte man trotzdem, und es wird höher. |
| Kürzel je Art (K, G, B) | Verworfen: Kürzel müsste man erst lernen. |
| Liste direkt unter der Grafik | **Übernommen**, Kern des Entwurfs. |

## Was gebaut wird

1. **Streifen im PDF:** dünne Linien statt dicker Balken. Jeder Eintrag hat am Anfang einen kleinen Kreis mit seiner Nummer.
   Ein Tag = nur der Kreis. Mehrere Tage = Linie vom Kreis bis zum letzten Tag mit einem kurzen Querstrich am Ende.
   Läuft noch = Linie bis zum rechten Rand mit Pfeilspitze. „Futter verweigert“: Kreis rot gefüllt, Ziffer weiß
   (bleibt im Schwarzweiß-Druck als gefüllter Kreis erkennbar). Überlappende Einträge rutschen in die nächste Reihe
   (so viele Reihen wie nötig). Gleiche Zeitachse wie die Kurve (`PDF_RAND`).
2. **Liste direkt unter dem Streifen**, im Abschnitt „Gewicht“ vor der Tabelle der Wägungen: Überschrift „Besondere Tage“
   mit dem Zusatz „vom Halter festgehalten, ohne Mengen“, je Eintrag eine Zeile: Nummer (gleicher Kreis wie im Streifen),
   Zeitraum kurz ohne Jahr („24.10.“, „28.–30.10.“, „30.10.–2.11.“, „seit 20.10.“), Art, Notiz. Laufende Phasen
   bekommen „läuft noch“ hinter der Notiz. „Futter verweigert“ steht rot und fett.
3. **Der eigene Abschnitt „Besondere Tage“ weiter unten entfällt**, ebenso die Erklärzeile unter dem Streifen (0.34.1).
4. **Zeitachse genauer** (beide PDF-Diagramme, Gewicht und Kalorien): bis 6 Wochen (42 Tage) jeder Montag als „5.10.“,
   bis 12 Wochen (84 Tage) jeder zweite Montag, darüber Monatsanfänge wie bisher (bei mehr als 8 Monaten nur jeder zweite
   oder dritte, bis 8 Monate jeder). So stehen höchstens 6 Daten oder 8 Monatsnamen nebeneinander; bei 7 Daten würden sie sich berühren.
   Kleine Striche an der Grundlinie zeigen, wo die Tage liegen.

## Entscheidungen von Claude (bitte beim Lesen prüfen)

- **Die Ansicht „Verlauf“ in der App bleibt unverändert.** Dort zeigt Antippen schon, was war; der neue Streifen ist eine
  eigene Funktion nur für das PDF (`pdfZeitleiste` in `js/verlauf.js`), `zeitleiste()` bleibt für die App.
- **Nummern = Reihenfolge in der Liste** (nach Beginn sortiert, wie `berichtDaten` sie liefert). Ein Eintrag, der vor der
  ersten Wägung im Zeitraum liegt, steht mit Nummer in der Liste, aber nicht im Streifen (dort beginnt die Achse erst).
- **Ohne Kurve** (weniger als zwei Wägungen im Zeitraum) bleibt ein eigener Abschnitt „Besondere Tage“ mit derselben
  Liste, dann ohne Nummern. Ohne Kreise im Streifen gibt es auch in der Liste keine Nummern.
- **Jahr nur, wenn nötig:** Liegt ein Datum der Liste in einem anderen Jahr als das Berichtsende, steht jede Zeile in der
  langen Form mit Jahr („28.10.2026 bis 30.10.2026“), damit die Liste einheitlich bleibt.
- **Liste als Tabelle ohne Kopfzeile und ohne Linien:** Spalten stehen sauber untereinander, auch im Druck.
- **Keine senkrechten Hilfslinien in der Kurve:** nur Striche an der Grundlinie, damit die Kurve ruhig bleibt.
- **Phase über das Achsenende hinaus** (Bericht für einen früheren Zeitraum): Pfeil statt Querstrich, denn sie war dort
  noch nicht vorbei.
- **„Futter verweigert“ in der Liste:** ganze Zeile rot und fett (einfacher und auffälliger als nur die Art).

## Nicht-Ziele

- Keine Änderung am Datenformat, an „Heute“, an Warnungen oder Grenzen.
- Keine Mengen, keine kcal zu besonderen Tagen (wie bisher).

## Tests

- `tests/verlauf.test.js`: `pdfZeitleiste` (leer ohne Einträge im Zeitraum, Nummern, Kreis/Linie/Querstrich/Pfeil,
  Reihen bei Überlappung, Notfall, maskierter Titel, gleiche Achse) und die neue Achsenbeschriftung
  (Montage wöchentlich, zweiwöchentlich, Monate).
- `tests/bericht.test.js`: Liste unter dem Streifen im Abschnitt „Gewicht“, kein eigener Abschnitt mit Kurve, eigener
  Abschnitt ohne Kurve, kurze Daten, Jahr bei Jahreswechsel, Notfall-Zeile, keine Erklärzeile mehr.
- Browser: echter Bericht mit dichten Testdaten, Druckansicht A4 (Breite 150 mm), Schwarzweiß, keine Konsolenfehler.
