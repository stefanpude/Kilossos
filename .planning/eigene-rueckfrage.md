# Eigene Rückfrage statt Browser-Fenster: Bauplan (Version 0.52.0)

> **Für ausführende Agenten:** Pflicht-Skill: superpowers:executing-plans (empfohlen, siehe unten) oder superpowers:subagent-driven-development. Schritte mit Kästchen (`- [ ]`) abhaken.

**Ziel:** Alle 20 Rückfragen über das graue Browser-Fenster `confirm()` laufen über ein eigenes Blatt im Kilossos-Stil mit klar beschrifteten Knöpfen.

**Aufbau:** Ein neues Modul `js/rueckfrage.js` mit einer Funktion `frage()`, die ein festes `<dialog id="dialog-rueckfrage">` aus `index.html` füllt, öffnet und ein Promise mit der Antwort liefert. Weil die Antwort jetzt später kommt (nicht mehr sofort wie bei `confirm()`), werden die betroffenen Abläufe in `app.js` `async`: Formulare verhindern das Schließen immer selbst und schließen das Blatt erst nach dem Speichern von Hand.

**Technik:** Reines HTML/CSS/JS (ES-Module), `<dialog>` mit `showModal()`, Tests mit `node --test` ohne Zusatzpakete.

**Grundlage:** Ideen-Karte `eigene-rueckfrage` (Status „geplant“, Entscheidung Stefan 04.11.2026), HANDOFF „Nächste Schritte“ 1, dieser Plan (Abschnitt „Festlegungen“).

## Warum

Sperrt ein Browser seine Fenster (Häkchen „keine weiteren Dialoge“) oder zeigt er sie nicht an, gilt jede Rückfrage als „Abbrechen“. Dann tut das Lösch-Kreuz scheinbar nichts, und eine sehr niedrige, vom Tierarzt so gewollte Tagesmenge lässt sich nicht speichern. Gefährlich ist das nicht (ohne Ja passiert nichts), aber verwirrend. Außerdem heißen die Knöpfe dort nur „OK“ und „Abbrechen“.

## Festlegungen

- **Alle Fragetexte bleiben wörtlich gleich.** Einzige Ausnahme: beim Monatsfoto fällt der Satz „„Abbrechen“ speichert … ohne das neue Foto.“ weg, weil der Knopf jetzt selbst sagt, was er tut.
- **Sicherheitsfrage in der Freigabe (unter 60 % RER) bleibt Wort für Wort gleich**, ebenso Reihenfolge und Rückgabetexte.
- **Vorgewählt ist immer der Nein-Knopf** (Fokus beim Öffnen). Escape, Zurück-Taste am Handy, Wischen nach unten und Tippen auf den Hintergrund zählen immer als Nein.
- **Lösch-Knöpfe rot umrandet** (`knopf-gefahr`), alle anderen Ja-Knöpfe grün (`knopf-haupt`).
- **Kein „Gelöscht. Rückgängig“ in 0.52.0** (Empfehlung, Stefan entscheidet beim Durchsehen). Grund: Die Rückfrage löst das eigentliche Problem schon; „Rückgängig“ bräuchte zusätzlich einen Knopf im Hinweis unten, eine Zeitgrenze und eigene Tests. Kann später als eigene Karte kommen.
- **Monatsfoto bekommt drei Wege** statt zwei: „Foto ersetzen“, „Ohne neues Foto speichern“, „Abbrechen“ (zurück ins Fenster, nichts gespeichert). Bisher hieß Abbrechen „ohne Foto speichern“, das war missverständlich.
- Das Blatt hat **keine eigene Überschrift**: Die Frage selbst ist der Name des Blatts (`role="alertdialog"`, `aria-labelledby="rueckfrage-text"`). So muss kein neuer Text erfunden werden.

### Alle 20 Stellen mit Knöpfen (zum Durchsehen für Stefan)

| Nr | Stelle in `app.js` (ca. Zeile) | Frage | Ja-Knopf | Nein-Knopf | Farbe |
|---|---|---|---|---|---|
| 1 | Ladefehler: alles löschen (231) | unverändert | Alles löschen | Abbrechen | rot |
| 2 | Ladefehler: letzte Rückfrage (232) | unverändert | Endgültig löschen | Abbrechen | rot |
| 3 | Ladefehler: Sicherung einlesen (252) | `einleseFrage` unverändert | Einlesen | Abbrechen | rot |
| 4 | Tier entfernen (972) | unverändert | Entfernen | Abbrechen | rot |
| 5 | Monatsfoto beim Ändern (1720) | ohne „Abbrechen“-Satz | Foto ersetzen (+ „Ohne neues Foto speichern“) | Abbrechen | grün |
| 6 | Monatsfoto beim Eintragen (1757) | ohne „Abbrechen“-Satz | Foto ersetzen (+ „Ohne neues Foto speichern“) | Abbrechen | grün |
| 7 | Foto entfernen (1898) | unverändert | Foto entfernen | Abbrechen | rot |
| 8 | Freigabe: Datum beim Korrigieren (1989) | `datumsFrage` unverändert | Ja, Datum stimmt | Nein, ändern | grün |
| 9 | Freigabe: Zahlendreher Ziel (1994) | `zielFrage` unverändert | Ja, Ziel stimmt | Nein, ändern | grün |
| 10 | Freigabe: unter 60 % RER (2003) | **wörtlich unverändert** | Ja, so festgelegt | Nein | grün |
| 11 | Freigabe: welche gilt (2019) | `geltungsFrage` unverändert | Ja, Datum stimmt | Nein, ändern | grün |
| 12 | Freigabe: gleicher Tag ersetzen (2020) | `ersetzenFrage` unverändert | Ersetzen | Abbrechen | grün |
| 13 | Freigabe löschen (2039) | `loeschFrage` unverändert | Freigabe löschen | Abbrechen | rot |
| 14 | Sorte löschen (2374) | unverändert | Sorte löschen | Abbrechen | rot |
| 15 | Sicherung einlesen unter „Mehr“ (2687) | `einleseFrage` unverändert | Einlesen | Abbrechen | rot, in der Einrichtung grün |
| 16 | Alle Daten löschen (2701) | unverändert | Alles löschen | Abbrechen | rot |
| 17 | Alle Daten löschen, letzte Rückfrage (2702) | unverändert | Endgültig löschen | Abbrechen | rot |
| 18 | Mahlzeit löschen (2964) | unverändert | Löschen | Abbrechen | rot |
| 19 | Gewicht löschen (2982) | unverändert | Löschen | Abbrechen | rot |
| 20 | Besonderen Tag löschen (2994) | unverändert | Löschen | Abbrechen | rot |

## Feste Regeln für alle Aufgaben

- Keine Mengenvorschläge, keine neuen medizinischen Aussagen. Sicherheitstexte nur mit Stefans Ja (hier: keine Änderung).
- Datenformat bleibt Version 1, nichts an `js/daten.js`.
- Tippflächen mindestens 48 px (Skill `mobile-design`), Farben nur aus vorhandenen Variablen in `styles.css`.
- Texte mit Umlauten, keine Gedankenstriche.
- Am Ende: `CACHE_NAME` in `sw.js` auf `kilossos-v100`, `js/rueckfrage.js` in `DATEIEN`, Version 0.52.0 in `index.html`.
- Commits mit `-c user.email="347438024+stefanpude@users.noreply.github.com"`.

## Worauf die Prüfung achten soll

1. **Doppelt tippen:** Zweimal schnell auf „Speichern“ oder „Löschen“ darf nur eine Rückfrage öffnen und nur einen Eintrag anlegen oder löschen. (Sperre `laeuft` in `beimSpeichern`; `frage()` bei schon offenem Blatt → `"nein"`. Test in Aufgabe 1, Quelltext-Test in Aufgabe 2.)
2. **Jeder Ausweg ist Nein:** Escape, Zurück-Taste, Wischen, Hintergrund und ein alter `returnValue` vom letzten Mal dürfen nie als Ja zählen. (Tests in Aufgabe 1.)
3. **Monatsfoto „Abbrechen“ ändert nichts:** Die Wägung darf vor der Frage nicht schon verändert sein. (Quelltext-Test in Aufgabe 4, Browser.)
4. **Ladefehler-Bildschirm:** Dort bricht `app.js` vor dem Einrichten der Blätter ab. Die Rückfrage muss trotzdem gehen, also darf `frage()` nichts aus `app.js` brauchen. (Browser in Aufgabe 5 mit kaputten Daten.)
5. **Handy-Ansicht:** 375 px, dunkel, 150 % Schrift: drei Knöpfe beim Monatsfoto passen untereinander, Text bricht sauber um, Blatt liegt über dem offenen Fenster. (Browser in Aufgabe 6.)

---

### Aufgabe 1: Blatt und Funktion `frage()`

**Dateien:**
- Neu: `js/rueckfrage.js`
- Ändern: `index.html` (neues Blatt vor `<div class="toast" …>`)
- Ändern: `styles.css` (Abschnitt „Blätter von unten“)
- Test: `tests/rueckfrage.test.js`

**Schnittstellen:**
- Liefert: `frage({ text, ja, nein = "Abbrechen", dritte = null, gefahr = false }, dialog = document.getElementById("dialog-rueckfrage")) → Promise<"ja" | "dritte" | "nein">`
- Liefert: `bestaetigt(optionen, dialog?) → Promise<boolean>` (genau dann `true`, wenn `frage()` `"ja"` liefert)

**Markup** (fest, so übernehmen):

```html
<!-- Eigene Rückfrage (0.52.0) statt Browser-confirm(). Gefüllt von js/rueckfrage.js. -->
<dialog id="dialog-rueckfrage" role="alertdialog" aria-labelledby="rueckfrage-text">
  <form method="dialog">
    <p id="rueckfrage-text" class="rueckfrage-text"></p>
    <div class="knoepfe rueckfrage-knoepfe">
      <button value="nein" class="knopf-zweit" id="rueckfrage-nein" autofocus>Abbrechen</button>
      <button value="dritte" class="knopf-zweit" id="rueckfrage-dritte" hidden></button>
      <button value="ja" class="knopf-haupt" id="rueckfrage-ja"></button>
    </div>
  </form>
</dialog>
```

- [ ] **Schritt 1: Fehlschlagende Tests schreiben** in `tests/rueckfrage.test.js`. Eine Attrappe `attrappe()` baut ein Objekt mit `open`, `returnValue`, `showModal()`, `close(wert)` (setzt `returnValue`, `open = false`, ruft die `close`-Hörer), `addEventListener("close", fn, { once })`, `querySelector("#rueckfrage-…")` mit Elementen `{ textContent, hidden, focus(), classList.toggle(name, an) }` und `ownerDocument.activeElement`. Tests:
  - `frage: Ja liefert "ja"`: `const p = frage({ text: "A?", ja: "Löschen" }, d); d.close("ja"); assert.equal(await p, "ja")`
  - `frage: Escape, Hintergrund und Wischen liefern "nein"`: je einmal `d.close("")`, `d.close("abbrechen")`, `d.close()` → `"nein"`
  - `frage: alter returnValue zählt nicht`: `d.returnValue = "ja"` vorher, dann `d.close("")` → `"nein"`
  - `frage: dritter Weg`: mit `dritte: "Ohne neues Foto speichern"` ist `#rueckfrage-dritte` sichtbar und beschriftet, `d.close("dritte")` → `"dritte"`; ohne `dritte` ist der Knopf `hidden === true`
  - `frage: Texte und Knöpfe`: `textContent` von Text, Ja und Nein wie übergeben, Nein standardmäßig „Abbrechen“
  - `frage: Fokus auf Nein`: nach dem Öffnen wurde `focus()` von `#rueckfrage-nein` aufgerufen
  - `frage: Farbe`: `gefahr: true` → Ja hat `knopf-gefahr` an und `knopf-haupt` aus; `gefahr: false` umgekehrt
  - `frage: schon offen → sofort "nein"`, `showModal` nicht ein zweites Mal aufgerufen
  - `frage: Fokus zurück`: Das vorher fokussierte Element (`ownerDocument.activeElement`, `isConnected: true`) bekommt nach dem Schließen `focus()`
  - `bestaetigt: true nur bei "ja"`
  - `index.html: Blatt mit role="alertdialog", aria-labelledby="rueckfrage-text", Knöpfe nein/dritte/ja in dieser Reihenfolge, Nein mit autofocus`
- [ ] **Schritt 2: Tests laufen lassen:** `node --test tests/rueckfrage.test.js` → FAIL (Modul fehlt)
- [ ] **Schritt 3: `js/rueckfrage.js` schreiben.** `returnValue` vor `showModal()` auf `""` setzen. Antwort aus dem `close`-Ereignis (`once`): `"ja"` oder `"dritte"`, alles andere `"nein"`. Nichts aus `app.js` importieren (Ladefehler-Bildschirm). Text per `textContent`, nie `innerHTML` (Namen von Tieren und Sorten stehen in den Fragen). Fokus-Rückgabe nur, wenn das gemerkte Element noch `isConnected` ist.
- [ ] **Schritt 4: Markup in `index.html`, CSS in `styles.css`:** `.rueckfrage-text { white-space: pre-line; margin: 0; font-size: 1rem; }` (Absätze aus `\n\n`), `.rueckfrage-knoepfe` erbt von `.knoepfe` (styles.css ca. Zeile 1020, schon `flex-wrap: wrap`), Knöpfe dort `flex: 1 1 auto`; `.rueckfrage-knoepfe .knopf-gefahr { margin-right: 0; }`. Bei sichtbarem dritten Knopf stehen alle drei untereinander (`#dialog-rueckfrage:has(#rueckfrage-dritte:not([hidden])) .rueckfrage-knoepfe { flex-direction: column-reverse; }`, damit „Foto ersetzen“ oben steht).
- [ ] **Schritt 5: Tests laufen lassen:** `npm test` → alle grün
- [ ] **Schritt 6: Commit** `feat: eigenes Rückfrage-Blatt (noch nicht verwendet)`

### Aufgabe 2: Speichern wartet auf die Antwort, einfache Lösch-Stellen

**Dateien:**
- Ändern: `app.js` (`beimSpeichern` ca. 1259, Fokus-Schleife ca. 1155, Stellen 4, 7, 14, 18, 19, 20)
- Test: `tests/rueckfrage.test.js`

**Schnittstellen:**
- Nutzt: `bestaetigt()` aus Aufgabe 1
- Liefert: `beimSpeichern(formId, fehlerId, pruefenUndSpeichern)`, wobei `pruefenUndSpeichern` jetzt auch ein Promise liefern darf (Fehlertext, `""` = offen lassen ohne Meldung, `{ toast }` oder `undefined`)

- [ ] **Schritt 1: Fehlschlagende Quelltext-Tests** (Muster wie `tests/freigaben.test.js`, `readFileSync("app.js")`):
  - `beimSpeichern verhindert das Schließen immer, wartet und schließt selbst`: im Rumpf von `beimSpeichern` stehen `ereignis.preventDefault()` vor `await pruefenUndSpeichern(`, `if (laeuft) return`, `.close("speichern")`
  - `Fokus-Schleife überspringt dialog-rueckfrage`
  - `Lösch-Stellen fragen mit eigenem Blatt`: für `mahlzeit-loeschen`, `gewicht-loeschen`, `besonders-loeschen` steht im `case`-Block `await bestaetigt({ text: "…", ja: "Löschen", gefahr: true })` mit dem bisherigen Text; Sorte mit `ja: "Sorte löschen"`, Foto mit `ja: "Foto entfernen"`, Tier mit `ja: "Entfernen"`
- [ ] **Schritt 2:** `node --test tests/rueckfrage.test.js` → FAIL
- [ ] **Schritt 3: `beimSpeichern` umbauen:** Handler `async`, bei `submitter.value === "speichern"` sofort `preventDefault()`, Sperre `laeuft` pro Formular (in `finally` lösen), `FormData` vor dem `await` bilden, bei Text `zeigeFehler`, sonst `$(formId).closest("dialog").close("speichern")` und Toast wie bisher (nicht bei `speicherFehler`).
- [ ] **Schritt 4: Fokus-Schleife** (`for (const dialog of document.querySelectorAll("dialog"))` mit `oeffner`): `dialog-rueckfrage` auslassen, die Rückfrage gibt den Fokus selbst zurück.
- [ ] **Schritt 5: Stellen 18–20** im Klick-Verteiler: `case` mit `return (async () => { if (!(await bestaetigt(…))) return; … sichern(); })();` oder eigene kleine `async`-Funktion; nach dem `await` per `id` neu filtern (wie bisher).
- [ ] **Schritt 6: Stellen 4 und 14** (Submit mit `value="entfernen"`/`"loeschen"`): Handler `async`, immer `preventDefault()`, nach Ja ausführen und Blatt von Hand schließen (`$("dialog-profil").close("entfernen")`, `$("dialog-futter").close("loeschen")`). Nach dem `await` prüfen, ob `bearbeitetesTier`/`bearbeitetesFutter` noch dasselbe Objekt ist, sonst nichts tun.
- [ ] **Schritt 7: Stelle 7** (`fotoEntfernen`): `async`, nach dem `await` prüfen, ob `angesehen === waegung` und das Foto-Blatt noch offen ist, sonst nichts tun.
- [ ] **Schritt 8:** `npm test` → alle grün
- [ ] **Schritt 9: Commit** `feat: Löschen und Speichern fragen mit eigenem Blatt`

### Aufgabe 3: Freigabe (Stellen 8–13)

**Dateien:**
- Ändern: `app.js` (Freigabe speichern ca. 1967–2033, löschen ca. 2036–2047)
- Ändern: `tests/freigaben.test.js` (zwei Reihenfolge-Tests suchen bisher `!confirm(plan.datumFrage)` und `!confirm(plan.zielFrage)`)
- Test: `tests/rueckfrage.test.js`

**Schnittstellen:**
- Nutzt: `bestaetigt()` (Aufgabe 1), asynchrones `beimSpeichern` (Aufgabe 2)

- [ ] **Schritt 1: Tests anpassen und ergänzen:**
  - In `tests/freigaben.test.js` die Suchtexte auf `if (plan.datumFrage && !(await bestaetigt({ text: plan.datumFrage, ja: "Ja, Datum stimmt", nein: "Nein, ändern" })))` und entsprechend `plan.zielFrage` / `"Ja, Ziel stimmt"` ändern; Reihenfolge-Prüfung bleibt.
  - Neu: `Sicherheitsfrage unter 60 % wörtlich gleich`: Der Text `"Das empfehlen die Leitlinien nur mit einem Fachtierarzt für Ernährung. Hat der Tierarzt das genau so festgelegt?"` steht genau einmal in `app.js`, im selben Aufruf `ja: "Ja, so festgelegt"` und `nein: "Nein"`, danach weiter `return "Bitte die Tagesmenge mit dem Tierarzt klären.";`
  - Neu: Reihenfolge datumFrage < zielFrage < 60 % < `plan.frage` < `plan.ersetzen` bleibt.
  - Neu: Löschen mit `ja: "Freigabe löschen", gefahr: true`.
- [ ] **Schritt 2:** `npm test` → FAIL
- [ ] **Schritt 3: Speichern umbauen:** Rückruf an `beimSpeichern` `async`, jede der fünf Fragen mit `await bestaetigt(…)` und den Knöpfen aus der Tabelle; Rückgabetexte und Fokus (`datum.focus()`, `ziel.focus()`) wie bisher.
- [ ] **Schritt 4: Löschen umbauen** wie Stelle 13 in der Tabelle, Muster aus Aufgabe 2 Schritt 6 (`$("dialog-freigabe").close("loeschen")`, `oeffner` wie bisher setzen).
- [ ] **Schritt 5:** `npm test` → alle grün
- [ ] **Schritt 6: Commit** `feat: Freigabe-Rückfragen im eigenen Blatt, Sicherheitsfrage unverändert`

### Aufgabe 4: Monatsfoto mit drei Wegen (Stellen 5 und 6)

**Dateien:**
- Ändern: `app.js` (Gewicht speichern ca. 1699–1790)
- Test: `tests/rueckfrage.test.js`

**Schnittstellen:**
- Nutzt: `frage()` mit `dritte` (Aufgabe 1)

Text (fest): ``Seit dem letzten Foto-Tag gibt es schon ein Monatsfoto (vom ${datumText(vorhanden.datum)}). Soll das neue Foto es ersetzen?`` Knöpfe: `ja: "Foto ersetzen"`, `dritte: "Ohne neues Foto speichern"`, `nein: "Abbrechen"`.

- [ ] **Schritt 1: Fehlschlagende Quelltext-Tests:**
  - `Monatsfoto: kein „Abbrechen speichert“-Satz mehr` (`app.js` enthält nicht `„Abbrechen“ speichert`)
  - `Monatsfoto beim Ändern fragt vor waegungAendern`: Im Rückruf von `beimSpeichern("form-gewicht", …)` steht der `frage(`-Aufruf vor `waegungAendern(bearbeiteteWaegung`
  - `Monatsfoto: "nein" lässt das Fenster offen`: nach dem `frage(`-Aufruf folgt `return "";` für `"nein"`
- [ ] **Schritt 2:** `npm test` → FAIL
- [ ] **Schritt 3: Ändern-Zweig:** `vorhanden` mit dem neuen Datum aus `werte.get("datum")` berechnen (bisher nach `waegungAendern` aus `bearbeiteteWaegung.datum`), dann fragen, bei `"nein"` `return ""`, erst danach `waegungAendern`. Weiter wie bisher mit `ersetzen = antwort === "ja"`.
- [ ] **Schritt 4: Eintragen-Zweig:** gleich, `"nein"` → `return ""`, bevor `eintrag` in `daten.gewichte` landet.
- [ ] **Schritt 5:** `npm test` → alle grün
- [ ] **Schritt 6: Commit** `feat: Monatsfoto ersetzen mit drei klaren Knöpfen`

### Aufgabe 5: Sicherung einlesen und alle Daten löschen (Stellen 1–3, 15–17)

**Dateien:**
- Ändern: `app.js` (`zeigeLadeFehler` ca. 182–260, Einlesen ca. 2670–2695, `allesLoeschen` ca. 2699)
- Test: `tests/rueckfrage.test.js`

**Schnittstellen:**
- Nutzt: `bestaetigt()` (Aufgabe 1)

- [ ] **Schritt 1: Fehlschlagende Quelltext-Tests:**
  - `Kein Browser-Fenster mehr`: `app.js` und alle Dateien in `js/` enthalten kein `confirm(` (Regex `/\bconfirm\(/`)
  - `Alle Daten löschen fragt zweimal`: in `allesLoeschen` und im Ladefehler-Zweig `"loeschen"` je `ja: "Alles löschen"` vor `ja: "Endgültig löschen"`, beide `gefahr: true`, Texte unverändert
  - `Einlesen`: beide Stellen `ja: "Einlesen"`; unter „Mehr“ `gefahr: !einrichtungLaeuft`, im Ladefehler `gefahr: true`
- [ ] **Schritt 2:** `npm test` → FAIL
- [ ] **Schritt 3: Umbauen.** Klick-Hörer der Ladefehler-Karte `async`. `allesLoeschen` `async`. Die beiden `change`-Hörer sind schon `async`.
- [ ] **Schritt 4:** `npm test` → alle grün
- [ ] **Schritt 5: Commit** `feat: Einlesen und Alles-Löschen fragen im eigenen Blatt`

### Aufgabe 6: Version, Browser-Prüfung, Prüfer, hochladen

**Dateien:**
- Ändern: `sw.js` (`CACHE_NAME = "kilossos-v100"`, `"js/rueckfrage.js"` in `DATEIEN`), `index.html` (Versionszeile `Version 0.52.0`), `tests/wissen.test.js` (Versions-Test auf 0.52.0 / v100 / `js/rueckfrage.js`)

- [ ] **Schritt 1: Versions-Test anpassen**, `npm test` → FAIL, dann `sw.js` und `index.html` ändern, `npm test` → alle grün.
- [ ] **Schritt 2: Browser-Prüfung** in der Demo (`node server.js`, Vorschau `kilossos`), 375 px hell und dunkel: alle 20 Stellen einmal mit Ja und einmal mit Nein (bzw. Escape), Monatsfoto alle drei Wege, Sicherheitsfrage 60 % (Freigabe mit sehr niedriger kcal), doppeltes Tippen auf „Speichern“, 150 % Schrift. Ladefehler-Bildschirm: in einem eigenen Test-Speicher kaputte Daten (`kilossos-daten` = `"{"`), dort „Alle Daten löschen“ mit Abbrechen (Daten bleiben) und Sicherung einlesen. Keine Konsolenfehler. Hinweis: `window.confirm = () => true` aus früheren Prüfungen wirkt nicht mehr, die Knöpfe im Blatt antippen.
- [ ] **Schritt 3: Opus-Prüfer** im Hintergrund über den ganzen Umbau (Schwerpunkt: Abschnitt „Worauf die Prüfung achten soll“), Funde beheben.
- [ ] **Schritt 4: Commit** `feat: eigene Rückfrage statt Browser-Fenster, Version 0.52.0`, Push, Live-Prüfung (`sw.js` bis `kilossos-v100`, dann Demo live: eine Lösch-Rückfrage, Monatsfoto, Sicherheitsfrage).
- [ ] **Schritt 5: Nachträge:** Ideen-Karte `eigene-rueckfrage` auf „erledigt“ (oder „spaeter“, falls Stefan „Rückgängig“ noch will), HANDOFF, `.planning/freigabe-aendern-umsetzung.md` und `.planning/besonderer-tag-umsetzung.md` enthalten Prüfhinweise mit `window.confirm`: dort einen Satz „seit 0.52.0 eigenes Blatt“ ergänzen.

## Ausführung

Empfehlung: **selbst in dieser Sitzung bauen** (superpowers:executing-plans) mit einem Opus-Prüfer am Ende. Grund: Alle Aufgaben ändern nacheinander `app.js` und bauen auf `frage()` und dem neuen `beimSpeichern` auf; getrennte Helfer würden sich gegenseitig im Weg stehen. So lief es auch bei 0.50.0 und 0.51.0 gut.
