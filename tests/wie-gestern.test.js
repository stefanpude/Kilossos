// 0.94.0: „Wie gestern“ auf „Heute“ (Ideen-Tafel „mahlzeiten-wie-gestern“, Entwurf
// docs/superpowers/specs/2026-11-20-wie-gestern-design.md). Die Mahlzeiten des letzten Tags mit Einträgen stehen als
// Vorlage da; Antippen öffnet das Fenster „Mahlzeit“ vorbelegt. Nie ein ganzer Tag auf einmal.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { wieGestern, ausgeblendet, blendeAus, blendeEin } from "../js/wie-gestern.js";

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
// Die alten Tests vergleichen ohne das Feld „quelle“ (Id der Vorlage-Mahlzeit, seit 0.94.1 fürs Ausblenden).
const rechneRoh = (mahlzeiten, tag = "2026-11-20", { besondereTage = [], tierId = KITO, ausgeblendet } = {}) =>
  wieGestern({ mahlzeiten, futterNachId, besondereTage, tierId, tag, ausgeblendet });
const rechne = (...args) => {
  const e = rechneRoh(...args);
  return { vorlageTag: e.vorlageTag, offen: e.offen.map(({ quelle, ...z }) => z) };
};

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

// 0.94.1 (Stefan 20.11.): Abgleich nach Sorte. Andere Menge derselben Sorte nimmt trotzdem eine Zeile weg;
// gibt es eine Zeile mit genau der Menge, geht die, sonst die früheste dieser Sorte.
test("wieGestern: andere Menge derselben Sorte nimmt die früheste Zeile dieser Sorte weg", () => {
  assert.deepEqual(rechne([...VORTAG, m(20, "08:00", "sheba", 45)]).offen, [
    { futterId: "purina", gramm: 12, uhrzeit: "07:30" },
    { futterId: "sheba", gramm: 50, uhrzeit: "10:30" },
  ]);
});

test("wieGestern: genau passende Menge geht vor der frühesten Zeile", () => {
  const vortag = [m(19, "07:30", "sheba", 30), m(19, "10:30", "sheba", 50)];
  assert.deepEqual(rechne([...vortag, m(20, "08:00", "sheba", 50)]).offen, [{ futterId: "sheba", gramm: 30, uhrzeit: "07:30" }]);
});

test("wieGestern: andere Sorte nimmt keine Zeile weg", () => {
  const vortag = [m(19, "07:30", "sheba", 50)];
  futterNachId.set("felix", { id: "felix", name: "Felix", typ: "nass", kcalPro100g: 80 });
  assert.equal(rechne([...vortag, m(20, "08:00", "felix", 50)]).offen.length, 1);
});

test("wieGestern: ausgeblendete Zeilen fehlen, jede Zeile nennt ihre Vorlage-Mahlzeit", () => {
  const { offen } = rechneRoh(VORTAG, "2026-11-20", { ausgeblendet: new Set([VORTAG[0].id]) });
  assert.deepEqual(offen.map((z) => z.quelle), [VORTAG[1].id, VORTAG[2].id]);
});

test("ausgeblendet/blendeAus: gilt nur für Tier und Tag, neuer Tag fängt leer an", () => {
  let roh = blendeAus(null, KITO, "2026-11-20", ["a"]);
  roh = blendeAus(roh, KITO, "2026-11-20", ["b"]);
  roh = blendeAus(roh, ZUKI, "2026-11-20", ["c"]);
  assert.deepEqual([...ausgeblendet(roh, KITO, "2026-11-20")], ["a", "b"]);
  assert.deepEqual([...ausgeblendet(roh, ZUKI, "2026-11-20")], ["c"]);
  assert.equal(ausgeblendet(roh, KITO, "2026-11-21").size, 0);
  // Ein neuer Tag räumt den alten weg, damit der Schlüssel nicht wächst.
  assert.deepEqual(JSON.parse(blendeAus(roh, KITO, "2026-11-21", ["d"])), { tag: "2026-11-21", tiere: { [KITO]: ["d"] } });
});

// 0.95.1: Ausgeblendete Zeilen lassen sich im Aufklappmenü „Ausgeblendet“ zurückholen (Wunsch von Stefan, 22.11.2026).
test("wieGestern: ausgeblendete Zeilen stehen in „versteckt“, schon gefütterte nicht", () => {
  const heute = m(20, "07:40", "purina", 12);
  const { offen, versteckt } = rechneRoh([...VORTAG, heute], "2026-11-20", {
    ausgeblendet: new Set([VORTAG[0].id, VORTAG[1].id]),
  });
  assert.deepEqual(offen.map((z) => z.quelle), [VORTAG[2].id]);
  assert.deepEqual(versteckt.map((z) => z.quelle), [VORTAG[0].id]);
  assert.deepEqual(rechneRoh([]).versteckt, []);
});

test("blendeEin: holt eine Zeile zurück, andere Tiere und Zeilen bleiben ausgeblendet", () => {
  let roh = blendeAus(null, KITO, "2026-11-20", ["a", "b"]);
  roh = blendeAus(roh, ZUKI, "2026-11-20", ["a"]);
  roh = blendeEin(roh, KITO, "2026-11-20", ["a"]);
  assert.deepEqual([...ausgeblendet(roh, KITO, "2026-11-20")], ["b"]);
  assert.deepEqual([...ausgeblendet(roh, ZUKI, "2026-11-20")], ["a"]);
  // Alter Tag oder kaputter Inhalt: nichts zu tun, nichts ausgeblendet.
  assert.equal(ausgeblendet(blendeEin(roh, KITO, "2026-11-21", ["b"]), KITO, "2026-11-21").size, 0);
  assert.equal(ausgeblendet(blendeEin("{", KITO, "2026-11-20", ["b"]), KITO, "2026-11-20").size, 0);
});

test("ausgeblendet: kaputter oder fremder Inhalt → nichts ausgeblendet", () => {
  for (const roh of [null, "", "{", "[]", '{"tag":"2026-11-20","tiere":{"kito":"x"}}']) {
    assert.equal(ausgeblendet(roh, KITO, "2026-11-20").size, 0);
  }
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

test("0.94.1: Kreuz je Zeile und „Alle für heute ausblenden“, gespeichert unter eigenem Schlüssel", () => {
  const app = lies("app.js");
  assert.match(app, /data-aktion="wie-gestern-aus"/);
  assert.match(app, /data-aktion="wie-gestern-alle-aus"/);
  assert.match(app, /Alle für heute ausblenden/);
  assert.match(app, /case "wie-gestern-aus":/);
  assert.match(app, /case "wie-gestern-alle-aus":/);
  assert.match(lies("js/wie-gestern.js"), /"kilossos-wie-gestern-aus"/);
});

test("Service Worker kennt die neue Datei", () => {
  assert.match(lies("sw.js"), /"js\/wie-gestern\.js"/);
});
