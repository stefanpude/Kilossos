// 0.77.1 (Prüfer B und D, Wortlaut mit Stefans Ja, 07.11.2026): Der Notfallsatz deckt auch die Katze ab, die nur noch
// ein paar Bissen frisst (häufiger Weg in die Fettleber). Vorher stand an 7 Stellen „einen Tag oder länger gar nicht“.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const html = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");

test("0.77.1: kein Notfallsatz mehr mit „gar nicht“", () => {
  assert.doesNotMatch(html, /einen Tag oder länger gar nicht/);
  assert.doesNotMatch(html, /für gar nicht\s+fressen/);
});

test("0.77.1: Notfallsatz als Satz und als Frage mit „nichts oder kaum etwas“", () => {
  const satz = html.match(/Frisst (deine|eine) Katze einen Tag lang nichts oder kaum etwas, gehört sie sofort zum Tierarzt\./g) ?? [];
  const frage = html.match(/Frisst deine Katze einen Tag lang nichts oder kaum etwas\?<\/strong>/g) ?? [];
  assert.ok(satz.length >= 5, `Sätze: ${satz.length}`);
  assert.equal(frage.length, 2, "Notfall-Kasten und ruhiger Hinweis auf „Heute“");
  assert.match(html, /frisst sie\s+nichts oder kaum etwas, gilt der rote Hinweis oben\./);
});
