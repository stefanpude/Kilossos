// 0.78.0 (Stefan 07.11.): Leckerlis stehen nicht mehr als eigene Karte unter „Letzte Messung“, sondern im
// Aufklappmenü „Mehr zur Fütterung“ der Karte „Gefüttert“. Die Zahlen kommen wie bisher aus leckerliKachel
// (gleiche Basis wie die Leckerli-Warnung). Der alte Satz „Leckerlis: … von höchstens …“ entfällt, damit nicht
// zwei Anteile mit verschiedener Bezugszahl nebeneinanderstehen.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { gefuettertMehrHtml, leckerliHtml } from "../js/heute-grafiken.js";
import { gefuettertMehr, leckerliKachel } from "../js/zusammenfassung.js";

const NBSP = String.fromCharCode(160);
const lies = (datei) => readFileSync(new URL("../" + datei, import.meta.url), "utf8");

const SORTEN = new Map([
  ["s", { id: "s", name: "Sheba", typ: "nass", kcalPro100g: 77, kcalQuelle: "hersteller", notiz: "" }],
  ["l", { id: "l", name: "Knabberstange", typ: "leckerli", kcalPro100g: 300, kcalQuelle: "hersteller", notiz: "" }],
]);
const MZ = (futterId, gramm, uhr, tag = "2026-11-05") => ({
  id: futterId + uhr,
  tierId: "k",
  futterId,
  gramm,
  zeitpunkt: new Date(`${tag}T${uhr}:00`).toISOString(),
  notiz: "",
});
const FREIGABE = { id: "f", tierId: "k", datum: "2026-10-01", zielgewichtKg: 7, kcalProTag: 220, tierarzt: "T", notiz: "" };

test("0.78.0: leckerliHtml mit Freigabe: Name, kcal, Anteil, Grenze und Balken, Zahl und Einheit mit NBSP", () => {
  // 4 g × 300 kcal/100 g = 12 kcal; Anteil 12 / max(89, 220) = 5,45 % → „5 %“ (ganze Zahl wie bisher), Balken 54,5 % der Grenze.
  const lk = leckerliKachel({ tag: "2026-11-05", heute: "2026-11-05", kcal: 89, leckerli: 12, freigabe: FREIGABE, warnungAktiv: false });
  const h = leckerliHtml(lk);
  assert.match(h, /class="gef-leckerli"/);
  assert.ok(h.includes(`<span class="label">Leckerli</span><span class="wert">12${NBSP}<small class="leise">kcal</small></span>`));
  assert.ok(h.includes(`5${NBSP}% der Tages-kcal · Grenze 10${NBSP}%`));
  assert.match(h, /<span class="balken sofort"><i style="--w: 54\.5%"><\/i><\/span>/);
  assert.doesNotMatch(h, /\d (kcal|g|%)/);
});

test("0.78.0: leckerliHtml: Warnung färbt den Balken, heute ohne Freigabe „wird am Tagesende bewertet“ ohne Balken", () => {
  const warn = leckerliKachel({ tag: "2026-11-05", heute: "2026-11-05", kcal: 100, leckerli: 30, freigabe: FREIGABE, warnungAktiv: true });
  assert.match(leckerliHtml(warn), /class="balken sofort gefahr"/);
  const ohne = leckerliHtml(leckerliKachel({ tag: "2026-11-05", heute: "2026-11-05", kcal: 100, leckerli: 6, freigabe: null, warnungAktiv: false }));
  assert.match(ohne, /wird am Tagesende bewertet/);
  assert.doesNotMatch(ohne, /balken/);
  // Vergangener Tag ohne Freigabe: Anteil an dem, was gefüttert wurde (6 / 200 = 3 %).
  const gestern = leckerliHtml(leckerliKachel({ tag: "2026-11-04", heute: "2026-11-05", kcal: 200, leckerli: 6, freigabe: null, warnungAktiv: false }));
  assert.ok(gestern.includes(`3${NBSP}% der Tages-kcal`));
});

test("0.78.0: „Mehr zur Fütterung“ zeigt den Leckerli-Block statt des alten Satzes, auch ohne Freigabe", () => {
  const mahlzeiten = [MZ("s", 100, "08:00"), MZ("l", 4, "15:00")];
  const lk = leckerliKachel({ tag: "2026-11-05", heute: "2026-11-05", kcal: 89, leckerli: 12, freigabe: FREIGABE, warnungAktiv: false });
  const mit = gefuettertMehrHtml(gefuettertMehr({ mahlzeiten, futterNachId: SORTEN, freigabe: FREIGABE, tag: "2026-11-05", heute: "2026-11-05" }), lk);
  assert.match(mit, /class="gef-leckerli"/);
  assert.doesNotMatch(mit, /Leckerlis:|höchstens/);
  // Block steht nach den Zeilen je Art.
  assert.ok(mit.indexOf('class="gef-zeilen"') < mit.indexOf('class="gef-leckerli"'));
  const lkOhne = leckerliKachel({ tag: "2026-11-05", heute: "2026-11-05", kcal: 89, leckerli: 12, freigabe: null, warnungAktiv: false });
  const ohne = gefuettertMehrHtml(gefuettertMehr({ mahlzeiten, futterNachId: SORTEN, freigabe: null, tag: "2026-11-05", heute: "2026-11-05" }), lkOhne);
  assert.match(ohne, /class="gef-leckerli"/);
  // Ohne Mahlzeit gibt es kein Aufklappmenü, also auch keinen Block.
  assert.equal(gefuettertMehrHtml(null, lk), "");
});

test("0.78.0: „Heute“ hat keine eigene Leckerli-Karte mehr, app.js reicht leckerliKachel an das Aufklappmenü", () => {
  const html = lies("index.html");
  const app = lies("app.js");
  assert.doesNotMatch(html, /id="heute-leckerli"/);
  assert.doesNotMatch(app, /heute-leckerli|leckerli-zeile/);
  assert.match(app, /gefuettertMehrHtml\(\s*gefuettertMehr\(\{ mahlzeiten, futterNachId: futter, freigabe, tag, heute \}\),\s*leckerliKachel\(/);
  const css = lies("styles.css");
  assert.doesNotMatch(css, /\.leckerli-zeile/);
  assert.match(css, /\.gef-leckerli \{/);
});
