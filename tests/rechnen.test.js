import { test } from "node:test";
import assert from "node:assert/strict";
import {
  leseZahl,
  kcalFuer,
  kcalAusBestandteilen,
  tagesSumme,
  tagSchluessel,
  mahlzeitenAm,
  gewichteSortiert,
} from "../js/rechnen.js";

test("kcalAusBestandteilen: Purina One Light (Packung 11/2026, Feuchte angenommen)", () => {
  const purina = { protein: 37, fett: 9.5, asche: 7.5, faser: 6 };
  assert.equal(Math.round(kcalAusBestandteilen({ ...purina, feuchte: 8 })), 346);
  assert.equal(Math.round(kcalAusBestandteilen({ ...purina, feuchte: 6 })), 353);
  assert.equal(Math.round(kcalAusBestandteilen({ ...purina, feuchte: 10 })), 339);
});

test("leseZahl versteht Komma und Punkt", () => {
  assert.equal(leseZahl("9,32"), 9.32);
  assert.equal(leseZahl("9.32"), 9.32);
  assert.equal(leseZahl(" 85 "), 85);
});

test("leseZahl lehnt Ungültiges ab", () => {
  assert.equal(leseZahl(""), null);
  assert.equal(leseZahl("abc"), null);
  assert.equal(leseZahl("-5"), null);
  assert.equal(leseZahl("1,2,3"), null);
});

test("kcalFuer: Kitos Sorten", () => {
  assert.equal(kcalFuer(85, 77), 65.45); // ein Beutel Sheba
  assert.equal(kcalFuer(30, 360), 108); // 30 g Purina One Light
});

test("tagesSumme addiert Gramm und kcal und meldet ungefähre Werte", () => {
  const futter = new Map([
    ["sheba", { kcalPro100g: 77, kcalQuelle: "packung" }],
    ["purina", { kcalPro100g: 360, kcalQuelle: "ungefaehr" }],
  ]);
  const nurSheba = tagesSumme([{ futterId: "sheba", gramm: 85 }], futter);
  assert.deepEqual(nurSheba, { gramm: 85, kcal: 65.45, unsicher: false });

  const beide = tagesSumme(
    [
      { futterId: "sheba", gramm: 85 },
      { futterId: "purina", gramm: 30 },
    ],
    futter
  );
  assert.equal(beide.gramm, 115);
  assert.ok(Math.abs(beide.kcal - 173.45) < 1e-9);
  assert.equal(beide.unsicher, true);
});

test("tagesSumme eines leeren Tages ist null", () => {
  assert.deepEqual(tagesSumme([], new Map()), { gramm: 0, kcal: 0, unsicher: false });
});

test("tagSchluessel nutzt die Ortszeit", () => {
  assert.equal(tagSchluessel(new Date(2026, 10, 1, 23, 59)), "2026-11-01");
  assert.equal(tagSchluessel(new Date(2026, 0, 5, 0, 1)), "2026-01-05");
});

test("mahlzeitenAm filtert den Tag und sortiert nach Uhrzeit", () => {
  const abends = { zeitpunkt: new Date(2026, 10, 1, 19, 0).toISOString() };
  const morgens = { zeitpunkt: new Date(2026, 10, 1, 7, 0).toISOString() };
  const naechsterTag = { zeitpunkt: new Date(2026, 10, 2, 7, 0).toISOString() };
  assert.deepEqual(mahlzeitenAm([abends, naechsterTag, morgens], "2026-11-01"), [morgens, abends]);
});

test("gewichteSortiert: neueste zuerst, Original unverändert", () => {
  const liste = [{ datum: "2026-11-01" }, { datum: "2026-11-15" }, { datum: "2026-11-08" }];
  assert.deepEqual(gewichteSortiert(liste).map((g) => g.datum), ["2026-11-15", "2026-11-08", "2026-11-01"]);
  assert.equal(liste[0].datum, "2026-11-01");
});
