// 0.94.0: „Wie gestern“ auf „Heute“ (Ideen-Tafel „mahlzeiten-wie-gestern“, Entwurf
// docs/superpowers/specs/2026-11-20-wie-gestern-design.md). Die Mahlzeiten des letzten Tags mit Einträgen stehen als
// Vorlage da; Antippen öffnet das Fenster „Mahlzeit“ vorbelegt. Nie ein ganzer Tag auf einmal.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { wieGestern } from "../js/wie-gestern.js";

const lies = (datei) => readFileSync(new URL(`../${datei}`, import.meta.url), "utf8");
const abschnitt = (quelle, anfang, ende) => {
  const a = quelle.indexOf(anfang);
  assert.ok(a >= 0, `nicht gefunden: ${anfang}`);
  return quelle.slice(a, quelle.indexOf(ende, a + anfang.length));
};

const KITO = "kito";
const ZUKI = "zuki";
const futterNachId = new Map([
  ["sheba", { id: "sheba", name: "Sheba", typ: "nass", kcalPro100g: 77 }],
  ["purina", { id: "purina", name: "Purina One Light", typ: "trocken", kcalPro100g: 327.5 }],
  ["snack", { id: "snack", name: "Snack", typ: "leckerli", kcalPro100g: 400 }],
]);
// Monate in new Date(j, m, t) zählen ab 0: 10 = November.
let zaehler = 0;
const m = (tag, uhr, futterId, gramm, tierId = KITO) => {
  const [h, min] = uhr.split(":").map(Number);
  return { id: `m${++zaehler}`, tierId, futterId, gramm, zeitpunkt: new Date(2026, 10, tag, h, min).toISOString() };
};
const rechne = (mahlzeiten, tag = "2026-11-20", { besondereTage = [], tierId = KITO } = {}) =>
  wieGestern({ mahlzeiten, futterNachId, besondereTage, tierId, tag });

const VORTAG = [m(19, "07:30", "sheba", 50), m(19, "07:30", "purina", 12), m(19, "10:30", "sheba", 50)];

test("wieGestern: keine früheren Mahlzeiten → keine Vorlage", () => {
  assert.deepEqual(rechne([]), { vorlageTag: null, offen: [] });
});

test("wieGestern: Vortag wird Vorlage, Zeilen nach Uhrzeit", () => {
  // Durcheinander eingetragen; gleiche Uhrzeit bleibt in der Reihenfolge des Eintragens.
  assert.deepEqual(rechne([VORTAG[2], VORTAG[0], VORTAG[1]]), {
    vorlageTag: "2026-11-19",
    offen: [
      { futterId: "sheba", gramm: 50, uhrzeit: "07:30" },
      { futterId: "purina", gramm: 12, uhrzeit: "07:30" },
      { futterId: "sheba", gramm: 50, uhrzeit: "10:30" },
    ],
  });
});

test("wieGestern: heute eingetragene Mahlzeit nimmt genau eine passende Zeile weg", () => {
  const { offen } = rechne([...VORTAG, m(20, "08:00", "sheba", 50)]);
  assert.deepEqual(offen, [
    { futterId: "purina", gramm: 12, uhrzeit: "07:30" },
    { futterId: "sheba", gramm: 50, uhrzeit: "10:30" },
  ]);
});

test("wieGestern: andere Menge nimmt keine Zeile weg", () => {
  assert.equal(rechne([...VORTAG, m(20, "08:00", "sheba", 45)]).offen.length, 3);
});

test("wieGestern: Leckerlis nicht in der Vorlage", () => {
  const { offen } = rechne([m(19, "07:30", "sheba", 50), m(19, "15:00", "snack", 2)]);
  assert.deepEqual(offen, [{ futterId: "sheba", gramm: 50, uhrzeit: "07:30" }]);
});

test("wieGestern: Tag nur mit Leckerlis zählt nicht, der Tag davor wird Vorlage", () => {
  assert.equal(rechne([m(18, "07:30", "sheba", 50), m(19, "15:00", "snack", 2)]).vorlageTag, "2026-11-18");
});

test("wieGestern: Tag mit „Futter verweigert“ zählt nicht", () => {
  const besondereTage = [{ id: "b1", tierId: KITO, art: "futter-verweigert", von: "2026-11-19", bis: "2026-11-19", notiz: "" }];
  const ergebnis = rechne([m(18, "07:30", "sheba", 50), m(19, "07:30", "sheba", 20)], "2026-11-20", { besondereTage });
  assert.equal(ergebnis.vorlageTag, "2026-11-18");
  assert.deepEqual(ergebnis.offen, [{ futterId: "sheba", gramm: 50, uhrzeit: "07:30" }]);
});

test("wieGestern: gelöschte Sorte wird übersprungen", () => {
  const { offen } = rechne([m(19, "07:30", "sheba", 50), m(19, "08:00", "geloescht", 30)]);
  assert.deepEqual(offen, [{ futterId: "sheba", gramm: 50, uhrzeit: "07:30" }]);
});

test("wieGestern: nur Mahlzeiten des gewählten Tiers", () => {
  const mahlzeiten = [m(19, "07:30", "sheba", 40, ZUKI), m(19, "07:30", "purina", 12), m(20, "08:00", "purina", 12, ZUKI)];
  assert.deepEqual(rechne(mahlzeiten).offen, [{ futterId: "purina", gramm: 12, uhrzeit: "07:30" }]);
});

test("wieGestern: zurückgeblättert ist die Vorlage der Tag vor dem gezeigten", () => {
  const mahlzeiten = [m(17, "07:30", "purina", 10), m(18, "07:30", "sheba", 50), m(19, "07:30", "purina", 12)];
  assert.deepEqual(rechne(mahlzeiten, "2026-11-18"), {
    vorlageTag: "2026-11-17",
    offen: [{ futterId: "purina", gramm: 10, uhrzeit: "07:30" }],
  });
});

test("wieGestern: alles übernommen → nichts offen, Vorlage bleibt", () => {
  const heute = VORTAG.map((x, i) => m(20, `1${i}:00`, x.futterId, x.gramm));
  assert.deepEqual(rechne([...VORTAG, ...heute]), { vorlageTag: "2026-11-19", offen: [] });
});

// Oberfläche (Quelltext-Prüfungen wie in tests/uhrzeit-nachtragen.test.js)
test("Heute zeichnet die Karte „Wie gestern“", () => {
  assert.match(lies("app.js"), /wieGestern\(/);
  assert.match(lies("app.js"), /heute-wie-gestern/);
  assert.match(lies("index.html"), /id="heute-wie-gestern"/);
});

test("Antippen einer Zeile öffnet das Fenster mit Vorlage", () => {
  const fall = abschnitt(lies("app.js"), 'case "wie-gestern":', "case ");
  assert.match(fall, /oeffneMahlzeit\(null, \{/);
});

test("Vorlage füllt Sorte und Gramm, die Uhrzeit bleibt wie beim Nachtragen", () => {
  const fn = abschnitt(lies("app.js"), "function oeffneMahlzeit(", "\n}\n");
  assert.match(fn, /vorlage/);
  assert.match(fn, /uhrzeitVorbelegung\(\{ mahlzeit, gewaehlterTag/);
});

test("Service Worker kennt die neue Datei", () => {
  assert.match(lies("sw.js"), /"js\/wie-gestern\.js"/);
});
