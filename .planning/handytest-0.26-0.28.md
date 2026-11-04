# Handy-Test 0.26.0 bis 0.30.0

Nach dem Hochladen etwa 1 Minute warten. Dann die App einmal ganz schließen und neu öffnen.
Dann **Mehr** ganz nach unten scrollen: Die letzte Zeile (mit dem i-Zeichen) zeigt die Version, dort muss **Version 0.30.0** stehen.
„Über Kilossos“ ist nur eine Überschrift, die Versionszeile nur zum Lesen: Antippen bewirkt bei beiden nichts.
Steht dort noch eine alte Version, die App noch einmal schließen und öffnen.

Bitte nichts eintragen, was du nicht behalten willst. Testeinträge danach wieder löschen.
Keine Test-Freigabe speichern.

## A. Normale App (mit Kito)

- [x] Die App startet wie immer mit Kito und seinen Einträgen, ohne Einrichtung.
- [x] **Gewicht** → „Auf dem Arm gewogen?“ aufklappen: Der fette Satz „nie so genau wie eine richtige Tierwaage“ steht oben.
- [x] Dort stehen Zahlen zu Kito (1 % des Gewichts in Gramm).
- [x] Zwei Zahlen eintragen (z. B. 74,6 und 65,3): Oben erscheint 9,30, die Notiz lautet „auf dem Arm gewogen“. Danach **Abbrechen**, nicht speichern.
- [x] Mit der Tastatur: „Weiter“ bzw. Enter im ersten Feld springt ins zweite Feld und schließt das Fenster nicht.
- [x] **Mehr**: ganz nach unten scrollen, „Wiegetag“ und „Darstellung“ antippen. Das Menü klappt nach **oben** auf und liegt nicht hinter der unteren Leiste.
- [x] **Gewicht** → Monatsfoto: Am Foto-Tag ist das Foto-Feld offen, sonst steht dort der Link „Monatsfoto nachholen“.
- [x] Wägungsliste: Auf ein Vorschaubild tippen → „Anderes Foto“ und „Foto entfernen“ funktionieren.
- [x] **Mehr** → „Daten“: Die Speicheranzeige zeigt eine Prozentzahl.
- [x] **Mehr** → Übersicht für den Tierarzt mit „Fotos mitnehmen“: Erstes und letztes Foto erscheinen im Bericht.

Ergebnis 04.11.2026 auf dem Android-Handy (0.29.2): alle 10 Punkte bestanden. Punkte 8 und 10 in der Demo (`?demo`) geprüft, weil die echten Daten noch keine Wägung mit Foto haben. Zusätzlich die Druckvorschau („Drucken / als PDF speichern“) geprüft: beide Fotos sind zu sehen.

## B. Frische Installation (Inkognito-Tab in Chrome)

- [x] https://stefanpude.github.io/Kilossos/ im Inkognito-Tab öffnen: Die Einrichtung startet mit 3 Schritten, ohne Kito.
- [x] Ohne Namen kommt man nicht weiter (Hinweis erscheint).
- [x] Nach „Los geht's“: **Heute** → Mahlzeit eintragen. Das Feld zeigt „Noch keine Sorte gespeichert“, darunter ein Tipp.
- [x] Im Feld „Aus der Futterliste wählen“ antippen, eine Sorte übernehmen: Der Tipp verschwindet.
- [x] Inkognito-Tab schließen, damit verschwinden alle Testdaten.

Ergebnis 04.11.2026: alle 5 Punkte bestanden. Zusätzlich geprüft: Ein neuer Inkognito-Tab startet wieder mit der Einrichtung, die echten Daten bleiben unberührt.

## C. Neu in 0.28.3 bis 0.28.5 (normaler Tab)

- [x] **Heute**: Eine Mahlzeit antippen öffnet „Mahlzeit ändern“ wie vorher; nach „Speichern“ sieht alles aus wie vorher.
- [x] **Futter**: Eine eigene Sorte antippen öffnet „Sorte ändern“ wie vorher.
- [ ] Freiwillig, 2 Minuten: TalkBack einschalten (Einstellungen → Bedienungshilfen → TalkBack). Auf eine Mahlzeit tippen: TalkBack liest Uhrzeit, Sorte, Menge und „ändern“. Doppeltippen öffnet das Blatt, TalkBack nennt dessen Titel. TalkBack danach wieder ausschalten.

Ergebnis 04.11.2026: C1 und C2 bestanden (C1 mit einer Testmahlzeit, danach gelöscht). C3 (TalkBack) übersprungen: später in Ruhe nachholen und vorher den TalkBack-Kurzbefehl über die Lautstärketasten einrichten, damit man TalkBack sicher wieder ausschalten kann.

## D. Neu in 0.29.0 bis 0.29.2 (normaler Tab)

- [x] **Futter** → „Aus der Futterliste wählen“ → ins Suchfeld „sterilised“ tippen: 7 Sorten erscheinen (Royal Canin, Hill's, zweimal Pro Plan, zweimal Select Gold, Bozita). Bei „steril“ sind es 10, dazu Purina ONE Sterilcat, Whiskas Sterile und Perfect Fit Sterile. Nichts übernehmen. (Korrigiert am 04.11.: Vorher stand hier fälschlich Perfect Fit bei „sterilised“; die Suche prüft nur den Namen.)
- [x] **Heute** → Mahlzeit eintragen: Unter „Menge in Gramm“ steht der Hinweis „Wiege das Futter, bevor du Wasser oder Brühe dazugibst …“. Danach **Abbrechen**.
- [ ] Symbol auf dem Startbildschirm: Chrome tauscht das Symbol der installierten App nicht sofort aus, sondern prüft das höchstens etwa einmal am Tag beim Öffnen. Kann sein, dass Chrome dabei fragt, ob das geänderte Symbol übernommen werden soll: bestätigen. Danach sollten beide Ohren und der Napf ganz zu sehen sein. Ist es nach zwei Tagen noch das alte, ist das kein Fehler der App.

Ergebnis 04.11.2026: D1 und D2 bestanden. D3 (Symbol) in den nächsten Tagen beobachten.

## E. Neu in 0.29.3 (normaler Tab)

- [ ] Oben links steht „Kilossos“ größer und dunkel, nicht mehr klein und grau.
- [ ] Auf **Heute** steht neben Kitos Namen kein Pfeil mehr. Einen Pfeil gibt es nur, wenn mehrere Tiere angelegt sind.
- [ ] **Mehr** öffnen und die Seite aktualisieren (oder die App kurz im Hintergrund lassen): Die App bleibt auf **Mehr**. Wird sie ganz geschlossen (aus den offenen Apps wegwischen) und neu geöffnet, beginnt sie auf **Heute**.

## F. Neu in 0.29.4 (Demo in Chrome, deine echten Daten bleiben unberührt)

- [ ] https://stefanpude.github.io/Kilossos/?demo öffnen → **Verlauf**: Direkt unter der Gewichtskurve und ihrer Legende steht klein und grau „Tippe auf die Kurve, um Datum und Gewicht zu sehen …“, noch in derselben Karte.
- [ ] Weiter nach unten scrollen: erst „Tempo pro Woche“, dann „Futter pro Tag“, dann „Befunde vom Tierarzt“, ganz unten „Vorher / Nachher“.

## G. Neu in 0.30.0 (normaler Tab, nur lesen, nichts eintragen)

- [ ] **Mehr** öffnen: Unter „Übersicht für den Tierarzt“ steht eine neue Gruppe **Wissen** mit „Begriffe kurz erklärt“ und „Warum nimmt meine Katze nicht ab?“.
- [ ] „Begriffe kurz erklärt“ antippen: Ein Blatt mit 12 Begriffen öffnet sich, von „Alleinfutter und Ergänzungsfutter“ bis „Zielgewicht“, alle zugeklappt. Einen Begriff antippen: Die Erklärung klappt auf, darunter klein die Quelle. Noch einmal antippen: Sie klappt wieder zu.
- [ ] „BCS und MCS“ aufklappen und den grünen Link „Mehr zum BCS“ antippen: Das Blatt „Was ist der BCS?“ legt sich darüber. Dort „Verstanden“ antippen: Du bist wieder bei den Begriffen.
- [ ] Unten „Verstanden“ antippen: Das Blatt schließt, du bist wieder unter **Mehr**.
- [ ] „Warum nimmt meine Katze nicht ab?“ antippen: Nach zwei Sätzen kommt der Kasten „Bitte nie hungern lassen.“ mit einem Strich links, darunter 8 Abschnitte, ganz unten klein die Quellen.
- [ ] Beide Seiten einmal in Ruhe lesen: Klingt etwas falsch, zu streng oder unverständlich? Unten notieren.

Der Knopf „Warum nimmt meine Katze nicht ab?“ im Hinweis „Abnahme stockt“ auf **Heute** erscheint erst mit einer Freigabe und vier Wochen ohne Abnahme. Dafür ist nichts zu tun.

## Was mir auffällt

(Hier notieren, was komisch aussieht oder sich falsch anfühlt, am besten mit Screenshot.)

- **Aktualisieren springt immer auf „Heute“** (04.11.2026): Wer zum Beispiel unter „Mehr“ die Seite aktualisiert, landet wieder auf „Heute“, egal in welchem Bereich. Ursache: Die App merkt sich den offenen Bereich nicht (`zeigeAnsicht` in `app.js`; beim Laden ist nur „Heute“ sichtbar). Das trifft auch, wenn Android die App im Hintergrund beendet und beim Zurückkehren neu lädt. Plan: Bereich in `sessionStorage` merken und beim Aktualisieren wiederherstellen; ein frischer Start der App beginnt weiter auf „Heute“. **Behoben in 0.29.3.**
- **Pfeil neben dem Namen auf „Heute“ tut nichts** (04.11.2026): Neben „Kito“ steht ein Pfeil nach unten, Antippen bewirkt nichts. Der Pfeil soll nur bei mehr als einem Tier erscheinen (dann öffnet er das Menü zum Wechseln). `app.js` setzt bei einem Tier `hidden` und sperrt den Knopf, aber `styles.css` (`.tier-wechsel .pfeil { display: inline-block }`) hebt `hidden` auf. Plan: Regel `.tier-wechsel .pfeil[hidden] { display: none; }`, im Browser mit einem und mit zwei Tieren prüfen. **Behoben in 0.29.3.**
