# „Wie gestern“ Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Auf „Heute“ die Mahlzeiten des letzten Tags mit Einträgen als Vorlage zeigen; Antippen öffnet das Fenster „Mahlzeit“ vorbelegt.

**Architecture:** Reine Funktion `wieGestern` in `js/wie-gestern.js` bestimmt Vorlagetag und offene Zeilen (getestet mit `node --test`). `app.js` zeichnet die Zeilen in der Karte „Mahlzeiten“ und reicht Sorte und Gramm an `oeffneMahlzeit` weiter.

**Tech Stack:** Vanilla JS (ES-Module), `node:test`, keine Zusatzpakete.

**Spec:** `docs/superpowers/specs/2026-11-20-wie-gestern-design.md`

## Global Constraints

- Datenformat bleibt Version 1, keine neuen Felder.
- Keine Mengenvorschläge: nur Mahlzeiten wiederholen, die der Halter selbst eingetragen hat.
- Leckerlis (`typ === "leckerli"`) nie in der Vorlage.
- Tag mit besonderem Tag „Futter verweigert“ (`artVon(e.art).notfall === true`) ist keine Vorlage.
- Uhrzeit beim Öffnen wie `uhrzeitVorbelegung` (heute „jetzt“, früherer Tag leer).
- Tippflächen ≥ 48 px, Browser-Check bei 375 px.
- `CACHE_NAME` in `sw.js` hochzählen (v166 → v167), `js/wie-gestern.js` in `DATEIEN`. Version 0.94.0 in `index.html`.

## Review Focus

1. Sorte der Vorlage wurde inzwischen gelöscht → Zeile nicht zeigen (Antippen ergäbe ein Fenster ohne Sorte).
2. Zwei Tiere: Zuki sieht nie Kitos Mahlzeiten als Vorlage.
3. Vortag nur mit Leckerlis → zählt nicht als Vorlage, der Tag davor wird genommen.
4. Gleiche Sorte und Menge mehrmals in der Vorlage (5 × 50 g Sheba): je heutiger Mahlzeit verschwindet genau eine Zeile.
5. Gezeigter Tag in der Vergangenheit (zurückgeblättert): Vorlage ist der Tag davor, nicht der echte Vortag; Mahlzeiten nach dem gezeigten Tag zählen nicht.

---

### Task 1: Funktion `wieGestern`

**Files:**
- Create: `js/wie-gestern.js`
- Test: `tests/wie-gestern.test.js`

**Interfaces:**
- Consumes: `tagSchluessel(datum: Date) → "JJJJ-MM-TT"` aus `js/rechnen.js`; `artVon(schluessel) → { notfall? }` und `betrifftTag`-Logik über `eintraegeAm(liste, tierId, tag)` aus `js/besondere-tage.js`.
- Produces: `wieGestern({ mahlzeiten, futterNachId, besondereTage, tierId, tag }) → { vorlageTag: string | null, offen: Array<{ futterId: string, gramm: number, uhrzeit: "HH:MM" }> }`. `mahlzeiten` = alle Mahlzeiten aller Tiere, `futterNachId` = `Map<id, futter>`, `tag` = gezeigter Tag als `"JJJJ-MM-TT"`. `offen` nach Uhrzeit sortiert.

- [ ] **Step 1: Failing tests schreiben** (`tests/wie-gestern.test.js`, Daten mit `new Date(2026, 10, t, h, m).toISOString()`, Futter `sheba` nass, `purina` trocken, `snack` leckerli)
  - `"keine früheren Mahlzeiten → vorlageTag null, offen leer"`
  - `"Vortag wird Vorlage, Zeilen nach Uhrzeit"`: 19.11. 07:30 sheba 50, 07:30 purina 12, 10:30 sheba 50; tag "2026-11-20" → vorlageTag "2026-11-19", offen = [{sheba,50,"07:30"},{purina,12,"07:30"},{sheba,50,"10:30"}]
  - `"heute eingetragene Mahlzeit nimmt genau eine passende Zeile weg"`: wie oben plus 20.11. 08:00 sheba 50 → offen = [{purina,12,"07:30"},{sheba,50,"10:30"}]
  - `"andere Menge nimmt keine Zeile weg"`: 20.11. sheba 45 → offen unverändert 3 Zeilen
  - `"Leckerlis nicht in der Vorlage"`: 19.11. sheba 50 + snack 2 → offen nur sheba
  - `"Tag nur mit Leckerlis zählt nicht, Tag davor wird Vorlage"`: 18.11. sheba 50, 19.11. snack 2 → vorlageTag "2026-11-18"
  - `"Tag mit Futter verweigert zählt nicht"`: 18.11. sheba 50, 19.11. sheba 20, besondererTag { art: "futter-verweigert", von: "2026-11-19", bis: "2026-11-19", tierId } → vorlageTag "2026-11-18"
  - `"gelöschte Sorte wird übersprungen"`: 19.11. sheba 50 + `geloescht` 30 (nicht in Map) → offen nur sheba
  - `"nur Mahlzeiten des gewählten Tiers"`: 19.11. Zuki sheba 40, Kito purina 12; tierId Kito → offen nur purina
  - `"zurückgeblättert: Vorlage ist der Tag vor dem gezeigten"`: 17.11. purina 10, 18.11. sheba 50, 19.11. purina 12; tag "2026-11-18" → vorlageTag "2026-11-17", offen [{purina,10}]
  - `"alle übernommen → offen leer, vorlageTag bleibt"`

- [ ] **Step 2:** `node --test tests/wie-gestern.test.js` → FAIL (Modul fehlt)

- [ ] **Step 3: `wieGestern` implementieren.** Ablauf: eigene Mahlzeiten mit vorhandener Sorte, die kein Leckerli ist; nach `tagSchluessel(new Date(zeitpunkt))` gruppieren; Vorlage = größter Schlüssel `< tag`, für den kein Eintrag aus `eintraegeAm(besondereTage, tierId, schluessel)` `notfall` hat. Offen = Vorlage-Mahlzeiten nach Zeit sortiert; für jede Mahlzeit des Tags `tag` (gleiches Tier, auch ohne Leckerli-Filter egal, Leckerlis passen ohnehin nie) die erste Zeile mit gleicher `futterId` und `gramm` entfernen. Kurzer Kopfkommentar wie in `js/nachtragen.js` (Version 0.94.0, Grund).

- [ ] **Step 4:** `node --test tests/wie-gestern.test.js` → PASS; danach `npm test` → alles grün

- [ ] **Step 5: Commit** `feat: Funktion wieGestern für Mahlzeiten vom Vortag`

### Task 2: Anzeige auf „Heute“ und vorbelegtes Fenster

**Files:**
- Modify: `index.html` (Karte „Mahlzeiten“ ab Zeile 162: `<div id="heute-wie-gestern"></div>` unter dem Knopf „Mahlzeit eintragen“; Version 0.94.0 Zeile 352)
- Modify: `app.js` (Zeichnen nach dem Protokoll ca. Zeile 590; `oeffneMahlzeit` Zeile 1397; Klickverteilung Zeile 3166)
- Modify: `styles.css` (Zeilen zurückhaltender als `.protokoll`, z. B. gedämpfte Schrift, gestrichelter Rand)
- Modify: `sw.js` (v167, `js/wie-gestern.js`)
- Test: `tests/wie-gestern.test.js` (Quelltext-Prüfungen wie in `tests/uhrzeit-nachtragen.test.js` mit `lies`/`abschnitt`)

**Interfaces:**
- Consumes: `wieGestern` aus Task 1; bestehende `oeffneMahlzeit`, `futterMenue`, `uhrzeitVorbelegung`.
- Produces: `oeffneMahlzeit(mahlzeit = null, vorlage = null)` mit `vorlage = { futterId, gramm }`; Knöpfe `data-aktion="wie-gestern"` mit `data-futter` und `data-gramm`.

- [ ] **Step 1: Failing Quelltext-Tests**
  - `"Heute zeichnet die Karte Wie gestern"`: `app.js` enthält `wieGestern(` und `heute-wie-gestern`; `index.html` enthält `id="heute-wie-gestern"`
  - `"Antippen öffnet das Fenster mit Vorlage"`: Abschnitt `case "wie-gestern"` in `app.js` ruft `oeffneMahlzeit(null, {`
  - `"Vorlage füllt Sorte und Gramm, Uhrzeit bleibt wie beim Nachtragen"`: Abschnitt `function oeffneMahlzeit` enthält `vorlage` und weiterhin `uhrzeitVorbelegung({ mahlzeit, gewaehlterTag`
  - `"Service Worker kennt die neue Datei"`: `sw.js` enthält `"js/wie-gestern.js"`

- [ ] **Step 2:** `node --test tests/wie-gestern.test.js` → die neuen Tests FAIL

- [ ] **Step 3: Umsetzen.**
  - Nach dem Protokoll: `const wg = wieGestern({ mahlzeiten: daten.mahlzeiten, futterNachId: futter, besondereTage: daten.besondereTage, tierId: tier.id, tag })`. Leer → `innerHTML = ""`. Sonst Überschrift `<h3>Wie gestern</h3>`, ein Satz `Antippen übernimmt Sorte und Menge. Bitte trotzdem abwiegen.` und je Zeile ein `<button class="protokoll-knopf tippbar" data-aktion="wie-gestern" data-futter=… data-gramm=…>` mit Uhrzeit, Sortenname + Art, Gramm (gleicher Aufbau wie das Protokoll, ohne Löschknopf), Vorleser-Zusatz `, übernehmen`. Ist `wg.vorlageTag` nicht der Vortag des gezeigten Tags, statt „Wie gestern“ `Wie am ${datumText(wg.vorlageTag)}`.
  - `oeffneMahlzeit`: Bei `vorlage` `futterMenue(vorlage.futterId)` und `form.gramm.value = String(vorlage.gramm).replace(".", ",")`; Titel bleibt `Mahlzeit für …`.
  - Klick: `case "wie-gestern": return oeffneMahlzeit(null, { futterId: knopf.dataset.futter, gramm: Number(knopf.dataset.gramm) });` (Name des Knopf-Elements wie in der vorhandenen Klickverteilung).
  - `sw.js`, Version, CSS wie oben.

- [ ] **Step 4:** `npm test` → alles grün

- [ ] **Step 5: Browser-Check** (`node server.js`, http://localhost:8080, 375 px, Demo `?demo` oder eigene Testdaten): Karte erscheint, Antippen öffnet vorbelegtes Fenster mit Uhrzeit jetzt, Speichern lässt die Zeile verschwinden, zurückgeblätterter Tag zeigt leere Uhrzeit, keine Fehler in der Konsole. Screenshot.

- [ ] **Step 6: Commit und Push** `feat: „Wie gestern“ auf Heute, Version 0.94.0`; danach `HANDOFF.md` und Ideen-Karte `mahlzeiten-wie-gestern` auf „erledigt“.
