# Profilbild-Großansicht (Version 0.89.0)

Wunsch Stefan 09.11.2026: Antippen des Profilbilds zeigt das Foto groß („rauszoomen“), auf „Heute“ und im Kopf von „Verlauf“.

## Verhalten
- **Mit Foto:** Antippen öffnet `dialog-profilbild`. Das Bild wächst von seiner Stelle in die Mitte (FLIP mit WAAPI,
  ca. 280 ms, `cubic-bezier(0.23, 1, 0.32, 1)`), Hintergrund dunkel. Darunter der Name und klein „Profil bearbeiten“.
  Antippen von Bild oder Hintergrund, der Knopf „Schließen“ (oben rechts, 48 px) oder Escape schließen mit schnellerer
  Rückwärts-Animation (ca. 200 ms) zurück an die Stelle. Die Zurücktaste schließt das Fenster über 0.88.0 (jedes offene `<dialog>`).
- **Ohne Foto:** bleibt das Menü „Profil bearbeiten / Foto wählen“.
- „Foto ändern“ und „Foto entfernen“ gibt es mit Foto nur noch im Profil-Fenster („Anderes Foto“, „Foto entfernen“).
- `prefers-reduced-motion`: nur Ein- und Ausblenden, keine Bewegung.
- Nicht betroffen: Tier-Menü, Tierliste, Vorher/Nachher und Wiegefotos (eigenes `dialog-foto`), PDF.

## Umsetzung
- `js/profilbild.js`: reine Funktionen `profilAktion(tier)` („gross“/„menue“) und `zoomVon(quelle, ziel)` (Verschiebung und Maßstab).
- `app.js`: `profilAntippen` entscheidet über `profilAktion`; `verlaufKopf` macht das Bild nur mit Foto zum Knopf
  (`data-aktion="profilbild-gross"`); `oeffneProfilbild(quelle)` und `schliesseProfilbild()`.
- `index.html`: `<dialog id="dialog-profilbild" class="profilbild-gross">`; `styles.css`: Vollbild, dunkler Hintergrund, kein Griff.
- Tests: `tests/profilbild-gross.test.js`. Version 0.89.0, Cache v154, `js/profilbild.js` in `DATEIEN`.
