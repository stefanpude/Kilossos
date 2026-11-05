# Handy-Test 0.26.0 bis 0.34.2

Nach dem Hochladen etwa 1 Minute warten. Dann die App einmal ganz schließen und neu öffnen.
Dann **Mehr** ganz nach unten scrollen: Die letzte Zeile (mit dem i-Zeichen) zeigt die Version, dort muss **Version 0.34.2** (oder neuer) stehen.
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

## H. Neu in 0.31.0: Gewicht ändern (Demo in Chrome, deine echten Daten bleiben unberührt)

- [ ] https://stefanpude.github.io/Kilossos/?demo öffnen → **Gewicht** → in der Liste auf eine Wägung tippen, und zwar auf Gewicht und Datum, **nicht** auf das Kreuz rechts. Das Fenster „Gewicht von Kito ändern“ öffnet sich, Gewicht und Datum stehen schon drin.
- [ ] Einmal auf „−10 g“ tippen, dann **Speichern**: In der Liste steht das neue Gewicht, und es ist keine zweite Wägung dazugekommen (die Zahl „… Wägungen“ über dem Monat bleibt gleich).
- [ ] Dieselbe Wägung noch einmal antippen, das Datum auf einen Tag im Vormonat stellen, **Speichern**: Der Vormonat klappt auf, die Wägung steht jetzt dort.
- [ ] Noch einmal antippen, etwas ändern und dann **Abbrechen**: Nichts ändert sich.
- [ ] Ganz unten auf „Gewicht eintragen“ tippen: Das Fenster heißt wie immer „Gewicht von Kito“, das Gewichtsfeld ist leer. **Abbrechen**.

Danach oben „Demo beenden“ antippen oder den Tab schließen.

## I. Neu in 0.32.0 und 0.32.1: kJ-Schutz und kcal-Rechner (Demo in Chrome, deine echten Daten bleiben unberührt)

- [ ] https://stefanpude.github.io/Kilossos/?demo öffnen → **Futter** → „Eigene Sorte anlegen“. Als Name „Test“ eintragen, bei „Art“ **Nassfutter** wählen.
- [ ] Bei „kcal pro 100 g“ **307** eintragen und auf eine freie Stelle tippen: Ein roter Kasten erscheint („307 kcal pro 100 g sind für Nassfutter viel zu viel.“) mit Knöpfen wie „Dort steht kJ“.
- [ ] Noch **nichts** im roten Kasten antippen, sondern unten **Speichern**: Es wird nicht gespeichert, es erscheint „Bitte zuerst die Frage im roten Kasten beantworten.“
- [ ] Im roten Kasten „Dort steht kJ“ antippen: Im Feld steht jetzt **73,4**, darunter „✓ 307 kJ umgerechnet: 73,4 kcal pro 100 g.“ Der rote Kasten ist weg.
- [ ] Weiter unten „Keine kcal auf der Packung?“ aufklappen und eintragen: Protein **7,9**, Fett **4,4**, Asche **1,4**, Faser **0,3**, Feuchte **84**. Es erscheint etwa 77 kcal und ein Knopf „77 kcal übernehmen“.
- [ ] „77 kcal übernehmen“ antippen: Oben im Feld steht 77, bei „Woher stammt der Wert?“ steht „Aus den Bestandteilen berechnet“.
- [ ] Oben im Feld 77 in **78** ändern und dann sofort **Speichern** antippen, ohne vorher woanders hinzutippen: Schon der **erste** Tipp speichert („✓ Gespeichert“), die Sorte „Test“ steht in der Liste.
- [ ] 0.32.1: Im Tab auf **Gewicht** gehen und die Seite aktualisieren (oben im Tab nach unten ziehen): Die Seite lädt neu und zeigt gleich **Gewicht**. „Heute“ darf dabei nicht kurz aufblitzen.

Danach oben „Demo beenden“ antippen oder den Tab schließen. Die Sorte „Test“ verschwindet mit der Demo.

## J. Neu in 0.33.0: Besonderer Tag (Demo in Chrome, deine echten Daten bleiben unberührt)

- [ ] https://stefanpude.github.io/Kilossos/?demo öffnen → **Heute** → in der Karte „Besonderer Tag“ auf „Besonderen Tag eintragen“ tippen. (Dort steht schon ein Eintrag der Demo, „Weniger Bewegung“; den und seinen Knopf „Beendet“ bitte nicht antippen.)
- [ ] Bei „Was war besonders?“ **Sonstiges** wählen, die Notiz leer lassen und **Speichern** antippen: Es wird nicht gespeichert, es erscheint „Bitte schreib bei „Sonstiges“ kurz dazu, was war.“
- [ ] Als Notiz „Test“ eintragen und **Speichern**: In der Karte steht jetzt „Sonstiges“ mit dem heutigen Datum und darunter „Test“.
- [ ] Auf den Eintrag tippen (auf den Text, **nicht** auf das Kreuz): Das Fenster öffnet sich wieder mit „Sonstiges“ und „Test“. **Abbrechen**.
- [ ] Jetzt das Kreuz rechts neben dem Eintrag antippen: Die Frage „Diesen Eintrag löschen?“ erscheint. Mit **OK** bestätigen: Der Eintrag ist weg.

Danach oben „Demo beenden“ antippen oder den Tab schließen.

## K. Neu in 0.34.0: Freigabe ändern und löschen (Demo in Chrome, deine echten Daten bleiben unberührt)

Bitte in der Demo testen, nicht in deiner echten App. Die Test-Freigabe in der echten App bleibt bis zum Tierarzttermin drin.

- [ ] https://stefanpude.github.io/Kilossos/?demo öffnen → **Mehr** → unter „Tierarzt“ auf die Tafel „Freigabe vom Tierarzt“ tippen (dort stehen Ziel, kcal/Tag und BCS).
- [ ] Das Fenster heißt „Freigabe für Kito ändern“. Oben steht der Hinweis „Nur für Fehler beim Eintragen …“, die Werte stehen schon drin, unten gibt es den roten Knopf **Freigabe löschen**.
- [ ] **Freigabe löschen** antippen: Eine Frage erscheint („Freigabe vom … löschen? …“). Dort **Abbrechen** antippen, **nicht** OK: Das Fenster bleibt offen, nichts ist gelöscht.
- [ ] Unten **Abbrechen** antippen, **nicht** Speichern: Das Fenster schließt, die Tafel sieht aus wie vorher.

Danach oben „Demo beenden“ antippen oder den Tab schließen.

## L. Neu in 0.34.1 und 0.34.2: Zeile im PDF und Logo

- [ ] 0.34.1 (Demo): https://stefanpude.github.io/Kilossos/?demo öffnen → **Mehr** → „Übersicht für den Tierarzt“ → „Übersicht öffnen“. Unter der Gewichtskurve stehen Punkte und Balken, darunter klein und grau „Streifen unter der Kurve: besondere Tage auf derselben Zeitachse …“. Nichts drucken, danach den Tab schließen.
- [ ] 0.34.2 (Inkognito-Tab in Chrome): https://stefanpude.github.io/Kilossos/ im Inkognito-Tab öffnen. Das Bild von Kito oben ist ein Kasten mit runden Ecken, nicht mehr rund. Ohrspitze und Napf sind ganz zu sehen. Nichts eintragen, den Inkognito-Tab schließen.

## Was mir auffällt

(Hier notieren, was komisch aussieht oder sich falsch anfühlt, am besten mit Screenshot.)

- **Aktualisieren springt immer auf „Heute“** (04.11.2026): Wer zum Beispiel unter „Mehr“ die Seite aktualisiert, landet wieder auf „Heute“, egal in welchem Bereich. Ursache: Die App merkt sich den offenen Bereich nicht (`zeigeAnsicht` in `app.js`; beim Laden ist nur „Heute“ sichtbar). Das trifft auch, wenn Android die App im Hintergrund beendet und beim Zurückkehren neu lädt. Plan: Bereich in `sessionStorage` merken und beim Aktualisieren wiederherstellen; ein frischer Start der App beginnt weiter auf „Heute“. **Behoben in 0.29.3.**
- **Pfeil neben dem Namen auf „Heute“ tut nichts** (04.11.2026): Neben „Kito“ steht ein Pfeil nach unten, Antippen bewirkt nichts. Der Pfeil soll nur bei mehr als einem Tier erscheinen (dann öffnet er das Menü zum Wechseln). `app.js` setzt bei einem Tier `hidden` und sperrt den Knopf, aber `styles.css` (`.tier-wechsel .pfeil { display: inline-block }`) hebt `hidden` auf. Plan: Regel `.tier-wechsel .pfeil[hidden] { display: none; }`, im Browser mit einem und mit zwei Tieren prüfen. **Behoben in 0.29.3.**
