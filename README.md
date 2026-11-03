# Kilossos

Begleitet übergewichtige Katzen bei einer sicheren, kontrollierten Abnahme. Gestartet mit Kito.

## Lokal ansehen

```bash
node server.js
```

Dann im Browser http://localhost:8080 öffnen.

## Tests

```bash
npm test
```

## Aufbau

- `index.html`, `styles.css`, `app.js` – die App (Bereiche Heute, Gewicht, Futter, Mehr)
- `js/daten.js` – Datenmodell und Speicher auf dem Gerät
- `js/rechnen.js` – Rechenfunktionen ohne Bildschirm, geprüft in `tests/`
- `manifest.webmanifest`, `sw.js` – installierbar und offline nutzbar
- `icons/` – vorläufige App-Symbole, erzeugt mit `node werkzeuge/erzeuge-icons.js`

## Lizenz

GNU General Public License 3.0 oder später, siehe [LICENSE](LICENSE).
