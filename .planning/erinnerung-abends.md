# Erinnerung am Abend, wenn nichts eingetragen wurde

Stand: 05.11.2026. Wunsch des Halters: eine Erinnerung am Ende des Tages, wenn für die Katze noch nichts eingetragen ist.
**Entschieden am 05.11.2026: Teil 1 und 2 werden nach dem Tierarzttermin am 13.11.2026 gebaut. Teil 3, die echte
Benachrichtigung um 20 Uhr, kommt mit der Play-Store-App; dafür wird mit Capacitor statt Bubblewrap verpackt.**
Vor dem Bau: Plan mit `superpowers:writing-plans`, dann TDD. Die genauen Texte vorher noch einmal dem Halter zeigen.

## Warum

Vergessene Einträge sind der häufigste Grund für falsche Tageswerte. Für Kilossos sieht ein leerer Tag genauso aus wie
ein Tag, an dem die Katze nichts gefressen hat. Seit 0.36.2 steht am Morgen danach oben auf „Heute“ der rote Hinweis
„Für gestern ist keine Mahlzeit eingetragen. Hat … normal gefressen? …“. Er ist wichtig, erschreckt aber, wenn nur das
Eintragen vergessen wurde.

## Teil 1: ruhiger Hinweis am Abend in der App

**✅ Gebaut in 0.50.0 (06.11.2026, vorgezogen vor den Tierarzttermin):** ab 19 Uhr (`ABEND_STUNDE`), reine Funktion
`abendHinweis` in `js/rechnen.js`, Tests `tests/abend.test.js`. Text: „Für … ist heute noch keine Mahlzeit eingetragen.
Schon gefüttert? Dann trag es jetzt ein, damit der Tag vollständig ist.“ Kurztitel „Heute noch nichts eingetragen“,
Knopf „Mahlzeit eintragen“. Ein Leckerli allein zählt nicht als Mahlzeit. Nicht, wenn „Futter verweigert“ den roten
Notfall-Kasten zeigt. Teil 2 (roter Morgentext) ist unverändert und braucht vor dem Bau das Ja des Halters.

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

**✅ Gebaut in 0.50.1 (06.11.2026, Wortlaut vom Halter freigegeben):** Gilt für den Fall „keine Mahlzeit eingetragen“,
auf „Heute“ für gestern und beim Zurückblättern („Für diesen Tag …“). Der Fall „nur wenige kcal eingetragen“ behält
den bisherigen Text (dort ist etwas eingetragen). Kein Knopf „Gestern nachtragen“ (Zurückblättern mit dem Pfeil reicht).
Bleibt rot, Grenzen unverändert; Tests in `tests/grenzen.test.js`.

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

## Teil 3: echte Benachrichtigung am Handy, mit der Play-Store-App

**Entschieden am 05.11.2026:** Die Erinnerung soll eine Funktion der App sein, nicht ein Wecker. Sie kommt mit der
Play-Store-App. Dafür wird mit **Capacitor** statt Bubblewrap verpackt (`.planning/verpacken-google-play.md` wird vor
dem Verpacken neu geschrieben).

**Warum Capacitor:** Eine Web-App (auch in Opera oder als Bubblewrap-App) kann ohne Server keine Benachrichtigung zu
einer festen Uhrzeit senden; Zeitplan-Benachrichtigungen für Web-Apps hat Google wieder eingestellt. Capacitor bringt
lokale Benachrichtigungen mit (`@capacitor/local-notifications`): Die App plant sie selbst, kein Server, Daten bleiben
auf dem Gerät. Später geht das auch auf dem iPhone.

**So soll es sich verhalten:**
- Freiwillig: Schalter „Erinnerung am Abend“ unter „Mehr“, Uhrzeit wählbar, Vorschlag 20:00. Die Erlaubnis für
  Benachrichtigungen (Android 13 und neuer) wird erst beim Einschalten erfragt, nicht beim ersten Start.
- Ist für ein Tier heute schon eine Mahlzeit eingetragen, kommt für dieses Tier heute keine Erinnerung.
  Text z. B. „Für Mia ist heute noch nichts eingetragen.“ Keine Gesundheitsaussage in der Benachrichtigung.
- Antippen öffnet Kilossos auf „Heute“.

**Für den Bau notiert (Vorschläge, beim Bau prüfen):**
- Eine tägliche Wiederholung kann keinen einzelnen Tag auslassen. Deshalb Erinnerungen einzeln für die nächsten Tage
  planen (z. B. 14), beim Eintragen die von heute streichen, beim Öffnen der App auffüllen. Wird die App länger nicht
  geöffnet, hören die Erinnerungen nach diesen Tagen auf.
- Mehrere Tiere: eine Benachrichtigung, die alle Tiere ohne Eintrag nennt, statt einer je Tier.
- Ungefähre Uhrzeit reicht: `isExactNotification: false` setzen. Sonst öffnet Capacitor (ab Version 8.3) auf
  Android 12 und neuer die Einstellung „Wecker und Erinnerungen“; einige Minuten Verspätung sind in Ordnung.
  Quelle: https://capacitorjs.com/docs/apis/local-notifications (abgerufen 05.11.2026).

**Folgen, die beim Verpacken bedacht werden müssen:**
- Mit Capacitor stecken die App-Dateien in der App. Jede neue Version muss durch die Prüfung bei Google Play
  (Stunden bis Tage), statt wie bei der Webseite in etwa einer Minute online zu sein.
- Die Play-Store-App hat ihren eigenen Speicher. Wer vorher die Webseite genutzt hat, zieht mit „Sicherung speichern“
  und „Sicherung einlesen“ um.
- Die Webseite läuft für die Browser-Fassung weiter; dort gibt es nur Teil 1.

**Bedacht und verworfen:** eigener Server, der jeden Abend eine Push-Nachricht schickt. Er würde auch in der
Browser-Fassung gehen und Bubblewrap erlauben. Aber Browser verlangen bei jeder Push-Nachricht eine sichtbare Meldung,
also müsste der Server wissen, ob an einem Tag etwas eingetragen wurde, oder die Erinnerung käme jeden Abend.
Außerdem widerspricht das „Diese Daten verlassen dein Gerät nicht“ in der Datenschutzerklärung, die Nachrichten laufen
über den Push-Dienst des Browser-Herstellers, und der Server muss dauerhaft sicher betrieben werden.

## Bis dahin

Teil 1 in der App. Wer mag, stellt sich zusätzlich einen täglichen Wecker in der Uhr-App des Handys.

## Regel-Check

- Keine Futtermengen, keine neuen Grenzwerte; Teil 2 ändert nur einen Text, nicht die Schwellen.
- Daten bleiben auf dem Gerät, kein Server.
- Erinnerungen nerven schnell: nur ein Hinweis pro Tag, ruhig, verschwindet von selbst.
