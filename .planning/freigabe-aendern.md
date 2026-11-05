# Freigabe ändern und löschen (Version 0.34.0)

Stand: 05.11.2026. Status: **Entwurf**, vom Prüfer gelesen (frischer Agent, Fragen eingearbeitet), wartet auf
Stefans Freigabe.

## Warum

Die Freigabe vom Tierarzt (Zielgewicht, kcal pro Tag, Datum, Praxis, BCS, MCS, Notiz) lässt sich bisher nur neu
eintragen (`freigabe-neu`), nicht ändern und nicht löschen. Das hat drei Folgen:

1. **Tippfehler bleiben stehen.** Stefan trägt die Freigabe direkt in der Praxis ein, solange der Tierarzt noch dabei
   ist. Vertippt er sich, gibt es heute keinen Weg zurück.
2. **Der naheliegende Ausweg ist gefährlich.** Wer den Fehler mit einer zweiten Freigabe am selben Tag „überschreibt“,
   bekommt still den falschen Wert: `aktuelleFreigabe` (js/rechnen.js) sortiert nach Datum, bei gleichem Datum bleibt
   die Reihenfolge im Array, also gilt die **zuerst** eingetragene. Nachgerechnet: 280 eingetragen, danach 250 am selben
   Tag, die App rechnet weiter mit 280.
3. **Testeinträge lassen sich nicht entfernen.** Eine Test-Freigabe stünde für immer in „Befunde vom Tierarzt“, im PDF
   und in der Kurve. Der sichere Bereich in der Kurve beginnt sogar bei der **ersten** Freigabe, also bei der falschen.

Ziel: Fehler in Freigaben lassen sich korrigieren und Freigaben löschen, ohne dass dabei still ein falscher Wert gilt.

## Ziele, Nicht-Ziele, Anti-Ziele

**Ziele**
- Jede Freigabe eines Tiers lässt sich ändern und löschen, nicht nur die neueste (Stefan: „ja“).
- Der Ort ist „Mehr“, Gruppe „Tierarzt“: dort sucht Stefan zuerst (Stefan).
- Zwei Freigaben am selben Tag für dasselbe Tier entstehen über die App nicht mehr.

**Nicht-Ziele**
- Kein Änderungsprotokoll. Ein korrigierter Wert ersetzt den falschen ganz; der falsche war nie der Plan des Tierarztes
  und taucht nirgends mehr auf (auch nicht im PDF).
- Kein Ändern aus dem Verlauf heraus. Die Karte „Befunde vom Tierarzt“ bleibt nur zum Lesen und zeigt die Änderungen
  von selbst.
- Keine eigene Rückfrage statt `confirm()`. Das kommt mit der Karte `eigene-rueckfrage` für alle Stellen gemeinsam.
- Kein neues Datenformat.

**Anti-Ziele** (wäre ein Fehlschlag, auch wenn es technisch läuft)
- Nach einer Korrektur gilt still noch der alte Wert.
- Nach dem Löschen gilt still eine andere Freigabe, ohne dass die Rückfrage das gesagt hat.
- Die App schlägt irgendwo selbst eine Menge oder ein Ziel vor.
- „Ändern“ wird zum Weg für neue Pläne des Tierarztes, sodass der Verlauf alter Pläne verloren geht.

## Verhalten

### Unter „Mehr“, Gruppe „Tierarzt“

- Die Tafel mit der neuesten Freigabe (Ziel | kcal/Tag | BCS, darunter Praxis, Datum, MCS, Notiz) wird ein Knopf
  „ändern“, wie seit 0.31.0 die Wägungen. Ohne Freigabe bleibt der Text „Noch keine Freigabe eingetragen.“ und ist
  kein Knopf.
- Gibt es ältere Freigaben, steht unter der Tafel eine aufklappbare Zeile „Frühere Freigaben (n)“, zugeklappt. Darin
  je Freigabe eine Zeile, neueste zuerst: Datum, Praxis, „Ziel x,xx kg · y kcal pro Tag“ und, falls vorhanden, der
  Befund (BCS, MCS). Jede Zeile ist ein Knopf „ändern“. Bei nur einer Freigabe gibt es die Zeile nicht.
- Der Knopf „Freigabe eintragen“ bleibt, wie er ist.

### Fenster „Freigabe ändern“

- Antippen öffnet das gewohnte Fenster `dialog-freigabe` im Ändern-Modus:
  - Überschrift „Freigabe für <Name> ändern“.
  - Alle Felder mit den gespeicherten Werten ausgefüllt: Ziel und kcal mit Komma statt Punkt, Datum, Praxis **aus der
    Freigabe** (nicht aus dem Tierprofil), BCS und MCS (oder „Keine Angabe“), Notiz.
  - Ein zusätzlicher Hinweis oben: „Nur für Fehler beim Eintragen. Hat der Tierarzt einen neuen Plan festgelegt, trag ihn
    über „Freigabe eintragen“ neu ein. So bleibt der alte Plan im Verlauf.“
  - Unten zusätzlich ein Knopf „Freigabe löschen“ (Gefahr-Stil, wie „Löschen“ bei „Sorte ändern“).
- „Speichern“ ändert die Freigabe an Ort und Stelle: gleiche `id`, gleiches `tierId`, keine zweite Freigabe. Wird BCS
  oder MCS auf „Keine Angabe“ gesetzt, fehlt das Feld danach ganz (wie bei Freigaben ohne Angabe).
- Gleiche Prüfungen wie beim Eintragen, mit denselben Texten: Ziel 1–15 kg, 50–600 kcal, Praxis Pflicht, Datum
  höchstens heute.
- Die Rückfrage „unter 60 % des Ruhebedarfs beim Zielgewicht“ kommt beim Ändern nur, wenn Ziel oder kcal geändert
  wurden (Claude: wer nur die Notiz korrigiert, hat die Frage beim Eintragen schon beantwortet).
- „Abbrechen“ ändert nichts. Beim Schließen gilt das Fenster wieder als „neu eintragen“ (Sicherheitsnetz wie bei
  Gewicht und Besonderer Tag).
- Nach dem Schließen springt der Fokus zurück auf den Knopf, von dem aus geöffnet wurde (Tafel oder Zeile).

### Löschen

- Nur im Fenster „Freigabe ändern“, kein Kreuz in der Liste (Claude: ein Weg ist sicherer als zwei, und in der Praxis
  tippt man schnell daneben).
- Rückfrage mit `confirm()`, je nach Lage:
  - Es bleibt eine andere Freigabe, die danach gilt (an heutigem Datum gemessen): „Freigabe vom <Datum> (Ziel x,xx kg,
    y kcal) löschen? Danach gilt wieder die Freigabe vom <Datum> (Ziel …, … kcal).“
  - Es ist die einzige Freigabe: „Freigabe vom <Datum> (Ziel x,xx kg, y kcal) löschen? Danach hat <Name> keine Freigabe
    mehr: Kilossos zeichnet nur noch auf und zeigt kein Ziel und keine Tagesmenge.“
  - Es ist eine ältere Freigabe, die heute nicht gilt: „Freigabe vom <Datum> (Ziel x,xx kg, y kcal) löschen?“
- Nach „OK“: Freigabe entfernt, Fenster zu, Meldung „✓ Freigabe gelöscht“. Nach „Abbrechen“: Fenster bleibt offen,
  nichts geändert.

### Zwei Freigaben am selben Tag

- **Neu eintragen** an einem Tag, an dem dieses Tier schon eine Freigabe hat: Rückfrage „Für den <Datum> gibt es schon
  eine Freigabe (Ziel x,xx kg, y kcal). Soll die neue sie ersetzen?“
  - „OK“: Die vorhandene Freigabe bekommt die neuen Werte (gleiche `id`, ersetzt ganz, wie beim Ändern).
  - „Abbrechen“: Fenster bleibt offen, Fehlertext „Nicht gespeichert: Für diesen Tag gibt es schon eine Freigabe.“
  - Claude: So landet der naheliegende Weg aus der Praxis („einfach nochmal richtig eintragen“) beim richtigen Wert.
- **Ändern** und dabei das Datum auf einen Tag legen, an dem schon eine **andere** Freigabe dieses Tiers steht: Fehlertext
  „An diesem Tag gibt es schon eine andere Freigabe. Bitte das Datum prüfen.“ Kein Ersetzen (sonst verschwände still
  eine zweite gespeicherte Freigabe).
- **Alte Daten mit zwei Freigaben am selben Tag** (aus früheren Fassungen oder Sicherungen) bleiben gültig und werden
  nicht umgewandelt. `aktuelleFreigabe` nimmt bei gleichem Datum künftig die **zuletzt eingetragene** (spätere Stelle im
  Array) statt der ersten. Claude: Die spätere ist fast immer die Korrektur. Wer sie sehen will, findet beide unter
  „Frühere Freigaben“ und kann eine löschen.
- An so einem Tag mit zwei alten Freigaben gehen Ändern (auch bei unverändertem Datum) und Neu-Eintragen nicht, nur
  Löschen. Fehlertext: „An diesem Tag gibt es zwei Freigaben. Bitte lösche zuerst die falsche unter „Frühere
  Freigaben“.“ Claude: Sonst könnte man die frühere der beiden ändern, während still die spätere weiter gilt (erstes
  Anti-Ziel). Der Fall ist selten, Löschen reicht als Ausweg. Ausnahme (Claude, beim Planen): Bekommt eine der beiden
  beim Ändern ein Datum, an dem keine andere Freigabe steht, ist das erlaubt; damit ist der doppelte Tag aufgelöst, und
  die Rückfrage „welche Freigabe gilt“ greift wie sonst auch.

### Wenn sich durch das Datum ändert, welche Freigabe gilt

Claude (nach Hinweis des Prüfers): Wie beim Löschen soll auch beim Speichern nie still eine andere Freigabe gelten,
als man erwartet. Gemessen wird, welche Freigabe **heute** gilt, vor und nach dem Speichern.

- **Neu eintragen** mit einem Datum vor der heute geltenden Freigabe (die neue gilt also nicht): Rückfrage „Die
  Freigabe vom <Datum> ist neuer und gilt weiter. Diese wird als frühere Freigabe gespeichert. Stimmt das Datum?“
- **Ändern der geltenden Freigabe**, wobei das neue Datum vor einer anderen liegt: Rückfrage „Mit diesem Datum gilt
  nicht mehr diese Freigabe, sondern wieder die vom <Datum> (Ziel x,xx kg, y kcal). Stimmt das Datum?“
- **Ändern einer früheren Freigabe**, wobei das neue Datum nach der geltenden liegt: Rückfrage „Mit diesem Datum gilt
  diese Freigabe ab sofort statt der vom <Datum> (Ziel x,xx kg, y kcal). Stimmt das Datum?“
- „OK“ speichert, „Abbrechen“ lässt das Fenster offen, Fehlertext „Nicht gespeichert: Bitte das Datum prüfen.“
- Ändert sich nur ein Wert und nicht, welche Freigabe gilt, kommt keine dieser Fragen.

### Reihenfolge beim Speichern

1. Wertebereiche und Pflichtfelder (Fehlertext, Fenster bleibt offen).
2. Datum: Tag mit zwei alten Freigaben (Fehler), beim Ändern Datum auf eine andere Freigabe (Fehler).
3. 60-%-Rückfrage (beim Ändern nur bei geändertem Ziel oder kcal).
4. Rückfrage „welche Freigabe gilt“ (oben).
5. Beim Neu-Eintragen: Rückfrage „Soll die neue sie ersetzen?“ (gleicher Tag).

Höchstens drei Rückfragen hintereinander sind möglich, aber nur bei ungewöhnlichen Eingaben; der normale Weg (Datum
heute, Werte im üblichen Bereich) hat keine.

### Was sich von selbst mitändert

„Heute“ (Lineal, Warnungen, auch an früheren Tagen), Verlauf (Kurve mit Freigabe-Marken, Ziellinie und sicherem
Bereich, Tempo, Futterkarte, Befunde), PDF und die Erinnerung „Freigabe älter als 3 Monate“ lesen `daten.freigaben` und
zeigen nach dem Speichern den neuen Stand. Eine geänderte Freigabe gilt damit auch rückwirkend für die Tage seit ihrem
Datum; bei einem Tippfehler ist das richtig so.

## Randbedingungen

- Mehrere Tiere: Alles gilt nur für das gewählte Tier (Liste, Gleicher-Tag-Prüfung, „danach gilt“).
- Speicher voll: wie überall über `sichern()`; die Änderung wird verworfen, nichts halb gespeichert.
- Demo (`?demo`) verhält sich gleich, im eigenen Speicherplatz.
- Datenformat bleibt Version 1, alte Sicherungen bleiben gültig, keine Umwandlung. Die einzige Verhaltensänderung für
  alte Daten ist die Regel bei gleichem Datum (oben).
- Öffentliches Repo: in Tests und Texten keine echten Werte von Stefans Katzen.
- Tippflächen mindestens 48 px (`mobile-design`), Tafel als Knopf darf nicht anders aussehen als heute (Höhe und Lage
  messen, vorher und nachher, wie bei 0.31.0).
- `confirm()` ist im Browser-Fenster der Claude-App nicht sichtbar und liefert `false`: im Test `window.confirm`
  überschreiben.

## Dem Bauenden überlassen

- Ob die reinen Funktionen in `js/daten.js`, `js/mehr.js` oder einer neuen Datei liegen (Vorschlag: Ändern und
  Gleicher-Tag-Suche in `js/daten.js`, Zeilen für „Frühere Freigaben“ und Rückfrage-Texte in `js/mehr.js`).
- HTML der Tafel als Knopf (Knopfinhalt nur aus `span`, Gitter über CSS), Vorlesetext („…, ändern“).
- Genaue Gestaltung der Zeile „Frühere Freigaben“, solange sie zum bestehenden Aufklapp-Muster passt.

## Tests (zuerst rot, dann grün)

- Freigabe ändern: setzt alle Felder, `id` und `tierId` bleiben, Notiz ohne Leerzeichen am Rand, BCS/MCS „Keine Angabe“
  entfernt die Felder.
- Gleicher Tag: findet die Freigabe desselben Tiers am selben Datum; ignoriert andere Tiere; beim Ändern nie sich selbst.
- `aktuelleFreigabe`: bei gleichem Datum gilt die zuletzt eingetragene; sonst unverändert (bestehende Tests bleiben grün).
- Frühere Freigaben: alle außer der neuesten, neueste zuerst; leer bei einer oder keiner Freigabe.
- Lösch-Rückfrage: drei Fälle (danach gilt eine andere, einzige, ältere ohne Wirkung), mit geschützten Leerzeichen
  zwischen Zahl und Einheit.
- „Welche Freigabe gilt“: neu mit älterem Datum (Frage), geltende nach hinten (Frage, nennt die danach geltende),
  frühere nach vorn (Frage), nur Wert geändert (keine Frage), neu mit heutigem Datum (keine Frage).
- Tag mit zwei alten Freigaben: Ändern und Neu-Eintragen melden den Fehler, auch bei unverändertem Datum.
- Eingefrorene Sicherung mit zwei Freigaben am selben Tag lädt unverändert.
- Verdrahtung in `app.js` im Browser prüfen (Demo und Testdaten): Tafel antippen, ändern, speichern; ältere Freigabe
  ändern und löschen; neueste löschen (Rückfrage nennt die danach geltende); einzige löschen; gleicher Tag neu
  (OK ersetzt, Abbrechen lässt offen); Datum auf andere Freigabe (Fehler); Datum so geändert, dass eine andere
  Freigabe gilt (Rückfrage); 60-%-Rückfrage nur bei geändertem Wert;
  Kurve, Lineal, Befunde und PDF zeigen den neuen Stand; Tastatur, 375 px, hell, dunkel, 150 % Schrift; keine
  Konsolenfehler.

## Version

0.34.0: `CACHE_NAME` in `sw.js` auf `kilossos-v61`, `#version` in `index.html`, Versionstest in
`tests/wissen.test.js`.
