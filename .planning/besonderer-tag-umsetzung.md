# „Besonderer Tag“ (0.33.0) Implementation Plan

> **Für ausführende Agenten:** Ausführung „Native“: Claude baut alle Aufgaben selbst in einer Sitzung (TDD), danach
> Browser-Prüfung und **ein** Review durch einen frischen Opus-Agenten über die ganze Änderung. **Vor dem Review nicht
> committen** (Projekt-Lesson 05.11.2026), deshalb keine Commits je Aufgabe, sondern einer am Ende. Schritte mit `- [ ]`.

**Goal:** Halter halten Ausnahmen (krank, genascht, mehr Bewegung …) als eintägige Ereignisse oder Phasen fest; sie
erscheinen auf „Heute“, als Zeitleiste unter der Gewichtskurve, im PDF-Bericht, und „Futter verweigert“ zeigt den
Notfall-Hinweis groß.

**Architecture:** Neue Liste `besondereTage` im Datenformat (Version bleibt 1, fehlende Liste = leer). Alle Regeln
(Arten, „betrifft Tag“, Zeitraumtexte, Formularprüfung, Notfall-Regel) in einem neuen reinen Modul
`js/besondere-tage.js`. Die Zeitleiste ist ein eigenes schmales SVG mit derselben Breite und Achse wie die Kurve
(`zeitleiste()` in `js/verlauf.js`), genutzt von Verlauf und PDF. Die Zeitachse von Kurve und PDF-Diagramm endet heute
bzw. am Berichtsende.

**Tech Stack:** Vanilla-JS-Module, HTML-Strings, `node --test` ohne Zusatzpakete.

**Spec:** `.planning/besonderer-tag.md` (von Stefan freigegeben 05.11.2026). Beide Dateien zusammen lesen.

## Global Constraints

- Keine Kalorien und keine Gramm an besonderen Tagen; kein Einfluss auf `warnungen()`, Grenzen oder Rechnungen.
- Keine neuen medizinischen Ratschläge. Einziger Hinweis: der vorhandene Notfall-Text, wörtlich: „Frisst deine Katze
  einen Tag oder länger gar nicht? Dann sofort zum Tierarzt, auch mitten in der Abnahme. Katzen bekommen dabei schnell
  eine Fettleber.“
- Datenformat bleibt `VERSION = 1`; `istGueltig` verlangt `besondereTage` nicht; alte Sicherungen bleiben gültig.
- Überall nach `tierId` filtern.
- Nur Datum, keine Uhrzeit. Datumsfelder `max = heute`; „bis“ zusätzlich `min = Startdatum`.
- Notiz höchstens 200 Zeichen (`NOTIZ_MAX`), bei „Sonstiges“ Pflicht.
- Tippflächen ≥ 48 px, 375 px Breite, 150 % Schrift, hell und dunkel; Texte mit Zahl und Einheit mit ` `.
- Neue `data-id` mit `sicher()` ausgeben (bekanntes Altproblem nicht wiederholen).
- Version 0.33.0, Cache `kilossos-v60`, `js/besondere-tage.js` in `DATEIEN` (`sw.js`).

## Ergebnis des Skills `migration` (05.11.2026)

**Leser und Schreiber heute:** `laden`/`speichern` (`js/daten.js`, ganzes Objekt), `sicherungPruefen` +
`speichernInSpeicher` beim Einlesen (ganzes Objekt), Export `JSON.stringify(daten)`, `tierEntfernen`/`eintraegeVon`
(`js/tiere.js`, feste Feldliste), `verschiebeDaten` (Demo, feste Feldliste), „Alle Daten löschen“ (alle Schlüssel
`kilossos-*`), Speicheranzeige (zählt alle Schlüssel).

**Vorwärts (0.32.1-Daten in 0.33.0):** Fehlt `besondereTage` (oder ist es `null`), setzt `eintraegeBereinigen` still
`[]` (zählt nicht als Korrektur, nichts landet in `kilossos-entfernt`). Ist es kein Array, wandert der Wert nach
`kilossos-entfernt` (Feld `besondereTage`) und zählt als eine Korrektur. `ersteDaten` legt die Liste gleich leer an.

**Rückwärts (0.33.0-Daten in einer älteren Fassung, z. B. Handy mit altem Cache):** `istGueltig` und
`eintraegeBereinigen` alter Fassungen kennen das Feld nicht und lassen es stehen; `speichern`, Export und Einlesen
schreiben das ganze Objekt, die Liste bleibt also erhalten. Einzige Lücke: Eine alte Fassung entfernt beim
„Tier entfernen“ dessen besondere Tage nicht. Die neue Fassung filtert überall nach `tierId`, die Reste bleiben
unsichtbar und harmlos. Nichts wird umgewandelt, kein zerstörender Schritt, kein „Contract“-Schritt nötig.
Rücknahme = Commit zurücknehmen; die Daten bleiben für 0.32.1 lesbar. Beweis in Aufgabe 1, Schritt 6.

## Datenformat (neu)

`besondereTage: { id, tierId, art, von: "JJJJ-MM-TT", bis: "JJJJ-MM-TT" | null, notiz }`
- eintägig: `bis === von`; abgeschlossene Phase: `bis > von`; laufende Phase: `bis === null`.
- `art`: Schlüssel aus `BESONDERE_ARTEN`; unbekannte Schlüssel (neuere Sicherung) bleiben gespeichert und werden als
  „Sonstiges“ angezeigt.
- Gültig (`PFLICHT`): `istText(id) && istText(tierId) && istText(art) && istTag(von) && (bis === null || (istTag(bis) && bis >= von))`.
  Fehlt `bis` ganz (`undefined`), ist der Eintrag ungültig (wandert nach `kilossos-entfernt`). `notiz` wird wie bei den
  anderen Listen geleert, wenn sie kein Text ist; Länge wird beim Einlesen nicht gekürzt.

## Review Focus

1. Einträge eines **anderen Tiers** dürfen nirgends erscheinen (Heute-Karte, Notfall-Kasten, Zeitleiste, Bericht).
   Tests mit zweiter `tierId` in Aufgabe 2 (`eintraegeAm`, `notfallJetzt`, `imZeitraum`) und Aufgabe 4 (Bericht).
2. **Ändern einer Phase:** Schalter aus → eintägig am Startdatum (`bis = von`); Startdatum hinter „bis“ geschoben →
   Fehler; „bis“ leer bei Schalter an → läuft weiter. Tests in Aufgabe 2 (`eintragAusFormular`).
3. **Notfall-Grenze:** „Futter verweigert“ bis gestern → rot; bis vorgestern → nicht rot; läuft seit 10 Tagen → rot;
   eintägig vor 5 Tagen nachgetragen → nicht rot. Tests in Aufgabe 2 (`notfallJetzt`).
4. **Achsen-Ende:** letzte Wägung heute → Kurve wie bisher; Freigabe nach der letzten Wägung erscheint jetzt als Marke
   und in der Legende; sicherer Bereich läuft bis heute. Tests in Aufgabe 3.
5. **Fremde oder kaputte Sicherungen:** unbekannte Art bleibt und heißt „Sonstiges“; `bis` fehlt → aussortiert;
   `besondereTage` kein Array → `[]` plus Eintrag in `kilossos-entfernt`. Tests in Aufgabe 1 und 2.

---

### Aufgabe 1: Datenformat, Sicherung, Tier entfernen

**Files:**
- Modify: `js/daten.js` (Kopfkommentar, `ersteDaten`, `PFLICHT`, `eintraegeBereinigen`, `verschiebeDaten`)
- Modify: `js/tiere.js` (`eintraegeVon`, `tierEntfernen`)
- Modify: `js/sicherung.js` (`einleseFrage`)
- Create: `tests/sicherungen/kilossos-0.33.json` (eingefroren: Mika und Luna, je ein eintägiger Eintrag, eine
  abgeschlossene Phase, eine laufende Phase, ein Eintrag mit unbekannter Art `"zukunft-art"`; dazu eine Sorte mit
  `analyse`, damit auch der Stand 0.32 abgedeckt ist)
- Modify: `.planning/alte-sicherungen.md` (Zeilen 0.32 `futter.analyse` und 0.33 `besondereTage`)
- Test: `tests/eintraege.test.js`, `tests/daten.test.js`, `tests/tiere.test.js`, `tests/alte-sicherungen.test.js`

**Interfaces:**
- Produces: `daten.besondereTage` ist nach `laden()` und `sicherungPruefen()` immer ein Array;
  `eintraegeVon(daten, tierId)` → `{ mahlzeiten, gewichte, freigaben, besondereTage }` (Zahlen);
  `einleseFrage` nennt „und N besondere Tage“ / „und 1 besonderen Tag“, nur wenn N > 0.

- [ ] **Schritt 1: Tests schreiben**
  - `eintraege.test.js`: „fehlende Liste besondereTage wird still leer“ (`delete d.besondereTage` →
    `eintraegeBereinigen(d) === 0`, `d.besondereTage` deepEqual `[]`, `entfernt.length === 0`); „besondereTage kein
    Array → leer, Wert in entfernt“ (`"x"` → Rückgabe 1, `entfernt[0]` deepEqual `{ feld: "besondereTage", eintrag: "x" }`);
    „kaputte besondere Tage fliegen raus“: gültig bleiben `{id,tierId,art:"krank",von:"2026-11-03",bis:null,notiz:""}`,
    `{…, bis:"2026-11-03"}`, `{…, art:"zukunft-art"}`; raus: `bis` fehlt, `bis:"2026-11-02"` (vor `von`),
    `von:"kaputt"`, `art:""`, `null` → Zahl 5. „gültige Daten bleiben unverändert“ läuft mit einem gültigen Eintrag in
    `gueltigeDaten()` weiter.
  - `daten.test.js`: `ersteDaten(…).besondereTage` deepEqual `[]`; `verschiebeDaten` mit
    `besondereTage: [{von:"2026-03-20",bis:"2026-03-22"},{von:"2026-12-30",bis:null}]` um 10 Tage → `"2026-03-30"`,
    `"2026-04-01"`, `"2027-01-09"`, `null`; ohne Liste im Eingang → Ausgabe `[]`.
  - `tiere.test.js`: `eintraegeVon` zählt `besondereTage`; `tierEntfernen` entfernt die des Tiers, andere bleiben;
    Beispiel ohne Liste stürzt nicht ab.
  - `alte-sicherungen.test.js`: in „ohne Verluste“ zusätzlich
    `assert.deepEqual(daten.besondereTage, original.besondereTage ?? [])`; neue Datei zählt automatisch mit.
    Test „einleseFrage nennt besondere Tage“: 0.33-Datei → Text enthält „und 4 besondere Tage“ (bzw. die Zahl der Datei);
    0.28-Datei → Text enthält „besondere“ nicht.
- [ ] **Schritt 2:** `npm test` → die neuen Tests schlagen fehl.
- [ ] **Schritt 3:** Umsetzen wie unter „Datenformat (neu)“ und „Ergebnis des Skills migration“. `tiere.js` arbeitet mit
  `["mahlzeiten","gewichte","freigaben","besondereTage"]` und überspringt fehlende Listen (`Array.isArray`).
- [ ] **Schritt 4:** `npm test` → alles grün (vorher 314 Tests).
- [ ] **Schritt 5:** Kopfkommentar in `js/daten.js` um `besondereTage` ergänzen (Felder wie oben, „seit 0.33.0“).
- [ ] **Schritt 6: Rückwärts-Beweis (einmalig, nicht im Repo).** Skript im Scratchpad: `js/daten.js`, `js/sicherung.js`,
  `js/profil.js`, `js/futterliste.js`, `js/tiere.js` aus `git show bdfc5f2:<datei>` in einen Ordner schreiben, die
  0.33-Datei mit der **alten** `sicherungPruefen`, `speichern`, `laden` durchlaufen lassen. Erwartet: `besondereTage`
  danach identisch, `kilossos-entfernt` leer; alte `tierEntfernen` lässt die Einträge des Tiers stehen.
  Ausgabe im Umsetzungsbericht festhalten.

### Aufgabe 2: Regeln in `js/besondere-tage.js`

**Files:**
- Create: `js/besondere-tage.js`
- Test: `tests/besondere-tage.test.js` (neu)

**Interfaces (Produces):**
- `BESONDERE_ARTEN`: Array in dieser Reihenfolge, Form passt direkt zu `auswahlFeld`:
  `{ wert, text, zusatz?, ende?, hinweis?, notizPflicht?, notfall? }`
  | wert | text | zusatz | Besonderheit |
  |---|---|---|---|
  | `mehr-bewegung` | Mehr Bewegung | z. B. draußen gewesen, viel gespielt | |
  | `weniger-bewegung` | Weniger Bewegung | z. B. nur drinnen, verletzt geschont | |
  | `krank` | Krank | | `ende: "Wieder gesund"` |
  | `futter-verweigert` | Futter verweigert | | `notfall: true` |
  | `genascht` | Außer der Reihe genascht | Beute, Futter eines anderen Tiers, Essen vom Tisch | `hinweis: "Die Menge musst du nicht wissen."` |
  | `fressen-auffaellig` | Auffälligkeit beim Fressen | nur die Hälfte gefressen, erbrochen, sehr gierig | |
  | `futterumstellung` | Futterumstellung | Mischen über mehrere Tage | |
  | `sonstiges` | Sonstiges | | `notizPflicht: true` |
  Beenden-Text ohne `ende`: „Beendet“.
- `NOTIZ_MAX = 200`
- `artVon(wert) → Art` (unbekannt → die Art `sonstiges`)
- `betrifftTag(eintrag, tag) → boolean` (`von <= tag` und (`bis === null` oder `bis >= tag`))
- `eintraegeAm(liste, tierId, tag) → Eintrag[]` (nach `von`, dann Reihenfolge in der Liste)
- `imZeitraum(liste, tierId, von, bis) → Eintrag[]` (überschneidet `[von, bis]`; `von` null = von Anfang; nach `von`)
- `zeitraumText(eintrag) → string`: eintägig „Di., 3. Nov.“; laufend „seit Di., 3. Nov.“; Phase „1. bis 3. Nov.“,
  über den Monat „30. Okt. bis 2. Nov.“, über das Jahr „30. Dez. 2026 bis 2. Jan. 2027“ (`toLocaleDateString("de-DE")`)
- `eintragAusFormular({ art, von, mehrere, bis, notiz }, heute) → { fehler: string } | { eintrag: { art, von, bis, notiz } }`
  (Strings aus FormData, `mehrere` boolean; Notiz getrimmt; Schalter aus → `bis = von`; Schalter an und „bis“ leer →
  `bis = null`). Fehlertexte wörtlich, in dieser Prüfreihenfolge:
  1. Art fehlt oder unbekannt: „Bitte wähle aus, was an diesem Tag besonders war.“
  2. `von` kein Datum: „Bitte ein Datum angeben.“
  3. `von > heute`: „Das Datum darf nicht in der Zukunft liegen.“
  4. `bis < von`: „„bis“ darf nicht vor dem Startdatum liegen.“
  5. `bis > heute`: „„bis“ darf nicht in der Zukunft liegen.“
  6. Notiz länger als 200: „Die Notiz darf höchstens 200 Zeichen lang sein.“
  7. `sonstiges` ohne Notiz: „Bitte schreib bei „Sonstiges“ kurz dazu, was war.“
- `beenden(eintrag, tag)`: setzt `bis = tag` (nie vor `von`)
- `notfallJetzt(liste, tierId, heute) → boolean`: ein Eintrag `futter-verweigert` des Tiers mit `von <= heute` und
  (`bis === null` oder `bis >= gestern`)

- [ ] **Schritt 1: Tests schreiben** (Kitos Alltag als Beispiele, `heute = "2026-11-05"`):
  - Reihenfolge und Texte von `BESONDERE_ARTEN` (8 Arten, `krank.ende`, `genascht.hinweis`, `sonstiges.notizPflicht`);
    `artVon("zukunft-art").text === "Sonstiges"`.
  - `betrifftTag`: eintägig nur am Tag; Phase 01.–03.11. betrifft 01., 02., 03., nicht 31.10. und 04.11.; laufend ab 03.11.
    betrifft 05.11. und 20.11., nicht 02.11.
  - `eintraegeAm` filtert fremde `tierId`; sortiert.
  - `imZeitraum`: Phase 28.10.–02.11. gehört zu `[2026-11-01, 2026-11-05]`; laufende Phase von 2026-09-01 gehört dazu;
    eintägig 31.10. nicht; fremde `tierId` nie.
  - `zeitraumText`: die vier Fälle oben (mit Node geprüft: 03.11.2026 ergibt „Di., 3. Nov.“).
  - `eintragAusFormular`: jeder der 7 Fehler; Schalter aus mit „bis“ gefüllt → `bis === von`; Schalter an, „bis“ leer →
    `null`; Schalter an, `bis === von` → eintägig; Notiz „ “ bei `sonstiges` → Fehler 7; 200 Zeichen ok, 201 Fehler 6.
  - `beenden`: laufend seit 03.11., beenden am 05.11. → `bis "2026-11-05"`.
  - `notfallJetzt`: die vier Fälle aus „Review Focus 3“, dazu fremde `tierId` → false, `krank` laufend → false.
- [ ] **Schritt 2:** `node --test tests/besondere-tage.test.js` → schlägt fehl (Modul fehlt).
- [ ] **Schritt 3:** Modul umsetzen (rein, ohne DOM).
- [ ] **Schritt 4:** Test grün, `npm test` grün.

### Aufgabe 3: Zeitleiste und Zeitachse bis heute (`js/verlauf.js`)

**Files:**
- Modify: `js/verlauf.js` (`weicheKurve`, `legende`, `zeichneVerlauf`, `gewichtDiagramm`; neu `zeitleiste`,
  `naechsterZeitleistenEintrag`, Export `PDF_RAND`)
- Test: `tests/verlauf.test.js`

**Interfaces:**
- Consumes: `imZeitraum`, `artVon`, `zeitraumText` aus Aufgabe 2.
- Produces:
  - `weicheKurve(gewichte, freigaben, von = null, bis = null)`: `bis` ("JJJJ-MM-TT") ist das Achsenende;
    `bisMs = max(ms(bis), ms(letzte Wägung))`; ohne `bis` wie bisher (letzte Wägung). Linie und Endpunkt bleiben an der
    letzten Wägung; sicherer Bereich, Monatsbeschriftung und Freigabe-Marken laufen bis `bisMs`.
  - `zeitleiste(eintraege, { vonTag, bisTag, links, rechts }) → string`: `""`, wenn kein Eintrag `[vonTag, bisTag]`
    berührt. Sonst `<svg viewBox="0 0 340 H" class="zeitleiste" role="img" aria-label="Besondere Tage im Zeitraum: N" data-eintraege="…">`
    mit derselben x-Skala wie die Kurve (`links` bis `340 − rechts`). Phase = `<line class="zl-balken">` mit runden
    Enden (Ende `null` → bis `bisTag`, auf den Zeitraum zugeschnitten; mindestens so breit wie ein Punkt), eintägig =
    `<circle class="zl-punkt" r="4">`; `futter-verweigert` bekommt zusätzlich die Klasse `notfall`. Jedes Element hat ein
    `<title>` mit dem Infotext. Reihen: der Reihe nach (nach `von`) in Reihe 0, wenn dort frei (5 Einheiten Abstand),
    sonst Reihe 1; sind beide belegt, die Reihe, die früher frei wird. `H = 18` bei einer, `32` bei zwei Reihen;
    `y = 9 + reihe × 14`. `data-eintraege` = JSON `[[x1, x2, y, text], …]`, `text` = „Art: Zeitraum · Notiz“
    (Notiz nach 60 Zeichen mit „…“ gekürzt).
  - `naechsterZeitleistenEintrag(liste, x, y) → [x1, x2, y, text]`: kleinster waagerechter Abstand (0 innerhalb),
    bei Gleichstand die Reihe mit kleinerem `|y − reiheY|`.
  - `zeichneVerlauf({ …, besondereTage = [] })`: Kurve mit `bis = heute`; Zeitleiste mit `vonTag` = erste Wägung im
    Zeitraum, `bisTag = heute`, `links 34`, `rechts 40`, im `.kurve-feld` direkt unter dem Kurven-SVG (vor der
    Infoblase). Ohne Kurve keine Zeitleiste.
  - `legende(freigaben, kurve, mitZeitleiste)`: Freigabe nur, wenn `kurve` `class="freigabe-marke"` enthält (statt
    Datumsvergleich); `<span><i class="besonders"></i>Besonderer Tag</span>` nur, wenn die Zeitleiste gezeichnet ist.
  - Tipp-Satz mit Zeitleiste: „Tippe auf die Kurve oder auf einen besonderen Tag darunter, um Einzelheiten zu sehen.
    Alle Gewichte als Liste stehen unter „Gewicht“.“ (ohne Zeitleiste unverändert).
  - `gewichtDiagramm(gewichte, freigaben, bis = null)`: Achsenende wie bei `weicheKurve`; Endpunkt an
    `x(letzte Wägung)`; die kg-Beschriftung steht rechts neben dem Endpunkt (`x + 6`, `text-anchor="end"` bei
    `x > 340 − 52 − 40`).
  - `PDF_RAND = { links: 34, rechts: 52 }` (aus dem bestehenden `RAND`).

- [ ] **Schritt 1: Tests schreiben**
  - „Achse endet heute“: `weicheKurve(gewichte, [], null, "2026-10-29")` → x des letzten Punkts kleiner als
    `340 − 40`; mit `bis = "2026-10-15"` (Tag der letzten Wägung) ist es genau `300` (wie bisher).
  - Bestehender Legenden-Test (0.32.1) anpassen: mit `heute: "2026-10-15"` gilt die alte Aussage (kein Band, Legende ohne
    „sicher:“, mit „Freigabe“); neu mit `heute: "2026-10-20"`: Band gezeichnet und „sicher: 0,5 bis 2 % pro Woche“ in der
    Legende. Freigabe am 2026-10-18 (nach der letzten Wägung): Marke `freigabe-marke` in der Kurve und „Freigabe“ in der
    Legende.
  - `zeitleiste`: leer ohne Einträge im Zeitraum; Phase 2026-10-05 bis 2026-10-09 → eine `zl-balken`; laufende Phase →
    `x2 === 300` (rechter Rand bei `rechts 40`); Phase, die vor `vonTag` beginnt → `x1 === 34`; eintägig →
    `zl-punkt`; `futter-verweigert` → Klasse `notfall`; zwei überlappende Phasen → `viewBox="0 0 340 32"` und y 9 und 23;
    Notiz mit `<script>` erscheint nur maskiert; kein `NaN`.
  - `naechsterZeitleistenEintrag`: Punkt innerhalb eines Balkens gewinnt; bei zwei Reihen entscheidet y.
  - `zeichneVerlauf` mit `besondereTage`: Zeitleiste steht innerhalb `.kurve-feld` nach `class="kurve"`; Legende hat
    „Besonderer Tag“; ohne Einträge weder Zeitleiste noch Legenden-Eintrag; bei weniger als zwei Wägungen keine
    Zeitleiste.
- [ ] **Schritt 2:** `node --test tests/verlauf.test.js` → neue Tests rot.
- [ ] **Schritt 3:** Umsetzen.
- [ ] **Schritt 4:** `npm test` grün.

### Aufgabe 4: PDF-Bericht

**Files:**
- Modify: `js/bericht.js` (`berichtDaten`, `berichtHtml`)
- Test: `tests/bericht.test.js`

**Interfaces:**
- Consumes: `imZeitraum`, `artVon` (Aufgabe 2); `gewichtDiagramm(…, bis)`, `zeitleiste`, `PDF_RAND` (Aufgabe 3).
- Produces: `berichtDaten({ …, besondereTage = [] })` liefert zusätzlich `besondereTage` (Einträge, die `[von, bis]`
  berühren, nach `von`; Aufrufer übergibt nur die des Tiers). `berichtHtml(b, { …, besondereTage })`:
  - Gewichtsdiagramm mit `bis = b.bis`, darunter `zeitleiste(b.besondereTage, { vonTag: erste Wägung im Zeitraum, bisTag: b.bis, ...PDF_RAND })`.
  - Abschnitt `<h2>Besondere Tage</h2>` direkt nach „Gewicht“ (und nach „Fotos“, falls an), nur wenn es Einträge gibt:
    Satz „Vom Halter festgehalten, ohne Mengenangaben.“, Tabelle „Zeitraum | Art | Notiz“. Zeitraum: „03.11.2026“,
    „01.11.2026 bis 03.11.2026“, „seit 03.11.2026, läuft noch“ (ganzer Zeitraum, auch wenn er vor `b.von` beginnt).

- [ ] **Schritt 1: Tests schreiben**: Abschnitt fehlt ohne Einträge; mit drei Einträgen (eintägig, Phase über den
  Berichtsanfang, laufend) die drei Zeitraum-Texte; fremde Einträge außerhalb `[von, bis]` fehlen; Notiz maskiert;
  Abschnitt steht nach „Gewicht“ und vor „Fütterung“; unbekannte Art heißt „Sonstiges“; Diagramm-SVG enthält kein `NaN`
  und die Zeitleiste steht direkt danach.
- [ ] **Schritt 2:** rot. **Schritt 3:** umsetzen. **Schritt 4:** `npm test` grün.

### Aufgabe 5: Oberfläche

**Files:**
- Modify: `index.html` (Notfall-Kasten, Karte, Dialog), `app.js`, `styles.css`

**Interfaces:**
- Consumes: alles aus Aufgabe 1 bis 4.

`index.html`:
- Vor `#warnungen-liste`: `<div class="warnung warnung-sofort notfall-kasten" id="notfall-kasten" role="alert" hidden>`
  mit dem Notfall-Text (Global Constraints) in `<strong>`.
- Nach der Karte „Mahlzeiten“: `<section class="karte" aria-labelledby="besonders-titel">`, `<h2 id="besonders-titel">Besonderer Tag</h2>`,
  `<div id="heute-besonders"></div>`, `<button class="knopf-zweit" data-aktion="besonders-neu">Besonderen Tag eintragen</button>`.
- `<dialog id="dialog-besonders">` mit `<form method="dialog" id="form-besonders">`: Überschrift
  `id="besonders-dialog-titel" tabindex="-1" autofocus`; Feld „Was war besonders?“ (`#label-besonders-art`,
  `#besonders-art` für `auswahlFeld` mit `name: "art"`, Optionen aus `BESONDERE_ARTEN`), `p.tipp#besonders-art-tipp`
  (zeigt `hinweis` der Art, sonst versteckt); „Datum“ `name="von" type="date" required`; Häkchen „Dauert mehrere Tage“
  `name="mehrere"` (ganze Zeile antippbar, ≥ 48 px); `#besonders-bis-feld` (versteckt ohne Häkchen) mit „bis“
  `name="bis" type="date"` und Tipp „Leer lassen, solange es noch anhält.“; „Notiz“ mit Zusatz „(freiwillig)“ bzw. bei
  „Sonstiges“ „(bitte ausfüllen)“, `name="notiz" maxlength="200"`; `p.fehler#besonders-fehler`; Abbrechen/Speichern.

`app.js`:
- `zeichneBesondereTage(tag, heute)` aus `zeichneHeute` aufrufen: `#notfall-kasten.hidden = !notfallJetzt(…)`
  (unabhängig vom gezeigten Tag); Liste `eintraegeAm(…)` als `ul.protokoll`: Knopf `data-aktion="besonders-bearbeiten"`
  mit Art (fett), Zeitraum und Notiz, Kreuz `data-aktion="besonders-loeschen"`; bei laufender Phase zusätzlich
  `data-aktion="besonders-beenden"` mit `artVon(art).ende ?? "Beendet"`. Leer: „Draußen gewesen, genascht, krank? Hier
  festhalten, damit du und der Tierarzt später seht, warum sich das Gewicht so bewegt.“
- `oeffneBesonders(eintrag = null)`: Titel „Besonderer Tag für {Name}“ bzw. „Besonderen Tag von {Name} ändern“;
  Datum vorbelegt mit dem gezeigten Tag (`gewaehlterTag`), `max = heute`; beim Ändern alle Werte inkl. Häkchen
  (`bis !== von`) und „bis“ (`null` → leer). „bis“ bekommt `min = von` bei jeder Änderung von „Datum“.
- `beimSpeichern("form-besonders", "besonders-fehler", …)` mit `eintragAusFormular`; neu: `push({ id: neueId(), tierId: tier.id, ...eintrag })`,
  ändern: `Object.assign(bearbeiteterTag, eintrag)`; dann `sichern()`. Ist danach `notfallJetzt` wahr und die Art
  `futter-verweigert`: `#notfall-kasten` in den sichtbaren Bereich scrollen.
- Klick-Fälle `besonders-neu`, `besonders-bearbeiten`, `besonders-loeschen` (`confirm("Diesen Eintrag löschen?")`),
  `besonders-beenden` (`beenden(e, tagSchluessel(gewaehlterTag))`, `sichern()`, Toast „✓ Wieder gesund“ bzw. „✓ Beendet“).
  Vorher per grep prüfen, dass die Namen im switch neu sind.
- `zeigeInfoblase`: Ziel in `svg.zeitleiste` → `naechsterZeitleistenEintrag` → Blase über dem Eintrag; Hilfslinie und
  aktiver Punkt der Kurve dabei verstecken.
- Mitziehen: `zeichneVerlaufAnsicht` und `zeichneBericht` übergeben `besondereTage` des Tiers (Bericht „alles“ zählt
  deren `von` zu den Anfängen); Rückfrage „Tier entfernen“ nennt „N besondere Tage“ / „1 besonderen Tag“;
  `zeichneSicherung` zählt `von` und `bis` (ohne `null`) als Eintragstage.

`styles.css`: `.zeitleiste` (Breite 100 %, `overflow: visible`), `.zl-balken` (`stroke: var(--text-leise)`,
Breite 8, runde Enden), `.zl-punkt` (`fill: var(--text-leise)`), `.notfall` in `var(--gefahr)`, Legenden-Zeichen
`i.besonders`, Notfall-Kasten mit etwas mehr Schrift als `.warnung`, Häkchen-Zeile und Beenden-Knopf ≥ 48 px.
Druckansicht: Zeitleiste sichtbar.

- [ ] **Schritt 1:** HTML und CSS. **Schritt 2:** app.js. **Schritt 3:** `npm test` grün.
- [ ] **Schritt 4:** Browser-Prüfung (siehe Aufgabe 7).

### Aufgabe 6: Demo, Version, Cache

**Files:**
- Modify: `werkzeuge/erzeuge-testdaten.js` → `node werkzeuge/erzeuge-testdaten.js` erzeugt `demo/kito-simulation.json` neu
- Modify: `index.html` (`#version` → „Version 0.33.0“), `sw.js` (`kilossos-v60`, `"js/besondere-tage.js"` in `DATEIEN`),
  `tests/wissen.test.js` (Versions-Test „Version 0.33.0: Cache v60 …“)

Demo-Einträge (alle Notizen beginnen mit „Simulation:“): Phase `krank` 3 Tage in Woche 15 (abgeschlossen),
4 × `genascht` verteilt, Phase `futterumstellung` 7 Tage in Woche 20, laufende Phase `weniger-bewegung` seit 9 Tagen vor
dem letzten Tag. Kein `futter-verweigert` (sonst stünde in der Demo der rote Kasten). Das Skript prüft weiter jeden Tag
mit `warnungen()`.

- [ ] **Schritt 1:** Versions-Test anpassen → rot. **Schritt 2:** umsetzen, Demo neu erzeugen. **Schritt 3:** `npm test` grün.

### Aufgabe 7: Prüfen, Review, Abschluss

- [ ] Browser (`preview_start` `kilossos`, vorher Service Worker und Caches löschen, Tab auf localhost prüfen):
  Demo: Karte, laufende Phase mit „Beendet“, Zeitleiste im Verlauf (1 Monat, 3 Monate, alles), Infoblase per Tippen,
  Bericht mit Abschnitt und Zeitleiste. Echte Daten (leeres `localStorage` im Vorschau-Tab): sofort eintragen
  („Krank“, „bis“ leer), nachtragen (zurückblättern, Phase mit „bis“), „Wieder gesund“, ändern (Schalter aus/an, Art
  wechseln), löschen (`window.confirm = () => true`; seit 0.52.0 stattdessen `#rueckfrage-ja` im eigenen Blatt), „Futter verweigert“ heute → roter Kasten oben, vor 5 Tagen → kein
  Kasten, „Sonstiges“ ohne Notiz → Fehler, zweites Tier: nichts sichtbar, Tier entfernen (Text), Sicherung speichern
  und wieder einlesen, alte Sicherung 0.28 einlesen. 375 px, hell, dunkel, 150 % Schrift, Tastatur (Tab durch Dialog,
  Enter speichert, Fokus kehrt zurück), keine Konsolenfehler.
- [ ] Review durch frischen Opus-Agenten mit Prompt: Spec + Plan + Diff; gezielt fragen: „Kann ein Eintrag eines anderen
  Tiers irgendwo erscheinen?“, „Kann eine alte Sicherung abgelehnt oder verändert werden?“, „Kann der rote Kasten zu
  Unrecht fehlen oder zu Unrecht erscheinen?“, „Stimmt die Zeitachse in Kurve, Zeitleiste und PDF überein?“.
  Funde beheben, im Browser nachprüfen.
- [ ] Commit (`feat: Besonderer Tag …, Version 0.33.0`), Push, live 0.33.0 / v60 per curl prüfen, HANDOFF und
  Ideen-Tafel-Karte `mph346jq2gw1ws0294so` aktualisieren.

## Entscheidungen im Plan (Spec ließ sie offen)

- Feldnamen `besondereTage`, `art`, `von`, `bis` (`null` = läuft), `notiz`.
- Notfall-Kasten hängt nur am echten Datum und erscheint deshalb auf jedem gezeigten Tag, solange er gilt (es geht um
  die Katze jetzt, nicht um den gezeigten Tag).
- Zeitleiste als eigenes SVG unter der Kurve mit gleicher x-Skala (die Kurve und ihre Tests bleiben unberührt).
  Farbe `--text-leise`: unterscheidet sich vom sicheren Bereich (Salbei) und von den Freigabe-Marken (Bernstein).
- Abschnitt „Besondere Tage“ im PDF direkt nach dem Gewicht, weil er Knicke in der Kurve erklärt.
- Ein Eintrag mit unbekannter Art lässt sich ändern, verlangt dann aber eine Art aus der Liste (selten, nur nach
  Einlesen einer neueren Sicherung in eine ältere Fassung).
