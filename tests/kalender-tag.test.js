import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { tagAusKalender } from "../js/nachtragen.js";

const jetzt = new Date(2026, 10, 6, 20, 30); // Fr., 6. Nov. 2026, abends

test("0.70.0: tagAusKalender macht aus dem Kalenderwert einen Tag (Mitternacht, Ortszeit)", () => {
  const tag = tagAusKalender("2026-11-03", jetzt);
  assert.equal(tag.getFullYear(), 2026);
  assert.equal(tag.getMonth(), 10);
  assert.equal(tag.getDate(), 3);
  assert.equal(tag.getHours(), 0);
  assert.equal(tagAusKalender("2026-11-06", jetzt).getDate(), 6);
  assert.equal(tagAusKalender("2025-12-31", jetzt).getFullYear(), 2025);
});

test("0.70.0: tagAusKalender gibt null bei leerem, kaputtem oder zukünftigem Wert", () => {
  assert.equal(tagAusKalender("", jetzt), null);
  assert.equal(tagAusKalender(undefined, jetzt), null);
  assert.equal(tagAusKalender("2026-02-30", jetzt), null);
  assert.equal(tagAusKalender("6.11.2026", jetzt), null);
  assert.equal(tagAusKalender("2026-11-07", jetzt), null);
});

test("0.70.0: Der Tagestitel auf „Heute“ ist ein Knopf mit Kalender, die Tageswahl bleibt bei den Pfeilen", () => {
  const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
  const tagwahl = html.slice(html.indexOf('<div class="tagwahl">'), html.indexOf("</div>", html.indexOf('<div class="tagwahl">')));
  assert.match(tagwahl, /data-aktion="tag-kalender"/);
  assert.match(tagwahl, /id="tag-titel"/);
  assert.match(tagwahl, /data-symbol="kalender"/);
  assert.match(tagwahl, /<input type="date" id="tag-kalender"/);
  assert.match(tagwahl, /Tag im Kalender wählen/);
  const app = readFileSync(new URL("../app.js", import.meta.url), "utf8");
  assert.match(app, /case "tag-kalender":/);
  assert.match(app, /tagAusKalender\(/);
});
