# Handy-Test 0.26.0 bis 0.34.2

Nach dem Hochladen etwa 1 Minute warten. Dann die App einmal ganz schließen und neu öffnen.
Dann **Mehr** ganz nach unten scrollen: Die letzte Zeile (mit dem i-Zeichen) zeigt die Version, dort muss **Version 0.34.2** (oder neuer) stehen.
„Über Kilossos“ ist nur eine Überschrift, die Versionszeile nur zum Lesen: Antippen bewirkt bei beiden nichts.
Steht dort noch eine alte Version, die App noch einmal schließen und öffnen.

Bitte nichts eintragen, was du nicht behalten willst. Testeinträge danach wieder löschen.
Keine Test-Freigabe speichern.

Auf Stefans Handy (Stand 05.11.2026): Browser ist **Opera**, Kilossos ist **nicht installiert**, sondern läuft als normaler Tab.
„App ganz schließen“ heißt dann: Opera aus den offenen Apps wegwischen. Demo-Teile bitte **am Stück** machen und
zwischendurch nicht die App wechseln: Opera lädt Tabs im Hintergrund neu, und die Demo beginnt dann wieder von vorn.

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
Nachtrag 05.11.2026: D3 entfällt vorerst, Kilossos ist auf Stefans Handy nicht installiert (Opera-Tab).

## E. Neu in 0.29.3 (normaler Tab)

- [x] Oben links steht „Kilossos“ größer und dunkel, nicht mehr klein und grau.
- [x] Auf **Heute** steht neben Kitos Namen kein Pfeil mehr. Einen Pfeil gibt es nur, wenn mehrere Tiere angelegt sind.
- [x] **Mehr** öffnen und die Seite aktualisieren (oder die App kurz im Hintergrund lassen): Die App bleibt auf **Mehr**. Wird sie ganz geschlossen (aus den offenen Apps wegwischen) und neu geöffnet, beginnt sie auf **Heute**.

Ergebnis 05.11.2026 (Opera-Tab, 0.34.2): alle 3 Punkte bestanden. Das Aktualisieren unter „Mehr“ hat Stefan am PC in Chrome geprüft, das Schließen und neu Öffnen am Handy.

## F. Neu in 0.29.4 (Demo in Opera, deine echten Daten bleiben unberührt)

- [x] https://stefanpude.github.io/Kilossos/?demo öffnen → **Verlauf**: Direkt unter der Gewichtskurve und ihrer Legende steht klein und grau „Tippe auf die Kurve oder auf einen besonderen Tag darunter, um Einzelheiten zu sehen. …“, noch in derselben Karte. (Seit 0.33.0 so, weil die Demo besondere Tage hat; ohne sie heißt es „Tippe auf die Kurve, um Datum und Gewicht zu sehen.“)
- [x] Weiter nach unten scrollen: erst „Tempo pro Woche“, dann „Futter pro Tag“, dann „Befunde vom Tierarzt“, ganz unten „Vorher / Nachher“.

Ergebnis 05.11.2026 (Opera, 0.34.2): beide Punkte bestanden.

## G. Neu in 0.30.0 (normaler Tab, nur lesen, nichts eintragen)

- [x] **Mehr** öffnen: Unter „Übersicht für den Tierarzt“ steht eine neue Gruppe **Wissen** mit „Begriffe kurz erklärt“ und „Warum nimmt meine Katze nicht ab?“.
- [x] „Begriffe kurz erklärt“ antippen: Ein Blatt mit 12 Begriffen öffnet sich, von „Alleinfutter und Ergänzungsfutter“ bis „Zielgewicht“, alle zugeklappt. Einen Begriff antippen: Die Erklärung klappt auf, darunter klein die Quelle. Noch einmal antippen: Sie klappt wieder zu.
- [x] „BCS und MCS“ aufklappen und den grünen Link „Mehr zum BCS“ antippen: Das Blatt „Was ist der BCS?“ legt sich darüber. Dort „Verstanden“ antippen: Du bist wieder bei den Begriffen.
- [x] Unten „Verstanden“ antippen: Das Blatt schließt, du bist wieder unter **Mehr**.
- [x] „Warum nimmt meine Katze nicht ab?“ antippen: Nach zwei Sätzen kommt der Kasten „Bitte nie hungern lassen.“ mit einem Strich links, darunter 8 Abschnitte, ganz unten klein die Quellen.
- [x] Beide Seiten einmal in Ruhe lesen: Klingt etwas falsch, zu streng oder unverständlich? Unten notieren.

Der Knopf „Warum nimmt meine Katze nicht ab?“ im Hinweis „Abnahme stockt“ auf **Heute** erscheint erst mit einer Freigabe und vier Wochen ohne Abnahme. Dafür ist nichts zu tun.

Ergebnis 05.11.2026 (Opera-Tab, 0.34.2): alle 6 Punkte bestanden. Beide Seiten gelesen: „passt alles“.

## H. Neu in 0.31.0: Gewicht ändern (Demo in Opera, deine echten Daten bleiben unberührt)

- [x] https://stefanpude.github.io/Kilossos/?demo öffnen → **Gewicht** → in der Liste auf eine Wägung tippen, und zwar auf Gewicht und Datum, **nicht** auf das Kreuz rechts. Das Fenster „Gewicht von Kito ändern“ öffnet sich, Gewicht und Datum stehen schon drin.
- [x] Einmal auf „−10 g“ tippen, dann **Speichern**: In der Liste steht das neue Gewicht, und es ist keine zweite Wägung dazugekommen (die Zahl „… Wägungen“ über dem Monat bleibt gleich).
- [x] Dieselbe Wägung noch einmal antippen, das Datum auf einen Tag im Vormonat stellen, **Speichern**: Der Vormonat klappt auf, die Wägung steht jetzt dort.
- [x] Noch einmal antippen, etwas ändern und dann **Abbrechen**: Nichts ändert sich.
- [x] Ganz unten auf „Gewicht eintragen“ tippen: Das Fenster heißt wie immer „Gewicht von Kito“, das Gewichtsfeld ist leer. **Abbrechen**.

Danach oben „Demo beenden“ antippen oder den Tab schließen.

Ergebnis 05.11.2026 (Opera, 0.34.2): alle 5 Punkte bestanden.

## I. Neu in 0.32.0 und 0.32.1: kJ-Schutz und kcal-Rechner (Demo in Opera, deine echten Daten bleiben unberührt)

- [x] https://stefanpude.github.io/Kilossos/?demo öffnen → **Futter** → „Eigene Sorte anlegen“. Als Name „Test“ eintragen, bei „Art“ **Nassfutter** wählen.
- [x] Bei „kcal pro 100 g“ **307** eintragen und auf eine freie Stelle tippen: Ein roter Kasten erscheint („307 kcal pro 100 g sind für Nassfutter viel zu viel.“) mit Knöpfen wie „Dort steht kJ“.
- [x] Noch **nichts** im roten Kasten antippen, sondern unten **Speichern**: Es wird nicht gespeichert, es erscheint „Bitte zuerst die Frage im roten Kasten beantworten.“
- [x] Im roten Kasten „Dort steht kJ“ antippen: Im Feld steht jetzt **73,4**, darunter „✓ 307 kJ umgerechnet: 73,4 kcal pro 100 g.“ Der rote Kasten ist weg.
- [x] Weiter unten „Keine kcal auf der Packung?“ aufklappen und eintragen: Protein **7,9**, Fett **4,4**, Asche **1,4**, Faser **0,3**, Feuchte **84**. Es erscheint etwa 77 kcal und ein Knopf „77 kcal übernehmen“.
- [x] „77 kcal übernehmen“ antippen: Oben im Feld steht 77, bei „Woher stammt der Wert?“ steht „Aus den Bestandteilen berechnet“.
- [x] Oben im Feld 77 in **78** ändern und dann sofort **Speichern** antippen, ohne vorher woanders hinzutippen: Schon der **erste** Tipp speichert („✓ Gespeichert“), die Sorte „Test“ steht in der Liste.
- [ ] 0.32.1: Im Tab auf **Gewicht** gehen und die Seite aktualisieren (oben im Tab nach unten ziehen): Die Seite lädt neu und zeigt gleich **Gewicht**. „Heute“ darf dabei nicht kurz aufblitzen.

Danach oben „Demo beenden“ antippen oder den Tab schließen. Die Sorte „Test“ verschwindet mit der Demo.

Ergebnis 05.11.2026 (Opera, 0.34.2): Punkte 1 bis 7 bestanden, schon der erste Tipp auf Speichern hat gespeichert.
Danach fehlte „Test“, weil Opera den Demo-Tab im Hintergrund neu geladen hatte (auch die in Teil H verschobene
Wägung war wieder zurück); im Browser am PC nachgespielt: „Test“ steht nach dem Speichern unter „Futter“ und in der
Sortenauswahl bei „Mahlzeit eintragen“, nach dem Neuladen der Demo ist sie weg. Die Meldung „✓ Gespeichert“ hat
Stefan beim ersten Mal nicht bemerkt; ein Gegenversuch mit offener Tastatur (Wägung ändern) zeigte sie, sie steht
nur knapp 2 Sekunden. Punkt 8 (0.32.1) am Handy nicht einzeln geprüft; am PC bleibt beim Aktualisieren der Bereich.

## J. Neu in 0.33.0: Besonderer Tag (Demo in Opera, deine echten Daten bleiben unberührt)

- [x] https://stefanpude.github.io/Kilossos/?demo öffnen → **Heute** → in der Karte „Besonderer Tag“ auf „Besonderen Tag eintragen“ tippen. (Dort steht schon ein Eintrag der Demo, „Weniger Bewegung“; den und seinen Knopf „Beendet“ bitte nicht antippen.)
- [x] Bei „Was war besonders?“ **Sonstiges** wählen, die Notiz leer lassen und **Speichern** antippen: Es wird nicht gespeichert, es erscheint „Bitte schreib bei „Sonstiges“ kurz dazu, was war.“
- [x] Als Notiz „Test“ eintragen und **Speichern**: In der Karte steht jetzt „Sonstiges“ mit dem heutigen Datum und darunter „Test“.
- [x] Auf den Eintrag tippen (auf den Text, **nicht** auf das Kreuz): Das Fenster öffnet sich wieder mit „Sonstiges“ und „Test“. **Abbrechen**.
- [x] Jetzt das Kreuz rechts neben dem Eintrag antippen: Die Frage „Diesen Eintrag löschen?“ erscheint. Mit **OK** bestätigen: Der Eintrag ist weg.

Danach oben „Demo beenden“ antippen oder den Tab schließen.

Ergebnis 05.11.2026 (Opera, 0.34.2): alle 5 Punkte bestanden.

## K. Neu in 0.34.0: Freigabe ändern und löschen (Demo in Opera, deine echten Daten bleiben unberührt)

Bitte in der Demo testen, nicht in deiner echten App. Die Test-Freigabe in der echten App bleibt bis zum Tierarzttermin drin.

- [x] https://stefanpude.github.io/Kilossos/?demo öffnen → **Mehr** → unter „Tierarzt“ auf die Tafel „Freigabe vom Tierarzt“ tippen (dort stehen Ziel, kcal/Tag und BCS).
- [x] Das Fenster heißt „Freigabe für Kito ändern“. Oben steht der Hinweis „Nur für Fehler beim Eintragen …“, die Werte stehen schon drin, unten gibt es den roten Knopf **Freigabe löschen**.
- [x] **Freigabe löschen** antippen: Eine Frage erscheint („Freigabe vom … löschen? …“). Dort **Abbrechen** antippen, **nicht** OK: Das Fenster bleibt offen, nichts ist gelöscht.
- [x] Unten **Abbrechen** antippen, **nicht** Speichern: Das Fenster schließt, die Tafel sieht aus wie vorher.

Danach oben „Demo beenden“ antippen oder den Tab schließen.

Ergebnis 05.11.2026 (Opera, 0.34.2): alle 4 Punkte bestanden. Beim ersten Versuch hat Stefan den grünen Knopf
„Freigabe eintragen“ statt der Tafel angetippt (leeres Fenster, abgebrochen), siehe „Was mir auffällt“.

## L. Neu in 0.34.1 und 0.34.2: Zeile im PDF und Logo

- [x] 0.34.1 (Demo): https://stefanpude.github.io/Kilossos/?demo öffnen → **Mehr** → „Übersicht für den Tierarzt“ → „Übersicht öffnen“. Unter der Gewichtskurve stehen Punkte und Balken, darunter klein und grau „Streifen unter der Kurve: besondere Tage auf derselben Zeitachse …“. Nichts drucken, danach den Tab schließen.
- [x] 0.34.2 (privater Tab in Opera): https://stefanpude.github.io/Kilossos/ im privaten Tab öffnen. Das Bild von Kito oben ist ein Kasten mit runden Ecken, nicht mehr rund. Ohrspitze und Napf sind ganz zu sehen. Nichts eintragen, den privaten Tab schließen.

Ergebnis 05.11.2026 (Opera, 0.34.2): beide Punkte bestanden.

## Was mir auffällt

(Hier notieren, was komisch aussieht oder sich falsch anfühlt, am besten mit Screenshot.)

- **Man sieht der Freigabe-Tafel nicht an, dass man sie antippen kann** (05.11.2026, Teil K): Unter „Mehr“ hat Stefan
  zum Ändern den grünen Knopf „Freigabe eintragen“ genommen statt der Tafel mit den Zahlen. Die Tafel hat keinen
  sichtbaren Hinweis (kein Pfeil, kein „ändern“; das Wort steht nur für die Vorlesefunktion in `zeichneFreigabe`,
  `app.js`). Für später: sichtbarer Hinweis, z. B. „ändern“ oder ein Stift-Symbol. Stefan: „für später merken“.
- **Meldung „✓ Gespeichert“ leicht zu übersehen** (05.11.2026, Teil I): steht knapp 2 Sekunden (`zeigeToast`, 1800 ms).
  Kein Fehler; nur notiert, falls es öfter auffällt.

- **Aktualisieren springt immer auf „Heute“** (04.11.2026): Wer zum Beispiel unter „Mehr“ die Seite aktualisiert, landet wieder auf „Heute“, egal in welchem Bereich. Ursache: Die App merkt sich den offenen Bereich nicht (`zeigeAnsicht` in `app.js`; beim Laden ist nur „Heute“ sichtbar). Das trifft auch, wenn Android die App im Hintergrund beendet und beim Zurückkehren neu lädt. Plan: Bereich in `sessionStorage` merken und beim Aktualisieren wiederherstellen; ein frischer Start der App beginnt weiter auf „Heute“. **Behoben in 0.29.3.**
- **Pfeil neben dem Namen auf „Heute“ tut nichts** (04.11.2026): Neben „Kito“ steht ein Pfeil nach unten, Antippen bewirkt nichts. Der Pfeil soll nur bei mehr als einem Tier erscheinen (dann öffnet er das Menü zum Wechseln). `app.js` setzt bei einem Tier `hidden` und sperrt den Knopf, aber `styles.css` (`.tier-wechsel .pfeil { display: inline-block }`) hebt `hidden` auf. Plan: Regel `.tier-wechsel .pfeil[hidden] { display: none; }`, im Browser mit einem und mit zwei Tieren prüfen. **Behoben in 0.29.3.**
