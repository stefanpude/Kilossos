import { test } from "node:test";
import assert from "node:assert/strict";
import { gefuettertHtml, zahl, sicher } from "../js/heute-grafiken.js";
import { gefuettertWerte } from "../js/zusammenfassung.js";
import { GRENZEN } from "../js/rechnen.js";

// Beispiel-Katze mit Freigabe 220 kcal und drei Sorten (nur Testdaten).
const freigabe = { id: "f", tierId: "k", datum: "2026-10-08", zielgewichtKg: 7.2, kcalProTag: 220, tierarzt: "T", notiz: "" };
const SORTEN = new Map([
  ["n", { id: "n", name: "Nass", typ: "nass", kcalPro100g: 100, kcalQuelle: "hersteller", notiz: "" }],
  ["t", { id: "t", name: "Trocken", typ: "trocken", kcalPro100g: 400, kcalQuelle: "hersteller", notiz: "" }],
  ["l", { id: "l", name: "Leckerli", typ: "leckerli", kcalPro100g: 100, kcalQuelle: "hersteller", notiz: "" }],
]);
const MZ = (futterId, gramm, uhr) => ({ id: futterId + uhr, tierId: "k", futterId, gramm, zeitpunkt: `2026-11-05T${uhr}:00` });
const html = (mahlzeiten, mitFreigabe = true) =>
  gefuettertHtml(
    gefuettertWerte({ mahlzeiten, futterNachId: SORTEN, freigabe: mitFreigabe ? freigabe : null, tag: "2026-11-05", heute: "2026-11-05" })
  );
// 89 + 120 + 2 = 211 kcal, 121 g
const DREI = [MZ("n", 89, "08:00"), MZ("t", 30, "12:00"), MZ("l", 2, "18:00")];
// Nass in Gramm = kcal, dazu 25 g Trocken = 100 kcal.
const tagMit = (kcal) => [MZ("n", kcal - 100, "08:00"), MZ("t", 25, "12:00")];
const anzahl = (text, muster) => (text.match(muster) ?? []).length;

test("0.38.0: gefuettertHtml mit Freigabe: Stücke, Rest, Marke, Legende, Kacheln", () => {
  const h = html(DREI);
  assert.match(h, /Noch/);
  assert.ok(h.includes("9 kcal"), "9 kcal mit geschütztem Leerzeichen");
  assert.match(h, /class="gef-marke" style="left:100\.0%"/);
  assert.match(h, /class="gef-st nass" style="flex-grow:89\.0"/);
  assert.match(h, /class="gef-st trocken" style="flex-grow:120\.0"/);
  assert.match(h, /class="gef-st leckerli" style="flex-grow:2\.0"/);
  assert.match(h, /class="gef-st rest" style="flex-grow:9\.0"/);
  assert.equal(anzahl(h, /class="gef-st /g), 4);
  assert.match(h, /<span class="label">Futter<\/span><strong>121 g<\/strong>/);
  assert.match(h, /class="gef-feld" aria-hidden="true"/);
  assert.doesNotMatch(h, /gef-drueber/);
  assert.doesNotMatch(h, /Warum kein Ziel\?/);
  assert.doesNotMatch(h, /warn/);
});

test("0.38.0: gefuettertHtml über der Tagesmenge: grau bis zum Spielraum, darüber Bernstein", () => {
  const grau = html(tagMit(230));
  assert.match(grau, /Darüber/);
  assert.ok(grau.includes("10 kcal"));
  assert.match(grau, /class="gef-drueber" style="left:95\.7%"/);
  assert.match(grau, /class="gef-marke" style="left:95\.7%"/);
  assert.doesNotMatch(grau, /stark|warn/);
  assert.doesNotMatch(grau, /gef-st rest/);

  const stark = html(tagMit(245));
  assert.match(stark, /class="gef-drueber stark"/);
  assert.match(stark, /class="gef-kachel warn"><span class="label">Darüber<\/span><strong>25 kcal<\/strong>/);
  // Genau an der Grenze (Tagesmenge plus Spielraum) noch grau.
  const grenze = html(tagMit(Math.round((1 + GRENZEN.spielraum) * 220)));
  assert.match(grenze, /class="gef-drueber"/);
  assert.doesNotMatch(grenze, /stark|warn/);
});

test("0.38.0: gefuettertHtml ohne Freigabe: Legende, Satz und Knopf, kein Balken, keine Kachel", () => {
  const h = html(DREI, false);
  assert.match(h, /Ziel kommt mit der Freigabe vom Tierarzt\./);
  assert.match(h, /data-aktion="warum-kein-ziel"/);
  assert.match(h, /Warum kein Ziel\?/);
  assert.match(h, /gef-legende/);
  assert.match(h, /Nass 89/);
  assert.doesNotMatch(h, /gef-bahn|gef-feld|gef-marke|gef-kachel|Noch|Darüber|Darunter/);
});

test("0.38.0: gefuettertHtml ohne Mahlzeit mit Freigabe: Balken nur Rest, keine Legende, „Noch 220 kcal“", () => {
  const h = html([]);
  assert.doesNotMatch(h, /gef-legende/);
  assert.equal(anzahl(h, /class="gef-st /g), 1);
  assert.match(h, /class="gef-st rest" style="flex-grow:220\.0"/);
  assert.match(h, /<span class="label">Noch<\/span><strong>220 kcal<\/strong>/);
  assert.match(h, /<span class="label">Futter<\/span><strong>0 g<\/strong>/);
  assert.match(h, /class="gef-marke" style="left:100\.0%"/);
});

test("0.38.0: gefuettertHtml vergangener Tag und genau getroffen: „Darunter“ und „Noch 0 kcal“ ohne „-0“", () => {
  const gestern = gefuettertHtml(
    gefuettertWerte({ mahlzeiten: tagMit(150), futterNachId: SORTEN, freigabe, tag: "2026-11-04", heute: "2026-11-05" })
  );
  assert.match(gestern, /<span class="label">Darunter<\/span><strong>70 kcal<\/strong>/);
  const genau = html([MZ("n", 220.4, "08:00")]);
  assert.match(genau, /<span class="label">Noch<\/span><strong>0 kcal<\/strong>/);
  assert.doesNotMatch(genau, /-0/);
});

test("0.38.0: Legende nur für vorkommende Arten, in fester Reihenfolge", () => {
  const h = html(DREI);
  assert.match(h, /Nass 89[^]*Trocken 120[^]*Leckerli 2/);
  assert.equal(anzahl(h, /class="gef-chip /g), 3);
  const nurNass = html([MZ("n", 89, "08:00")]);
  assert.match(nurNass, /Nass 89/);
  assert.doesNotMatch(nurNass, /Trocken|Leckerli/);
  assert.equal(anzahl(nurNass, /class="gef-chip /g), 1);
});

test("0.38.0: keine Futtermenge als Empfehlung, kein „Wägung“", () => {
  const faelle = [html(DREI), html(DREI, false), html([]), html(tagMit(245)), html(tagMit(230))];
  for (const h of faelle) {
    assert.doesNotMatch(h, /Wägung/i);
    assert.doesNotMatch(h, /g Trocken/);
    assert.doesNotMatch(h, /\d+\s*g\s+(Nass|Trocken)/);
    assert.doesNotMatch(h, /NaN|undefined|Infinity/);
  }
});

test("0.38.0: zahl ohne „-0“, sicher maskiert HTML", () => {
  assert.equal(zahl(-0), "0");
  assert.equal(zahl(-0.3), "0");
  assert.equal(zahl(-0.004, 2), "0,00");
  assert.equal(zahl(1234.5, 1), "1.234,5");
  assert.equal(zahl(-12), "-12");
  assert.equal(sicher(`<b a="x">'&`), "&lt;b a=&quot;x&quot;&gt;&#39;&amp;");
});
