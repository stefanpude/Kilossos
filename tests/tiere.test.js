import { test } from "node:test";
import assert from "node:assert/strict";
import { aktivesTier, leseAktivesTier, merkeAktivesTier, vergissDemoTier, neuesTier, eintraegeVon, tierEntfernen } from "../js/tiere.js";

const speicher = () => {
  const werte = new Map();
  return { getItem: (k) => werte.get(k) ?? null, setItem: (k, v) => werte.set(k, String(v)), werte };
};

const beispiel = () => ({
  tiere: [
    { id: "kito", name: "Kito", art: "katze" },
    { id: "zuki", name: "Zuki", art: "katze" },
  ],
  futter: [{ id: "sheba" }],
  mahlzeiten: [
    { id: "m1", tierId: "kito", futterId: "sheba" },
    { id: "m2", tierId: "zuki", futterId: "sheba" },
    { id: "m3", tierId: "zuki", futterId: "sheba" },
  ],
  gewichte: [{ id: "g1", tierId: "kito" }, { id: "g2", tierId: "zuki" }],
  freigaben: [{ id: "f1", tierId: "kito" }],
  besondereTage: [{ id: "b1", tierId: "zuki" }, { id: "b2", tierId: "kito" }, { id: "b3", tierId: "zuki" }],
});

test("aktivesTier nimmt das gemerkte Tier", () => {
  assert.equal(aktivesTier(beispiel(), "zuki").name, "Zuki");
});

test("aktivesTier fällt auf das erste Tier zurück, wenn nichts oder Unbekanntes gemerkt ist", () => {
  assert.equal(aktivesTier(beispiel(), null).name, "Kito");
  assert.equal(aktivesTier(beispiel(), "geloescht").name, "Kito");
});

test("das aktive Tier wird pro Gerät gemerkt, getrennt für die Demo", () => {
  const s = speicher();
  assert.equal(leseAktivesTier(false, s), null);
  merkeAktivesTier("zuki", false, s);
  merkeAktivesTier("demo-kito", true, s);
  assert.equal(leseAktivesTier(false, s), "zuki");
  assert.equal(leseAktivesTier(true, s), "demo-kito");
});

test("leseAktivesTier übersteht einen gesperrten Speicher", () => {
  const gesperrt = { getItem: () => { throw new Error("gesperrt"); }, setItem: () => { throw new Error("gesperrt"); } };
  assert.equal(leseAktivesTier(false, gesperrt), null);
  assert.doesNotThrow(() => merkeAktivesTier("zuki", false, gesperrt));
});

test("neuesTier legt eine Katze mit Namen an", () => {
  assert.deepEqual(neuesTier("x1", "Zuki"), { id: "x1", name: "Zuki", art: "katze" });
});

test("eintraegeVon zählt die Einträge eines Tiers", () => {
  assert.deepEqual(eintraegeVon(beispiel(), "zuki"), { mahlzeiten: 2, gewichte: 1, freigaben: 0, besondereTage: 2 });
});

test("tierEntfernen löscht das Tier mit allen seinen Einträgen, Futter bleibt", () => {
  const daten = beispiel();
  assert.equal(tierEntfernen(daten, "zuki"), true);
  assert.deepEqual(daten.tiere.map((t) => t.id), ["kito"]);
  assert.deepEqual(daten.mahlzeiten.map((m) => m.id), ["m1"]);
  assert.deepEqual(daten.gewichte.map((g) => g.id), ["g1"]);
  assert.deepEqual(daten.freigaben.map((f) => f.id), ["f1"]);
  assert.deepEqual(daten.besondereTage.map((b) => b.id), ["b2"]);
  assert.equal(daten.futter.length, 1);
});

test("Daten ohne Liste besondereTage (vor 0.33.0) lassen sich zählen und entfernen", () => {
  const { besondereTage, ...daten } = beispiel();
  assert.equal(eintraegeVon(daten, "zuki").besondereTage, 0);
  assert.equal(tierEntfernen(daten, "zuki"), true);
  assert.equal("besondereTage" in daten, false);
});

test("das letzte Tier lässt sich nicht entfernen", () => {
  const daten = beispiel();
  tierEntfernen(daten, "zuki");
  assert.equal(tierEntfernen(daten, "kito"), false);
  assert.equal(daten.tiere.length, 1);
  assert.equal(daten.mahlzeiten.length, 1);
});

test("ein unbekanntes Tier entfernt nichts", () => {
  const daten = beispiel();
  assert.equal(tierEntfernen(daten, "gibts-nicht"), false);
  assert.equal(daten.tiere.length, 2);
});

// 0.56.1: Nach „Demo beenden“ blieb die Demo-Wahl im Speicher liegen. Die echte Wahl bleibt unberührt.
test("vergissDemoTier löscht nur die Demo-Wahl", () => {
  const s = speicher();
  s.removeItem = (k) => s.werte.delete(k);
  merkeAktivesTier("zuki", false, s);
  merkeAktivesTier("demo-zuki", true, s);
  vergissDemoTier(s);
  assert.equal(leseAktivesTier(true, s), null);
  assert.equal(leseAktivesTier(false, s), "zuki");
});

test("vergissDemoTier wirft nicht bei gesperrtem Speicher", () => {
  const gesperrt = { removeItem: () => { throw new Error("gesperrt"); } };
  assert.doesNotThrow(() => vergissDemoTier(gesperrt));
});
