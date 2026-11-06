# Erklärseite „Wie wiege ich meine Katze?“ (geplant 06.11.2026)

Herkunft: Ideen-Tafel, Karte „Info zu Wiege Methoden und Genauigkeiten“ (Status geplant).
**Bauen erst nach dem Tierarzttermin am 13.11.2026**, damit die Antwort auf „Welche Waage empfehlen Sie für zu Hause?“
(steht in beiden Fragenlisten, Abschnitt „Kontrolle“) hineinfließt. Text vor dem Einbau Stefan zeigen.

## Ziel
Halter wissen, welcher Weg zum Wiegen wie genau ist und warum das beim Abnehmen zählt. Heute stehen die Hinweise nur
verstreut: Fenster „Gewicht eintragen“ unter „Auf dem Arm gewogen?“ (Personenwaage in 100-g-Schritten, Differenz kann
100 g oder mehr danebenliegen, Tier- oder Babywaage in 10-g-Schritten genauer, Transportbox-Tipp, immer dieselbe
Waage) und kurze Tipps „gleicher Tag, gleiche Uhrzeit, gleiche Waage“ bei Einrichtung, Gewicht und Wiegetag.
Keine Futtermenge, keine Diagnose, keine neue Rechnung.

## Inhalt (Entwurf der Gliederung, Wortlaut später)
1. **Warum genau wiegen?** Die Leitlinien nennen 0,5 bis 2 % Abnahme pro Woche. Bei einer 5-kg-Katze sind das nur
   25 bis 100 g, also etwa so viel, wie eine Personenwaage danebenliegen kann. Beispiel mit einer erfundenen
   5-kg-Katze, nicht mit Kito (Repo ist öffentlich). Zahlen per Test aus `GRENZEN` berechnen, nicht von Hand tippen.
2. **Die Wege im Vergleich** (je 1 bis 2 Sätze, kurze Liste):
   - Waage in der Tierarztpraxis: am genauesten, gut zum Nachwiegen.
   - Tier- oder Babywaage zu Hause: meist 10-g-Schritte, gut für den Wiegetag.
   - Transportbox auf Küchen- oder Paketwaage: Box leer wiegen, dann mit Katze, Differenz eintragen; nur, wenn die
     Waage das Gewicht trägt (Höchstlast auf der Waage ansehen).
   - Personenwaage mit Katze auf dem Arm: am gröbsten (100-g-Schritte, zweimal abgelesen); Kilossos rechnet die
     Differenz im Gewicht-Fenster unter „Auf dem Arm gewogen?“.
   Genauigkeit nur über die Schrittweite der Waage beschreiben, keine erfundenen Prozentwerte.
3. **Gleiche Bedingungen:** gleicher Wochentag (Wiegetag unter „Mehr“), gleiche Uhrzeit, möglichst vor dem Füttern,
   immer dieselbe Waage, auf festem, ebenem Boden.
4. **Wann nachwiegen?** Zeigt Kilossos eine Warnung zum Tempo oder passt ein Wert nicht zum Verlauf: erst mit einer
   genauen Waage oder in der Praxis nachwiegen, bevor sich am Futter etwas ändert. Sicherheitsaussagen nicht weicher
   als heute im Gewicht-Fenster.
5. Antwort des Tierarztes vom 13.11. einarbeiten (welche Waage für zu Hause).

Quellen (vor dem Einbau prüfen und auf der Seite nennen): AAHA 2014 Weight Management Guidelines (regelmäßig mit
derselben Waage wiegen, Abnahmetempo), WSAVA Global Nutrition Guidelines 2011 / Toolkit, ggf. die Antwort des Tierarztes.
Kein Satz ohne Quelle, der über Waagen-Schrittweiten hinausgeht.

## Ort in der App (Stefan vor dem Bau fragen)
- **Empfehlung:** auf „Tipps fürs Abnehmen“ als dritter Abschnitt („Richtig wiegen“) mit Link auf die neue Seite,
  dazu ein Link im Fenster „Gewicht eintragen“ (z. B. unter „Auf dem Arm gewogen?“: „Wie wiege ich am genauesten?“).
  Grund: „Wissen“ hat schon fünf Einträge, und „Tipps“ ist der Wegweiser für solche Seiten.
- Alternative (so stand es auf der Karte): eigener sechster Eintrag unter „Wissen“.
- Regel aus 0.61.0 beachten: keine Seite über Wissen/Tipps/Fragen doppelt verlinkt (Test in `tests/mehr.test.js`).
  Der Link aus dem Gewicht-Fenster liegt außerhalb und ist erlaubt.

## Umsetzung
- `index.html`: `<dialog id="dialog-wiegen">` nach dem Muster von `dialog-ursachen`/`dialog-alltag`
  (h2 mit `tabindex="-1" autofocus`, Abschnitte, Quellenzeile, Knopf „Verstanden“ zurück zur Seite davor).
- `app.js`: Aktion `wiegen-erklaerung` öffnet den Dialog; Rückweg wie bei den anderen Erklärseiten.
- Anleitung „So nutzt du Kilossos“ (Schritt zum Wiegen) und Häufige Fragen nur anpassen, wenn dort sonst doppelt
  derselbe Inhalt stünde; sonst unverändert.
- Kein Datenformat, keine Rechnung, `CACHE_NAME` hochzählen, Version hochzählen (index.html, sw.js, Test in
  `tests/wissen.test.js` per Edit, nie per sed).

## Tests (`tests/wiegen.test.js`, per Write anlegen)
- Seite ist genau über den gewählten Ort und das Gewicht-Fenster erreichbar, nicht doppelt über Wissen/Tipps/Fragen.
- Beispielzahlen (25 bis 100 g bei 5 kg) stimmen mit `GRENZEN` überein.
- Kein Kito-/Zuki-Name auf der Seite, keine Futtermenge in Gramm pro Tag.
- Jeder Abschnitt hat eine Quelle in der Quellenzeile; Zahl und Einheit mit NBSP.

## Prüfung
Browser 375 px hell/dunkel (Pane sichtbar), Link aus dem Gewicht-Fenster und von „Tipps“, „Verstanden“ führt zurück,
Tippflächen ≥ 48 px. Danach Karte auf der Ideen-Tafel auf „erledigt“.
