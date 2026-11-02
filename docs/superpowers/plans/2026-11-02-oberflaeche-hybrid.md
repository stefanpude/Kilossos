# Neue Oberfläche „Hybrid“ (Version 0.7.0) – Bauanleitung

> **Für ausführende Agenten:** PFLICHT-SKILL: superpowers:subagent-driven-development (empfohlen) oder
> superpowers:executing-plans, Aufgabe für Aufgabe. Die Schritte haben Ankreuzkästchen (`- [ ]`).

**Ziel:** Kilossos bekommt das helle, warme, bewegte Aussehen aus dem Muster, mit aufklappbaren Bereichen,
Auswahlmenüs, Profilbild und Hell/Dunkel-Umschalter, ohne dass sich an Rechenregeln oder Grenzwerten etwas ändert.

**Aufbau:** Alle neuen Rechnungen für die Oberfläche (Zusammenfassungen, Gruppen, Ring- und Kachelwerte) kommen als
reine Funktionen ohne DOM nach `js/zusammenfassung.js` und werden mit `node --test` geprüft. Zwei kleine
Bausteine (`js/aufklappen.js`, `js/auswahl.js`) erzeugen HTML-Text und melden sich einmal für Klicks und Tasten
an. `app.js` und `js/verlauf.js` setzen daraus die Ansichten zusammen; `styles.css` wird neu eingefärbt.

**Technik:** reines HTML/CSS/JavaScript (ES-Module), keine Zusatzpakete, kein Build-Schritt, offline über `sw.js`.
Tests mit `node --test` (`npm test`).

**Bauplan (Spec):** `docs/superpowers/specs/2026-11-02-oberflaeche-hybrid-design.md`, Muster
`docs/superpowers/specs/2026-11-02-oberflaeche-muster.html`. Beide vor dem Bau lesen; das Muster zeigt Maße,
Animationen und die Funktionen `ringZeigen`, `glatt` (Kurvenglättung) und das Zuschneiden des Profilbilds.

## Feste Regeln für alle Aufgaben

- `js/rechnen.js` wird **nicht** geändert. Warnungen, Grenzen und Spielraum kommen unverändert von dort
  (`warnungen()`, `GRENZEN.abnahmeMin` 0,5, `GRENZEN.abnahmeMax` 2, `GRENZEN.spielraum` 0,1, `GRENZEN.leckerliMax` 0,1).
- Warnungen der Art `sofort` und `achtung` sind **immer offen** mit vollem Text und Quelle. Nur `hinweis` wird
  einzeilig und aufklappbar.
- **Ohne Freigabe kein Ziel und kein Fortschritt:** kein Ring-Füllstand, kein „noch offen“, keine Ziellinie,
  keine grüne/gelbe Bewertung von Wochen (Rot über 2 % gilt immer).
- Bestehende Daten unter `kilossos-daten` und alte Sicherungsdateien müssen weiter funktionieren (Datenmodell
  bleibt `version: 1`, nur das optionale Feld `tiere[i].foto` kommt dazu).
- Kein Nachbau von MeowFit: Ideen ja, Grafiken/Texte/Farben nein.
- Animationen nur mit CSS-Übergängen bzw. `requestAnimationFrame`; bei `prefers-reduced-motion: reduce` sofort.
- Der PDF-Bericht bleibt wie er ist (alte Diagramme `gewichtDiagramm` und `kcalDiagramm` in `js/verlauf.js`
  bleiben exportiert und unverändert), nur das Profilbild kommt dazu; der Ausdruck ist **immer hell**.
- Texte in der Oberfläche auf Deutsch mit echten Umlauten, keine Gedankenstriche (—) in neuen Texten.
- Kontraste (geprüft mit WCAG-Formel, siehe Aufgabe 3): Fließtext mindestens 4,5 : 1.
- Commits: `git -c user.email=347438024+stefanpude@users.noreply.github.com commit …`, Text endet mit
  `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. **Kein `git push`** ohne Stefans OK.
- Codex darf während des Baus nicht an `index.html`, `app.js`, `styles.css`, `sw.js`, `js/verlauf.js`,
  `js/daten.js`, `js/bericht.js` und neuen Dateien in `js/` arbeiten (Sperre steht in `CLAUDE.md`).
- Jede Zwischenstufe bleibt lauffähig: nach jeder Aufgabe `npm test` grün und `?demo` öffnet ohne Fehler in der Konsole.

## Prüf-Schwerpunkte (Fehler, die kein bisheriger Test abdeckt)

1. **Knöpfe in Formularen ohne `type="button"`** (− / ＋, Menüknöpfe, Profil-Menü) schicken das
   `<form method="dialog">` ab und schließen das Blatt. Erwartung: nur „Speichern“/„Abbrechen“/„Löschen“ schließen.
   Test: Aufgabe 4 prüft, dass `auswahlFeld()` nur `type="button"`-Knöpfe erzeugt; Aufgabe 8 prüft im Browser − / ＋.
2. **Neu zeichnen klappt alles zu.** Nach dem Speichern einer Mahlzeit muss „Mahlzeiten heute“ offen bleiben,
   ein von Hand zugeklappter aktueller Monat zu bleiben. Test: Aufgabe 4, `aufklappKarte` mit gemerktem Zustand.
3. **Zeitraum mit weniger als zwei Wägungen** („1 Monat“, wenn zuletzt vor 5 Wochen gewogen wurde) darf keine
   leere oder kaputte Kurve (NaN im SVG) zeigen, sondern einen Satz. Test: Aufgabe 7, `verlaufGewichte` liefert
   weniger als 2 Punkte → Hinweistext, kein `<svg`.
4. **Ausdruck im Dunkelmodus.** Steht die App auf „Dunkel“, muss der PDF-Bericht trotzdem hell gedruckt werden.
   Test: Aufgabe 3, Druck-Block setzt die hellen Werte auch für `:root[data-theme="dunkel"]` (im Browser mit
   `data-theme="dunkel"` und Druckvorschau prüfen).
5. **Eine neue Sorte aus „＋ Aus der Futterliste wählen“ im Mahlzeit-Blatt** muss danach im Menü stehen und gewählt
   sein, ohne dass die schon eingetippte Menge verloren geht. Test: Aufgabe 8, Browser-Prüfung mit `?demo`.

---

## Dateien im Überblick

| Datei | Aufgabe |
|---|---|
| `js/zusammenfassung.js` (neu) | reine Rechnungen für Ring, Kacheln, Wochen, Tage, Monate, Zeitraum |
| `js/anzeige.js` (neu) | Hell/Dunkel-Wahl lesen, merken, auflösen |
| `js/aufklappen.js` (neu) | Aufklapp-Karte als HTML + gemerkter Zustand + Klick-Anmeldung |
| `js/auswahl.js` (neu) | Auswahlmenü als HTML + Klick/Tasten-Anmeldung |
| `js/daten.js` | Kommentar `foto`, `fotoGueltig`, `fotoBereinigen` |
| `js/verlauf.js` | neue Verlauf-Ansicht (Kurve, Umschalter, Wochen-, Tageskarte); alte PDF-Diagramme bleiben |
| `js/bericht.js` | Profilbild neben dem Namen |
| `app.js` | Ansichten zusammensetzen, Blätter, Menüs, Profilbild, Darstellung, Bestätigung |
| `index.html` | Kopf-Skript Hell/Dunkel, neue Ansichten-Gerüste, Leiste mit Symbolen, Toast |
| `styles.css` | neue Farben, Karten, Blätter, Animationen, Dunkel über `data-theme`, Druck immer hell |
| `sw.js` | `CACHE_NAME` → `kilossos-v14`, neue Dateien in `DATEIEN` |
| `tests/zusammenfassung.test.js`, `tests/bausteine.test.js`, `tests/verlauf.test.js` (neu), `tests/daten.test.js`, `tests/bericht.test.js` | Tests |

---

### Aufgabe 1: Reine Rechnungen für die Oberfläche (`js/zusammenfassung.js`)

**Dateien:**
- Neu: `js/zusammenfassung.js`
- Test: `tests/zusammenfassung.test.js`

**Schnittstellen:**
- Nutzt aus `js/rechnen.js`: `GRENZEN`, `gewichteSortiert`, `tagesSumme`, `tagSchluessel`, `aktuelleFreigabe`, `leckerliKcal`.
- Liefert (alle Tage als `"JJJJ-MM-TT"`, neueste zuerst, wo es Listen sind):
  - `zeitraumStart(zeitraum: "1m" | "3m" | "alles", heute: string) -> string | null` – „1m“ = heute minus 31 Tage,
    „3m“ = heute minus 92 Tage, „alles“ = `null`.
  - `wochenRaten(gewichte, freigaben) -> Array<{ datum, vonDatum, prozent, bewertung }>` – je zwei aufeinander
    folgende Wägungen eine Zeile, `prozent = (alt.kg - neu.kg) / alt.kg / wochen * 100` mit
    `wochen = Tage / 7` (wie `abnahmeDiagramm`). `bewertung`: `"zu-schnell"` wenn `prozent > GRENZEN.abnahmeMax`
    (immer); sonst, wenn es eine Freigabe gibt und `vonDatum >= Datum der ersten Freigabe`: `"gut"` bei
    `prozent >= GRENZEN.abnahmeMin`, sonst `"langsam"`; sonst `"neutral"`.
  - `abnahmeZusammenfassung(raten) -> { durchschnitt: number | null, imBereich: number, bewertet: number, anzahl: number }`
    – `durchschnitt` = arithmetisches Mittel der `prozent` (null bei 0 Zeilen), `bewertet` = Anzahl Zeilen mit
    `nachFreigabe === true`, `imBereich` = Anzahl Zeilen mit `bewertung === "gut"`.
    Dafür bekommt jede Zeile von `wochenRaten` zusätzlich `nachFreigabe: boolean`
    (= es gibt eine Freigabe und `vonDatum >= Datum der ersten Freigabe`).
  - `futterTage(mahlzeiten, futterNachId, freigaben) -> Array<{ tag, kcal, gramm, unsicher, leckerli, freigabeKcal, ueber, mahlzeiten }>`
    – nur Tage mit mindestens einem Eintrag; `freigabeKcal` = `aktuelleFreigabe(freigaben, tag)?.kcalProTag ?? null`;
    `ueber = freigabeKcal !== null && kcal > (1 + GRENZEN.spielraum) * freigabeKcal`; `mahlzeiten` des Tages nach Uhrzeit.
  - `futterZusammenfassung(tage, heute) -> { durchschnitt: number | null, anzahl: number, ueber: number }` – ohne den Tag `heute`.
  - `kalenderwoche(tag: string) -> number` – ISO-8601-Woche.
  - `wochenGruppen(tage, heute) -> Array<{ titel, tage }>` – „Diese Woche“ (ab Montag dieser Woche), „Letzte Woche“,
    danach `"KW " + kalenderwoche(montag)`; Gruppen ohne Tage entfallen.
  - `monatsGruppen(gewichte) -> Array<{ schluessel: "JJJJ-MM", titel, eintraege, durchschnitt }>` – `titel` wie
    „Oktober 2026“ (`toLocaleDateString("de-DE", { month: "long", year: "numeric" })`), `eintraege` = Gewichte mit
    zusätzlichem `diffKg` (Änderung zur zeitlich vorherigen Wägung, auch über Monatsgrenzen; bei der ersten `null`).
  - `ringWerte(kcal, freigabe) -> { anteil: number | null, offen: number, darueber: number, ueber: boolean }` –
    mit Freigabe `anteil = min(1, kcal / kcalProTag)`, `offen = max(0, kcalProTag - kcal)`,
    `darueber = max(0, kcal - kcalProTag)`, `ueber = kcal > (1 + GRENZEN.spielraum) * kcalProTag`;
    ohne Freigabe `{ anteil: null, offen: 0, darueber: 0, ueber: false }`.
  - `leckerliKachel({ tag, heute, kcal, leckerli, freigabe, warnungAktiv }) -> { kcal, anteil: number | null, amTagesende: boolean, stufe: "normal" | "achtung" }`
    – Basis wie `warnungen()`: mit Freigabe `max(kcal, kcalProTag)`; ohne Freigabe am laufenden Tag
    `anteil: null, amTagesende: true`; ohne Freigabe an vergangenen Tagen `leckerli / kcal` (bei `kcal` 0 → `null`).
    `stufe` ist nur dann `"achtung"`, wenn `warnungAktiv` (= `warnungen()` enthält `id === "leckerli"`).

- [ ] **Schritt 1: Tests schreiben** (`tests/zusammenfassung.test.js`, Stil wie `tests/rechnen.test.js`)

```js
const G = (datum, kg) => ({ id: datum, tierId: "k", datum, kg, notiz: "" });
const gewichte = [G("2026-10-01", 9.32), G("2026-10-08", 9.25), G("2026-10-15", 9.0), G("2026-10-29", 8.95)];
const freigabe = { id: "f", tierId: "k", datum: "2026-10-08", zielgewichtKg: 7.2, kcalProTag: 220, tierarzt: "T", notiz: "" };

test("zeitraumStart rechnet 31 und 92 Tage zurück", () => {
  assert.equal(zeitraumStart("1m", "2026-11-02"), "2026-10-02");
  assert.equal(zeitraumStart("3m", "2026-11-02"), "2026-08-02");
  assert.equal(zeitraumStart("alles", "2026-11-02"), null);
});

test("wochenRaten: Rot immer, Grün/Gelb erst ab der ersten Freigabe", () => {
  const raten = wochenRaten(gewichte, [freigabe]);
  assert.deepEqual(raten.map((r) => [r.datum, r.bewertung, r.nachFreigabe]), [
    ["2026-10-29", "langsam", true],
    ["2026-10-15", "zu-schnell", true],
    ["2026-10-08", "neutral", false],
  ]);
  assert.ok(Math.abs(raten[0].prozent - 0.2778) < 0.001); // 2 Wochen Abstand
  assert.ok(Math.abs(raten[1].prozent - 2.7027) < 0.001);
  assert.deepEqual(wochenRaten(gewichte, []).map((r) => r.bewertung), ["neutral", "zu-schnell", "neutral"]);
});

test("Zunahme ergibt negativen Wert", () => {
  const raten = wochenRaten([G("2026-10-01", 9.0), G("2026-10-08", 9.09)], [freigabe]);
  assert.ok(raten[0].prozent < 0);
});

test("abnahmeZusammenfassung zählt nur Wochen ab der Freigabe als bewertet", () => {
  const z = abnahmeZusammenfassung(wochenRaten(gewichte, [freigabe]));
  assert.equal(z.anzahl, 3);
  assert.equal(z.bewertet, 2);
  assert.equal(z.imBereich, 0);
  assert.ok(Math.abs(z.durchschnitt - 1.2439) < 0.001);
  assert.equal(abnahmeZusammenfassung([]).durchschnitt, null);
});
```

Weitere Tests mit diesen Daten (Uhrzeiten als Ortszeit ohne `Z`):
`futter = new Map([["n", { id: "n", typ: "nass", kcalPro100g: 100, kcalQuelle: "packung" }]])`,
Mahlzeiten `2026-10-20T08:00:00` 200 g, `2026-10-21T08:00:00` 260 g, `2026-10-22T08:00:00` 50 g, Freigabe vom
`2026-10-01` mit 220 kcal.

- `futterTage(...)` liefert die Tage `["2026-10-22", "2026-10-21", "2026-10-20"]`, `ueber` nur am `2026-10-21`
  (260 > 242), `freigabeKcal` 220.
- `futterZusammenfassung(tage, "2026-10-22")` → `{ durchschnitt: 230, anzahl: 2, ueber: 1 }`; ohne Freigabe `ueber: 0`.
- `kalenderwoche("2026-10-05")` → 41, `kalenderwoche("2026-01-01")` → 1, `kalenderwoche("2027-01-01")` → 53.
- `wochenGruppen` mit Tagen `2026-10-22`, `2026-10-19`, `2026-10-14`, `2026-10-05` und `heute = "2026-10-22"` →
  Titel `["Diese Woche", "Letzte Woche", "KW 41"]`, „Diese Woche“ enthält 2 Tage.
- `monatsGruppen([G("2026-09-28", 9.4), G("2026-10-05", 9.32), G("2026-10-12", 9.25)])` → Schlüssel
  `["2026-10", "2026-09"]`, Titel `"Oktober 2026"`, `diffKg` von `2026-10-05` ≈ −0,08, von `2026-09-28` `null`,
  Durchschnitt Oktober ≈ 9,285.
- `ringWerte(155, freigabe)` → `anteil` 155/220, `offen` 65, `ueber` false; `ringWerte(230, freigabe)` → `anteil` 1,
  `darueber` 10, `ueber` false; `ringWerte(250, freigabe).ueber` → true; `ringWerte(155, null).anteil` → null.
- `leckerliKachel`: ohne Freigabe, `tag === heute`, `leckerli` 20 → `anteil` null, `amTagesende` true;
  ohne Freigabe, vergangener Tag, `kcal` 200, `leckerli` 20 → `anteil` 0,1; mit Freigabe 220, `kcal` 150,
  `leckerli` 30 → `anteil` 30/220; `warnungAktiv: false` → `stufe` „normal“, `true` → „achtung“.

- [ ] **Schritt 2: Tests laufen lassen, sie müssen scheitern**

Befehl: `npm test` · Erwartet: Fehler „Cannot find module …/js/zusammenfassung.js“.

- [ ] **Schritt 3: `js/zusammenfassung.js` mit den Funktionen aus „Schnittstellen“ schreiben**

Datumsrechnung wie in `js/verlauf.js` (`ms(iso)` über `new Date(j, m - 1, t)`), Tage immer über `tagSchluessel`.
Kopfkommentar im Stil der anderen Module: wozu das Modul da ist, dass es kein DOM nutzt.

- [ ] **Schritt 4: Tests laufen lassen** · `npm test` · Erwartet: alle grün (59 alte + neue).

- [ ] **Schritt 5: Commit** · `feat: Zusammenfassungen für die neue Oberfläche als reine Funktionen`

---

### Aufgabe 2: Profilbild im Datenmodell und Hell/Dunkel-Wahl (`js/daten.js`, `js/anzeige.js`)

**Dateien:**
- Ändern: `js/daten.js` (Kopfkommentar, zwei neue Funktionen)
- Neu: `js/anzeige.js`
- Test: `tests/daten.test.js`, `tests/bausteine.test.js` (neu, für `anzeige.js`)

**Schnittstellen:**
- `js/daten.js`:
  - `export const FOTO_MAX_ZEICHEN = 300 * 1024;`
  - `fotoGueltig(foto: unknown) -> boolean` – Text, beginnt mit `data:image/jpeg;base64,` oder
    `data:image/png;base64,`, Länge höchstens `FOTO_MAX_ZEICHEN`.
  - `fotoBereinigen(daten) -> number` – löscht `foto` aus jedem Tier, bei dem es vorhanden, aber nicht gültig ist;
    gibt die Anzahl entfernter Fotos zurück. Ändert das Objekt direkt.
  - Kopfkommentar: `tiere: { id, name, art, geschlecht, kastriert, foto? }` plus Zeile
    `foto: optional, "data:image/jpeg;base64,…" (256 × 256 px, in der App zugeschnitten)`.
- `js/anzeige.js`:
  - `export const ANZEIGE_SCHLUESSEL = "kilossos-anzeige";`
  - `export const ANZEIGEN = ["hell", "dunkel", "handy"];`
  - `leseAnzeige(speicher = localStorage) -> "hell" | "dunkel" | "handy"` – unbekannter oder fehlender Wert → „hell“;
    Fehler beim Lesen (z. B. gesperrter Speicher) → „hell“.
  - `merkeAnzeige(wahl, speicher = localStorage) -> void`
  - `aufgeloest(wahl, handyDunkel: boolean) -> "hell" | "dunkel"` – „handy“ folgt `handyDunkel`.

- [ ] **Schritt 1: Tests schreiben**

In `tests/daten.test.js`:
```js
test("fotoGueltig nimmt nur JPEG/PNG bis 300 KB", () => {
  assert.equal(fotoGueltig("data:image/jpeg;base64,AAAA"), true);
  assert.equal(fotoGueltig("data:image/png;base64,AAAA"), true);
  assert.equal(fotoGueltig("data:image/gif;base64,AAAA"), false);
  assert.equal(fotoGueltig("data:image/jpeg;base64," + "A".repeat(FOTO_MAX_ZEICHEN)), false);
  assert.equal(fotoGueltig(42), false);
});

test("fotoBereinigen verwirft ungültige Fotos, der Rest bleibt", () => {
  const daten = laden(testSpeicher());
  daten.tiere[0].foto = "javascript:alert(1)";
  assert.equal(fotoBereinigen(daten), 1);
  assert.equal("foto" in daten.tiere[0], false);
  assert.ok(istGueltig(daten));
  daten.tiere[0].foto = "data:image/jpeg;base64,AAAA";
  assert.equal(fotoBereinigen(daten), 0);
  assert.equal(daten.tiere[0].foto, "data:image/jpeg;base64,AAAA");
});

test("alte Sicherung ohne foto bleibt gültig", () => {
  const daten = laden(testSpeicher());
  delete daten.tiere[0].foto;
  assert.ok(istGueltig(daten));
  assert.equal(fotoBereinigen(daten), 0);
});
```
In `tests/bausteine.test.js`: `leseAnzeige` mit leerem Testspeicher → „hell“; nach `merkeAnzeige("dunkel")` → „dunkel“;
gespeicherter Unsinn „blau“ → „hell“; Speicher, dessen `getItem` wirft → „hell“;
`aufgeloest("handy", true)` → „dunkel“, `aufgeloest("handy", false)` → „hell“, `aufgeloest("hell", true)` → „hell“.

- [ ] **Schritt 2:** `npm test` · Erwartet: die neuen Tests scheitern (Funktionen fehlen).
- [ ] **Schritt 3:** Funktionen wie in „Schnittstellen“ schreiben.
- [ ] **Schritt 4:** `npm test` · Erwartet: alles grün.
- [ ] **Schritt 5: Commit** · `feat: Profilbild im Datenmodell und Speicher für Hell/Dunkel`

---

### Aufgabe 3: Neuer Grundstil, Hell/Dunkel über `data-theme`, Leiste mit Symbolen

**Dateien:**
- Ändern: `styles.css` (Farben, Karten, Leiste, Seitenwechsel, Knöpfe, Druck, Bewegung reduzieren)
- Ändern: `index.html` (Kopf-Skript, `theme-color`, Leiste, Toast-Element)
- Ändern: `app.js` (`zeigeAnsicht` mit Einblenden, `zeigeToast`)

**Schnittstellen:**
- Nutzt `ANZEIGE_SCHLUESSEL`, `leseAnzeige`, `aufgeloest` aus Aufgabe 2.
- Liefert in `app.js`: `zeigeToast(text: string, dauerMs = 1800) -> void` (Element `#toast`, `role="status"`,
  `aria-live="polite"`), `wendeAnzeigeAn(wahl) -> void` (setzt `document.documentElement.dataset.theme` und
  `<meta name="theme-color">`; bei „handy“ hört es auf `matchMedia("(prefers-color-scheme: dark)")` `change`).
- CSS-Klassen, die spätere Aufgaben nutzen: `.karte`, `.label`, `.marke`, `.marke-gut`, `.marke-warnung`,
  `.marke-gefahr`, `.kacheln`, `.kachel`, `.knopf-haupt`, `.knopf-zweit`, `.knopf-rund`, `.leise`.

Farbwerte (`:root` hell / `:root[data-theme="dunkel"]`). Alte Namen bleiben, neue kommen dazu. Die hellen Text-
und Knopffarben sind gegenüber dem Muster etwas dunkler, weil die Muster-Werte unter 4,5 : 1 lagen (mit der
WCAG-Formel nachgerechnet):

| Variable | hell | dunkel | Zweck |
|---|---|---|---|
| `--hintergrund` | `#fbf6f1` | `#1c1714` | Seite |
| `--flaeche` | `#ffffff` | `#27201c` | Karten |
| `--flaeche-2` | `#f6eee6` | `#2f2722` | Ring-Bahn, Felder |
| `--text` | `#2b2420` | `#f3ebe4` | Text |
| `--text-leise` | `#6f625a` | `#b3a398` | Nebentext (5,1–5,9 : 1 bzw. 6,0–7,3 : 1) |
| `--akzent` | `#c8642d` | `#e07f45` | Flächen, Ring, Symbole |
| `--akzent-stark` | `#b5561f` | `#e07f45` | Text in Akzentfarbe, Knöpfe mit weißer Schrift (4,9 : 1) |
| `--akzent-text` | `#ffffff` | `#1c1714` | Schrift auf Akzentknöpfen |
| `--akzent-hell` | `#f6dccb` | `#4a2f20` | Profilbild-Grund, aktive Felder |
| `--gut` | `#3d7a5a` | `#7fbf9a` | gut/sicher |
| `--gut-hell` | `#dcebe2` | `#233a2e` | Marken-Grund |
| `--warnung` | `#9a6700` | `#e2b04e` | Hinweise (Gelb-Ocker) |
| `--warnung-hell` | `#f7ebcf` | `#3d3020` | Hinweis-Karten |
| `--gefahr` | `#b3261e` | `#f2b8b5` | über 2 %, Achtung |
| `--gefahr-hell` | `#f9dedc` | `#4a2523` | Achtung-Karten |
| `--rand` | `#eadfd5` | `#3a302a` | Linien |
| `--reihe-1`, `--reihe-2` | unverändert | unverändert | PDF-Diagramme |
| `--schatten` | `0 6px 20px rgb(80 45 20 / .08)` | `0 6px 20px rgb(0 0 0 / .35)` | Karten |
| `--rund` | `22px` | `22px` | Karten-Ecken |

Regel: Text auf den „-hell“-Flächen immer in `--text` (die Farbe selbst nur für Punkt/Symbol/Balken), weil
z. B. `--warnung` auf `--warnung-hell` nur 4,1 : 1 erreicht.

- [ ] **Schritt 1: Kopf-Skript in `index.html`** direkt nach `<meta charset>`, klassisches `<script>` (kein Modul),
  damit vor dem ersten Zeichnen das richtige Thema steht:

```html
<script>
  try {
    var w = localStorage.getItem("kilossos-anzeige");
    var d = w === "dunkel" || (w === "handy" && matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.dataset.theme = d ? "dunkel" : "hell";
  } catch (e) { document.documentElement.dataset.theme = "hell"; }
</script>
```

- [ ] **Schritt 2: `styles.css` umbauen:** `@media (prefers-color-scheme: dark)` entfernen, Werte nach Tabelle auf
  `:root` und `:root[data-theme="dunkel"]`; `color-scheme: light` bzw. `dark` passend setzen. Karten, Kacheln,
  Marken und Knöpfe im Stil des Musters (`.karte` mit `--rund` und `--schatten`). Seitenwechsel: `.ansicht`
  bekommt beim Zeigen die Klasse `rein` mit Keyframe `hereinfahren` (0,35 s, 12 px von unten). Knöpfe:
  `:active { transform: scale(.96) }` mit 0,12 s. Am Ende:
  `@media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration: .001s !important; transition-duration: .001s !important; } }`.
  Im `@media print`-Block die hellen Werte für `:root, :root[data-theme="dunkel"]` setzen.
- [ ] **Schritt 3: Leiste in `index.html`:** jeder der fünf Knöpfe bekommt `<span class="symbol" aria-hidden="true">`
  mit einem Emoji (Heute 🏠, Gewicht ⚖️, Verlauf 📈, Futter 🥣, Mehr ☰) über dem Wort; aktiver Knopf
  `--akzent-stark` und `translateY(-2px)`. `<meta name="theme-color">` bekommt `id="theme-farbe"`.
  Element `<div class="toast" id="toast" role="status" aria-live="polite"></div>` vor `</body>`.
- [ ] **Schritt 4: `app.js`:** `zeigeAnsicht` setzt zusätzlich die Klasse `rein` neu (entfernen, Reflow, setzen) und
  scrollt nach oben; `zeigeToast` und `wendeAnzeigeAn` wie in „Schnittstellen“; beim Start
  `wendeAnzeigeAn(leseAnzeige())`. `theme-color`: hell `#fbf6f1`, dunkel `#1c1714`.
- [ ] **Schritt 5: Prüfen:** `npm test` grün. Browser-Pane `preview_start` mit `kilossos-8081`, Adresse
  `http://localhost:8081/?demo`; Konsole ohne Fehler; mit
  `localStorage.setItem("kilossos-anzeige","dunkel"); location.reload()` dunkles Aussehen ohne hellen Blitz,
  danach wieder entfernen. Alle fünf Bereiche anklicken.
- [ ] **Schritt 6: Commit** · `feat: heller Grundstil, Hell/Dunkel über data-theme, Leiste mit Symbolen`

---

### Aufgabe 4: Bausteine Aufklapp-Karte und Auswahlmenü (`js/aufklappen.js`, `js/auswahl.js`)

**Dateien:**
- Neu: `js/aufklappen.js`, `js/auswahl.js`
- Ändern: `styles.css` (Stil der beiden Bausteine), `app.js` (einmal anmelden)
- Test: `tests/bausteine.test.js`

**Schnittstellen:**
- `js/aufklappen.js`:
  - `aufklappKarte({ id: string, kopf: string, inhalt: string, offen = false, klasse = "" }) -> string` – HTML:
    äußeres `<div class="aufklapp {klasse}" data-aufklapp="{id}">`, darin
    `<button type="button" class="aufklapp-kopf" aria-expanded="true|false" aria-controls="ak-{id}">{kopf}<span class="pfeil" aria-hidden="true">⌄</span></button>`
    und `<div class="aufklapp-inhalt" id="ak-{id}"><div>{inhalt}</div></div>`. Offen-Zustand: gemerkter Wert
    für `id`, falls vorhanden, sonst `offen`. `kopf` und `inhalt` sind fertiges HTML (der Aufrufer schützt Text mit `sicher`).
  - `merkeZustand(id: string, offen: boolean) -> void`, `zustandVergessen() -> void` (für Tests).
  - `aufklappenAnmelden(wurzel: Document | Element) -> void` – ein Klick-Listener; Klick auf `.aufklapp-kopf`
    schaltet `aria-expanded` und die Klasse `offen` am äußeren `div` um und merkt den Zustand. Verschachtelte
    Karten: nur der nächste `.aufklapp` wird umgeschaltet.
  - CSS: Inhalt klappt über `grid-template-rows: 0fr → 1fr` (0,35 s) wie `.hinweis-text` im Muster; Pfeil dreht 180°.
    Balken in aufklappbaren Karten: `.balken > i { width: 0; transition: width .75s }`,
    `.offen > .aufklapp-inhalt .balken > i { width: var(--w) }` – so wachsen sie beim Aufklappen ohne JavaScript.
- `js/auswahl.js`:
  - `auswahlFeld({ name, optionen: Array<{ wert, text, zusatz? }>, wert?: string, platzhalter = "Bitte wählen", extra?: Array<{ text, aktion }> }) -> string`
    – immer ein `<input type="hidden" name="{name}" value="{wert ?? ""}">`. Bei genau einer Option und ohne
    `extra`: nur feste Anzeige (`<div class="auswahl-fest">`) plus verstecktes Feld mit diesem Wert. Sonst
    `<div class="auswahl" data-auswahl="{name}">` mit `<button type="button" class="auswahl-knopf" aria-haspopup="listbox" aria-expanded="false">`
    (gewählter Text + `<small>` Zusatz, oder Platzhalter) und `<ul class="auswahl-menue" role="listbox">` mit
    `<li role="option" aria-selected="true|false" data-wert tabindex="-1">` je Option; `extra`-Einträge als
    `<li role="option" data-aktion="{aktion}">` am Ende (lösen nur die Aktion aus, ändern den Wert nicht).
  - `auswahlAnmelden(wurzel: Document | Element) -> void` – Klick auf Knopf öffnet/schließt (Klasse `offen`,
    `aria-expanded`), Klick auf Option setzt das versteckte Feld, Haken (`aria-selected`), Knopftext und löst am
    versteckten Feld `input` und `change` aus (`bubbles: true`); Klick außerhalb schließt. Tasten: ↓/↑ wandern,
    Enter/Leertaste wählt, Escape schließt und setzt den Fokus auf den Knopf. Bei `data-aktion` an einer Option
    schließt das Menü und der Klick läuft an den vorhandenen `document`-Klick-Listener in `app.js` weiter.
  - CSS: Menü federt auf (0,2 s, `transform: scale(.96) → 1`, `opacity`), Pfeil dreht sich, Haken vor dem gewählten Eintrag.

- [ ] **Schritt 1: Tests schreiben** (`tests/bausteine.test.js`, Text-Prüfungen ohne DOM)

```js
test("aufklappKarte: Standard zu, offen auf Wunsch, gemerkter Zustand gewinnt", () => {
  zustandVergessen();
  assert.match(aufklappKarte({ id: "a", kopf: "K", inhalt: "I" }), /aria-expanded="false"/);
  assert.match(aufklappKarte({ id: "b", kopf: "K", inhalt: "I", offen: true }), /aria-expanded="true"/);
  merkeZustand("b", false);
  assert.match(aufklappKarte({ id: "b", kopf: "K", inhalt: "I", offen: true }), /aria-expanded="false"/);
  merkeZustand("a", true);
  assert.match(aufklappKarte({ id: "a", kopf: "K", inhalt: "I" }), /class="aufklapp offen/);
});

test("auswahlFeld: eine Option ohne Menü, mehrere mit Menü, nur type=button", () => {
  const eins = auswahlFeld({ name: "futter", optionen: [{ wert: "x", text: "Sheba" }], wert: "x" });
  assert.doesNotMatch(eins, /aria-haspopup/);
  assert.match(eins, /<input type="hidden" name="futter" value="x">/);
  const zwei = auswahlFeld({ name: "typ", optionen: [{ wert: "nass", text: "Nass" }, { wert: "trocken", text: "Trocken" }], wert: "trocken" });
  assert.match(zwei, /aria-haspopup="listbox"/);
  assert.match(zwei, /data-wert="trocken"[^>]*aria-selected="true"|aria-selected="true"[^>]*data-wert="trocken"/);
  assert.doesNotMatch(zwei, /<button(?![^>]*type="button")/);
  const mitExtra = auswahlFeld({ name: "futter", optionen: [{ wert: "x", text: "Sheba" }], extra: [{ text: "＋ Aus der Futterliste wählen", aktion: "liste-oeffnen" }] });
  assert.match(mitExtra, /data-aktion="liste-oeffnen"/);
});

test("auswahlFeld schützt Text vor HTML", () => {
  const feld = auswahlFeld({ name: "f", optionen: [{ wert: "1", text: "<b>x</b>" }, { wert: "2", text: "y" }] });
  assert.doesNotMatch(feld, /<b>x<\/b>/);
});
```

- [ ] **Schritt 2:** `npm test` · Erwartet: Fehler, Module fehlen.
- [ ] **Schritt 3:** Beide Module wie in „Schnittstellen“ schreiben; in `app.js` einmal
  `aufklappenAnmelden(document); auswahlAnmelden(document);` aufrufen.
- [ ] **Schritt 4:** `npm test` · Erwartet: alles grün.
- [ ] **Schritt 5: Commit** · `feat: Bausteine für aufklappbare Karten und Auswahlmenüs`

---

### Aufgabe 5: „Heute“ neu (Kopf, Warnungen, Ring, Kacheln, Mahlzeiten)

**Dateien:**
- Ändern: `index.html` (Gerüst der Ansicht „Heute“), `app.js` (`zeichneHeute`), `styles.css`

**Schnittstellen:**
- Nutzt `ringWerte`, `leckerliKachel` (Aufgabe 1), `aufklappKarte` (Aufgabe 4), `abnahmeProWoche`,
  `gewichteSortiert`, `GRENZEN` aus `js/rechnen.js`.
- Liefert in `app.js`: `HINWEIS_TITEL` (Kurztitel je `hinweis`-`id`), `profilHtml(tier, groesse: "gross" | "klein") -> string`
  (Bild oder 🐱 auf `--akzent-hell` mit Kamera-Zeichen; wird in Aufgabe 7 und 9 wiederverwendet),
  `zeichneRing(werte, kcalText, unterText) -> void`.

`HINWEIS_TITEL` (fester Text):
```js
const HINWEIS_TITEL = {
  "ueber-freigabe": "Mehr als freigegeben",
  diaetfutter: "Diätfutter mit dem Tierarzt besprechen",
  stillstand: "Abnahme stockt",
  "ziel-erreicht": "Zielgewicht erreicht",
  "freigabe-alt": "Freigabe ist älter als 3 Monate",
};
```
Unbekannte `id` → Titel „Hinweis“.

- [ ] **Schritt 1: Gerüst in `index.html`:** Kopf mit `<button type="button" class="profil" id="profil" aria-label="Profilbild von Kito ändern">`,
  Name (`#tiername` wandert hierher, der alte `<header class="kopf">` wird zur schmalen App-Zeile), Gewicht
  (`#kopf-gewicht`), Datum; Tagwahl bleibt (`tag-zurueck`, `#tag-titel`, `tag-vor`); Sicherungs-Erinnerung
  unverändert (ids bleiben); `#warnungen-liste`; Kalorien-Karte mit Ring-SVG (Radius 54, wie Muster),
  `#ring-zahl`, `#ring-unter`, `#ring-rechts`, `#summe-hinweis` und Knopf `＋ Mahlzeit eintragen`
  (`data-aktion="mahlzeit-neu"`); `<div class="kacheln" id="heute-kacheln">`; `<div id="heute-mahlzeiten">`.
  Alte ids `summe-kcal`, `summe-gramm`, `summe-freigabe`, `mahlzeiten-liste`, `mahlzeiten-leer` entfallen.
- [ ] **Schritt 2: Warnungen:** `sofort`/`achtung` wie bisher als offenes `<li>` mit Text und Quelle (neuer Stil
  auf `--gefahr-hell`); `hinweis` als `aufklappKarte({ id: "hinweis-" + w.id, kopf: HINWEIS_TITEL[w.id], inhalt: Text + Quelle, klasse: "hinweis" })`.
- [ ] **Schritt 3: Ring:** mit `ringWerte(summe.kcal, freigabe)`. Mit Freigabe: Füllstand `anteil`, Mitte kcal
  (mit „ca. “ bei `summe.unsicher`), darunter „von X kcal“; rechts Gefüttert / Freigabe / „Noch offen: N kcal“,
  bei `darueber > 0` stattdessen „darüber: N kcal“; Ringfarbe `--gut`, bei `ueber` `--warnung`.
  Ohne Freigabe: nur Bahn, kein Füllstrich; Mitte kcal, darunter „g Futter“ mit `summe.gramm`; rechts Gefüttert
  (kcal) und Menge (g) und der Satz „Ziel kommt mit der Freigabe vom Tierarzt“. Animation wie `ringZeigen` im
  Muster (Füllstand von 0, Zahl zählt in 1,0 s hoch; bei reduzierter Bewegung sofort, Abfrage
  `matchMedia("(prefers-reduced-motion: reduce)")`). Beim Wechsel auf „Heute“ und beim Tageswechsel startet der
  Ring bei 0; nach dem Speichern einer Mahlzeit läuft er vom alten auf den neuen Wert (nicht wieder von 0).
- [ ] **Schritt 4: Kacheln:** Gewicht: letzter Wert aus `gewichteBis(...)` des gewählten Tages, `abnahmeProWoche(gewichte, GRENZEN.tageZuSchnell)`
  als „−X % pro Woche“ (bei Zunahme „+X %“), Mini-Kurve der letzten bis zu 6 Wägungen als kleines SVG mit
  `glatt`-Pfad; mit weniger als 2 Wägungen nur der Wert. Leckerli: `leckerliKachel({ tag, heute, kcal, leckerli, freigabe, warnungAktiv: liste.some((w) => w.id === "leckerli") })`;
  Balken bis 10 % = voll; `amTagesende` → Satz „wird am Tagesende bewertet“; Farbe `--gefahr` nur bei `stufe === "achtung"`.
- [ ] **Schritt 5: Mahlzeiten:** bei 0 Einträgen `<p class="leer">Noch keine Mahlzeit an diesem Tag.</p>`; sonst
  `aufklappKarte({ id: "mahlzeiten-heute", kopf: "Mahlzeiten · N Einträge · X kcal · zuletzt HH:MM", inhalt })`
  mit Zeilen: Symbol nach Art (🥫 Nass, 🥣 Trocken, 🍬 Leckerli), Name, Uhrzeit, g, kcal, Lösch-Knopf
  (`data-aktion="mahlzeit-loeschen"`, wie heute). Die id bleibt über Tage gleich, damit „offen“ beim Tageswechsel bleibt.
- [ ] **Schritt 6: Prüfen:** `npm test` grün. Im Browser `?demo`: „Heute“ zeigt Ring ohne Füllstand, wenn die
  Demo-Daten an dem Tag keine Freigabe haben, sonst mit; mit ‹ auf „Gestern“ den Diätfutter-Hinweis zugeklappt
  sehen und aufklappen; Mahlzeiten aufklappen, eine Mahlzeit eintragen (altes Formular reicht hier noch) →
  Karte bleibt offen. Handybreite 375 px.
- [ ] **Schritt 7: Commit** · `feat: Heute mit Ring, Kacheln und aufklappbaren Hinweisen und Mahlzeiten`

---

### Aufgabe 6: „Gewicht“ und „Futter“ gruppiert und aufklappbar

**Dateien:**
- Ändern: `app.js` (`zeichneGewicht`, `zeichneFutter`, `zeichneListe`), `index.html` (Container), `styles.css`

**Schnittstellen:**
- Nutzt `monatsGruppen` (Aufgabe 1), `aufklappKarte` (Aufgabe 4).

- [ ] **Schritt 1: Gewicht:** obere Karte (`#gewicht-aktuell`, `#gewicht-aenderung`, `#gewicht-trend`) bleibt
  inhaltlich, neuer Stil. `#gewicht-liste` wird zu `<div id="gewicht-monate">`: je Gruppe
  `aufklappKarte({ id: "monat-" + schluessel, kopf: "Oktober 2026 · 4 Wägungen · Ø 9,10 kg", offen: index === 0 })`;
  Zeile: Tag (`datumText`), kg mit 2 Stellen, Marke mit `diffKg` in g („−80 g“ `.marke-gut`, „+40 g“ `.marke-warnung`,
  „±0 g“ neutral, keine Marke bei `null`), Notiz, Lösch-Knopf wie bisher. Bei 1 Wägung „1 Wägung“.
- [ ] **Schritt 2: Futter:** `#futter-liste` wird zu Gruppen Nassfutter / Trockenfutter / Leckerli
  (`aufklappKarte({ id: "futter-" + typ, kopf: "Nassfutter · 2 Sorten", offen: daten.futter.length <= 5 })`),
  leere Gruppen entfallen; Zeile wie bisher (`data-aktion="futter-bearbeiten"`), plus Symbol nach Art. „1 Sorte“ in der Einzahl.
- [ ] **Schritt 3: Futterliste-Blatt:** `zeichneListe` baut die Gruppen „Diätfutter vom Tierarzt – nur nach
  Rücksprache“ (bestehender Text) und „Weitere Sorten“ als `aufklappKarte` (ids `liste-diaet`, `liste-weitere`);
  ist das Suchfeld nicht leer, werden beide mit Treffern offen gezeichnet (vorher `merkeZustand(id, true)`).
- [ ] **Schritt 4: Prüfen:** `npm test` grün; Browser `?demo`: aktueller Monat offen, ältere zu; einen Monat
  zuklappen, ein Gewicht eintragen → bleibt zu; Futterliste öffnen, „hill“ suchen → Gruppen öffnen sich.
- [ ] **Schritt 5: Commit** · `feat: Gewicht nach Monaten und Futter nach Art aufklappbar`

---

### Aufgabe 7: „Verlauf“ neu (Zeitraum, weiche Kurve, Abnahme pro Woche, Futter pro Tag)

**Dateien:**
- Ändern: `js/verlauf.js` (neue Ansicht; `gewichtDiagramm`, `kcalDiagramm` bleiben für den PDF-Bericht),
  `app.js` (Zeitraum-Zustand, Infoblase statt Tooltip), `index.html` (`#tooltip` → `#infoblase`), `styles.css`
- Test: `tests/verlauf.test.js` (neu)

**Schnittstellen:**
- Nutzt alles aus Aufgabe 1, `aufklappKarte` aus Aufgabe 4, `profilHtml` aus Aufgabe 5 (als fertiger Text übergeben).
- Liefert in `js/verlauf.js`:
  - `verlaufGewichte(gewichte, von: string | null) -> Gewicht[]` (aufsteigend, nur `datum >= von`).
  - `weicheKurve(gewichte, freigaben) -> string` – SVG mit Klasse `kurve`, nur bei mindestens 2 Punkten; sonst `""`.
    Glättung mit `glatt` aus dem Muster, Fläche darunter mit `<linearGradient id="kurve-verlauf">` (Akzent
    oben 25 %, unten 0 %), Sicherheitskorridor nach der Logik von `gewichtDiagramm` (ab erster Freigabe),
    gestrichelte Ziellinie nur, wenn es eine Freigabe gibt **und** das Ziel zwischen yMin und yMax liegt (die
    y-Achse wird hier nicht auf das Ziel erweitert). Punkte für die Infoblase als
    `data-punkte='[[x, y, "12. Okt.: 9,25 kg"], …]'` am `<svg>` (Text mit `sicher` geschützt).
  - `zeichneVerlauf({ gewichte, mahlzeiten, freigaben, futterNachId, zeitraum, heute, kopf }) -> string` –
    `kopf` = fertiges HTML (kleines Profilbild + „Verlauf“).

- [ ] **Schritt 1: Tests:** `verlaufGewichte` mit `von = "2026-10-10"` liefert nur Wägungen ab dem 10.10.,
  aufsteigend. `weicheKurve` mit 1 Wägung → `""`; mit 3 Wägungen enthält `<path` und `data-punkte` und kein
  `NaN`; ohne Freigabe keine Klasse `ziel`; mit Freigabe und Ziel 7,2 kg bei Gewichten um 9 kg ebenfalls keine
  `ziel`-Linie (außerhalb des Bereichs). `zeichneVerlauf` mit `zeitraum: "1m"` und letzter Wägung vor 40 Tagen
  enthält „Im gewählten Zeitraum gibt es weniger als zwei Wägungen.“ und kein `<svg class="kurve`.
- [ ] **Schritt 2:** `npm test` · Erwartet: die neuen Tests scheitern.
- [ ] **Schritt 3: `zeichneVerlauf` umbauen**, von oben nach unten:
  1. `kopf`; weniger als 2 Wägungen insgesamt → bisheriger Leer-Text, sonst weiter.
  2. Umschalter `<div class="umschalter" role="tablist">` mit drei `<button type="button" role="tab" data-aktion="zeitraum" data-wert="1m|3m|alles" aria-selected>` (Texte „1 Monat“, „3 Monate“, „Alles“) und gleitender Markierung (`--pos` 0/1/2, CSS `transform: translateX(calc(var(--pos) * 100%))`).
  3. Gewichtskarte: oben aktueller Wert und Marke mit der Änderung im Zeitraum (erste → letzte Wägung des
     Zeitraums, in kg mit 2 Stellen); darunter `weicheKurve` oder der Satz aus Schritt 1. Animation: Pfad über
     `stroke-dasharray`/`stroke-dashoffset` in 1,1 s, Fläche blendet ein.
  4. Kennzahl-Kacheln (bestehende Funktion `kennzahlen`, neuer Stil) über den ganzen Verlauf wie bisher.
  5. „Abnahme pro Woche“: `wochenRaten` gefiltert auf `datum >= von`; `aufklappKarte({ id: "abnahme", kopf })`
     mit Kopf „Ø X % pro Woche · N von M Wochen im sicheren Bereich“ (ohne Freigabe bzw. `bewertet === 0` nur
     „Ø X % pro Woche“); Zeilen neueste zuerst: Datum der späteren Wägung, Balken `--w: min(100, max(0, prozent / 2 * 100))%`,
     Marke „−0,75 %“ bzw. bei Zunahme „+0,10 %“; Klasse nach `bewertung`: `gut` → `--gut`, `langsam` → `--warnung`,
     `zu-schnell` → `--gefahr`, `neutral` → `--text-leise`.
  6. „Futter pro Tag“ (nur wenn es Mahlzeiten gibt): `futterTage` gefiltert auf `tag >= von`,
     `futterZusammenfassung(tage, heute)`; Kopf „Ø X kcal · N Tage · K× über der Freigabe“ (ohne irgendeine
     Freigabe im Zeitraum ohne den letzten Teil); innen `wochenGruppen(tage, heute)` als Zwischenüberschriften,
     jeder Tag eine eigene `aufklappKarte({ id: "tag-" + tag, kopf: Tagname + Balken + kcal })`; Balken voll =
     `freigabeKcal` des Tages, ohne Freigabe = höchster kcal-Wert im Zeitraum; `ueber` → Klasse mit `--warnung`;
     der heutige Tag heißt „Heute“. Im Inneren die Mahlzeiten (Uhrzeit, Name, g, kcal).
  7. Hinweis-Text unten: „Tippe auf die Kurve, um Datum und Gewicht zu sehen. Alle Gewichte als Liste stehen unter „Gewicht“.“
  Die alten Abschnitte „Abnahme pro Woche“ (`abnahmeDiagramm`) und „Kalorien pro Tag“ fallen aus der Ansicht;
  `abnahmeDiagramm` wird gelöscht, `kcalDiagramm` bleibt für `js/bericht.js`.
- [ ] **Schritt 4: `app.js`:** `let zeitraum = "3m";` Klick `data-aktion="zeitraum"` setzt den Wert und zeichnet nur
  „Verlauf“ neu. `zeigeTooltip` und die drei Listener werden ersetzt durch `zeigeInfoblase(ereignis)` auf
  `pointerdown` und `pointermove` (bei gedrückter Maus oder Finger) über `svg.kurve`: nächster Punkt nach x aus
  `data-punkte`, Blase `#infoblase` darüber, senkrechte Hilfslinie und Kreis am Punkt; `pointerleave` versteckt.
  Umrechnung von Bildschirm- in SVG-Koordinaten über `svg.getBoundingClientRect()` und die viewBox-Breite.
- [ ] **Schritt 5: Prüfen:** `npm test` grün. Browser `?demo`: Umschalter in allen drei Stellungen, Markierung gleitet,
  Kurve zeichnet sich ein, Infoblase beim Antippen und Ziehen; „Abnahme pro Woche“ und „Futter pro Tag“ aufklappen,
  einen Tag aufklappen; Balken wachsen; Übersicht für den Tierarzt öffnen → alte Diagramme unverändert.
- [ ] **Schritt 6: Commit** · `feat: Verlauf mit Zeitraum, weicher Kurve und aufklappbaren Wochen und Tagen`

---

### Aufgabe 8: Blätter von unten und Auswahlmenüs in den Formularen

**Dateien:**
- Ändern: `index.html` (alle fünf `<dialog>`, „Mehr“ → Zeitraum), `app.js` (Öffnen, Prüfen, − / ＋, Hintergrund-Klick), `styles.css`

**Schnittstellen:**
- Nutzt `auswahlFeld`, `auswahlAnmelden` (Aufgabe 4), `zeigeToast` (Aufgabe 3).

- [ ] **Schritt 1: Blatt-Stil:** `dialog` unten angedockt, volle Breite (max. 520 px), runde obere Ecken (24 px),
  Griff oben (`::before`, 40 × 5 px), Hereingleiten 0,38 s (`@starting-style` bzw. Keyframe beim `[open]`),
  `::backdrop` abgedunkelt mit Einblenden. In `app.js` für jeden Dialog: Klick mit `ereignis.target === dialog`
  (Hintergrund) → `dialog.close("abbrechen")`; nichts wird gespeichert.
- [ ] **Schritt 2: Mahlzeit-Blatt:** Fieldset `#mahlzeit-futter` wird `<div id="mahlzeit-futter">`, gefüllt in
  `oeffneMahlzeit` mit `auswahlFeld({ name: "futter", optionen: daten.futter.map((f) => ({ wert: f.id, text: f.name, zusatz: TYP_NAMEN[f.typ] + " · " + zahl(f.kcalPro100g) + " kcal/100 g" })), wert: daten.futter[0]?.id, extra: [{ text: "＋ Aus der Futterliste wählen", aktion: "liste-oeffnen" }] })`.
  Menge: große Zahl im Eingabefeld `gramm` (bleibt eintippbar) zwischen `<button type="button" data-aktion="gramm-minus">−</button>`
  und `…"gramm-plus">＋</button>`, Schritt 5 g, nicht unter 0, leeres Feld + ＋ ergibt 5; danach `zeigeMahlzeitVorschau()`.
  Uhrzeit bleibt `type="time"`. Prüfung in `beimSpeichern` zusätzlich: ohne `futter` → „Bitte eine Futtersorte wählen.“
  Nach dem Speichern `zeigeToast("✓ Gespeichert")`.
- [ ] **Schritt 3: Neue Sorte aus dem Mahlzeit-Blatt:** `uebernehmeAusListe` merkt sich, ob das Mahlzeit-Blatt offen
  ist; wenn ja, wird nach dem Übernehmen nur das Futter-Menü neu gebaut (neue Sorte gewählt), Menge und
  Uhrzeit bleiben stehen, das Mahlzeit-Blatt bleibt offen.
- [ ] **Schritt 4: Futtersorte-Blatt:** die zwei Fieldsets „Art“ und „Woher stammt der Wert?“ werden
  `auswahlFeld` (`name: "typ"` mit Nassfutter/Trockenfutter/Leckerli / Snack; `name: "quelle"` mit den vier
  bisherigen Texten); `oeffneFutter` setzt die Werte (bei neuer Sorte leer = Platzhalter). Prüfung:
  ohne Art → „Bitte die Art wählen.“, ohne Herkunft → „Bitte angeben, woher der Wert stammt.“
- [ ] **Schritt 5: Mehr → Zeitraum der Übersicht:** `<select id="bericht-zeitraum">` wird
  `auswahlFeld({ name: "bericht-zeitraum", optionen: [28 „letzte 4 Wochen“, 84 „letzte 12 Wochen“, alles „alles“], wert: "alles" })`
  in `<div id="bericht-zeitraum-feld">`; `zeichneBericht` liest den Wert aus dem versteckten Feld
  (`document.querySelector('[name="bericht-zeitraum"]').value`).
- [ ] **Schritt 6: Prüfen:** `npm test` grün. Browser `?demo`, 375 px: jedes Blatt gleitet herein, Hintergrund-Tipp
  schließt ohne Speichern; Futter-Menü per Maus und per Tastatur (Tab, ↓, Enter, Escape); − / ＋ schließen das
  Blatt **nicht**; Mahlzeit speichern zeigt „✓ Gespeichert“ und landet in „Heute“; Sorte über „＋ Aus der
  Futterliste wählen“ übernehmen → neue Sorte gewählt, eingetippte Menge noch da; Sorte ohne Art speichern →
  Fehlermeldung; Übersicht mit „letzte 4 Wochen“ öffnen.
- [ ] **Schritt 7: Commit** · `feat: Formulare als Blätter von unten mit Auswahlmenüs`

---

### Aufgabe 9: Profilbild (Auswahl, Zuschnitt, Speichern, Demo, Verlauf, PDF, Einlesen)

**Dateien:**
- Ändern: `app.js`, `index.html` (verstecktes `<input type="file" accept="image/*" id="foto-datei" hidden>`),
  `js/bericht.js` (`berichtHtml`), `styles.css`
- Test: `tests/bericht.test.js`

**Schnittstellen:**
- Nutzt `fotoGueltig`, `fotoBereinigen` (Aufgabe 2), `profilHtml` (Aufgabe 5), `zeigeToast` (Aufgabe 3).
- Liefert in `app.js`: `async function fotoZuschneiden(datei: File) -> string` (Data-URL; mittig quadratisch,
  256 × 256 px, `canvas.toDataURL("image/jpeg", 0.8)`, Verfahren wie im Muster mit `createImageBitmap`).

- [ ] **Schritt 1: Test** in `tests/bericht.test.js`: `berichtHtml` mit `tier.foto = "data:image/jpeg;base64,AAAA"`
  enthält `<img class="bericht-foto" src="data:image/jpeg;base64,AAAA"`; ohne Foto kein `bericht-foto`; mit
  ungültigem `foto` (`"javascript:x"`) ebenfalls kein `<img` (Prüfung über `fotoGueltig`).
- [ ] **Schritt 2:** `npm test` · Erwartet: der neue Test scheitert.
- [ ] **Schritt 3: `js/bericht.js`:** neben dem Namen im Kopf `<img class="bericht-foto" src alt="">` nur bei
  `fotoGueltig(tier.foto)`; CSS im Druck rund, 2 cm.
- [ ] **Schritt 4: Antippen des Profilbilds** (`#profil`, `data-aktion="profil"`):
  - Demo: `zeigeToast("In der Demo lässt sich kein Foto setzen.")`, sonst nichts.
  - Ohne Foto: direkt `#foto-datei` öffnen.
  - Mit Foto: kleines Menü (Baustein-Stil `auswahl-menue`, eigene zwei Knöpfe `type="button"`
    „Foto ändern“ / „Foto entfernen“). Entfernen fragt nicht nach, zeigt `zeigeToast("Foto entfernt")`.
- [ ] **Schritt 5: Foto übernehmen:** `fotoZuschneiden` → altes Foto merken → `tier.foto = url` →
  `speichern(daten)` in `try`; bei Fehler (Speicher voll, `QuotaExceededError`) altes Foto zurück, nichts
  neu zeichnen, Meldung `zeigeToast("Das Foto passt nicht mehr in den Speicher. Die übrigen Daten sind unverändert.", 4000)`;
  sonst `zeichneAlles()` und `zeigeToast("✓ Foto übernommen")`. Kann das Bild nicht gelesen werden
  (`createImageBitmap` wirft), Meldung „Dieses Bild konnte nicht gelesen werden.“
- [ ] **Schritt 6: Einlesen einer Sicherung:** im `import-datei`-Listener nach `istGueltig` und vor `confirm`:
  `const verworfen = fotoBereinigen(neu);` – bei `verworfen > 0` steht im Bestätigungstext zusätzlich
  „Das Profilbild in der Datei war ungültig und wird nicht übernommen.“
- [ ] **Schritt 7:** Profilbild klein im Kopf von „Verlauf“ (`profilHtml(tier, "klein")`) einbauen; das Bild
  springt beim Erscheinen ein (Keyframe `foto-rein` aus dem Muster, 0,45 s).
- [ ] **Schritt 8: Prüfen:** `npm test` grün. Browser **ohne** `?demo` mit einem Testbild (z. B. `icons/icon-512.png`
  über die Dateiauswahl; im Pane ggf. per `javascript_tool` eine `File` aus `fetch("icons/icon-512.png")` an
  die Übernahme-Funktion geben): Bild rund oben, im Verlauf klein, in der Übersicht für den Tierarzt;
  Länge der Data-URL unter 300 KB; Neu laden → Bild bleibt; entfernen. **Danach die Testdaten im lokalen
  Browser wieder entfernen** (`localStorage.removeItem("kilossos-daten")` nur im Test-Browser, nicht auf Stefans Handy).
  Mit `?demo`: Antippen zeigt den Demo-Hinweis.
- [ ] **Schritt 9: Commit** · `feat: Profilbild für das Tier, auch im Verlauf und in der Tierarzt-Übersicht`

---

### Aufgabe 10: Karte „Darstellung“ in „Mehr“

**Dateien:**
- Ändern: `index.html` (neue Karte), `app.js`

**Schnittstellen:**
- Nutzt `auswahlFeld`, `leseAnzeige`, `merkeAnzeige`, `wendeAnzeigeAn`.

- [ ] **Schritt 1:** Karte „Darstellung“ über „Sicherung“: `auswahlFeld({ name: "anzeige", optionen: [hell „Hell“, dunkel „Dunkel“, handy „Wie das Handy“], wert: leseAnzeige() })`
  und Satz „Gilt nur für dieses Gerät.“ Das versteckte Feld bekommt einen `change`-Listener:
  `merkeAnzeige(wert); wendeAnzeigeAn(wert)` (wirkt sofort, ohne Neuladen). Funktioniert auch im Demo-Modus
  (eigener Schlüssel, nicht in den Daten).
- [ ] **Schritt 2: Prüfen:** Browser: alle drei Stellungen; mit `resize_window` `colorScheme: "dark"` bei
  „Wie das Handy“ → dunkel, bei „Hell“ → hell; Seite neu laden → Wahl bleibt, kein Aufblitzen; `theme-color`
  passt (`document.querySelector("#theme-farbe").content`). Sicherung speichern → Datei enthält keine Anzeige-Wahl.
- [ ] **Schritt 3: Commit** · `feat: Darstellung Hell, Dunkel oder wie das Handy`

---

### Aufgabe 11: Abschluss (Version, Cache, Gesamtprüfung, Doku)

**Dateien:**
- Ändern: `sw.js`, `index.html` (`#version`), `C:\Users\Stefan Pude\Desktop\CLAUDE.md` + `Kilossos\AGENTS.md`
  (Sperre entfernen, 4 Kopfzeilen von AGENTS.md behalten), `HANDOFF.md`

- [ ] **Schritt 1:** `sw.js`: `CACHE_NAME = "kilossos-v14"`, in `DATEIEN` ergänzen: `js/zusammenfassung.js`,
  `js/anzeige.js`, `js/aufklappen.js`, `js/auswahl.js`. `index.html`: `Version 0.7.0`.
- [ ] **Schritt 2:** `npm test` · Erwartet: alle Tests grün (59 alte + neue), Ausgabe festhalten.
- [ ] **Schritt 3: Gesamtprüfung im Browser** (`kilossos-8081`, `?demo`): jeweils in Hell und Dunkel und bei
  375 px sowie Desktop-Breite alle fünf Bereiche, alle Blätter, Ring, Kacheln, Umschalter, Infoblase,
  Aufklappen; Konsole ohne Fehler. Reduzierte Bewegung lässt sich im Pane nicht einstellen, daher per
  `javascript_tool` prüfen, dass eine `@media (prefers-reduced-motion: reduce)`-Regel in `document.styleSheets`
  steht. Kontraste der endgültigen Farben mit einem kleinen `node -e`-Skript nach der WCAG-Formel
  (relative Leuchtdichte, `(L1 + 0,05) / (L2 + 0,05)`) nachrechnen. Screenshots von „Heute“ und „Verlauf“ in
  Hell und Dunkel als Nachweis. Service Worker: `await caches.keys()` enthält `kilossos-v14` und keinen älteren Namen.
- [ ] **Schritt 4:** In `CLAUDE.md` den Absatz „SPERRE für Codex …“ löschen, `AGENTS.md` abgleichen; in
  `HANDOFF.md` Punkt „00“ als erledigt markieren, Stand 0.7.0 / `kilossos-v14` / Testanzahl eintragen.
- [ ] **Schritt 5: Commit** · `feat: Version 0.7.0 mit neuer Oberfläche`
- [ ] **Schritt 6:** Stefan das Ergebnis mit Screenshots zeigen und fragen, ob hochgeladen werden darf (`git push`).
  Erst nach seinem OK pushen und nach ca. 1 Minute https://stefanpude.github.io/Kilossos/ prüfen.
