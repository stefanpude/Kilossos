// 0.77.0 (Prüfer A, 07.11.2026): Zwei Wägungen am selben Tag. Gilt immer die zuletzt eingetragene (wie schon
// beim Vergleichsgewicht der Freigabe in js/freigaben.js). Vorher galt die zuerst eingetragene, und eine Korrektur
// nach unten konnte die Warnung „zu schnell“ verdecken.
import { test } from "node:test";
import assert from "node:assert/strict";
import { gewichteSortiert, warnungen } from "../js/rechnen.js";

const g = (id, datum, kg) => ({ id, tierId: "kito", datum, kg, notiz: "" });

test("0.77.0: gewichteSortiert: neueste zuerst, am selben Tag die zuletzt eingetragene vorn", () => {
  const liste = [g("a", "2026-10-23", 9.5), g("b", "2026-11-06", 9.4), g("c", "2026-11-06", 8.9), g("d", "2026-10-30", 9.45)];
  assert.deepEqual(
    gewichteSortiert(liste).map((x) => x.id),
    ["c", "b", "d", "a"],
  );
  // Die Eingabe bleibt unverändert.
  assert.deepEqual(
    liste.map((x) => x.id),
    ["a", "b", "c", "d"],
  );
});

test("0.77.0: Korrektur am selben Tag nach unten löst „zu schnell“ aus (Beispiel von Prüfer A)", () => {
  const gewichte = [g("a", "2026-10-23", 9.5), g("b", "2026-11-06", 9.4), g("c", "2026-11-06", 8.9)];
  const liste = warnungen({
    name: "Kito",
    tag: "2026-11-06",
    heute: "2026-11-06",
    kcal: 245,
    leckerli: 0,
    freigabe: { datum: "2026-10-01", zielgewichtKg: 6.5, kcalProTag: 245, tierarzt: "Praxis" },
    gewichte,
    fruehereMahlzeiten: true,
  });
  assert.ok(
    liste.some((w) => w.id === "zu-schnell"),
    liste.map((w) => w.id).join(", "),
  );
});
