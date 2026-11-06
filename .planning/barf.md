# Futterart „Frischfleisch / BARF“ (geplant 06.11.2026, Stefans Wunsch „beides umsetzen“)

**Gebaut in 0.72.0 (06.11.2026).** Texte der Rückfrage mit Stefans Ja: „… sind für Frischfleisch ungewöhnlich viel.“
(nicht „viel zu viel“, fettes Fleisch kann über 300 liegen), Rechner verlangt die Feuchte. Balken: Punktmuster statt
Mischfarbe (Mischung mit --text war hell kaum von Nass zu unterscheiden). Tests `tests/frischfleisch.test.js`.

## Ziel
Wer Tatar, rohes Fleisch oder BARF-Mischungen füttert, kann es als eigene Sorte mit der richtigen Art eintragen,
statt es als „Nassfutter“ oder „Leckerli“ falsch einzusortieren. Die App rechnet wie immer nur Gramm × kcal/100 g.
Keine Futterempfehlung, kein Rat für oder gegen BARF.

## Datenformat
- Neuer Wert `typ: "frisch"` in `futter` (js/daten.js, Kommentar). `istGueltig` prüft `typ` nicht → alte Sicherungen
  bleiben gültig, keine Umwandlung nötig. Version des Formats bleibt 1.
- Rückweg: Eine Sicherung mit `frisch` in einer älteren App-Fassung zeigt die Sorte ohne Artnamen, verliert aber nichts
  (nur eine Fassung ist live, daher kaum relevant).
- Tests: alte Sicherung ohne `frisch` lädt unverändert; neue Sorte `frisch` übersteht Speichern/Laden und Sicherung.

## Stellen
1. app.js: `TYP_NAMEN`, `TYP_SYMBOL`, `TYP_OPTIONEN` („Frischfleisch / BARF“), Gruppen auf „Futter“ (`zeichneFutter`).
2. js/symbole.js: neues Symbol `frisch` (schlichtes Fleischstück, Strichstil wie die anderen).
3. js/zusammenfassung.js: `ARTEN` um `frisch` (sonst zählt es heute als „Nass“ im Balken).
4. js/heute-grafiken.js + styles.css: Name „Frisch“ und eigene Farbe im Balken „Heute gefüttert“ (hell/dunkel/Druck).
5. js/bericht.js: Spalte Art im PDF „frisch“.
6. js/rechnen.js: `ART_NAME` und `KCAL_GRENZEN.frisch` für die Rückfrage bei auffällig hohen kcal-Werten.
   Wert nur mit Quelle (Lebensmitteltabelle für rohes Fleisch), Vorschlag nach Recherche.
7. js/wissen.js: Begriff „BARF“ sagt „als eigene Sorte mit der Art Frischfleisch / BARF anlegen“.

## Geklärt (06.11. abends, nach Stefans „jetzt barf“)
- Name „Frischfleisch / BARF“, kurz „Frisch“ in Grafik und PDF (Claudes Empfehlung, Stefan sagte „jetzt barf“).
- Kein Hinweistext zu rohem Fleisch jetzt, erst nach dem 13.11. mit Tierarzt.
- **Schlüssel `frischfleisch`, nicht `frisch`:** die CSS-Klasse `.frisch` und die Funktion `frisch()` in app.js gibt es
  schon (Aufleuchten des kcal-Felds).
- Leser von `typ` (alle anpassen): app.js `TYP_NAMEN`, `TYP_SYMBOL`, `TYP_OPTIONEN`, `ART_DATIV` (~2276),
  `zeichneFutter` (Liste der Arten ~685); js/zusammenfassung.js `ARTEN` (unbekannt zählt sonst als „nass“);
  js/heute-grafiken.js `ART_NAMEN`, `ART_ZEILE` + CSS `gef-chip`/`gef-st`; js/bericht.js `TYP` (~187);
  js/rechnen.js `ART_NAME`, `KCAL_GRENZEN`, `kcalKasten`, `rechnerPruefen` (Feuchte Pflicht wie bei nass);
  js/verlauf.js nutzt `TYP_SYMBOL` mit Rückfall; js/futterliste.js `listenGruppen` braucht nichts (keine Listeneinträge).
  Schreiber: nur das Fenster „Eigene Sorte“. `istGueltig` (js/daten.js) prüft `typ` nicht → keine Umwandlung.
- **kcal-Rückfrage:** `KCAL_GRENZEN.frischfleisch = 300`. Grund: Etiketten von Fleisch nennen kJ und kcal; mageres
  Fleisch in kJ (z. B. 120 kcal = 502 kJ) liegt immer über 300 und wird so erkannt. Quelle: USDA FoodData Central,
  „Beef, ground, 80% lean meat / 20% fat, raw“ (FDC 174036) 254 kcal/100 g. `kcalKasten` darf für Frischfleisch keine
  Spanne aus der Futterliste nennen (es gibt dort keine Einträge), Satz stattdessen z. B. „Selbst rohes Rinderhack mit
  20 % Fett hat etwa 254 kcal pro 100 g (USDA).“ (Satz vor dem Einbau Stefan zeigen.)
- Live vor Beginn: 0.71.0 (v127).

## Offen (Stefan)
- Name in der Auswahl: „Frischfleisch / BARF“, kurz „Frisch“ in Grafik und PDF?
- Hinweistext zu rohem Fleisch (nur ungewürzt, Zwiebeln giftig, Hygiene): nur mit Quelle und Stefans Ja,
  sonst ohne Text. Vorschlag: erst nach dem 13.11. mit Tierarzt.
- Leckerli-Grenze (10 %) betrifft Frischfleisch nicht, es zählt als normales Futter.
