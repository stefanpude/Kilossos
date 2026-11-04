# Willkommensseite und Einrichtung beim ersten Start – Umsetzungsplan (Version 0.27.0)

> Für Agenten: Umsetzung mit superpowers:executing-plans (Aufgabe für Aufgabe, Checkboxen abhaken).

**Ziel:** Eine frische Installation startet nicht mehr mit Kater „Kito“ und Kitos Futter, sondern mit einer kurzen Willkommensseite (Sicherheit zuerst) und einer Einrichtung, in der der Halter seine eigene Katze anlegt.

**Aufbau:** Die bisherige Willkommensseite (`#willkommen` in `index.html`) wird zu drei Schritten auf derselben Fläche. `laden()` legt bei leerem Speicher nichts mehr an; die App hält bis zum Ende der Einrichtung nur einen Platzhalter im Arbeitsspeicher und speichert erst, wenn der Halter seine Katze angelegt hat. Bestehende Daten (Stefans Kito) bleiben unberührt, das Datenformat bleibt Version 1.

**Technik:** Vanilla-JS-Module, Tests mit `node --test` (`npm test`), Service Worker (`sw.js`).

**Grundlage:** `HANDOFF.md` → Nächste Schritte 1; Regeln für Texte in `.planning/willkommensseite.md` („Geklärt“).

## Feste Vorgaben

- Datenformat bleibt `VERSION = 1`, alte Sicherungen bleiben einlesbar, `istGueltig` bleibt unverändert (mindestens ein Tier).
- Gespeicherte Daten unter `kilossos-daten` werden nie verändert, nur weil die neue Version startet.
- Kein Futter vorbelegen. Keine Mengen, kein Zielgewicht in der Einrichtung (das macht nur der Tierarzt).
- Pflichtsätze bleiben sinngemäß: kein Ersatz für den Tierarzt, kein Medizinprodukt, Fettleber-Risiko, „frisst einen Tag oder länger nicht → sofort zum Tierarzt“, kranke Katzen nur nach Rücksprache.
- Texte: nicht werblich, nicht zu medizinisch, kurz; nie „ersetzt den Tierarzt“ oder „macht die Diät“. Keine Em-Dashes, Umlaute.
- Tippflächen ≥ 48 px, Tokens aus `styles.css` (Design „Wiegeprotokoll“), keine Emoji, Symbole aus `js/symbole.js`.
- Version `0.27.0` in `index.html` `#version`, `CACHE_NAME` in `sw.js` auf `kilossos-v43`, neue Dateien in `DATEIEN`.
- Nicht in der Demo (`?demo`).

## Prüf-Schwerpunkte (Fälle, die leicht kaputtgehen)

1. **Bestehender Nutzer mit Daten** (Stefan): Nach dem Update keine Einrichtung, kein Willkommen, Kito und Futter unverändert.
2. **App während der Einrichtung schließen:** Beim nächsten Öffnen beginnt die Einrichtung erneut; es liegt kein halber Datensatz und kein „Kito“ im Speicher.
3. **„Alle Daten löschen“:** führt danach in die Einrichtung (nicht zu Kito).
4. **Handywechsel:** Wer eine Sicherung hat, kann sie in Schritt 3 einlesen und landet ohne Fantasie-Katze direkt bei seinen Daten.
5. **Ohne Futtersorte eine Mahlzeit eintragen:** Dialog funktioniert, bietet „Aus der Futterliste wählen“ an, kein Fehler.

---

### Aufgabe 1: Startdaten ohne Kito (Datenschicht)

**Dateien:**
- Ändern: `js/daten.js` (`startDaten`, `laden`, `startwerteAktualisieren`)
- Tests: `tests/daten.test.js`

**Schnittstellen:**
- Erzeugt: `export function istErsterStart(speicher = localStorage): boolean` – true, wenn unter dem aktuellen Schlüssel nichts gespeichert ist.
- Erzeugt: `export function ersteDaten({ name, geschlecht, kastriert, foto?, wiegetag? }): Daten` – Version 1, genau ein Tier `{ id, name, art: "katze", geschlecht, kastriert, foto?, wiegetag? }`, alle Listen leer (auch `futter`).
- Ändert: `laden(speicher)` bei leerem Speicher → gibt einen **nicht gespeicherten** Platzhalter zurück (ein Tier „Deine Katze“, kein Futter), schreibt nichts.
- Behält: `startwerteAktualisieren` arbeitet weiter, die alten Kito-Sorten wandern dafür in eine interne Konstante `ALTE_STARTSORTEN` (nur für die Umstellung alter Stände).

- [ ] Tests anpassen/neu (zuerst rot):
  - „erster Start legt Kito an“ → ersetzen durch `laden()` bei leerem Speicher: ein Tier, Name nicht „Kito“, `futter.length === 0`, Speicher danach weiter leer (`istErsterStart` true).
  - `ersteDaten({ name: "Mia", geschlecht: "katze", kastriert: true, wiegetag: 3 })`: `istGueltig` true, Tier hat genau diese Werte, `futter`, `mahlzeiten`, `gewichte`, `freigaben` leer; ohne `wiegetag`/`foto` fehlen die Schlüssel ganz.
  - Bestehender Speicher mit Kito + Sheba 71 (alter Stand) → `laden()` stellt weiter auf 77 um (vorhandene Purina-/Sheba-Tests müssen ihren Ausgangsstand jetzt selbst speichern statt `laden()` auf leerem Speicher zu nutzen).
  - Bestehender Speicher mit Kito → `istErsterStart` false, Daten unverändert.
- [ ] `npm test` → neue Tests rot.
- [ ] Umsetzen wie oben.
- [ ] `npm test` → alles grün.

### Aufgabe 2: Drei Schritte auf der Willkommensfläche (Markup, CSS, Texte)

**Dateien:**
- Ändern: `index.html` (Abschnitt `#willkommen`), `styles.css` (Block „Willkommensseite“)

Schritt-Inhalte (Entwurf, Stefan prüft am Ergebnis):

1. **Willkommen** (`#willkommen-1`, ein Bildschirm bei 375 px und 100 % Schrift): Logo, Titel „Kilossos“, Unterzeile „Sicher abnehmen nach den Leitlinien der Tierärzte“ (bis 0.29.4: „Sicher abnehmen, ohne Fettleber-Risiko“, siehe `willkommensseite.md`). Drei Zeilen mit Symbol: Futter in Gramm und kcal / Gewicht und Tempo im Blick, warnt außerhalb der sicheren Grenzen / Daten bleiben auf dem Handy, kostenlos. Zwei Sätze Geschichte (Kito und Zuki), Link „Ganze Geschichte lesen“ (öffnet `dialog-geschichte`, Einrichtung bleibt danach offen). Knopf „Weiter“.
2. **Mit dem Tierarzt** (`#willkommen-2`): gekürzter Tierarzt-Kasten mit allen Pflichtsätzen, „Frisst … sofort zum Tierarzt“ fett. Knöpfe „Zurück“ und „Verstanden, weiter“.
3. **Deine Katze** (`#willkommen-3`, Formular `form-einrichtung`): Name (Pflicht, max. `NAME_MAX`), Kater/Katze (Pflicht, zwei Umschalt-Knöpfe), kastriert ja/nein (Pflicht), Wiegetag (optional, Auswahl wie im Profil, Hinweis „gleicher Tag, gleiche Uhrzeit“). Profilbild (freiwillig): runder Platzhalter mit Anfangsbuchstaben, Knopf „Foto wählen“, Hinweis „Freiwillig. Geht auch später im Profil.“; Zuschnitt mit dem vorhandenen `fotoZuschneiden` (256 × 256 JPEG), Foto bleibt bis „Los geht's“ nur im Arbeitsspeicher. Knopf „Los geht's“. Darunter leise: „Du hast schon eine Sicherung? Sicherung einlesen“.

- [ ] Markup und CSS bauen; Schrittanzeige „1 von 3“ als Text, Fokus beim Wechsel auf die Überschrift (`tabindex="-1"`).
- [ ] Browser-Sichtprüfung kommt in Aufgabe 4.

### Aufgabe 3: Ablauf in `app.js`

**Dateien:**
- Ändern: `app.js` (Abschnitt „Willkommensseite“, Start, `case`-Zweige)

**Schnittstellen:**
- Nutzt: `istErsterStart`, `ersteDaten` (Aufgabe 1); vorhandenes Einlesen einer Sicherung.
- Neue `data-aktion`-Namen vorher greppen (`grep -n 'case "name"' app.js`): `einrichtung-weiter`, `einrichtung-zurueck`, `einrichtung-geschichte`, `einrichtung-sicherung`.

- [ ] Start: `ersterStart = !demo && istErsterStart()` **vor** `laden()` merken. Wenn true: Willkommen ab Schritt 1 zeigen, Wischen gesperrt (wie bisher über `willkommen-offen`).
- [ ] Wenn false: keine Willkommensseite mehr, auch nicht für Geräte ohne `kilossos-willkommen-2` (bestehende Nutzer haben Daten). Den Schlüssel `kilossos-willkommen-2` nicht mehr lesen; beim Start entfernen (Aufräumen).
- [ ] „Los geht's“: Formular prüfen (Fehler am Feld wie in anderen Dialogen), `daten = ersteDaten(...)`, `sichern()`; erst dann Seite schließen, aktives Tier merken, „Heute“ zeigen. Speichern scheitert → Seite bleibt offen, Toast.
- [ ] „Sicherung einlesen“: vorhandenen Einlese-Ablauf nutzen; nur bei Erfolg Seite schließen.
- [ ] `sichern()` und andere Schreibwege dürfen während der offenen Einrichtung nichts speichern (Platzhalter darf nie im Speicher landen); per Wächter am Anfang von `sichern()`.
- [ ] „Alle Daten löschen“ lädt neu → landet in der Einrichtung (prüfen, nichts zu ändern erwartet).

### Aufgabe 4: Prüfen, Version, Review

- [ ] `npm test` grün (Anzahl notieren, vorher 174).
- [ ] Browser (`preview_start kilossos`, vorher Service Worker und Caches löschen, Tab auf localhost prüfen), 375 px hell/dunkel/150 %:
  - leerer Speicher → 3 Schritte, Pflichtfelder, mit und ohne Foto, „Los geht's“ → „Heute“ mit der neuen Katze, Futter leer, Mahlzeit-Dialog ohne Sorte geht.
  - Mitten in Schritt 2/3 neu laden → wieder Schritt 1, `localStorage` ohne `kilossos-daten`.
  - Speicher mit Kito (Testdaten) → keine Einrichtung, alles wie vorher.
  - Sicherung einlesen aus Schritt 3.
  - „Alle Daten löschen“ → Einrichtung.
  - Demo `?demo` → keine Einrichtung.
  - Schritt 1 passt bei 100 % ohne Scrollen; keine Konsolenfehler, kein waagerechter Überlauf.
- [ ] Version 0.27.0, Cache v43, `js/daten.js`-Kopfkommentar ergänzen (seit 0.27.0 kein Startfutter).
- [ ] Unabhängiger Code-Review (frischer Opus-Agent), Funde einarbeiten.
- [ ] Commit lokal nur nach Stefans Ja: `feat: Einrichtung beim ersten Start, kürzere Willkommensseite, Version 0.27.0`.

---

## Entscheidungen

Geklärt 04.11.2026:
1. **Bilder von Kito und Zuki in Schritt 1** erst, wenn Stefans Fotos da sind (keine Comic-Platzhalter).
2. **Profilbild in der Einrichtung:** freiwillig, mit Hinweis „geht auch später im Profil“ (Stefan: viele würden es sonst vermissen).
3. **Handy-Test:** Live-Adresse im Inkognito-Tab von Chrome (frischer Speicher, Stefans Daten bleiben sicher).
