# Freigabe ändern und löschen: Umsetzungsplan (0.34.0)

> **Für ausführende Agenten:** Mit superpowers:executing-plans Aufgabe für Aufgabe umsetzen (Stefan hat beim
> 0.33.0-Bau inline gewählt, so auch hier). Schritte als Checkboxen (`- [ ]`).

**Ziel:** Jede Freigabe eines Tiers lässt sich unter „Mehr“ ändern und löschen; zwei Freigaben am selben Tag entstehen
nicht mehr, und nie gilt still eine andere Freigabe, als man erwartet.

**Aufbau:** Reine Regeln und Texte in einer neuen Datei `js/freigaben.js` (ohne Browser testbar, wie
`js/besondere-tage.js`). `aktuelleFreigabe` in `js/rechnen.js` bekommt eine feste Regel bei gleichem Datum.
`app.js` verdrahtet Tafel, Liste „Frühere Freigaben“, Ändern-Modus, Löschen und die Rückfragen über `confirm()`.

**Technik:** Vanilla JS (ES-Module), `node --test tests/` ohne Zusatzpakete, PWA mit Service Worker.

**Entwurf:** `.planning/freigabe-aendern.md` (von Stefan freigegeben: „Passt, bauen“, 05.11.2026). Plan und Entwurf
zusammen lesen; bei Widerspruch gilt der Entwurf.

## Globale Vorgaben

- Datenformat bleibt Version 1, kein neues Feld, keine Umwandlung; alte Sicherungen bleiben gültig.
- Texte deutsch, Umlaute, keine Gedankenstriche als Satzzeichen; zwischen Zahl und Einheit ` ` (JS) bzw. `&nbsp;`.
- Zahlen im Text: Ziel mit 2 Nachkommastellen („7,20 kg“), kcal ganzzahlig, Datum über `datumText` („13. Nov. 2026“).
- Keine echten Werte von Stefans Katzen in Tests (öffentliches Repo): Beispielkatze mit Ziel 5,5 kg / 210 kcal u. ä.
- Tippflächen mindestens 48 px; Tafel als Knopf sieht aus wie vorher (Höhe vorher/nachher messen).
- Werte aus Daten in HTML immer über `sicher()`; auch `data-id`.
- `confirm()` im Browser-Pane mit `window.confirm = () => true` (bzw. `false`) testen. (Seit 0.52.0 gibt es kein `confirm()` mehr, sondern das eigene Blatt `#dialog-rueckfrage`: dort `#rueckfrage-ja` bzw. `#rueckfrage-nein` antippen, Ja erst nach 400 ms.)
- Version 0.34.0, `CACHE_NAME` `kilossos-v61`, neue Datei `js/freigaben.js` in `DATEIEN`.

## Prüf-Schwerpunkte (von keinem Einzeltest ganz abgedeckt)

1. Mehrere Tiere: Liste, Gleicher-Tag-Prüfung und „danach gilt“ dürfen nie Freigaben eines anderen Tiers sehen.
   → Test in Aufgabe 2 (`freigabenAmTag` bekommt schon gefilterte Liste; Test mit fremdem Tier in `fruehereFreigaben`
   ist Sache des Aufrufers) und Browser-Prüfung mit zwei Tieren.
2. Fenster schließen ohne Speichern (Abbrechen, Esc, Zurück-Geste) und danach „Freigabe eintragen“: muss neu anlegen,
   nicht die zuletzt bearbeitete überschreiben. → Browser-Prüfung in Aufgabe 4.
3. Rückfrage abgebrochen: Fenster bleibt offen, Daten unverändert (auch nicht halb geändert, weil `freigabeAendern`
   erst nach allen Rückfragen läuft). → Browser-Prüfung in Aufgabe 4.
4. Speicher voll beim Ändern/Löschen: `sichern()` lädt den alten Stand neu; kein „✓“-Toast. → Browser-Prüfung
   (`localStorage.setItem` per eingefügtem Skript werfen lassen).
5. Große Schrift (150 %) und 375 px: Tafel-Knopf und Zeilen brechen sauber um, nichts abgeschnitten. → Browser-Prüfung.

---

### Aufgabe 1: `aktuelleFreigabe` bei gleichem Datum

**Dateien:**
- Ändern: `js/rechnen.js` (Funktion `aktuelleFreigabe`, ca. Z. 270–273)
- Test: `tests/grenzen.test.js` (neben „aktuelleFreigabe nimmt die neueste“)

**Schnittstellen:**
- Liefert: `aktuelleFreigabe(freigaben, stichtag = "9999-12-31")`, gleiche Signatur; bei gleichem Datum gewinnt die
  spätere Stelle im Array.

- [ ] **Schritt 1: Test schreiben**

```js
test("aktuelleFreigabe: bei gleichem Datum gilt die zuletzt eingetragene", () => {
  const erste = { id: "a", datum: "2026-11-13", kcalProTag: 230 };
  const zweite = { id: "b", datum: "2026-11-13", kcalProTag: 210 };
  assert.equal(aktuelleFreigabe([erste, zweite]), zweite);
  assert.equal(aktuelleFreigabe([erste, zweite], "2026-11-13"), zweite);
  assert.equal(aktuelleFreigabe([{ id: "c", datum: "2026-11-20" }, erste, zweite]).id, "c");
});
```

- [ ] **Schritt 2:** `npm test` → der neue Test schlägt fehl (liefert `erste`).
- [ ] **Schritt 3:** `aktuelleFreigabe` als einfache Schleife: eine Freigabe mit `datum <= stichtag` ersetzt die bisher
  beste, wenn ihr Datum `>=` ist. Kommentar über der Funktion ergänzen („bei gleichem Datum die zuletzt eingetragene,
  seit 0.34.0“).
- [ ] **Schritt 4:** `npm test` → alles grün (bestehende Tests in grenzen, verlauf, bericht, zusammenfassung bleiben grün).

### Aufgabe 2: Regeln und Texte in `js/freigaben.js`

**Dateien:**
- Neu: `js/freigaben.js`
- Neu: `tests/freigaben.test.js`

**Schnittstellen:**
- Nutzt: `aktuelleFreigabe` (Aufgabe 1), `datumText` aus `js/mehr.js`, `befundText` aus `js/daten.js`.
- Liefert (alle Listen sind die Freigaben **eines** Tiers, der Aufrufer filtert nach `tierId`):
  - `freigabeAendern(freigabe, { datum, zielgewichtKg, kcalProTag, tierarzt, notiz, bcs, mcs })` → `undefined`, ändert
    an Ort und Stelle; `notiz` getrimmt (`null`/fehlend → `""`), `tierarzt` getrimmt; `bcs`/`mcs` leer
    (`undefined`, `null`, `""`) → Feld wird gelöscht, sonst gesetzt. `id` und `tierId` bleiben.
  - `freigabenAmTag(freigaben, datum, ohneId = null)` → Array der Freigaben mit diesem Datum, ohne die mit `ohneId`.
  - `fruehereFreigaben(freigaben)` → alle außer `aktuelleFreigabe(freigaben)`, neueste zuerst; bei gleichem Datum
    die später eingetragene zuerst. Leeres Array bei 0 oder 1 Freigabe.
  - `freigabeKurz(f)` → `"Ziel 5,50 kg, 210 kcal"`.
  - `loeschFrage(freigaben, freigabe, name, heute)` → Text für `confirm()`.
  - `geltungsFrage({ vorher, nachher, id, neu, heute })` → Text oder `null`. `vorher`/`nachher`: Listen vor und
    nach dem Speichern (in `nachher` steht die gespeicherte Freigabe mit `id`); `neu`: `true` beim Eintragen.
  - Konstanten für Fehlertexte: `TEXT_ZWEI_AM_TAG`, `TEXT_ANDERE_AM_TAG`, `TEXT_GLEICHER_TAG_NICHT_GESPEICHERT`,
    `TEXT_DATUM_PRUEFEN`, `HINWEIS_AENDERN` (wörtlich aus dem Entwurf).
  - `ersetzenFrage(vorhandene)` → „Für den <Datum> gibt es schon eine Freigabe (<freigabeKurz>). Soll die neue sie
    ersetzen?“

- [ ] **Schritt 1: Tests schreiben** (`tests/freigaben.test.js`; Beispielwerte, keine echten Katzenwerte)

```js
const fr = (id, datum, ziel = 5.5, kcal = 210, extra = {}) =>
  ({ id, tierId: "t", datum, zielgewichtKg: ziel, kcalProTag: kcal, tierarzt: "Praxis Beispiel", notiz: "", ...extra });

test("freigabeAendern: setzt alle Felder, Kennung und Tier bleiben", ...);
//  fr("a","2026-11-13",5.5,210,{bcs:8,mcs:<gültiger Schlüssel>}) ändern auf datum "2026-11-12", 5.2, 200,
//  tierarzt "  Praxis Neu  ", notiz "  Kontrolle  ", bcs 7, mcs <anderer Schlüssel>
//  → deepEqual { id:"a", tierId:"t", datum:"2026-11-12", zielgewichtKg:5.2, kcalProTag:200,
//                tierarzt:"Praxis Neu", notiz:"Kontrolle", bcs:7, mcs:<anderer> }
test("freigabeAendern: BCS und MCS „Keine Angabe“ entfernen die Felder ganz", ...);
//  bcs: undefined, mcs: "" → assert.equal("bcs" in f, false); assert.equal("mcs" in f, false); notiz null → ""
test("freigabenAmTag: findet Freigaben am Datum, beim Ändern nie sich selbst", ...);
//  [a 13.11., b 13.11., c 12.11.]: amTag(...,"2026-11-13") → [a,b]; mit ohneId "a" → [b]; "2026-11-14" → []
test("fruehereFreigaben: alle außer der geltenden, neueste zuerst", ...);
//  [c 01.10., a 13.11., b 20.10.] → [b, c]; eine → []; keine → []
test("fruehereFreigaben: zwei am selben Tag: die spätere gilt, die frühere steht in der Liste", ...);
//  [a 13.11., b 13.11.] → [a]
test("freigabeKurz: Ziel mit zwei Stellen, kcal ganz, geschützte Leerzeichen", ...);
//  → "Ziel 5,50 kg, 210 kcal"
test("loeschFrage: danach gilt wieder die ältere", ...);
//  [alt 01.10. (6,00/230), neu 13.11.], neu löschen, heute "2026-11-15"
//  → "Freigabe vom 13. Nov. 2026 (Ziel 5,50 kg, 210 kcal) löschen? Danach gilt wieder die Freigabe vom
//     1. Okt. 2026 (Ziel 6,00 kg, 230 kcal)."
test("loeschFrage: einzige Freigabe", ...);
//  → "Freigabe vom 13. Nov. 2026 (Ziel 5,50 kg, 210 kcal) löschen? Danach hat Mia keine Freigabe mehr:
//     Kilossos zeichnet nur noch auf und zeigt kein Ziel und keine Tagesmenge."
test("loeschFrage: ältere Freigabe ohne Wirkung auf heute", ...);
//  [alt, neu], alt löschen → "Freigabe vom 1. Okt. 2026 (Ziel 6,00 kg, 230 kcal) löschen?"
test("geltungsFrage: neu mit Datum vor der geltenden fragt", ...);
//  vorher [g 13.11.], nachher [g, n 01.11.], id "n", neu true
//  → "Die Freigabe vom 13. Nov. 2026 ist neuer und gilt weiter. Diese wird als frühere Freigabe gespeichert.
//     Stimmt das Datum?"
test("geltungsFrage: neu mit heutigem Datum fragt nicht", ...);           // → null
test("geltungsFrage: geltende nach hinten verschoben nennt die danach geltende", ...);
//  vorher [alt 01.10., g 13.11.], nachher [alt, g mit datum 2026-09-01], id "g"
//  → "Mit diesem Datum gilt nicht mehr diese Freigabe, sondern wieder die vom 1. Okt. 2026 (Ziel 6,00 kg,
//     230 kcal). Stimmt das Datum?"
test("geltungsFrage: frühere nach vorn verschoben", ...);
//  vorher [alt 01.10., g 13.11.], nachher [alt mit datum 2026-11-14, g], id "alt", heute "2026-11-15"
//  → "Mit diesem Datum gilt diese Freigabe ab sofort statt der vom 13. Nov. 2026 (Ziel 5,50 kg, 210 kcal).
//     Stimmt das Datum?"
test("geltungsFrage: nur Wert geändert fragt nicht", ...);                 // → null
test("Alte Daten mit zwei Freigaben am selben Tag laden unverändert", ...);
//  speichern(daten, testSpeicher) mit zwei Freigaben am 13.11., laden(speicher) → freigaben deepEqual, Länge 2
```

- [ ] **Schritt 2:** `npm test` → `tests/freigaben.test.js` schlägt fehl (Modul fehlt).
- [ ] **Schritt 3:** `js/freigaben.js` mit den Funktionen und Texten oben. `heute` immer als Parameter (kein
  `new Date()` in der Datei). `loeschFrage` und `geltungsFrage` messen mit `aktuelleFreigabe(liste, heute)`.
  `loeschFrage`: „gilt danach eine andere“ nur, wenn die gelöschte heute gilt und danach eine andere gilt; gilt danach
  keine, der Text „einzige“; gilt die gelöschte heute nicht, nur die kurze Frage.
- [ ] **Schritt 4:** `npm test` → alles grün.

### Aufgabe 3: Tafel, Liste „Frühere Freigaben“, Stile

**Dateien:**
- Ändern: `app.js` (`zeichneFreigabe`, ca. Z. 648–657; Import aus `js/freigaben.js`)
- Ändern: `index.html` (Gruppe „Tierarzt“, nach `#freigabe-tafel` ein Behälter `#freigaben-frueher`)
- Ändern: `styles.css` (Abschnitt „Freigabe-Tafel“, ca. Z. 398)

**Schnittstellen:**
- Nutzt: `fruehereFreigaben`, `freigabeKurz` (Aufgabe 2), `freigabeTafel`, `aufklappKarte`, `sicher`.
- Liefert: Knöpfe `data-aktion="freigabe-bearbeiten" data-id="<id>"` (Tafel und jede Zeile), die Aufgabe 4 öffnet.

- [ ] **Schritt 1:** Tafel mit Freigabe als `<button type="button" class="freigabe-knopf tippbar"
  data-aktion="freigabe-bearbeiten" data-id="…">`; Inhalt nur `span` (Eckdaten als `span.eckdaten` mit drei `span`,
  darunter `span.leise` mit Zeile/Befund/Notiz), am Ende `<span class="nur-vorlesen">, ändern</span>`. Ohne Freigabe
  unverändert „Noch keine Freigabe eingetragen.“ als `p`.
- [ ] **Schritt 2:** `#freigaben-frueher`: bei mindestens einer früheren Freigabe
  `aufklappKarte({ id: "freigaben-frueher", klasse: "tag-klapp", kopf: "Frühere Freigaben (n)", inhalt })`, sonst leer.
  Jede Zeile ein Knopf wie `.waegung-knopf` (eigene Klasse oder dieselbe): `<b>` Datum, `<small>` Praxis ·
  `freigabeKurz` · Befund (falls vorhanden), `, ändern` zum Vorlesen.
- [ ] **Schritt 3:** CSS: `.eckdaten > div` und `.eckdaten > div + div` auf `> *` erweitern (Verlauf bleibt gleich);
  `.freigabe-knopf` ohne eigenen Rahmen/Hintergrund, volle Breite, Text links, `min-height: 48px`, Fokus-Rahmen nach
  innen (`outline-offset: -3px`), `span.leise` als Block.
- [ ] **Schritt 4: Browser** (`preview_start` Name `kilossos`, Demo `/?demo`, Service Worker und Caches vorher
  löschen, Tab auf localhost prüfen): Höhe und Lage der Tafel vorher/nachher messen (gleich); mit 0, 1, 3 Freigaben;
  hell, dunkel, 375 px, 150 % Schrift; Verlauf-Eckdaten unverändert.
- [ ] **Schritt 5:** `npm test` grün.

### Aufgabe 4: Fenster im Ändern-Modus, Löschen, Rückfragen

**Dateien:**
- Ändern: `app.js` (`oeffneFreigabe`, `beimSpeichern("form-freigabe", …)`, neuer Submit-Handler für Löschen, Klick-Fall
  `freigabe-bearbeiten`, `close`-Handler von `dialog-freigabe`)
- Ändern: `index.html` (`dialog-freigabe`: Hinweis `#freigabe-hinweis-aendern` hidden; Knopf
  `<button value="loeschen" formnovalidate class="knopf-gefahr" id="freigabe-loeschen" hidden>Freigabe löschen</button>`
  wie bei `form-futter`)

**Schnittstellen:**
- Nutzt: alles aus Aufgabe 2; `harteUntergrenze`, `leseZahl`, `tagSchluessel`, `sichern`, `zeigeToast`.
- Liefert: Merker `bearbeiteteFreigabe` (null = neu eintragen), beim `close` auf null.

- [ ] **Schritt 1:** `oeffneFreigabe(freigabe = null)`: Titel „Freigabe für <Name> ändern“ bzw. wie bisher; Felder
  füllen (Ziel/kcal mit Komma: `String(wert).replace(".", ",")`, Praxis aus der Freigabe, BCS/MCS als `wert` im
  `auswahlFeld`, Notiz); Hinweis und Löschknopf nur im Ändern-Modus sichtbar. Klick-Fall `freigabe-bearbeiten` sucht
  die Freigabe per `id` **im gewählten Tier**.
- [ ] **Schritt 2:** Speichern in der Reihenfolge des Entwurfs:
  1. Bereiche/Pflicht wie bisher.
  2. `andere = freigabenAmTag(eigene, datum, bearbeitete?.id)`: Neu und `andere.length >= 2` → `TEXT_ZWEI_AM_TAG`;
     Ändern und `andere.length >= 1` → bei unverändertem Datum `TEXT_ZWEI_AM_TAG`, sonst `TEXT_ANDERE_AM_TAG`.
  3. 60-%-Rückfrage wie bisher; beim Ändern nur, wenn `ziel !== bearbeitete.zielgewichtKg || kcal !==
     bearbeitete.kcalProTag`.
  4. `geltungsFrage` mit `vorher` = eigene Freigaben, `nachher` = Kopie mit den neuen Werten (neu: an die Stelle der
     vorhandenen am selben Tag, sonst angehängt mit vorläufiger Kennung); Abbrechen → `TEXT_DATUM_PRUEFEN`.
  5. Neu und `andere.length === 1`: `confirm(ersetzenFrage(andere[0]))`; Abbrechen →
     `TEXT_GLEICHER_TAG_NICHT_GESPEICHERT`; OK → `freigabeAendern(andere[0], werte)`.
  Erst danach ändern bzw. `push`, dann `sichern()`. Neu ohne gleichen Tag bleibt `push` wie bisher.
- [ ] **Schritt 3:** Löschen: Submit-Handler wie bei `form-futter` (`submitter.value === "loeschen"`):
  `confirm(loeschFrage(eigene, bearbeitete, tier.name, heute))`; Abbrechen → `preventDefault`, nichts geändert; OK →
  aus `daten.freigaben` entfernen, `sichern()`, bei Erfolg Toast „✓ Freigabe gelöscht“.
- [ ] **Schritt 4: Browser** (Demo und eigene Testdaten mit 2 Tieren; `window.confirm` überschreiben und Aufrufe
  mitschreiben): Tafel ändern und speichern (keine zweite Freigabe, Lineal/Kurve/Befunde/PDF neu); frühere ändern;
  neueste löschen (Text nennt die danach geltende); einzige löschen (Heute ohne Ziel); ältere löschen; neu am selben
  Tag (OK ersetzt, Abbrechen lässt offen und unverändert); Datum auf andere Freigabe (Fehler); geltende nach hinten,
  frühere nach vorn, neu mit älterem Datum (je Rückfrage); nur Notiz ändern bei Freigabe unter 60 % (keine
  60-%-Frage); zwei alte am selben Tag (Fehler beim Ändern und Neu, Löschen geht, Wegverschieben geht); Abbrechen/Esc
  und danach „Freigabe eintragen“ (legt neu an); zweites Tier sieht nichts davon; Tastatur (Tab, Enter, Fokus zurück
  auf Tafel bzw. Zeile); Speicher voll; keine Konsolenfehler.
- [ ] **Schritt 5:** `npm test` grün.

### Aufgabe 5: Version, Review, Commit

**Dateien:** `sw.js`, `index.html` (`#version`), `tests/wissen.test.js`, `.planning/freigabe-aendern.md` (Status)

- [ ] **Schritt 1:** Versionstest auf 0.34.0 umschreiben (Name „Version 0.34.0: Cache v61 mit js/freigaben.js, …“,
  prüft `kilossos-v61`, `"js/freigaben.js",`, `id="version">Version 0.34.0<`) → rot.
- [ ] **Schritt 2:** `CACHE_NAME` `kilossos-v61`, `"js/freigaben.js",` in `DATEIEN` nach `js/besondere-tage.js`,
  `#version` 0.34.0 → `npm test` grün.
- [ ] **Schritt 3:** Review durch frischen Agenten (vor dem Commit) mit konkreten Wegen: Kann nach einer Korrektur still
  der alte Wert gelten? Kann nach Löschen/Ändern still eine andere Freigabe gelten, ohne Rückfrage? Kann ein Abbruch
  etwas halb speichern? Sieht ein Tier Freigaben eines anderen? Funde beheben und nachprüfen.
- [ ] **Schritt 4:** Status im Entwurf auf „gebaut als 0.34.0“, Commit (konventionell, deutsch, mit Co-Authored-By),
  Push, live prüfen (Version 0.34.0, `kilossos-v61`, `js/freigaben.js` 200).
