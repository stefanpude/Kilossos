# Willkommensseite und Logo

_Angelegt 02.11.2026. Stefan hat die Fragen zum Start übersprungen; sie stehen unten und werden vor der Store-Fassung nachgeholt._

## Plan (Claudes Vorschlag, Stefan prüft am Ergebnis)

1. **Willkommensseite (Version 0.10.0)**
   - Erscheint einmal beim ersten Öffnen (eigener Schlüssel `kilossos-willkommen`), nicht in der Demo.
     Auch Stefan sieht sie nach dem Update einmal, so kann er sie prüfen.
   - Inhalt: Logo (vorerst das bisherige App-Symbol), Kurzfassung der Geschichte mit Link „Ganze Geschichte lesen“
     (→ „Mehr“ → `#geschichte`), Tierarzt-Hinweis (freigegebener Text), Datenschutz in einem Satz, Knopf „Los geht's“.
   - Kein „Unterstützen“-Knopf: Steuer, Google-Play-Regeln und Impressum sind noch offen.
   - Der Tierarzt-Absatz zu kranken Katzen kommt zusätzlich unter „Über Kilossos“, damit er nicht nur einmal zu sehen ist.
2. **Logo aus Kito-Foto** (wartet auf das Foto von Stefan)
   - Stefan schickt ein Foto von Kito (Kopf gut zu sehen, ruhiger Hintergrund).
   - Daraus: rundes Logo für die Willkommensseite und App-Symbole 192/512 px (auch „maskable“).

## Geklärt (03.11.2026, gilt auch für die Store-Texte)

- **Erster Eindruck:** Sicherheit. „Abnehmen ohne Fettleber-Risiko, nach Leitlinien der Tierärzte“ steht vorn; Geschichte, Einfachheit und „kostenlos, privat“ folgen.
- **Ton:** passt so (Ich-Form, ehrlich, kurz). Im Store steht die Geschichte im zweiten Absatz, nicht ganz oben.
- **Zielgruppe:** Katzenhalter mit übergewichtiger Katze. Tierärzte sind nicht die Leser, sollen den Text aber nicht peinlich finden.
- **Fehlschlag wäre:** zu werblich, zu medizinisch, zu lang. Zusätzlich (Claude, wegen Google-Play-Regeln für Gesundheits-Apps): nie versprechen, dass die App die Diät macht oder den Tierarzt ersetzt.
- **Logo-Stil:** erledigt mit 0.13.0 (Kito am Napf).

## Geklärt (04.11.2026): Geschichte bleibt, wie sie ist

- Verglichen wurden drei Fassungen: heute (zwei Sätze und „Ganze Geschichte lesen“), A (Karte „Aus eigener Not entstanden“ auf Seite 1) und B (eigene Seite, Einrichtung mit vier Schritten). Stefan: Die heutige Fassung gefällt besser.
- **Warum:** Sicherheit bleibt der erste Eindruck. Seite 1 hat keinen Platz für mehr Text: Schon bei A musste der Text gekürzt werden, sonst rutscht „Weiter“ auf einem 375 × 812 px großen Handy aus dem Bild. B macht die Einrichtung einen Schritt länger. Die ganze Geschichte ist einen Tipp entfernt (auch unter „Mehr“) und steht im Store-Text im zweiten Absatz.
- Nicht wieder vorschlagen, außer Stefan fragt danach.

## Noch offen

- Soll die Willkommensseite später wieder aufrufbar sein (z. B. unter „Mehr“)? Die ganze Geschichte ist dort schon (`#geschichte`). Vorschlag Claude: reicht so, kein eigener Knopf.

## Geändert (04.11.2026, 0.30.0): Unterzeile und Futter-Zeile

- Unterzeile „Sicher abnehmen, ohne Fettleber-Risiko“ → „Sicher abnehmen nach den Leitlinien der Tierärzte“.
  **Warum:** „ohne Risiko“ verspricht mehr, als eine App halten kann (Kilossos warnt nur). Für die Store-Kurzbeschreibung
  war die Formulierung aus demselben Grund schon am 03.11. verworfen (`store-texte.md`).
- Zeile „Futter in Gramm und Kalorien, für jede Sorte“ → „Du wiegst das Futter, Kilossos rechnet die Kalorien“.
  **Warum:** Stefan las „für jede Sorte“ so, als hätte die App alle Futtersorten gespeichert. Die neue Zeile sagt, wer was macht.
- Platz: „Weiter“ endet bei 375 × 812 jetzt bei 643 px (vorher 612), weit vor der Grenze von etwa 790 px.
- Test in `tests/wissen.test.js`: Die alten Formulierungen dürfen nicht zurückkommen.
