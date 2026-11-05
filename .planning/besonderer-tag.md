# „Besonderer Tag“: Ereignisse und Phasen festhalten (geplant als 0.33.0, vor dem 13.11.2026)

_Angelegt 05.11.2026 nach einem Brainstorming mit Stefan, danach von einem frischen Prüfer gegen den Code gelesen
(zwei Fragen, von Claude entschieden, siehe „Entscheidungen von Claude“). Von Stefan freigegeben am 05.11.2026 („Da vertraue ich dir …
dann darfst du das gerne so umsetzen“). Ideen-Tafel: Karte `mph346jq2gw1ws0294so` (geplant), dazu die übernommenen
Punkte „Futterumstellung“, „Futter verweigert“ mit Notfall-Hinweis und „Auffälligkeit beim Fressen“.
Als Nächstes: Skill `migration` (neue Liste im Datenformat), dann Umsetzungsplan mit `superpowers:writing-plans`._

## Warum

Die Waage zeigt nur, **dass** sich etwas ändert, nicht **warum**. Halter und Tierarzt sollen später sehen, was an einem
Tag anders war: Die Katze war draußen und hat eine Maus gefangen, sie hat beim Futter eines anderen Haustiers genascht,
sie war drei Tage krank, das Futter wurde umgestellt. Genau solche Ausnahmen erklären einen Knick in der Gewichtskurve
oder eine Woche ohne Abnahme.

Heute geht das nur als Notiz an einer Wägung. Das reicht nicht: Wägungen gibt es einmal pro Woche, Ereignisse passieren
dazwischen, und eine Krankheit über mehrere Tage lässt sich so nicht darstellen (Stefan: „Die Lösung finde ich nicht gut.“).

Wichtigster neuer Punkt aus dem Gespräch: **Futter außer der Reihe.** Beute oder ein paar Stücke vom Futter eines anderen
Tiers haben Kalorien, die auf „Heute“ fehlen. Die Menge kennt der Halter nicht („er nascht ein paar Stücke“). Für den
Tierarzt ist wichtig, **wie oft** das vorkommt.

## Ziele

1. Auf „Heute“ lässt sich für den gezeigten Tag ein besonderer Tag eintragen: eine Art aus einer festen Auswahl und eine
   freiwillige Notiz. Mehrere Einträge pro Tag sind möglich.
2. Ein Eintrag kann **mehrere Tage** dauern (Phase). Eine laufende Phase lässt sich ohne Ende eintragen und später mit einem
   Tipp beenden.
3. Im Verlauf erscheint unter der Gewichtskurve eine schmale **Zeitleiste**: Phasen als Balken, eintägige Ereignisse als Punkte.
4. Im PDF-Bericht für den Tierarzt erscheinen dieselbe Zeitleiste unter der Kurve und eine Liste.
5. Bei „Futter verweigert“ zeigt Kilossos sofort groß den Notfall-Hinweis.
6. Alte Sicherungen bleiben gültig, das Format bleibt Version 1.

## Nicht-Ziele und Anti-Ziele

- **Keine Kalorien und keine Gramm** für genaschtes Futter oder Beute. Eine geschätzte Zahl würde genauer wirken, als sie ist.
- **Kein Einfluss auf Grenzen, Warnungen oder Rechnungen.** Nimmt die Katze in einer Krankheitswoche über 2 % ab, kommt die
  Warnung trotzdem. Kilossos schlägt wegen eines Eintrags nie eine andere Futtermenge vor (feste Regel: Mengen nur vom Tierarzt).
- **Keine neuen medizinischen Ratschläge.** Einziger Hinweis ist der vorhandene Notfall-Text bei „Futter verweigert“. Kein
  Text wie „bei Krankheit Abnahme pausieren“ (dafür gibt es keine geprüfte Quelle in Kilossos).
- **Keine Auswertung der Notizen,** keine Statistik („3-mal genascht diese Woche“) in dieser Fassung.
- Die „Haltung“ im Profil bleibt die Grundeinstellung und wird nicht automatisch geändert. Eine dauerhafte Änderung
  (zum Beispiel „seit einer Baustelle nur noch drinnen“) trägt der Halter als lange Phase ein.
- Nichts verlässt das Gerät.

## Die Auswahl (feste Liste, in dieser Reihenfolge)

| Art | Gedacht für | Besonderheit |
|---|---|---|
| Mehr Bewegung | z. B. draußen gewesen, viel gespielt | |
| Weniger Bewegung | z. B. nur drinnen, verletzt geschont | |
| Krank | | Beenden-Knopf heißt „Wieder gesund“ |
| Futter verweigert | | Notfall-Hinweis groß (siehe unten) |
| Außer der Reihe genascht | Beute, Futter eines anderen Tiers, Essen vom Tisch | Erklärsatz im Fenster: „Die Menge musst du nicht wissen.“ |
| Auffälligkeit beim Fressen | nur die Hälfte gefressen, erbrochen, sehr gierig | |
| Futterumstellung | Mischen über mehrere Tage | |
| Sonstiges | | Notiz ist hier Pflicht, sonst steht im Bericht nur „Sonstiges“ |

Welche Ausnahmen der Tierarzt sehen will, fragt Stefan am 13.11. (steht in den Fragenlisten). Danach wird die Auswahl
eventuell angepasst. Deshalb sollen die Arten im Code an **einer** Stelle stehen (Schlüssel, Anzeigetext, Beenden-Text),
damit sich die Liste leicht ändern lässt. Unbekannte Schlüssel aus einer neueren Sicherung werden als „Sonstiges“ angezeigt,
nicht verworfen.

## Eintragen (Fenster „Besonderer Tag“)

Felder:
- **Art** (Auswahlmenü wie im Profil, `auswahlFeld`), Pflicht.
- **Datum**, vorbelegt mit dem Tag, der gerade auf „Heute“ gezeigt wird. Höchstens heute.
- **Schalter „Dauert mehrere Tage“.** Ist er an, erscheint das Feld **„bis“**: frühestens das Startdatum, höchstens heute.
  Leer gelassen heißt: **läuft noch**. Ein kurzer Satz unter dem Feld sagt das.
- **Notiz**, freiwillig (bei „Sonstiges“ Pflicht), höchstens 200 Zeichen (andere Notizen haben keine Grenze; hier hält sie
  Infoblase, Zeitleiste und PDF-Tabelle lesbar).

Zwei Wege, beide aus dem Gespräch mit Stefan:
- **Sofort:** „Krank, ab heute“, „bis“ leer. Die Phase läuft.
- **Nachtragen:** auf „Heute“ mit den Pfeilen zum Tag zurückblättern, dort eintragen; eine Phase gleich mit „bis“.

Ändern: Antippen eines Eintrags öffnet dasselbe Fenster mit den Werten (wie „Gewicht ändern“ seit 0.31.0). Löschen über das
Kreuz am Eintrag mit Rückfrage, wie bei Mahlzeiten und Gewichten (heute `confirm()`, später die eigene Rückfrage der Karte
`eigene-rueckfrage`).

## Anzeige auf „Heute“

Unter der Karte „Mahlzeiten“ eine Karte **„Besonderer Tag“**:
- Liste der Einträge, die den gezeigten Tag betreffen: eintägige Einträge dieses Tages und Phasen, die über diesen Tag
  laufen (auch laufende ohne Ende). Bei Phasen steht der Zeitraum dabei („krank seit Mo., 3. Nov.“ bzw. „1. bis 3. Nov.“).
- Knopf „Besonderen Tag eintragen“.
- Bei einer **laufenden** Phase ein Knopf zum Beenden: „Wieder gesund“ bei „Krank“, sonst „Beendet“. Ein Tipp setzt das
  Ende auf den gezeigten Tag. Wer ein anderes Ende will, öffnet den Eintrag und ändert „bis“. Diese Zeile ist zugleich die
  Erinnerung: Solange eine Phase läuft, steht sie jeden Tag auf „Heute“.
- Ohne Einträge bleibt die Karte klein: nur der Knopf und ein kurzer Satz, wofür sie da ist (Vorschlag: „Draußen gewesen,
  genascht, krank? Hier festhalten, damit du und der Tierarzt später seht, warum sich das Gewicht so bewegt.“).

## Notfall-Hinweis bei „Futter verweigert“

- Nach dem Speichern eines Eintrags „Futter verweigert“ erscheint oben auf „Heute“ der Notfall-Hinweis groß im
  „Sofort“-Stil (Rot), mit dem vorhandenen Text: „Frisst deine Katze einen Tag oder länger gar nicht? Dann sofort zum
  Tierarzt, auch mitten in der Abnahme. Katzen bekommen dabei schnell eine Fettleber.“
- Groß und rot nur, solange es **jetzt** dringend ist: Der Eintrag „Futter verweigert“ betrifft heute oder gestern
  (echtes Datum, nicht der gezeigte Tag), oder er ist eine laufende Phase. Blättert man auf einen Tag, der länger
  zurückliegt, steht der Eintrag dort ganz normal in der Liste, ohne roten Kasten.
- Der Kasten gehört **nicht** in `warnungen()` (`js/rechnen.js`), sonst würde er im PDF unter „Auffälligkeiten“ mitgezählt.
- Der kleine, ruhige Notfall-Hinweis unten auf „Heute“ bleibt wie bisher.

## Zeitleiste im Verlauf

- Unter der Gewichtskurve (`weicheKurve` in `js/verlauf.js`) ein schmaler Streifen über dieselbe Zeitachse, nur wenn es im
  gewählten Zeitraum Einträge gibt.
- **Die gemeinsame Zeitachse endet heute, nicht mehr bei der letzten Wägung.** Bisher endet die Kurve am Tag der letzten
  Wägung (`bisMs = liste.at(-1).datum`). Bei wöchentlichem Wiegen fehlten der Zeitleiste sonst bis zu 6 Tage, genau der
  Normalfall „krank seit gestern“. Die Gewichtslinie endet weiter am letzten Punkt, rechts davon bleibt bis heute freie
  Fläche; sicherer Bereich und Monatsbeschriftung laufen bis heute mit. Diese Änderung gilt immer, auch ohne Einträge, damit
  die Kurve nicht je nach Einträgen ihre Breite wechselt. Bestehende Tests in `tests/verlauf.test.js` und
  `tests/bericht.test.js` werden angepasst. Der Anfang der Achse bleibt bei der ersten Wägung im Zeitraum; Phasen, die
  früher beginnen, werden links abgeschnitten (die Infoblase nennt den ganzen Zeitraum).
- Gibt es im Zeitraum weniger als zwei Wägungen, gibt es weder Kurve noch Zeitleiste. Die Einträge stehen dann auf „Heute“
  und im PDF. (Betrifft vor allem ein Tier ganz ohne Gewichte.)
- **Phasen** als Balken mit runden Enden von Beginn bis Ende, auf den Zeitraum der Kurve zugeschnitten. Laufende Phasen
  reichen bis zum rechten Rand.
- **Eintägige Ereignisse** als Punkte.
- Eine ruhige Farbe für alles; nur „Futter verweigert“ in der „Sofort“-Farbe. Überlappende Phasen in zwei Reihen.
- Antippen zeigt die vorhandene Infoblase: Art, Datum oder Zeitraum, Notiz (gekürzt).
- Legende: Eintrag „Besonderer Tag“ nur, wenn der Streifen zu sehen ist (wie seit 0.32.1 bei Ziel und sicherem Bereich).
- **Bewusst verworfen:** farbige Flächen quer über die ganze Kurve. Dort liegen schon der blasse grüne sichere Bereich und
  die Freigabe-Marken; eine zweite Fläche würde unruhig und schwer lesbar.

## PDF-Bericht

- Dieselbe Zeitleiste unter dem Gewichtsdiagramm (`gewichtDiagramm` in `js/verlauf.js`, eingebunden in `js/bericht.js`).
  Die Achse des Diagramms endet am letzten Tag des Berichtszeitraums, nicht bei der letzten Wägung (gleicher Grund wie im Verlauf).
- Abschnitt **„Besondere Tage“**: Tabelle mit Zeitraum (oder Datum), Art, Notiz, für den Berichtszeitraum. Laufende Phasen
  als „seit …, läuft noch“. Phasen, die in den Zeitraum hineinreichen, erscheinen mit ihrem ganzen Zeitraum.
- Immer dabei, wenn es Einträge gibt (kein Häkchen nötig). Ohne Einträge kein Abschnitt.

## Datenformat (Skill `migration` vor dem Bauen)

- Neue Liste in den Daten, je Eintrag: id, tierId, Art, Startdatum, Ende (gleich dem Start bei einem Tag, ein späteres
  Datum bei einer abgeschlossenen Phase, „kein Ende“ bei einer laufenden Phase), Notiz (optional).
  Feldnamen und die genaue Darstellung von „kein Ende“ legt der Bau fest.
- **Fehlt die Liste** (alle bisherigen Daten und Sicherungen), gilt sie als leer. `istGueltig` darf sie nicht verlangen.
- Überall nach `tierId` filtern: Entfernt eine ältere App-Fassung ein Tier, bleiben dessen Einträge in der Liste stehen.
- Kaputte Einträge (fehlende Pflichtfelder, ungültiges Datum, Ende vor Start) werden wie bei den anderen Listen
  aussortiert und unter dem Schlüssel für Entferntes aufgehoben (`eintraegeBereinigen`).
- Mitziehen: Sicherung speichern und einlesen, Tier entfernen (`tierEntfernen` und `eintraegeVon` in `js/tiere.js`, auch der
  Rückfragetext), „Alle Daten löschen“, Demo (Daten werden um Tage verschoben: `verschiebeDaten` muss Start und Ende
  mitverschieben), Speicheranzeige.
- Ältere App-Fassungen: Laut Prüfung vom 05.11. behalten sie die neue Liste (`laden`/`speichern` schreiben das ganze Objekt
  zurück, Einlesen ersetzt alles). Im Umsetzungsplan mit dem Skill `migration` bestätigen.
- Demo: Die Simulation (`werkzeuge/erzeuge-testdaten.js`, erzeugt `demo/kito-simulation.json`) bekommt Beispiel-Einträge,
  darunter eine abgeschlossene Phase „Krank“ und ein paarmal „Außer der Reihe genascht“.
- Tests mit alten Sicherungen (`tests/alte-sicherungen.test.js`) müssen grün bleiben.

## Entscheidungen von Claude (Stefan hat sie nicht einzeln gesehen, er hat dem Gesamtbild vertraut)

- Ein Schalter „Dauert mehrere Tage“ für **jede** Art statt einer festen Einteilung in Ereignisse und Phasen.
- Nur Datum, keine Uhrzeit.
- Beenden setzt das Ende auf den gezeigten Tag.
- Zeitleiste unter der Kurve statt Flächen in der Kurve.
- Bei „Sonstiges“ ist die Notiz Pflicht.
- Notfall-Hinweis groß nur, wenn „Futter verweigert“ heute oder gestern betrifft oder noch läuft (nicht beim Zurückblättern
  in alte Tage).
- Die Zeitachse von Kurve und PDF-Diagramm endet heute bzw. am Ende des Berichtszeitraums statt bei der letzten Wägung.
- Ohne Kurve (weniger als zwei Wägungen) keine Zeitleiste.
- Notiz höchstens 200 Zeichen.
- Keine eigene Liste im Verlauf (die Tagesansicht auf „Heute“ und der Bericht zeigen die Einträge ausführlich).

## Dem Bau überlassen

- Feldnamen, Aufbau des Fensters im Detail, genaue Farben aus den vorhandenen Design-Tokens, Symbol(e) für die Karte.
- Wie die Zeitleiste bei sehr vielen Einträgen dicht zusammenrückt (Lesbarkeit bei 375 px und 150 % Schrift ist Pflicht).
- Ob Zeitleiste in Verlauf und PDF eine gemeinsame Funktion nutzen.

## Prüfen vor dem Fertigmelden

- TDD für Datenformat, Bereinigung, Phasen-Logik (welche Einträge betreffen einen Tag, laufend, beenden), Zeitleiste,
  Bericht-Abschnitt, Notfall-Regel.
- Browser: Eintragen sofort und nachträglich, Phase laufen lassen und beenden, ändern, löschen, Tier entfernen,
  Sicherung speichern und einlesen, Demo, 375 px, hell, dunkel, 150 % Schrift, Tastatur, keine Konsolenfehler.
- Review durch einen frischen Agenten vor dem Commit.
- Version 0.33.0, Cache hochzählen, neue Dateien in `DATEIEN` (`sw.js`).

## Danach (nicht Teil dieses Baus)

- Fragenlisten `docs/tierarzt-fragen-kito.md` und `docs/tierarzt-fragen-zuki.md` nennen bisher 5 der 8 Arten: an die
  Auswahl angleichen, damit Stefan am 13.11. die richtige Liste abfragt.
- „Freigabe ändern und löschen“ (vor dem 13.11.; Testwerte und Tippfehler, siehe HANDOFF).
