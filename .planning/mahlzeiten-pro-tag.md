# Mahlzeiten pro Tag in der Übersicht für den Tierarzt (0.53.0)

Ideen-Karte `mahlzeiten-pro-tag` (Stand „spaeter“, Einschätzung vom 04.11.2026): Nur Anzeige im PDF, keine Zielzahl.
Wie oft gefüttert wird, entscheidet der Tierarzt.

## Was der Tierarzt sieht
Im Abschnitt „Fütterung“, direkt nach dem Satz mit den kcal pro Tag:

> Im Schnitt 3,5 Mahlzeiten pro Tag (2 bis 5).
> <small>Gezählt nach der eingetragenen Uhrzeit: Futter-Einträge innerhalb von 30 Minuten gelten als eine Mahlzeit, Leckerlis zählen nicht mit.</small>

- Kein Ziel, keine Bewertung, kein Hinweis „zu wenig/zu viel“.
- Gibt es im Zeitraum nur Leckerlis (keine Mahlzeit), entfällt der Satz.
- Bei immer gleicher Zahl nur „(jeden Tag 3)“ statt „(3 bis 3)“.

## Regel zum Zählen (`mahlzeitenZaehlen` in `js/bericht.js`)
- Jede Mahlzeit in der App ist ein Eintrag je Sorte. Nass und trocken zur selben Fütterung sind zwei Einträge, oft mit
  1–2 Minuten Abstand (Uhrzeit = „jetzt“ beim Eintragen). Deshalb: Futter-Einträge (nicht Leckerli) eines Tages nach
  Uhrzeit sortieren; ein Eintrag beginnt eine neue Mahlzeit, wenn er 30 Minuten oder mehr nach dem **ersten** Eintrag
  der laufenden Mahlzeit liegt (kein Ketten-Effekt: 8:00, 8:20, 8:40 = zwei Mahlzeiten).
- Gelöschte Sorte (unbekannter Typ) zählt als Futter.
- Die 30 Minuten sind eine Zählregel, keine medizinische Grenze.
- Teiler: dieselben Tage wie bei kcal/Tag (`tageMitEintrag`), damit beide Zahlen zusammenpassen.
- Spanne: kleinste und größte Zahl an diesen Tagen (ein Tag nur mit Leckerli = 0).

## Nach dem Prüfer (Opus, 06.11.2026): 0 kritisch, 1 wichtig, 6 klein
- Wichtig: Beim Nachtragen ist die Uhrzeit mit „jetzt“ vorbelegt (app.js `oeffneMahlzeit`). Drei Fütterungen von gestern,
  abends in einem Rutsch nachgetragen, liegen 1–2 Minuten auseinander und zählen als eine. Deshalb steht im
  Kleingedruckten „Gezählt nach der eingetragenen Uhrzeit“. Möglicher späterer Schritt: beim Nachtragen für einen
  anderen Tag die Uhrzeit nicht vorbelegen.
- Ein Tag nur mit Leckerli ergibt eine 0 in der Spanne; dahinter steht „an N Tagen nur Leckerli eingetragen“, damit der
  Tierarzt nicht „nichts bekommen“ liest.
- Bekannte Grenze, nicht gebaut: Einträge um 23:50 und 0:05 zählen an zwei Tagen (Tage nach Ortszeit wie überall).

## Daten
`fuetterung.mahlzeiten = { proTag, min, max, tageNurLeckerli }` oder `null` (keine Mahlzeit im Zeitraum). Kein neues Datenfeld,
Datenformat bleibt Version 1.

## Tests (`tests/bericht.test.js`)
- Kitos Beispiel: 02.11. und 03.11. je 2 Mahlzeiten, Leckerli am 03.11. zählt nicht → 2,0 (jeden Tag 2).
- 30-Minuten-Regel: 8:00 + 8:01 = eine; 8:00 + 8:30 = zwei; 8:00, 8:20, 8:40 = zwei.
- Nur Leckerlis → `null`, Satz fehlt im HTML.
- HTML: Satz mit Komma-Zahl, Spanne, Kleingedrucktes; kein Wort „empfohlen“/„Ziel“ im Satz.

## Version
0.53.0, Cache v101, Versionstest in `tests/wissen.test.js`.
