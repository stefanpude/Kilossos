# Erklärseiten „Begriffe kurz erklärt“ und „Warum nimmt meine Katze nicht ab?“ (0.30.0)

_Angelegt 04.11.2026, von Stefan freigegeben („Ja, so bauen“), eingebaut in 0.30.0. Ideen-Tafel: `glossar-fachbegriffe` und
`yb9808f5mlxcgl0ad5xs` (beide „geplant“). Quellen am 04.11.2026 gelesen, Liste ganz unten._

## Ziel

- Halter verstehen die Begriffe auf Futterpackungen und in Kilossos, ohne woanders suchen zu müssen.
- Wer sich wundert, warum die Katze nicht abnimmt, findet die häufigsten Ursachen und was er tun kann,
  ohne selbst die Futtermenge zu kürzen.
- Warum jetzt: Stefan, 04.11.2026: „nicht erst auf den 13.11. warten, anpassen können wir auch dann noch“.
  Der Tierarzt soll beide Seiten am 13.11. gegenlesen.

## Feste Regeln für jeden Satz

- Keine Futtermengen und keine Rechenwege zum Selbstfüttern (deshalb steht die RER-Formel nicht im Text).
- Jede medizinische Aussage hat eine Fachquelle, jede Rechtsangabe ihre Fundstelle.
- Neutral: BARF ohne Dafür oder Dagegen, keine Markennamen in den Texten.
- Ohne persönliche Angaben (das Repo ist öffentlich).
- Duzen, kurze Sätze, keine Floskeln, keine Gedankenstriche.
- Auf der Seite „Warum nimmt meine Katze nicht ab?“ steht der Fettleber-Kasten nie zugeklappt. Im Glossar ist
  „Fettleber“ ein Begriff zum Nachschlagen wie jeder andere; der Notfall-Hinweis steht zusätzlich immer sichtbar
  auf „Heute“.

## Aufbau

Entscheidungen von Stefan: zwei Seiten unter „Mehr“, Begriffe alphabetisch, je 1–3 Sätze, aufklappbar,
BARF neutral, Inhalte von „Warum nimmt meine Katze nicht ab?“ wie in der Websites-Analyse.

Vorschläge von Claude (bitte prüfen):

- **Neue Gruppe „Wissen“** unter „Mehr“, zwischen „Übersicht für den Tierarzt“ und „Einstellungen“, mit
  „Begriffe kurz erklärt“ (Symbol Buch) und „Warum nimmt meine Katze nicht ab?“ (Symbol Frage). Die drei
  vorhandenen Erklärungen bleiben unter „Tierarzt“, weil sie zur Freigabe gehören.
- **Blatt `dialog-begriffe`:** Überschrift, ein Satz Anleitung, 12 aufklappbare Begriffe mit dem Baustein
  `aufklappKarte` (wie die Hinweise auf „Heute“). Unter jeder Erklärung steht ihre Quelle. Die Begriffe liegen
  als Daten in `js/wissen.js`, damit Reihenfolge, Satzzahl und Quellen testbar sind. Die kcal-Spannen bei
  „Nassfutter und Trockenfutter“ rechnet `js/wissen.js` aus der Futterliste aus, damit sie nie veralten.
- **Blatt `dialog-nicht-ab`:** fester Text wie bei „Welche Grenzen gelten?“ (Zwischenüberschriften mit kurzen
  Absätzen, nichts zugeklappt). Der Kasten „Bitte nie hungern lassen“ (Gestaltung wie der Notfall-Hinweis
  auf „Heute“) steht direkt unter der Einleitung.
- **Verknüpfungen:** Der Begriff „BCS und MCS“ bekommt den Knopf „Mehr zum BCS“, der das vorhandene Blatt
  „Was ist der BCS?“ darüber öffnet. Der Hinweis „Abnahme stockt“ auf „Heute“ bekommt den Knopf „Warum nimmt
  meine Katze nicht ab?“, denn genau dann sucht man die Antwort.
- **Zusätzlich aufgenommen**, alles aus der AAHA-Leitlinie 2014, Tabelle 3 („Was die Abnahme bremst“):
  der Begriff „Freigabe vom Tierarzt“ und die Abschnitte „Sie bettelt“ und „Gefüttert wird nach der Packung“.

## Offener Punkt für Stefan: Belohnungen beim Training

Die Ideen-Tafel sagt: Leckerlis fürs Training aus der Tagesmenge abzweigen und **als Leckerli** eintragen.
Kommt die Belohnung aus dem normalen Futter (ein paar Stück Trockenfutter), ist es genauer, sie **als Mahlzeit
mit dieser Sorte** einzutragen: Die kcal stimmen dann genau, und die 10-%-Warnung für Leckerlis springt nicht
an, obwohl die Katze nur ihr normales Futter bekommen hat. Die 10-%-Regel gilt für Extras, weil die meisten
Leckerlis Ergänzungsfutter sind. Echte Leckerlis bleiben Leckerlis. Der Text unten ist so geschrieben.

## Texte: Begriffe kurz erklärt

Einleitung: „Tippe auf einen Begriff, um die Erklärung zu öffnen. Unter jeder Erklärung steht ihre Quelle.“

**Alleinfutter und Ergänzungsfutter**
Alleinfutter deckt allein den ganzen Tagesbedarf an Nährstoffen. Ergänzungsfutter reicht nur zusammen mit
anderem Futter; dazu gehören die meisten Leckerlis, Snacks und Pasten und auch manches Nassfutter. Welche Art
es ist, steht auf jeder Packung.
_Quelle: EU-Verordnung 767/2009, Art. 3 und 15; Leitfaden zur Kennzeichnung von Futtermitteln (BMLEH)._

**Analytische Bestandteile**
Diese Angaben stehen in Prozent auf jeder Packung: Rohprotein (Eiweiß), Rohfett, Rohfaser und Rohasche
(Mineralstoffe), bei Nassfutter auch die Feuchte. „Roh“ bezieht sich auf die Labormethode, mit der die Werte
bestimmt werden. Fehlt der kcal-Wert, lässt er sich aus diesen Zahlen schätzen, in der Kilossos-Futterliste
steht dann „geschätzt“.
_Quelle: EU-Verordnung 767/2009, Anhang I Nr. 6 und Anhang VII; NRC 2006 (Schätzformel)._

**BARF**
BARF steht für „biologisch artgerechtes rohes Futter“: rohes Fleisch, Innereien und oft Knochen, meist mit
Zusätzen. Die kcal hängen vor allem vom Fett im Fleisch ab, deshalb legst du BARF in Kilossos als eigene Sorte
mit dem kcal-Wert von der Packung oder aus dem Rationsplan an. Plane eine BARF-Ernährung mit dem Tierarzt,
weil selbst gemischte Rationen Nährstofflücken haben können und rohes Fleisch Keime enthalten kann.
_Quelle: WSAVA Global Nutrition Committee, Raw Meat Based Diets for Pets (2021); NRC 2006._

**BCS und MCS**
Der BCS (Body Condition Score) zeigt auf einer Skala von 1 bis 9, wie viel Fett eine Katze trägt; ideal sind
4 und 5. Der MCS (Muscle Condition Score) beschreibt die Muskeln. Beide bestimmt der Tierarzt mit Augen und
Händen.
Knopf: „Mehr zum BCS“.
_Quelle: WSAVA, Body-Condition-Score- und Muscle-Condition-Score-Tafeln für Katzen._

**Diätfutter vom Tierarzt**
Als „Diätfutter“ darf nur Futter für besondere Ernährungszwecke verkauft werden, das die EU eigens regelt.
Diätfutter zur Verringerung von Übergewicht liefert wenig Energie, soll dafür mehr Nährstoffe je kcal enthalten
und trägt den Rat, vorher den Tierarzt zu fragen. Die Leitlinien empfehlen es, wenn eine Katze zum Abnehmen
sehr wenig Futter bekommen soll, weil normales Futter dann zu wenig Vitamine und Mineralstoffe liefert.
_Quelle: EU-Verordnung 767/2009, Art. 18; EU-Verordnung 2020/354, Anhang Teil B Nr. 25; AAHA 2021, Tabelle 8._

**Fettleber (hepatische Lipidose)**
Frisst eine Katze nicht oder viel zu wenig, lagert sich Fett in der Leber ein, bis sie nicht mehr richtig
arbeitet. Übergewichtige Katzen trifft das besonders oft, und ohne schnelle Behandlung ist es lebensgefährlich.
Frisst deine Katze einen Tag lang nichts oder kaum etwas, gehört sie sofort zum Tierarzt.
_Quelle: Cornell Feline Health Center, Hepatic Lipidosis; Armstrong 2011 (WSAVA); AAHA 2014._

**Freigabe vom Tierarzt**
So heißt in Kilossos, was dein Tierarzt für die Abnahme festlegt: Zielgewicht und Tagesmenge in kcal, auf
Wunsch auch BCS und MCS. Mit der Freigabe vergleicht Kilossos jeden Tag die Fütterung mit dieser Menge und
bewertet das Tempo der Abnahme. Du trägst sie unter „Mehr“ bei „Tierarzt“ ein.
_Quelle: AAHA 2014 und 2021 (Zielgewicht und Tagesmenge legt der Tierarzt fest)._

**kcal und ME**
kcal (Kilokalorien) messen die Energie im Futter. Auf Packungen steht meist die umsetzbare Energie (ME), also
der Teil, den die Katze nach der Verdauung wirklich nutzen kann. Kilossos rechnet mit kcal pro 100 g; steht auf
der Packung ein Wert pro Kilogramm, teilst du ihn durch 10.
_Quelle: NRC 2006; EU-Verordnung 767/2009 mit DIN EN 16967 (Berechnung des Energiewerts)._

**Light und Sterilised**
Nach den Regeln des europäischen Herstellerverbands FEDIAF soll Light-Futter mindestens 15 % weniger Energie
haben als vergleichbares Futter. Für „Sterilised“ (Futter für kastrierte Katzen) gibt es keine solche Grenze,
und manche Sterilised-Beutel in der Kilossos-Futterliste haben mehr kcal als manches normale Nassfutter.
Vergleiche deshalb immer die kcal pro 100 g.
_Quelle: FEDIAF Code of Good Labelling Practice for Pet Food (2019), 5.2.4.5; Kilossos-Futterliste._

**Nassfutter und Trockenfutter**
Nassfutter besteht zu drei Vierteln oder mehr aus Wasser, Trockenfutter zu etwa einem Zehntel oder weniger.
Deshalb hat Trockenfutter pro Gramm ein Vielfaches an kcal (in der Kilossos-Futterliste 304 bis 396 kcal pro
100 g, Nassfutter 61 bis 126). Kilossos rechnet beides in kcal um, damit du es mit der Tagesmenge vom Tierarzt
vergleichen kannst.
_Quelle: Kilossos-Futterliste (Hersteller- und Packungsangaben). Die Zahlen rechnet die App aus der Liste._

**RER (Ruheenergiebedarf)**
Der RER ist die Energie, die eine Katze am Tag in Ruhe verbraucht; berechnet wird er aus dem Körpergewicht.
Beim Abnehmen setzt der Tierarzt dafür das Zielgewicht ein, weil das heutige Gewicht zu viel Energie ergäbe.
Kilossos nutzt den RER nur für Warnungen und schlägt damit keine Futtermenge vor.
_Quelle: NRC 2006; AAHA 2014; Armstrong 2011 (WSAVA)._

**Zielgewicht**
Das Zielgewicht ist das Gewicht, das deine Katze am Ende der Abnahme haben soll. Der Tierarzt leitet es aus
dem BCS ab, wobei jeder Punkt über 5 ungefähr 10 % zu viel Gewicht bedeutet. In Kilossos steht es in der
Freigabe vom Tierarzt.
_Quelle: AAHA 2014; Flanagan et al. 2018._

## Texte: Warum nimmt meine Katze nicht ab?

**Einleitung:** Sicher sind bei Katzen 0,5 bis 2 % des Gewichts pro Woche, und einzelne Wägungen schwanken.
Bleibt die Kurve über mehrere Wochen flach, steckt oft eine dieser Ursachen dahinter.

**Kasten (immer sichtbar):** **Bitte nie hungern lassen.** Der alte Rat, einfach nur das neue Futter
hinzustellen, weil eine Katze vor vollem Napf nicht verhungert, ist gefährlich. Frisst eine Katze nicht, kann
sie in wenigen Tagen eine Fettleber bekommen. Stelle neues Futter deshalb über mindestens eine Woche langsam
um. Frisst deine Katze einen Tag lang nichts oder kaum etwas, gehört sie sofort zum Tierarzt.

**Eine andere Katze frisst mit**
Füttere die Katzen getrennt und zu festen Zeiten, jede in einem eigenen Raum oder an einem Platz, den die
andere nicht erreicht. Ein Futterautomat, der nur beim Chip der richtigen Katze öffnet, hilft ebenfalls.
Manchmal ist es einfacher, wenn alle Katzen dasselbe Futter bekommen; ob das Diätfutter auch für die andere
Katze passt, klärt der Tierarzt.

**Nicht alle machen mit**
Sprich den Plan mit allen ab, die deine Katze füttern: Familie, Mitbewohner und bei Freigängern auch die
Nachbarn. Am einfachsten wiegst du morgens das Futter für den ganzen Tag ab, und alle füttern nur daraus.

**Leckerlis und Reste zählen mit**
Leckerlis, Tischreste und das Häppchen für die Tablette sollen zusammen höchstens 10 % der Tageskalorien
ausmachen. Für Training und Belohnung nimmst du am besten einen Teil des normalen Futters, zum Beispiel ein
paar Stück Trockenfutter. Trag ihn als Mahlzeit mit dieser Sorte ein; echte Leckerlis trägst du als Leckerli ein.

**Sie bettelt**
Betteln ist bei Katzen meist Gewohnheit oder der Wunsch nach Aufmerksamkeit. Spielen, Streicheln oder ein
Futterspielzeug helfen dann oft mehr als ein Extra-Happen. Auch mehrere kleine Mahlzeiten über den Tag verteilt
machen es leichter.

**Ungenau abgemessen**
Messbecher sind ungenau, gerade bei den kleinen Mengen für Katzen. Wiege das Futter deshalb mit der
Küchenwaage, bevor du Wasser oder Brühe dazugibst.

**Gefüttert wird nach der Packung**
Die Fütterungstabelle auf der Packung gibt einen Startwert für eine durchschnittliche Katze, die ihr Gewicht
halten soll. Zum Abnehmen legt der Tierarzt die Tagesmenge fest und rechnet dabei mit dem Zielgewicht.

**Die Abnahme wird langsamer**
Mit jedem Kilo weniger braucht der Körper weniger Energie, und auch Krankheiten können die Abnahme bremsen.
Gibt es eine Freigabe und sind es vier Wochen lang weniger als 0,5 % pro Woche, zeigt Kilossos auf „Heute“
einen Hinweis. Dann prüft der Tierarzt den Plan und passt die Menge an.

**Bitte nicht selbst kürzen**
Weniger Futter auf eigene Faust kann eine Fettleber auslösen. Nimmt deine Katze trotz allem nicht ab, sprich
mit dem Tierarzt, denn nur er ändert die Tagesmenge.

_Quellen (klein darunter): AAHA Weight Management Guidelines 2014, Tabelle 3; AAFP/ISFM-Konsens zur Fütterung
von Katzen 2018; German et al. 2011 (Messbecher); WSAVA-Merkblatt Leckerlis 2025; Cornell Feline Health
Center (Fettleber); Armstrong 2011 (WSAVA)._

## Änderungen nach dem Review (04.11.2026, frischer Opus-Agent)

In der App gilt diese Fassung; die Texte oben sind der freigegebene Entwurf.

- Alleinfutter: „deckt in der Tagesmenge laut Packung den ganzen Bedarf an Nährstoffen“ (passt zu Diätfutter:
  bei sehr kleiner Menge reicht normales Futter nicht).
- kcal und ME: „Steht ein Energiewert auf der Packung, ist es meist die umsetzbare Energie (ME) …“ (die Angabe ist
  freiwillig); Umrechnung „kcal pro Kilogramm teilst du durch 10, kJ pro 100 g durch 4,2“.
- Zielgewicht: „zum Beispiel aus dem BCS“ (der Tierarzt kann auch das frühere schlanke Gewicht nehmen).
- Nassfutter und Trockenfutter, Quelle: „einzelne Werte aus den Analysewerten geschätzt“.
- Kasten „Bitte nie hungern lassen“: neues Futter „zuerst neben dem gewohnten“ anbieten (AAHA 2014, Tabelle 3);
  Quellenzeile um das Merck Veterinary Manual ergänzt (wenige Tage bis zur Fettleber).
- Leckerlis: „Trag sie als Leckerli ein, damit Kilossos sie mitzählt“; Training mit „ein paar Stück von der
  Tagesmenge“, damit niemand zusätzlich füttert.
- Abnahme wird langsamer: „Besprich dann den Plan mit dem Tierarzt, nur er passt die Menge an.“
- Start bricht nicht ab, wenn der Platz für die Begriffe fehlt; neue Tests: Zahlen gegen `GRENZEN`, Sterilised gegen
  die Futterliste, jede Aktion hat einen Fall im Klick-switch, kcal-Spannen endlich und Nass unter Trocken.

## Umsetzung (nach Freigabe)

1. Tests zuerst (`tests/wissen.test.js`): 12 Begriffe, alphabetisch (`localeCompare` „de“), eindeutige ids,
   je 1–3 Sätze, jede Erklärung mit Quelle, keine Mengenangaben „pro Tag“; HTML schützt Text, alle Knöpfe
   `type="button"`; kcal-Spannen passen zur Futterliste; `index.html` hat beide Einträge und Blätter
   (`h2 tabindex="-1" autofocus`), der Fettleber-Kasten steht nicht in einem zugeklappten Teil; `app.js` öffnet
   beide Blätter; `sw.js` hat `js/wissen.js` und `kilossos-v56`; Versionszeile 0.30.0.
2. `js/wissen.js` (Daten und `begriffeHtml()`), `index.html` (Gruppe „Wissen“, zwei Blätter, Version 0.30.0),
   `app.js` (zwei `case`, Begriffe einmal beim Start einsetzen, Knopf im Hinweis „Abnahme stockt“),
   `styles.css` (Abstände der neuen Blätter), `sw.js` (v56, neue Datei).
3. Vor neuen `data-aktion`-Namen greppen: `begriffe-erklaerung`, `warum-nicht-ab`.

## Prüfung

- `npm test` grün.
- Browser 375 px hell, dunkel und 150 % Schrift: beide Blätter öffnen und schließen (Knopf und Hintergrund),
  Begriffe auf- und zuklappen, „Mehr zum BCS“ öffnet das BCS-Blatt über dem Glossar, Fokus beim Öffnen auf der
  Überschrift, Tippflächen mindestens 48 px, keine Konsolenfehler. Hinweis „Abnahme stockt“ mit Knopf in der Demo.
- Review durch einen frischen Opus-Agenten (Fachtexte und Code), Funde einarbeiten.
- Committen, pushen, live prüfen (Versionszeile 0.30.0), Handy-Test-Liste um Teil G ergänzen, die zwei
  Ideen-Tafel-Einträge auf „erledigt“.

## Quellen (gelesen am 04.11.2026)

1. Verordnung (EG) Nr. 767/2009 über das Inverkehrbringen und die Verwendung von Futtermitteln: Art. 3 Abs. 2
   Buchst. i und j (Alleinfuttermittel, Ergänzungsfuttermittel), Art. 15 (Futtermittelart auf dem Etikett),
   Art. 18 (Bestimmungswort „Diät-“ nur für Futtermittel für besondere Ernährungszwecke), Anhang I Nr. 6
   (Feuchtegehalt über 14 % angeben), Anhang VII Kapitel I (Rohprotein, Rohfaser, Rohfett, Rohasche für Hunde
   und Katzen). Gelesen über den Leitfaden des BMLEH (Nr. 2).
2. Bundesministerium für Landwirtschaft, Ernährung und Heimat (BMLEH): *Leitfaden zur Kennzeichnung von
   Futtermitteln* (bmleh.de). Darin auch: Energiewerte für Hunde und Katzen nach DIN EN 16967:2017; Pflichthinweis
   für rohes Heimtierfutter nach VO (EU) Nr. 142/2011.
3. Verordnung (EU) 2020/354, Anhang Teil B Nr. 25 „Verringerung von Übergewicht“: für Katzen umsetzbare Energie
   unter 3 190 kcal/kg (bei 12 % Feuchte) bzw. unter 580 kcal/kg (bei 85 % Feuchte); nur als Alleinfuttermittel;
   Nährstoffgehalt soll den knappen Energiegehalt ausgleichen; Etikett: „Es wird empfohlen, vor der Verwendung den
   Rat eines Tierarztes einzuholen.“ (eur-lex.europa.eu).
4. FEDIAF: *Code of Good Labelling Practice for Pet Food* (2019), 5.2.4.5 „light“: Energiedichte mindestens 15 %
   unter vergleichbarem Erhaltungsfutter. Zu „sterilised“ oder „neutered“ steht im Code nichts.
5. WSAVA Global Nutrition Committee: *Raw Meat Based Diets for Pets* (Global Nutrition Toolkit, 2021) und
   *Statement on Risks of Raw Meat-Based Diets* (2020): meist mehr Fett, Energiegehalt unterschiedlich,
   Keimbelastung, selbst gemischte Rationen mit möglichen Mängeln oder Überschüssen.
6. Cornell Feline Health Center: *Hepatic Lipidosis* (vet.cornell.edu): Fett in den Leberzellen, bei
   übergewichtigen Katzen deutlich häufiger, fast immer nach Nichtfressen, unbehandelt meist tödlich.
7. Brooks D et al.: *2014 AAHA Weight Management Guidelines for Dogs and Cats*, JAAHA 2014;50(1):1–11.
   Tabelle 3 (mehrere Tiere, Betteln, Diätwechsel über mindestens eine Woche, Katzen nie länger als 24 Stunden
   ohne Mahlzeit, Plateau, Haushaltsmitglieder, Futter für den Tag vorab abmessen, ganze Familie einbinden);
   Trockenfutter wiegen statt Messbecher; alle Beteiligten einbinden; Leckerlis und Tischreste höchstens 10 %;
   Begleiterkrankungen können die Abnahme bremsen; 0,5–2 %/Woche.
8. Sadek T et al.: *Feline feeding programs*, AAFP/ISFM Consensus Statement, J Feline Med Surg 2018;20(11):1049–1055:
   getrennte Futterplätze, Futterautomaten mit Chip-Erkennung, mehrere kleine Mahlzeiten, Futterspielzeug,
   Küchenwaage statt Messbecher.
9. German AJ et al.: *Imprecision when using measuring cups to weigh out extruded dry kibbled food*,
   J Anim Physiol Anim Nutr 2011;95(3):368–373 (zitiert in Nr. 7 und 8).
10. Cline MG et al.: *2021 AAHA Nutrition and Weight Management Guidelines*, Tabelle 8 (unter RER Diätfutter).
11. Flanagan J et al. 2018 (PLoS ONE), Armstrong PJ 2011 (WSAVA), NRC 2006, WSAVA-Merkblatt Leckerlis 2025:
    siehe `docs/sicherheitsgrenzen.md`.
12. *An investigation of feeding instructions on cat food labels in Belgium and comparison with European
    industry energy intake recommendations*, Vet Record, online 31.05.2026, doi:10.1002/vetr.70802:
    Fütterungsempfehlungen auf Packungen sind ein Startwert, Halter müssen anpassen.
13. Beleg für „manches Nassfutter ist Ergänzungsfutter“: Händlerangaben zu Applaws (Dose in Brühe) und Almo Nature
    HFC (04.11.2026). Marken stehen nicht im App-Text.
