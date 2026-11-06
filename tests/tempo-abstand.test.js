// 0.75.0 (Stefan 06.11.2026, Plan .planning/tempo-mindestabstand.md): Tempo erst ab 7 Tagen Abstand.
// Anlass: Kito 5.11. 8,49 kg, 6.11. 8,58 kg → „Zunahme 7,4 % pro Woche“ (90 g an einem Tag × 7).
// Vergleichsmessung = jüngste Wägung, die mindestens GRENZEN.tageTempo Tage vor der neuen liegt.
// Texte A, B, C mit Stefans Ja (06.11.2026).
import { test } from "node:test";
import assert from "node:assert/strict";
import { tempoRueckmeldung, messungWerte, wochenRaten } from "../js/zusammenfassung.js";
import { messungHtml } from "../js/heute-grafiken.js";
import { GRENZEN } from "../js/rechnen.js";

const G = (datum, kg) => ({ id: datum, tierId: "k", datum, kg, notiz: "" });
const FREIGABE = [{ id: "f", tierId: "k", datum: "2026-10-01", zielgewichtKg: 7.2, kcalProTag: 280, tierarzt: "T", notiz: "" }];
const nahe = (ist, soll, toleranz = 0.001) => assert.ok(Math.abs(ist - soll) < toleranz, `${ist} ist nicht ≈ ${soll}`);

const TEXT_A =
  "Für ein Tempo liegen die Messungen noch zu nah beieinander. Es erscheint ab 7 Tagen Abstand. " +
  "Das Gewicht schwankt von Tag zu Tag; am genauesten ist 1× pro Woche zur gleichen Zeit.";
const TEXT_B = "Das Tempo erscheint, wenn zwei Messungen mindestens 7 Tage auseinanderliegen.";

test("0.75.0: GRENZEN.tageTempo ist 7", () => {
  assert.equal(GRENZEN.tageTempo, 7);
});

test("0.75.0: Gewicht-Fenster, nur ein Tag Abstand: kein Tempo, Text A, Gramm zur Messung davor", () => {
  const r = tempoRueckmeldung({ gewichte: [G("2026-11-05", 8.49)], freigaben: FREIGABE, kg: 8.58, datum: "2026-11-06" });
  assert.equal(r.kurz, true);
  assert.equal(r.prozent, null);
  assert.equal(r.bewertung, "neutral");
  assert.equal(r.seit, "2026-11-05");
  nahe(r.diffKg, 0.09);
  assert.match(r.titel, /^\+0,09 kg seit dem 05\.11\./);
  assert.equal(r.text, TEXT_A);
});

test("0.75.0: Gewicht-Fenster mit Messung 7 Tage davor: Tempo gegen diese, nicht gegen gestern", () => {
  // 30.10. 8,92 → 6.11. 8,58: (8,92 − 8,58) / 8,92 = 3,81 % in genau einer Woche → zu schnell.
  const gewichte = [G("2026-10-30", 8.92), G("2026-11-05", 8.49)];
  const r = tempoRueckmeldung({ gewichte, freigaben: FREIGABE, kg: 8.58, datum: "2026-11-06" });
  assert.equal(r.kurz, undefined);
  assert.equal(r.seit, "2026-10-30");
  nahe(r.prozent, 3.812, 0.001);
  assert.equal(r.bewertung, "zu-schnell");
  assert.match(r.titel, /^−0,34 kg seit dem 30\.10\./);
});

test("0.75.0: genau 7 Tage zählen, 6 Tage nicht; die jüngste passende Messung gewinnt", () => {
  // 23.10. 9,00 / 30.10. 8,95 / 5.11. 8,94 → 6.11. 8,90: Vergleich mit 30.10. = 0,56 % → gut.
  const gewichte = [G("2026-10-23", 9.0), G("2026-10-30", 8.95), G("2026-11-05", 8.94)];
  const r = tempoRueckmeldung({ gewichte, freigaben: FREIGABE, kg: 8.9, datum: "2026-11-06" });
  assert.equal(r.seit, "2026-10-30");
  nahe(r.prozent, (0.05 / 8.95) * 100);
  assert.equal(r.bewertung, "gut");
  // 31.10. liegt nur 6 Tage vor dem 6.11.: zählt nicht, also wieder der 30.10.
  const mit31 = tempoRueckmeldung({ gewichte: [...gewichte, G("2026-10-31", 8.93)], freigaben: FREIGABE, kg: 8.9, datum: "2026-11-06" });
  assert.equal(mit31.seit, "2026-10-30");
});

test("0.75.0: ohne jede frühere Messung weiter keine Rückmeldung", () => {
  assert.equal(tempoRueckmeldung({ gewichte: [], freigaben: FREIGABE, kg: 8.58, datum: "2026-11-06" }), null);
});

test("0.75.0: Karte „Letzte Messung“, nur ein Tag Abstand: Kopf „+90 g seit 5.11.“, keine Skala, Text B", () => {
  const gewichte = [G("2026-11-05", 8.49), G("2026-11-06", 8.58)];
  const w = messungWerte({ gewichte, freigaben: FREIGABE, tag: "2026-11-06" });
  assert.equal(w.art, "mitVergleich");
  assert.equal(w.kurz, true);
  assert.equal(w.prozent, null);
  assert.equal(w.diffG, 90);
  assert.deepEqual(w.vorher, { datum: "2026-11-05", kg: 8.49 });
  const html = messungHtml(w);
  assert.match(html, /\+90 g seit 5\.11\./);
  assert.ok(html.includes(TEXT_B));
  assert.doesNotMatch(html, /mess-skala|pro Woche|im Blick behalten/);
});

test("0.75.0: Karte „Letzte Messung“ mit Messung 7 Tage davor: Kopf und Tempo zur selben Messung", () => {
  const gewichte = [G("2026-10-30", 8.92), G("2026-11-05", 8.49), G("2026-11-06", 8.58)];
  const w = messungWerte({ gewichte, freigaben: FREIGABE, tag: "2026-11-06" });
  assert.equal(w.kurz, undefined);
  assert.deepEqual(w.vorher, { datum: "2026-10-30", kg: 8.92 });
  assert.equal(w.diffG, -340);
  nahe(w.prozent, 3.812, 0.001);
  const html = messungHtml(w);
  assert.match(html, /−340 g seit 30\.10\./);
  assert.match(html, /mess-skala/);
  assert.ok(!html.includes(TEXT_B));
});

test("0.75.0: Satz unter der Skala hat 6 px Abstand zu den Skalenzahlen", async () => {
  const { readFileSync } = await import("node:fs");
  const css = readFileSync(new URL("../styles.css", import.meta.url), "utf8");
  // Als gap am Behälter: ein margin am p verliert gegen „.karte p { margin: 0 }“ (im Browser gemessen).
  assert.match(css, /\n\.mess-tempo \{ display: grid; gap: 6px; \}/);
});

test("0.75.0: Verlauf-Tempo: jeder Punkt gegen die Messung mindestens 7 Tage davor, sonst kein Punkt", () => {
  const gewichte = [G("2026-10-30", 8.92), G("2026-11-05", 8.49), G("2026-11-06", 8.58)];
  const raten = wochenRaten(gewichte, FREIGABE);
  // 5.11. hat davor nur den 30.10. (6 Tage): kein Punkt. 6.11. gegen 30.10.
  assert.deepEqual(raten.map((r) => [r.datum, r.vonDatum]), [["2026-11-06", "2026-10-30"]]);
  nahe(raten[0].prozent, 3.812, 0.001);
  // Wöchentlich gewogen bleibt alles wie vorher: jede Wägung gegen die Woche davor.
  const woechentlich = wochenRaten([G("2026-10-23", 9.0), G("2026-10-30", 8.95), G("2026-11-06", 8.9)], FREIGABE);
  assert.deepEqual(woechentlich.map((r) => r.vonDatum), ["2026-10-30", "2026-10-23"]);
});
