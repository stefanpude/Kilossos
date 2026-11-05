import { test } from "node:test";
import assert from "node:assert/strict";
import { letzterWiegetag, fotoZeitraum, fotoImZeitraum, istFotoTag, fotoAngebot, vorherNachher, fotoFeld } from "../js/fotos.js";

const FOTO = "data:image/jpeg;base64,AAAA";
const w = (id, datum, foto, tierId = "kito", kg = 9) => ({ id, tierId, kg, datum, notiz: "", ...(foto ? { foto } : {}) });
// Wochentage wie Date.getDay(): 0 = Sonntag, 1 = Montag, 3 = Mittwoch.

test("letzterWiegetag: letzter passender Wochentag im Monat", () => {
  assert.equal(letzterWiegetag(2026, 11, 3), "2026-11-25"); // Mittwoche im Nov.: 4, 11, 18, 25
  assert.equal(letzterWiegetag(2026, 10, 3), "2026-10-28");
  assert.equal(letzterWiegetag(2026, 12, 3), "2026-12-30");
  assert.equal(letzterWiegetag(2026, 11, 1), "2026-11-30"); // Monatsletzter ist selbst der Wiegetag
  assert.equal(letzterWiegetag(2026, 2, 0), "2026-02-22"); // Februar mit 28 Tagen
  assert.equal(letzterWiegetag(2026, 10, 0), "2026-10-25"); // Tag der Zeitumstellung
});

test("fotoZeitraum mit Wiegetag: vom letzten Wiegetag eines Monats bis zum Tag vor dem nächsten", () => {
  assert.equal(fotoZeitraum("2026-11-25", 3), "2026-11-25"); // Foto-Tag selbst
  assert.equal(fotoZeitraum("2026-11-26", 3), "2026-11-25"); // verpasst, nachgeholt: zählt zum November
  assert.equal(fotoZeitraum("2026-12-29", 3), "2026-11-25"); // bis zum Tag vor dem nächsten Foto-Tag
  assert.equal(fotoZeitraum("2026-12-30", 3), "2026-12-30");
  assert.equal(fotoZeitraum("2026-11-24", 3), "2026-10-28"); // vor dem Foto-Tag: noch Oktober
  assert.equal(fotoZeitraum("2027-01-05", 3), "2026-12-30"); // über den Jahreswechsel
});

test("fotoZeitraum ohne (oder mit ungültigem) Wiegetag: Kalendermonat", () => {
  assert.equal(fotoZeitraum("2026-11-24"), "2026-11-01");
  assert.equal(fotoZeitraum("2026-11-01"), "2026-11-01");
  for (const tag of [7, "3", null, -1, 1.5]) assert.equal(fotoZeitraum("2026-11-24", tag), "2026-11-01");
});

test("istFotoTag: nur der letzte Wiegetag im Monat", () => {
  assert.equal(istFotoTag("2026-11-25", 3), true);
  assert.equal(istFotoTag("2026-11-18", 3), false); // Wiegetag, aber nicht der letzte
  assert.equal(istFotoTag("2026-11-26", 3), false);
  assert.equal(istFotoTag("2026-11-25"), false); // ohne Wiegetag nie
});

test("fotoImZeitraum findet nur ein gültiges Foto desselben Tiers im selben Zeitraum", () => {
  const gewichte = [w("a", "2026-11-26", FOTO), w("b", "2026-11-27", FOTO, "zuki"), w("c", "2026-11-28", "kaputt")];
  assert.equal(fotoImZeitraum(gewichte, "kito", "2026-12-10", 3)?.id, "a");
  assert.equal(fotoImZeitraum(gewichte, "kito", "2026-12-30", 3), null); // neuer Zeitraum
  assert.equal(fotoImZeitraum(gewichte, "kito", "2026-11-24", 3), null); // alter Zeitraum (Oktober)
  assert.equal(fotoImZeitraum(gewichte, "zuki", "2026-12-01", 3)?.id, "b");
  assert.equal(fotoImZeitraum(gewichte, "kito", "2026-11-02")?.id, "a"); // ohne Wiegetag: ganzer Kalendermonat
  assert.equal(fotoImZeitraum(gewichte, "kito", "2026-12-01"), null);
});

test("fotoAngebot: am Foto-Tag immer das Feld, auch wenn schon ein Foto da ist", () => {
  const basis = { tierId: "kito", datum: "2026-11-25", wiegetag: 3 };
  assert.equal(fotoAngebot({ ...basis, gewichte: [] }), "fototag");
  assert.equal(fotoAngebot({ ...basis, gewichte: [w("a", "2026-11-25", FOTO)] }), "fototag");
});

test("fotoAngebot: anderer Tag ohne Monatsfoto = nachholen, mit Monatsfoto = keins", () => {
  const basis = { tierId: "kito", datum: "2026-11-18", wiegetag: 3 }; // normaler Wiegetag
  assert.equal(fotoAngebot({ ...basis, gewichte: [] }), "nachholen");
  assert.equal(fotoAngebot({ ...basis, gewichte: [w("a", "2026-10-28", FOTO)] }), "keins");
  assert.equal(fotoAngebot({ ...basis, gewichte: [w("a", "2026-10-27", FOTO)] }), "nachholen"); // Foto aus dem Zeitraum davor
  assert.equal(fotoAngebot({ ...basis, gewichte: [w("a", "2026-10-28", FOTO, "zuki")] }), "nachholen"); // anderes Tier
});

test("fotoAngebot ohne Wiegetag: nie das offene Feld", () => {
  const basis = { tierId: "kito", datum: "2026-11-25" };
  assert.equal(fotoAngebot({ ...basis, gewichte: [] }), "nachholen");
  assert.equal(fotoAngebot({ ...basis, gewichte: [w("a", "2026-11-02", FOTO)] }), "keins");
  assert.equal(fotoAngebot({ ...basis, gewichte: [], wiegetag: 9 }), "nachholen");
});

test("fotoAngebot: leeres oder kaputtes Datum bietet nichts an", () => {
  for (const datum of ["", "abc", undefined, 20261104]) {
    assert.equal(fotoAngebot({ gewichte: [], tierId: "kito", datum, wiegetag: 3 }), "keins");
  }
});

test("vorherNachher: ohne Foto beides leer", () => {
  assert.deepEqual(vorherNachher([w("a", "2026-11-02")], "kito"), { vorher: null, nachher: null });
});

test("vorherNachher: ein Foto ist Vorher, Nachher bleibt leer", () => {
  const r = vorherNachher([w("a", "2026-11-02", FOTO), w("b", "2026-11-09")], "kito");
  assert.equal(r.vorher.id, "a");
  assert.equal(r.nachher, null);
});

test("vorherNachher: ältestes und neuestes Foto, unabhängig von der Reihenfolge", () => {
  const gewichte = [w("mitte", "2026-10-12", FOTO), w("neu", "2026-11-02", FOTO), w("alt", "2026-09-07", FOTO), w("fremd", "2026-12-01", FOTO, "zuki")];
  const r = vorherNachher(gewichte, "kito");
  assert.equal(r.vorher.id, "alt");
  assert.equal(r.nachher.id, "neu");
});

test("Wägungen mit kaputtem Datum zählen nicht und bringen nichts zum Absturz", () => {
  const gewichte = [w("a", "abc", FOTO), { ...w("b", "2026-11-02", FOTO), datum: 123 }, w("c", "2026-11-03", FOTO)];
  assert.equal(fotoImZeitraum(gewichte, "kito", "2026-11-04")?.id, "c");
  assert.equal(vorherNachher(gewichte, "kito").vorher.id, "c");
});

test("vorherNachher: gleiches Datum wird fest nach id geordnet", () => {
  const r = vorherNachher([w("b", "2026-11-02", FOTO), w("a", "2026-11-02", FOTO)], "kito");
  assert.equal(r.vorher.id, "a");
  assert.equal(r.nachher.id, "b");
});

// 0.41.0: Foto beim Ändern einer Wägung nachtragen (Fund B aus Stefans Nacht-Test)
test("fotoFeld: neue Wägung verhält sich wie bisher", () => {
  const basis = { gewaehlt: false, nachgeholt: false, aendern: false, hatFoto: false, wiegetag: 3 };
  assert.deepEqual(fotoFeld({ ...basis, angebot: "fototag" }), { bereich: true, link: false, linkText: "Monatsfoto nachholen (freiwillig)", tipp: false });
  assert.deepEqual(fotoFeld({ ...basis, angebot: "nachholen" }), { bereich: false, link: true, linkText: "Monatsfoto nachholen (freiwillig)", tipp: false });
  assert.equal(fotoFeld({ ...basis, angebot: "nachholen", nachgeholt: true }).bereich, true);
  assert.equal(fotoFeld({ ...basis, angebot: "keins" }).bereich, false);
  assert.equal(fotoFeld({ ...basis, angebot: "keins" }).link, false);
  assert.equal(fotoFeld({ ...basis, angebot: "keins", gewaehlt: true }).bereich, true, "gewähltes Foto bleibt sichtbar");
  // Ohne Wiegetag: Tipp, solange ein Foto sinnvoll wäre
  assert.equal(fotoFeld({ ...basis, wiegetag: undefined, angebot: "nachholen" }).tipp, true);
  assert.equal(fotoFeld({ ...basis, wiegetag: undefined, angebot: "keins" }).tipp, false);
});

test("fotoFeld: Ändern einer Wägung mit Foto zeigt keinen Foto-Bereich", () => {
  for (const angebot of ["fototag", "nachholen", "keins"]) {
    const z = fotoFeld({ angebot, gewaehlt: false, nachgeholt: false, aendern: true, hatFoto: true, wiegetag: undefined });
    assert.equal(z.bereich || z.link || z.tipp, false, angebot);
  }
});

test("fotoFeld: Ändern einer Wägung ohne Foto bietet „Foto nachtragen“ an, an jedem Tag", () => {
  for (const angebot of ["fototag", "nachholen", "keins"]) {
    const z = fotoFeld({ angebot, gewaehlt: false, nachgeholt: false, aendern: true, hatFoto: false, wiegetag: 3 });
    assert.deepEqual(z, { bereich: false, link: true, linkText: "Foto nachtragen (freiwillig)", tipp: false }, angebot);
    assert.equal(fotoFeld({ angebot, gewaehlt: false, nachgeholt: true, aendern: true, hatFoto: false, wiegetag: 3 }).bereich, true);
    assert.equal(fotoFeld({ angebot, gewaehlt: true, nachgeholt: false, aendern: true, hatFoto: false, wiegetag: 3 }).bereich, true);
  }
  // Kein Wiegetag-Tipp beim Ändern: der gehört zum Eintragen
  assert.equal(fotoFeld({ angebot: "nachholen", gewaehlt: false, nachgeholt: false, aendern: true, hatFoto: false, wiegetag: undefined }).tipp, false);
});
