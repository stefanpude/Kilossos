# Ablaufplan geschlossener Test bei Google Play (Stand 06.11.2026)

Für Stefan. Das Blatt für die Tester ist `docs/tester-hinweise.md` (mit Tagesplan).
Repo ist öffentlich: **keine Namen, E-Mail-Adressen oder Telefonnummern von Testern in diese Datei.** Die Liste der
Zusagen liegt nur privat (z. B. in Obsidian), nie im Repo.

## Googles Regeln (geprüft 06.11.2026, vor dem Start erneut prüfen)

Quellen: support.google.com/googleplay/android-developer/answer/14151465 (Anforderungen neuer privater Konten) und
answer/9845334 (geschlossenen Test einrichten), beide abgerufen 06.11.2026.

- Gilt für private Entwicklerkonten, die nach dem 13.11.2023 angelegt wurden: **mindestens 12 Tester, die 14 Tage am
  Stück angemeldet sind.** Wer sich abmeldet und wieder anmeldet, fängt bei Tag 1 an.
- Tester brauchen ein **Android-Handy und ein Google-Konto**. Sie melden sich über einen Teilnahme-Link an und
  installieren die App aus dem Play Store. iPhone-Nutzer können nicht mitmachen.
- Tester kommen über eine **E-Mail-Liste** oder eine **Google Group** in den Test.
- Der Teilnahme-Link erscheint erst, wenn die Testversion veröffentlicht ist (erste Prüfung: „einige Stunden“).
- Danach in der Play Console **„Produktionszugriff beantragen“**. Google fragt nach: wie leicht Tester zu finden waren,
  ob alle Funktionen genutzt wurden, eine Zusammenfassung der Rückmeldungen und wie sie gesammelt wurden, Zielgruppe,
  Mehrwert, geschätzte Installationen im ersten Jahr, Änderungen nach dem Test und warum die App bereit ist.
  Prüfung meist höchstens 7 Tage. Zu wenig Tester oder zu wenig Nutzung → Google verlangt weitere Tests.

## Phase 0: Voraussetzungen (vor der Tester-Suche)

- [ ] Kito mindestens 8 Wochen sicher abgenommen, Tierarzt hat auf die Grenzen geschaut (CLAUDE.md „Veröffentlichung“)
- [ ] Impressum mit ladungsfähiger Anschrift, Datenschutzerklärung, Nutzungsbedingungen fertig (`store-luecken.md`)
- [ ] Eigene Domain, Kilossos-Kontakt-E-Mail (wird der Rückmelde-Kanal im Test)
- [ ] Google-Play-Entwicklerkonto, Händlerstatus geklärt (`store-luecken.md` Punkt 3)
- [ ] App mit Capacitor verpackt (`verpacken-google-play.md`, vorher neu schreiben)
- [ ] Formulare in der Play Console: Datensicherheit, Health-Erklärung, Inhaltsfreigabe (`store-formulare.md`)
- [ ] Store-Eintrag mit Texten und Bildern (`store-texte.md`), Seite „So nutzt du Kilossos“ (Ideen-Tafel „kleine Anleitung“)

## Phase 1: Tester suchen (ca. 3–4 Wochen vor dem Start)

- **15 Zusagen** anpeilen (12 + 3 Reserve). Eine übergewichtige Katze ist keine Bedingung (Google prüft Nutzung,
  nicht Zielgruppe).
- Wo: Familie, Freunde, Nachbarn, Katzen-Gruppen in der Region.
- Bei jeder Zusage klären: Android-Handy? Google-Konto? 14 Tage installiert lassen ist okay?
- **Empfehlung: Google Group statt E-Mail-Liste.** Tester treten selbst bei; Stefan muss keine Adressen abtippen
  und sammelt weniger Daten (DSGVO). Kurz sagen, wofür die Adresse genutzt wird: nur für den Test.
- Startdatum festlegen und allen vorher sagen.

## Phase 2: Start (Tag 0)

- [ ] Testversion in „Geschlossener Test“ hochladen, Tester-Gruppe und Rückmelde-E-Mail eintragen
- [ ] Warten, bis Google sie freigibt (einige Stunden), Teilnahme-Link kopieren
- [ ] An alle schicken: Teilnahme-Link + `docs/tester-hinweise.md` (als PDF oder Text)
- [ ] Am Abend in der Play Console nachsehen: Wie viele haben sich angemeldet? Unter 12 → Reserve nachholen.
  **Die 14 Tage laufen erst, wenn 12 gleichzeitig angemeldet sind.**

## Phase 3: Die 14 Tage

| Tag | Tester (steht im Blatt) | Stefan |
|---|---|---|
| 1 | installieren, Katze und Futter anlegen, Demo ansehen | Anmeldungen zählen, Fragen beantworten |
| 2–6 | an mindestens 3 Tagen Mahlzeiten eintragen | — |
| 3 | — | kurze Nachricht: „Klappt alles? Fragen?“ |
| 7 | Katze wiegen und eintragen | Erinnerung schicken: wiegen, App drauflassen |
| 8–13 | weiter eintragen, Sicherung speichern | Fehler sammeln, dringende Fehler beheben (neue Testversion = wieder einige Stunden Prüfung) |
| 12 | — | Erinnerung: Fragebogen kommt, App bitte nicht löschen |
| 14 | wiegen, Fragen beantworten | Rückmeldungen einsammeln |

- Rückmeldungen und Screenshots an die Kilossos-E-Mail. **Keine Sicherungsdateien schicken lassen**
  (enthalten Daten über Tier und Halter).
- Jeden Fund kurz notieren: wer (nur Kürzel), Handy, was, Screenshot ja/nein, behoben in Version …

## Phase 4: Auswertung und Antrag (ab Tag 15)

- [ ] Rückmeldungen nach „Fehler / unklar / Wunsch“ sortieren, Fehler beheben
- [ ] Antworten für den Antrag vorbereiten (Fragen oben), Zahlen ehrlich: wie viele Tester, wie oft genutzt
- [ ] „Produktionszugriff beantragen“, Prüfung bis ca. 7 Tage
- [ ] Testern danken, Bescheid geben, wenn die App im Store ist

## Offen

- Startdatum (frühestens nach Phase 0, realistisch nicht vor Januar 2027)
- ~~Ob vorher ein Web-Vortest im Freundeskreis läuft~~ Ja (07.11.): Web-Vortest mit Bekannten über die GitHub-Adresse,
  Start nach dem Tierarzttermin am 13.11. Blatt: `docs/tester-hinweise-web.md`. Zählt nicht für Google; die Vortester
  am Ende fragen, ob sie beim Google-Test wieder mitmachen. Während des Vortests Änderungen sammeln und seltener
  hochladen, weil jede Änderung sofort bei allen ankommt.
