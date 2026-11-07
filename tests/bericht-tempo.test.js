// 0.77.0 (Prüfer A, 07.11.2026): Die Übersicht für die Praxis nennt ein Tempo pro Woche nur bei mindestens
// GRENZEN.tageTempo (7) Tagen Abstand, wie die App seit 0.75.0. Vorher stand bei 9,40 → 9,31 kg an zwei Tagen
// „6,70 % KM/Woche“ neben dem Zielbereich 0,5–2 %.
import { test } from "node:test";
import assert from "node:assert/strict";
import { berichtDaten, berichtHtml } from "../js/bericht.js";

const tier = { id: "kito", name: "Kito", art: "katze", geschlecht: "kater", kastriert: true };
const futter = [{ id: "sheba", name: "Sheba", typ: "nass", kcalPro100g: 77, kcalQuelle: "geschaetzt", notiz: "" }];
const g = (datum, kg) => ({ id: `g-${datum}`, tierId: "kito", datum, kg, notiz: "" });

function bericht(gewichte, von, bis) {
  const daten = { tier, gewichte, mahlzeiten: [], freigaben: [], besondereTage: [], futter, von, bis, heute: bis };
  const b = berichtDaten(daten);
  const html = berichtHtml(b, {
    tier,
    gewichte,
    mahlzeiten: [],
    freigaben: [],
    besondereTage: [],
    futterNachId: new Map(futter.map((f) => [f.id, f])),
    erstellt: bis,
    demo: false,
    fotos: false,
  });
  return { b, html };
}

test("0.77.0: zwei Wägungen einen Tag auseinander: kein Tempo pro Woche im Bericht", () => {
  const { b, html } = bericht([g("2026-10-31", 9.4), g("2026-11-01", 9.31)], "2026-10-25", "2026-11-01");
  assert.equal(b.abnahme.proWoche, null);
  assert.equal(b.abnahme.diffG, 90);
  assert.doesNotMatch(html, /6,70/);
  assert.match(html, /Tempo pro Woche erst ab 7 Tagen Abstand/);
});

test("0.77.0: Spalte „Monat“: Bilanz unter 7 Tagen nur in Gramm, ohne % KM/Woche", () => {
  const { html } = bericht([g("2026-10-31", 9.4), g("2026-11-01", 9.31)], "2026-10-25", "2026-11-01");
  assert.doesNotMatch(html, /6,70 % KM\/Woche/);
  assert.doesNotMatch(html, /\d % KM\/Woche<\/small>/);
});

test("0.77.0: ab 7 Tagen Abstand bleibt das Tempo wie bisher", () => {
  const { b, html } = bericht([g("2026-10-25", 9.4), g("2026-11-01", 9.31)], "2026-10-20", "2026-11-01");
  assert.ok(Math.abs(b.abnahme.proWoche - 0.957) < 0.01, String(b.abnahme.proWoche));
  assert.match(html, /im Mittel <strong>0,96 % KM\/Woche<\/strong>/);
});
