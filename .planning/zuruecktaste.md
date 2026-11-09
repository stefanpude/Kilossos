# Zurücktaste (Android) – Umsetzungsplan, Version 0.88.0

> Für ausführende Agenten: Umsetzung mit superpowers:executing-plans (eine Sitzung, Claude baut selbst). Schritte als Checkboxen.

**Ziel:** Die Zurücktaste des Handys schließt nicht mehr sofort die ganze App, sondern geht eine Ebene zurück.

**Aufbau:** Eine reine Funktion in `js/zurueck.js` leitet aus dem sichtbaren Zustand (Ansicht + Zahl offener Fenster) den gewünschten Verlaufsstapel ab und gleicht ihn mit `history` ab (pushState, replaceState, go). `app.js` meldet jede Änderung (Ansicht gewechselt, Fenster auf/zu) und setzt beim Zurück-Ereignis (`popstate`) den Zielzustand um.

**Technik:** History-API, MutationObserver auf das Attribut `open` aller `<dialog>`, Tests mit `node:test` und einem nachgebauten Verlauf.

**Anlass:** Stefan 09.11.2026 abends: Zurücktaste schließt die App sofort. Ursache: Die App legt nie Verlaufseinträge an (`display: standalone`).

## Verhalten (mit Stefan abgestimmt, 09.11.2026)

- Offenes Fenster: Zurück schließt das oberste wie „Abbrechen“, nichts wird gespeichert. Rückfrage zählt als „Nein“.
- Fenster über Fenster (Erklärseite aus „Tipps“, Rückfrage über einem Formular): nur das oberste geht zu.
- „Übersicht für die Tierarztpraxis“ (Ansicht `bericht`): Zurück führt nach „Mehr“.
- Gewicht, Verlauf, Futter, Mehr: Zurück führt direkt zu „Heute“ (Stefan: „Hauptebene der App“).
- „Heute“ ohne Fenster und Einrichtung: Zurück schließt die App (Android-Standard).

## Feste Regeln

- Adresse nie ändern (`pushState(state, "")` ohne URL), `?demo` bleibt.
- Datenformat unverändert.
- Version: `index.html` `#version` → 0.88.0, `sw.js` `CACHE_NAME` → `kilossos-v153`, `"js/zurueck.js"` in `DATEIEN`, Versionstest in `tests/wissen.test.js` (nur per Edit, Backslash-Lesson).
- Push erst mit Stefans Wort (bis 13.11.).

## Eigene Entscheidungen von Claude

- Auswahlmenüs (Tier wechseln, Profilmenü, Auswahlfelder) bekommen keinen eigenen Zurück-Schritt.
- Schließen per Knopf/Wischen/Hintergrund ruft `history.go(-n)`; solange das läuft, wird nichts weiter abgeglichen, danach erneut.
- Kommt nach `go()` binnen 600 ms kein `popstate` (Anfang des Verlaufs), wird der oberste Eintrag per `replaceState` auf den Sollzustand gesetzt und nicht erneut zurückgegangen (keine Schleife).
- Nach dem Neuladen gilt der vorhandene `history.state` als Ist-Zustand; überzählige Einträge werden zurückgegangen.

## Review-Fokus (Fälle, die Nutzer treffen)

1. Fenster schließt und ein anderes öffnet im selben Schritt (Futterliste → Sorte, Scanner → Sorte): kein Verlaufssprung, Zurück schließt das neue Fenster. Test „gleichzeitig zu und auf“.
2. Fenster per Knopf zu, gleich danach neues Fenster auf, bevor `popstate` kam. Test „neues Fenster während go läuft“.
3. Rückfrage über Formular, Zurück: nur die Rückfrage geht zu, Formular bleibt (Browser-Check).
4. Neuladen mit gemerkter Ansicht: kein doppelter Eintrag (Test „Start mit vorhandenem Zustand“).
5. Ansicht über die Leiste nach „Heute“: Eintrag wird zurückgegangen, nächstes Zurück schließt die App (Test „futter → heute“).

---

### Aufgabe 1: Reine Funktionen und Steuerung in `js/zurueck.js`

**Dateien:** neu `js/zurueck.js`, neu `tests/zurueck.test.js`

**Schnittstellen (für Aufgabe 2):**
- `sollStapel({ ansicht, fenster }) → Array<{ ansicht, fenster }>`: heute → `[heute0]`; `bericht` → `[heute0, mehr0, bericht0]`; jede andere Ansicht X → `[heute0, X0]`; danach je offenem Fenster `{ ansicht, fenster: 1..n }`.
- `zustandAus(state) → { ansicht, fenster } | null` (nur wenn `state?.kilossos === 1`).
- `abgleichPlan(ist, soll) → null | { zurueck: n } | { ersetzen: eintrag | null, neu: eintrag[] }`. A = `sollStapel(ist)`, B = `sollStapel(soll)`, p = Länge des gleichen Anfangs. A länger als p um 0 → `neu: B[p..]`; um 1 und B länger als p → `ersetzen: B[p]`, `neu: B[p+1..]`; sonst `zurueck: (A.length − p) − (B.length > p ? 1 : 0)`. Gleich → `null`.
- `zuruecktaste({ verlauf, lesen, anwenden, planen = queueMicrotask, uhr = setTimeout, warteMs = 600 }) → { starten(), abgleichen(), beiPopstate(state) }`. Einträge im Verlauf: `{ kilossos: 1, ansicht, fenster }`. `abgleichen()` vor `starten()` tut nichts, mehrere Aufrufe im selben Takt werden zu einem gebündelt (`planen`).

- [ ] Test schreiben: `sollStapel` für heute0, verlauf0, bericht0, futter2.
- [ ] Test: `abgleichPlan` für heute0→heute1 (`neu`), futter0→heute0 (`zurueck: 1`), futter0→verlauf0 (`ersetzen`), bericht0→verlauf0 (`zurueck: 1`), heute2→heute0 (`zurueck: 2`), heute1→futter0 (`ersetzen`), gleich → `null`.
- [ ] Test mit nachgebautem Verlauf: Start ohne Zustand ersetzt mit heute0; Fenster auf → push; Nutzer-Zurück → `anwenden({ansicht:"heute", fenster:0})`; Knopf-Schließen → `go(-1)`, danach `popstate` ohne `anwenden`; gleichzeitig zu und auf → nichts; neues Fenster während go läuft → nach `popstate` push; kein `popstate` nach 600 ms → `replaceState`, kein zweites `go`; Start mit vorhandenem Zustand `{heute, fenster 2}` und 0 Fenstern → `go(-2)`.
- [ ] `npm test` → neue Tests rot.
- [ ] `js/zurueck.js` schreiben.
- [ ] `npm test` → alle grün.

### Aufgabe 2: Einbau in `app.js`, Version 0.88.0

**Dateien:** `app.js` (Import, `zeigeAnsicht` ~Z. 364, App-Start ~Z. 3263), `sw.js`, `index.html`, `tests/wissen.test.js`, `tests/zurueck.test.js` (Einbau-Test)

- [ ] Einbau-Test (liest `app.js`): importiert `zuruecktaste` aus `./js/zurueck.js`, `addEventListener("popstate"`, `MutationObserver` mit `attributeFilter: ["open"]`; Versionstest 0.88.0 / v153 / `js/zurueck.js`.
- [ ] `npm test` → rot.
- [ ] In `app.js`: Liste `offeneFenster` in Öffnungsreihenfolge (MutationObserver auf `document.body`, `subtree`, `attributeFilter: ["open"]`), jede Änderung ruft `zurueck.abgleichen()`.
- [ ] `lesen()` = sichtbare Ansicht (`.ansicht:not([hidden])`, sonst `heute`) + `offeneFenster.length`.
- [ ] `anwenden(ziel)`: oberste Fenster schließen mit `close("abbrechen")`, bis höchstens `ziel.fenster` offen sind; danach, wenn kein Fenster offen und Ansicht anders: bei `bericht` erst `zeichneBericht()`, dann `zeigeAnsicht(ziel.ansicht)`.
- [ ] `zeigeAnsicht` ruft am Ende `zurueck.abgleichen()`; nach `gemerkteAnsichtZeigen()` bzw. `einrichtungZeigen()` `zurueck.starten()`; `window.addEventListener("popstate", (e) => zurueck.beiPopstate(e.state))`.
- [ ] Version 0.88.0, Cache v153, `js/zurueck.js` in `DATEIEN`.
- [ ] `npm test` → alle grün.

### Aufgabe 3: Prüfen im Browser (375 px, sichtbarer Bereich) und Commit

- [ ] Pane sichtbar (`show_pane`), SW abmelden, Caches leeren, neu laden, `?demo`.
- [ ] Per Skript `history.back()`: Fenster Mahlzeit auf → zu; Tipps → Alltag → zurück zu Tipps → zu; Rückfrage über Formular → nur Rückfrage zu; Futter → Heute; Mehr → Übersicht → Mehr → Heute; Futterliste → Sorte → Zurück (Liste nicht wieder da). Nach jedem Schritt `history.length`/`history.state` und offene Fenster ansehen, keine Konsolenfehler.
- [ ] Knopf „Abbrechen“ dann `history.back()`: führt zur richtigen Stelle, kein doppelter Schritt.
- [ ] Commit `feat: Zurücktaste geht eine Ebene zurück statt die App zu schließen, Version 0.88.0`. Stefan fragen: hochladen?
