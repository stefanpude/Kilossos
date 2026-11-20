# „Wie gestern“: Mahlzeiten vom Vortag übernehmen (Entwurf, 20.11.2026)

## Warum
Wer jeden Tag ähnlich füttert, tippt heute jede Mahlzeit komplett neu ein. Bei Kito und Zuki sind das je 5 Portionen
Nass- und 5 Portionen Trockenfutter, also rund 20 Einträge am Tag. Sorte und Menge sind zu etwa 80 % wie am Vortag,
die Uhrzeit nicht immer. Eingetragen wird teils direkt beim Füttern, teils abends gesammelt vom Zettel an der Wand.

## Ziel
Mahlzeiten des Vortags mit wenigen Tipps übernehmen, jede einzeln bestätigt.

## Nicht-Ziele
- Kein Kopieren eines ganzen Tags auf einmal (ein kopierter Tag sähe vollständig aus, auch wenn die Katze weniger
  gefressen hat; dann fehlte die Warnung „zu wenig gefressen“, die vor der Fettleber schützt).
- Kein Fütterungsplan, keine Erinnerung (eigene Karte auf der Ideen-Tafel, wartet auf den Termin am 26.11.).
- Keine Mengenvorschläge: Kilossos wiederholt nur, was der Halter selbst eingetragen hat.

## Ansätze
- **A, gewählt (Stefan, 20.11.):** Antippen einer Zeile öffnet das Fenster „Mahlzeit“ vorbelegt mit Sorte, Gramm und
  Uhrzeit; der Halter prüft und speichert. Zwei Tipps, dafür nichts Ungeprüftes in den Daten, Nachtragen klappt.
- B, verworfen: Antippen trägt sofort mit der Uhrzeit von jetzt ein. Ein Tipp, aber beim gesammelten Nachtragen
  stünde überall dieselbe Uhrzeit, die einzeln korrigiert werden müsste.
- C, verworfen: ganzen Tag kopieren (siehe Nicht-Ziele).

## So soll es sein
- Auf „Heute“ eine Karte „Wie gestern“ unter der Mahlzeitenliste. Sie zeigt die Mahlzeiten der Vorlage als Zeilen
  (Uhrzeit von gestern, Sorte, Gramm), im gleichen Aufbau wie die Mahlzeitenliste, aber zurückhaltender.
- **Vorlage** ist der letzte Tag vor dem gezeigten Tag mit mindestens einer Mahlzeit (nicht nur „gestern“, z. B. nach
  einem vergessenen Tag). Nur das gewählte Tier. Leckerlis kommen nicht in die Vorlage (sollen keine Gewohnheit
  werden). Tage mit dem besonderen Tag „Futter verweigert“ zählen nicht als Vorlage, dann der Tag davor.
- **Zeilen verschwinden**, sobald am gezeigten Tag eine Mahlzeit mit gleicher Sorte und gleicher Menge eingetragen
  ist, auch wenn sie von Hand eingetragen wurde (je eingetragener Mahlzeit fällt genau eine passende Zeile weg).
  Sind alle übernommen, verschwindet die Karte.
- **Antippen** öffnet „Mahlzeit für …“ als neue Mahlzeit mit Sorte und Gramm der Zeile. Uhrzeit wie heute schon:
  am heutigen Tag „jetzt“, an einem früheren Tag leer (Regel seit 0.54.0). Alles bleibt änderbar.
- Die Karte erscheint nicht, wenn es keine Vorlage gibt (erster Tag, nur Leckerlis).

## Rahmen
- Datenformat bleibt Version 1, es entstehen normale Mahlzeiten. Alte Sicherungen bleiben gültig.
- Die Logik (Vorlage finden, offene Zeilen bestimmen) kommt als reine Funktion in eine eigene Datei mit Tests
  (`npm test`), die Oberfläche in `app.js`/`index.html`/`styles.css`.
- Tippflächen mindestens 48 px (Skill `mobile-design`), Prüfung im Browser bei 375 px.
- `CACHE_NAME` in `sw.js` hochzählen, neue Datei in `DATEIEN`.

## Dem Bauenden überlassen
Genaue Überschrift und Hinweistext der Karte, ob sie aufklappbar ist, Platz zwischen Mahlzeitenliste und
„Besonderer Tag“.

## Möglicher nächster Schritt (nicht jetzt)
Mahlzeiten mit gleicher Uhrzeit (Nass + Trocken) als Paar mit einem Tipp übernehmen; das braucht ein Fenster für zwei
Sorten.
