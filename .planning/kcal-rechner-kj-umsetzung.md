# kJ-Schutz und kcal-Rechner: Umsetzungsplan (0.32.0)

> **Stand 05.11.2026: gebaut als Version 0.32.0** (Aufgaben 1 bis 6 erledigt, Tests 307/307, Browser-Prüfung, Review).
> Offen: Handy-Test mit Stefan. Abweichungen und Review-Funde stehen ganz unten.

> **Für Bauer (Claude oder Codex):** Schritt für Schritt abarbeiten, Tests zuerst (`superpowers:test-driven-development`).
> Häkchen `- [ ]` beim Erledigen setzen.

**Ziel:** Im Fenster „Eigene Sorte“ rutscht ein kJ- oder kcal-pro-kg-Wert nie mehr still durch, und wer keine kcal auf der
Packung findet, kann sie aus den Analytischen Bestandteilen berechnen lassen.

**Aufbau:** Reine, testbare Prüf- und Rechenfunktionen in `js/rechnen.js`, Prüfung des neuen Felds `analyse` in
`js/daten.js`, Oberfläche (roter Kasten, Rechner) in `index.html`, `app.js` und `styles.css`. Keine neue JS-Datei.

**Technik:** Node-Tests ohne Zusatzpakete (`npm test`), Vanilla-JS-PWA.

**Spezifikation:** `.planning/kcal-rechner-kj.md` (von Stefan freigegeben, Texte dort sind endgültig).

## Feste Vorgaben

- Texte wörtlich aus der Spezifikation; zwischen Zahl und Einheit geschütztes Leerzeichen (` `).
- Kilossos nennt nie eine Futtermenge, auch nicht im Rechner.
- Kein `confirm()` und kein `alert()` für die Rückfrage.
- Tippflächen mindestens 48 px hoch; alle Antwort-Knöpfe gleich gestaltet.
- Datenformat `VERSION` bleibt 1; `tests/alte-sicherungen.test.js` bleibt unverändert grün.
- Version 0.32.0, Cache `kilossos-v58`.

## Migration (Skill `migration`, Ergebnis)

- **Leser von `futter`:** Mahlzeit-Auswahl, Tagessumme, Verlauf, PDF-Bericht, Scanner, Export. Keiner liest `analyse`,
  außer dem neuen Rechner.
- **Schreiber:** Fenster „Eigene Sorte“ (neu: `analyse`), `ausListe` (ohne `analyse`, bleibt so), `alteStartsorten`,
  `startwerteAktualisieren` (ändert nur kcal, Quelle, Notiz), „Sicherung einlesen“.
- **Bestand:** Keine Version vor 0.32.0 hat `analyse` an eine eigene Sorte geschrieben. Nichts umzuwandeln.
- **Vorwärts:** Sicherung von 0.32.0 in einer älteren App: `eintraegeBereinigen` prüft nur `id`, `name`, `kcalPro100g`;
  das unbekannte Feld bleibt stehen und wird mitgespeichert. Unschädlich.
- **Zurück (Rollback):** Commit zurücknehmen genügt; gespeicherte `analyse`-Felder bleiben liegen und stören nicht.
- **Prüfung:** `analyseBereinigen` entfernt ungültiges `analyse` beim Einlesen (`sicherungPruefen`, zählt bei `angaben`)
  und beim Laden (`laden`, nur im Arbeitsspeicher). Zweimal aufgerufen ändert es beim zweiten Mal nichts.

## Worauf das Review achten soll (von keinem Test der Spezifikation abgedeckt)

1. Kommazahlen-Summe knapp über 100 durch Rundung (10,3 + 5,9 + 2,1 + 0,3 + 81,4 = 100) wird nicht als „über 100 %“ abgelehnt.
2. „84 %“ mit Prozentzeichen im Rechner-Feld wird als 84 gelesen, nicht als „keine Zahl“.
3. Art nach „stimmt so“ oder nach „übernehmen“ geändert: Die Rückfrage kommt wieder.
4. Eine schon gespeicherte falsche Sorte (Nassfutter 307) öffnen und speichern: Rückfrage erscheint.
5. kcal-Feld leer, Rechner zeigt ein Ergebnis: eigene Meldung statt Browser-Blase (darum kein `required` am kcal-Feld).

---

### Aufgabe 1: Prüfung des kcal-Werts (`js/rechnen.js`)

**Dateien:** `js/rechnen.js`, `tests/rechnen.test.js`, `tests/futterliste.test.js`

**Schnittstellen (neu):**
- `KCAL_GRENZEN = { min: 20, max: 700, nass: 150, trocken: 450, leckerli: 450 }`, `KJ_PRO_KCAL = 4.184`
- `kcalPruefen(kcal: number|null, typ: string|"") → { stufe: "fehler"|"ok"|"rueckfrage"|"unmoeglich", kj?: number|null, proKg?: number|null }`
  `kj`/`proKg` auf eine Nachkommastelle, `null`, wenn das Ergebnis nicht in 20 bis 700 liegt. Ohne Art: `ok` (ab 20).
- `kcalKasten(kcal: number, typ: string, spanne: [min, max]) → null | { stufe, ueberschrift, saetze: string[], antworten: { aktion: "kcal-kj"|"kcal-kg"|"kcal-stimmt", wert?: number, titel, klein }[] }`

- [ ] Tests schreiben: alle Fälle aus „Tests“ der Spezifikation (307, 607, 150/150,1, 450/451, Leckerli 438, 1370, Nass 160,
  19, 701, 8000) und Texte: `kcalKasten(307, "nass", [61, 126])` → Überschrift
  „307 kcal pro 100 g sind für Nassfutter viel zu viel.“, Sätze „Nassfutter hat in der Kilossos-Futterliste 61 bis 126 kcal.
  Was steht auf der Packung hinter der 307?“ und „Ist es Trockenfutter? Dann ändere oben die Art.“, Antworten kJ (73,4),
  kcal pro kg (30,7), „Dort steht kcal pro 100 g“ / „Die 307 stimmen, so speichern“. 1370 trocken: Überschrift
  „Mehr als 700 kcal pro 100 g kann Kilossos nicht speichern.“, kein „kcal-stimmt“. 8000: nur „Diese Zahl passt zu keiner
  Einheit. Bitte vergleiche sie mit der Packung.“, keine Antworten. Nass 500: kein Satz „Ist es Trockenfutter?“.
  Alle Texte ohne normales Leerzeichen vor „kcal“ bzw. „g“.
- [ ] In `tests/futterliste.test.js`: alle Sorten der Futterliste → `kcalPruefen(...).stufe === "ok"`.
- [ ] `npm test` → rot (Funktionen fehlen).
- [ ] Bauen. Art im Text: „Nassfutter“, „Trockenfutter“, „Leckerli“ (Mehrzahl-Satz „Leckerli haben …“).
- [ ] `npm test` → grün.

### Aufgabe 2: Rechner-Prüfung (`js/rechnen.js`)

**Dateien:** `js/rechnen.js`, `js/futterliste.js`, `tests/rechnen.test.js`

**Schnittstellen (neu):**
- `FEUCHTE_TROCKEN_ANNAHME` zieht von `js/futterliste.js` nach `js/rechnen.js` (futterliste.js importiert sie, sonst
  Kreis-Import).
- `rechnerPruefen(eingaben: { protein, fett, asche, faser, feuchte: string }, typ) →`
  `{ art: "nichts" }` (alle leer) | `{ art: "keineZahl", felder: string[] }` | `{ art: "leer", leer: string[] }` (Namen
  „Protein“, „Fett“, „Asche“, „Faser“) | `{ art: "feuchteFehlt" }` | `{ art: "zuViel", summe }` (auf 0,1 gerundet) |
  `{ art: "feuchte100" }` | `{ art: "ergebnis", kcal (ganz), analyse: { …, feuchte: number|null }, angenommen: boolean, viel: boolean }`
- Lesen: `leseZahl` nach Abschneiden eines „%“ am Ende. Summe vor dem Vergleich auf 0,01 runden.

- [ ] Tests: Sheba als Nass → 77; Purina ohne Feuchte als Trocken → 346, `angenommen`; gleiche Werte als Nass →
  `feuchteFehlt`; 79 statt 7,9 → `zuViel` 169,1; Feuchte 100 mit lauter Nullen → `feuchte100`; Protein leer → `leer`
  ["Protein"]; „< 0,5“ → `keineZahl`; Summe 7,9 + 4,4 + 1,4 + 0,3 + 86 → `ergebnis`; „84 %“ → 84; Ergebnis über der
  Grenze (Fett 30, Nass) → `viel: true`; alle leer → `nichts`.
- [ ] `npm test` → rot, bauen, grün. `tests/futterliste.test.js` (Nachrechnung) bleibt grün.

### Aufgabe 3: Feld `analyse` im Datenformat (`js/daten.js`, `js/sicherung.js`)

**Dateien:** `js/daten.js`, `js/sicherung.js`, `tests/daten.test.js`

**Schnittstellen (neu):** `analyseGueltig(a) → boolean` (Objekt; Protein, Fett, Asche, Faser endliche Zahlen 0 bis 100;
Feuchte `null` oder Zahl 0 bis unter 100; Summe mit Feuchte als 0 höchstens 100, auf 0,01 gerundet),
`analyseBereinigen(daten) → number` (entfernte Felder).

- [ ] Tests: gültiges `analyse` bleibt beim Einlesen erhalten; ungültiges (Text, Wert 120, Summe 169, fehlendes Protein,
  Feuchte 100) wird entfernt, die Sorte bleibt, `angaben` zählt mit; `laden()` entfernt es auch; zweiter Aufruf → 0.
- [ ] Bauen; Kopfkommentar in `js/daten.js` (Feld `analyse`, seit 0.32.0); in `einleseFrage` den Satz um „bei den
  Analysewerten“ ergänzen (Test prüft nur „Einige Angaben im Profil“).
- [ ] `npm test` → grün, `tests/alte-sicherungen.test.js` unverändert.

### Aufgabe 4: Roter Kasten im Fenster (`index.html`, `app.js`, `styles.css`)

**Schnittstellen:** nutzt `kcalPruefen`, `kcalKasten` (Aufgabe 1), `kcalSpanne` aus `js/wissen.js`.

- [ ] `index.html`: am kcal-Feld `required` durch `aria-required="true"` ersetzen; darunter
  `<p class="tipp feld-tipp" id="kcal-satz">Bitte die kcal-Zahl eintragen, nicht kJ.</p>`, `<div id="kcal-kasten" hidden>`
  und `<p class="tipp" id="kcal-meldung" aria-live="polite" tabindex="-1">`.
- [ ] `app.js`: Zustand je geöffnetem Fenster `kcalBestaetigt` und `kcalVertraut` (je `{ text, typ }`, bei
  `oeffneFutter` auf `null`). `kcalLage()` liefert die Stufe; „rueckfrage“ zählt als erledigt, wenn Text und Art zu
  `kcalBestaetigt` oder `kcalVertraut` passen. Kasten zeigen bei `change` am kcal-Feld, bei Art-Wechsel und beim Speichern;
  Feld bekommt `aria-invalid="true"` und `aria-describedby="kcal-satz kcal-kasten"`, sonst nur `kcal-satz`.
- [ ] Antworten über `data-aktion` `kcal-kj`, `kcal-kg` (Wert mit Komma eintragen, `kcalVertraut` setzen, Meldung
  „✓ 307 kJ umgerechnet: 73,4 kcal pro 100 g.“ bzw. „✓ 607 kcal pro kg umgerechnet: 60,7 kcal pro 100 g.“, Fokus auf die
  Meldung) und `kcal-stimmt` (Meldung „Bestätigt: 307 kcal pro 100 g stehen so auf der Packung.“).
- [ ] Speichern: offene Rückfrage oder „unmöglich“ → „Bitte zuerst die Frage im roten Kasten beantworten.“, Fokus auf die
  erste Antwort (ohne Antworten aufs Feld). Gilt auch beim Ändern.
- [ ] `styles.css`: roter Rand bei `aria-invalid`, `.antwort` (min. 52 px), Aufploppen 0,38 s.

### Aufgabe 5: Rechner im Fenster (`index.html`, `app.js`, `styles.css`)

**Schnittstellen:** nutzt `rechnerPruefen` (Aufgabe 2), `aufklappKarte` (id `kcal-rechner`, Zustand vor jedem Öffnen
mit `zustandVergessen` löschen).

- [ ] `<div id="futter-rechner">` unter `kcal-meldung`; in `oeffneFutter` zeichnen: aufgeklappt mit Werten, wenn die Sorte
  `analyse` hat, sonst zu. Fünf Felder (`inputmode="decimal"`, „%“ dahinter, Hinweis „oft „Rohprotein““ usw.).
- [ ] Ausgabe bei jeder Eingabe und bei Art-Wechsel neu, Texte aus Spezifikation B. Einziger neuer Text (Sonderfall,
  nur wenn alle anderen Werte 0 sind): `feuchte100` → „Die Feuchte kann nicht 100 % sein. Vergleiche die Zahlen bitte mit
  der Packung.“ Knopf `data-aktion="rechner-uebernehmen"`:
  Wert ins Feld, Quelle auf `geschaetzt`, `kcalVertraut` setzen, Kasten weg, Meldung
  „✓ 77 kcal eingetragen, Quelle „Aus den Bestandteilen berechnet“.“
- [ ] Speichern: kcal leer und Ergebnis → „Tippe im Rechner auf „77 kcal übernehmen“ oder trag den Wert oben ein.“;
  Rechner weder leer noch Ergebnis → „Im Rechner fehlen noch Werte oder einer stimmt nicht. Ergänze sie oder leere die
  Felder.“; Ergebnis → `analyse` speichern; alles leer → vorhandenes `analyse` löschen.

### Aufgabe 6: Prüfen, Version, Abschluss

- [ ] Browser (`preview_start` „kilossos“, Demo): 375 px, hell, dunkel, 150 % Schrift, Tastatur; alle Punkte aus
  „Im Browser“ der Spezifikation und die fünf Review-Punkte oben; `window.confirm` wird nie aufgerufen; keine Konsolenfehler.
- [ ] Review durch einen frischen Opus-Agenten vor dem Commit; Funde beheben.
- [ ] Version 0.32.0: `sw.js` `kilossos-v58`, `index.html` `#version`, Test in `tests/wissen.test.js`; `npm test` grün.
- [ ] Commit (`feat: …, Version 0.32.0`), pushen, live prüfen; Karte `kcal-rechner-eigene-sorte` auf „erledigt“.

## Nach dem Bau (05.11.2026)

**Review durch einen frischen Opus-Agenten, zwei kritische Funde, beide behoben und im Browser nachgeprüft:**

- **K1:** Eine Umrechnung konnte einen Wert über der Grenze der Art liefern, der dann als sicher galt
  (Nassfutter „3430 kJ pro kg“ → „Dort steht kcal pro kg“ → 343 ohne weitere Frage). Jetzt gilt eine Umrechnung nur
  als sicher, wenn ihr Ergebnis selbst zur Art passt; sonst fragt der Kasten noch einmal (343 → „Dort steht kJ“ → 82).
- **K2:** Nach „übernehmen“ und einer Korrektur im Rechner (Feuchte 48 statt 84) blieb der alte Wert oben sicher.
  Jetzt verfällt ein übernommener Wert, sobald sich ein Rechner-Feld ändert.

**Weitere Funde, behoben:** Speichern-Knopf sprang beim Verlassen des Felds unter dem Finger weg (Prüfung jetzt über
`focusout`, nicht neu gezeichnet, wenn der Fokus auf Speichern, Abbrechen oder Löschen geht); geschütztes Leerzeichen
in „etwa 77 kcal“; „übernehmen“ nur bei 20 bis 700 kcal; Summe auf 0,1 aufgerundet (nie „100 %, mehr als 100 %“);
riesige Zahlen und „7,“ beim Tippen; Fehlertext verschwindet mit dem Kasten; zugeklappter Rechner klappt beim Fehler
auf und setzt den Fokus; Rechner-Ausgabe nur bei echter Änderung neu (Vorlesefunktion); Rückmeldung unter dem Feld ohne
doppelte Ansage; `sicher()` am Attributwert.

**Abweichungen von der Spezifikation (Stefan zur Kenntnis):**

- Neue Texte für Sonderfälle: „Die Feuchte kann nicht 100 % sein. Vergleiche die Zahlen bitte mit der Packung.“ (nur,
  wenn alle anderen Werte 0 sind); „Das passt zu keinem Katzenfutter. Vergleiche die Zahlen bitte mit der Packung.“
  (Ergebnis unter 20 oder über 700); Zusatz „(mit 8 % angenommener Feuchte)“ im Summentext.
- Bei einer Zahl ohne passende Einheit (z. B. 8000) steht die Überschrift „Mehr als 700 …“ mit darüber.
- Die Rückmeldung „✓ … umgerechnet“ bleibt stehen, bis sich Wert oder Art ändern (statt nur kurz).
- Wert oder Art geändert: Eine Bestätigung „stimmt so“ verfällt, auch beim Zurückändern.

**Offene Fragen an Stefan (nicht gebaut):**

- Sorten, die vor 0.32.0 mit einem kJ-Wert gespeichert wurden, fallen erst beim Speichern auf. Soll der Kasten schon
  beim Öffnen einer solchen Sorte erscheinen?
- Gefriergetrocknete Snacks ohne Feuchteangabe (z. B. 75/15/5/1): Mit 8 % angenommener Feuchte kommt „über 100 %“.
  Soll die Annahme dann auf „100 minus Summe“ sinken?
