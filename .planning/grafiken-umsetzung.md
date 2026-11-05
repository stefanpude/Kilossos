# Grafiken 1–3 („Gefüttert“, „Letzte Messung“, „Tempo pro Woche“) – Bauplan

> **Für ausführende Agenten:** Ausführung „Subagent-driven“ (superpowers:subagent-driven-development), aber ohne
> Worktree und **ohne Commit durch die Bauenden**: Je Aufgabe baut ein frischer Agent im Arbeitsordner (TDD), ein
> zweiter frischer Agent prüft `git diff`, danach prüft Claude im Browser, committet, lädt hoch und lässt den Halter am
> Handy prüfen. Erst dann beginnt die nächste Aufgabe. Schritte mit `- [ ]`.

**Goal:** Die drei Grafiken auf „Heute“ und im „Verlauf“ werden so umgebaut, wie der Halter sie gewählt hat; jede ist
eine eigene Version (0.38.0, 0.39.0, 0.40.0).

**Architecture:** Rechnen in reinen, exportierten Funktionen (`js/zusammenfassung.js` für Werte, `js/verlauf.js` für
das Tempo-Diagramm), HTML in reinen Funktionen einer neuen Datei `js/heute-grafiken.js`, damit alles in Node testbar
ist. `app.js` setzt nur ein und zählt die kcal-Zahl hoch. Kein neues Datenformat, keine neuen Warnungen oder Grenzen.

**Tech Stack:** Vanilla-JS-Module, HTML-/SVG-Strings, `node --test` ohne Zusatzpakete (`npm test`).

**Spec:** `.planning/grafiken-auswahl.md` (freigegeben 05.11.2026, Nachtrag: Stellen 1–3 vor dem 13.11.). Beide
Dateien zusammen lesen. Aufbau und Maße der Entwürfe: `.superpowers/sdd/grafiken-entwuerfe/client.js` (`gefABk`,
`messKurve`, `skala(…, flach)`, `URTEIL_KURZ`, `messABflach`, `tempoA`) und `seite.css` (nur lokal, nicht im Repo).

## Global Constraints

- Die App schlägt nie eine Futtermenge vor und deutet keine an (auch nicht „noch 9 kcal = 3 g Trockenfutter“).
- Ohne Freigabe: kein Ziel, kein Füllstand, keine Bewertung „sicher“/„langsamer“. Rot über 2 % gilt auch ohne Freigabe.
- Keine Grenzwerte als Zahl im Code oder in Texten: alles aus `GRENZEN` in `js/rechnen.js`
  (`abnahmeMin` 0,5, `abnahmeMax` 2, `spielraum` 0,1). Zahlen in Texten daraus bilden.
- Kein Ring. Keine sich widersprechenden Aussagen auf einer Karte (kein Korridor auf „Letzte Messung“).
- Sichtbare Texte ohne das Wort „Wägung“ (Test `tests/wissen.test.js` „0.36.8“ scannt `app.js`, `index.html`,
  `js/*.js` ohne Kommentare, auch `aria-label` und `<title>`). Code-Namen und Kommentare dürfen „Wägung“ behalten.
- Farben: `--gut` grün, `--warnung` Bernstein, `--gefahr` rot, `--text-leise` grau (nicht bewertet), Flächen
  `--akzent-hell`. Grafiken in der App `aria-hidden="true"`; jede wichtige Aussage steht zusätzlich als Text.
- Alle Benutzertexte durch `sicher()` (HTML-Escaping), auch Zahlen aus Daten. Zahl + Einheit mit ` `.
- Je Version: `#version` in `index.html`, `CACHE_NAME` in `sw.js`, Versions-Test in `tests/wissen.test.js`;
  neue Dateien in `DATEIEN` (`sw.js`). Testdateien haben CRLF: Edit-Werkzeug nutzen, keine Heredocs mit Backslashes.
- Öffentliches Repo: in Tests und Kommentaren nur die Beispiel-Katze, keine persönlichen Daten.
- Prüfen je Aufgabe: 375 px Breite, 150 % Schrift, dunkel, keine Konsolenfehler, Kartenhöhe messen, Tippflächen ≥ 48 px.

## Review Focus

1. **„−0“ in Texten:** `zahl(-0)` ergibt in V8 „-0“. Genau getroffen muss „Noch 0 kcal“ lauten, gleiches Gewicht „±0 g“.
   Test in Aufgabe 1 (`kachel.kcal` ist `0`, nicht `-0`) und Aufgabe 2 (`diffText` bei gleichem Gewicht).
2. **Zwei Wägungen am selben Tag:** `tempoRueckmeldung` findet dann keine frühere → Zustand „ohne Vergleich“, kein
   Absturz, kein „NaN“. Test in Aufgabe 2.
3. **Mahlzeit mit gelöschter Sorte:** kein Stück, Gramm zählen in „Futter“, `unsicher` bleibt wahr. Test in Aufgabe 1.
4. **Alle Punkte gleich / nur ein Tempo-Wert:** Achse und Zeitachse dürfen nicht durch 0 teilen (`NaN` im SVG). Test in
   Aufgabe 3 (ein Wert, zwei gleiche Werte) und Aufgabe 2 (zwei gleiche Gewichte in 8 Wochen).
5. **Falsche Geräteuhr (letzte Wägung nach „heute“):** Zeitachse endet an der letzten Wägung (`achsenEnde`). Test in
   Aufgabe 3.

---

### Task 1: „Gefüttert“ als Mischung kompakt (0.38.0, Cache v76)

**Files:**
- Modify: `js/zusammenfassung.js` (neue Funktion neben `ringWerte`)
- Create: `js/heute-grafiken.js`
- Modify: `index.html:150-160` (Karte „Gefüttert“), `#version`
- Modify: `app.js:385-412` (`zeichneLineal` → nur Hochzählen), `app.js:506-527` (Block „Lineal“ in `zeichneHeute`)
- Modify: `styles.css:535-560` (`.kcal-zahl` 3rem, `.lineal*` entfernen, neue Klassen)
- Modify: `sw.js` (`CACHE_NAME` v76, `"js/heute-grafiken.js"` in `DATEIEN`)
- Test: `tests/zusammenfassung.test.js`, neu `tests/heute-grafiken.test.js`, `tests/wissen.test.js` (Version)

**Interfaces:**
- Produces: `gefuettertWerte({ mahlzeiten, futterNachId, freigabe, tag, heute })` in `js/zusammenfassung.js` →
  `{ kcal, gramm, unsicher, stuecke: [{ typ: "nass"|"trocken"|"leckerli", kcal }], arten: [{ typ, kcal }],
  ziel: null | { soll, marke, ueberdeckung: "keine"|"grau"|"bernstein", kachel: { wort: "Noch"|"Darüber"|"Darunter",
  kcal, warnung } } }`. `mahlzeiten` sind die des Tages (wie `mahlzeitenAm`, nach Uhrzeit sortiert).
- Produces: `gefuettertHtml(werte)` in `js/heute-grafiken.js` → HTML für `#kcal-text` (Balken, Legende, Kacheln bzw.
  ohne Freigabe Legende, Satz und Knopf „Warum kein Ziel?“). Kopfzeile und ca.-Hinweis bleiben in `index.html`.
- Produces: kleine Helfer in `js/heute-grafiken.js`, die Aufgabe 2 mitbenutzt: `zahl(wert, stellen)` (ohne „-0“),
  `sicher(text)`.

Regeln für `gefuettertWerte` (aus der Spec, „Gefüttert“ 3–5 und „Andere Zustände“):
- `kcal`, `gramm`, `unsicher` aus `tagesSumme`. Stücke nur für Mahlzeiten, deren Sorte existiert, in Mahlzeiten-
  Reihenfolge, `kcal = kcalFuer(gramm, kcalPro100g)`. `arten`: je vorkommender Art (Reihenfolge nass, trocken,
  leckerli) die Summe, `Math.round`.
- Ohne Freigabe: `ziel = null`.
- Mit Freigabe (`soll = freigabe.kcalProTag`): `marke = soll / Math.max(soll, kcal)`; `d = Math.round(kcal - soll)`;
  `d > 0` → Wort „Darüber“, `kcal = d`, `ueberdeckung` = `ringWerte(kcal, freigabe).ueber ? "bernstein" : "grau"`,
  `warnung` = gleicher Wert; sonst `ueberdeckung "keine"`, `warnung false`, `kcal = Math.abs(d)` (nie `-0`), Wort
  „Noch“, wenn `tag >= heute`, sonst „Darunter“.

- [ ] **Step 1: Failing tests für `gefuettertWerte`** in `tests/zusammenfassung.test.js` (Block „0.38.0“). Beispiel-
  Katze, Freigabe 220 kcal, Sorten nass (`kcalPro100g: 100`, Quelle `hersteller`) und trocken (`kcalPro100g: 400`):
  - 211 kcal heute → `ziel.kachel` `{ wort: "Noch", kcal: 9, warnung: false }`, `ueberdeckung "keine"`, `marke 1`.
  - 230 kcal → `{ wort: "Darüber", kcal: 10 }`, `ueberdeckung "grau"`, `marke` ≈ 220/230.
  - 242 kcal → `"grau"`; 243 kcal → `"bernstein"`, `warnung: true` (Grenze aus `GRENZEN.spielraum`).
  - 220 kcal → `{ wort: "Noch", kcal: 0 }` und `Object.is(kachel.kcal, 0)`; vergangener Tag → „Darunter“, `kcal 0`.
  - vergangener Tag 150 kcal → `{ wort: "Darunter", kcal: 70 }`.
  - ohne Freigabe → `ziel === null`, `arten` trotzdem gefüllt.
  - Mahlzeit mit unbekannter `futterId` (40 g) neben einer nassen (100 g) → `stuecke.length 1`, `gramm 140`,
    `unsicher true`.
  - nass 8:00, trocken 12:00, leckerli 18:00 → `stuecke.map(s => s.typ)` = `["nass","trocken","leckerli"]`,
    `arten` in derselben Reihenfolge; nur nass → `arten.length 1`.
- [ ] **Step 2:** `npm test` → die neuen Tests scheitern (Funktion fehlt; Platzhalter-Export für sauberes Rot ok).
- [ ] **Step 3:** `gefuettertWerte` nach den Regeln oben bauen; `ringWerte` wiederverwenden.
- [ ] **Step 4: Failing tests für `gefuettertHtml`** in `tests/heute-grafiken.test.js`:
  - mit Freigabe 211: enthält „Noch“ und `9 kcal`, `class="gef-marke"` mit `left:100.0%`, je Stück ein Element
    `gef-st nass|trocken|leckerli` mit `flex-grow`, Rest-Element `gef-st rest`, Kachel „Futter“ mit Gramm; kein
    „Warum kein Ziel?“.
  - 245: Kachel mit Klasse `warn`, Überdeckung `gef-drueber stark`; 230: `gef-drueber` ohne `stark`.
  - ohne Freigabe: enthält „Ziel kommt mit der Freigabe vom Tierarzt.“ und `data-aktion="warum-kein-ziel"`, kein
    `gef-bahn`, keine Kachel.
  - keine Mahlzeit mit Freigabe: kein Element `gef-legende`, Kachel „Noch“ 220, Balken nur `rest`.
  - Legende: „Nass 89“ usw. nur für vorkommende Arten. Kein Text enthält „Wägung“, „g Trocken“ oder eine Gramm-
    Empfehlung (Regex `/\d+\s*g\s+(Nass|Trocken)/` darf nicht passen).
  - `zahl(-0)` ergibt „0“.
- [ ] **Step 5:** `gefuettertHtml` bauen. Aufbau wie Entwurf `gefABk` (ohne Kopfzeile): `.gef-feld > .gef-bahn`
  (14 px, `display:flex; gap:2px`, Stücke `min-width:3px`, Enden rund 7 px) mit Stücken, Rest (`flex-grow` = soll − kcal,
  nur wenn > 0), Überdeckung `.gef-drueber` (absolut von `left: marke%` bis rechts), danach `.gef-marke` (2 px,
  `--text`). Legende `.gef-legende` mit `.gef-chip` je Art. Kacheln `.gef-kacheln` (zwei Spalten, je Zeile Wort links,
  Zahl rechts; `warn` = `--warnung-hell`/`--warnung`). Farben: nass `--akzent`, trocken
  `color-mix(in srgb, var(--akzent) 50%, var(--flaeche))`, leckerli `repeating-linear-gradient(135deg, var(--akzent)
  0 2px, var(--flaeche) 2px 4px)`, Rest `--flaeche-2`; grau überdeckt: Schraffur
  `color-mix(in srgb, var(--text) 35%, transparent)`; Bernstein: `--warnung`, Deckkraft 0,85.
- [ ] **Step 6:** `npm test` → grün.
- [ ] **Step 7: Einbau.** `index.html`: `#lineal` entfernen, `#kcal-text` bleibt Behälter, `#summe-hinweis`-Text
  „ca. = enthält Futter ohne genauen kcal-Wert“, Kommentar anpassen. `app.js`: `zeichneLineal` → `zaehleKcal(kcal,
  vonNull)` (nur Hochzählen, `ohneBewegung()` wie bisher); im Block „Lineal“ `gefuettertWerte` aufrufen,
  `#kcal-von` = `${ca}von ${zahl(soll)} kcal vom Tierarzt` bzw. `${ca}kcal · ${zahl(gramm)} g Futter`,
  `#kcal-text` = `gefuettertHtml(werte)`. `ringWerte` bleibt exportiert (andere Stellen/Tests). `styles.css`:
  `.lineal*` entfernen, `.kcal-zahl` 3rem, neue `.gef-*`-Regeln.
- [ ] **Step 8: Version.** `index.html` „Version 0.38.0“, `sw.js` v76 + `"js/heute-grafiken.js"`, Versions-Test
  umbenennen auf 0.38.0/v76 und `assert.match(sw, /"js\/heute-grafiken\.js",/)` ergänzen. `npm test` → alles grün.
- [ ] **Step 9: Browser** (`preview_start` „kilossos“, SW und Caches löschen, Tab auf localhost, `/?demo`): heute mit
  Mahlzeiten, Tag ohne Mahlzeit, Tag über 110 %, ohne Freigabe (Demo-Freigaben per Konsole entfernen oder eigene
  Testdaten), 375 px, 150 % Schrift, dunkel; Kartenhöhe ≈ 258 px (große Schrift ≈ 437 px); keine Konsolenfehler;
  Hochzählen läuft.
- [ ] **Step 10:** Review des Diffs (frischer Agent), Funde beheben, dann Commit `feat: Grafik „Gefüttert“ mit
  Mahlzeiten im Balken, Version 0.38.0`, Push, live prüfen, Halter am Handy prüfen lassen.

### Task 2: „Letzte Messung“ als Mischung flach (0.39.0, Cache v77)

**Files:**
- Modify: `js/zusammenfassung.js` (neue Funktion neben `achtWochen`)
- Modify: `js/heute-grafiken.js` (Karte, Kurve, Skala)
- Modify: `app.js:414-424` (`miniKurve` entfernen), `app.js:549-569` (Block „Gewicht“)
- Modify: `styles.css:590-595` (`.mini*` entfernen, neue Klassen), `index.html` `#version`, `sw.js` v77
- Test: `tests/zusammenfassung.test.js`, `tests/heute-grafiken.test.js`, `tests/wissen.test.js`

**Interfaces:**
- Consumes: `zahl`, `sicher` aus Task 1 (`js/heute-grafiken.js`); `tempoRueckmeldung`, `achtWochen`.
- Produces: `messungWerte({ gewichte, freigaben, tag })` in `js/zusammenfassung.js` (`gewichte`/`freigaben` nur
  dieses Tiers und bis `tag`) → `{ art: "keine" }` | `{ art: "ohneVergleich", letzte }` |
  `{ art: "mitVergleich", letzte, vorher: { datum, kg }, diffG, prozent, bewertung, kurve }`; `diffG` =
  `Math.round((letzte.kg − vorher.kg) * 1000)` (nie `-0`), `prozent`/`bewertung` aus `tempoRueckmeldung`,
  `kurve` = `achtWochen(gewichte, tag)` wenn mindestens 2 Einträge, sonst `null`.
- Produces: `URTEIL_KURZ` (Objekt je Bewertung, Texte aus `GRENZEN`), `skalaPunkt(prozent)` →
  `{ x, raus: null|"links"|"rechts" }` und `messungHtml(werte)` in `js/heute-grafiken.js`.

- [ ] **Step 1: Failing tests für `messungWerte`** (Block „0.39.0“): keine Gewichte → `art "keine"`; eins →
  `"ohneVergleich"`; zwei am selben Tag → `"ohneVergleich"`; 6,24 kg am 29.10. und 6,12 kg am 5.11. →
  `diffG -120`, `vorher.datum "2026-10-29"`, `prozent` ≈ 1,92, `kurve.length 2`; gleiches Gewicht → `Object.is(diffG, 0)`;
  Vergleich da, aber vorige Wägung älter als 56 Tage → `kurve null`; ohne Freigabe 2,5 % → `bewertung "zu-schnell"`,
  0,8 % → `"neutral"`.
- [ ] **Step 2:** `npm test` → rot. **Step 3:** `messungWerte` bauen. **Step 4:** grün.
- [ ] **Step 5: Failing tests für Skala und Karte** in `tests/heute-grafiken.test.js`:
  - `URTEIL_KURZ`: `gut "sicher"`, `langsam "langsamer als 0,5 %"`, `"zu-schnell" "schneller als 2 %"`,
    `zunahme "im Blick behalten"`, `neutral "noch ohne Bewertung"`; die Zahlen kommen aus `GRENZEN` (Test: Quelltext
    von `js/heute-grafiken.js` ohne Kommentare passt nicht auf `/als 0,5|als 2 %|>0,5<|>2</`).
  - `skalaPunkt`: Skala −0,5…3 auf 12…288 (W 300, Ränder 12): `skalaPunkt(-0.5).x 12`, `skalaPunkt(3).x 288`,
    `skalaPunkt(3.4)` → `{ x: 288, raus: "rechts" }`, `skalaPunkt(-1)` → `{ x: 12, raus: "links" }`.
  - `messungHtml` „keine“: „Noch nicht gewogen.“ und „Am besten 1× pro Woche, immer zur gleichen Zeit.“, kein
    `data-ziel="verlauf"`.
  - „ohneVergleich“: Datum im Kopf, Gewicht, `data-ziel="verlauf"`-Knopf „Verlauf ›“, Satz „Das Tempo erscheint ab dem
    zweiten Wiegen.“, kein `mess-kurve`, kein `mess-skala`, kein „ g seit“.
  - „mitVergleich“ mit Kurve: „−120 g seit 29.10.“, `class="mess-kurve"`, `class="mess-skala"`, Urteil
    „1,9 % pro Woche · …“; bei Zunahme „Zunahme 0,3 % pro Woche · im Blick behalten“; ohne Kurve kein `mess-kurve`.
  - Kein `NaN` bei zwei gleichen Gewichten in der Kurve. Kein „Wägung“. Alle SVG `aria-hidden="true"`.
- [ ] **Step 6:** `messungHtml` bauen wie Entwurf `messABflach`: Kopf (`.mess-kopf`, zwei Zeilen, 4 px Abstand):
  Zeile 1 `<span class="label">Letzte Messung · ${wochentag kurz, Tag, Monat kurz}</span>` + `<button type="button"
  class="mess-link" data-ziel="verlauf">Verlauf ›</button>` (Tippfläche ≥ 48 px über Padding und negativen Rand);
  Zeile 2 Gewicht 2rem mit kleinem „kg“, rechts leise `±/−/+ Gramm g seit T.M.` (ohne führende Nullen). Kurve
  (`.mess-kurve`, 320 × 58, Ränder links 30, rechts 40, oben 6, unten 14): Hilfslinien bei
  `lo = floor((min − 0,08)·10)/10`, `hi = ceil((max + 0,05)·10)/10` (bei `hi === lo` eine Spanne von 0,1 erzwingen),
  Linie 2 px `--text`, Punkte r 2,5, letzter Punkt r 4,5 in Bewertungsfarbe mit Gewicht daneben, unten erstes und
  letztes Datum. Skala (`.mess-skala`, 300 × 35, flach: Spur y 10, Zone y 4/h 12, Striche 17–21, Zahlen y 32,
  Punkt r 6, Striche „0“, „0,5“, „2“, „3 %“ aus `GRENZEN`; liegt der Wert außerhalb, bleibt der Punkt am Rand und
  daneben steht „‹“ bzw. „›“ wie im Entwurf). Urteil `.mess-urteil.${bewertung}`.
  Vorlesetext der Karte: `aria-label="Letzte Messung"`.
- [ ] **Step 7:** grün. **Step 8: Einbau** in `app.js` (Block „Gewicht“: `messungWerte` mit
  `gewichte` (schon bis `tag`) und `daten.freigaben.filter(f => f.tierId === tier.id && f.datum <= tag)`;
  `$("heute-gewicht").innerHTML = messungHtml(werte)`), `miniKurve` und `.mini*`-CSS entfernen, neue `.mess-*`-Regeln
  (aus `seite.css` 82–113 und 207–211 übernehmen; dunkel: Zone `color-mix(in srgb, var(--akzent) 35%, var(--flaeche))`).
- [ ] **Step 9: Version** 0.39.0 / v77 (Test anpassen). `npm test` grün.
- [ ] **Step 10: Browser:** Demo heute, Demo vergangener Tag (Pfeil zurück bis vor die erste Wägung), ohne Freigabe,
  zu schnell; „Verlauf ›“ öffnet den Verlauf (echter Klick), 375 px Höhe ≈ 222 px (große Schrift ≈ 288 px), dunkel,
  keine Konsolenfehler.
- [ ] **Step 11:** Review, Commit `feat: Karte „Letzte Messung“ mit Kurve und Tempo-Skala, Version 0.39.0`, Push,
  live, Handy.

### Task 3: „Tempo pro Woche“ als Punkte über der Zeit (0.40.0, Cache v78)

**Files:**
- Modify: `js/verlauf.js:62-87` (`zeitAchse` optionale Grundlinie/Höhe), `:494-555` (`tempoDiagramm`, `tempoKarte`),
  `:678` (Aufruf in `zeichneVerlauf`)
- Modify: `styles.css:705-710` (`.tempo`), `index.html` `#version`, `sw.js` v78
- Test: `tests/verlauf.test.js`, `tests/wissen.test.js` (Satz „Für jedes Wiegen …“ ~Zeile 207, Version)

**Interfaces:**
- Produces: `tempoAchse(werte: number[])` → `{ lo, hi }` (exportiert aus `js/verlauf.js`):
  `hi = Math.max(2.5, Math.ceil((max + 0.2) * 2 - 1e-9) / 2)`, `lo = Math.min(0, Math.floor((min - 0.1) * 2 + 1e-9) / 2)`.
- Produces: `tempoKarte(gewichte, freigaben, von, heute)` (Signatur um `heute` ergänzt), `zeitAchse(vonMs, bisMs, x,
  unten = H - RAND.unten, hoehe = H)` (PDF ruft unverändert mit drei Argumenten auf).

Zeitachse: wie `weicheKurve` – Anfang = erste Wägung im Zeitraum (`verlaufGewichte(gewichte, von)[0]`), Ende =
`achsenEnde(heute, letzte Wägung)`, Ränder `KURVE_RAND` (34/40), Breite 340. Hat der Zeitraum weniger als 2 Wägungen,
beginnt die Achse beim `vonDatum` des ältesten gezeigten Punkts. Höhe 176, oben 10, unten 22.

- [ ] **Step 1: Failing tests** in `tests/verlauf.test.js` (Block „0.40.0“):
  - `tempoAchse([0.6, 1.4])` → `{ lo: 0, hi: 2.5 }`; `tempoAchse([-0.3, 1])` → `lo -0.5`; `tempoAchse([2.8])` → `hi 3`;
    `tempoAchse([1, 1])` ohne `NaN`.
  - `zeichneVerlauf` mit 16 wöchentlichen Gewichten und Zeitraum „alles“ → so viele `class="tempo-p` wie
    `wochenRaten` Einträge (mehr als 12); Klassen `gut`/`langsam`/`zu-schnell`/`neutral` je Bewertung.
  - neuester Punkt hat `r="5"` und den Wert-Text („0,9 %“-Format), alle anderen `r="3.5"`; je Punkt ein `<title>`.
  - Band „sicherer Bereich“ von `GRENZEN.abnahmeMin` bis `abnahmeMax`; Nulllinie `tempo-null`.
  - Erklärsatz mit Freigabe: „Jeder Punkt steht für ein Wiegen, auf 7 Tage umgerechnet. Grün: im sicheren Bereich,
    Bernstein: langsamer, Rot: schneller als 2 %. Unter der Nulllinie: zugenommen.“; „Grau: vor der Freigabe, noch nicht
    bewertet.“ nur bei neutralen Punkten; ohne Freigabe: „Jeder Punkt steht für ein Wiegen, auf 7 Tage umgerechnet.
    Bewertet wird erst ab der Freigabe vom Tierarzt; schneller als 2 % ist immer rot. Unter der Nulllinie: zugenommen.“
  - Zeitachse: x des ersten Tempo-Punkts = x der ersten Wägung in `weicheKurve` (gleiche Ränder, gleicher Anfang),
    letzte Wägung nach `heute` → Achse endet dort, kein `NaN`.
  - Nur ein Tempo-Wert im Zeitraum (Zeitraum „1m“, eine Wägung darin) → ein Punkt, kein `NaN`.
  - „Alle Wochen“ unverändert vorhanden.
- [ ] **Step 2:** rot. **Step 3:** `tempoAchse`, `zeitAchse`-Parameter, `tempoDiagramm(raten, { vonMs, bisMs })` und
  `tempoKarte` bauen wie Entwurf `tempoA` (aber rechter Rand 40 statt 44): `.papier` um das SVG, Gitter alle 0,5 %,
  Zahlen bei 0,5 und ganzen Werten, oberste ganze Zahl mit „ %“, Nulllinie kräftiger, Band `--akzent-hell` mit Text
  „sicherer Bereich“ oben links, graue Verbindungslinie, Punkte, Ø-Marke rechts („Ø 0,83“; passt sie nicht in den
  Rand, innen an den rechten Rand), Zeitachse über `zeitAchse(…, 176 - 22, 176)`. `aria-hidden="true"`. Kopfzeile
  „Ø … % pro Woche · N von M Wochen im sicheren Bereich“ unverändert.
- [ ] **Step 4:** Satz-Test in `tests/wissen.test.js` (~207) auf den neuen Satz ändern; `.tempo`-CSS durch
  `.tempo-*` ersetzen (aus `seite.css` 117–126). Version 0.40.0 / v78. `npm test` grün.
- [ ] **Step 5: Browser:** Verlauf in der Demo „1 Monat“, „3 Monate“, „Alles“; Punkte stehen unter den Wägungen der
  Kurve (Bild); 375 px Höhe ≈ 433 px bei 3 Monaten; dunkel, 150 % Schrift, keine Konsolenfehler.
- [ ] **Step 6:** Review, Commit `feat: Tempo pro Woche als Punkte über der Zeit, Version 0.40.0`, Push, live, Handy.

## Danach

- HANDOFF und Spec-Kopf („gebaut in 0.38.0–0.40.0“) nachtragen; Ideen-Tafel-Karte `heute-grafiken-aufhuebschen`:
  Stellen 1–3 erledigt, PDF offen.
- Stichtag Montag, 10.11.2026: Was nicht sauber läuft, per `git revert` wieder heraus (kein Datenformat betroffen).
