// PDF für den Tierarzt: „Kalorien pro Tag, Durchschnitt je Woche“ neu (0.68.0), Spezifikation
// .planning/grafiken-auswahl.md Abschnitt 4 (Variante B mit weichem Übergang, Stefans Wahl 05.11.2026, gebaut 06.11.).
// Punkte je Woche auf enger Achse, Freigabe als Stufe am Tag, Band ±10 % um den Bezugswert der Woche, Leckerli-Spur.
import { test } from "node:test";
import assert from "node:assert/strict";
import { kcalDiagramm, wochenKcal, wochenBezug, kcalAchse, kcalBand } from "../js/verlauf.js";

const ms = (iso) => {
  const [j, m, t] = iso.split("-").map(Number);
  return new Date(j, m - 1, t).getTime();
};
const tage = (von, anzahl) =>
  Array.from({ length: anzahl }, (_, i) => {
    const [j, m, t] = von.split("-").map(Number);
    const d = new Date(j, m - 1, t + i);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  });
// Futter mit 100 kcal pro 100 g: Gramm = kcal. Leckerli ebenso.
const futterNachId = new Map([
  ["s", { id: "s", typ: "nass", kcalPro100g: 100 }],
  ["l", { id: "l", typ: "leckerli", kcalPro100g: 100 }],
]);
const M = (tag, kcal, futterId = "s") => ({ tierId: "k", futterId, gramm: kcal, zeitpunkt: new Date(`${tag}T08:00:00`).toISOString() });
const F = (datum, kcalProTag) => ({ id: datum, tierId: "k", datum, kcalProTag, zielgewichtKg: 7.2 });
const ALT = F("2026-10-01", 250);
const NEU = F("2026-11-04", 220); // Mittwoch

// ---------- Bezugswert je Woche ----------
test("wochenBezug: Woche ohne Wechsel = die Freigabe dieser Woche", () => {
  assert.equal(wochenBezug(tage("2026-10-26", 7), [ALT]), 250);
});

test("wochenBezug: Wechsel am Mittwoch, alle 7 Tage eingetragen = (2 × alt + 5 × neu) ÷ 7", () => {
  assert.ok(Math.abs(wochenBezug(tage("2026-11-02", 7), [ALT, NEU]) - (2 * 250 + 5 * 220) / 7) < 1e-9);
});

test("wochenBezug: nur 3 eingetragene Tage zählen (Mo, Mi, Fr)", () => {
  assert.ok(Math.abs(wochenBezug(["2026-11-02", "2026-11-04", "2026-11-06"], [ALT, NEU]) - (250 + 220 + 220) / 3) < 1e-9);
});

test("wochenBezug: Woche der ersten Freigabe hat keinen Bezugswert", () => {
  assert.equal(wochenBezug(tage("2026-11-02", 7), [NEU]), null);
  assert.equal(wochenBezug(tage("2026-11-02", 7), []), null);
});

test("wochenKcal: Wochen-Ø, Leckerli und Bezugswert aus den eingetragenen Tagen", () => {
  const mz = [...tage("2026-11-02", 7).map((t) => M(t, 220)), M("2026-11-03", 14, "l")];
  const [w] = wochenKcal(mz, futterNachId, [ALT, NEU]);
  assert.equal(w.montag, "2026-11-02");
  assert.equal(w.kcal, 222);
  assert.equal(w.leckerli, 2);
  assert.ok(Math.abs(w.bezug - (2 * 250 + 5 * 220) / 7) < 1e-9);
});

// ---------- Achse ----------
test("kcalAchse: mit Freigabe Freigabe ±15 %, auf 20 kcal gerundet, Hilfslinien alle 20", () => {
  assert.deepEqual(kcalAchse([231, 245], [250]), { lo: 200, hi: 300, schritt: 20 });
});

test("kcalAchse: ohne Freigabe Werte −10 % bis +8 %, mindestens 80 kcal Spanne, ab 120 kcal Spanne alle 40", () => {
  assert.deepEqual(kcalAchse([231, 245], []), { lo: 200, hi: 280, schritt: 20 });
  assert.deepEqual(kcalAchse([100, 101], []), { lo: 40, hi: 120, schritt: 20 });
  // Im 40er-Raster endet die Achse oben auf einer Hilfslinie (Anfang bleibt, Ende = Anfang + ganze Schritte).
  assert.deepEqual(kcalAchse([150, 300], []), { lo: 120, hi: 360, schritt: 40 });
  assert.deepEqual(kcalAchse([300, 266], [300, 270]), { lo: 220, hi: 380, schritt: 40 }); // Demo „alles“: vorher 220–360 ohne Linie oben
});

test("kcalDiagramm: die unterste Hilfslinie hat keine Zahl (steht im Hinweis), damit sie nicht ans erste Datum stößt", () => {
  const mz = tage("2026-10-26", 14).map((t) => M(t, 240));
  const zahlen = [...kcalDiagramm(mz, futterNachId, [ALT]).matchAll(/<text class="achse" x="28" y="[\d.]+" text-anchor="end">(\d+)<\/text>/g)].map((m) => m[1]);
  assert.deepEqual(zahlen, ["220", "240", "260", "280", "300"]);
});

// ---------- Band ----------
test("kcalBand: an jeder Wochenmitte genau der Bezugswert, dazwischen weicher Übergang", () => {
  const A = ms("2026-10-29") + 12 * 3600000;
  const B = ms("2026-11-05") + 12 * 3600000;
  const C = ms("2026-11-12") + 12 * 3600000;
  const bezugB = (2 * 250 + 5 * 220) / 7;
  const S = ms("2026-10-26");
  const E = ms("2026-11-16");
  const p = kcalBand([{ mitteMs: A, bezug: 250 }, { mitteMs: B, bezug: bezugB }, { mitteMs: C, bezug: 220 }], 250, S, E);
  assert.deepEqual(p[0], [S, 250]);
  assert.deepEqual(p.at(-1), [E, 220]);
  for (const [t, v] of [[A, 250], [B, bezugB], [C, 220]]) assert.ok(p.some(([pt, pv]) => pt === t && pv === v), `Wochenmitte ${new Date(t).toDateString()}`);
  const zwischen = p.filter(([t]) => t > A && t < B);
  assert.equal(zwischen.length, 15);
  zwischen.forEach(([, v], i) => assert.ok(v < (i ? zwischen[i - 1][1] : 250) && v > bezugB, "fällt stetig"));
});

test("kcalBand: ändert sich nichts, ist das Band gerade (keine Zwischenpunkte)", () => {
  const p = kcalBand([{ mitteMs: 10, bezug: 250 }, { mitteMs: 20, bezug: 250 }], 250, 0, 30);
  assert.ok(p.every(([, v]) => v === 250));
  assert.equal(p.length, 4);
});

// ---------- Diagramm ----------
const punkte = (svg) => [...svg.matchAll(/<circle class="kcal-punkt( raus)?" cx="([\d.]+)" cy="([\d.]+)" r="([\d.]+)"\/>/g)].map((m) => ({ raus: !!m[1], x: Number(m[2]), y: Number(m[3]), r: m[4] }));
const stufe = (svg) => svg.match(/<polyline class="freigabe-linie" points="([^"]+)"/)?.[1].split(" ").map((p) => p.split(",").map(Number));

test("kcalDiagramm: Freigabe springt am Tag der neuen Freigabe, nicht an der Wochengrenze", () => {
  const mz = tage("2026-10-26", 21).map((t) => M(t, 240));
  const svg = kcalDiagramm(mz, futterNachId, [ALT, NEU]);
  // Achse 26.10. bis 16.11. (21 Tage) auf 34 bis 288; der 4.11. liegt nach 9 Tagen.
  const xWechsel = Math.round((34 + (9 / 21) * 254) * 10) / 10;
  const p = stufe(svg);
  const amWechsel = p.filter(([x]) => x === xWechsel);
  assert.equal(amWechsel.length, 2, `zwei Punkte bei x=${xWechsel}: ${JSON.stringify(p)}`);
  assert.notEqual(amWechsel[0][1], amWechsel[1][1]);
  assert.match(svg, /class="kcal-band"/);
});

test("kcalDiagramm: Achse eng mit Hinweis „Achse beginnt bei …“", () => {
  const mz = tage("2026-10-26", 14).map((t) => M(t, 240));
  assert.match(kcalDiagramm(mz, futterNachId, [ALT]), /<text class="kcal-hinweis"[^>]*>Achse beginnt bei 200 kcal<\/text>/);
});

test("kcalDiagramm: mehr als 10 % daneben = Punkt in Bernstein mit Wert, nicht in der Woche der ersten Freigabe", () => {
  // Woche 2.11.: erste Freigabe am Mittwoch, kein Bezug; Woche 9.11.: 300 statt 220.
  const mz = tage("2026-11-02", 14).map((t) => M(t, 300));
  const svg = kcalDiagramm(mz, futterNachId, [NEU]);
  assert.deepEqual(punkte(svg).map((p) => p.raus), [false, true]);
  assert.match(svg, /<text class="kcal-wert"[^>]*>300<\/text>/);
  assert.equal((svg.match(/class="kcal-wert"/g) ?? []).length, 1);
});

test("kcalDiagramm: leere Woche unterbricht die Linie, Punkte stehen an ihrer Wochenmitte", () => {
  const mz = [...tage("2026-10-05", 14), ...tage("2026-10-26", 7)].map((t) => M(t, 240));
  const svg = kcalDiagramm(mz, futterNachId, []);
  const linien = [...svg.matchAll(/<polyline class="kcal-linie" points="([^"]+)"/g)];
  assert.equal(linien.length, 1, "nur das Stück 5.10.–12.10.; die Woche 26.10. steht allein");
  assert.equal(linien[0][1].split(" ").length, 2);
  const innen = 340 - 34 - 52;
  const soll = [0.5, 1.5, 3.5].map((k) => Math.round((34 + (innen * k) / 4) * 10) / 10);
  assert.deepEqual(punkte(svg).map((p) => p.x), soll);
});

test("kcalDiagramm: ohne Freigabe kein Band und keine Stufe", () => {
  const svg = kcalDiagramm(tage("2026-10-26", 7).map((t) => M(t, 240)), futterNachId, []);
  assert.doesNotMatch(svg, /kcal-band|freigabe-linie/);
});

test("kcalDiagramm: Leckerli-Spur je Woche, über 10 % in voller Farbe, Grenze bei 10 %", () => {
  const mz = [
    ...tage("2026-10-26", 7).flatMap((t) => [M(t, 220), M(t, 20, "l")]), // 20 von 240 = 8,3 %
    ...tage("2026-11-02", 7).flatMap((t) => [M(t, 200), M(t, 40, "l")]), // 40 von 240 = 16,7 %
  ];
  const svg = kcalDiagramm(mz, futterNachId, []);
  const balken = [...svg.matchAll(/<rect class="kcal-leck( raus)?"/g)].map((m) => !!m[1]);
  assert.deepEqual(balken, [false, true]);
  assert.match(svg, /<line class="kcal-grenze"/);
  assert.match(svg, />10 %<\/text>/);
});

test("kcalDiagramm: Tooltip je Woche, in der Woche des Wechsels mit beiden Freigaben", () => {
  const mz = tage("2026-10-26", 14).map((t) => M(t, 240));
  const svg = kcalDiagramm(mz, futterNachId, [ALT, NEU]);
  assert.match(svg, /data-tip="Woche ab 26\. Okt\.: Ø 240 kcal\/Tag, davon 0 Leckerli · freigegeben 250"/);
  assert.match(svg, /data-tip="Woche ab 2\. Nov\.: Ø 240 kcal\/Tag, davon 0 Leckerli · freigegeben 250, ab 4\. Nov\. 220"/);
});

test("kcalDiagramm: keine kaputten Zahlen, auch bei nur einem Tag", () => {
  const svg = kcalDiagramm([M("2026-11-04", 240)], futterNachId, [NEU]);
  assert.doesNotMatch(svg, /NaN|Infinity|undefined/);
});

// ---------- Funde des Prüfers (06.11.2026 abends) ----------
const achsenZahlen = (svg) =>
  [...svg.matchAll(/<text class="achse" x="28" y="([\d.]+)" text-anchor="end">([\d.]+)<\/text>/g)].map((m) => Number(m[2].replaceAll(".", ""))); // „1.000“

test("Prüfer 1: genau +10 % gilt wie in der App als eingehalten (242 bei 220), 243 nicht", () => {
  const svg = (kcal) => kcalDiagramm(tage("2026-11-09", 7).map((t) => M(t, kcal)), futterNachId, [F("2026-11-01", 220)]);
  assert.deepEqual(punkte(svg(242)).map((p) => p.raus), [false]);
  assert.deepEqual(punkte(svg(198)).map((p) => p.raus), [false]);
  assert.deepEqual(punkte(svg(243)).map((p) => p.raus), [true]);
  assert.deepEqual(punkte(svg(197)).map((p) => p.raus), [true]);
});

test("Prüfer 2: Ausreißer (0 kcal und Tippfehler) ergeben höchstens 9 Achsenzahlen in runden Schritten", () => {
  const mz = [...tage("2026-10-05", 7).map((t) => M(t, 240)), M("2026-10-12", 4000), ...tage("2026-10-19", 7).map((t) => M(t, 240))];
  const unbekannt = { tierId: "k", futterId: "weg", gramm: 50, zeitpunkt: new Date("2026-10-27T08:00:00").toISOString() };
  const svg = kcalDiagramm([...mz, unbekannt], futterNachId, [F("2026-10-01", 250)]);
  const z = achsenZahlen(svg);
  assert.ok(z.length >= 3 && z.length <= 9, `${z.length} Zahlen: ${z.join(" ")}`);
  z.forEach((v) => assert.equal(v % 100, 0, `${v} ist kein runder Schritt`));
});

test("Prüfer 3: Wert eines Ausreißers ganz oben steht unter dem Punkt, nicht über dem Rand", () => {
  const svg = kcalDiagramm(tage("2026-11-09", 7).map((t) => M(t, 300)), futterNachId, [F("2026-11-01", 220)]);
  const [p] = punkte(svg);
  const wertY = Number(svg.match(/<text class="kcal-wert" x="[\d.]+" y="([\d.]+)"/)[1]);
  assert.ok(wertY >= 18, `Wert bei y=${wertY} (Punkt bei y=${p.y})`);
});

test("Prüfer 4: bei vielen Wochen keine Zahlen über den Punkten, „daneben“ trotzdem erkennbar (raus)", () => {
  const svg = kcalDiagramm(tage("2025-09-01", 60 * 7).map((t) => M(t, 300)), futterNachId, [F("2025-08-01", 220)]);
  assert.doesNotMatch(svg, /class="kcal-wert"/);
  assert.ok(punkte(svg).every((p) => p.raus && p.r === "2.4"));
});

test("Prüfer 6: Legende nennt den Spielraum aus GRENZEN", async () => {
  const { GRENZEN } = await import("../js/rechnen.js");
  assert.equal(GRENZEN.spielraum, 0.1);
});

test("Prüfer 7: Tooltip nennt das echte Datum der Freigabe, auch an einem Tag ohne Eintrag", () => {
  const mz = ["2026-11-02", "2026-11-06"].map((t) => M(t, 240)); // Mo und Fr, Freigabe am Mi
  assert.match(kcalDiagramm(mz, futterNachId, [ALT, NEU]), /freigegeben 250, ab 4\. Nov\. 220"/);
});

test("Band: Kanten genau ±10 % um die Freigabe; Freigabe vor dem Zeitraum = Band ab Achsenanfang", () => {
  const svg = kcalDiagramm(tage("2026-10-26", 14).map((t) => M(t, 240)), futterNachId, [ALT]);
  const pkt = svg.match(/<polygon class="kcal-band" points="([^"]+)"/)[1].split(" ").map((p) => p.split(",").map(Number));
  assert.equal(pkt[0][0], 34, "beginnt am Achsenanfang");
  // Achse 200 bis 300 auf 148 bis 12: 275 → 46, 225 → 114.
  assert.ok(pkt.slice(0, pkt.length / 2).every(([, y]) => y === 46));
  assert.ok(pkt.slice(pkt.length / 2).every(([, y]) => y === 114));
});
