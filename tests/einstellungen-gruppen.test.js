// 0.78.0 (Stefan 07.11.): Unter „Mehr“ standen Wiegetag (gilt für ein Tier) und Darstellung (gilt für das Gerät)
// gemeinsam unter „Einstellungen“, der Wiege-Tipp stand unter beiden. Jetzt zwei Gruppen: „Wiegen“ an der alten
// Stelle mit dem Tipp, „App“ mit der Darstellung direkt vor „Über Kilossos“.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const start = html.indexOf('<section class="ansicht" data-ansicht="mehr"');
const mehr = html.slice(start, html.indexOf("</section>", start));
const titel = [...mehr.matchAll(/<h3 class="gruppe-titel"[^>]*>([^<]+)<\/h3>/g)].map((t) => t[1]);
const gruppe = (name) => {
  const a = mehr.indexOf(`<h3 class="gruppe-titel">${name}</h3>`);
  assert.ok(a >= 0, `Gruppe fehlt: ${name}`);
  const b = mehr.indexOf('<h3 class="gruppe-titel"', a + 1);
  return mehr.slice(a, b < 0 ? undefined : b);
};

// Seit 0.85.0 ohne „Wiegen“: Der Wiegetag steht auf der Seite „Gewicht“ (tests/wiegetag-ort.test.js).
test("0.85.0: Reihenfolge der Gruppen unter „Mehr“, keine Gruppe „Einstellungen“ und „Wiegen“ mehr", () => {
  assert.deepEqual(titel, ["Tiere", "Tierarztpraxis", "Übersicht für die Praxis", "Wissen", "Daten", "App", "Über Kilossos"]);
});

test("0.78.0: „App“ enthält nur die Darstellung, ohne Wiege-Tipp", () => {
  const a = gruppe("App");
  assert.match(a, /id="label-anzeige">Darstellung</);
  assert.match(a, /Gilt nur für dieses Gerät\./);
  assert.match(a, /<div id="anzeige-feld"><\/div>/);
  assert.doesNotMatch(a, /wiegetag|Wochentag/);
});
