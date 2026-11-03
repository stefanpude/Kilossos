# Futter-Recherche: Kitos Sorten (Stand 01.11.2026)

Ersatz für die Packungsfotos. Die Werte stammen von Händlerseiten, weil die Herstellerseiten keine Datenblätter
zeigen. **Bei Abweichung gilt die Packung** (Entscheidung aus der Grilling-Sitzung).

## Sheba Fresh & Fine in Sauce, 50-g-Portionsbeutel

In Deutschland gibt es zwei Rezepturen mit unterschiedlichen Nährwerten. Welche Kito bekommt, steht auf dem
Umkarton (Name oder EAN).

| | A: „Huhn, Geflügel & Truthahn in Sauce“ (Megapack) | B: „Huhn, Truthahn & Ente“ / „Huhn, Rind & Ente“ (Multipack) |
|---|---|---|
| EAN | 4770608260286 | z. B. 4770608266356 |
| **Energie** | **71 kcal/100 g = 35,5 kcal je Beutel** | **77 kcal/100 g = 38,5 kcal je Beutel** |
| Rohprotein | 7,7 % | 7,9 % |
| Rohfett | 3,9 % | 4,4 % |
| Rohasche | 1,8 % | 1,4 % |
| Rohfaser | 0,2 % | 0,3 % |
| Feuchtigkeit | 84,7 % | 84,0 % |
| Nachrechnung NRC 2006 (`kcalAusBestandteilen`) | 70,7 kcal – passt | 76,6 kcal – passt |
| Zusatzstoffe je kg | Taurin 570 mg, Kupfer 2,6 mg, Jod 0,41 mg, Eisen 14,1 mg, Mangan 2,2 mg, Zink 13,7 mg; keine Vitamine angegeben | Vitamin D3 200 IE, Taurin 573 mg, Kupfer 1,3 mg, Jod 0,34 mg, Eisen 16,8 mg, Mangan 3,4 mg, Zink 16 mg |
| Zusammensetzung | Fleisch und tierische Nebenerzeugnisse (u. a. 4 % der genannten Fleischsorte im Häppchen; Häppchen = 43 % des Produkts), pflanzliche Nebenerzeugnisse, Mineralstoffe, pflanzliche Eiweißextrakte, Zucker | ähnlich |
| Art | Alleinfuttermittel | Alleinfuttermittel |
| Fütterungsempfehlung (Erhaltung) | 3 kg: 4–5 Beutel · 4 kg: 5–6 · 5 kg: 6–7 pro Tag | gleich |

Quellen: [zooplus.de, Sheba Fresh & Fine 50 g](https://www.zooplus.de/shop/katzen/katzenfutter_dose/sheba/sheba_freshfine/2088614)
(alle Varianten mit Analysewerten und kcal), [dm.de, Multipack Huhn, Truthahn & Ente](https://www.dm.de/p/d/3046473/)
(77 kcal), [Rossmann, Megapack Huhn, Geflügel & Truthahn](https://www.rossmann.de/de/tier-sheba-fresh-und-fine-in-sauce-huhn-gefluegel-und-truthahn-megapack/p/4770608260286).
Abgerufen 01.11.2026.

**Kito bekommt Rezeptur A** (von Stefan am 01.11.2026 bestätigt). Die App rechnet seit Version 0.5.0 mit
71 kcal/100 g; vorher standen dort 77 kcal (Rezeptur B). Frühere Tage werden automatisch neu berechnet.

## Purina ONE Light (Trockenfutter)

| | |
|---|---|
| Energie | auf deutschen Seiten nicht angegeben; **327,5 kcal/100 g** laut purina.co.uk (bereits in der App) |
| Rohprotein / Rohfett / Rohfaser / Rohasche | 37,0 % / 9,5 % / 6,0 % / 7,5 % (Omega-3 0,1 %, Omega-6 2,0 %) |
| Zusammensetzung | Huhn 15 % (mit Knochen, Fleisch, Haut), Weizen 14 %, getrocknetes Geflügelprotein, Mais, Weizengluten, Sojamehl, Maisproteinmehl, getrocknete Rübenschnitzel, getrocknete Pflanzenfasern, Zichorienwurzel 2 %, tierische Fette, Mineralstoffe, Proteinhydrolysat, Hefen |
| Zusatzstoffe je kg | Vitamin A 31.000 IE, D3 1.000 IE, E 400 mg, C 140 mg, Taurin 700 mg, Eisen-(II)-sulfat 110 mg, Calciumjodat 1,8 mg, Kupfer-(II)-sulfat 12 mg, Mangansulfat 43 mg, Zinksulfat 100 mg, Natriumselenit 0,12 mg; Antioxidantien |
| Art | Alleinfuttermittel, „30 % weniger Fett als PURINA ONE Adult“ |
| Fütterungsempfehlung (Erhaltung) | 4–6 kg: 45–70 g · 6–8 kg: 70–90 g · 8–10 kg: 90–115 g pro Tag |

Quelle: [zooplus.de, PURINA ONE Light](https://www.zooplus.de/shop/katzen/katzenfutter_trockenfutter/purina_one/purinaone_spezialfutter/194144),
abgerufen 01.11.2026.

## Was das für Kito bedeutet

- Beide Sorten sind **Alleinfuttermittel für die Erhaltung**, kein Diätfutter. Ihre Fütterungsempfehlungen gelten
  für das Halten des Gewichts, nicht für eine Abnahme.
- Sheba (Rezeptur A) nennt **keine zugesetzten Vitamine**. Das ist für ein Alleinfutter zulässig, verstärkt aber den
  Punkt aus `sicherheitsgrenzen.md` (B4): Bei stark gekürzten Mengen ist die Versorgung mit Mikronährstoffen nicht mehr
  durch die Deklaration abgesichert. → Frage 5 an den Tierarzt (Diätfutter).
- Eiweiß je 100 kcal: Sheba A ≈ 10,8 g, Sheba B ≈ 10,3 g, Purina One Light ≈ 11,3 g.

---

# Kilossos-Futterliste, erste Runde (Stand 02.11.2026)

Die Liste steht in `js/futterliste.js`, die Tests in `tests/futterliste.test.js`. In der App: „Futter“ →
„Aus der Futterliste wählen“. Eine gewählte Sorte wird mit Quelle und Datum in die eigene Liste kopiert und kann dort
jederzeit geändert werden. **Bei Abweichung gilt die Packung.**

**Prüfung:** Jeder kcal-Wert wurde mit der NRC-2006-Formel (`kcalAusBestandteilen`) aus den Analytischen Bestandteilen
nachgerechnet; bei Trockenfutter ohne Feuchteangabe mit 8 %. Der Test verlangt, dass Herstellerwerte höchstens 10 % von
der Nachrechnung abweichen. Wo kein kcal-Wert veröffentlicht ist, steht die Nachrechnung mit dem Status „geschätzt“.

| Sorte | Art | kcal/100 g | Status | NRC-Nachrechnung | Quelle |
|---|---|---|---|---|---|
| **Diätfutter vom Tierarzt** | | | | | |
| Royal Canin Vet. Satiety Weight Management | trocken | 304 | Hersteller | 306 | zooplus.de, royalcanin.com |
| Royal Canin Vet. Satiety Weight Management in Soße | nass | 60,7 | Hersteller | 62 | zooplus.de |
| Hill's PD Metabolic mit Huhn | trocken | 341 | Hersteller | 348 | zooplus.de |
| Hill's PD Metabolic mit Huhn | nass | 67,9 | Hersteller | 72 | zooplus.de |
| Purina PPVD OM Obesity Management | trocken | 340 | Hersteller | 335 | zooplus.de |
| Purina PPVD OM Obesity Management Huhn | nass | 75 | Hersteller | 74,5 | zooplus.de |
| **Light-Futter aus dem Handel** | | | | | |
| Royal Canin Light Weight Care | trocken | 338,2 | Hersteller | 329 | zooplus.ie (DE ohne kcal) |
| Royal Canin Light Weight Care in Soße | nass | 69 | geschätzt | 69 | zooplus.de |
| Hill's Science Plan Perfect Weight Huhn | trocken | 342,9 | Hersteller | 361 | hillspet.co.uk (DE ohne kcal) |
| Purina ONE Light | trocken | 327,5 | Hersteller | 346 | purina.co.uk (siehe oben) |
| **Supermarkt und Drogerie** | | | | | |
| Sheba Fresh & Fine – Huhn, Geflügel & Truthahn | nass | 71 | Hersteller | 70,7 | siehe oben |
| Sheba Fresh & Fine – Huhn, Truthahn & Ente | nass | 77 | Hersteller | 76,6 | siehe oben |
| Whiskas 1+ Frischebeutel | nass | 71 | Hersteller | 70,6 | zooplus.de |
| Felix So gut wie es aussieht in Gelee | nass | 75 | Hersteller | 74,6 | zooplus.de (kcal nur bei einer Sorte) |
| Gourmet Perle Erlesene Streifen | nass | 82 | geschätzt | 82 | zooplus.de |
| Kitekat Frischebeutel in Soße | nass | 73 | Hersteller | 72,9 | zooplus.de, dm.de, rossmann.de |
| animonda Carny Adult Rind | nass | 104 | geschätzt | 104 | zooplus.de |
| Whiskas 1+ mit Huhn | trocken | 363 | geschätzt | 363 | zooplus.de |
| Purina ONE Adult Huhn & Vollkorn | trocken | 380 | geschätzt | 380 | zooplus.de |
| **Leckerli** | | | | | |
| Dreamies mit Huhn | Leckerli | 416 | Hersteller | 410 | zooplus.de |

**Was auffällt (für Kito):**
- Diätfutter ist „verdünnter“: Die nassen Diätsorten haben 61–75 kcal/100 g und deutlich mehr Eiweiß je kcal
  (Purina OM nass ≈ 14 g Protein je 100 kcal, Sheba A ≈ 10,8 g). Das passt zu Frage 5 an den Tierarzt
  (Eiweiß ≈ 3,8 statt ≈ 5,2 g je kg Zielgewicht mit dem jetzigen Futter).
- animonda Carny ist fettreich: ≈ 104 kcal/100 g, fast 50 % mehr als Beutelfutter.
- Dreamies: ≈ 2 kcal pro Stück; 10 Stück ≈ 20 kcal, das sind schon 7 % von 290 kcal (Untergrenze ohne Freigabe).

**Offen für Runde 2 (auf 30–50 Sorten):** MAC's, Catz finefood, Hill's PD r/d und w/d, Royal Canin Light Weight Care in
Gelee, weitere Leckerlis (Whiskas Temptations, Felix Crispies), Eigenmarken von Lidl/Aldi (Coshida, Cachet),
Stichproben mit Packungsfotos von Stefan.

---

# Kilossos-Futterliste, zweite Runde (Stand 03.11.2026, Version 0.17.0)

22 neue Sorten, zusammen 42. Gleiche Prüfung wie in Runde 1. **Neu: Feld `ean`** (Strichcode-Nummern, freiwillig, Grundlage
für den späteren Scanner). Der Test prüft die Prüfziffer und dass keine EAN bei zwei Sorten steht.

**Regeln für EANs:**
- Nummern, die mit 2 beginnen (z. B. 2050000…), sind Hausnummern der Händler und stehen nicht auf der Packung. Sie werden nie übernommen.
- Eine EAN wird nur eingetragen, wenn eine zweite Quelle sie demselben Produkt zuordnet (Suche nach der Nummer selbst).
- Eine EAN gehört zu einer Packungsgröße. Welche, steht im Hinweis. Gleiche Rezeptur in anderer Größe hat eine andere EAN.

| Sorte | Art | kcal/100 g | Status | NRC-Nachrechnung | EAN | Quelle |
|---|---|---|---|---|---|---|
| Hill's Prescription Diet r/d Weight Reduction mit Huhn (trocken) | trocken | 314,9 | Hersteller | 332 | 0052742918709 | zooplus.de; EAN von fressnapf.de |
| Hill's Prescription Diet w/d Multi-Benefit mit Huhn (nass) | nass | 86 | geschätzt | 86 | 0052742053783 | fressnapf.de |
| Royal Canin Light Weight Care in Gelee | nass | 71,3 | Hersteller | 71 | – | zooplus.de |
| Purina ONE Sterilcat mit Huhn (trocken) | trocken | 370 | geschätzt | 370 | 8445290062802 | fressnapf.de, gleiche Werte auf zooplus.de |
| Royal Canin Sterilised 37 (trocken) | trocken | 364 | Hersteller | 367 | 3182550737593 | zooplus.de; Rohfaser und EAN von fressnapf.de |
| Hill's Science Plan Sterilised Cat Adult mit Huhn (trocken) | trocken | 357 | Hersteller | 380 | 0052742030272 | hillspet.de; EAN von fressnapf.de |
| Whiskas Sterile mit Huhn (trocken) | trocken | 368 | Hersteller | 361 | 5900951259418 | zoofaster.de |
| dm Dein Bestes Nassfutter Sensitive reich an Huhn | nass | 73 | geschätzt | 73 | 4058172100420 | dm.de |
| Rossmann Winston Feine Häppchen in Gelee | nass | 84 | geschätzt | 84 | 4305615274683 | rossmann.de |
| Gourmet Gold Feine Pastete | nass | 107 | geschätzt | 107 | 7613032985530 | fressnapf.de |
| MAC's Cat Rind & Hühnerherzen (Dose) | nass | 97 | geschätzt | 97 | 4027245008192 | fressnapf.de |
| Catz finefood Classic Rind & Kalb (Dose) | nass | 126 | geschätzt | 126 | – | fressnapf.de |
| MjAMjAM Saftiges Huhn an leckeren Möhrchen (Dose) | nass | 106 | geschätzt | 106 | 4260512870065 | fressnapf.de |
| animonda vom Feinsten Adult mit Huhn (Schale) | nass | 85 | geschätzt | 85 | – | fressnapf.de |
| Bozita Sterilised Häppchen in Sauce mit viel Huhn | nass | 73,4 | Hersteller | 73 | 7300330649232 | fressnapf.de (307 kJ/100 g) |
| Leonardo All Meat (Dose) | nass | 93 | geschätzt | 93 | – | bitiba.de |
| Almo Nature HFC Natural Huhn & Garnelen (Ergänzungsfutter) | nass | 90 | geschätzt | 90 | 8001154007589 | fressnapf.de |
| GranataPet Delicatessen Geflügel (trocken) | trocken | 396 | geschätzt | 396 | 4260165197229 | fressnapf.de |
| Whiskas Knuspertaschen Huhn & Käse | leckerli | 411 | Hersteller | 410 | – | fressnapf.de |
| Felix Crispies | leckerli | 394 | geschätzt | 394 | 7613038273495 | fressnapf.de |
| Catisfactions mit Huhn | leckerli | 438 | Hersteller | 427 | – | animalvalley.nl (Händler, deutsche Produktseite) |
| Vitakraft Cat Stick Geflügel & Leber | leckerli | 328 | geschätzt | 328 | 4008239601124 | fressnapf.de |

**Nicht aufgenommen:**
- Lidl Coshida und Aldi Cachet: Die offiziellen Seiten nennen keine Analysewerte, nur Blogs. → Packungsfotos von Stefan.
- Felix Fantastic: ist die Auslandsbezeichnung von „Felix So gut wie es aussieht“ (schon in der Liste).
- Hill's r/d nass, Whiskas Sterile nass, Felix Sterilised, Rossmann Winston trocken (Adult), Kitekat trocken: keine verlässliche Quelle gefunden.

**Was auffällt:**
- Hochwertiges Dosenfutter ist oft fettreich: Catz finefood Classic ≈ 126 kcal/100 g, MjAMjAM ≈ 106, Gourmet Gold ≈ 107,
  also bis fast doppelt so viel wie Beutelfutter (≈ 70).
- Ein Vitakraft Cat Stick (6 g) hat etwa 20 kcal. Das ist ungefähr die ganze Leckerli-Grenze (10 %) einer Katze mit 200 kcal am Tag.
- Almo Nature HFC ist Ergänzungsfutter, kein Alleinfutter. Das steht im Namen und im Hinweis.
- Die meisten Hersteller nennen keinen kcal-Wert. 15 der 22 neuen Werte sind deshalb „geschätzt“.

**Offen für Runde 3:** EANs für die Sorten aus Runde 1, Lidl/Aldi über Packungsfotos, weitere Geschmacksrichtungen auf Nachfrage.

# EANs für die Sorten aus Runde 1 (Stand 03.11.2026, Version 0.18.0)

13 der 20 Sorten haben jetzt EANs, zusammen 18 neue Nummern. Jetzt 29 von 42 Sorten mit EAN. Gleiche Regeln wie in Runde 2:
jede Nummer von einer zweiten Quelle demselben Produkt zugeordnet (Suche nach der Nummer selbst), keine Hausnummern mit 2…,
Packungsgröße im Hinweis. Die Analysewerte auf der Fundstelle wurden mit der Liste verglichen.

| Sorte | EAN | Packung | Fundstelle | Bestätigt durch |
|---|---|---|---|---|
| Royal Canin Veterinary Satiety (trocken) | 3182550768474 | 1,5 kg | fressnapf.de | petzo.net, amanpetshop.com |
| | 3182550815529 | 6 kg | fressnapf.de | pharmaleo.fr, proshop.se |
| Royal Canin Veterinary Satiety in Soße | 9003579006146 | 12 × 85 g | fressnapf.de | direct-vet.ie, parafarmaciapet.com |
| Royal Canin Light Weight Care (trocken) | 3182550706810 | 400 g | fressnapf.de | rozetka.com.ua, elmir.ua |
| | 3182550903929 | 3 kg | fressnapf.de | thevetshed.com.au, arukereso.hu |
| | 3182550902984 | 8 kg | fressnapf.de | zooline.az, petworlduae.com |
| Royal Canin Light Weight Care in Soße | 9003579308707 | 12 × 85 g | zoolini.be | petnpony.co.uk, vetapotek.dk |
| Hill's Science Plan Perfect Weight (trocken) | 0052742025827 | 2,5 kg | fressnapf.de | futterbutze.de, desjardins.fr |
| Purina ONE Light (trocken) | 8445290067319 | 750 g | fressnapf.de | propet.sk, ebay.de |
| Sheba Fresh & Fine Huhn, Geflügel & Truthahn | 4770608260286 | 50 × 50 g | fressnapf.de (stand schon im Hinweis) | Runde 1 |
| Whiskas 1+ Frischebeutel | 8410136025792 | 12 × 85 g Geflügel-Auswahl in Sauce | fressnapf.de | globalfmcgwholesale.com, merkandi.com |
| | 4008429170171 | 80 × 85 g Klassische Auswahl in Sauce | fressnapf.de | koelle-zoo.de |
| Felix So gut wie es aussieht in Gelee | 7613036894548 | 12 × 85 g Geschmacksvielfalt vom Land | fressnapf.de | zoolini.de, tiernahrungsprofi.de |
| Gourmet Perle Erlesene Streifen | 7613287882523 | 24 × 85 g in Sauce | fressnapf.de | rossmann.de, zoolini.ie |
| Kitekat Frischebeutel in Soße | 4008429158995 | 12 × 85 g Klassische Auswahl | fressnapf.de | e-zooo.com, merkandi.com |
| | 4008429158988 | 24 × 85 g Landpicknick | fressnapf.de | zoolini.ie, merkandi.us |
| | 4008429159015 | 24 × 85 g Bunte Vielfalt | fressnapf.de | merkandi.com, tiernahrungsprofi.de |
| Purina ONE Adult Huhn & Vollkorngetreide | 8445290062796 | 5,7 kg | lagerhaus.at | koelle-zoo.at, kaufland.de |
| Whiskas 1+ mit Huhn (trocken) | 5900951258572 | 1,9 kg | lagerhaus.at | trendyfoods.lu, ehgoo.de |

**Ohne EAN geblieben (7):**
- Hill's Metabolic trocken und nass: Fressnapf nennt andere Analysewerte (trocken 13 % statt 11,7 % Fett; nass nur als Mischpackung mit Meeresfisch, die große Packung hat eine Hausnummer). Erst klären, welche Rezeptur aktuell ist.
- Purina Pro Plan Veterinary Diets OM trocken und nass: keine deutsche Händlerseite mit EAN gefunden.
- Sheba Huhn, Truthahn & Ente: Fressnapf zeigt nur eine Hausnummer; die Nummer 4770608266356 aus Runde 1 ließ sich nicht bestätigen.
- animonda Carny Adult Rind: keine Nummer gefunden, die eindeutig zur Sorte Rind gehört.
- Dreamies mit Huhn: Fressnapf nennt je Packungsgröße andere Analysewerte (20 % und 31 % Protein), das passt nicht zusammen.

**Abweichung bei Sheba Huhn, Geflügel & Truthahn:** Fressnapf nennt für das Megapack (EAN 4770608260286) 40 kcal je 50-g-Beutel (80 kcal/100 g;
Protein 7,8 %, Fett 5,0 %, Asche 1,5 %, Faser 0,3 %, Feuchte 83,5 %). zooplus nennt weiter 71 kcal/100 g (Abruf 03.11.2026).
Die Liste bleibt bei 71, bis die Angabe auf dem Umkarton geprüft ist. Bei Abweichung gilt die Packung.

**Kleinere Abweichungen ohne Folgen:** Royal Canin Satiety in Soße bei Fressnapf 2,2 % Fett und 1,3 % Faser (Liste 2,3 und 1,1);
Whiskas 1+ bei Fressnapf 7,3 % Protein, 0,25 % Faser, 84,5 % Feuchte, 61 kcal je 85 g (Liste 7,5 / 0,35 / 84,8 / 60,4).
