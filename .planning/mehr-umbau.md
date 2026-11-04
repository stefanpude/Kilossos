# „Mehr“ als ruhige Einstellungsliste – Umsetzungsplan (Version 0.24.0)

> **Für ausführende Agenten:** Pflicht-Skill: superpowers:executing-plans (oder superpowers:subagent-driven-development). Schritte mit Checkbox (`- [ ]`).

**Ziel:** Der Bereich „Mehr“ wird eine ruhige Einstellungsliste im Wiegeprotokoll-Stil. Es ändern sich nur Look und Ordnung, keine Funktion und kein Sicherheitstext fällt weg.

**Aufbau:** Ein neuer CSS-Baustein `.liste` mit `.eintrag` (umgesetzt so statt `.zeile`, weil `.zeile` schon für Protokoll-Listen existiert) (Icon, Titel, Wert oder Zusatz, Pfeil) ersetzt die vielen Karten mit gleich starken Knöpfen. Die Freigabe wird eine Eckdaten-Tafel wie im Verlauf; die Daten dafür liefert die reine, getestete Funktion `freigabeTafel()` in der neuen Datei `js/mehr.js`. Die Geschichte zieht in ein Blatt (`dialog-geschichte`).

**Technik:** HTML, CSS, JavaScript-Module ohne Build; Tests mit `node --test tests/`.

**Vorgabe:** HANDOFF.md, Nächste Schritte 0 (von Stefan am 04.11.2026 bestätigt).

## Feste Regeln
- Kein Sicherheits- oder Hinweistext wird gekürzt oder umformuliert. Er darf nur an eine andere Stelle in „Mehr“ oder in ein Blatt wandern.
- Alle bisherigen Aktionen bleiben erreichbar: Profil öffnen, Tier hinzufügen, Freigabe eintragen, Warum keine Futtermenge, BCS, Grenzen, Praxis anrufen, Zeitraum und Übersicht öffnen, Wiegetag, Darstellung, Sicherung speichern und einlesen, Alle Daten löschen, Geschichte, Datenschutz, Impressum, Nutzungsbedingungen, Version.
- `data-aktion`-Namen, Formularnamen (`wiegetag`, `anzeige`, `bericht-zeitraum`) und die ids `label-wiegetag`, `label-anzeige`, `label-bericht-zeitraum`, `import-datei`, `sicherung-datum`, `speicher-status`, `praxis-anrufen`, `tiere-liste`, `titel-tierarzt`, `version` bleiben gleich (Logik und Vorlesefunktion hängen daran).
- Genau **ein** Hauptknopf (`knopf-haupt`) in „Mehr“: „Freigabe eintragen“.
- Tippflächen jeder Zeile mindestens 48 px hoch (Ziel 56 px). Kontrast Text ≥ 4,5, nur vorhandene Farb-Tokens.
- Icons nur aus `js/symbole.js` bzw. als Inline-SVG in `index.html` (keine Emoji).
- Datenformat bleibt unverändert (kein Eingriff in `js/daten.js`).
- Bei App-Änderungen `CACHE_NAME` in `sw.js` auf `kilossos-v39`, neue Datei `js/mehr.js` in `DATEIEN`, `#version` auf `Version 0.24.0`.

## Review-Schwerpunkte
1. Auswahlmenü (Wiegetag, Darstellung, Zeitraum) in einer Zeile: Das aufgeklappte Menü darf nicht abgeschnitten werden, nicht waagerecht überlaufen und muss bei 375 px und 150 % Schrift lesbar bleiben.
2. Zwei Tiere: Gruppentitel „Tierarzt · Name“, Tafel und Wiegetag zeigen das aktive Tier; Wechsel auf „Heute“ zeichnet „Mehr“ neu.
3. Freigabe ohne BCS/MCS und ohne Notiz: Tafel zeigt „–“ beim BCS, keine leere Zeile, kein „undefined“.
4. Willkommensseite „Ganze Geschichte lesen“ öffnet das neue Blatt (nicht mehr Sprung zu `#geschichte`, die Karte gibt es nicht mehr).
5. Große Handy-Schrift (130/150 %): lange Werte („Kein fester Tag“, „Wie das Handy“, Praxisname) brechen um statt überzulaufen.

---

### Aufgabe 1: `freigabeTafel()` mit Tests

**Dateien:**
- Neu: `js/mehr.js`
- Neu: `tests/mehr.test.js`
- Ändern: `app.js` (lokale `datumText` entfernen, aus `js/mehr.js` importieren)

**Schnittstellen:**
- Erzeugt: `export function datumText(iso: string): string` (unverändert aus `app.js:451` verschoben, z. B. `"2026-11-13"` → `"13. Nov. 2026"`)
- Erzeugt: `export function freigabeTafel(freigabe): null | { felder: {titel, wert}[], zeile: string, befund: string, notiz: string }`
  - `null` ohne Freigabe.
  - `felder` genau drei: `{titel: "Ziel", wert: "7,20 kg"}` (2 Nachkommastellen wie Verlauf/Heute), `{titel: "kcal/Tag", wert: "245"}`, `{titel: "BCS", wert: "8 von 9"}` bzw. `"–"`, wenn `bcsGueltig` nicht passt.
  - `zeile`: `"<tierarzt>, <datumText(datum)>"`.
  - `befund`: MCS-Text aus `MCS` (`js/daten.js`) oder `""`.
  - `notiz`: Notiz oder `""`.

- [ ] **Schritt 1: Tests schreiben** (`tests/mehr.test.js`): mit Kitos Beispiel `{zielgewichtKg: 7.2, kcalProTag: 245, datum: "2026-11-13", tierarzt: "Praxis Beispiel", bcs: 8, mcs: <ein gültiger MCS-Schlüssel aus daten.js>, notiz: "Kontrolle in 4 Wochen"}` → Felder `["7,20 kg", "245", "8 von 9"]`, `zeile === "Praxis Beispiel, 13. Nov. 2026"`, `befund` = MCS-Text, `notiz` gesetzt. Zweiter Test ohne bcs/mcs/notiz → BCS `"–"`, `befund === ""`, `notiz === ""`. Dritter Test: `freigabeTafel(undefined) === null`.
- [ ] **Schritt 2:** `npm test` → neue Tests schlagen fehl (Modul fehlt).
- [ ] **Schritt 3:** `js/mehr.js` schreiben; `befundText`/`bcsGueltig`/`MCS` aus `js/daten.js` wiederverwenden, falls exportiert, sonst exportieren (ohne Formatänderung). `app.js` importiert `datumText` von dort.
- [ ] **Schritt 4:** `npm test` → alle grün (bisher 146 + neue).

### Aufgabe 2: Icons und Listen-Baustein

**Dateien:** `js/symbole.js`, `styles.css`

**Schnittstellen:**
- Erzeugt in `SYMBOL`: `kalender`, `darstellung` (Halbmond/Sonne), `dokument`, `sichern` (Pfeil nach unten in Ablage), `einlesen` (Pfeil nach oben), `buch`, `info`, `frage` (= bisheriges `unbekannt`, nur Alias). Linienstil wie die übrigen (24er viewBox, nur Pfade).
- Erzeugt CSS:
  - `.liste`: Blatt wie `.karte` (Rand, Radius), aber ohne Innenabstand und ohne `gap`; Zeilen durch 1 px `var(--rand)` getrennt.
  - `.zeile`: Raster `Icon | Text | rechts`, `min-height: 56px`, Abstand 12–16 px, Ganzes antippbar (`button`, `a` oder `label`), `:active` mit `var(--flaeche-2)`, Fokusring wie andere Knöpfe. Titel normal (Sans, 1rem), Zusatz `small` in `var(--text-leise)`, rechts Wert in `var(--text-leise)` plus `SYMBOL.weiter`.
  - `.zeile.gefahr`: Titel und Icon in der vorhandenen Rot-Farbe (wie `.knopf-gefahr`).
  - `.zeile .auswahl`: Auswahlknopf rechtsbündig, ohne eigenen Rahmen, darf umbrechen.
  - `.freigabe-tafel`: nutzt die vorhandenen `.eckdaten`-Regeln; keine neue Optik.
- Keine Serif-Kartentitel mehr direkt unter `.gruppe-titel` in „Mehr“.

- [ ] **Schritt 1:** Icons ergänzen, CSS ergänzen.
- [ ] **Schritt 2:** `npm test` grün (nur Absicherung, keine neuen Tests für CSS).

### Aufgabe 3: Neues Markup für „Mehr“ und Blatt „Geschichte“

**Dateien:** `index.html` (Abschnitt `data-ansicht="mehr"`, neues `<dialog id="dialog-geschichte">` neben den anderen Erklär-Blättern)

Reihenfolge der Gruppen (`h3.gruppe-titel`) und Inhalte:

1. **Tiere:** `.liste#tiere-liste` (Zeilen kommen aus `zeichneTiere`), darunter in derselben Liste die Zeile „Tier hinzufügen“ (`data-aktion="tier-neu"`, Icon `plus`). Damit `zeichneTiere` die Hinzufügen-Zeile nicht überschreibt: Tier-Zeilen in einen eigenen Container in der Liste.
2. **Tierarzt** (`#titel-tierarzt`): eine `.karte` mit `#freigabe-tafel` (leer = „Noch keine Freigabe eingetragen.“), dem unveränderten Tipp „Zielgewicht und Tagesmenge legt nur der Tierarzt fest. …“ und dem einzigen `knopf-haupt` „Freigabe eintragen“. Darunter `.liste`: „Praxis anrufen“ (`a#praxis-anrufen.zeile`, Icon `telefon`, nur mit Telefonnummer), „Warum keine Futtermenge?“, „Was ist der BCS?“, „Welche Grenzen gelten?“ (Icon `frage`).
3. **Übersicht für den Tierarzt:** `.liste` mit Zeile „Zeitraum“ (`#label-bericht-zeitraum`, rechts `#bericht-zeitraum-feld`) und Zeile „Übersicht öffnen“ (`data-aktion="bericht-oeffnen"`, Icon `dokument`, Pfeil). Der Satz „Gewicht, Fütterung, Freigaben und Auffälligkeiten auf einen Blick …“ als `small` in der Zeile „Übersicht öffnen“.
4. **Einstellungen:** `.liste` mit Zeile „Wiegetag“ (Icon `kalender`, rechts `#wiegetag-feld`) und Zeile „Darstellung“ (Icon `darstellung`, rechts `#anzeige-feld`, `small` „Gilt nur für dieses Gerät.“). Darunter der unveränderte Wiegetag-Tipp als `p.tipp`.
5. **Daten:** Satz „Alle Einträge liegen nur auf diesem Handy. …“ als `p.leise` über der Liste. `.liste` mit „Sicherung speichern“ (`data-aktion="export"`, Icon `sichern`, `small#sicherung-datum`) und „Sicherung einlesen“ (`label.zeile` mit verstecktem `#import-datei`, Icon `einlesen`). `#speicher-status` darunter. Abgesetzt eine eigene `.liste` mit `.zeile.gefahr` „Alle Daten löschen“ (`data-aktion="alles-loeschen"`, Icon `loeschen`) und darunter der unveränderte Erklärsatz „Löscht alle Einträge, …“ als `p.tipp`.
6. **Über Kilossos:** `.karte` mit den vier Hinweis-Absätzen (Ersetzt keinen Tierarzt / Ist deine Katze krank / Datenschutz / Grenzwerte) **wortgleich**. `.liste`: „Wie Kilossos entstanden ist“ (`data-aktion="geschichte-oeffnen"`, Icon `buch`), „Datenschutz“, „Impressum“, „Nutzungsbedingungen“ (Links, Icon `dokument`), Zeile „Version 0.24.0“ ohne Pfeil (`#version`, Icon `info`, nicht antippbar). Der doppelte Knopf „Welche Grenzen gelten?“ aus der alten Über-Karte entfällt, weil die gleiche Zeile unter „Tierarzt“ steht.
7. **`dialog-geschichte`:** Überschrift „Wie Kilossos entstanden ist“ mit `tabindex="-1" autofocus`, die fünf Absätze der alten Karte `#geschichte` wortgleich, Knopf „Schließen“ (`knopf-haupt`, `value="abbrechen"`). Die alte Karte `#geschichte` entfällt.

- [ ] **Schritt 1:** Markup umbauen (Python-Skript mit `assert s.count(a)==1` je Ersetzung, siehe Lessons in HANDOFF.md).
- [ ] **Schritt 2:** Text-Gegenprobe: Jeder Satz der alten Abschnitte „Mehr“ und `#geschichte` (aus `git show HEAD:index.html`) kommt in der neuen `index.html` noch vor, außer den absichtlich entfallenen Knopf-Doppeln. Per kleinem Skript prüfen und Ausgabe zeigen.

### Aufgabe 4: `app.js` anpassen

**Dateien:** `app.js`

- `zeichneFreigabe()`: füllt `#freigabe-tafel` aus `freigabeTafel(freigabeVonTier())` mit `<div class="eckdaten">` (drei Felder) und einer `p.leise` mit `zeile`, `befund`, `notiz` (nur nicht-leere Teile, mit „ · “ getrennt). Ohne Freigabe der bisherige Satz. Werte mit `sicher()` escapen. Praxis-Zeile: Text `${praxis} anrufen` wie bisher, Markup als `.zeile`.
- `zeichneTiere()`: Zeilen statt Karten (`button.zeile`, Avatar klein 40 px via `profilHtml(t, "klein")`, Name, Zusammenfassung, „Profil ergänzen …“ und „wird gerade angezeigt“ unverändert, Pfeil), `aria-label` unverändert.
- Neuer `case "geschichte-oeffnen"`: `$("dialog-geschichte").showModal()`.
- `case "willkommen-geschichte"`: `willkommenSchliessen(); zeigeAnsicht("mehr"); $("dialog-geschichte").showModal();`
- `zeichneWiegetag()`: Beschriftung „Wiegetag von Name“ bei mehreren Tieren bleibt.

- [ ] **Schritt 1:** Änderungen umsetzen.
- [ ] **Schritt 2:** `npm test` grün.

### Aufgabe 5: Version, Cache, Prüfung im Browser

**Dateien:** `sw.js` (`kilossos-v39`, `js/mehr.js` in `DATEIEN`), `index.html` (`Version 0.24.0`)

- [ ] **Schritt 1:** Version und Cache setzen, `npm test` grün.
- [ ] **Schritt 2:** `preview_start` `kilossos`, Tab auf localhost prüfen, Service Worker und Caches löschen, `/?demo` bei 375 px:
  - Hell und Dunkel; mit Freigabe (Demo) und ohne Freigabe (eigene Testdaten ohne Freigabe); ein Tier und zwei Tiere.
  - Jede Zeile antippen: richtiges Blatt/Menü/Aktion; Auswahlmenüs nicht abgeschnitten; Willkommen → „Ganze Geschichte lesen“ öffnet das Blatt.
  - Per `javascript_tool`: alle `.zeile` `getBoundingClientRect().height >= 48`, `document.documentElement.scrollWidth <= innerWidth`, keine Konsolenfehler, genau ein `.knopf-haupt` in `[data-ansicht="mehr"]`.
  - Schrift 150 % (Wurzel-`font-size`) ohne Überlauf.
- [ ] **Schritt 3:** Screenshots Hell/Dunkel in den Notizordner, Stefan zeigen. **Commit erst nach Stefans Ja:** `feat: „Mehr“ als ruhige Einstellungsliste, Version 0.24.0`. Push nur nach eigenem OK.
