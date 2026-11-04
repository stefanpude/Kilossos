# kJ-Schutz und kcal-Rechner im Fenster „Eigene Sorte“ (geplant für 0.32.0)

_Version verschoben am 04.11.2026: 0.31.0 wurde „Gewicht ändern“ (`.planning/gewicht-aendern.md`), dieser Bau wird 0.32.0 mit Cache v58._

_Angelegt 04.11.2026 nach einem kurzen Brainstorming mit Stefan. Von Stefan freigegeben am 04.11.2026 („Ja, freigeben“).
Als Nächstes: Skill `migration` für das neue Feld, dann Umsetzungsplan mit `superpowers:writing-plans`.
Ideen-Tafel: `kcal-rechner-eigene-sorte` (geplant) und die kJ-Lücke aus dem Review vom 04.11.2026.
Klickbare Entwürfe (nur lokal, nicht auf GitHub): `.superpowers/brainstorm/842-1793827540/content/kj-hinweis-v2.html`
und `kcal-rechner-v2.html`._

## Warum

**Die Lücke.** Im Fenster „Eigene Sorte“ (`dialog-futter`) prüft Kilossos beim Speichern nur, ob der Wert zwischen 20 und
700 kcal pro 100 g liegt (`app.js`, `beimSpeichern("form-futter", …)`). Bei Nassfutter rutschen zwei Verwechslungen
still durch:

- **kJ statt kcal:** Die Nassfutter der Kilossos-Futterliste haben umgerechnet 254 bis 527 kJ pro 100 g. Echtes Beispiel:
  Bei Bozita Sterilised Häppchen in Sauce mit viel Huhn nennt fressnapf.de „307 kJ/100 g“, das sind 73,4 kcal. Wer 307 einträgt,
  besteht die Prüfung.
- **kcal pro kg statt pro 100 g:** Energiearmes Nassfutter hat 607 bis 700 kcal pro kg (zum Beispiel Royal Canin Satiety
  nass: 607). Auch das besteht die Prüfung.

Kilossos rechnet dann mit 4,2- bzw. 10-mal zu vielen kcal. Der Halter glaubt, die freigegebene Tagesmenge sei erreicht, und
füttert weniger. Die Warnung „unter der Tagesmenge“ schlägt nicht an, weil die App zu viele kcal zählt. Das ist genau die
Gefahr, vor der Kilossos schützen soll: zu wenig Futter, Fettleber.

Bei Trockenfutter und Leckerlis ist der kJ-Wert immer über 1.000 (ab etwa 1.270) und wird heute schon abgelehnt. Die
Fehlermeldung erklärt aber nicht, warum.

**Der Rechner.** Bei normalem Futter ist die kcal-Angabe freiwillig (VO (EG) 767/2009), viele Packungen nennen keine,
zum Beispiel Sheba Fresh & Fine und Purina One Light. Die Formel dafür gibt es schon: `kcalAusBestandteilen` in
`js/rechnen.js` (NRC 2006), mit Tests und in der Futterliste geprüft.

**Stefan, 04.11.2026:** „Da müssen wir einen klaren Hinweis einbauen, damit sowas auf gar keinen Fall passieren kann.
Vielleicht auch mit so einem aufploppenden, rot markierten Hinweisfeld.“

## Ziele

1. Ein Wert, der für die gewählte Art nicht passen kann, wird nie mehr still gespeichert. Kilossos fragt in einem roten
   Kasten nach der Einheit auf der Packung und rechnet auf einen Tipp richtig um.
2. Wer keine kcal auf der Packung findet, kann sie aus den Analytischen Bestandteilen berechnen lassen. Das Ergebnis ist
   sichtbar als geschätzt gekennzeichnet.
3. Keine Fehlalarme bei den Sorten der Kilossos-Futterliste.

## Nicht-Ziele

- **Zu niedrige Werte**, zum Beispiel kcal pro Beutel statt pro 100 g. Die Katze bekommt dann eher zu viel, das zeigt sich
  beim Wiegen. Keine Fettleber-Gefahr.
- **Leckerli-Cremes mit wenig Energie** (etwa 40 bis 80 kcal pro 100 g): Ihr kJ-Wert sieht aus wie ein normaler
  Snack-Wert. Keine Grenze kann das erkennen; hier hilft nur der feste Satz unter dem Feld.
- **Andere Felder mit kcal**, etwa die Tagesmenge in der Freigabe vom Tierarzt. Bleibt wie es ist.
- **Packungsfoto auslesen.** Verworfen zugunsten des Rechners (Ideen-Tafel), kann später dazukommen.
- **Analysewerte für Kopien aus der Futterliste.** Die stehen dort schon in der Notiz.

## Anti-Ziele (wäre ein Fehlschlag, auch wenn es technisch läuft)

- Kilossos schlägt eine Futtermenge vor. Nie, auch nicht im Rechner.
- Fehlalarm bei einer Sorte der eigenen Futterliste.
- Die Rückfrage läuft über `confirm()`. Das wird in manchen Browsern unterdrückt (Claude-Vorschau, Häkchen „keine weiteren
  Dialoge“); siehe Karte `eigene-rueckfrage`.
- Ein Rechner-Ergebnis erscheint ohne den Hinweis „geschätzt“.
- Getippte Rechner-Werte gehen still verloren.

## Entscheidungen

Von Stefan:

- **Variante A „Nachfragen und umrechnen“** (gewählt im Entwurf, 04.11.2026): roter Kasten im Fenster, drei Antworten,
  Speichern erst nach einer Antwort. Abgelehnt: B (Häkchen setzt man ungelesen, umrechnen muss man selbst) und C (Sperre
  ohne Ausnahme; echtes rohes Fleisch mit rund 200 kcal ließe sich nicht eintragen).
- **Rechner** (Ideen-Tafel, 04.11.2026): Bereich „Keine kcal auf der Packung?“, fünf Werte in %, Formel NRC 2006 wie in der
  Futterliste, Trockenfutter ohne Feuchte mit 8 % (`FEUCHTE_TROCKEN_ANNAHME`), Quelle „Aus den Bestandteilen berechnet“,
  zusammen höchstens 100 %, Ergebnis vor dem Speichern zeigen.

Von Claude vorgeschlagen, von Stefan mit „Passt“ bestätigt (04.11.2026):

- Grenzen: Nassfutter über 150, Trockenfutter und Leckerli über 450 kcal pro 100 g lösen die Rückfrage aus.
- Über 700 gibt es keinen Knopf „stimmt so“, nur die Umrechnungen.
- Nach „stimmt so“ fragt Kilossos beim nächsten Ändern der Sorte wieder (lieber einmal zu oft).
- Die fünf Analysewerte bleiben an der Sorte gespeichert und stehen beim Ändern wieder im Rechner.

## Verhalten im Detail

### A. Prüfung des kcal-Werts und roter Kasten

**Stufen** (reine Funktion, testbar ohne Browser):

| Wert (kcal pro 100 g) | Nassfutter | Trockenfutter, Leckerli |
|---|---|---|
| fehlt, keine Zahl, unter 20 | Fehler wie heute | Fehler wie heute |
| 20 bis 150 | in Ordnung | in Ordnung |
| über 150 bis 450 | Rückfrage | in Ordnung |
| über 450 bis 700 | Rückfrage | Rückfrage |
| über 700 | unmöglich | unmöglich |

- Grenzwerte als Konstanten neben `GRENZEN` bzw. in `js/rechnen.js`: Nass 150, Trocken 450, Leckerli 450, höchstens 700,
  mindestens 20. Ein Wert genau auf der Grenze ist in Ordnung.
- Begründung: Höchstwerte der Futterliste Nass 126, Trocken 396, Leckerli 438. Kleinster kJ-Wert bei Nassfutter 254,
  kleinster kcal-pro-kg-Wert 607: beide liegen über 150.
- Ist noch keine Art gewählt, wird nicht geprüft (beim Speichern greift „Bitte die Art wählen.“).

**Umrechnungen** im Kasten:

- „Dort steht kJ“: Wert ÷ 4,184, auf eine Nachkommastelle gerundet (307 → 73,4; 1370 → 327,4).
- „Dort steht kcal pro kg“: Wert ÷ 10, eine Nachkommastelle (607 → 60,7; 1370 → 137).
- Ein Knopf erscheint nur, wenn sein Ergebnis zwischen 20 und 700 liegt (Beispiel Nass 160: nur kJ, denn 16 wäre zu wenig).
- Gibt es keine gültige Umrechnung und ist der Wert unmöglich, steht nur: „Diese Zahl passt zu keiner Einheit. Bitte
  vergleiche sie mit der Packung.“

**Wann der Kasten erscheint:** beim Verlassen des kcal-Felds (`change`), beim Ändern der Art und beim Tippen auf
„Speichern“. Nicht bei jedem Tastendruck. Wird der Wert passend, verschwindet der Kasten.

**Aussehen:** roter Kasten wie die Warnungen der Stufe „Sofort“ auf „Heute“ (`.warnung` und `.warnung-sofort`), direkt
unter dem festen Satz zum Feld und über „Woher stammt der Wert?“. Kurzes Aufploppen (Einblenden mit leichter Bewegung,
höchstens 0,4 s, bei `prefers-reduced-motion` ohne Bewegung). Das Feld bekommt einen roten Rand und `aria-invalid="true"`;
der Kasten hat `role="alert"` und ist mit `aria-describedby` am Feld verknüpft. Antworten als Knöpfe mit mindestens 48 px
Höhe, alle gleich gestaltet (keine Antwort hervorgehoben, damit niemand zur falschen Umrechnung gelenkt wird).

**Antworten:**

- „Dort steht kJ“ / „Dort steht kcal pro kg“: Das Feld bekommt den umgerechneten Wert (mit Komma), der Kasten verschwindet,
  darunter erscheint kurz „✓ 307 kJ umgerechnet: 73,4 kcal pro 100 g.“ (`aria-live`). Die Auswahl bei „Woher stammt der
  Wert?“ bleibt, denn die Umrechnung ist genau.
- „Dort steht kcal pro 100 g“ (nur bei Rückfrage, nicht bei „unmöglich“): Kilossos merkt sich die Bestätigung für genau
  diesen Wert und diese Art, nur solange das Fenster offen ist (nichts wird gespeichert). Statt des roten Kastens steht dann
  ruhig: „Bestätigt: 307 kcal pro 100 g stehen so auf der Packung.“ Ändert sich Wert oder Art, gilt die Bestätigung nicht mehr.

**Speichern:** Steht eine Rückfrage offen oder ist der Wert unmöglich, speichert Kilossos nicht. Unter den Knöpfen steht
„Bitte zuerst die Frage im roten Kasten beantworten.“ (`futter-fehler`), der Fokus springt zur ersten Antwort.
Das gilt auch beim Ändern einer vorhandenen Sorte.

**Werte aus dem Rechner:** Hat „übernehmen“ den Wert eingetragen und wurde das Feld danach nicht geändert, entfällt die
Einheiten-Frage (die Einheit kann dann nicht falsch sein). Für ungewöhnlich hohe Ergebnisse gibt es einen eigenen Hinweis
im Rechner (siehe B).

**Fester Satz unter dem Feld** (immer sichtbar): „Bitte die kcal-Zahl eintragen, nicht kJ.“

### B. Rechner „Keine kcal auf der Packung?“

**Ort:** im Fenster „Eigene Sorte“ direkt unter dem festen Satz zum kcal-Feld, als aufklappbarer Bereich im Stil der
vorhandenen Aufklapp-Karten. Zugeklappt, wenn die Sorte keine gespeicherten Analysewerte hat; aufgeklappt mit den Werten,
wenn sie welche hat. Der Zustand wird nicht über `merkeZustand` gemerkt. Kopfzeile „Keine kcal auf der Packung?“,
darunter klein „Aus den Analytischen Bestandteilen berechnen“.

**Inhalt:** Satz „Tippe die Prozentwerte von der Packung ab. Du findest sie unter „Analytische Bestandteile“.“ Fünf Felder
in zwei Spalten, jedes mit „%“ dahinter, `inputmode="decimal"`, Komma und Punkt erlaubt (`leseZahl`):

| Feld | Kleiner Hinweis | Pflicht |
|---|---|---|
| Protein | oft „Rohprotein“ | ja |
| Fett | oft „Fettgehalt“ | ja |
| Asche | oft „Rohasche“ | ja |
| Faser | oft „Rohfaser“ | ja |
| Feuchte | oft „Feuchtigkeit“ | bei Nassfutter ja, sonst nein |

**Rechnen:** bei jeder Eingabe neu (`aria-live="polite"` für das Ergebnis). Reine Prüffunktion, testbar ohne Browser:

- Ein Pflichtfeld leer: ruhiger Satz „Noch leer: Protein, Fett.“ (kein Ergebnis).
- Ein Feld mit etwas, das keine Zahl ist (zum Beispiel „< 0,5“): „Bitte nur die Zahl eintragen.“
- Nassfutter ohne Feuchte: roter Kasten „Bei Nassfutter steht die Feuchte immer auf der Packung. Bitte trag sie ein, ohne
  sie stimmt die Rechnung nicht.“
- Trockenfutter oder Leckerli ohne Feuchte: Kilossos rechnet mit 8 % und sagt es im Ergebnis: „Die Feuchte steht nicht auf
  der Packung. Das ist erlaubt, wenn sie unter 14 % liegt. Kilossos nimmt deshalb 8 % an.“
- Zusammen über 100 % (mit angenommener Feuchte) oder Feuchte 100: roter Kasten „Zusammen sind das 169,1 %, mehr als 100 %
  geht nicht. Steht bei einem Wert das Komma an der falschen Stelle? Vergleiche die Zahlen bitte mit der Packung.“
- Sonst Ergebnis, gerundet auf ganze kcal wie in der Futterliste: „etwa 77 kcal pro 100 g“, darunter „Geschätzt: Die
  Rechnung kann bis etwa 10 % vom echten Wert abweichen. Nennt der Hersteller einen Wert, zum Beispiel auf seiner Website,
  nimm lieber den.“ Knopf „77 kcal übernehmen“.
- Liegt das Ergebnis über der Grenze der gewählten Art (Nass 150, sonst 450), steht zusätzlich ruhig: „Das ist viel für
  Nassfutter. Stimmen Feuchte und Fett?“ Übernehmen bleibt möglich (zum Beispiel rohes Fleisch).

**„übernehmen“:** trägt die Zahl ins kcal-Feld ein, stellt „Woher stammt der Wert?“ auf „Aus den Bestandteilen berechnet“
(`geschaetzt`), entfernt einen roten Kasten und zeigt „✓ 77 kcal eingetragen, Quelle „Aus den Bestandteilen berechnet“.“
Auf „Heute“ und im Verlauf steht wie bisher „ca.“ vor den kcal, weil die Quelle nicht genau ist (`tagesSumme`).

**Speichern der Analysewerte:**

- Alle Pflichtfelder gültig und Prüfung bestanden: Die Werte werden an der Sorte gespeichert, auch wenn die kcal von woanders
  stammen (die Packungswerte stimmen trotzdem).
- Alle fünf Felder leer: keine Analysewerte; vorhandene werden entfernt.
- Teilweise ausgefüllt oder fehlerhaft: Kilossos speichert nicht und schreibt „Im Rechner fehlen noch Werte oder einer
  stimmt nicht. Ergänze sie oder leere die Felder.“ So geht nichts still verloren.
- Das kcal-Feld ist leer, der Rechner zeigt aber ein Ergebnis: Kilossos speichert nicht und schreibt „Tippe im Rechner auf
  „77 kcal übernehmen“ oder trag den Wert oben ein.“

### C. Datenformat (Skill `migration` vor dem Bau)

- Neues freiwilliges Feld an eigenen Sorten: `futter[i].analyse = { protein, fett, asche, faser, feuchte }`, Zahlen in %,
  `feuchte` darf `null` sein (stand nicht auf der Packung). Gleicher Aufbau wie `analyse` in `js/futterliste.js`.
- `VERSION` bleibt 1. Alte Sicherungen haben das Feld nicht und bleiben ohne Umwandlung gültig
  (`tests/alte-sicherungen.test.js` muss unverändert grün bleiben).
- Beim Laden und Einlesen: ungültiges `analyse` (kein Objekt, fehlende oder unpassende Zahlen außerhalb 0 bis 100,
  Summe über 100, fehlende Feuchte dabei als 0 gezählt) wird
  entfernt, die Sorte bleibt (wie `eanBereinigen` für `ean`). Zählt als Änderung.
- Kopfkommentar in `js/daten.js` ergänzen. Der PDF-Bericht bleibt unverändert (er zeigt die Quelle „geschätzt“).

### D. Version

0.32.0: `CACHE_NAME` in `sw.js` auf `kilossos-v58`, `#version` in `index.html`, Versionstest in `tests/wissen.test.js`
(„Version 0.32.0: Cache v58 …“). Am einfachsten ohne neue Datei (Funktionen in `js/rechnen.js`); kommt doch eine neue
JS-Datei dazu, gehört sie in `DATEIEN` in `sw.js`.

## Texte (endgültig, Zahlen und Einheit mit geschütztem Leerzeichen)

- Satz unter dem Feld: „Bitte die kcal-Zahl eintragen, nicht kJ.“
- Rückfrage, Überschrift: „307 kcal pro 100 g sind für Nassfutter viel zu viel.“ (Art im Dativ: „für Trockenfutter“,
  „für Leckerli“)
- Rückfrage, Text: „Nassfutter hat in der Kilossos-Futterliste 61 bis 126 kcal. Was steht auf der Packung hinter der 307?“
  Die Spanne kommt aus `kcalSpanne` (`js/wissen.js`), damit sie zur Liste passt.
- Nur bei Nassfutter mit Wert bis 450 zusätzlich: „Ist es Trockenfutter? Dann ändere oben die Art.“
- Unmöglich, Überschrift: „Mehr als 700 kcal pro 100 g kann Kilossos nicht speichern.“ Text: „Was steht auf der Packung
  hinter der 1370?“
- Antworten: „Dort steht kJ“ mit „Kilossos trägt 73,4 kcal ein“; „Dort steht kcal pro kg“ mit „Kilossos trägt 30,7 kcal ein“;
  „Dort steht kcal pro 100 g“ mit „Die 307 stimmen, so speichern“.
- Rechner: Texte wie unter B.

## Tests (TDD, `npm test`)

Prüfung des kcal-Werts:

- Nass 307 → Rückfrage, Umrechnungen kJ 73,4 und kcal pro kg 30,7.
- Nass 607 → Rückfrage, kcal pro kg 60,7 (und kJ 145,1).
- Nass 150 → in Ordnung; Nass 150,1 → Rückfrage.
- Trocken 450 → in Ordnung; Trocken 451 → Rückfrage; Leckerli 438 → in Ordnung.
- Trocken 1370 → unmöglich, kJ 327,4 und kcal pro kg 137, kein „stimmt so“.
- Nass 160 → nur die kJ-Umrechnung (16 wäre unter 20).
- 19 → Fehler; 701 → unmöglich; 8000 → unmöglich ohne gültige Umrechnung.
- Alle 49 Sorten der Futterliste → in Ordnung (kein Fehlalarm).

Rechner:

- Sheba-Werte (7,9 / 4,4 / 1,4 / 0,3 / 84) als Nassfutter → 77.
- Purina-Werte ohne Feuchte (37 / 9,5 / 7,5 / 6) als Trockenfutter → 346, Feuchte angenommen.
- Gleiche Werte ohne Feuchte als Nassfutter → Fehler „Feuchte“.
- 79 statt 7,9 → Fehler, Summe 169,1.
- Feuchte 100 → Fehler (keine Division durch null).
- Fehlendes Protein → „Noch leer“; „< 0,5“ → keine Zahl.
- Ergebnis über der Grenze der Art → Zusatzhinweis, Übernehmen möglich.

Datenformat: gültiges `analyse` bleibt beim Einlesen erhalten; ungültiges wird entfernt, die Sorte bleibt; alle alten
Sicherungen laden unverändert.

Im Browser (375 px, hell, dunkel, 150 % Schrift, Tastatur): Kasten erscheint beim Verlassen des Felds, beim Wechsel der Art
und beim Speichern; Umrechnen trägt den Wert ein; Speichern ohne Antwort bleibt im Fenster; `confirm()` wird nie aufgerufen;
Rechner mit Komma-Eingaben; „übernehmen“ setzt Wert und Quelle; Sorte ändern zeigt gespeicherte Analysewerte; keine
Konsolenfehler.

## Quellen

- Umrechnung 1 kcal = 4,184 kJ (thermochemische Kilokalorie). Im Glossar steht gerundet „durch 4,2“, das passt dazu.
- NRC 2006, „Nutrient Requirements of Dogs and Cats“, modifizierte Atwater-Faktoren für Katzen (`kcalAusBestandteilen`).
- VO (EG) 767/2009: Energiewert bei normalem Futter freiwillig; Feuchte erst über 14 % Pflicht (wie in `js/rechnen.js`
  und im Glossar).
- Beispiel Bozita: fressnapf.de, „307 kJ/100 g“ (Eintrag in `js/futterliste.js`, abgerufen 04.11.2026).

## Risiken

- Die Formel kann bis etwa 10 % abweichen, auch nach oben (Purina One Light: Rechnung 346, Hersteller 327,5). Dann zählt
  Kilossos etwas zu viele kcal. Gegenmittel: Kennzeichnung „geschätzt“, „ca.“ in den Summen, Hinweis „nimm lieber den
  Herstellerwert“.
- Wer „stimmt so“ wählt, obwohl kJ auf der Packung steht, umgeht den Schutz bewusst. Das lässt sich nicht verhindern, ohne
  echte Ausnahmen auszusperren (Variante C abgelehnt).
- Schwelle Nass 150: Seltene echte Sorten darüber (rohes Fleisch) brauchen eine Antwort mehr. Gewollt.

## Dem Bau überlassen

Ort der Funktionen (`js/rechnen.js` empfohlen, ohne Import aus `js/wissen.js`, sonst Kreis-Import; die Spanne übergibt
`app.js`), Namen von Funktionen und CSS-Klassen, genaue Animation, Fokus-Feinheiten, Aufteilung der Tests auf die Dateien.

## Danach

Skill `migration` (Datenformat), dann `superpowers:writing-plans` für den Umsetzungsplan, Bau mit
`superpowers:test-driven-development`, Review durch einen frischen Agenten (vor dem Commit), Browser-Prüfung, Version
hochzählen, committen, pushen wenn Stefan im Chat ist.
