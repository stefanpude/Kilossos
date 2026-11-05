# Wägungen im PDF nebeneinander (0.36.0)

Stand: 05.11.2026. Wunsch des Halters: „höchstens 4, 5 Wägungen im Monat … optisch angenehmer“ als die lange Tabelle
untereinander. Entschieden nach einem klickbaren Entwurf („So bauen“).

## Was gebaut wird

Im Abschnitt „Gewicht“ der Übersicht für den Tierarzt ersetzt ein Monatsraster die Tabelle
„Datum | kg | Änderung | % KM/Woche | Notiz“. Kurve, Streifen und Liste „Besondere Tage“ bleiben unverändert darüber.

- **Eine Zeile je Monat** („Okt 2026“), darin bis zu 5 Wägungen nebeneinander. Jedes Feld: Datum kurz („23.10.“),
  Gewicht mit 2 Nachkommastellen, Änderung zur Wägung davor in Gramm („−20 g“, „–“ ohne Wägung davor).
  Mehr als 5 Wägungen im Monat: weitere Zeilen im selben Monat, Monat und Bilanz gehen über alle Zeilen.
- **Spalte „Monat“ rechts (Bilanz):** Änderung in Gramm und % KM/Woche von der letzten Wägung des Vormonats bis zur
  letzten des Monats; im ersten Monat des Berichts ab seiner ersten Wägung (eine einzige Wägung: „–“).
  % bezogen auf das Gewicht am Anfang (Regel 1a in `docs/sicherheitsgrenzen.md`). Zunahme steht als
  „Zunahme 0,56 % KM/Woche“, nicht mit Minus.
- **Keine Prozentzahl je Wägung mehr.** Grund: Von Woche zu Woche schwankt sie stark (Wasser, Kot, Waage), der Monatswert
  ist ruhiger. Zu schnelle Abnahme meldet die Übersicht weiter unter „Auffälligkeiten“ (Mittel über 2 Wochen).
- **Notizen** als Buchstabe am Gewicht (a, b, …, z, aa, …) und ausgeschrieben unter dem Raster. Buchstaben statt Zahlen,
  damit sie nicht mit den Nummern der besonderen Tage verwechselt werden. Datum kurz, mit Jahr, wenn eine Notiz nicht im
  Jahr des Berichtsendes liegt. Notizen werden maskiert.
- Kopf der Übersicht: „andere Wiegeart steht als Anmerkung unter den Wägungen“ statt „in der Spalte Notiz“.
- Monatsnamen fest im Code (Jan, Feb, März, Apr, Mai, Juni, Juli, Aug, Sep, Okt, Nov, Dez), weil Node und Browser
  unterschiedlich kürzen.

## Darstellung

- Feste Spaltenbreiten (Monat 21 mm, Bilanz 30 mm, Rest gleich verteilt), damit die Wägungen aller Monate
  untereinander stehen. Linie unter jedem Monat, keine senkrechten Linien. Schwarzweiß lesbar.
- Auf dem Handy ist das Raster mindestens 34rem breit und scrollt innen wie die anderen breiten Tabellen.

## Bedacht und verworfen

- Tabelle gekippt (Zeilen Datum/kg/Änderung, Spalten die Wägungen): muss ab 6 Wägungen umbrechen.
- Raster nach Kalenderwochen: Lücken und doppelte Felder bei wechselnden Wiegetagen.
- Heutige Tabelle zweispaltig: Notizen zu eng, das Auge springt.
- Tabelle weglassen: Der Tierarzt braucht die genauen Werte.

## Code

`js/bericht.js`: `waegungsMonate(gewichte)` (rein, testbar), `waegungsRaster(gewichte, bis)`, Aufruf in `berichtHtml`.
`styles.css`: `.wg-*`. Tests: `tests/bericht.test.js`, Block „0.36.0“.
