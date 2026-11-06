// Futterart „Frischfleisch / BARF“ (0.72.0, Plan .planning/barf.md). Schlüssel "frischfleisch", nicht "frisch":
// Die CSS-Klasse .frisch und die Funktion frisch() in app.js gibt es schon (Aufleuchten des kcal-Felds).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { kcalPruefen, kcalKasten, rechnerPruefen, KCAL_GRENZEN, tagesSumme, leckerliKcal } from "../js/rechnen.js";
import { gefuettertWerte, gefuettertMehr } from "../js/zusammenfassung.js";
import { gefuettertHtml, gefuettertMehrHtml } from "../js/heute-grafiken.js";
import { laden, speichern, istGueltig } from "../js/daten.js";
import { SYMBOL } from "../js/symbole.js";
import { BEGRIFFE, kcalSpanne } from "../js/wissen.js";

const NBSP = String.fromCharCode(160);
const ohneUmbruch = (text) => assert.doesNotMatch(text, /\d (kcal|kJ|g\b|%)/, text);
const lies = (datei) => readFileSync(new URL("../" + datei, import.meta.url), "utf8");

// ---------- kcal-Rückfrage ----------

test("Frischfleisch: Grenze 300 kcal, genau 300 ist in Ordnung", () => {
  assert.equal(KCAL_GRENZEN.frischfleisch, 300);
  assert.equal(kcalPruefen(300, "frischfleisch").stufe, "ok");
  assert.equal(kcalPruefen(254, "frischfleisch").stufe, "ok");
  assert.equal(kcalPruefen(300.1, "frischfleisch").stufe, "rueckfrage");
});

test("Frischfleisch 502 (mageres Fleisch in kJ) → Rückfrage mit 120 kcal und 50,2", () => {
  assert.deepEqual(kcalPruefen(502, "frischfleisch"), { stufe: "rueckfrage", kj: 120, proKg: 50.2 });
});

test("Frischfleisch 800 → unmöglich, wie bei den anderen Arten", () => {
  assert.equal(kcalPruefen(800, "frischfleisch").stufe, "unmoeglich");
});

test("Rückfrage-Text Frischfleisch: Stefans Wortlaut (06.11.), Rinderhack mit Quelle, keine Spanne aus der Futterliste", () => {
  const k = kcalKasten(502, "frischfleisch", kcalSpanne("frischfleisch"));
  assert.equal(k.stufe, "rueckfrage");
  assert.equal(k.ueberschrift, `502${NBSP}kcal pro 100${NBSP}g sind für Frischfleisch ungewöhnlich viel.`);
  assert.deepEqual(k.saetze, [
    `Rohes Rinderhack mit 20${NBSP}% Fett hat etwa 254${NBSP}kcal pro 100${NBSP}g (USDA). Was steht auf der Packung hinter der 502?`,
  ]);
  assert.deepEqual(
    k.antworten.map((a) => a.aktion),
    ["kcal-kj", "kcal-kg", "kcal-stimmt"],
  );
  for (const t of [k.ueberschrift, ...k.saetze, ...k.antworten.flatMap((a) => [a.titel, a.klein])]) ohneUmbruch(t);
  assert.doesNotMatch(k.saetze.join(" "), /Infinity|NaN|Futterliste/);
});

test("Rückfrage-Text der anderen Arten bleibt unverändert", () => {
  const k = kcalKasten(307, "nass", [54, 126]);
  assert.equal(k.ueberschrift, `307${NBSP}kcal pro 100${NBSP}g sind für Nassfutter viel zu viel.`);
  assert.match(k.saetze[0], /^Nassfutter hat in der Kilossos-Futterliste 54 bis 126/);
});

// ---------- Rechner „Keine kcal auf der Packung?“ ----------

const MAGER = { protein: "20", fett: "8", asche: "1", faser: "0", feuchte: "70" };
const FETT = { protein: "15", fett: "30", asche: "1", faser: "0", feuchte: "54" };

test("Rechner Frischfleisch: ohne Feuchte keine Rechnung (wie Nassfutter, 8 % wären bei Fleisch weit daneben)", () => {
  assert.equal(rechnerPruefen({ ...MAGER, feuchte: "" }, "frischfleisch").art, "feuchteFehlt");
});

// Von Hand (NRC 2006): fett 5,7 × 15 + 9,4 × 30 = 367,5; × 0,879 = 323,03; − 0,77 × 15 = 311,48 → 311.
test("Rechner Frischfleisch: mager 155 kcal ist nicht viel, fett 311 kcal ist viel (Grenze 300, nicht 450)", () => {
  const mager = rechnerPruefen(MAGER, "frischfleisch");
  assert.equal(mager.kcal, 155);
  assert.equal(mager.viel, false);
  const fett = rechnerPruefen(FETT, "frischfleisch");
  assert.equal(fett.kcal, 311);
  assert.equal(fett.viel, true);
  // Leckerli und Trocken behalten 450
  assert.equal(rechnerPruefen(FETT, "trocken").viel, false);
  assert.equal(rechnerPruefen(FETT, "leckerli").viel, false);
});

test("app.js: Feuchte-Hinweis und „viel“-Satz für Frischfleisch im Wortlaut", () => {
  const app = lies("app.js");
  assert.ok(app.includes("Ohne Feuchte stimmt die Rechnung bei Frischfleisch nicht."));
  assert.ok(app.includes("Steht sie nicht auf der Packung, nimm den kcal-Wert aus der Nährwerttabelle (Brennwert)."));
  assert.match(app, /ART_DATIV = \{[^}]*frischfleisch: "Frischfleisch"/);
});

// ---------- Auswahl, Namen, Symbol ----------

test("Eigene Sorte: Art „Frischfleisch / BARF“ zwischen Trockenfutter und Leckerli", () => {
  const app = lies("app.js");
  const optionen = app.match(/const TYP_OPTIONEN = \[([\s\S]*?)\];/)[1];
  const werte = [...optionen.matchAll(/wert: "(\w+)"/g)].map((m) => m[1]);
  assert.deepEqual(werte, ["nass", "trocken", "frischfleisch", "leckerli"]);
  assert.ok(optionen.includes('{ wert: "frischfleisch", text: "Frischfleisch / BARF" }'));
  assert.match(app, /const TYP_NAMEN = \{[^}]*frischfleisch: "Frischfleisch \/ BARF"/);
  assert.match(app, /const TYP_SYMBOL = \{[^}]*frischfleisch: SYMBOL\.frischfleisch/);
  assert.match(app, /\["nass", "trocken", "frischfleisch", "leckerli"\]\s*\.map\(\(typ\)/, "Gruppen auf „Futter“");
});

test("Symbol frischfleisch: eigenes Linien-Icon wie die anderen Futterarten", () => {
  assert.match(SYMBOL.frischfleisch, /^<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"/);
  for (const art of ["nass", "trocken", "leckerli", "unbekannt"]) assert.notEqual(SYMBOL.frischfleisch, SYMBOL[art]);
  assert.match(lies("js/verlauf.js"), /const TYP_SYMBOL = \{[^}]*frischfleisch: SYMBOL\.frischfleisch/);
});

test("PDF-Spalte Art: „frisch“", () => {
  assert.match(lies("js/bericht.js"), /const TYP = \{[^}]*frischfleisch: "frisch"/);
});

test("Begriff BARF nennt die Art „Frischfleisch / BARF“", () => {
  const barf = BEGRIFFE.find((b) => b.id === "barf");
  assert.ok(
    barf.text.includes(
      "deshalb legst du BARF in Kilossos als eigene Sorte mit der Art „Frischfleisch / BARF“ und dem kcal-Wert von der " +
        "Packung oder aus dem Rationsplan an.",
    ),
    barf.text,
  );
});

// ---------- Karte „Gefüttert“ auf „Heute“ ----------

const freigabe = { id: "f", tierId: "k", datum: "2026-10-08", zielgewichtKg: 7.2, kcalProTag: 220, tierarzt: "T", notiz: "" };
const SORTEN = new Map([
  ["n", { id: "n", name: "Nass", typ: "nass", kcalPro100g: 100, kcalQuelle: "hersteller", notiz: "" }],
  ["b", { id: "b", name: "Tatar", typ: "frischfleisch", kcalPro100g: 120, kcalQuelle: "packung", notiz: "" }],
  ["l", { id: "l", name: "Leckerli", typ: "leckerli", kcalPro100g: 100, kcalQuelle: "hersteller", notiz: "" }],
]);
const MZ = (futterId, gramm, uhr) => ({ id: futterId + uhr, tierId: "k", futterId, gramm, zeitpunkt: `2026-11-05T${uhr}:00` });
// Leckerli zuerst gefüttert: Die Legende hält trotzdem die feste Reihenfolge.
const TAG = [MZ("l", 2, "07:00"), MZ("b", 50, "08:00"), MZ("n", 100, "12:00")];
const eingabe = { mahlzeiten: TAG, futterNachId: SORTEN, freigabe, tag: "2026-11-05", heute: "2026-11-05" };

test("Gefüttert: Frischfleisch bekommt ein eigenes Stück und zählt nicht als Nassfutter", () => {
  const w = gefuettertWerte(eingabe);
  assert.deepEqual(w.stuecke.map((s) => s.typ), ["leckerli", "frischfleisch", "nass"]);
  assert.deepEqual(w.arten, [
    { typ: "nass", kcal: 100 },
    { typ: "frischfleisch", kcal: 60 },
    { typ: "leckerli", kcal: 2 },
  ]);
});

test("Gefüttert: Legende „Frisch“, Stück mit eigener Klasse, „Mehr zur Fütterung“ mit „Frischfleisch“", () => {
  const h = gefuettertHtml(gefuettertWerte(eingabe));
  assert.ok(h.includes(`<i class="gef-chip frischfleisch" aria-hidden="true"></i>Frisch 60`), h);
  assert.match(h, /class="gef-st frischfleisch"/);
  const mehr = gefuettertMehrHtml(gefuettertMehr(eingabe));
  assert.ok(mehr.includes(`<span>Frischfleisch</span><span>50${NBSP}g</span><b>60${NBSP}kcal</b>`), mehr);
});

test("Frischfleisch zählt nicht in die Leckerli-Grenze, aber in die Tagessumme", () => {
  assert.equal(leckerliKcal(TAG, SORTEN), 2);
  assert.equal(tagesSumme(TAG, SORTEN).kcal, 162);
});

test("styles.css: Farbe für Frischfleisch im Balken und in der Legende", () => {
  assert.match(lies("styles.css"), /\.gef-chip\.frischfleisch, \.gef-st\.frischfleisch \{ background:/);
});

// ---------- Datenformat (Skill migration: nur erweitern) ----------

function testSpeicher() {
  const inhalt = new Map();
  return {
    getItem: (k) => (inhalt.has(k) ? inhalt.get(k) : null),
    setItem: (k, v) => inhalt.set(k, String(v)),
    removeItem: (k) => inhalt.delete(k),
  };
}

test("Datenformat: Sorte mit Art frischfleisch übersteht Speichern und Laden, Version bleibt 1", () => {
  const speicher = testSpeicher();
  const daten = laden(speicher);
  daten.futter.push({ id: "tatar", name: "Tatar vom Metzger", typ: "frischfleisch", kcalPro100g: 120, kcalQuelle: "packung", notiz: "" });
  speichern(daten, speicher);
  const neu = laden(speicher);
  assert.equal(neu.version, 1);
  assert.deepEqual(neu.futter.find((f) => f.id === "tatar"), daten.futter.find((f) => f.id === "tatar"));
  assert.ok(istGueltig(JSON.parse(JSON.stringify(neu))));
});

test("Datenformat: daten.js nennt frischfleisch im Kommentar zum Format", () => {
  assert.match(lies("js/daten.js"), /typ: "nass" \| "trocken" \| "frischfleisch" \| "leckerli"/);
});
