// 0.56.0: „Demo ansehen“ unter „Mehr“ → „Über Kilossos“. Grund (Stefan 06.11.2026): Legt man den Demo-Link in Opera
// auf den Startbildschirm, startet das Symbol die normale App, weil manifest.webmanifest start_url "./" vorgibt.
// Mit dem Eintrag öffnet man die Demo aus der installierten App heraus; „Demo beenden“ führt zurück.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const lies = (datei) => readFileSync(new URL(`../${datei}`, import.meta.url), "utf8");

test("index.html: Eintrag „Demo ansehen“ in „Über Kilossos“ führt zu ./?demo, vor der Versionszeile", () => {
  const html = lies("index.html");
  const ueber = html.slice(html.indexOf('<h3 class="gruppe-titel">Über Kilossos</h3>'), html.indexOf("</section>", html.indexOf("Über Kilossos</h3>")));
  assert.match(
    ueber,
    /<a class="eintrag" id="demo-oeffnen" href="\.\/\?demo">\s*<span data-symbol="katzenkopf"><\/span><span class="text">Demo ansehen<small>Beispieldaten von Kito und Zuki über ein Jahr\. Deine Einträge bleiben, wie sie sind\.<\/small><\/span><span class="weiter" data-symbol="weiter"><\/span>\s*<\/a>/,
  );
  assert.ok(ueber.indexOf('id="demo-oeffnen"') < ueber.indexOf('id="version"'));
  // Zurück aus der Demo geht weiter über die Leiste oben.
  assert.match(html, /<p class="demo-leiste" id="demo-leiste" hidden>[\s\S]*?<a href="\.\/">Demo beenden<\/a>/);
});

test("app.js: in der Demo ist „Demo ansehen“ versteckt", () => {
  assert.match(lies("app.js"), /\$\("demo-oeffnen"\)\.hidden = demo;/);
});

test("styles.css: versteckte Einträge sind wirklich unsichtbar (.eintrag setzt display)", () => {
  assert.match(lies("styles.css"), /\.eintrag\[hidden\] \{ display: none; \}/);
});
