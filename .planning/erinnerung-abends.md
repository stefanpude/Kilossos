# Erinnerung am Abend, wenn nichts eingetragen wurde

Stand: 05.11.2026. Wunsch des Halters: eine Erinnerung am Ende des Tages, wenn für die Katze noch nichts eingetragen ist.
**Entschieden am 05.11.2026 („Ja, so“): Teil 1 und 2 werden nach dem Tierarzttermin am 13.11.2026 gebaut,
Teil 3 nicht jetzt.** Vor dem Bau: Plan mit `superpowers:writing-plans`, dann TDD. Die genauen Texte vorher
noch einmal dem Halter zeigen.

## Warum

Vergessene Einträge sind der häufigste Grund für falsche Tageswerte. Für Kilossos sieht ein leerer Tag genauso aus wie
ein Tag, an dem die Katze nichts gefressen hat. Seit 0.36.2 steht am Morgen danach oben auf „Heute“ der rote Hinweis
„Für gestern ist keine Mahlzeit eingetragen. Hat … normal gefressen? …“. Er ist wichtig, erschreckt aber, wenn nur das
Eintragen vergessen wurde.

## Teil 1: ruhiger Hinweis am Abend in der App

- **Wann:** Kilossos wird am Abend geöffnet (Vorschlag: ab 19 Uhr, beim Bau mit dem Halter festlegen), für das gewählte
  Tier ist heute noch keine Mahlzeit eingetragen, und es gab schon an früheren Tagen Einträge (nicht am ersten Tag der
  Nutzung).
- **Wie:** ruhiger Hinweis auf „Heute“ (Art „hinweis“, nicht rot, nicht bernsteinfarben), z. B. „Heute ist noch keine
  Mahlzeit eingetragen.“ mit Knopf „Mahlzeit eintragen“.
- **Verschwindet**, sobald eine Mahlzeit für heute eingetragen ist.
- **Bleibt die App offen** und es wird 19 Uhr, soll der Hinweis beim Zurückholen der App erscheinen. Achtung: Der
  `visibilitychange`-Handler in `app.js` zeichnet heute nur beim Tageswechsel neu; er muss zusätzlich neu zeichnen,
  wenn seit dem letzten Zeichnen die Abend-Grenze überschritten wurde (nicht bei offenem Fenster). Eine Uhr im
  Hintergrund ist nicht nötig.
- **Rechnung als reine Funktion** (z. B. in `js/rechnen.js`), damit sie testbar ist: Eingaben Uhrzeit, Mahlzeiten heute,
  frühere Mahlzeiten; Ergebnis Hinweis oder `null`. Tests für 18:59 / 19:00, mit und ohne Mahlzeit heute, erster Tag.
- **Mehrere Tiere:** gilt für das Tier, das oben auf „Heute“ gewählt ist.

## Teil 2: roter Hinweis am Morgen nennt beide Fälle

- Heute fragt der Hinweis nur „Hat … normal gefressen?“. Neu soll er zuerst an das vergessene Eintragen erinnern und
  dann, unverändert deutlich, an die Gefahr. Entwurf für den Fall „keine Mahlzeit eingetragen“:
  „Für gestern ist keine Mahlzeit eingetragen. Nur vergessen? Dann bitte nachtragen. Hat … wirklich nichts oder kaum
  etwas gefressen: am selben Tag den Tierarzt anrufen, Gefahr einer Fettleber.“
- **Darf nicht passieren:** Der Hinweis wird leiser. Er bleibt rot („sofort“), die Aussage zum Tierarzt und zur
  Fettleber bleibt vollständig, die Grenzen (unter der Hälfte der Tagesmenge, 0 kcal ohne Freigabe) ändern sich nicht.
- Offen beim Bau: ob der Fall „nur wenige kcal eingetragen“ denselben Zusatz bekommt (auch dort kann ein Eintrag
  fehlen), und ob ein Knopf „Gestern nachtragen“ direkt zum Vortag springt.
- Tests in `tests/grenzen.test.js` (Block „gesternWenigGefressen“) anpassen: Text-Muster und dass die Gefahrenaussage
  erhalten bleibt.

## Teil 3: echte Benachrichtigung am Handy (nicht jetzt)

Eine Web-App kann ohne Server keine zuverlässige Benachrichtigung zu einer festen Uhrzeit senden. Die geplante
Play-Store-Fassung mit Bubblewrap bräuchte dafür einen Push-Server; das widerspricht „kein Server, keine Cloud“.
Ohne Server ginge es nur mit einer anderen Verpackung (z. B. Capacitor mit lokalen Benachrichtigungen).
**Entscheidung beim Verpacken für Google Play** (`.planning/verpacken-google-play.md`).

## Bis dahin

Täglicher Wecker in der Uhr-App des Handys (z. B. 20 Uhr, Name „Kilossos eintragen“).

## Regel-Check

- Keine Futtermengen, keine neuen Grenzwerte; Teil 2 ändert nur einen Text, nicht die Schwellen.
- Daten bleiben auf dem Gerät, kein Server.
- Erinnerungen nerven schnell: nur ein Hinweis pro Tag, ruhig, verschwindet von selbst.
