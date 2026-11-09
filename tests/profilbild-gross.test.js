// 0.89.0 (Stefan 09.11.2026): Antippen des Profilbilds zeigt das Foto groß, auf „Heute“ und im Kopf von „Verlauf“.
// Ohne Foto bleibt das Menü (Plan .planning/profilbild-gross.md).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { profilAktion, zoomVon } from "../js/profilbild.js";

const lies = (datei) => readFileSync(new URL(`../${datei}`, import.meta.url), "utf8");
const FOTO = "data:image/jpeg;base64,AAAA";

test("0.89.0: mit gültigem Foto öffnet das Profilbild die Großansicht, ohne Foto das Menü", () => {
  assert.equal(profilAktion({ name: "Kito", foto: FOTO }), "gross");
  assert.equal(profilAktion({ name: "Kito" }), "menue");
  assert.equal(profilAktion({ name: "Kito", foto: "" }), "menue");
  assert.equal(profilAktion({ name: "Kito", foto: "javascript:alert(1)" }), "menue");
  assert.equal(profilAktion(null), "menue");
});

test("0.89.0: zoomVon rechnet Verschiebung und Maßstab von der Bildmitte aus (Kito auf „Heute“, 375 px)", () => {
  // Quelle 56 px oben links, Ziel 320 px in der Mitte: Mitten (44 | 48) und (187,5 | 310)
  const z = zoomVon({ left: 16, top: 20, width: 56, height: 56 }, { left: 27.5, top: 150, width: 320, height: 320 });
  assert.equal(z.x, -143.5);
  assert.equal(z.y, -262);
  assert.equal(z.s, 0.175);
  assert.equal(z.transform, "translate(-143.5px, -262px) scale(0.175)");
});

test("0.89.0: zoomVon ohne sichtbare Quelle liefert null (dann nur Ein- und Ausblenden)", () => {
  assert.equal(zoomVon(null, { left: 0, top: 0, width: 320, height: 320 }), null);
  assert.equal(zoomVon({ left: 0, top: 0, width: 0, height: 0 }, { left: 0, top: 0, width: 320, height: 320 }), null);
  assert.equal(zoomVon({ left: 0, top: 0, width: 56, height: 56 }, { left: 0, top: 0, width: 0, height: 0 }), null);
});

test("0.89.0: index.html hat das Fenster der Großansicht mit Bild, Name, „Profil bearbeiten“ und Schließen-Knopf", () => {
  const html = lies("index.html");
  const start = html.indexOf('<dialog id="dialog-profilbild"');
  assert.ok(start >= 0, "dialog-profilbild fehlt");
  const dialog = html.slice(start, html.indexOf("</dialog>", start));
  assert.match(dialog, /class="profilbild-gross"/);
  assert.match(dialog, /id="profilbild-bild"/);
  assert.match(dialog, /id="profilbild-name"/);
  assert.match(dialog, /data-aktion="profilbild-profil">Profil bearbeiten</);
  assert.match(dialog, /data-aktion="profilbild-zu"[^>]*aria-label="Schließen"/);
});

test("0.89.0: Profilmenü auf „Heute“ nur noch ohne Foto, „Foto entfernen“ nur noch im Profil-Fenster", () => {
  const app = lies("app.js");
  const start = app.indexOf("function profilAntippen()");
  const teil = app.slice(start, app.indexOf("\n}\n", start));
  assert.match(teil, /profilAktion\(tier\) === "gross"/);
  assert.doesNotMatch(teil, /data-aktion="foto-entfernen"/);
  assert.doesNotMatch(teil, /Foto ändern/);
  assert.match(teil, /Foto wählen/);
  assert.match(lies("index.html"), /data-aktion="profil-foto-entfernen"/);
});

test("0.89.0: Kopf von „Verlauf“ macht das Bild nur mit Foto zum Knopf für die Großansicht", () => {
  const app = lies("app.js");
  const start = app.indexOf("function verlaufKopf()");
  const teil = app.slice(start, app.indexOf("\n}\n", start));
  assert.match(teil, /profilAktion\(tier\) === "gross"/);
  assert.match(teil, /data-aktion="profilbild-gross"/);
  assert.match(teil, /aria-label="Foto von \$\{sicher\(tier\.name\)\} groß ansehen"/);
});

test("0.89.0: Großansicht beachtet „weniger Bewegung“ und schließt per Escape mit Animation", () => {
  const app = lies("app.js");
  const start = app.indexOf("function oeffneProfilbild(");
  assert.ok(start >= 0, "oeffneProfilbild fehlt");
  const teil = app.slice(start, app.indexOf("// ---------- Ende Profilbild", start));
  assert.match(teil, /ohneBewegung\(\)/);
  assert.match(teil, /addEventListener\("cancel"/);
  assert.match(teil, /zoomVon\(/);
});

test("0.89.0: Großansicht ist ein Vollbild ohne Griff und ohne Blatt-Animation von unten", () => {
  const css = lies("styles.css");
  assert.match(css, /\ndialog\.profilbild-gross \{[^}]*inset: 0;/);
  assert.match(css, /\ndialog\.profilbild-gross\[open\] \{ animation: none; \}/);
  assert.match(css, /\n\.profilbild-gross \.griff \{ display: none; \}/);
});
