// Eigene Rückfrage statt Browser-confirm() (0.52.0, Plan .planning/eigene-rueckfrage.md).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { frage, bestaetigt } from "../js/rueckfrage.js";

const lies = (datei) => readFileSync(new URL(`../${datei}`, import.meta.url), "utf8");

// Kleine Attrappe für <dialog id="dialog-rueckfrage">: nur das, was js/rueckfrage.js anfasst.
function element() {
  const klassen = new Set();
  return {
    textContent: "",
    hidden: false,
    fokussiert: 0,
    isConnected: true,
    focus() {
      this.fokussiert++;
    },
    classList: {
      toggle(name, an) {
        if (an) klassen.add(name);
        else klassen.delete(name);
      },
      contains: (name) => klassen.has(name),
    },
  };
}

function attrappe() {
  const teile = { "#rueckfrage-text": element(), "#rueckfrage-ja": element(), "#rueckfrage-nein": element(), "#rueckfrage-dritte": element() };
  const hoerer = [];
  const vorher = element();
  const d = {
    open: false,
    returnValue: "",
    geoeffnet: 0,
    teile,
    vorher,
    ownerDocument: { activeElement: vorher },
    querySelector: (sel) => teile[sel],
    addEventListener(name, fn) {
      if (name === "close") hoerer.push(fn);
    },
    showModal() {
      this.open = true;
      this.geoeffnet++;
    },
    close(wert) {
      if (wert !== undefined) this.returnValue = wert;
      this.open = false;
      for (const fn of hoerer.splice(0)) fn();
    },
  };
  return d;
}

test("frage: Ja liefert \"ja\"", async () => {
  const d = attrappe();
  const p = frage({ text: "A?", ja: "Löschen" }, d);
  d.close("ja");
  assert.equal(await p, "ja");
});

test("frage: Escape, Hintergrund und Wischen liefern \"nein\"", async () => {
  for (const wert of ["", "abbrechen", undefined]) {
    const d = attrappe();
    const p = frage({ text: "A?", ja: "Löschen" }, d);
    d.close(wert);
    assert.equal(await p, "nein", `close(${JSON.stringify(wert)})`);
  }
});

test("frage: alter returnValue vom letzten Mal zählt nicht als Ja", async () => {
  const d = attrappe();
  d.returnValue = "ja";
  const p = frage({ text: "A?", ja: "Löschen" }, d);
  d.close();
  assert.equal(await p, "nein");
});

test("frage: dritter Weg sichtbar und beschriftet, liefert \"dritte\"", async () => {
  const d = attrappe();
  const p = frage({ text: "A?", ja: "Foto ersetzen", dritte: "Ohne neues Foto speichern" }, d);
  assert.equal(d.teile["#rueckfrage-dritte"].hidden, false);
  assert.equal(d.teile["#rueckfrage-dritte"].textContent, "Ohne neues Foto speichern");
  d.close("dritte");
  assert.equal(await p, "dritte");
});

test("frage: ohne dritten Weg ist der Knopf versteckt und \"dritte\" zählt als Nein", async () => {
  const d = attrappe();
  d.teile["#rueckfrage-dritte"].hidden = false;
  const p = frage({ text: "A?", ja: "Löschen" }, d);
  assert.equal(d.teile["#rueckfrage-dritte"].hidden, true);
  d.close("dritte");
  assert.equal(await p, "nein");
});

test("frage: Text und Knöpfe wie übergeben, Nein heißt sonst „Abbrechen“", async () => {
  const d = attrappe();
  const p = frage({ text: "Diese Mahlzeit löschen?", ja: "Löschen" }, d);
  assert.equal(d.teile["#rueckfrage-text"].textContent, "Diese Mahlzeit löschen?");
  assert.equal(d.teile["#rueckfrage-ja"].textContent, "Löschen");
  assert.equal(d.teile["#rueckfrage-nein"].textContent, "Abbrechen");
  d.close("nein");
  await p;
  const d2 = attrappe();
  const p2 = frage({ text: "Stimmt das Datum?", ja: "Ja, Datum stimmt", nein: "Nein, ändern" }, d2);
  assert.equal(d2.teile["#rueckfrage-nein"].textContent, "Nein, ändern");
  d2.close("nein");
  await p2;
});

test("frage: Fokus beim Öffnen auf dem Nein-Knopf", async () => {
  const d = attrappe();
  const p = frage({ text: "A?", ja: "Löschen" }, d);
  assert.equal(d.open, true);
  assert.ok(d.teile["#rueckfrage-nein"].fokussiert >= 1);
  d.close("nein");
  await p;
});

test("frage: gefahr färbt Ja rot, sonst grün", async () => {
  const d = attrappe();
  const ja = d.teile["#rueckfrage-ja"];
  let p = frage({ text: "A?", ja: "Löschen", gefahr: true }, d);
  assert.equal(ja.classList.contains("knopf-gefahr"), true);
  assert.equal(ja.classList.contains("knopf-haupt"), false);
  d.close("nein");
  await p;
  p = frage({ text: "A?", ja: "Ersetzen" }, d);
  assert.equal(ja.classList.contains("knopf-gefahr"), false);
  assert.equal(ja.classList.contains("knopf-haupt"), true);
  d.close("nein");
  await p;
});

test("frage: Blatt schon offen → sofort \"nein\", kein zweites Öffnen", async () => {
  const d = attrappe();
  const p1 = frage({ text: "A?", ja: "Löschen" }, d);
  assert.equal(await frage({ text: "B?", ja: "Löschen" }, d), "nein");
  assert.equal(d.geoeffnet, 1);
  assert.equal(d.teile["#rueckfrage-text"].textContent, "A?", "die erste Frage bleibt stehen");
  d.close("ja");
  assert.equal(await p1, "ja");
});

test("frage: Fokus geht nach dem Schließen zurück, wenn das Element noch da ist", async () => {
  const d = attrappe();
  const p = frage({ text: "A?", ja: "Löschen" }, d);
  d.close("nein");
  await p;
  assert.equal(d.vorher.fokussiert, 1);
  const d2 = attrappe();
  d2.vorher.isConnected = false;
  const p2 = frage({ text: "A?", ja: "Löschen" }, d2);
  d2.close("nein");
  await p2;
  assert.equal(d2.vorher.fokussiert, 0);
});

test("bestaetigt: true nur bei \"ja\"", async () => {
  for (const [wert, erwartet] of [["ja", true], ["nein", false], ["dritte", false], ["", false]]) {
    const d = attrappe();
    const p = bestaetigt({ text: "A?", ja: "Löschen" }, d);
    d.close(wert);
    assert.equal(await p, erwartet, wert);
  }
});

test("index.html: Rückfrage-Blatt mit alertdialog, Name aus dem Text, Knöpfe nein/dritte/ja, Nein mit autofocus", () => {
  const html = lies("index.html");
  const blatt = html.match(/<dialog id="dialog-rueckfrage"([^>]*)>([\s\S]*?)<\/dialog>/);
  assert.ok(blatt, "Blatt fehlt");
  assert.match(blatt[1], /role="alertdialog"/);
  assert.match(blatt[1], /aria-labelledby="rueckfrage-text"/);
  assert.match(blatt[2], /<form method="dialog">/);
  assert.match(blatt[2], /<p id="rueckfrage-text"/);
  const knoepfe = [...blatt[2].matchAll(/<button value="(\w+)"[^>]*id="rueckfrage-(\w+)"([^>]*)>/g)];
  assert.deepEqual(knoepfe.map((k) => k[1]), ["nein", "dritte", "ja"]);
  assert.deepEqual(knoepfe.map((k) => k[2]), ["nein", "dritte", "ja"]);
  assert.match(knoepfe[0][3], /autofocus/);
});

test("js/rueckfrage.js braucht nichts aus app.js und setzt Text nie per innerHTML", () => {
  const quelle = lies("js/rueckfrage.js").replace(/\/\/.*$/gm, ""); // nur Code, keine Kommentare
  assert.doesNotMatch(quelle, /from\s+["']\.\.\/app\.js["']/);
  assert.doesNotMatch(quelle, /innerHTML/);
});
