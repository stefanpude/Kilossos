# Kilossos – neue Oberfläche („Hybrid“), Bauplan

_Stand: 02.11.2026 · Grundlage: Brainstorming mit Stefan und das klickbare Muster
[`2026-11-02-oberflaeche-muster.html`](2026-11-02-oberflaeche-muster.html) (im Browser öffnen)_

## 1. Worum es geht und warum

Kilossos funktioniert fachlich, wirkt aber nüchtern: dunkel (folgt dem Dunkelmodus des Handys), viel Text,
Diagramme im Excel-Stil, keine Bewegung, Auswahlen als lange Listen mit Ankreuzpunkten. Stefan hat die
Vergleichs-App **MeowFit** (Play Store) als Vorbild für die Darstellung gewählt und ein Muster gesehen, das
MeowFits Darstellungsideen mit den Stärken von Kilossos verbindet. Sein Urteil: **hellere Farben, hellere
Darstellung und Animationen sind „viel freundlicher“.** Zusätzlich will er, dass **alles, wo mehrere Einträge
stehen, zugeklappt ist und sich aufklappen lässt**, damit nicht „die ganze Seite vollgeballert“ wird, und ein
**Profilbild des Tieres**.

Die App soll sich anfühlen wie eine aktuelle Handy-App: ruhig, hell, freundlich, auf einen Blick lesbar.
Die medizinische Sorgfalt (Grenzen mit Quelle, Freigabe vom Tierarzt) bleibt dabei sichtbar.

## 2. Ziele

1. **Helles, warmes Aussehen** wie im Muster: cremefarbener Hintergrund, weiße Karten mit sehr runden Ecken
   und weichem Schatten, Orange als Akzent, Salbeigrün für „gut/sicher“, Gelb-Ocker für Hinweise.
2. **Animationen**: Ring füllt sich und die Zahl zählt hoch, Kurven zeichnen sich ein, Balken wachsen,
   Fenster gleiten von unten herein, Seiten blenden weich ein, Knöpfe geben beim Antippen kurz nach.
   Wer am Handy „Bewegung reduzieren“ eingeschaltet hat, bekommt keine Animationen (`prefers-reduced-motion`).
3. **Aufklappbare Bereiche überall, wo mehrere Einträge stehen**: zugeklappt nur eine Zusammenfassungszeile,
   aufgeklappt die Einträge; verschachtelt, wo sinnvoll (Tag → Mahlzeiten).
4. **Auswahlmenüs statt Ankreuzlisten**, wenn es mehr als eine Möglichkeit gibt: ein Feld mit dem gewählten
   Wert und Pfeil; beim Antippen klappt ein Menü auf, die Auswahl hat einen Haken.
5. **Profilbild des Tieres**: antippen → Foto wählen (Galerie oder Kamera) → rund oben auf „Heute“.
6. **Neue Bausteine auf „Heute“ und „Verlauf“** wie im Muster (Ring, Kacheln, weiche Kurve mit Infoblase,
   Zeitraum-Umschalter).

## 3. Nicht-Ziele (diesmal nicht)

- Keine neuen Rechenregeln, keine geänderten Grenzwerte, keine neuen Warnungen. `js/rechnen.js` bleibt fachlich unverändert.
- Kein zweites Tier in der Oberfläche (Zuki kommt mit Schritt 7). Das Profilbild wird aber schon pro Tier gespeichert.
- Keine Vorher-Nachher-Fotoreihe (später, Kandidat für Kilossos Plus).
- Keine Zusatzbibliotheken, kein Build-Schritt, keine Schriften aus dem Netz. Alles bleibt reines HTML/CSS/JS und offline.
- Kein Barcode-Scan, keine Futter-Filterknöpfe im Listen-Dialog (später).
- Keine Änderung am PDF-Bericht außer dem Profilbild (siehe 5.7).

## 4. Darf auf keinen Fall passieren (Anti-Ziele)

- **Ein „Achtung“-Warnhinweis darf nie zugeklappt oder versteckt sein.** Warnungen der Art `achtung`
  (zu schnelle Abnahme, unter der Untergrenze usw.) stehen immer offen mit vollem Text und Quelle.
  Nur Warnungen der Art `hinweis` werden als einzeilige, aufklappbare Karte gezeigt.
- **Ohne Freigabe vom Tierarzt darf kein Ziel und kein Fortschritt in Prozent erscheinen.** Der Ring zeigt
  ohne Freigabe keinen Füllstand gegen ein Ziel und kein „noch offen“ (Projektregel: ohne Freigabe nur
  Aufzeichnung, keine Mengenvorschläge).
- Keine Daten verlieren: bestehende Daten im Speicher (`kilossos-daten`) und alte Sicherungsdateien müssen
  weiter funktionieren.
- Kein Nachbau von MeowFit: keine Grafiken, Logos, Texte oder Farben 1:1 übernehmen. Wir übernehmen Ideen,
  nicht das Aussehen im Detail.
- Kein Element darf durch die Animation schwerer bedienbar oder langsamer werden. Das Speichern einer Mahlzeit
  bleibt so schnell wie heute.

## 5. Was gebaut wird

### 5.1 Farben und Grundstil (`styles.css`)

- Farbwerte und Karten-Stil wie im Muster (`:root` dort). Die bestehenden Variablennamen in `styles.css`
  (`--hintergrund`, `--flaeche`, `--text`, `--text-leise`, `--akzent`, `--gut`, `--warnung`, `--gefahr`, `--rand`,
  `--reihe-1/2`) bleiben erhalten und bekommen neue Werte; neu dazu kommen u. a. `--flaeche-2`, `--akzent-hell`,
  `--gut-hell`, `--warnung-hell`, `--schatten`, `--rund`.
- **Hell/Dunkel: siehe Abschnitt 9** (Standard hell, Umschalter in „Mehr“).
- Kontraste: Text auf Flächen mindestens 4,5 : 1. Diagrammfarben weiterhin auf Farbsehschwächen prüfen.

### 5.2 Navigation und Seitenwechsel

- Die untere Leiste behält **fünf Bereiche** (Heute, Gewicht, Verlauf, Futter, Mehr). Das Muster hatte vier,
  „Gewicht“ bleibt aber, weil dort gewogen wird. _(Entscheidung von Claude.)_
- Jeder Bereich bekommt ein kleines Symbol über dem Wort. Der aktive Bereich ist orange und hebt sich leicht an (Animation).
- Beim Wechsel blendet die neue Ansicht von unten ein (ca. 0,35 s).

### 5.3 „Heute“

Von oben nach unten, wie im Muster:

1. **Kopf**: Profilbild (5.6), Name, Gewicht (letzter Eintrag), Datum. Die Tagwahl (‹ Heute ›) bleibt erhalten.
2. **Sicherungs-Erinnerung** wie bisher (Funktion unverändert, neuer Stil).
3. **Warnungen**: `achtung` offen und vollständig; `hinweis` als einzeilige Karte mit Kurztitel, beim Antippen
   klappt Text + Quelle auf. Für jeden Hinweis braucht es einen **Kurztitel** (z. B. „Diätfutter mit dem
   Tierarzt besprechen“). Die Kurztitel stehen in der Oberfläche (`app.js`), nicht in `rechnen.js`.
4. **Kalorien-Karte mit Ring**:
   - **Mit Freigabe**: Ring füllt sich auf `kcal / Freigabe`; in der Mitte die kcal, darunter „von X kcal“;
     rechts Gefüttert / Freigabe / Noch offen. Über der Freigabe: Ring voll und Gelb-Ocker, „Noch offen“ wird
     zu „darüber: N kcal“.
   - **Ohne Freigabe**: Ring ohne Füllstand (nur die graue Bahn), in der Mitte die kcal, darunter „g Futter“;
     rechts nur Gefüttert (kcal) und Menge (g) plus der Satz „Ziel kommt mit der Freigabe vom Tierarzt“.
   - „ca.“-Kennzeichnung wie bisher, wenn Futter ohne genau abgelesenen Wert dabei ist.
   - Knopf „＋ Mahlzeit eintragen“ in der Karte.
5. **Zwei Kacheln**: Gewicht (letzter Wert, Abnahme pro Woche aus dem bestehenden Trend, Mini-Kurve der
   letzten Wägungen) und Leckerli (kcal heute, Anteil an den Tages-kcal gegen die 10-%-Grenze als Balken).
   Ohne genug Wägungen zeigt die Gewichtskachel nur den Wert.
6. **Mahlzeiten heute** als aufklappbare Karte: zugeklappt „N Einträge · X kcal · zuletzt HH:MM“.
   Aufgeklappt die Mahlzeiten mit Symbol (Nass/Trocken/Leckerli), Name, Uhrzeit, Gramm, kcal und dem
   Lösch-Knopf wie heute. Bei 0 Einträgen nicht aufklappbar, sondern „Noch keine Mahlzeit an diesem Tag.“

### 5.4 „Gewicht“

- Große Karte oben wie bisher (aktuell, Änderung, Trend) im neuen Stil.
- Die Einträge **nach Monaten gruppiert**, jeder Monat aufklappbar („Oktober 2026 · 4 Wägungen · Ø 9,10 kg“).
  Der aktuelle Monat ist aufgeklappt, ältere zugeklappt. Jede Zeile zeigt Tag, kg und eine kleine Marke mit der
  Änderung zur Wägung davor.

### 5.5 „Verlauf“

- Kopf wie im Muster (kleines Profilbild + „Verlauf“).
- **Zeitraum-Umschalter** mit gleitender Markierung: „1 Monat · 3 Monate · Alles“. Er gilt für alle Teile der Seite.
- **Gewichtskurve** nach Muster: weiche Linie, die sich einzeichnet, Fläche darunter mit Farbverlauf, grüner
  Sicherheitskorridor (Logik aus `gewichtDiagramm` bleibt), gestrichelte Ziellinie nur mit Freigabe und nur, wenn
  sie im sichtbaren Bereich liegt. Antippen oder Ziehen zeigt eine Infoblase mit kg und Datum (ersetzt den
  bisherigen Tooltip). Oben: aktueller Wert und Marke mit der Änderung im Zeitraum.
- Die bisherigen Kennzahl-Kacheln (Start, Jetzt, Abgenommen, Ø pro Woche) bleiben, im neuen Kachel-Stil.
- **Abnahme pro Woche** als aufklappbare Karte: zugeklappt „Ø X % · N von M Wochen im sicheren Bereich“.
  Aufgeklappt alle Wochen des Zeitraums, neueste oben, mit Balken (voll = 2 %) und Marke. Grün im Bereich
  0,5–2 %, Gelb-Ocker darunter, Rot darüber. Die Balken wachsen beim Aufklappen.
  Das bisherige Balkendiagramm „Abnahme pro Woche“ entfällt (die Liste ersetzt es).
- **Futter pro Tag** (neu) als aufklappbare Karte: zugeklappt „Ø X kcal · N Tage · K× über der Freigabe“
  (ohne Freigabe nur „Ø X kcal · N Tage“). Aufgeklappt nach Wochen gruppiert („Diese Woche“, „Letzte Woche“,
  danach „KW 42“ usw.), jeder Tag eine Zeile mit Balken (voll = Freigabe; ohne Freigabe = höchster Tag im
  Zeitraum) und kcal. **Jeder Tag ist einzeln aufklappbar** und zeigt seine Mahlzeiten. Tage über der Freigabe
  in Gelb-Ocker. Das bisherige Diagramm „Kalorien pro Tag“ (Wochendurchschnitt) entfällt.
- Hinweis-Text, wenn noch zu wenig Daten da sind, wie bisher.

### 5.5a „Futter“ und Futterliste

- Die eigenen Sorten nach Art gruppiert (Nassfutter, Trockenfutter, Leckerli), jede Gruppe aufklappbar
  („Nassfutter · 2 Sorten“). Gruppen mit Einträgen sind anfangs offen, wenn es insgesamt höchstens 5 Sorten
  sind, sonst zu. Jede Sorte als Zeile mit Symbol, Name, kcal/100 g und Quellen-Marke wie heute; Antippen
  öffnet das Bearbeiten-Blatt wie bisher.
- Im Blatt „Aus der Futterliste wählen“ werden die Gruppen (Diätfutter / Weitere) aufklappbar; bei einer
  Suche klappen alle Gruppen mit Treffern automatisch auf.

### 5.6 Profilbild

- **Antippen** des runden Bildes auf „Heute“ öffnet die Dateiauswahl (`<input type="file" accept="image/*">`).
  Auf Android bietet das Galerie und Kamera an.
- Das Bild wird in der App **mittig quadratisch zugeschnitten, auf 256 × 256 px verkleinert und als JPEG
  (Qualität 0,8) gespeichert**, wie im Muster. Danach eine kurze Bestätigung.
- Ohne Bild: Katzen-Symbol auf hellem Akzent-Grund mit kleinem Kamera-Zeichen.
- Ein gesetztes Bild lässt sich ändern (erneut antippen) oder entfernen. Dafür erscheint beim Antippen ein
  kleines Auswahlmenü: „Foto ändern“ / „Foto entfernen“; ohne Bild direkt die Dateiauswahl.
- **Datenmodell**: neues, optionales Feld `foto` am Tier (`tiere[i].foto`, Text im Format
  `data:image/jpeg;base64,…`). Kommentar oben in `js/daten.js` ergänzen. Es landet automatisch in der
  Sicherung. Beim Einlesen einer Sicherung wird `foto` geprüft: nur `data:image/jpeg` oder `data:image/png`,
  höchstens 300 KB; sonst wird das Feld verworfen (die übrigen Daten werden trotzdem eingelesen).
- Speicher voll (localStorage-Fehler beim Speichern): Bild nicht übernehmen, verständliche Meldung zeigen,
  übrige Daten unverändert.
- Im **Demo-Modus** kein Foto (Symbol), Antippen zeigt den Hinweis, dass das in der Demo nicht geht.
- Das Bild erscheint auch klein im Kopf von „Verlauf“ und im **PDF-Bericht** neben dem Namen (rund, ca. 2 cm).

### 5.7 Fenster und Auswahlmenüs

- Alle bisherigen `<dialog>`-Fenster (Mahlzeit, Gewicht, Futtersorte, Futterliste, Freigabe) erscheinen als
  **Blatt, das von unten hereingleitet**, mit Griff oben, abgedunkeltem Hintergrund und runden oberen Ecken.
  Antippen des Hintergrunds schließt das Blatt (wie „Abbrechen“). Das `<dialog>`-Element und die Formular-Logik
  bleiben; es ändert sich vor allem der Stil.
- **Auswahlmenü-Baustein** (ein wiederverwendbares Stück in `app.js` oder eigenem Modul `js/auswahl.js`):
  Feld zeigt gewählten Wert (+ kleine Zusatzzeile), Pfeil dreht sich, Menü klappt mit leichter Feder-Animation
  auf, gewählter Eintrag mit Haken, Bedienung auch per Tastatur (Pfeiltasten, Enter, Escape), passende
  ARIA-Rollen (`menu`/`menuitemradio` oder `listbox`/`option`). Gibt es nur **eine** Möglichkeit, wird kein
  Menü gezeigt, sondern der Wert fest angezeigt.
  Einsatz:
  - Mahlzeit → Futtersorte (Zusatzzeile: Art · kcal/100 g; letzter Eintrag im Menü: „＋ Aus der Futterliste wählen“)
  - Futtersorte → Art (Nass/Trocken/Leckerli) und „Woher stammt der Wert?“
  - Mehr → Zeitraum der Tierarzt-Übersicht (ersetzt das `<select>`)
  Pflichtfelder bleiben Pflichtfelder (Fehlermeldung wie heute, wenn nichts gewählt ist).
- **Mahlzeit-Fenster**: Futtersorte (Menü), Uhrzeit (bleibt ein echtes Uhrzeit-Feld, vorbelegt mit jetzt; die
  Knöpfe „Morgens/Mittags/…“ aus dem Muster entfallen, weil die App die genaue Uhrzeit speichert),
  Menge als große Zahl mit − / ＋ (Schritte 5 g; eintippen bleibt möglich), darunter die kcal-Vorschau live.
- Nach dem Speichern eine kurze Bestätigung unten („✓ Gespeichert“).

### 5.8 Aufklapp-Baustein

- Ein Baustein für alle aufklappbaren Karten (Kopfzeile mit Zusammenfassung + runder Pfeil, Inhalt klappt mit
  Höhen-Animation auf). Als `<button aria-expanded>` in der Kopfzeile umsetzen, damit Tastatur und Vorlese-
  funktion klappen. Verschachtelung muss gehen (Tag in „Futter pro Tag“).
- Der Auf/Zu-Zustand muss nicht gespeichert werden; nach dem Neuzeichnen (z. B. nach dem Speichern einer
  Mahlzeit) sollen aber offene Bereiche offen bleiben.

### 5.9 Animationen (Übersicht)

| Was | Wie | Dauer |
|---|---|---|
| Seitenwechsel | einblenden + 12 px von unten | 0,35 s |
| Ring | Füllstand von 0, Zahl zählt hoch | 1,0 s |
| Kurve | zeichnet sich ein, Fläche blendet ein | 1,1 s |
| Balken | wachsen von 0 beim Aufklappen | 0,7–0,8 s |
| Aufklappen | Höhe | 0,35 s |
| Blatt | gleitet von unten | 0,38 s |
| Menü | federt auf | 0,2 s |
| Knöpfe | drücken sich leicht ein | 0,12 s |
| Profilbild | springt ein | 0,45 s |

Alle Animationen nur mit CSS-Übergängen / einfachem `requestAnimationFrame`; bei `prefers-reduced-motion: reduce` sofort.

## 6. Rahmenbedingungen

- Reines HTML/CSS/JS ohne Zusatzpakete; ES-Module wie bisher; läuft offline über den Service Worker.
- Nach den Änderungen: `CACHE_NAME` in `sw.js` hochzählen (jetzt `kilossos-v13`), neue Dateien in `DATEIEN`
  eintragen, Version in `index.html` (`#version`) auf **0.7.0**.
- `npm test` muss weiter grün sein (jetzt 59 Tests). Neue Tests für: Prüfung/Verwerfen von `foto` beim Einlesen,
  Zusammenfassungen (Ø-Abnahme, Wochen im sicheren Bereich, Ø kcal, Tage über der Freigabe) – diese Rechnungen
  als reine Funktionen in einem Modul ohne DOM (z. B. `js/zusammenfassung.js`), damit sie testbar sind.
- Demo-Modus (`?demo`) muss alle neuen Teile zeigen und nichts im echten Speicher ändern.
- Prüfen auf einem Handybildschirm (375 px breit) und am Desktop, jeweils in Hell und Dunkel.
- Commits mit `-c user.email=347438024+stefanpude@users.noreply.github.com`; `git push` erst nach Stefans OK.
- Codex arbeitet am Projekt mit: vor dem Bau klären, dass Codex nicht gleichzeitig an `index.html`, `app.js`,
  `styles.css`, `js/verlauf.js`, `js/daten.js` arbeitet.

## 7. Dem Bauenden überlassen

- Aufteilung in Dateien (z. B. `js/auswahl.js`, `js/aufklappen.js`, `js/zusammenfassung.js`), solange `app.js`
  übersichtlich bleibt.
- Genaue Symbole in der Leiste und bei den Futterarten (Emoji oder eigene kleine SVGs).
- Reihenfolge des Umbaus, solange jede Zwischenstufe lauffähig bleibt.
- Feinheiten von Abständen, Schriftgrößen und Kurvenglättung, solange es dem Muster entspricht.

## 8. Entscheidungen nach der Prüfung (von Claude, zum Gegenlesen)

Ein unabhängiger Prüfer hat den Bauplan gelesen. Diese Punkte hat Claude so festgelegt, immer nach der
Regel „ohne Freigabe nur Aufzeichnung“ und **ohne `js/rechnen.js` fachlich zu ändern**:

1. **„Woche“ in „Abnahme pro Woche“** = Abstand zwischen zwei Wägungen, auf 7 Tage umgerechnet – genau wie
   heute in `abnahmeDiagramm`. Die Zeile trägt das Datum der späteren Wägung.
2. **Farben in „Abnahme pro Woche“**:
   - **Rot (über 2 %/Woche) gilt immer**, auch ohne Freigabe – das ist eine Sicherheitsgrenze.
   - **Grün (0,5–2 %) und Gelb-Ocker (unter 0,5 %) nur für Wochen ab der ersten Freigabe.** Ohne Freigabe sind
     diese Zeilen neutral (grau), und die Zusammenfassung lautet nur „Ø X % pro Woche“ ohne „im sicheren Bereich“.
   - Balken: voll = 2 %. Zunahme (negativer Wert) zeigt einen leeren Balken und die Marke „+X %“.
3. **Leckerli-Kachel** rechnet wie `warnungen()`: Anteil an max(Tages-kcal, Freigabe).
   Ohne Freigabe zeigt die Kachel für den **laufenden Tag** nur die Leckerli-kcal und den Satz „wird am
   Tagesende bewertet“; für vergangene Tage den Anteil an den Tages-kcal. Rot/Gelb nur, wenn die Warnung
   `leckerli` in `warnungen()` für diesen Tag tatsächlich anschlägt – Kachel und Warnung widersprechen sich nie.
4. **„Über der Freigabe“** gilt erst ab **+10 % Spielraum** (`GRENZEN.spielraum`), wie der Hinweis
   `ueber-freigabe`. Darunter ist der Ring voll in der normalen Farbe und zeigt „darüber: N kcal“; ab +10 %
   wird er Gelb-Ocker. Dasselbe gilt für „K× über der Freigabe“ und die gelben Tage in „Futter pro Tag“.
5. **„Futter pro Tag“ zählt nur Tage mit mindestens einem Eintrag** und **ohne den heutigen Tag** für Ø und
   „K× über“. Der heutige Tag erscheint in der Liste (oben, „Heute“), zählt aber nicht in der Zusammenfassung.
6. Warnungen der Art `sofort` sind wie `achtung` **immer offen**.

## 9. Hell und Dunkel (Stefans Entscheidung, 02.11.2026)

- **Standard ist immer „Hell“** – auch wenn das Handy auf dunkel steht.
- In **„Mehr“** gibt es eine Karte **„Darstellung“** mit einem Auswahlmenü (Baustein aus 5.7):
  **„Hell“ · „Dunkel“ · „Wie das Handy“**. Die Wahl wirkt sofort, ohne Neuladen.
- „Wie das Handy“ folgt `prefers-color-scheme` und reagiert auch, wenn das Handy umschaltet, während die App offen ist.
- Umsetzung: Attribut `data-theme="hell" | "dunkel"` am `<html>`-Element; die dunklen Farben hängen an
  `[data-theme="dunkel"]` statt an der Media-Query. Die Wahl wird **vor dem ersten Zeichnen** gesetzt (kleines
  Skript im `<head>`), damit die App beim Start nicht kurz falsch aufblitzt. Auch `<meta name="theme-color">`
  passt sich an. _(Umsetzung: Entscheidung von Claude.)_
- Gespeichert wird die Wahl in einem **eigenen Speicherschlüssel `kilossos-anzeige`**, nicht in `kilossos-daten`:
  Sie ist eine Geräte-Einstellung, gehört nicht in die Sicherung und gilt auch im Demo-Modus. _(Entscheidung von Claude.)_
- Dunkle Farben nach dem Dunkel-Satz im Muster; Kontraste und Diagrammfarben in beiden Modi prüfen
  (Text mindestens 4,5 : 1, Farbsehschwächen).
