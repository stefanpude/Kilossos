# Strichcode-Scanner (Version 0.22.0)

_Angelegt 03.11.2026. Stefan hat die Fragen übersprungen („leg los, ich prüfe danach“). Alle Entscheidungen hier sind Claudes Vorschlag und warten auf Stefans Einwände._

## Ziel
Futterbeutel in der Hand, Strichcode scannen, Sorte ist da: ohne Tippen und ohne Suchen in der Liste.

## Ablauf
1. Knopf **„Strichcode scannen“** auf der Futter-Seite (oben, neben „Aus der Futterliste wählen“) und im Mahlzeit-Blatt im Futter-Menü.
2. Blatt mit Kamerabild. Gelesen werden EAN-13, EAN-8 und UPC (12-stellig, wird mit 0 vorn zu EAN-13).
   Darunter immer ein Feld **„Nummer eintippen“**, für Geräte ohne Kamera-Erkennung und für zerknitterte Beutel.
3. Ergebnis:
   - **Schon in deiner Liste** (eigene Kopie aus der Futterliste oder eigene Sorte mit dieser Nummer): im Mahlzeit-Blatt wird die Sorte gewählt, auf der Futter-Seite öffnet sie sich zum Ansehen.
   - **In der Kilossos-Futterliste:** Name, Art, kcal, Quelle und ggf. „Nummer gehört zur 12er-Packung“, Knopf „Übernehmen“ (wie bisher aus der Liste).
   - **Unbekannt:** „Diese Sorte kennt Kilossos noch nicht.“ Knopf „Als eigene Sorte anlegen“. Die Nummer wird an der eigenen Sorte gespeichert, beim nächsten Scan wird sie erkannt.
   - **Prüfziffer falsch:** „Die Nummer stimmt nicht. Bitte noch einmal scannen oder prüfen.“

## Technik (Claudes Entscheidung)
- **Eingebaute Strichcode-Erkennung des Browsers** (`BarcodeDetector`), keine Zusatzbibliothek. Gibt es in Chrome auf Android (Stefans Handy, später die Play-Store-App, die Chrome nutzt). **Nicht** in Chrome auf Windows und nicht in Firefox: dort nur Eintippen. Warum: keine fremde Datei, kein Download, App bleibt klein und offline.
  Risiko: Tester mit anderem Browser sehen nur das Eintippfeld. Ausweg später: Bibliothek `zxing-wasm` (ca. 1 MB) nachrüsten.
- Kamera: Rückkamera, nur solange das Blatt offen ist; beim Schließen wird sie sofort ausgeschaltet. Bilder werden nicht gespeichert und verlassen das Gerät nicht.
- Neue Datei `js/scanner.js` (Kamera und Erkennung). Suche und Prüfung als reine Funktionen in `js/futterliste.js` mit Tests.

## Datenformat
- Eigene Sorten bekommen das freiwillige Feld `ean: ["…"]` (nur gültige Nummern). Datenformat bleibt **Version 1**: alte Sicherungen bleiben gültig, ältere App-Versionen lassen das Feld einfach stehen.
- Beim Einlesen einer Sicherung werden ungültige Nummern entfernt (wie beim Profilbild).
- Kopien aus der Futterliste bekommen kein eigenes `ean`: sie werden über `listeId` in der Futterliste gefunden. So wirken neue Nummern in der Liste auch für alte Kopien.

## Aufräumen der Notizen (aus HANDOFF)
- In der Futterliste wandert „EAN von fressnapf.de“ aus `quelle` in ein eigenes Feld `eanQuelle`, und „EAN gehört zur 12er-Packung.“ aus `hinweis` nach `eanHinweis`.
- Die Notiz einer neu übernommenen Sorte nennt dann keine EAN mehr. Der Packungshinweis steht im Scan-Ergebnis.
- Schon übernommene Sorten behalten ihre alte Notiz (wird nicht umgeschrieben, Stefans Daten bleiben unberührt).

## Datenschutz
Neuer Abschnitt in `datenschutz.html`: Kamera nur für den Scanner, nur nach Erlaubnis, Bild bleibt auf dem Gerät, nichts wird gespeichert außer der Nummer an der Sorte.

## Prüfen
- `npm test` mit neuen Tests: Suche nach Nummer (Liste, eigene Kopie, eigene Sorte, UPC-12, falsche Prüfziffer), Bereinigen beim Einlesen, Aufräumen der Notizen.
- Browser lokal: Eintippen mit Kitos Sheba-Nummer 4770608260286, eine Listen-Nummer, eine unbekannte, eine falsche.
- Kamera geht nur auf dem Handy: **Handy-Test durch Stefan** nach dem Hochladen.

## Nicht in dieser Runde
- Nummern für die 13 Sorten ohne EAN, Online-Suche in fremden Datenbanken (Open Pet Food Facts), Anzeige der EAN in der Sortenliste.
