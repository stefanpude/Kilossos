# Kilossos – Sicherheitsgrenzen für die Gewichtsabnahme bei Katzen

**Entwurf vom 01.11.2026, Quellen abgeglichen am 02.11.2026 – zur Prüfung durch den behandelnden Tierarzt**
Tier: Kito, Kater, kastriert, Wohnungskatze · 9,32 kg (Praxis, Oktober 2026) · BCS noch nicht erhoben

> **Wichtiger Hinweis.** Dieses Dokument hat eine KI (Claude, Anthropic) verfasst. Sie hat dafür veröffentlichte
> Leitlinien und Fachliteratur ausgewertet und dabei aus der Sicht eines erfahrenen Katzentierarztes argumentiert.
> **Sie ist aber kein Tierarzt und hat Kito nie untersucht.** Alle Zahlen sind Vorschläge. Sie gelten für Kito erst,
> wenn sein Tierarzt sie geprüft und unten freigegeben hat. Bis dahin zeichnet die App nur auf und schlägt keine
> Futtermengen vor.

---

## Teil A – Kurzfassung in einfachen Worten

**Worum es geht:** Kito soll langsam abnehmen. Wenn eine dicke Katze plötzlich viel zu wenig frisst, kann ihre Leber
verfetten (Fettleber, „hepatische Lipidose“). Das ist lebensgefährlich, oft schon nach wenigen Tagen. Deshalb
braucht die App feste Grenzen.

**Die wichtigsten Regeln:**

1. **Langsam abnehmen:** pro Woche 0,5 bis 2 % des Gewichts. Bei Kito sind das heute etwa **50 bis 190 g pro Woche**.
   Gut wäre etwa 1 %, also rund 90 g.
2. **Nie hungern lassen:** Wenn Kito einen Tag lang nichts oder kaum etwas frisst, **am selben Tag den Tierarzt anrufen.**
   Keine Diät ist es wert, das abzuwarten.
3. **Die Futtermenge legt der Tierarzt fest.** Die App rechnet nur nach und warnt, wenn etwas aus dem Rahmen fällt.
4. **Leckerlis zählen mit,** höchstens 10 % der Tageskalorien. Bei Kito wären das etwa 25 kcal am Tag.
5. **Einmal pro Woche wiegen,** immer am gleichen Tag, zur gleichen Uhrzeit und mit der gleichen Waage. Die Waage
   sollte auf **10 oder 20 g genau** sein, denn eine normale Personenwaage ist für so kleine Schritte zu ungenau.
6. **Geht es nicht voran oder zu schnell, nicht selbst die Menge ändern.** Die App sagt dann: „Bitte mit dem Tierarzt
   besprechen.“

**Das Wichtigste, das die Rechnung gezeigt hat:** Mit Kitos jetzigem Futter würde er bei einer Diätmenge
wahrscheinlich **zu wenig Eiweiß** bekommen. Das Trockenfutter „Light“ ist ein normales Futter und kein Diätfutter
vom Tierarzt. Bitte frag den Tierarzt danach (siehe Fragen am Ende).

**Wie lange es dauert:** Je nach Ergebnis beim Tierarzt etwa **5 bis 10 Monate.** Das ist normal und gewollt.

---

## Teil B – Fachliche Fassung für den Tierarzt

### B1. Zusammenfassung

Kilossos ist eine Web-App, die Futter (g, kcal) und Körpergewicht dokumentiert. Sie soll Fütterungsvorgaben erst
nach tierärztlicher Freigabe von Zielgewicht und Tagesenergie anzeigen. Die folgenden Grenzwerte stützen sich im
Wesentlichen auf die AAHA Weight Management Guidelines 2014 (Brooks et al.) mit ihren Ergänzungen von 2021, auf die
WSAVA Nutritional Assessment Guidelines 2011 und auf die internationale Kohortenstudie von Flanagan et al. 2018
mit 710 übergewichtigen Katzen. Zur hepatischen Lipidose wurden Übersichtsarbeiten ausgewertet.

Vorgeschlagene Kernparameter:
- Zielabnahme 0,5–2 % KM/Woche (Optimum ca. 1 %)
- Startenergie 0,8 × RER(Zielgewicht)
- Anpassung in Schritten von 10 %
- harte Untergrenze 0,6 × RER(Zielgewicht)
- Leckerlis ≤ 10 % der Tagesenergie
- Abbruch und Vorstellung am selben Tag, wenn die Katze 24 h lang nichts oder kaum frisst

**Klinisch relevanter Befund aus der Beispielrechnung:** Mit Kitos jetzigem Futter (Nassfutter Alleinfutter plus
Purina One Light, beides kein Diätfuttermittel) läge die Proteinaufnahme bei 0,8 × RER(Ziel) nur bei etwa
3,7 g/kg Zielgewicht. Das ist deutlich weniger als die ≈ 5,2 g/kg KM, die Laflamme & Hannah 2013 für den Erhalt
der Magermasse ermittelt haben. Außerdem würde das Trockenfutter weit unter der Herstellerempfehlung gefüttert.
Das spricht dafür, ein therapeutisches Reduktionsfutter zu prüfen (Abschnitt B3, Punkt 6).

### B2. Grenzwerte im Überblick

Spalte „Prüfstatus“: **O** = im Original oder Volltext gelesen · **S** = über eine Sekundärquelle oder
Zusammenfassung belegt, Original nicht eingesehen. Seit dem 02.11.2026 liegen die Volltexte von AAHA 2014 [1]
und AAHA 2021 [3] sowie die WSAVA-Merkblätter [13], [14] vor; die betroffenen Zeilen sind jetzt mit O markiert.

| # | Parameter | Vorschlag für die App | Quelle | Status |
|---|---|---|---|---|
| 1a | Zielabnahme | 0,5–2 % KM/Woche, gerechnet ab dem Gewicht zu Beginn des Messzeitraums | AAHA 2014 [1]; Flanagan 2018 [5]; Hoelmkjaer & Bjornvad [12]; AAHA Diabetes 2018 [3] | O (Diabetes 2018: S) |
| 1b | Warnung „zu schnell“ | > 2 %/Woche im Mittel über 2 Wochen → Hinweis „Tierarzt kontaktieren“ | [1], [5] | O |
| 1c | Warnung „Stillstand“ | < 0,5 %/Woche im Mittel über 4 Wochen (oder Zunahme) → Hinweis „Plan mit Tierarzt anpassen“ | [1], [5] | O |
| 1d | Realistische Erwartung | Mittelwert in der Kohortenstudie: 0,8 ± 0,5 % der Ausgangs-KM/Woche | [5] | O |
| 2a | RER | 70 × kg^0,75, **bezogen auf das Zielgewicht** | NRC 2006 [9]; AAHA 2014 [1]; AAHA 2021 Box 1 [3]; Armstrong 2011 [6] | O |
| 2b | Startenergie Katze | 0,8 × RER(Zielgewicht) | AAHA 2014 [1]; AAHA 2021 Box 1 [3] (Faktor 0,8 „weight loss“) | O |
| 2c | Alternative Formel | 53 kcal × Zielgewicht^0,711 (222 kJ/kg^0,711) | Flanagan 2018 [5]; AAHA 2021 [3]: im Mittel 52 ± 4,9 kcal/kg^0,711 | O |
| 3a | Harte Untergrenze | 0,6 × RER(Zielgewicht). Darunter nur mit Fachtierarzt für Ernährung | AAHA 2014 [1] (unter 60 % RER bei Katzen erhöhtes Lipidoserisiko); strenger: 0,7 × RER [2] | O |
| 3b | Untergrenze **ohne** Freigabe | RER(aktuelle KM ÷ 1,4) = RER beim kleinsten plausiblen Zielgewicht; Kito: ≈ 290 kcal/Tag | abgeleitet aus [1], [5] | – |
| 3c | Akuter Abbruch | 24 h nichts oder kaum gefressen → Plan stoppen, Tierarzt am selben Tag | [2]; Armstrong 2011 [6]; Merck [7] | S / O |
| 4a | Zielgewicht aus BCS (9er-Skala) | aktuelle KM ÷ (1 + 0,1 × (BCS − 5)), also ÷ 1,2 / 1,3 / 1,4 bei BCS 7 / 8 / 9 | AAHA 2014 [1]; AAHA 2021 Tab. 2 [3]; Flanagan 2018 [5] | O |
| 4b | Grenze der Methode | BCS 9 ist nach oben offen; bei großrahmigen Tieren das historische Gewicht bei BCS 5 vorziehen | [1]; AAHA 2021 [3] (BCS ab 8/9 unscharf, Körperfettindex als Ergänzung); WSAVA 2011 [8] | O |
| 5 | Leckerlis | ≤ 10 % der Tagesenergie, inklusive Tischreste, Dental-Snacks und Futter zur Medikamentengabe | AAHA 2014 [1]; AAHA 2021 [3]; WSAVA 2025 [13] | O |
| 6 | Protein | eiweißreiche, angereicherte Diät; Orientierung ≥ 5 g Protein/kg Zielgewicht/Tag (Faustregel AAHA 2014; Studienwert Laflamme & Hannah ≈ 5,2 g) | AAHA 2014 [1]; AAHA 2021 [3]; Laflamme & Hannah 2013 [10] | O |
| 7 | Anpassung | Abnahme zu langsam → −10 % kcal; zu schnell → +10 % kcal; vorher Fütterung, Leckerlis und Gesundheit prüfen | [1]; [5] | O |
| 8a | Wiegen zu Hause | 1×/Woche, gleiche Bedingungen, Waage mit ≤ 20 g Auflösung | eigene Ableitung (Wochenänderung ≈ 50–90 g) | – |
| 8b | Kontrolle in der Praxis | alle 2 Wochen (Telefon oder Praxis), bis die Abnahmerate stimmt, dann monatlich; Praxistermine alle 4–8 Wochen; jedes Mal BCS und MCS | AAHA 2014 [1]; AAHA 2021 [3]; [5], [8] | O |
| 9 | Pflicht-Hinweis „zum Tierarzt“ | siehe Abschnitt B3, Punkt 9 | [2], [6], [7] | S / O |

### B3. Begründungen zu den einzelnen Punkten

**1. Abnahmerate.** Die AAHA-Leitlinie nennt für Katzen 0,5–2 % KM pro Woche (Hunde 1–2 %). Dieselbe Spanne hat
die Software in der Kohortenstudie von Flanagan et al. angestrebt. Tatsächlich erreicht wurden im Mittel 0,8 %
pro Woche. Mehrere Praxisleitfäden empfehlen für Katzen enger 0,5–1 %/Woche. Ich schlage vor, die AAHA-Spanne als
Warnrahmen zu nutzen und etwa 1 % als Ziel anzuzeigen. Die Rate wird als
(Gewicht_alt − Gewicht_neu) ÷ Gewicht_alt ÷ Wochen berechnet. Weil die Messwerte zu Hause streuen, sollen die
Warnungen erst bei einem gleitenden Mittel über mehrere Wochen ausgelöst werden, nicht bei einer Einzelmessung.

**2. Energiebedarf.** RER = 70 × KM^0,75 in kg, und zwar beim **Zielgewicht**, nicht beim aktuellen Gewicht.
Sonst wird übergewichtigen Tieren systematisch zu viel Energie zugeteilt (so auch Armstrong 2011 [6]). Als
Startwert für Katzen gilt 0,8 × RER(Ziel). Flanagan et al. verwendeten stattdessen 53 kcal × Ziel-KM^0,711,
was bei Kito etwa 12 % niedriger liegt. Die App sollte immer nur die **tierärztlich freigegebene kcal-Zahl**
verwenden. Die Formeln dienen der Plausibilitätsprüfung.

**3. Untergrenze und hepatische Lipidose.** Für Patienten, die erst unter 60 % RER abnehmen, empfiehlt die AAHA
einen Fachtierarzt für Ernährung. Ein Rechner der Association for Pet Obesity Prevention setzt die Grenze strenger
bei 70 %. Die hepatische Lipidose ist die häufigste erworbene Lebererkrankung der Katze. Sie entsteht, wenn eine
überkonditionierte Katze nicht oder zu wenig frisst [7]. Die Anorexiephase kann nur 2–7 Tage dauern. Eine
„übereifrige Kalorienrestriktion zur Gewichtsreduktion“ wird ausdrücklich als Auslöser genannt [6].
Für die App folgt daraus:
- Die harte Untergrenze liegt bei 0,6 × RER(Ziel). Eine Freigabe darunter verlangt eine zusätzliche Bestätigung.
- Ohne Freigabe gibt es kein Zielgewicht. Die App warnt dann, wenn die Tagesaufnahme unter RER(KM ÷ 1,4) fällt.
  Das ist der Ruhebedarf beim kleinsten Zielgewicht, das der BCS-Schlüssel überhaupt zulässt. Wer so wenig
  füttert, macht faktisch eine Diät ohne tierärztlichen Plan.
- Wird an einem Tag weniger als die Hälfte der freigegebenen Menge erfasst, fragt die App aktiv nach:
  „Hat Kito heute normal gefressen?“ Fehlende Einträge bedeuten nicht automatisch, dass die Katze nicht gefressen
  hat.
- Warnzeichen, die zum sofortigen Anruf führen: Nahrungsverweigerung oder deutlich reduzierte Aufnahme über
  24 h, Erbrechen, Lethargie, Verstecken, Speicheln, Ikterus (gelbe Skleren, Schleimhäute oder Ohrinnenseiten),
  plötzlicher deutlicher Gewichtsverlust [6], [7].

**4. Zielgewicht aus dem BCS.** Die AAHA rechnet jeden BCS-Punkt über 5 (9er-Skala) als etwa 10 % Übergewicht.
Flanagan et al. setzen das als Division um: KM ÷ 1,2 / 1,3 / 1,4 bei BCS 7 / 8 / 9. Die ebenfalls verbreitete
Subtraktion (KM × 0,8 / 0,7 / 0,6) ergibt niedrigere Zielgewichte und damit aggressivere Pläne. Ich empfehle
deshalb die Division. Grenzen der Methode:
- **BCS 9 ist nach oben offen.** Sehr adipöse Tiere werden unterschätzt.
- Die 10-%-Regel ist ein Mittelwert. Der BCS bewertet Fett, nicht Rahmengröße. Bei großrahmigen Katern wie Kito
  ist die Unsicherheit in Kilogramm trotzdem absolut größer.
- Besser ist, wenn vorhanden, das dokumentierte Gewicht des jungen Erwachsenen bei BCS 5 [4].
- In der Praxis bewährt sich ein **Zwischenziel**, etwa 10–15 % Abnahme, und danach eine Neubewertung von BCS
  und MCS.

**5. Leckerlis.** Höchstens 10 % der Tagesenergie, inklusive Tischreste, Kauartikel und Futter zum Eingeben von
Tabletten (AAHA [1], [4]). Die App rechnet die Leckerlis aus der Tagessumme heraus und warnt ab 10 %.

**6. Protein und Nährstoffdichte.** Unter Energierestriktion hilft eine eiweißreiche Diät, die Magermasse zu
erhalten. Bei deutlicher Restriktion empfiehlt die AAHA 2021 ein angereichertes therapeutisches Reduktionsfutter,
weil die bloße Kürzung eines Erhaltungsfutters zu Mängeln an Vitaminen und Mineralstoffen führen kann [3].
Laflamme & Hannah 2013 schätzten an 24 kastrierten Katern, dass für den Erhalt der Magermasse etwa 5,2 g
Protein/kg KM/Tag nötig sind. Für die Stickstoffbilanz genügten bereits etwa 1,5 g/kg [10]. Die AAHA 2014 nennt
als Faustregel ≥ 5 g Protein/kg Idealgewicht für Katzen [1] (im Volltext bestätigt). Die App soll die Proteinaufnahme
trotzdem nur
**anzeigen**, nicht bewerten, bis der Tierarzt einen Zielwert nennt.

**7. Anpassungsregeln.** Die App ändert Mengen nie selbst. Sie zeigt die Regel aus den Leitlinien und bittet
darum, die Änderung mit der Praxis abzustimmen:
- Abnahme < 0,5 %/Woche über 4 Wochen, obwohl der Plan eingehalten wurde: erst Fütterung, Leckerlis,
  Futterzugang (andere Katze, Nachbarn) und Gesundheit prüfen, dann −10 % kcal [1], [5].
- Abnahme > 2 %/Woche: Appetit, Allgemeinbefinden und Muskelzustand prüfen, dann +10 % kcal [1], [2], [5].
- Eine Kürzung unter 0,6 × RER(Ziel) ist nicht möglich (siehe Punkt 3).
- Begleiterkrankungen wie Hypothyreose oder Hyperadrenokortizismus können die Abnahme bremsen [1].

**8. Wiegen und Kontrollen.** Eine Wochenänderung von 0,5–1 % entspricht bei Kito nur 47–93 g. Mit der
Differenzmethode auf der Personenwaage (Mensch mit Katze minus Mensch, Auflösung meist 100 g) lässt sich das
nicht verlässlich messen. Empfohlen ist deshalb eine Baby- oder Tierwaage mit ≤ 20 g Auflösung. In der Praxis wird
anfangs alle 2–4 Wochen kontrolliert, in der Kohortenstudie in Woche 2, 4, 8 und 12. Dabei werden jedes Mal KM,
BCS und Muscle Condition Score (WSAVA) erhoben [1], [5], [8]. Gefüttert wird nach dem AAFP/ISFM-Konsens am besten in
mehreren kleinen Mahlzeiten, gern mit Futterspielzeug [11]. Das ist für eine Wohnungskatze mit wenig Bewegung
auch eine Form der Beschäftigung.

**9. Wann die App ausdrücklich zum Tierarzt schickt.**

*Sofort, am selben Tag:*
- 24 h nichts oder kaum gefressen
- Erbrechen mehr als einmal
- Gelbfärbung
- Teilnahmslosigkeit oder Verstecken
- Atemnot
- kein Urinabsatz oder vergebliches Pressen auf der Toilette (bei Katern ein Notfall)

*In den nächsten Tagen:*
- Abnahme > 2 %/Woche
- Durchfall länger als 1 Tag
- deutlich vermehrtes Trinken oder Urinieren (bei adipösen Katzen an Diabetes mellitus denken [3])
- auffälliger Muskelabbau

*Zum nächsten Termin:*
- Stillstand über 4 Wochen
- Gewichtszunahme
- Zielgewicht oder Zwischenziel erreicht (Umstellung auf Erhaltung)
- Freigabe älter als 3 Monate

### B4. Beispielrechnung für Kito

> **Nur Beispiele, keine Freigabe.** Der BCS ist noch nicht erhoben. Die drei Spalten zeigen, was je nach Befund
> herauskäme.

Ausgangswerte: KM 9,32 kg · RER bei aktueller KM = 70 × 9,32^0,75 ≈ 373 kcal (nur zum Vergleich, **nicht** zur
Fütterung)

| angenommener BCS | 7 | 8 | 9 |
|---|---|---|---|
| Zielgewicht (KM ÷ 1,2 / 1,3 / 1,4) | **7,8 kg** | **7,2 kg** | **6,7 kg** (eher zu hoch, siehe B3, Punkt 4) |
| zum Vergleich: Subtraktionsmethode | 7,5 kg | 6,5 kg | 5,6 kg |
| RER(Ziel) = 70 × Ziel^0,75 | 326 kcal | 307 kcal | 290 kcal |
| **Startenergie 0,8 × RER(Ziel)** | **261 kcal** | **245 kcal** | **232 kcal** |
| Vergleich Flanagan: 53 × Ziel^0,711 | 228 kcal | 215 kcal | 204 kcal |
| harte Untergrenze 0,6 × RER(Ziel) | 195 kcal | 184 kcal | 174 kcal |
| Leckerli-Obergrenze (10 % der Startenergie) | 26 kcal | 25 kcal | 23 kcal |
| Protein-Orientierung 5,2 g × Ziel | 40 g | 37 g | 35 g |
| Wochenabnahme bei 0,5 / 1 / 2 % (ab 9,32 kg) | 47 / 93 / 186 g | gleich | gleich |
| Dauer bis Ziel bei 0,8 %/Woche (Mittel der Kohortenstudie) | ≈ 23 Wochen | ≈ 33 Wochen | ≈ 42 Wochen |

Die Untergrenze ohne Freigabe (B2, Zeile 3b) liegt für Kito bei RER(9,32 ÷ 1,4) ≈ **290 kcal/Tag**.

**Was das in Futter bedeutet** (Beispiel BCS 8, 245 kcal):

| Futter | kcal/100 g | Menge | kcal | Protein |
|---|---|---|---|---|
| Sheba Fresh & Fine „Huhn, Geflügel & Truthahn“ (nass) | 77 (berechnet aus den Werten auf Kitos Umkarton, siehe futter-recherche.md) | 100 g = 2 Beutel | 77 | 7,9 g |
| Purina One Light (trocken) | 327,5 (Herstellerangabe UK) | 51 g | 167 | 18,9 g |
| **Summe** | | | **244** | **26,8 g ≈ 3,7 g/kg Ziel** |

Zum Vergleich:
- nur Trockenfutter: 75 g
- nur Nassfutter: 318 g, also gut 6 Beutel

_Stand 07.11.2026: Sheba mit 77 statt früher 71 kcal/100 g neu gerechnet (so rechnet die App seit 0.19.0)._

**Beurteilung:**
- Die Proteinaufnahme läge gut ein Viertel unter dem Studienwert von etwa 37 g.
- Die Fütterungstabelle von Purina nennt für 8–10 kg 90–115 g/Tag als Erhaltung. 51 g sind weniger als die
  Hälfte davon. Die Versorgung mit Mikronährstoffen ist damit nicht mehr durch die Deklaration abgesichert [3].
- Sheba und Purina One Light sind Alleinfuttermittel für die Erhaltung, keine Diätfuttermittel.
- Die Proteindichte ist mit etwa 10–11 g/100 kcal bei beiden Sorten ähnlich. Die Mischung ändert daran wenig. Nur
  ein Futter mit höherer Protein- und Nährstoffdichte pro kcal würde das Problem lösen.

### B5. Abweichungen von früheren Projektentscheidungen

- **Untergrenze ohne Freigabe:** Ursprünglich war „RER beim Zielgewicht“ geplant. Ohne Freigabe gibt es aber kein
  Zielgewicht. Deshalb ist RER(KM ÷ 1,4) vorgeschlagen (B3, Punkt 3).
- **Untergrenze mit Freigabe:** Die freigegebene Tagesmenge selbst liegt nach den Leitlinien typischerweise bei
  0,8 × RER(Ziel), also *unter* RER(Ziel). Die Warnung bezieht sich deshalb auf die Freigabe. Die harte Grenze
  liegt bei 0,6 × RER(Ziel).
- **„Zu schnell“:** Die Warnung kommt erst bei einem 2-Wochen-Mittel über 2 %, nicht bei einer einzelnen Messung.
  Grund ist die Messunsicherheit beim Wiegen zu Hause.

### B6. Abgleich mit den neuen Quellen (02.11.2026)

Gelesen wurden die Volltexte von AAHA 2014 [1] und AAHA 2021 [3], die WSAVA-Merkblätter zu Leckerlis [13] und zum
Kalorienbedarf [14], die WSAVA-Leitlinienseite [15] und die Zusammenfassung von Hoelmkjaer & Bjornvad [12].

- **Bestätigt, keine Änderung nötig:** 0,5–2 %/Woche; Start 0,8 × RER(Ziel); Untergrenze 0,6 × RER(Ziel) mit
  Fachtierarzt darunter; ±10 % Anpassung; jeder BCS-Punkt über 5 ≈ 10 % Übergewicht; Leckerlis ≤ 10 %;
  Protein ≥ 5 g/kg Idealgewicht.
- **Korrigiert:** Kontrollintervall (8b) jetzt wie im Original: alle 2 Wochen, bis die Rate stimmt, dann monatlich.
- **Neu und für Kito wichtig:** Die AAHA 2021 (Tab. 8, Adipositas) hält eine Restriktion **unter RER mit
  Handelsfutter** für nicht empfehlenswert; ab ≤ RER werden angereicherte Diätfutter empfohlen. Kitos Sheba und
  Purina ONE Light sind Handelsfutter. → stützt Frage 5 an den Tierarzt.
  **In der App seit Version 0.6.2:** Hinweis „Diätfutter mit dem Tierarzt besprechen“, wenn die Freigabe unter
  RER(Zielgewicht) liegt und an dem Tag Futter gegeben wurde, das kein Diätfutter der Futterliste ist (eigene
  Sorten zählen dabei als normales Futter). Auch im Tierarzt-Bericht gezählt.
- **Hinweis zum Zielgewicht:** Das Rechenbeispiel der AAHA 2014 zieht ab (45 kg bei BCS 8 → ≈ 32 kg). Die App teilt
  (KM ÷ 1,3) und landet damit beim vorsichtigeren, höheren Zielgewicht (B3, Punkt 4).
- **WSAVA 2025:** Leckerlis „weniger als 10 %“; Tabelle bis 7 kg Körpergewicht (28 kcal/Tag aus Leckerlis).
  Nassfutter mit viel Wasser kann die Sättigung fördern (AAHA 2021 [3]).

---

## Fragen an den Tierarzt

1. Welchen **BCS** (9er-Skala) und welchen **Muscle Condition Score** hat Kito?
2. Gibt es ein Gewicht aus jungen Jahren bei Idealfigur? Welches **Zielgewicht** halten Sie bei seinem großen
   Körperbau für richtig? Wäre ein **Zwischenziel** sinnvoll?
3. Welche **Tagesenergie (kcal)** geben Sie frei? Stimmen Sie dem Rahmen 0,8 × RER(Ziel) zu?
4. Ist **0,5–2 %/Woche** für Kito richtig, oder lieber enger (0,5–1 %)? Welche Rate streben Sie an?
5. Sollte Kito auf ein **therapeutisches Reduktionsfutter** umgestellt werden (Eiweiß, Mikronährstoffe, B4)?
   Welches, und wie wird umgestellt?
6. Gibt es einen **Protein-Zielwert** (g/Tag), den die App anzeigen soll?
7. Sind vorher **Blutuntersuchungen** sinnvoll (z. B. Blutzucker/Fructosamin, Schilddrüse, Leberwerte)?
8. Ist die harte Untergrenze **0,6 × RER(Ziel)** richtig, oder lieber 0,7?
9. Darf die App bei Stillstand oder zu schneller Abnahme **±10 %** vorschlagen, oder soll jede Änderung über Sie
   laufen?
10. In welchem **Abstand** möchten Sie Kito sehen?
11. Fehlt in der Liste „sofort zum Tierarzt“ (B3, Punkt 9) etwas, oder ist etwas zu streng?
12. Dürfen diese Grenzen mit dem Hinweis „von einem Tierarzt geprüft“ später in der veröffentlichten App
    stehen (ohne Ihren Namen, falls gewünscht)?

---

## Tierärztliche Freigabe für Kito

| | |
|---|---|
| BCS (1–9) / MCS | ______________________ |
| Zielgewicht (ggf. Zwischenziel) | ______________ kg |
| Tagesenergie | ______________ kcal/Tag |
| angestrebte Abnahme | ______________ % pro Woche |
| empfohlenes Futter | ________________________________________ |
| nächste Kontrolle | ______________ |
| Änderungen an den Grenzen oben | ________________________________________ |
| | ________________________________________ |
| Datum | ______________ |
| Tierarzt / Praxis (Stempel) | ________________________________________ |
| Unterschrift | ________________________________________ |

---

## Quellen

1. Brooks D, Churchill J, Fein K, et al. *2014 AAHA Weight Management Guidelines for Dogs and Cats.*
   J Am Anim Hosp Assoc 2014;50(1):1–11. doi:10.5326/JAAHA-MS-6331.
   **Volltext gelesen (02.11.2026):** 0,5–2 %/Woche Katze, 80 % RER(Ideal), +10 % bei zu schneller Abnahme,
   −10–20 % bei zu langsamer, bis 60 % RER, darunter Fachtierarzt (Lipidoserisiko bei Katzen), Leckerlis ≤ 10 %,
   Protein ≥ 5 g/kg Idealgewicht, Kontrolle alle 2 Wochen, dann monatlich.
2. Association for Pet Obesity Prevention / World Pet Obesity Association. *Veterinary Step-Based Weight Loss
   Calculator for Dogs and Cats* (petobesityprevention.org, abgerufen 01.11.2026). Zitiert [1], [3], [5]:
   „Cats: 80 % of RER at IBW“, Grenze 70 % RER, Kontrolle alle 2–4 Wochen, 24-h-Regel bei Nahrungsverweigerung.
3. Cline MG, Burns KM, Coe JB, et al. *2021 AAHA Nutrition and Weight Management Guidelines for Dogs and Cats.*
   J Am Anim Hosp Assoc 2021;57:153–178. doi:10.5326/JAAHA-MS-7232. **Volltext gelesen (02.11.2026):** BCS-Tabelle
   (Tab. 2), Faktor 0,8 × RER bei Abnahme (Box 1), 52 ± 4,9 kcal/kg^0,711, Diätfutter ab ≤ RER, keine Restriktion
   unter RER mit Handelsfutter (Tab. 8), Leckerlis ≤ 10 %. Dazu AAHA *2018 Diabetes Management Guidelines*
   (0,5–2 %/Woche bei adipösen Katzen), nur über die Zusammenfassung belegt.
4. Elite Learning, CE-Kurs (Zusammenfassung von [1]): „Each BCS ≥ 5 (on a 9-point scale) … is equivalent to being
   10 % overweight“; Leckerlis, Tischreste und Medikamenten-Futter mitrechnen; historische Gewichte.
5. Flanagan J, Bissot T, Hours M-A, Moreno B, German AJ. *An international multi-centre cohort study of weight
   loss in overweight cats.* PLoS ONE 2018;13(7):e0200414. **Volltext gelesen.**
6. Armstrong PJ. *Feline Hepatic Lipidosis: Therapeutic Considerations.* WSAVA World Congress Proceedings 2011
   (VIN). **Volltext gelesen.**
7. Merck Veterinary Manual, Professional Version: *Feline Hepatic Lipidosis* (Auszüge gelesen).
8. Freeman L, Becvarova I, Cave N, et al. *WSAVA Nutritional Assessment Guidelines.* J Feline Med Surg
   2011;13(7):516–525. doi:10.1016/j.jfms.2011.05.009 (von ISFM und AAFP unterstützt; BCS- und MCS-Tafeln im WSAVA
   Global Nutrition Toolkit).
9. National Research Council. *Nutrient Requirements of Dogs and Cats.* National Academies Press 2006
   (RER-Formel; auch in [1] und [6] verwendet).
10. Laflamme DP, Hannah SS. *Discrepancy between use of lean body mass or nitrogen balance to determine protein
    requirements for adult cats.* J Feline Med Surg 2013 (Abstract gelesen). Dazu Laflamme & Hannah 2005,
    Int J Appl Res Vet Med 3(2):62–68: mehr Protein → mehr Fettverlust, weniger Magermasseverlust (nur über
    Zusammenfassungen).
11. Sadek T, et al. *Feline feeding programs: addressing behavioural needs to improve feline health and
    wellbeing.* AAFP/ISFM Consensus Statement, J Feline Med Surg 2018;20(11):1049–1055.
    doi:10.1177/1098612X18791877.

12. Hoelmkjaer KM, Bjornvad CR. *Management of obesity in cats.* Veterinary Medicine: Research and Reports (Dove
    Medical Press), über DOAJ (Abstract gelesen: 0,5–2 %/Woche; Diätfutter mit geringerer Energiedichte, mehr Protein
    und Faser).
13. WSAVA Global Nutrition Committee. *Feeding treats to your cat* (11/2025). **Gelesen:** Leckerlis < 10 % der
    Tageskalorien, Tabelle nach Körpergewicht.
14. WSAVA Global Nutrition Committee. *Calorie Needs for an Average Healthy Adult Cat in Ideal Body Condition*
    (07/2020). **Gelesen:** Erhaltungsbedarf gesunder, schlanker Katzen (nicht für die Abnahme gedacht).
15. WSAVA. *Global Nutrition Guidelines* (Webseite, 2024), mit BCS-Tafel Katze (06/2025) und MCS-Tafel.

*Futterwerte: Sheba laut Packung, Purina One Light laut purina.co.uk (siehe Kilossos-Futterliste).*
