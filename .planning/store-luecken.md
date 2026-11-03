# Lücken-Check vor dem Store (Stand 03.11.2026)

Ziel: Was fehlt zwischen Version 0.19.0 und einer Fassung, die in den Google Play Store darf?
Nur Liste, noch kein Bau. **Keine Rechtsberatung:** Die Rechtspunkte sind eine Checkliste mit Quellen.
Punkte mit ⚖️ vor dem Store von jemandem mit Fachwissen bestätigen lassen.

## Entscheidungen (03.11.2026)

- **Anschrift im Impressum:** Impressum-Service mit ladungsfähiger c/o-Anschrift (Pflicht nach § 18 MStV gilt als sicher;
  c/o laut eRecht24 zulässig, wenn Zustellung und Weiterleitung wirklich klappen). Anbieter noch wählen:
  nachweislich ladungsfähig, Weiterleitung mit Frist, kein Postfach. Bis dahin Impressum-Seite mit Platzhalter, nicht veröffentlichen.
- **Lizenz:** GPL-3.0 (quelloffen; Weiterverwendungen müssen ebenfalls offen bleiben).
- **Adresse der App:** eigene Domain. Umzug **vor** Testbeginn, weil Gerätedaten an die Adresse gebunden sind
  (Nutzer der alten Adresse brauchen Sicherung speichern → einlesen).
- **Kontakt-E-Mail:** eigene Kilossos-Adresse, nicht die private.

## Was schon da ist

- Hinweis „ersetzt keinen Tierarzt, kein Medizinprodukt“ auf der Willkommensseite und unter „Über Kilossos“.
- Hinweis zu kranken Katzen und „frisst einen Tag nicht → sofort zum Tierarzt“.
- Kurzer Datenschutz-Satz unter „Über Kilossos“ (keine Anmeldung, keine Cloud, keine Auswertung).
- Die App lädt nichts von fremden Servern: keine Schriften, keine Skripte, kein Tracking von außen.
  Einziger Abruf ist die Demo-Datei aus dem eigenen Ordner. Links zu Shops werden nur angezeigt.
- Alle Funktionen aus der Liste „Fertig für den Store“ in CLAUDE.md sind gebaut.

## Lücken

### 1. Datenschutzerklärung fehlt (Pflicht bei Google Play) – Aufwand klein bis mittel
- Google Play verlangt sie für **jede** App, auch ohne Daten: Link in der Play Console **und** Link oder Text in der App.
  Sie soll den App-Namen und Angaben zum Anbieter enthalten.
  Quelle: support.google.com/googleplay/android-developer/answer/10144311 und answer/9859455.
- Inhalt passt zur App, ist also kurz: Daten nur auf dem Gerät, Sicherungsdatei liegt beim Nutzer,
  „Alle Daten löschen“ unter „Mehr“, keine Weitergabe.
- **Was oft übersehen wird:** Die App wird über GitHub Pages ausgeliefert. GitHub speichert dabei Server-Protokolle
  mit IP-Adressen (Quelle: GitHub General Privacy Statement). Das muss in die Erklärung, solange die App von dort lädt.
- Bauen: eigene Seite in der App (unter „Mehr“) plus eine öffentliche Fassung unter einer festen Adresse für die Play Console.
- Dazu gehört das Formular „Datensicherheit“ in der Play Console (Antwort: keine Daten erhoben, keine geteilt).

### 2. ⚖️ Impressum / Anbieterangaben fehlen – Aufwand klein, Entscheidung groß
- § 18 Abs. 1 Medienstaatsvertrag: Wer Telemedien anbietet, die **nicht ausschließlich persönlichen oder familiären Zwecken** dienen,
  muss **Name und Anschrift** angeben. Eine App für alle im Store ist nicht mehr nur privat.
  Quelle: gesetze-bayern.de/Content/Document/MStV-18.
- § 5 DDG (volles Impressum) gilt für „geschäftsmäßige“ Angebote. Ob eine dauerhaft kostenlose Hobby-App darunter fällt,
  ist umstritten (eRecht24 sagt ja, andere sagen nein). ⚖️
- **Folge für dich:** Deine Postanschrift wird öffentlich sichtbar, in der App, auf der Webseite und im Store.
  Möglicher Ausweg: eine ladungsfähige Anschrift über einen Impressum-Service. Vorher klären, ob das für dich zulässig ist. ⚖️
- Auch die Webseite stefanpude.github.io/Kilossos/ braucht dann diese Angaben.

### 3. ⚖️ Gewerbetreibenden-Status bei Google Play – Aufwand klein, Entscheidung nötig
- Jedes Entwicklerkonto muss angeben, ob es gewerblich ist. Neue Konten **sofort bei der Erstellung**, bestehende bis 01.02.2027.
  Quelle: support.google.com/googleplay/android-developer/answer/17594752.
- Kriterien laut Google: Einnahmeabsicht (Kauf, In-App-Käufe, Werbung), Rechtsform, D-U-N-S-Nummer.
  Kilossos hat nichts davon → spricht für **„nicht gewerblich“**.
- Wer „nicht gewerblich“ angibt, bei dem zeigt Google im EWR an, dass Verbraucherrechte nicht gelten.
- Falsche Angabe kann zur Sperre des ganzen Kontos führen. **Risiko:** Später Spenden, Werbung oder ein Bezahl-Plus
  würden den Status ändern. Dann ist die Angabe zu aktualisieren.
- Bei „gewerblich“ würden Telefonnummer und Adresse im Store öffentlich.

### 4. Erklärung zu Gesundheits-Apps in der Play Console – Aufwand klein
- **Alle** Apps im Store, auch im geschlossenen Test, müssen die „Health apps declaration“ ausfüllen.
  Quelle: support.google.com/googleplay/android-developer/answer/14738291.
- Zu klären: Fällt eine Tier-App unter „Gesundheit“? Wahrscheinlich nein, Kategorie eher „Haustiere“/„Lifestyle“. Beim Ausfüllen prüfen.

### 5. ⚖️ Haftung – Aufwand klein (Text), Prüfung nötig
- Der Hinweis „ersetzt keinen Tierarzt“ ist da. Es fehlen kurze **Nutzungsbedingungen** mit Haftungshinweis
  (Rechenwerte ohne Gewähr, Futterwerte aus Herstellerangaben/Händlern, bei Abweichung gilt die Packung).
- **Neu ab 09.12.2026:** Die EU-Produkthaftungsrichtlinie (2024/2853) zählt Software als Produkt. Ausgenommen ist
  **freie und quelloffene Software, die außerhalb einer Geschäftstätigkeit** entwickelt oder geliefert wird.
  Quelle: eur-lex.europa.eu, OJ:L_202402853.
- **Was mir auffällt:** Das Repo ist öffentlich, hat aber **keine Lizenz**. Rechtlich ist es damit nicht „frei und quelloffen“,
  sondern alle Rechte bleiben bei dir. Eine Open-Source-Lizenz (z. B. MIT) könnte für die Ausnahme wichtig sein. ⚖️
  Nebenwirkung: Jeder dürfte den Code dann kopieren und weiterverwenden, auch kommerziell.
- Medizinprodukte-Recht (MDR) gilt nur für Produkte für Menschen, für Tier-Apps nicht. Der Satz „kein Medizinprodukt“ ist also richtig.

### 6. Verpacken als Android-App – Aufwand mittel, technischer Haken
- Üblicher Weg: Trusted Web Activity (Werkzeug Bubblewrap oder PWABuilder). Ohne Prüfdatei zeigt die App oben eine Adresszeile.
- **Haken:** Die Prüfdatei `assetlinks.json` muss unter `/.well-known/assetlinks.json` an der **Wurzel** der Domain liegen.
  Kilossos liegt aber unter `stefanpude.github.io/Kilossos/`. Die Wurzel gehört zu einem eigenen Repo `stefanpude.github.io`.
  Quelle: developer.android.com, Trusted Web Activities Quick Start Guide.
- Lösungen: (a) zweites Repo `stefanpude.github.io` nur für die Prüfdatei, (b) eigene Domain (kostet ca. 10–15 €/Jahr,
  wirkt im Store seriöser, Impressum/Datenschutz hätten feste Adresse).
- Für den Store außerdem: Paketname festlegen (z. B. `io.github.stefanpude.kilossos`, später nicht mehr änderbar),
  Signaturschlüssel sicher aufbewahren (Verlust = keine Updates mehr).

### 7. Öffentliche Texte ohne Persönliches – Aufwand klein
- `docs/sicherheitsgrenzen.md` nennt Kito mit Gewicht und „von einer KI verfasst … hat Kito nie untersucht“.
  Für Tierärzte und Nutzer eine neutrale Fassung (Beispielkatze) schreiben, die Kito-Fassung privat behalten.
  Die App verlinkt diese Datei direkt (index.html, „Welche Grenzen gelten?“).
- Die Willkommensseite nennt Kitos Gewicht (9,32 kg). Das ist gewollt (Geschichte), nur bewusst entscheiden.
- Offene Fragen zur Willkommensseite: `.planning/willkommensseite.md` (Ton, Länge, wieder aufrufbar, Zielgruppe).

### 8. Store-Eintrag – Aufwand mittel (später, mit Skill `aso`/`copywriting`)
- Kurz- und Langbeschreibung, Screenshots, Funktionsgrafik 1024×500, Symbol 512 px (vorhanden), Kontakt-E-Mail
  (wird öffentlich: eigene Adresse für Kilossos anlegen statt der privaten).
- Inhaltsfreigabe (Altersfreigabe-Fragebogen), Zielgruppe (nicht für Kinder).

## Vorschlag Reihenfolge

1. **Entscheidungen von dir** (kein Bau): Adresse öffentlich ja/nein bzw. Impressum-Service, Lizenz ja/nein,
   eigene Domain ja/nein, eigene Kontakt-E-Mail. ⚖️-Punkte 2, 3, 5 kurz von Fachleuten prüfen lassen.
2. **Bau, klein:** Seiten „Datenschutz“, „Impressum“, „Nutzungsbedingungen“ unter „Mehr“ plus öffentliche Fassung.
   Neutrale Fassung von `docs/sicherheitsgrenzen.md`.
3. **Bau, mittel:** Verpacken (TWA), Prüfdatei, Paketname, Schlüssel.
4. Store-Eintrag und Formulare in der Play Console, danach geschlossener Test.
