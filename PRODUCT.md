# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

Installierbare Web-App (PWA), gehostet über GitHub Pages. Später für Google Play verpackt (Android zuerst, iPhone später); die Gestaltung bleibt dabei Web, nicht nativ.

## Users

**Hauptnutzer:** Katzenhalterinnen und Katzenhalter in Deutschland mit einer übergewichtigen Katze. Meist ohne Technik- und ohne Ernährungswissen. Sie nutzen die App täglich am Napf: Futter auf der Küchenwaage abwiegen, Gramm je Sorte eintragen, einmal pro Woche die Katze wiegen. Das Handy ist dabei oft nur in einer Hand, die andere hält Beutel, Napf oder Katze.

**Zweite Lesergruppe:** die Tierarztpraxis. Sie nutzt die App nicht selbst, sondern liest die PDF-Übersicht, die der Halter zum Termin mitbringt, und gibt Zielgewicht und Tageskalorien frei.

Bis zur Store-Fassung ist der Entwickler selbst mit den eigenen zwei Katzen der tägliche Testnutzer.

## Product Purpose

Kilossos begleitet eine medizinisch korrekte, kontrollierte Abnahme einer übergewichtigen Katze. Katzen bekommen bei zu wenig Futter leicht eine Fettleber (hepatische Lipidose), deshalb geht es um sicheres Tempo, nicht um schnelles Abnehmen.

Die App erfasst Gewicht, Mahlzeiten in Gramm und kcal, Leckerlis und den Verlauf, warnt bei unsicherem Tempo oder zu wenig Futter und erstellt eine Übersicht für die Praxis.

Erfolg heißt: Die Katze nimmt über Wochen sicher ab (0,5 bis 2 % Körpergewicht pro Woche), der Halter bleibt dabei, und die Praxis bekommt saubere Daten statt Schätzungen.

## Positioning

**Die Tierarztpraxis entscheidet, die App begleitet.** Ohne tierärztliche Freigabe zeichnet Kilossos nur auf und macht keine Diät- oder Mengenvorschläge. Erst wenn Zielgewicht und Tageskalorien von der Praxis eingetragen sind, rechnet die App einen Abnahmeplan mit Sicherheitsgrenzen. Die App ersetzt nie die Praxis, sie liefert ihr die Daten.

## Operating Context

- Täglich in der Küche am Napf, mit Küchenwaage; meist morgens und abends, oft unter Zeitdruck oder mit drängelnder Katze.
- Wöchentliches Wiegen: gleicher Tag, gleiche Uhrzeit, gleiche Waage.
- Tierarzttermin: PDF-Übersicht für die Tierarztpraxis, ausgedruckt oder am Handy gezeigt.
- Mehrere Katzen im Haushalt werden getrennt gefüttert und getrennt erfasst.
- Wettbewerb im Play Store: MeowFit (Cat Weight Tracker), Cat Weight Kit, Pet Weight Tracker.

## Capabilities and Constraints

- Mehrere Tiere, Gewichtsverlauf, Futterliste, tägliche Gramm und kcal, Abnahmeplan mit Sicherheitsgrenzen nach Freigabe, PDF-Export, Willkommensseite, Wissensseiten.
- Feste Sicherheitsgrenzen mit Quelle (WSAVA/AAHA): Abnahme 0,5 bis 2 % pro Woche, Warnung über 2 %; Warnung unter der freigegebenen Tagesmenge, ohne Freigabe RER beim Zielgewicht als Untergrenze. Leckerlis zählen mit, Warnung ab 10 % der Tageskalorien.
- Geprüfte Futterliste: jede Sorte mit Quelle, Datum und Status (Herstellerangabe, berechnet, geschätzt). Bei Abweichung gilt die Packung.
- Daten nur auf dem Gerät (localStorage), kein Konto, keine Cloud, kein Tracking. Sicherung per Export mit Erinnerung.
- Dauerhaft kostenlos, keine Werbung, kein Abo, kein Plus.
- Start nur in Deutschland, nur auf Deutsch.
- Technik: reines HTML/CSS/JavaScript ohne Framework und ohne Build-Schritt; offline über Service Worker. Bei Änderungen an App-Dateien `CACHE_NAME` in `sw.js` hochzählen.
- Repository ist öffentlich: keine Namen von Praxen oder Personen, keine Adressen, keine privaten E-Mails in App, Code oder Doku.
- Offen: Store-Fassung, eigene Domain, Impressum-Service, weitere Sprachen, Hunde, Futtervorschläge.

## Brand Commitments

- **Name:** Kilossos, aus *Kito* und *Kolossos* (altgriechisch „riesig“). Englisch *loss* wird nicht als Herleitung genannt.
- **Logo:** basiert auf einem eigenen Bild von Kito am Napf.
- **Geschichte:** „aus eigener Not entstanden“; Kito und Zuki tragen Willkommensseite, „Wie Kilossos entstanden ist“ und später den Store-Eintrag. Echte Fotos in `bilder/`.
- **Ansprache:** Du. Einfache, ruhige Sprache ohne Fachjargon; Fachbegriffe werden erklärt.
- **Neutrale Sprache zur Praxis:** abwechselnd „Tierarztpraxis“, „Praxis“, „tierärztlich“; in der direkten Anrede ist „deiner Tierärztin oder deinem Tierarzt“ erlaubt. Nie „der Tierarzt“ allein.
- **Notfallsatz** bleibt wortgleich: „… gehört sie sofort in die Tierarztpraxis.“
- **Schreibregeln für Texte:** richtige Umlaute (ä, ö, ü, ß), keine Gedankenstriche als Satzzeichen (Em-Dash).
- **Schriften:** Atkinson Hyperlegible Next und Literata liegen lokal in `fonts/` (OFL). Der bestehende Look wird in einer eigenen DESIGN.md festgehalten, nicht hier.

## Evidence on Hand

- Echte Fotos von Kito und Zuki: `bilder/kito.webp`, `bilder/zuki.webp`; Logo-Quellen privat in `logo-quelle/` (nicht auf GitHub).
- Echte Gewichts- und Futterdaten aus dem täglichen Live-Test seit November 2026, nur auf dem Gerät des Entwicklers.
- Futterrecherche mit Quellen: `docs/futter-recherche.md`.
- Demo-Daten über ein Jahr: `demo/`.
- Es gibt noch **keine** Erfolgsgeschichte (Vorher/Nachher), keine Testimonials, keine Store-Bewertungen und keine tierärztliche Bestätigung der App. Nichts davon erfinden. Veröffentlichung erst nach mindestens 8 Wochen sicherer Abnahme ab tierärztlicher Freigabe.

## Product Principles

1. **Sicherheit vor Tempo.** Jede Funktion, die das Abnehmen beschleunigen könnte, muss die Fettleber-Grenze respektieren. Warnungen sind klar, aber nicht panisch.
2. **Die Praxis entscheidet.** Ohne Freigabe nur aufzeichnen; Zielgewicht und Tagesmenge kommen ausschließlich aus der Freigabe.
3. **Belegt oder markiert.** Jede Zahl (Grenzwert, kcal einer Sorte) hat eine Quelle oder ist sichtbar als berechnet oder geschätzt gekennzeichnet.
4. **Schnell am Napf.** Der tägliche Eintrag muss mit einer Hand und in Sekunden gehen.
5. **Privat und kostenlos.** Keine Daten verlassen das Gerät, nichts kostet Geld, nichts lenkt mit Werbung ab.

## Accessibility & Inclusion

WCAG 2.2 AA als Standard: ausreichende Kontraste in Hell und Dunkel, Tippflächen ab 48 px, gut lesbare Schrift, keine Information nur über Farbe (Warnungen auch als Text).
