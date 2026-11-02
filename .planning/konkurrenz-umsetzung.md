# Umsetzung aus dem Konkurrenz-Check (02.11.2026)

Grundlage: `Desktop\Kilossos-Geschaeftsidee\konkurrenz-2026-11-02.md` (Firecrawl: Webseiten/Store-Texte, Apify: 11 Play-Bewertungen).
Status: **Vorschlag, wartet auf Stefans Freigabe.**

## A. Übernehmen (passt zu den Entscheidungen)

| # | Was | Warum (Quelle) | Aufwand |
|---|---|---|---|
| A1 | **Mahlzeit nachträglich ändern** (Uhrzeit, Gramm, Sorte) statt nur löschen | Kritik an MeowFit (Bewertung, 3 Sterne) | klein |
| A2 | ✅ 0.12.0 **BCS vom Tierarzt in der Freigabe** (Feld „BCS 1–9“, optional MCS) und im Verlauf/PDF | BCS ist bei allen Konkurrenten zentral; bei uns legt ihn nur der Tierarzt fest. Datenformat ändert sich → alte Sicherungen müssen lesbar bleiben (Skill `migration`) | mittel |
| A3 | ✅ 0.12.0 **Erklärseite „Was ist der BCS?“** (9 Stufen in Worten, Quelle WSAVA), ausdrücklich ohne Selbst-Einstufung und ohne Mengenvorschlag | Cat Weight Kit: BCS-Anleitung ist das meistgelobte Merkmal („dachte, sie ist nur flauschig“) | mittel, Text vorher von Stefan/Tierarzt prüfen |
| A4 | **Klartext statt Lücke:** Auf „Heute“ ohne Freigabe und in der Willkommensseite erklären, *warum* Kilossos keine Kalorien vorschlägt (MeowFit-Bewertung: Vorschlag = Höchstwert → Überfütterung) | macht die Sicherheitsregel zum Vorteil | klein |
| A5 | **Vorher/Nachher-Foto am Gewichtseintrag** (optional, 1 Foto je Wägung, klein gerechnet) | Cat Weight Kit: Fortschrittsfotos; passt zur Marketing-Idee Vorher-Nachher | mittel; Risiko Speicherplatz (Handy-Speicher der Web-App ca. 5 MB) → max. 1 Foto pro Woche, 256 px |
| A6 | **Futterliste Runde 2** (30–50 Sorten) priorisieren | MeowFit-Kritik: Werte von der Dose abtippen ist mühsam | groß, eigene Sitzung |
| A7 | **Logo mit echtem Kito-Kopf**, nicht „helle Katzensilhouette auf Orange“ | MeowFit-Symbol zu ähnlich | wartet auf Foto |

## B. Nicht übernehmen (widerspricht Entscheidungen oder bringt Risiko)

| Was die anderen haben | Warum nicht |
|---|---|
| App berechnet Kalorienziel selbst (MeowFit, Cat Weight Kit) | Entscheidung 01.11.: ohne Freigabe keine Mengenvorschläge. Gerade die MeowFit-Kritik zeigt das Risiko. |
| BCS-Quiz zur Selbst-Einstufung + Idealgewicht-Schätzer | medizinische Einschätzung durch Laien; führt direkt zu selbst gewählten Zielen. Höchstens Erklärung (A3). |
| Teilen mit Familie/Tierarzt per Einladung (Pet Weight Tracker) | braucht Server und Konto; Entscheidung: Daten nur auf dem Gerät. Ersatz: PDF und Sicherungsdatei. |
| Push-Erinnerungen | ohne Server in der Web-App unzuverlässig (bewusst weggelassen); kommt ggf. mit der Play-Store-Fassung. |
| Barcode-Scanner | braucht Kamera + große Produktdatenbank; erst nach Futterliste Runde 2 prüfen. |
| kg/lb-Umschaltung | Start nur Deutschland (bewusst weggelassen). |

## Reihenfolge (Vorschlag)

0.11.0: A1 + A4 (klein, sofort spürbar) → 0.12.0: A2 + A3 (Datenformat, Text vorher prüfen) → A5 → A6 eigene Sitzung → A7 sobald Foto da.
