---
name: Kilossos
description: Begleiter für die sichere Abnahme übergewichtiger Katzen, sachlich wie eine Gewichtskarte in der Tierarztpraxis.
colors:
  papier: "#f3f5f2"
  blatt: "#fbfcfa"
  blatt-2: "#e8eee9"
  tinte: "#1d2b2a"
  tinte-leise: "#5b6b68"
  tanne: "#2f6b5e"
  tanne-text: "#ffffff"
  salbei: "#c9ddcf"
  gut-hell: "#dcebe0"
  bernstein: "#a65a12"
  bernstein-hell: "#f6ead9"
  gefahr: "#b3261e"
  gefahr-hell: "#f9dedc"
  raster: "#dbe3dd"
  raster-stark: "#c3cfc6"
  feldrand: "#7a8a85"
  fokus: "#8fb8ad"
  papier-dunkel: "#131b1a"
  blatt-dunkel: "#1b2524"
  blatt-2-dunkel: "#243130"
  tinte-dunkel: "#e4ebe8"
  tinte-leise-dunkel: "#a2b1ad"
  tanne-dunkel: "#7cc0ad"
  tanne-text-dunkel: "#10201c"
  salbei-dunkel: "#2a4a42"
  bernstein-dunkel: "#e3a35e"
  bernstein-hell-dunkel: "#3a2b19"
  gefahr-dunkel: "#f2b8b5"
  gefahr-hell-dunkel: "#4a2523"
  raster-dunkel: "#2c3a38"
  raster-stark-dunkel: "#465755"
  fokus-dunkel: "#4f8f80"
typography:
  display:
    fontFamily: "Literata, Georgia, 'Times New Roman', serif"
    fontSize: "2.75rem"
    fontWeight: 500
    lineHeight: 1.1
    fontFeature: "tnum, lnum"
  headline:
    fontFamily: "Literata, Georgia, 'Times New Roman', serif"
    fontSize: "1.625rem"
    fontWeight: 500
    lineHeight: 1.15
  title:
    fontFamily: "Literata, Georgia, 'Times New Roman', serif"
    fontSize: "1.1875rem"
    fontWeight: 500
    lineHeight: 1.25
  body:
    fontFamily: "'Atkinson Hyperlegible Next', 'Segoe UI', system-ui, -apple-system, Roboto, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.45
  label:
    fontFamily: "'Atkinson Hyperlegible Next', 'Segoe UI', system-ui, -apple-system, Roboto, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 400
    lineHeight: 1.4
rounded:
  klein: "6px"
  normal: "12px"
  bild: "21%"
  blatt-oben: "20px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
components:
  knopf-haupt:
    backgroundColor: "{colors.tanne}"
    textColor: "{colors.tanne-text}"
    rounded: "{rounded.klein}"
    padding: "0 20px"
    height: "50px"
  knopf-zweit:
    backgroundColor: "transparent"
    textColor: "{colors.tanne}"
    rounded: "{rounded.klein}"
    padding: "0 20px"
    height: "50px"
  knopf-gefahr:
    backgroundColor: "transparent"
    textColor: "{colors.gefahr}"
    rounded: "{rounded.klein}"
    padding: "0 20px"
    height: "50px"
  karte:
    backgroundColor: "{colors.blatt}"
    textColor: "{colors.tinte}"
    rounded: "{rounded.normal}"
    padding: "14px 16px"
  eingabe:
    backgroundColor: "{colors.papier}"
    textColor: "{colors.tinte}"
    rounded: "{rounded.klein}"
    padding: "0 12px"
    height: "48px"
  leiste:
    backgroundColor: "{colors.blatt}"
    textColor: "{colors.tinte-leise}"
    height: "60px"
  warnung-achtung:
    backgroundColor: "{colors.bernstein-hell}"
    textColor: "{colors.tinte}"
    rounded: "{rounded.klein}"
    padding: "12px 14px"
  warnung-sofort:
    backgroundColor: "{colors.gefahr-hell}"
    textColor: "{colors.tinte}"
    rounded: "{rounded.klein}"
    padding: "12px 14px"
---

# Design System: Kilossos

## Overview

**Creative North Star: "Das Wiegeprotokoll"**

Kilossos sieht aus wie eine gut geführte Gewichtskarte in der Tierarztpraxis: Papier, Tinte, Millimeterpapier. Die Oberfläche ist sachlich und ruhig, weil sie täglich am Napf benutzt wird, oft mit einer Hand und einer drängelnden Katze daneben. Nichts soll ablenken, nichts soll aufregen; Aufmerksamkeit bekommen nur Zahlen, die nächste Aktion und echte Warnungen.

Die Fläche ist ein heller, leicht grünlicher Papierton, darauf liegen flache „Blätter“ mit feinem Rand und ohne Schatten. Zahlen stehen in einer Serifenschrift mit gleich breiten Ziffern, damit Gramm, kcal und Kilo in Spalten sauber untereinander stehen. Fließtext und Bedienung stehen in einer besonders gut lesbaren Groteskschrift. Farbe ist knapp und hat Bedeutung: Tanne heißt „hier tippen“ oder „im Plan“, Bernstein heißt „aufpassen“, Rot heißt „sofort handeln“.

Bewegung ist klein und funktional: Bereiche gleiten 8 px herein, Fenster kommen als Blatt von unten, Aufklapp-Bereiche öffnen mit einer weichen Feder. Hell und Dunkel sind gleichwertig ausgearbeitet; der Druck (PDF für die Praxis) fällt auf Schwarz auf Weiß zurück.

**Key Characteristics:**
- Flache Blätter auf Papier, feine Ränder, keine Schatten (Ausnahme: aufgeklappte Menüs)
- Serifen-Ziffern mit `tabular-nums` für alle Messwerte
- Eine Akzentfarbe (Tanne), zwei Warnstufen (Bernstein, Rot) mit festem Sinn
- Große Tippflächen (mindestens 48 px), untere Leiste mit fünf Bereichen
- Fenster als Blatt von unten mit Griff zum Herunterziehen
- Millimeterpapier-Raster nur in Diagrammen

## Colors

Gedämpfte Grün-Grau-Töne wie Karteikarte und Tinte, ein tiefes Tannengrün als einzige Aktionsfarbe, Bernstein und Rot nur für Warnungen. Alle Paare sind mit der WCAG-Formel geprüft: Text mindestens 4,5 : 1, Feldränder mindestens 3 : 1. Jede Farbe hat ein Gegenstück für Dunkel (Schlüssel mit `-dunkel`), umgeschaltet über `data-theme="dunkel"` am `<html>`. Im Code heißen die Variablen `--hintergrund`, `--flaeche`, `--text`, `--akzent` usw.; die alten Namen bleiben, nur die Werte wechseln.

### Primary
- **Tanne** (`tanne`): Hauptknöpfe, Textlinks, aktiver Bereich in der unteren Leiste, Kurve „im Plan“, Ziel-Linie im Diagramm. Auch die Farbe für „gut“. Im Dunkeln das hellere Tannen-Mint.
- **Salbei** (`salbei`): stille Fläche hinter Profilbildern ohne Foto (Initiale) und hinter Fotos beim Laden. Nie für Text.

### Secondary
- **Bernstein** (`bernstein`, Fläche `bernstein-hell`): Warnung „Achtung“, aufklappbare Hinweise, Sicherungs-Erinnerung, Marke „ungefähr“ und „geschätzt“, Notfall-Linie links, zweite Reihe in Diagrammen.

### Tertiary
- **Rot** (`gefahr`, Fläche `gefahr-hell`): nur Sofort-Warnungen (zum Beispiel zu schnelle Abnahme), Fehlerrand an Feldern und der rote Knopf zum Löschen.

### Neutral
- **Papier** (`papier`): Seitenhintergrund und Hintergrund von Eingabefeldern.
- **Blatt** (`blatt`, zweite Stufe `blatt-2`): Karten, Listen, Fenster, untere Leiste.
- **Tinte** (`tinte`): Text, auch auf allen „-hell“-Flächen.
- **Tinte leise** (`tinte-leise`): Beschriftungen, Einheiten, Tipps, Achsen, Quellenangaben.
- **Raster** (`raster`, stärker `raster-stark`): Ränder von Karten und Trennlinien, Millimeterpapier im Diagramm, Rahmen um Bilder.
- **Feldrand** (`feldrand`): Rand von Eingabefeldern (3 : 1).
- **Fokus** (`fokus`): 3 px Fokusring für Tastatur.

### Named Rules
**Die Bedeutungs-Regel.** Tanne, Bernstein und Rot tragen Bedeutung und werden nie dekorativ eingesetzt. Eine neue Funktion bekommt keine eigene Farbe.

**Die Tinte-auf-Hell-Regel.** Auf `bernstein-hell`, `gefahr-hell`, `gut-hell` und `salbei` steht Text immer in Tinte, nie in der Signalfarbe selbst. Die Signalfarbe sitzt im 4 px breiten Rand links.

**Die Nicht-nur-Farbe-Regel.** Jede Warnung sagt in Worten, was los ist; Farbe allein reicht nie.

## Typography

**Display Font:** Literata (mit Georgia, Times New Roman)
**Body Font:** Atkinson Hyperlegible Next (mit Segoe UI, system-ui, Roboto)

**Character:** Literata gibt Zahlen und Überschriften den Ton eines handgeführten Protokolls; Atkinson Hyperlegible wurde für Lesbarkeit bei Sehschwäche gebaut und trägt alles, was gelesen und angetippt wird. Beide liegen lokal in `fonts/` (SIL OFL), keine Verbindung zu Google Fonts.

### Hierarchy
- **Display** (500, 2,75rem, 1,1): große Tageszahl (kcal heute); verwandt: Gewichtseingabe 3,5rem, Messwert 2rem.
- **Headline** (500, 1,625rem, 1,15): Tiername im Kopf von „Heute“; Willkommen 1,75rem, Fenstertitel 1,3125rem.
- **Title** (500, 1,1875rem, 1,25): Kartentitel; Zwischenüberschriften auf Erklärseiten 1,0625rem.
- **Body** (400, 1rem, 1,45): Fließtext, Listeneinträge, Eingaben (Eingaben 1,0625rem). Hervorhebung 700.
- **Label** (400, 0,8125rem): Beschriftungen, Einheiten, Quellen, Leistentext; kleine Kopfzeilen in Karten 700.

### Named Rules
**Die Ziffern-Regel.** Jede Messzahl (g, kcal, kg, %, Uhrzeit) steht in Literata mit `tabular-nums lining-nums`. Einheiten daneben klein in Atkinson und in Tinte leise.

**Die Zwei-Schriften-Regel.** Keine dritte Schrift, auch nicht für Diagramme oder das PDF.

## Layout

Eine Spalte, höchstens 560 px breit, mittig, 16 px Rand links und rechts. Bereiche stapeln Karten mit 12 px Abstand; in Karten 8 px. Die untere Leiste ist fest, teilt sich in fünf gleiche Spalten und hält Abstand zur Gestenleiste (`safe-area-inset-bottom`); der Inhalt bekommt unten 80 px Luft. Fenster sind höchstens 520 px breit und 92 dvh hoch. Es gibt keinen Desktop-Umbau: auf großen Bildschirmen bleibt die schmale Spalte.

Rhythmus: 4, 8, 12, 14, 16, 24 px. Tippflächen mindestens 48 px hoch, Hauptknöpfe 50 px, Listeneinträge 56 px, Leistenknöpfe 60 px.

## Elevation & Depth

Flach. Tiefe entsteht durch Ton (Papier unter Blatt) und feine Ränder, nicht durch Schatten. `--schatten` ist `none`.

### Shadow Vocabulary
- **Menü** (`box-shadow: 0 12px 32px rgb(29 43 42 / 0.18)`, dunkel `rgb(0 0 0 / 0.45)`): nur aufgeklappte Auswahlmenüs, die über anderem Inhalt schweben.
- **Bildrahmen** (`box-shadow: 0 0 0 1px var(--rand-stark)`): ein 1 px Ring statt Rand um Profilbilder, Logo und Fotos.
- **Fenster-Hintergrund** (`rgb(29 43 42 / 0.4)`): abgedunkelte Seite hinter offenen Blättern.

### Named Rules
**Die Flach-Regel.** Karten, Knöpfe und Fenster haben keinen Schatten. Was schweben muss (Menü), bekommt den einen Menüschatten, sonst nichts.

## Shapes

Gemäßigte Ecken. Karten, Listen und Menüs 12 px, Knöpfe, Felder und Warnkästen 6 px. Fenster sind oben 20 px rund und unten bündig, weil sie von unten kommen. Profilbilder, Kamera-Knopf, ±-Knöpfe und Tagespfeile sind „eckig rund“ mit 21 % Radius, wie das Logo auf der Willkommensseite (seit 0.74.0, vorher Kreise). Kreise gibt es nur noch für kleine Nummernpunkte in Hinweisen. Warnungen und Notfallsätze tragen links einen farbigen Balken (4 px bzw. 3 px).

## Components

### Buttons
Sachlich und eindeutig, eine Hauptaktion pro Ort.
- **Shape:** leicht gerundet (6px), 50px hoch, 0 20px innen, Schrift 700, Symbol 20px mit 8px Abstand.
- **Primary (`knopf-haupt`):** Tanne voll, weiße Schrift.
- **Secondary (`knopf-zweit`):** durchsichtig, Tanne als Rand und Schrift.
- **Gefahr (`knopf-gefahr`):** durchsichtig, roter Rand und rote Schrift; in Knopfreihen in eigener Zeile darunter.
- **Text (`knopf-text`):** Tanne, 700, unterstrichen (3px Abstand), 48px hoch.
- **Druck:** `scale(0.98)` in 0,12s; kein Hover-Effekt nötig (Handy zuerst).

### Cards / Containers
- **Corner Style:** 12px.
- **Background:** Blatt auf Papier.
- **Shadow Strategy:** keiner (siehe Flach-Regel).
- **Border:** 1px Raster.
- **Internal Padding:** 14px 16px, Abstand innen 8px.
- **Listen (`liste`):** dasselbe Blatt, Einträge 56px hoch, durch 1px Raster getrennt.

### Inputs / Fields
- **Style:** 48px hoch, 1px Feldrand, 6px Ecken, Hintergrund Papier, Schrift 1,0625rem; Beschriftung darüber in 0,875rem Tinte leise.
- **Focus:** 3px Fokusring, Rand wird Tanne.
- **Error:** roter Rand plus 1px roter Ring, dazu Text.
- **Gewichtseingabe (`waage`):** große Literata-Zahl (3,5rem) nur mit Unterstrich, links und rechts ±-Knöpfe 56px mit 21 % Ecken.

### Navigation
Untere Leiste mit fünf Bereichen (Heute, Gewicht, Verlauf, Futter, Mehr): Blatt mit Raster-Linie oben, Linien-Symbole 24px (Strich 1,7) über 0,8125rem Text in Tinte leise. Aktiv: Tanne, 700, Symbol 1px höher und Strich 2. Wischen wechselt Bereiche, der neue kommt von der passenden Seite (32px, 0,3s). Android-Zurück schließt erst Fenster, dann geht es nach „Heute“.

### Sheets (Fenster von unten)
Jedes `<dialog>` ist ein Blatt von unten: Blatt-Fläche, oben 20px rund, Griff (40 × 4px, Raster stark) zum Herunterziehen, Einfahren in 0,35s. Formulare darin als Raster mit 14px Abstand. Eigene Rückfragen ersetzen Browser-Dialoge.

### Warnungen und Hinweise (Signature)
Drei Stufen mit festem Aussehen: **Sofort** (Rot hell, roter Balken links, fett, immer offen), **Achtung** (Bernstein hell, Bernstein-Balken, immer offen), **Hinweis** (Bernstein hell, aufklappbar, Nummernpunkt). Jede Warnung kann eine Quelle klein darunter tragen. Der Notfallsatz steht als leiser Text mit 3px Bernstein-Balken.

### Aufklapp-Baustein
Kopfzeile 48px mit Pfeil rechts, der sich um 180° dreht; Inhalt öffnet über `grid-template-rows` in 0,35s mit der Feder `cubic-bezier(0.3, 0.9, 0.3, 1)`.

### Diagramme
Gewichtskurve und Kalorien auf Millimeterpapier (1px Raster-Linien), Achsen 11px Atkinson in Tinte leise, Endwerte in Literata. Erste Reihe Tanne, zweite Bernstein; Freigabe-Band als zarte Tannen-Fläche.

## Do's and Don'ts

### Do:
- **Do** neue Flächen als Blatt (`blatt`, 1px `raster`, 12px Ecken) auf Papier bauen.
- **Do** jede Messzahl in Literata mit `tabular-nums` setzen, die Einheit klein daneben.
- **Do** Tippflächen mindestens 48px hoch machen, Hauptknöpfe 50px.
- **Do** jede neue Farbe in Hell und Dunkel festlegen und mit der WCAG-Formel prüfen (Text 4,5 : 1, Ränder 3 : 1).
- **Do** neue Fenster als Blatt von unten mit Griff bauen und Bewegungen bei `prefers-reduced-motion` abschalten lassen.
- **Do** Profilbilder und quadratische Bedienelemente mit 21 % Ecken und 1px Ring statt Rand zeigen.

### Don't:
- **Don't** Schatten auf Karten, Knöpfe oder Fenster legen; nur das Auswahlmenü schwebt.
- **Don't** Tanne, Bernstein oder Rot zur Dekoration nutzen oder eine weitere Akzentfarbe einführen.
- **Don't** Signalfarbe als Textfarbe auf hellen Signalflächen verwenden; Text bleibt Tinte.
- **Don't** Kreise für Profilbilder oder Pfeil-Knöpfe nutzen (seit 0.74.0 eckig rund).
- **Don't** für neue Rückfragen Browser-Dialoge (`confirm`) verwenden; es gibt die eigene Rückfrage (`js/rueckfrage.js`). Einige seltene Fehlermeldungen beim Einlesen einer Sicherung nutzen noch `alert`.
- **Don't** Schriften aus dem Netz laden oder eine dritte Schrift einführen.
