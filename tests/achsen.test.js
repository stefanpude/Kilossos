// Achsen der Gewichtskurve (seit 0.65.0), Wunsch Stefan 06.11.2026: „Die Skalen könnten detaillierter sein.“
// Fehler vorher: 0,25-kg-Schritte mit einer Nachkommastelle beschriftet, 6,25 stand als „6,3“ an der Achse.
// Jetzt: nur Schritte 0,1 / 0,2 / 0,5 / 1 / 2 kg, jede Zahl stimmt genau, höchstens 9 Zahlen.
// Zeitachse der App wie im PDF: bis 6 Wochen jeder Montag, bis 12 Wochen jeder zweite, darüber Monate.
import { test } from "node:test";
import assert from "node:assert/strict";
import { weicheKurve, gewichtDiagramm } from "../js/verlauf.js";

const G = (datum, kg) => ({ id: datum, tierId: "k", datum, kg, notiz: "" });

// Zahlen an der kg-Achse (links, rechtsbündig bei x = 28 in App und PDF).
const kgZahlen = (svg) => [...svg.matchAll(/<text class="achse" x="28" y="[\d.]+" text-anchor="end">([^<]+)<\/text>/g)].map((m) => m[1]);
const alsZahl = (text) => Number(text.replace(",", "."));

function pruefeAchse(zahlen, wo) {
  assert.ok(zahlen.length >= 3 && zahlen.length <= 9, `${wo}: ${zahlen.length} Zahlen (${zahlen.join(" ")})`);
  const werte = zahlen.map(alsZahl);
  const schritt = Math.round((werte[1] - werte[0]) * 10) / 10;
  assert.ok([0.1, 0.2, 0.5, 1, 2].includes(schritt), `${wo}: Schritt ${schritt}`);
  werte.forEach((w, i) => {
    if (i > 0) assert.equal(Math.round((w - werte[i - 1]) * 10) / 10, schritt, `${wo}: gleiche Abstände`);
    // Der Wert ist ein Vielfaches des Schritts, also steht keine gerundete Zahl an der Achse.
    assert.ok(Math.abs(w / schritt - Math.round(w / schritt)) < 1e-6, `${wo}: ${w} passt nicht zu ${schritt}`);
  });
}

test("App-Kurve: Stefans Fall 6,25 bis 6,75 kg steht in 0,1-kg-Schritten an der Achse, kein „6,3“ an 6,25", () => {
  const kurve = weicheKurve([G("2026-10-01", 6.75), G("2026-10-08", 6.5), G("2026-10-15", 6.25)], []);
  assert.deepEqual(kgZahlen(kurve), ["6,1", "6,2", "6,3", "6,4", "6,5", "6,6", "6,7", "6,8", "6,9"]);
});

test("App-Kurve: bei jeder Spanne glatte Schritte und höchstens 9 Zahlen", () => {
  for (const [von, bis] of [[9.32, 9.25], [9.32, 9.0], [9.32, 8.6], [9.32, 8.0], [9.32, 7.4], [9.32, 6.0], [7.33, 4.0], [12.4, 5.1]]) {
    const kurve = weicheKurve([G("2026-01-05", von), G("2026-11-02", bis)], []);
    pruefeAchse(kgZahlen(kurve), `App ${von}→${bis}`);
  }
});

test("PDF-Diagramm: bei jeder Spanne glatte Schritte und höchstens 9 Zahlen", () => {
  for (const [von, bis] of [[9.32, 9.25], [9.32, 9.0], [9.32, 8.6], [9.32, 8.0], [9.32, 7.4], [9.32, 6.0], [7.33, 4.0], [12.4, 5.1]]) {
    const svg = gewichtDiagramm([G("2026-01-05", von), G("2026-11-02", bis)], []);
    pruefeAchse(kgZahlen(svg), `PDF ${von}→${bis}`);
  }
});

test("PDF-Diagramm: 9,0 bis 10,0 kg nicht mehr in 0,25-Schritten (vorher „9,3“ an 9,25)", () => {
  const svg = gewichtDiagramm([G("2026-10-01", 9.75), G("2026-10-15", 9.3)], []);
  assert.deepEqual(kgZahlen(svg), ["9,0", "9,2", "9,4", "9,6", "9,8", "10,0"]);
});

// Zahlen an der Zeitachse der App-Kurve (Mitte, y = 214).
const zeitZahlen = (svg) => [...svg.matchAll(/<text class="achse" x="[\d.]+" y="214" text-anchor="middle">([^<]+)<\/text>/g)].map((m) => m[1]);

test("App-Kurve: bis 6 Wochen steht jeder Montag an der Zeitachse, mit Strich an der Grundlinie", () => {
  const kurve = weicheKurve([G("2026-10-02", 9.3), G("2026-11-13", 9.1)], []);
  assert.deepEqual(zeitZahlen(kurve), ["5.10.", "12.10.", "19.10.", "26.10.", "2.11.", "9.11."]);
  assert.equal((kurve.match(/class="achsen-strich"/g) ?? []).length, 6);
});

test("App-Kurve: bis 14 Wochen jeder zweite Montag, darüber Monate wie im PDF", () => {
  assert.deepEqual(zeitZahlen(weicheKurve([G("2026-09-01", 9.3), G("2026-11-13", 9.1)], [])), ["7.9.", "21.9.", "5.10.", "19.10.", "2.11."]);
  assert.deepEqual(zeitZahlen(weicheKurve([G("2026-06-01", 9.3), G("2026-11-13", 9.1)], [])), ["Jul", "Aug", "Sep", "Okt", "Nov"]);
});

// 0.67.0, Wunsch Stefan 06.11.2026 (Bild „3 Monate“ mit nur „Sep Okt Nov“): Zeitachse genauer, ohne Gedränge.
// „3 Monate“ (92 Tage) zeigt jetzt jeden zweiten Montag als Datum (Grenze 14 statt 12 Wochen), die Montage
// dazwischen bekommen einen kleinen Strich ohne Zahl. Bei Monatsnamen bis 26 Wochen kleine Striche an jedem Montag,
// darüber an den Monaten ohne Namen.
const kleineStriche = (svg) => (svg.match(/class="achsen-strich klein"/g) ?? []).length;
const grosseStriche = (svg) => (svg.match(/class="achsen-strich"/g) ?? []).length;

test("0.67.0: „3 Monate“ (92 Tage) mit jedem zweiten Montag als Datum, kleine Striche an den Montagen dazwischen", () => {
  const kurve = weicheKurve([G("2026-08-06", 9.3), G("2026-11-06", 9.1)], []);
  assert.deepEqual(zeitZahlen(kurve), ["10.8.", "24.8.", "7.9.", "21.9.", "5.10.", "19.10.", "2.11."]);
  assert.equal(grosseStriche(kurve), 7);
  assert.equal(kleineStriche(kurve), 6); // 17.8., 31.8., 14.9., 28.9., 12.10., 26.10.
});

test("0.67.0: Grenze 98 Tage noch Daten, 99 Tage Monatsnamen", () => {
  assert.deepEqual(zeitZahlen(weicheKurve([G("2026-08-07", 9.3), G("2026-11-13", 9.1)], [])), ["10.8.", "24.8.", "7.9.", "21.9.", "5.10.", "19.10.", "2.11."]);
  assert.deepEqual(zeitZahlen(weicheKurve([G("2026-08-06", 9.3), G("2026-11-13", 9.1)], [])), ["Sep", "Okt", "Nov"]);
});

test("0.67.0: bis 6 Wochen kein kleiner Strich, jeder Montag hat sein Datum", () => {
  assert.equal(kleineStriche(weicheKurve([G("2026-10-02", 9.3), G("2026-11-13", 9.1)], [])), 0);
});

test("0.67.0: Monatsnamen bis 26 Wochen mit kleinem Strich an jedem Montag", () => {
  const kurve = weicheKurve([G("2026-06-01", 9.3), G("2026-11-13", 9.1)], []); // 165 Tage, Montage 1.6. bis 9.11.
  assert.deepEqual(zeitZahlen(kurve), ["Jul", "Aug", "Sep", "Okt", "Nov"]);
  assert.equal(kleineStriche(kurve), 24);
});

test("0.67.0: über 26 Wochen kleine Striche nur an den Monaten ohne Namen, keine Wochen", () => {
  const kurve = weicheKurve([G("2025-11-01", 9.3), G("2026-11-13", 9.1)], []);
  assert.deepEqual(zeitZahlen(kurve), ["Dez", "Feb", "Apr", "Jun", "Aug", "Okt"]);
  assert.equal(kleineStriche(kurve), 6); // Jan, März, Mai, Juli, Sep, Nov
});

test("0.67.0: PDF nutzt dieselbe Zeitachse", () => {
  const svg = gewichtDiagramm([G("2026-08-06", 9.3), G("2026-11-06", 9.1)], [], "2026-11-06");
  const texte = [...svg.matchAll(/<text class="achse" x="[\d.]+" y="184" text-anchor="middle">([^<]+)<\/text>/g)].map((m) => m[1]);
  assert.deepEqual(texte, ["10.8.", "24.8.", "7.9.", "21.9.", "5.10.", "19.10.", "2.11."]);
  assert.equal(kleineStriche(svg), 6);
});
