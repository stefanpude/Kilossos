// 0.79.1 (Handy-Test Stefan, 07.11.2026): Auf dem Handy verschwand die Infoblase der Gewichtskurve und der Zeitleiste
// sofort beim Loslassen, weil der Browser nach dem Antippen auch „pointerleave“ meldet. Mit der Maus soll sie beim
// Verlassen weiter verschwinden, mit dem Finger erst beim Tippen woanders hin.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const app = readFileSync(new URL("../app.js", import.meta.url), "utf8");

test("0.79.1: Verlassen versteckt die Infoblase nur bei der Maus", () => {
  assert.match(app, /if \(ereignis\?\.type === "pointerleave" && ereignis\.pointerType !== "mouse"\) return;/);
  assert.match(app, /\$\("verlauf-inhalt"\)\.addEventListener\("pointerleave", versteckeInfoblase\);/);
});

test("0.79.1: Tippen außerhalb von Kurve und Zeitleiste versteckt die Infoblase", () => {
  assert.match(
    app,
    /document\.addEventListener\("pointerdown", \(ereignis\) => \{\s*if \(!ereignis\.target\.closest\?\.\("svg\.kurve, svg\.zeitleiste"\)\) versteckeInfoblase\(\);/
  );
});
