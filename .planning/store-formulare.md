# Store-Formulare und Rechtslage Tier-Software (Recherche 04.11.2026)

Ergänzt `.planning/store-luecken.md` (Punkte 4 und 5). **Keine Rechtsberatung.** Punkte mit ⚖️ vor dem Store bestätigen lassen.
Alle Quellen abgerufen am 04.11.2026.

## 1. Health-Apps-Erklärung in der Play Console

- Pflicht für **jede** App, auch im geschlossenen Test, auch ohne Gesundheitsfunktionen.
  Quelle: https://support.google.com/googleplay/android-developer/answer/14738291
- Die Kategorien sind auf Menschen zugeschnitten. Google sagt nirgends, wie Tier-Apps antworten sollen (Suche ohne Treffer).
- Passende Kategorie, wenn man es auf Tiere überträgt: **„Nutrition and Weight Management“**
  („tracking dietary intake, … managing diets, and supporting weight loss or weight management goals“).
  Beim BCS/MCS vom Tierarzt ließe sich auch „Diseases and Conditions Management“ denken, passt aber schlechter (Kilossos verwaltet keine Krankheit).
- **„Medical Device Apps“ nicht ankreuzen:** Die Zusatzpflichten (SRN, UDI-DI, eIFU) gelten für Apps unter der EU-MDR/IVDR. Die gilt nur für Menschen (siehe Punkt 3).

**Empfehlung:** „Nutrition and Weight Management“ angeben, nicht „keine Gesundheitsfunktionen“.
- **Warum:** Kilossos zeichnet Gewicht und Futter auf und begleitet eine Diät. „Keine Gesundheitsfunktionen“ wäre angreifbar,
  und Google prüft die Angabe beim Review. Zu viel anzugeben schadet kaum, zu wenig kann zur Ablehnung führen.
- **Risiko:** Mit Gesundheitsfunktionen prüft Google strenger auf irreführende Aussagen. Kilossos ist darauf vorbereitet:
  „kein Medizinprodukt, ersetzt keinen Tierarzt“ steht schon in der App, Grenzwerte mit Quelle.
- Ob nach dem Ankreuzen Zusatzfragen kommen, sieht man erst in der Console (Seite 2 des Formulars). Beim Ausfüllen hier nachtragen.

## 2. Formular „Datensicherheit“ (Data safety): Antworten als Entwurf

Grundlage: https://support.google.com/googleplay/android-developer/answer/10787469
- „Collect“ heißt laut Google: Daten werden **aus der App vom Gerät übertragen**.
  Ausdrücklich nicht anzugeben: Daten, die **nur auf dem Gerät** verarbeitet werden.
- Gewicht, Futter, Mahlzeiten, Fotos, Profil, Freigaben bleiben im Speicher des Browsers (localStorage). Die Sicherungsdatei speichert der Nutzer selbst.
  Der PDF-Bericht entsteht auf dem Gerät. Kilossos hat kein Konto, keinen Server mit Datenbank, keine Analyse, keine Werbung und keine Fremd-Bibliotheken (SDKs).

| Frage | Antwort-Entwurf |
|---|---|
| Erhebt oder teilt die App erforderliche Nutzerdaten? | **Nein** |
| Daten verschlüsselt übertragen? | entfällt bei „Nein“ (die App lädt nur über HTTPS) |
| Können Nutzer das Löschen ihrer Daten verlangen? | entfällt bei „Nein“; in der App: „Mehr“ → „Alle Daten löschen“ |

**Offener Punkt (klein):** Die Server von GitHub Pages (später: der eigenen Domain) speichern beim Laden der App technische Protokolle
mit IP-Adresse. Das macht der Webhoster, nicht die App, und es wird nicht zur Ortung oder Profilbildung genutzt.
Nach Googles Definition gilt eine IP-Adresse nur als „ungefährer Standort“, wenn daraus ein Ort abgeleitet wird.
Darum „Nein“, aber den Hoster in der Datenschutzerklärung nennen (ist schon so, `datenschutz.html`). ⚖️ leicht: beim Umzug auf die eigene Domain
einen Hoster ohne oder mit kurzer Protokoll-Speicherung wählen und in der Datenschutzerklärung nachziehen.

**Wichtig für später:** Kommt je eine Funktion mit Server dazu (z. B. Futterdatenbank online, Absturzberichte, Spenden-Knopf mit Zahlungsanbieter),
muss dieses Formular neu ausgefüllt werden.

## 3. Ist Kilossos ein Medizinprodukt für Tiere? ⚖️ leicht

- **EU-MDR (2017/745)** gilt nur für Produkte zur Anwendung beim Menschen. Erwägungsgrund 19 nimmt dazu Software für
  „Lebensstil und Wohlbefinden“ aus. Quelle: https://eur-lex.europa.eu/legal-content/DE/TXT/PDF/?uri=CELEX:32017R0745
- **Aber:** In Deutschland gibt es seit dem 28.01.2022 „veterinärmedizintechnische Produkte“ (VMTP) im **Tierarzneimittelgesetz, § 3 Abs. 3 TAMG**.
  Quellen: https://www.bvl.bund.de/VMTP.html und https://www.gesetze-im-internet.de/tamg/__3.html
- Was § 3 Abs. 3 TAMG erfasst (Nr. 1 bis 5): Gegenstände mit Tierarzneimittel, tierärztliche Einmal-Instrumente,
  Gegenstände, die **in den Tierkörper eingebracht** werden, Verbandstoffe und Nahtmaterial, Stoffe für Tests (z. B. Testsera).
  **Software steht nicht darin.** Alles setzt einen Gegenstand oder Stoff am oder im Körper voraus.
- Ob ein Produkt darunter fällt, entscheidet im Zweifel die **Landesbehörde am Sitz des Anbieters** (für Oldenburg: Niedersachsen, LAVES).
- **Einschätzung:** Kilossos ist wahrscheinlich kein VMTP und kein Tierarzneimittel. Der Satz in der App („kein Medizinprodukt“) bleibt richtig.
  Die frühere Begründung in `store-luecken.md` („MDR gilt nicht für Tiere“) war zu knapp: Das TAMG ist das passende Gesetz, es erfasst Software nur nicht.
- Daraus folgt für Texte (Store, Willkommensseite): keine Heilversprechen („heilt“, „behandelt“, „diagnostiziert“). Kilossos „begleitet“ eine Abnahme,
  die der Tierarzt festlegt. So steht es heute schon da.
- Für die Fachleute-Prüfung (Haftungsabsatz) diese Fundstelle mitgeben.

## 4. Was das für die App bedeutet

- Keine Änderung an der App nötig.
- Store-Texte (Entwurf folgt) nach diesen Regeln schreiben: begleiten statt behandeln; „kein Medizinprodukt“ in der langen Beschreibung.
- In der Play Console: Kategorie vermutlich „Lifestyle“ (eine eigene Haustier-Kategorie ist mir bei Google Play nicht bekannt, beim Anlegen prüfen); Health-Erklärung „Nutrition and Weight Management“; Datensicherheit „Nein“.
