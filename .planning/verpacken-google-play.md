# Kilossos für Google Play verpacken (Anleitung, Stand 04.11.2026)

Ergänzt `.planning/store-luecken.md` Punkt 6 und `.planning/store-formulare.md`. Noch nicht ausführen:
Voraussetzung ist die **eigene Domain** (Entscheidung 03.11.2026), weil die Prüfdatei an der Wurzel der Domain liegen muss.

Werkzeug: **Bubblewrap** von Google Chrome Labs. Es macht aus der Web-App eine Android-App („Trusted Web Activity“):
Die App öffnet Kilossos im Chrome-Motor ohne Adresszeile. Der Code bleibt die Web-App, Updates kommen weiter über die Webseite.
Quelle: https://github.com/GoogleChromeLabs/bubblewrap/blob/main/packages/cli/README.md (abgerufen 04.11.2026)

> **Überholt am 05.11.2026:** Die Play-Store-App soll abends an das Eintragen erinnern (`.planning/erinnerung-abends.md`,
> Teil 3). Das geht ohne Server nur mit lokalen Benachrichtigungen, deshalb wird mit **Capacitor** statt Bubblewrap
> verpackt. Diese Anleitung vor dem Verpacken neu schreiben. Folgen: Updates gehen durch die Prüfung bei Google Play,
> und die App hat ihren eigenen Speicher (Umzug von der Webseite per Sicherung). Die eigene Domain bleibt geplant
> (Webseite, Rechtstexte), ist für Capacitor aber keine technische Voraussetzung mehr (keine Prüfdatei nötig).
> Konto und Testphase unten gelten weiter.

## Vorher (einmalig)

1. **Domain** gekauft und GitHub Pages darauf umgestellt (eigene Anleitung, wenn es so weit ist).
   Dann liegt die App unter `https://<domain>/` und `manifest.webmanifest` unter `https://<domain>/manifest.webmanifest`.
2. **Google-Play-Entwicklerkonto** (einmalig 25 US-Dollar). Bei der Anlage „nicht gewerblich“ (siehe `store-luecken.md` Punkt 3).
   Neue private Konten brauchen vor der Veröffentlichung einen **geschlossenen Test mit mindestens 12 Testern über 14 Tage**.
3. **Node** ist da (v26). Bubblewrap installieren: `npm i -g @bubblewrap/cli`.
   Java (JDK) und Android-Werkzeuge lädt Bubblewrap beim ersten Start selbst herunter, wenn man zustimmt (mehrere GB).

## Bauen

1. Leeren Ordner **außerhalb** des Kilossos-Repos anlegen, z. B. `Desktop\Kilossos-Android`
   (dort entstehen der Signaturschlüssel und Android-Dateien; nichts davon gehört ins öffentliche Repo).
2. Darin: `bubblewrap init --manifest https://<domain>/manifest.webmanifest`
   Bubblewrap fragt die Werte ab. Vorschläge:
   - **Paketname (Application ID):** z. B. `de.kilossos.app` (passend zur Domain). **Später nie mehr änderbar.**
   - App-Name „Kilossos“, Startadresse `/`, Farben aus dem Manifest übernehmen.
   - Signaturschlüssel neu anlegen: Passwort in den Passwort-Manager, Schlüsseldatei (`android.keystore`) **doppelt sichern**
     (z. B. `Backups` und USB-Stick). **Ohne diesen Schlüssel gibt es nie wieder ein Update.**
3. `bubblewrap build` erzeugt `app-release-bundle.aab` (für Google Play) und eine `.apk` (zum Ausprobieren am eigenen Handy).

## Prüfdatei (Digital Asset Links)

Ohne Prüfdatei zeigt die App oben eine Adresszeile wie im Browser.
1. Google Play signiert die App zusätzlich mit einem eigenen Schlüssel („Play App Signing“).
   Dessen SHA-256-Fingerabdruck steht nach dem ersten Hochladen in der Play Console unter „App-Integrität“.
2. Beide Fingerabdrücke eintragen: `bubblewrap fingerprint add <SHA-256>` (einmal den eigenen, einmal den von Google).
3. `bubblewrap fingerprint generateAssetLinks` erzeugt `assetlinks.json`.
4. Diese Datei ins Kilossos-Repo nach `.well-known/assetlinks.json` legen.
   **Achtung GitHub Pages:** Ordner mit Punkt am Anfang veröffentlicht Pages nur, wenn im Repo eine leere Datei `.nojekyll` liegt
   (oder `_config.yml` mit `include: [".well-known"]`). Nach dem Hochladen prüfen: `https://<domain>/.well-known/assetlinks.json` muss die Datei zeigen.

## In der Play Console

- App anlegen, `.aab` in den **geschlossenen Test** hochladen, Tester per E-Mail-Liste einladen.
- Formulare: Datenschutzerklärung (Link auf die Domain), Datensicherheit „Nein“, Health-Erklärung „Nutrition and Weight Management“
  (Begründung in `store-formulare.md`), Altersfreigabe-Fragebogen, Zielgruppe „nicht für Kinder“, Kategorie vermutlich „Lifestyle“.
- Store-Eintrag: Texte (Entwurf folgt), Symbol 512 px, Funktionsgrafik 1024 × 500, mindestens 2 Handy-Screenshots.

## Offene Punkte (für Stefan)

- ~~**Symbol beim runden Zuschnitt**~~ entschieden 04.11.2026: eigene „maskable“-Fassung mit Rand (`icons/icon-512-maskable.png`, Foto auf 80 % verkleinert, Rand beige wie der Fotohintergrund). Im ungünstigsten Zuschnitt bleiben Kopf, beide Ohren und Napf ganz. Das normale Symbol `icons/icon-512.png` bleibt unverändert (Willkommensseite, Browser).
- **Paketname** festlegen, sobald die Domain feststeht.
- Wo der Signaturschlüssel dauerhaft liegt.

## Nach der Veröffentlichung

- Updates der App: wie bisher über GitHub (Web-App). Ein neues `.aab` ist nur nötig bei Änderungen am Manifest, am Symbol oder an Android-Einstellungen.
- Der Service Worker (`sw.js`, `CACHE_NAME`) sorgt weiter dafür, dass die App offline läuft.
