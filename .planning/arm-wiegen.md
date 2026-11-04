# Wiegen mit Katze auf dem Arm (geplant, nach 0.27.0)

Stand: 04.11.2026. Herkunft: Konkurrenz-Check Asien (Vorbild: eine japanische Wiege-App, die das Halter-Gewicht abzieht).
Status: **gebaut** am 04.11.2026 als 0.28.0 (lokal, Commit nach Stefans Ja).
Abweichungen vom Plan: Text sagt „Die Leitlinien nennen als Abnahme 0,5–2 % pro Woche“ statt „sichere Wochenabnahme“ (sicher sagt die App nur nach Freigabe);
zusätzlich „Weil zweimal abgelesen wird, kann die Differenz leicht 100 g oder mehr danebenliegen.“ (nach Code-Review); ohne bisheriges Gewicht ein allgemeiner Satz statt der Zahlen.
Der Notiz-Vorschlag wird wieder entfernt, wenn die Arm-Werte ungültig werden und die Notiz noch unverändert ist. Enter in den Arm-Feldern speichert nicht.

## Ziel

Viele Halter haben keine Tierwaage. Sie stellen sich mit der Katze auf dem Arm auf die Personenwaage und rechnen selbst.
Kilossos nimmt beide Zahlen und rechnet die Differenz, damit beim Kopfrechnen kein Fehler passiert.
Gleichzeitig sagt Kilossos ehrlich, wie grob diese Methode ist.

## Verhalten

Im Dialog „Gewicht von …“ unter dem kg-Feld ein aufklappbarer Bereich **„Auf dem Arm gewogen?“**:

- Feld 1: „Du mit Katze“ (kg)
- Feld 2: „Du allein“ (kg)
- Kilossos trägt die Differenz ins kg-Feld ein; die Tempo-Rückmeldung reagiert wie bei Handeingabe.
- Beide Felder werden **nicht gespeichert** (Halter-Gewicht ist ein persönliches Datum des Menschen, nicht der Katze).
- Ist die Notiz leer, wird „auf dem Arm gewogen“ als Notiz vorgeschlagen (sichtbar, änderbar), damit der Tierarzt im PDF sieht, woher der Wert kommt.

Hinweis im Bereich (Zahlen je Tier aus dem letzten Gewicht berechnet, Beispiel Kito 9,32 kg):

> **Auf dem Arm gewogen ist nie so genau wie eine richtige Tierwaage.** Personenwaagen zeigen meist nur 100-g-Schritte und schwanken, wenn sich die Katze bewegt.
> Bei Kito ist 1 % des Gewichts 93 g, eine sichere Wochenabnahme liegt bei 47–186 g.
> Für den Wiegetag ist eine Tier- oder Babywaage (10-g-Schritte) deutlich genauer. Immer dieselbe Waage nehmen.
> Bei einer Warnung zum Tempo erst mit einer genauen Waage oder beim Tierarzt nachwiegen.

Der erste Satz (fett) steht immer sichtbar, sobald der Bereich offen ist (Stefans Wunsch 04.11.2026), nicht nur in einem Tooltip.

## Prüfungen

- Beide Werte 1–250 kg, „mit Katze“ größer als „allein“, Differenz 0,5–20 kg (gleiche Grenze wie das kg-Feld).
- Sonst klare Fehlermeldung im Bereich, kg-Feld bleibt unverändert.

## Technik

- `js/rechnen.js`: `armGewicht(mitKatze, allein)` → kg (2 Nachkommastellen) oder Fehlertext; `prozentInGramm(kg, prozent)` → gerundete Gramm.
- Tests in `tests/rechnen.test.js` bzw. neuer Datei mit Kitos Zahlen (z. B. 74,6 − 65,3 = 9,30; 1 % von 9,32 kg = 93 g; 0,5 % = 47 g; 2 % = 186 g).
- `index.html`: Bereich im Gewichts-Dialog (vorhandenes Aufklapp-Muster `js/aufklappen.js`), Tippflächen ≥ 48 px.
- `app.js`: Eingaben auswerten, kg-Feld setzen, Notiz-Vorschlag.
- **Datenformat bleibt unverändert** (kein neues Feld, alte Sicherungen gültig).
- `sw.js`: `CACHE_NAME` hochzählen. Version 0.28.0.

## Bewusst nicht übernommen (aus demselben Check)

- Datenschutz-Satz: gibt es schon („Über Kilossos“, Willkommensseite 0.27.0).
- Futter- und Gewichtsdiagramm übereinander: beide Diagramme gibt es schon getrennt; später prüfen.
- Futter aus Vorlage kopieren: eigene Sorte hat nur Name, Art, kcal, Quelle; kaum Ersparnis.
- Tierarzt-Siegel: erst nach Kitos Termin (13.11.2026) und Rückmeldung des Tierarztes.
- Mahlzeiten-Plan zum Abhaken: erst sinnvoll mit Freigabe; nie als Vorschlag der App.
- kcal-Rechner, Rasse-Ampel, Foto-Portionsschätzung, Teilen über Server, Punkte, Werbung: widersprechen den festen Regeln.
