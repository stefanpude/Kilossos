// Start der App (0.32.1, Handy-Test 05.11.2026): Beim Aktualisieren blitzte kurz „Heute“ mit dem fest
// eingetragenen Namen „Kito“ auf, bevor app.js den gemerkten Bereich zeigte.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const lies = (datei) => readFileSync(new URL(`../${datei}`, import.meta.url), "utf8");
const html = lies("index.html");

// Das kleine Skript im <head> läuft vor dem ersten Zeichnen. Hier in einer nachgebauten Umgebung.
function kopfSkript({ suche = "", sitzung = {}, gesperrt = false } = {}) {
  const kopf = html.slice(0, html.indexOf("</head>"));
  const code = kopf.match(/<script>([\s\S]*?)<\/script>/)[1];
  const dataset = {};
  const speicher = (werte) => ({
    getItem: (k) => {
      if (gesperrt) throw new Error("gesperrt");
      return k in werte ? werte[k] : null;
    },
  });
  vm.runInNewContext(code, {
    localStorage: speicher({}),
    sessionStorage: speicher(sitzung),
    location: { search: suche },
    URLSearchParams,
    matchMedia: () => ({ matches: false }),
    document: { documentElement: { dataset }, getElementById: () => ({}) },
  });
  return dataset;
}

test("Kopf-Skript: merkt den gemerkten Bereich vor dem ersten Zeichnen an <html>", () => {
  for (const name of ["gewicht", "verlauf", "futter", "mehr"]) {
    assert.equal(kopfSkript({ sitzung: { "kilossos-ansicht": name } }).start, name);
  }
});

test("Kopf-Skript: in der Demo zählt nur ihr eigener Schlüssel", () => {
  assert.equal(kopfSkript({ suche: "?demo", sitzung: { "kilossos-demo-ansicht": "verlauf" } }).start, "verlauf");
  assert.equal(kopfSkript({ suche: "?demo", sitzung: { "kilossos-ansicht": "verlauf" } }).start, undefined);
  assert.equal(kopfSkript({ sitzung: { "kilossos-demo-ansicht": "verlauf" } }).start, undefined);
});

test("Kopf-Skript: „Heute“, Bericht, Unbekanntes und gesperrter Speicher lassen alles beim Alten", () => {
  for (const wert of [undefined, "heute", "bericht", "gewicht<", "irgendwas"]) {
    const sitzung = wert === undefined ? {} : { "kilossos-ansicht": wert };
    assert.equal(kopfSkript({ sitzung }).start, undefined, String(wert));
  }
  const gesperrt = kopfSkript({ sitzung: { "kilossos-ansicht": "verlauf" }, gesperrt: true });
  assert.equal(gesperrt.start, undefined);
  assert.equal(gesperrt.theme, "hell"); // Hell/Dunkel bleibt wie bisher
});

test("CSS: Mit gemerktem Bereich bleibt „Heute“ beim Start unsichtbar", () => {
  assert.match(lies("styles.css"), /html\[data-start\] \.ansicht\[data-ansicht="heute"\] \{ display: none; \}/);
});

test("app.js: nimmt die Start-Marke nach dem Einrichten wieder weg (sonst bliebe „Heute“ für immer leer)", () => {
  const app = lies("app.js");
  const ende = app.slice(app.lastIndexOf("zeichneAlles();"));
  assert.match(ende, /else gemerkteAnsichtZeigen\(\);\s*delete document\.documentElement\.dataset\.start;/);
});

test("index.html: kein fest eingetragener Tiername (Store-Nutzer sähen sonst kurz „Kito“)", () => {
  assert.match(html, /<span id="tiername"><\/span>/);
});
