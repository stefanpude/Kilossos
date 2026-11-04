// Kaputte oder fremde Sicherungen dürfen die App nicht lahmlegen (Fund vom 04.11.2026:
// ein null-Eintrag in "gewichte" ließ „Heute“ abstürzen). Ungültige Einträge fliegen raus, der Rest bleibt.
import { test } from "node:test";
import assert from "node:assert/strict";
import { eintraegeBereinigen, ersteDaten, laden, ENTFERNT_SCHLUESSEL } from "../js/daten.js";

function gueltigeDaten() {
  const d = ersteDaten({ name: "Kito", geschlecht: "kater", kastriert: true, wiegetag: 3 });
  const tierId = d.tiere[0].id;
  d.futter = [{ id: "f1", name: "Sheba", typ: "nass", kcalPro100g: 77, kcalQuelle: "geschaetzt" }];
  d.gewichte = [{ id: "g1", tierId, kg: 9.32, datum: "2026-10-28", notiz: "" }];
  d.mahlzeiten = [{ id: "m1", tierId, futterId: "f1", gramm: 50, zeitpunkt: "2026-11-01T07:00:00.000Z" }];
  d.freigaben = [{ id: "r1", tierId, datum: "2026-11-13", zielgewichtKg: 7.5, kcalProTag: 220, tierarzt: "", notiz: "" }];
  return d;
}

test("eintraegeBereinigen: gültige Daten bleiben unverändert", () => {
  const d = gueltigeDaten();
  const vorher = JSON.stringify(d);
  assert.equal(eintraegeBereinigen(d), 0);
  assert.equal(JSON.stringify(d), vorher);
});

test("eintraegeBereinigen: null, Zahl und Text als Eintrag fliegen raus", () => {
  const d = gueltigeDaten();
  d.gewichte.push(null, 5, "x");
  d.mahlzeiten.push(null);
  d.futter.push([]);
  d.freigaben.push(null);
  assert.equal(eintraegeBereinigen(d), 6);
  assert.equal(d.gewichte.length, 1);
  assert.equal(d.mahlzeiten.length, 1);
  assert.equal(d.futter.length, 1);
  assert.equal(d.freigaben.length, 1);
});

test("eintraegeBereinigen: falsche Typen in Pflichtfeldern", () => {
  const d = gueltigeDaten();
  const tierId = d.tiere[0].id;
  d.gewichte.push({ id: "g2", tierId, kg: "viel", datum: "2026-10-21" });
  d.gewichte.push({ id: "g3", tierId, kg: 9.4, datum: "kaputt" });
  d.mahlzeiten.push({ id: "m2", tierId, futterId: "f1", gramm: null, zeitpunkt: "2026-11-01T08:00:00.000Z" });
  d.mahlzeiten.push({ id: "m3", tierId, futterId: "f1", gramm: 20, zeitpunkt: 12345 });
  d.futter.push({ id: "f2", name: "X", typ: "nass", kcalPro100g: "x" });
  d.freigaben.push({ id: "r2", tierId, datum: null, zielgewichtKg: 7, kcalProTag: 200 });
  d.freigaben.push({ id: "r3", tierId, datum: "2026-11-13", kcalProTag: 200 });
  assert.equal(eintraegeBereinigen(d), 7);
  assert.deepEqual(d.gewichte.map((g) => g.id), ["g1"]);
  assert.deepEqual(d.mahlzeiten.map((m) => m.id), ["m1"]);
  assert.deepEqual(d.futter.map((f) => f.id), ["f1"]);
  assert.deepEqual(d.freigaben.map((f) => f.id), ["r1"]);
});

test("eintraegeBereinigen: kaputter Name wird „Tier“, Tier ohne id fliegt raus, Notiz als Nicht-Text wird geleert", () => {
  const d = gueltigeDaten();
  d.tiere[0].name = { a: 1 };
  d.tiere.push({ name: "Ohne id" });
  d.gewichte[0].notiz = { a: 1 };
  assert.equal(eintraegeBereinigen(d), 3);
  assert.equal(d.tiere.length, 1);
  assert.equal(d.tiere[0].name, "Tier");
  assert.equal(d.gewichte[0].notiz, "");
});

test("laden: kaputte Einträge legen die App nicht lahm und werden aufgehoben", () => {
  const d = gueltigeDaten();
  d.gewichte.push(null);
  const speicher = new Map([["kilossos-daten", JSON.stringify(d)]]);
  const s = { getItem: (k) => speicher.get(k) ?? null, setItem: (k, v) => speicher.set(k, v) };
  const geladen = laden(s);
  assert.equal(geladen.gewichte.length, 1);
  assert.deepEqual(JSON.parse(speicher.get(ENTFERNT_SCHLUESSEL)), [{ feld: "gewichte", eintrag: null }]);
});

test("eintraegeBereinigen: Mahlzeit ohne Futtersorte (vor 0.7.0 möglich) bleibt", () => {
  const d = gueltigeDaten();
  d.mahlzeiten[0].futterId = null;
  assert.equal(eintraegeBereinigen(d), 0);
  assert.equal(d.mahlzeiten.length, 1);
});
