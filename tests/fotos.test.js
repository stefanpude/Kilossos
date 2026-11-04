import { test } from "node:test";
import assert from "node:assert/strict";
import { wochenStart, fotoInWoche, vorherNachher } from "../js/fotos.js";

const FOTO = "data:image/jpeg;base64,AAAA";
const w = (id, datum, foto, tierId = "kito", kg = 9) => ({ id, tierId, kg, datum, notiz: "", ...(foto ? { foto } : {}) });

test("wochenStart: Montag derselben Woche, Sonntag gehört zur alten Woche", () => {
  assert.equal(wochenStart("2026-11-08"), "2026-11-02"); // Sonntag
  assert.equal(wochenStart("2026-11-09"), "2026-11-09"); // Montag
  assert.equal(wochenStart("2026-11-04"), "2026-11-02"); // Mittwoch
  assert.equal(wochenStart("2026-01-01"), "2025-12-29"); // über den Jahreswechsel
});

test("fotoInWoche findet nur ein gültiges Foto desselben Tiers in derselben Woche", () => {
  const gewichte = [
    w("a", "2026-11-02", FOTO),
    w("b", "2026-11-03", FOTO, "zuki"),
    w("c", "2026-11-04", "kaputt"),
  ];
  assert.equal(fotoInWoche(gewichte, "kito", "2026-11-08")?.id, "a");
  assert.equal(fotoInWoche(gewichte, "kito", "2026-11-09"), null);
  assert.equal(fotoInWoche(gewichte, "zuki", "2026-11-05")?.id, "b");
  assert.equal(fotoInWoche([w("c", "2026-11-04", "kaputt")], "kito", "2026-11-04"), null);
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
  const gewichte = [
    w("mitte", "2026-10-12", FOTO),
    w("neu", "2026-11-02", FOTO),
    w("alt", "2026-09-07", FOTO),
    w("fremd", "2026-12-01", FOTO, "zuki"),
  ];
  const r = vorherNachher(gewichte, "kito");
  assert.equal(r.vorher.id, "alt");
  assert.equal(r.nachher.id, "neu");
});

test("Wägungen mit kaputtem Datum zählen nicht und bringen nichts zum Absturz", () => {
  const gewichte = [w("a", "abc", FOTO), { ...w("b", "2026-11-02", FOTO), datum: 123 }, w("c", "2026-11-03", FOTO)];
  assert.equal(fotoInWoche(gewichte, "kito", "2026-11-04")?.id, "c");
  assert.equal(vorherNachher(gewichte, "kito").vorher.id, "c");
});

test("vorherNachher: gleiches Datum wird fest nach id geordnet", () => {
  const r = vorherNachher([w("b", "2026-11-02", FOTO), w("a", "2026-11-02", FOTO)], "kito");
  assert.equal(r.vorher.id, "a");
  assert.equal(r.nachher.id, "b");
});
