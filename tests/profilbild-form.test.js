// 0.74.0 (Stefan 06.11.2026): Profilbilder im Stil der Willkommensseite, Quadrat mit runden Ecken und feinem Rand
// statt Kreis. Die Fotos sind schon quadratisch gespeichert (fotoZuschneiden), der Kreis schnitt Ohren ab.
// Ecken in Prozent, damit 32 px im Menü genauso aussehen wie 56 px auf „Heute“ (Willkommen: 24 von 112 px ≈ 21 %).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const css = readFileSync(new URL("../styles.css", import.meta.url), "utf8");

function regel(auswahl) {
  // am Zeilenanfang suchen, sonst trifft „.avatar {“ zuerst „.einrichtung-foto .avatar {“
  const start = css.indexOf(`\n${auswahl} {`);
  assert.ok(start >= 0, `Regel ${auswahl} fehlt`);
  return css.slice(start, css.indexOf("}", start));
}

test("0.74.0: Profilknopf auf „Heute“ und kleine Profilbilder sind Quadrate mit 21 % Ecken und feinem Rand", () => {
  for (const auswahl of [".profil", ".avatar"]) {
    const r = regel(auswahl);
    assert.match(r, /border-radius: 21%;/, auswahl);
    assert.match(r, /box-shadow: 0 0 0 1px var\(--rand-stark\);/, auswahl);
    assert.doesNotMatch(r, /border-radius: 50%/, auswahl);
  }
});

test("0.74.0: das Foto im Profilbild übernimmt die Ecken, kein Kreis mehr", () => {
  const r = regel(".profil img, .avatar img");
  assert.match(r, /border-radius: inherit;/);
  assert.doesNotMatch(r, /50%/);
});

// 0.74.1 (Stefan 06.11.2026, Bilder): Kamera-Knopf und die Tagespfeile auf „Heute“ in derselben Form wie die Profilbilder.
test("0.74.1: Kamera-Knopf am Profilbild ist ein Quadrat mit 21 % Ecken", () => {
  const r = regel(".profil .kamera");
  assert.match(r, /border-radius: 21%;/);
  assert.doesNotMatch(r, /50%/);
});

// 0.86.2 (Stefan 09.11.2026): Mit Foto verdeckte das Kamera-Symbol dessen Ecke. Es bleibt nur als Hinweis ohne Foto.
test("0.86.2: Kamera-Symbol auf „Heute“ nur, solange kein Foto hinterlegt ist", () => {
  const app = readFileSync(new URL("../app.js", import.meta.url), "utf8");
  const start = app.indexOf("function profilHtml(");
  const f = app.slice(start, app.indexOf("\n}", start));
  assert.match(f, /return fotoGueltig\(einTier\.foto\) \? bild : `\$\{bild\}<span class="kamera" aria-hidden="true">/);
  assert.equal(f.split('class="kamera"').length, 2, "nur eine Stelle mit dem Symbol");
});

test("0.74.1: Tagespfeile auf „Heute“ (.knopf-rund) sind Quadrate mit 21 % Ecken, Tippfläche bleibt 48 px", () => {
  const r = regel(".knopf-rund");
  assert.match(r, /border-radius: 21%;/);
  assert.match(r, /width: 48px; height: 48px;/);
  assert.doesNotMatch(r, /50%/);
});

// 0.74.2 (Stefan 06.11.2026, „Gruppe A und B“): A = runde ±-Tasten wie die Tagespfeile (21 %),
// B = Pillen-Knöpfe und -Schilder mit den kleinen Ecken der normalen Knöpfe (--rund-klein).
// Rund bleiben bewusst: Info-„i“, Zeichen nach dem Wiegen, PDF-Nummern, Legendenpunkt der kcal-Grafik.
test("0.74.2: ±10 g beim Gewicht und − / + bei der Menge sind Quadrate mit 21 % Ecken", () => {
  for (const auswahl of [".stufe", ".gramm button"]) {
    const r = regel(auswahl);
    assert.match(r, /border-radius: 21%;/, auswahl);
    assert.doesNotMatch(r, /50%/, auswahl);
  }
});

test("0.74.2: „Korrigieren oder löschen“, „Ändern“-Plakette und Schilder haben die Ecken der Knöpfe, keine Pille mehr", () => {
  for (const auswahl of [".freigabe-hinweis", ".marke", ".vn-plakette"]) {
    assert.match(regel(auswahl), /border-radius: var\(--rund-klein\);/, auswahl);
  }
  assert.doesNotMatch(css, /border-radius: 999px/);
});

test("0.74.2: Info-Zeichen und Zeichen nach dem Wiegen bleiben rund", () => {
  assert.match(regel(".hinweis .punkt"), /border-radius: 50%;/);
  assert.match(regel(".rueckmeldung .zeichen"), /border-radius: 50%;/);
});

test("0.74.0: Foto in der Übersicht für die Praxis (PDF) hat dieselbe Form", () => {
  const r = regel(".bericht-foto");
  assert.match(r, /border-radius: 21%;/);
  assert.doesNotMatch(r, /50%/);
});
