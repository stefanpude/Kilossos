// 0.57.0: Eintrag „Tipps fürs Abnehmen“ unter „Wissen“ (Ideen-Tafel, Stefan 06.11.2026: „vor allem Finden“).
// Die Tipps stehen schon auf zwei Erklärseiten. Diese Seite verweist nur darauf und wiederholt keinen Ratschlag,
// damit nie zwei Fassungen desselben Texts auseinanderlaufen.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const lies = (datei) => readFileSync(new URL(`../${datei}`, import.meta.url), "utf8");
const blatt = (html, id) => html.match(new RegExp(`<dialog id="${id}">([\\s\\S]*?)</dialog>`))?.[1] ?? "";
const nurText = (html) => html.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ");

test("Eintrag unter „Wissen“ direkt nach „So nutzt du Kilossos“, öffnet die Seite", () => {
  const html = lies("index.html");
  const wissen = html.slice(html.indexOf('<h3 class="gruppe-titel">Wissen</h3>'), html.indexOf('<h3 class="gruppe-titel">Einstellungen</h3>'));
  const aktionen = [...wissen.matchAll(/data-aktion="([^"]+)"/g)].map((m) => m[1]);
  assert.deepEqual(aktionen.slice(0, 2), ["anleitung-erklaerung", "tipps-erklaerung"]);
  assert.ok(wissen.includes('<span class="text">Tipps fürs Abnehmen</span>'));
  assert.ok(lies("app.js").includes('case "tipps-erklaerung":\n      return $("dialog-tipps").showModal();'));
});

test("Seite: Überschrift mit Fokus, Verweise auf beide Erklärseiten, Knopf „Verstanden“", () => {
  const seite = blatt(lies("index.html"), "dialog-tipps");
  assert.ok(seite.includes('<h2 tabindex="-1" autofocus>Tipps fürs Abnehmen</h2>'));
  assert.ok(seite.includes('<button type="button" class="knopf-text" data-aktion="warum-nicht-ab">Warum nimmt meine Katze nicht ab?</button>'));
  assert.ok(seite.includes('<button type="button" class="knopf-text" data-aktion="alltag-erklaerung">Was hilft einer schweren Katze im Alltag?</button>'));
  assert.ok(seite.includes('<button value="abbrechen" class="knopf-haupt">Verstanden</button>'));
});

test("Jedes genannte Stichwort steht wirklich auf der verlinkten Seite", () => {
  const html = lies("index.html");
  const nichtAb = nurText(blatt(html, "dialog-nicht-ab"));
  const alltag = nurText(blatt(html, "dialog-alltag"));
  for (const h of ["Eine andere Katze frisst mit", "Nicht alle machen mit", "Leckerlis und Reste zählen mit", "Sie bettelt", "Ungenau abgemessen"]) {
    assert.ok(nichtAb.includes(h), h);
  }
  for (const h of ["Bewegung in kleinen Portionen", "Stufen an die Lieblingsplätze", "Eine bequeme Toilette", "Hilfe bei der Fellpflege", "Richtig hochheben"]) {
    assert.ok(alltag.includes(h), h);
  }
});

test("Keine eigenen Ratschläge: keine Mengen, keine Prozente, keine Gedankenstriche", () => {
  const text = nurText(blatt(lies("index.html"), "dialog-tipps"));
  assert.doesNotMatch(text, /\d/);
  assert.doesNotMatch(text, /[—–]/);
});
