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
