# Praxis im Profil: Vorschlag beim neuen Tier und „Weg zur Praxis“

Stand: 05.11.2026. Wunsch des Halters: ein klickbares Auswahlmenü der Arztpraxen beim Eintragen der Praxis,
„evtl. auch mit Standort auf Google Maps und direkter Anruffunktion“.
**Entschieden am 05.11.2026: der kleine Weg im Profil, gebaut nach dem Tierarzttermin am 13.11.2026.**
Vor dem Bau: Skill `migration` (neues Feld im Profil), dann TDD. Den Satz für die Datenschutzerklärung vorher dem Halter zeigen.

## Was es heute schon gibt

- Profil des Tiers (Mehr → Tier antippen): „Tierarztpraxis (optional)“ und „Telefon der Praxis (optional)“,
  gespeichert als `tierarzt { praxis?, telefon? }` (`js/profil.js`, Kommentar oben).
- Ist eine Telefonnummer eingetragen, steht unter „Mehr“ in der Gruppe „Tierarzt“ der Eintrag „‹Praxis› anrufen“
  (`#praxis-anrufen`, `telefonLink` in `app.js`). Die Anruffunktion gibt es also schon.
- Beim Eintragen einer Freigabe wird „Tierarzt / Praxis“ aus dem Profil vorausgefüllt (`app.js`, `form.tierarzt.value`).

## Entscheidung

- **Ort: das Profil**, nicht die Freigabe. Die Freigabe übernimmt die Praxis schon heute aus dem Profil.
- **Weg: klein.** Kein Auswahlmenü, keine Praxisliste aus einem fremden Dienst.

## Was gebaut wird

1. **Vorschlag beim neuen Tier.** Das Profil-Fenster für ein neues Tier (`oeffneProfil(null)`) füllt
   „Tierarztpraxis“, „Telefon der Praxis“ und „Adresse der Praxis“ aus dem gerade gewählten Tier vor, wenn dort
   etwas steht. Darunter ein Hinweis: „Von ‹Name› übernommen. Bei einem anderen Tierarzt einfach ändern.“
   Die Felder bleiben frei änderbar und leerbar. Beim Bearbeiten eines vorhandenen Tiers wird nichts vorausgefüllt.
2. **Neues freiwilliges Feld „Adresse der Praxis (optional)“** im Profil, unter dem Telefon, `maxlength` 80,
   Platzhalter z. B. „Musterstraße 1, 12345 Musterstadt“. Gespeichert als `tierarzt.adresse`.
3. **Eintrag „Weg zur Praxis“** unter „Mehr“ in der Gruppe „Tierarzt“, direkt unter „‹Praxis› anrufen“, nur wenn
   eine Adresse eingetragen ist. Öffnet in einem neuen Tab (`target="_blank" rel="noopener"`)
   `https://www.google.com/maps/search/?api=1&query=` + `encodeURIComponent(praxis + ", " + adresse)`
   (ohne Praxisname nur die Adresse). Auf dem Handy öffnet sich die Google-Maps-App, wenn sie installiert ist,
   sonst die Webseite. Das ist die von Google dokumentierte Form („Maps URLs“) und funktioniert auf Android,
   iPhone und PC gleich; ein `geo:`-Link ginge am PC nicht.

Keine Mengen, keine Sicherheitsgrenzen betroffen.

## Datenschutz

- Kilossos selbst schickt nichts weg. Erst beim Antippen von „Weg zur Praxis“ gehen Praxisname und Adresse an Google.
- `datenschutz.html`, Abschnitt „6. Links und Anrufe“, um einen Satz ergänzen, z. B.: „Der Knopf „Weg zur Praxis“
  öffnet Google Maps mit der eingetragenen Adresse der Praxis. Erst wenn du darauf tippst, gehen Name und Adresse
  der Praxis an Google; ab dann gelten die Datenschutzbestimmungen von Google.“
- Abschnitt mit der Liste der gespeicherten Daten („Tierarztpraxis mit Telefonnummer“) um die Adresse ergänzen.

## Datenformat

- `tierarzt { praxis?, telefon?, adresse? }`, Kommentar oben in `js/profil.js` anpassen.
- Die Prüfung in `js/profil.js` entfernt heute jedes Feld außer `praxis` und `telefon`: `adresse` dort zulassen,
  mit `textGueltig` prüfen (wie `praxis`).
- Neues freiwilliges Feld: Datenformat bleibt Version 1, alte Sicherungen bleiben gültig.
- Offen benannt: Eine ältere App-Version entfernt `adresse` beim Laden still. Harmlos, es ist nur eine Komfort-Angabe.

## Tests (zuerst rot)

- `js/profil.js`: `adresse` bleibt bei gültigem Text, fliegt bei Nicht-Text oder zu langem Text heraus;
  unbekannte Felder werden weiter entfernt.
- Reine Funktion für den Link (z. B. `kartenLink(praxis, adresse)`): ohne Adresse `null`; Umlaute, „&“, „#“ und
  Leerzeichen richtig kodiert; Anfang genau `https://www.google.com/maps/search/?api=1&query=`.
- Reine Funktion für den Vorschlag (z. B. `praxisVorschlag(tier)`): kopiert nur `praxis`, `telefon`, `adresse`;
  ohne Angaben `null`.
- Browser (Demo): neues Tier anlegen → Felder vorausgefüllt mit Hinweis; Adresse eintragen → „Weg zur Praxis“
  erscheint mit richtiger Adresse; ohne Adresse kein Eintrag; 375 px, große Schrift (150 %), dunkel.

## Zusammen mit „Bericht per E-Mail“

Die Ideen-Karte „Bericht per E-Mail“ braucht eine E-Mail-Adresse der Praxis im Profil. Ist sie bis zum Bau
entschieden, im selben Schritt das Feld „E-Mail der Praxis“ ergänzen, damit das Profil einen Block „Praxis“
(Name, Telefon, E-Mail, Adresse) bekommt. Sonst getrennt bauen.

## Bedacht und verworfen

- **Auswahlmenü aus schon eingetragenen Praxen:** bei ein bis zwei Tieren kaum Nutzen, die Praxis wird pro Tier
  nur einmal eingetragen. Der Vorschlag beim neuen Tier deckt den häufigsten Fall (gleicher Tierarzt) ab.
- **Echte Liste aller Praxen in der Nähe** (Google Places oder OpenStreetMap/Nominatim): fremder Dienst bei jeder
  Suche, bei Google Konto mit Zahlungsmittel und ggf. Kosten, die Nutzungsregeln von Nominatim verbieten eine Suche
  während des Tippens, eine feste Liste aller Praxen in Deutschland gibt es nicht frei und sie veraltet schnell.
  Widerspricht „Daten nur auf dem Gerät, keine fremden Dienste“.
- **Auswahl in der Freigabe:** dort wird die Praxis schon aus dem Profil vorausgefüllt.

Aufwand: etwa eine Stunde plus Prüfen.
