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

test("0.74.0: Kamera-Knopf am Profilbild bleibt rund", () => {
  assert.match(regel(".profil .kamera"), /border-radius: 50%;/);
});

test("0.74.0: Foto in der Übersicht für den Tierarzt (PDF) hat dieselbe Form", () => {
  const r = regel(".bericht-foto");
  assert.match(r, /border-radius: 21%;/);
  assert.doesNotMatch(r, /50%/);
});
