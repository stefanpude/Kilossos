# Vier Grafiken neu: „Gefüttert“, „Letzte Messung“, „Tempo pro Woche“, PDF „Kalorien pro Tag“

Stand: 05.11.2026. Wunsch des Halters: die Grafiken auf „Heute“, im „Verlauf“ und im PDF für den Tierarzt schöner und
leichter lesbar machen. Je Stelle gab es 2–3 klickbare Entwürfe (A/B/C) und danach Mischungen; der Halter hat für alle
vier Stellen gewählt. Diese Datei beschreibt, was gebaut wird.
**Freigegeben am 05.11.2026 („So bauen, nach 13.11.“), samt den Entscheidungen beim Schreiben (unten).
Gebaut wird nach dem Tierarzttermin am 13.11.2026.**

| Stelle | Gewählt |
|---|---|
| Heute: „Gefüttert“ | Mischung kompakt (Balken mit Mahlzeiten-Stücken aus A, große Zahl und Kacheln aus B) |
| Heute: „Letzte Messung“ | Mischung flach (Gewicht und kleine Kurve aus B, Tempo-Skala aus A), ohne Korridor |
| Verlauf: „Tempo pro Woche“ | A: Punkte über der Zeit |
| PDF: „Kalorien pro Tag, Durchschnitt je Woche“ | B: Punkte mit Freigabe-Stufe und Band ±10 %, Band weich beim Wechsel der Freigabe |

## Warum

- **„Gefüttert“:** Das Lineal zeigt die Tagesmenge doppelt („220“ an der Skala und im Kopf) und verrät nicht, woraus
  die kcal bestehen.
- **„Letzte Messung“:** Die Mini-Kurve hat keine Achse; ob das Tempo sicher ist, steht nur als kleiner Text.
- **„Tempo pro Woche“:** Die Säulen sind sehr klein (Skala bis 2,6 %), Werte lassen sich nicht ablesen, und die Säulen
  stehen nicht unter den Daten der Gewichtskurve darüber.
- **PDF „Kalorien pro Tag“:** Die Achse beginnt bei 0, deshalb sieht der Tierarzt Abweichungen von der Freigabe kaum.

## Ziele, Nicht-Ziele, darf nicht passieren

- **Ziele:** Auf einen Blick: wie viel heute noch bis zur Tagesmenge, ob das Tempo sicher ist, wie es sich über die
  Wochen entwickelt, und im PDF, ob die Freigabe eingehalten wurde.
- **Nicht-Ziele:** keine neuen Funktionen, keine neuen Warnungen, keine neuen Grenzwerte, kein neues Datenformat.
  Warnungen, Hinweise und die Liste „Alle Wochen“ bleiben, wie sie sind.
- **Darf nicht passieren:**
  - Die App schlägt eine Futtermenge vor oder deutet eine an (auch nicht „noch 9 kcal = 3 g Trockenfutter“).
  - Ohne Freigabe erscheint ein Ziel, ein Füllstand oder eine Bewertung als „sicher“ oder „zu langsam“.
    Rot bei schneller als 2 % gilt wie heute auch ohne Freigabe.
  - Grenzwerte stehen als Zahl im Code. Alle Grenzen kommen aus `GRENZEN` in `js/rechnen.js`
    (`abnahmeMin` 0,5, `abnahmeMax` 2, `spielraum` 0,1, `leckerliMax` 0,1); auch die Zahlen in Texten werden daraus gebildet.
  - Ein Ring (wurde mit 0.23.0 bewusst ersetzt).
  - Die Karte sagt sich selbst widersprechende Dinge (Beispiel aus den Entwürfen: Korridor „ok“, Skala „zu schnell“).

## Für alle vier Stellen

- Farben wie heute: Grün (`--gut`) = im sicheren Bereich, Bernstein (`--warnung`) = Achtung, Rot (`--gefahr`) = zu
  schnell, Grau (`--text-leise`) = nicht bewertet. Grüne Flächen in `--akzent-hell`.
- Schrift in Grafiken (SVG) wächst bei großer Handy-Schrift nicht mit. Deshalb steht jede wichtige Aussage zusätzlich
  als normaler Text (Kacheln, Urteil, Kopfzeile). Grafiken bekommen `aria-hidden="true"`, außer im PDF
  (dort `role="img"` mit `aria-label` wie heute).
- Prüfen je Stelle: 375 px Breite, 150 % Schrift, dunkel, keine Konsolenfehler; Höhe der Karte messen
  (`getBoundingClientRect().height`) und mit den Werten unten vergleichen. Tippflächen mindestens 48 px.
- Bewegung: Die kcal-Zahl zählt wie heute hoch; bei „weniger Bewegung“ (`ohneBewegung()`) sofort.

---

## 1. Heute: „Gefüttert“ (Mischung kompakt)

Ersetzt in der Karte „Gefüttert“ (`index.html`, `#kcal-titel`) das Lineal (`#lineal`), den Satz „Noch … kcal bis zur
Tagesmenge vom Tierarzt“ und die Zeile „Menge … g“.

### Aufbau mit Freigabe

1. **Titel** wie heute: „Heute gefüttert“, an anderen Tagen „Gefüttert“.
2. **Kopfzeile:** große Zahl (3rem, zählt hoch wie heute), daneben „von 220 kcal vom Tierarzt“
   (mit „ca. “ davor, wenn eine Mahlzeit keinen genauen kcal-Wert hat).
3. **Balken** (14 px hoch, 2 px Lücke zwischen den Stücken, Enden rund):
   - Jede Mahlzeit mit kcal-Wert ist ein Stück, in der Reihenfolge der Uhrzeit, Breite nach ihren kcal
     (mindestens 3 px).
   - Nassfutter: `--akzent`; Trockenfutter: `--akzent` zur Hälfte mit `--flaeche` gemischt; Leckerli: Schraffur
     aus `--akzent` und `--flaeche` (135°).
   - Der Rest bis zur Tagesmenge bleibt blass (`--flaeche-2`).
   - Eine schmale Marke (2 px, Textfarbe) steht bei der Tagesmenge.
   - Über der Tagesmenge reicht der Balken bis zur gefütterten Menge, die Marke rückt nach links
     (Position = Tagesmenge ÷ gefüttert). Der Teil rechts der Marke wird überdeckt: bis 10 % darüber
     (`GRENZEN.spielraum`) mit grauer Schraffur, darüber in Bernstein.
   - Keine Zahlenskala, keine Striche.
4. **Legende** unter dem Balken (klein, leise): je vorkommender Art ein Kästchen in ihrer Farbe und die kcal gerundet,
   z. B. „Nass 89 · Trocken 120 · Leckerli 5“. Arten ohne Mahlzeit fehlen.
5. **Zwei Kacheln** nebeneinander, je eine Zeile: Wort links, Zahl rechts.
   - Erste Kachel: „Noch | 9 kcal“. Über der Tagesmenge: „Darüber | 12 kcal“; mehr als 10 % darüber: Kachel in
     Bernstein (Hintergrund `--warnung-hell`, Rand und Zahl `--warnung`).
   - Zweite Kachel: „Futter | 141 g“.
6. **ca.-Hinweis** (nur wenn nötig, eine Zeile): „ca. = enthält Futter ohne genauen kcal-Wert“.

### Andere Zustände

| Zustand | Anzeige |
|---|---|
| Ohne Freigabe | Zahl, daneben „kcal · 141 g Futter“; Legende; Satz „Ziel kommt mit der Freigabe vom Tierarzt.“ und Knopf „Warum kein Ziel?“ (wie heute, `data-aktion="warum-kein-ziel"`); kein Balken, keine Kacheln. |
| Noch keine Mahlzeit (mit Freigabe) | Zahl 0, Balken ganz blass mit Marke am Ende, keine Legende, Kacheln „Noch 220 kcal“ und „Futter 0 g“. |
| Vergangener Tag unter der Tagesmenge | Erste Kachel „Darunter \| 9 kcal“ statt „Noch“, neutral (wie heute „… unter der Tagesmenge vom Tierarzt“). |
| Genau getroffen | „Noch \| 0 kcal“ (an vergangenen Tagen „Darunter \| 0 kcal“), wie heute aus `ringWerte`. |
| Mahlzeit ohne kcal-Wert (z. B. gelöschte Sorte) | Kein Stück im Balken; Gramm zählen in „Futter“ mit; ca.-Hinweis, wenn `tagesSumme` „unsicher“ meldet. |

### Maße aus dem Entwurf (375 px)

Normale Schrift 258 px (heute 256). Große Schrift 437 px (heute 364), weil die Kopfzeile umbricht.

### Code und Tests

- `index.html`: Lineal-Block ersetzen; `#summe-hinweis` bekommt den kurzen Text.
- `app.js` `zeichneHeute` und `zeichneLineal` (Hochzählen bleibt), `styles.css` (`.lineal` entfällt, neue Klassen).
- Neue reine Funktion (z. B. in `js/zusammenfassung.js`), die aus Mahlzeiten, Sorten, Freigabe, Tag und heute
  Stücke, Marke, Überdeckung (keine/grau/Bernstein) und Kacheln liefert. Tests mit einer Beispiel-Katze:
  Freigabe 220, gefüttert 211 → „Noch 9“; 230 → „Darüber 10“, grau; 245 → Bernstein (Grenze 242 aus `spielraum`);
  ohne Freigabe → keine Kacheln; vergangener Tag 150 → „Darunter 70“; Mahlzeit ohne kcal → kein Stück.

---

## 2. Heute: „Letzte Messung“ (Mischung flach, ohne Korridor)

Ersetzt die Karte `#heute-gewicht` (Mini-Kurve mit zwei Textzeilen).

### Aufbau (mit Vergleichswägung)

1. **Kopf, zwei Zeilen, 4 px Abstand:**
   - Zeile 1: „Letzte Messung · Do., 5. Nov.“ (Datum der Wägung) links; rechts der Knopf **„Verlauf ›“**
     (Akzentfarbe, fett, klein), öffnet den Bereich „Verlauf“ wie die untere Leiste. Tippfläche mindestens 48 px.
   - Zeile 2: Gewicht groß „6,12 kg“ (2rem, „kg“ klein und leise) links; rechts leise „−120 g seit 29.10.“
     (Vorzeichen −, + oder ±; Gramm ganzzahlig; Datum der Wägung davor).
2. **Kleine Kurve** (Zeichenfläche 320 × 58, Ränder links 30, rechts 40, oben 6, unten 14):
   - Wägungen der letzten 8 Wochen (`achtWochen`) als Linie (Textfarbe, 2 px), kleine Punkte (r 2,5).
   - Letzter Punkt groß (r 4,5) in der Farbe der Bewertung, rechts daneben das Gewicht („6,12“).
   - Zwei Hilfslinien oben und unten mit kg (1 Nachkommastelle). Achse nur aus den Wägungen:
     unten Minimum − 0,08 kg, oben Maximum + 0,05 kg, je auf 0,1 kg gerundet.
   - Unten links das erste, rechts das letzte Datum („10.9.“, „5.11.“).
   - **Kein Korridor.**
3. **Tempo-Skala** (Zeichenfläche 300 × 35):
   - Spur von −0,5 bis 3 % pro Woche. Grüner Bereich von `abnahmeMin` bis `abnahmeMax`
     (im Dunklen 35 % `--akzent` auf `--flaeche`).
   - Striche mit „0“, „0,5“, „2“, „3 %“.
   - Punkt (r 6) = Tempo seit der Wägung davor (wie `tempoRueckmeldung`), in der Farbe der Bewertung.
     Liegt der Wert außerhalb, bleibt der Punkt am Rand und daneben steht „‹“ bzw. „›“.
4. **Urteil, eine Zeile:** fett „0,8 % pro Woche“ (bei Zunahme „Zunahme 0,3 % pro Woche“), dann „ · “ und kurz:

   | Bewertung | Wort | Farbe |
   |---|---|---|
   | gut | „sicher“ | Grün |
   | langsam | „langsamer als 0,5 %“ | Bernstein |
   | zu-schnell | „schneller als 2 %“ | Rot |
   | zunahme | „im Blick behalten“ | Bernstein |
   | neutral (vor der Freigabe) | „noch ohne Bewertung“ | Grau |

   Die langen Texte aus `tempoRueckmeldung` (Schwankung, „vier Wochen“, Tierarzt) erscheinen weiter beim Eintragen
   des Gewichts; auf der Karte steht nur die Kurzform.

### Andere Zustände

| Zustand | Anzeige |
|---|---|
| Noch keine Wägung | Wie heute: „Noch nicht gewogen.“ und leise „Am besten 1× pro Woche, immer zur gleichen Zeit.“ Kein Knopf „Verlauf ›“. |
| Nur eine Wägung (kein Vergleich) | Kopf mit Datum, Gewicht und „Verlauf ›“, ohne Gramm-Angabe; darunter leise „Das Tempo erscheint ab der zweiten Wägung.“ Keine Kurve, keine Skala. |
| Vergleich da, aber weniger als 2 Wägungen in den letzten 8 Wochen | Kopf, Skala und Urteil; keine Kurve. |
| Ohne Freigabe | Skala mit grünem Bereich, Punkt grau, „noch ohne Bewertung“; über 2 % rot „schneller als 2 %“. |
| Vergangener Tag | Alles bis zu diesem Tag, wie heute (`gewichteBis`, `achtWochen(…, tag)`). |

### Maße aus dem Entwurf (375 px)

222 px (bei „Zugenommen“ 244, Urteil zweizeilig). Große Schrift 288 px (zweizeilig 320). Heute 76 bzw. 163 px:
Die Karte wird also fast dreimal so hoch. So gewählt; sie steht auf „Heute“ unter „Besonderer Tag“.

### Code und Tests

- `app.js` Block „Gewicht“ in `zeichneHeute`, `miniKurve` wird durch die neue Kurve ersetzt; `styles.css`.
- Reine Hilfen testen: Kurzwort je Bewertung (Zahlen aus `GRENZEN`), Position des Punkts auf der Skala inklusive
  Festhalten am Rand, Auswahl des Zustands (keine/eine/mehrere Wägungen, Kurve ja/nein).

---

## 3. Verlauf: „Tempo pro Woche“ (A: Punkte über der Zeit)

Ersetzt in `tempoKarte` (`js/verlauf.js`) das Säulendiagramm `tempoDiagramm` und den Erklärsatz.

### Aufbau

1. **Kopf** wie heute: „Tempo pro Woche“, darunter „Ø 0,83 % pro Woche · 13 von 14 Wochen im sicheren Bereich“
   (Teil nach „·“ nur, wenn mindestens eine Woche bewertet ist).
2. **Diagramm auf Millimeterpapier** (`.papier` wie die Gewichtskurve), Zeichenfläche 340 × 176, oben 10, unten 22:
   - **Zeitachse:** gleicher Anfang und gleiches Ende wie die Gewichtskurve darüber (erste Wägung im Zeitraum bis
     heute bzw. letzte Wägung), gleiche Ränder links und rechts, damit die Punkte unter den Wägungen der Kurve stehen.
     Beschriftung wie im PDF (`zeitAchse`: Montage, jeder zweite Montag oder Monate). Gibt es darüber keine Kurve
     (weniger als 2 Wägungen im Zeitraum), beginnt die Achse bei der Wägung vor dem ältesten Punkt.
   - **Höhe:** von 0 (oder tiefer, wenn es Zunahmen gibt: Minimum − 0,1, auf 0,5 abgerundet) bis mindestens 2,5
     (oder Maximum + 0,2, auf 0,5 aufgerundet). Hilfslinien alle 0,5 %, Zahlen bei 0,5 und ganzen Werten, die oberste
     ganze Zahl mit „ %“. Die Nulllinie ist kräftiger.
   - **Band** `abnahmeMin` bis `abnahmeMax` in `--akzent-hell`, oben links darin „sicherer Bereich“.
   - **Punkte:** jede Wägung im gewählten Zeitraum ein Punkt (nicht mehr nur die letzten 12), r 3,5, die neueste r 5
     mit ihrem Wert („0,9 %“) links darüber. Farbe nach `wochenRaten`: gut Grün, langsam Bernstein, zu-schnell Rot,
     neutral Grau. Eine dünne graue Linie verbindet die Punkte.
   - **Durchschnitt:** kurzer gestrichelter Strich am rechten Rand mit „Ø 0,83“.
3. **Erklärsatz** darunter:
   - Mit Freigabe: „Jeder Punkt ist eine Wägung, auf 7 Tage umgerechnet. Grün: im sicheren Bereich, Bernstein:
     langsamer, Rot: schneller als 2 %. Unter der Nulllinie: zugenommen.“ Gibt es graue Punkte, folgt
     „Grau: vor der Freigabe, noch nicht bewertet.“
   - Ohne Freigabe: „Jeder Punkt ist eine Wägung, auf 7 Tage umgerechnet. Bewertet wird erst ab der Freigabe vom
     Tierarzt; schneller als 2 % ist immer rot. Unter der Nulllinie: zugenommen.“
4. **„Alle Wochen“** (aufklappbar) bleibt unverändert.

Antippen einzelner Punkte ist nicht vorgesehen (die genauen Werte stehen unter „Alle Wochen“); am PC zeigt ein
`<title>` je Punkt Datum und Wert.

### Maße aus dem Entwurf (375 px, 3 Monate)

433 px statt heute 321 px.

### Code und Tests

- `js/verlauf.js`: `tempoDiagramm` neu, `tempoKarte` (Erklärsatz), `styles.css`.
- Tests in `tests/verlauf.test.js`: Höhe der Achse (nur Abnahme bis 1,4 % → 0 bis 2,5; Zunahme 0,3 % → ab −0,5;
  Ausreißer 2,8 % → bis 3,0), alle Wägungen im Zeitraum werden gezeichnet, Farbklassen je Bewertung,
  Erklärsatz mit und ohne Freigabe, „Grau“-Satz nur bei neutralen Punkten.

---

## 4. PDF für den Tierarzt: „Kalorien pro Tag, Durchschnitt je Woche“ (B, weicher Übergang)

Ersetzt das Säulendiagramm `kcalDiagramm` (`js/verlauf.js`, nur im PDF benutzt) und seine Legende in `js/bericht.js`.

### Aufbau

1. **Überschrift** wie heute: „Kalorien pro Tag, Durchschnitt je Woche“.
2. **Legende:** Punkt „Wochen-Ø (inkl. Leckerli)“; mit Freigabe im Zeitraum zusätzlich Strich „Freigabe“ und Fläche
   „±10 % gilt als eingehalten“; schmaler Balken „Leckerli-Anteil“.
3. **Diagramm** (Zeichenfläche 340 × 214 statt 190; Ränder links 34, rechts 52, oben 12; Hauptteil bis 148,
   Zeitachse darunter, Leckerli-Spur von 186 bis 206):
   - **Achse eng, nicht ab 0:** Bereich aus den Wochenwerten und, mit Freigabe, Freigabe − 15 % bis + 15 % (damit das
     Band ganz hineinpasst); ohne Freigabe Werte − 10 % bis + 8 %. Auf 20 kcal gerundet, mindestens 80 kcal Spanne.
     Hilfslinien alle 20 kcal, bei mehr als 120 kcal Spanne alle 40. Oben links klein: „Achse beginnt bei 200 kcal“.
   - **Wochenwerte:** je Kalenderwoche (Montag bis Sonntag) ein Punkt in der Wochenmitte, r 3,2 (ab 21 Wochen 2,4),
     verbunden mit einer Linie in `--akzent`. Wochen ohne Eintrag bleiben leer, die Linie ist dort unterbrochen.
   - **Freigabe:** schwarze Stufenlinie wie heute, Beschriftung „Freigabe“ rechts. Sie springt **am Tag** der neuen
     Freigabe (nicht mehr an der Wochengrenze).
   - **Band ±10 %** (`spielraum`) um den Bezugswert der Woche (siehe unten), blass grün. An jeder Wochenmitte liegt
     es genau bei Bezugswert ± 10 %; zwischen zwei Wochenmitten geht es weich über (Smoothstep). Ändert sich nichts,
     ist das Band gerade. Es beginnt am Tag der ersten Freigabe und läuft von dort gerade (erste Freigabe ± 10 %)
     bis zur ersten Wochenmitte mit Bezugswert. Für das Band zählt bei Wochen ohne Eintrag der Durchschnitt der
     Freigaben über alle 7 Tage.
   - **Außerhalb ±10 %:** Punkt in Bernstein, darüber der Wert in kcal (klein, fett).
   - **Leckerli-Spur:** je Woche ein schmaler Balken = Anteil der Leckerli an den kcal der Woche, Höhe von 0 bis 15 %
     (darüber abgeschnitten). Gestrichelte Linie bei `leckerliMax` mit „10 %“ rechts, „Leck.“ links. Über 10 %
     volle Farbe, sonst 75 %.
4. **Ohne Freigabe im Zeitraum** (so am 13.11.2026): nur Punkte und Linie, keine Stufe, kein Band, darunter der Satz
   „Noch keine Freigabe im Zeitraum: nur die Wochenwerte, ohne Band.“
5. In der App-Ansicht der Übersicht zeigt Antippen je Woche weiter den Tooltip
   („Woche ab 3.11.: Ø 231 kcal/Tag, davon 5 Leckerli · freigegeben 220“).

### Bezugswert je Woche (neu)

Bisher galt für eine ganze Woche die Freigabe vom Sonntag. Neu: **der Durchschnitt der Freigaben, die an den
eingetragenen Tagen dieser Woche galten** (dieselben Tage, aus denen der Wochen-Ø der kcal stammt).
- Woche ohne Wechsel: die Freigabe dieser Woche, also wie bisher.
- Woche mit Wechsel am Mittwoch, alle 7 Tage eingetragen: (2 × alt + 5 × neu) ÷ 7.
- Woche, in der an einem eingetragenen Tag noch keine Freigabe galt (Woche der ersten Freigabe): kein Bezugswert,
  keine Bernstein-Markierung; die Stufe und das Band beginnen trotzdem am Tag der Freigabe.

Warum: Der Punkt ist ein Durchschnitt über die Tage der Woche; verglichen wird er mit dem Durchschnitt dessen, was an
diesen Tagen freigegeben war. Sonst würde z. B. die Woche der ersten Freigabe an der neuen Menge gemessen, obwohl
die Katze die halbe Woche noch normal gefressen hat, und als „mehr als 10 % daneben“ markiert. Das Band geht dadurch
von selbst über den Tag des Wechsels.

### Maße und Druck

Im Druck 150 mm breit wie heute, dadurch etwa 94 mm hoch statt 84 mm. Prüfen mit echtem A4-Druck
(Chrome `Page.printToPDF`, Seitenbilder): nichts überlappt, Überschrift und Legende bleiben beim Diagramm, Zeiträume
„alles“, „12 Wochen“, „4 Wochen“; dazu Schwarzweiß (Band hellgrau, Ausreißer an der Zahl erkennbar).

### Code und Tests

- `js/verlauf.js`: `kcalDiagramm` neu (gleicher Name, gleicher Aufruf aus `js/bericht.js`); `wochenKcal` liefert
  zusätzlich die eingetragenen Tage bzw. den Bezugswert. Reine, exportierte Hilfen für Bezugswert und Bandpunkte.
- `js/bericht.js`: Legende; `styles.css` (Druck und Bildschirm).
- Tests in `tests/verlauf.test.js` und `tests/bericht.test.js`: Bezugswert (ohne Wechsel; Wechsel Mittwoch;
  Woche der ersten Freigabe ohne Bezug; Woche mit nur 3 eingetragenen Tagen), Band an jeder Wochenmitte genau ± 10 %,
  ohne Wechsel gerade, Stufe am Tag der Freigabe, „Achse beginnt bei …“ (auf 20 gerundet, Spanne mindestens 80),
  leere Woche unterbricht die Linie, ohne Freigabe kein Band und der Satz darunter, Legende nur mit passenden Einträgen.

---

## Reihenfolge und Zeitpunkt

1. „Gefüttert“, 2. „Letzte Messung“, 3. „Tempo pro Woche“, 4. PDF. Jede Stelle ist ein eigener Schritt mit eigener
   Version (Version in `index.html`, `CACHE_NAME` in `sw.js`, Versions-Test in `tests/wissen.test.js`), Tests zuerst
   (rot, dann grün), danach Prüfung im Browser mit der Demo (`/?demo`) und mit dichten eigenen Testdaten.
2. Alle vier **nach dem Tierarzttermin am 13.11.2026.** Das PDF für den Termin ist seit 0.36.7 in Ordnung; am 13.11.
   gibt es noch keine Freigabe, das neue PDF zeigt seine Stärke (Band, Abweichung) erst danach.
3. Vor dem Bau den Halter noch einmal auf das Risiko hinweisen, falls doch vor dem Termin gebaut werden soll.

## Bedacht und verworfen

- **„Gefüttert“:** Ring (bewusst ersetzt); Napf, der sich füllt (ungenau); ein Balken je Sorte (zu viele Teile);
  Tages-Treppe über 0–24 Uhr (Entwurf C, braucht viel Platz); Mischung mit dreizeiligen Kacheln (340 px hoch);
  „noch 9“ im blassen Rest des Balkens (doppelt mit der Kachel); Gramm unter dem Balken (doppelt mit „Futter“).
- **„Letzte Messung“:** nur Skala (A, ohne Trend); Kurve mit Korridor (B: Der Korridor misst 8 Wochen, das Tempo
  nur die letzte Woche, bei „zu schnell“ lag der Punkt trotzdem im Korridor); drei Zahlen ohne Bild (C);
  Mischung in voller Höhe (288 px); Kopf zweispaltig (bei großer Schrift 151 px nur für den Kopf); Tacho;
  Pfeil hoch/runter; Kurve und Skala nebeneinander (zu eng); grüne Fläche in der Kurve (wirkt wie der Korridor);
  Achsenwerte weglassen (spart nur gut 10 px, dann fehlt der Zeitraum).
- **„Tempo pro Woche“:** Kacheln je Monat (B, Trend schwer zu sehen, bei „Alles“ hoch); eine Skala für alle Wochen
  (C, ohne zeitliche Reihenfolge); Säulen wie heute, nur dicker; Linie mit Fläche (wird mit der Gewichtskurve
  verwechselt); Durchschnitt als Linie quer durch die Punkte (unruhig).
- **PDF:** Abweichung in % (A: ohne Freigabe, also am 13.11., nur eine Zahlenreihe); Raster je Monat (C, Trend
  schlecht sichtbar, zweite ähnliche Tabelle); Säulen schmaler und heller (Achse ab 0 bleibt); ein Wert je Tag
  (bei 8 Monaten 240 Werte); Kalender-Farbfelder (schwarzweiß schwer lesbar); schwarze Linie auch weich (sähe aus,
  als hätte der Tierarzt die Menge langsam geändert); Übergang über zwei oder mehr Wochen (zeigt eine Freigabe, die es
  nie gab); nur Ecken abrunden (Kante bleibt).

## Entscheidungen beim Schreiben (nicht in den Entwürfen, vom Halter mit „So bauen“ angenommen)

1. **PDF: Bezugswert je Woche als Durchschnitt der Freigaben an den eingetragenen Tagen** statt „Freigabe vom
   Sonntag“; dazu die Stufe am echten Tag und kein Bezug in der Woche der ersten Freigabe. Ändert, welche Woche
   im PDF als „mehr als 10 % daneben“ markiert wird (nur Wochen mit Wechsel). Alternative: Sonntags-Regel lassen,
   dann liegt das Band in der Woche des Wechsels teils vor der schwarzen Stufe.
2. **PDF: Linie zwischen den Wochenpunkten an leeren Wochen unterbrochen** (im Entwurf durchgezogen).
3. **„Gefüttert“ an vergangenen Tagen: Kachel „Darunter“** statt „Noch“.
4. **„Letzte Messung“ mit nur einer Wägung:** neuer Satz „Das Tempo erscheint ab der zweiten Wägung.“ statt
   „gewogen am …“ (das Datum steht schon im Kopf).
5. **„Tempo pro Woche“:** Zeitachse und Ränder genau wie die Gewichtskurve darüber; alle Wägungen im Zeitraum statt
   der letzten 12; graue Punkte bekommen einen eigenen Satz; Punkte nicht antippbar.

## Dem Bau überlassen

- Namen der neuen Funktionen und Klassen; ob Hilfen in `js/zusammenfassung.js` oder `js/verlauf.js` liegen.
- Ob der Balken bei „Gefüttert“ beim Öffnen wächst (nur mit `ohneBewegung()`-Prüfung).
- Ob „Ø 0,83“ rechts im Tempo-Diagramm in den Rand der Gewichtskurve passt; sonst innen an den rechten Rand.
- Tooltip im PDF in Wochen mit Wechsel (z. B. „freigegeben 250, ab 5.11. 220“).
- Vorlesetext (`aria-label`) der Karte „Letzte Messung“.
- Feinheiten der Abstände, solange die gemessenen Höhen etwa gleich bleiben.
