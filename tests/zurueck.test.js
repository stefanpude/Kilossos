import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { sollStapel, zustandAus, abgleichPlan, zuruecktaste } from "../js/zurueck.js";

// 0.88.0: Die Zurücktaste des Handys geht eine Ebene zurück statt die App zu schließen (.planning/zuruecktaste.md).

const z = (ansicht, fenster = 0) => ({ ansicht, fenster });

test("0.88.0: sollStapel – Heute ist die Grundebene, untere Seiten liegen direkt darüber, die Übersicht über „Mehr“", () => {
  assert.deepEqual(sollStapel(z("heute")), [z("heute")]);
  assert.deepEqual(sollStapel(z("verlauf")), [z("heute"), z("verlauf")]);
  assert.deepEqual(sollStapel(z("bericht")), [z("heute"), z("mehr"), z("bericht")]);
  assert.deepEqual(sollStapel(z("futter", 2)), [z("heute"), z("futter"), z("futter", 1), z("futter", 2)]);
  assert.deepEqual(sollStapel(z("heute", 1)), [z("heute"), z("heute", 1)]);
});

test("0.88.0: zustandAus liest nur eigene Einträge", () => {
  assert.deepEqual(zustandAus({ kilossos: 1, ansicht: "mehr", fenster: 1 }), z("mehr", 1));
  assert.equal(zustandAus(null), null);
  assert.equal(zustandAus({ ansicht: "mehr" }), null);
  assert.equal(zustandAus("x"), null);
});

test("0.88.0: abgleichPlan – vor, ersetzen oder zurück", () => {
  assert.deepEqual(abgleichPlan(z("heute"), z("heute", 1)), { ersetzen: null, neu: [z("heute", 1)] });
  assert.deepEqual(abgleichPlan(z("futter"), z("heute")), { zurueck: 1 });
  assert.deepEqual(abgleichPlan(z("futter"), z("verlauf")), { ersetzen: z("verlauf"), neu: [] });
  assert.deepEqual(abgleichPlan(z("bericht"), z("verlauf")), { zurueck: 1 });
  assert.deepEqual(abgleichPlan(z("bericht"), z("mehr")), { zurueck: 1 });
  assert.deepEqual(abgleichPlan(z("mehr"), z("bericht")), { ersetzen: null, neu: [z("bericht")] });
  assert.deepEqual(abgleichPlan(z("heute", 2), z("heute")), { zurueck: 2 });
  assert.deepEqual(abgleichPlan(z("heute", 1), z("futter")), { ersetzen: z("futter"), neu: [] });
  assert.deepEqual(abgleichPlan(z("heute"), z("gewicht", 1)), { ersetzen: null, neu: [z("gewicht"), z("gewicht", 1)] });
  assert.equal(abgleichPlan(z("mehr", 1), z("mehr", 1)), null);
});

// Nachgebauter Verlauf wie im Browser: go() meldet sich erst später per popstate (hier von Hand ausgelöst).
function nachbau(startZustand = null) {
  const v = {
    eintraege: [startZustand],
    index: 0,
    gos: [],
    get state() {
      return this.eintraege[this.index];
    },
    get length() {
      return this.eintraege.length;
    },
    pushState(state) {
      this.eintraege = this.eintraege.slice(0, this.index + 1);
      this.eintraege.push(state);
      this.index++;
    },
    replaceState(state) {
      this.eintraege[this.index] = state;
    },
    go(n) {
      this.gos.push(n);
    },
    // Führt das letzte go() aus und liefert den neuen Zustand wie event.state.
    ausfuehren() {
      const n = this.gos.shift();
      this.index = Math.max(0, this.index + n);
      return this.state;
    },
    // Nutzer drückt Zurück.
    zurueck() {
      this.index--;
      return this.state;
    },
  };
  return v;
}

function aufbau({ startZustand = null, ui = z("heute") } = {}) {
  const verlauf = nachbau(startZustand);
  const lage = { ui: { ...ui } };
  const angewendet = [];
  const wecker = [];
  const t = zuruecktaste({
    verlauf,
    lesen: () => ({ ...lage.ui }),
    anwenden: (ziel) => {
      angewendet.push(ziel);
      lage.ui = { ...ziel };
    },
    planen: (f) => f(),
    uhr: (f, ms) => wecker.push({ f, ms }),
  });
  return { verlauf, lage, angewendet, wecker, t };
}

const eintrag = (ansicht, fenster = 0) => ({ kilossos: 1, ansicht, fenster });

test("0.88.0: Start ohne Zustand macht aus dem aktuellen Eintrag die Grundebene Heute", () => {
  const { verlauf, t } = aufbau();
  t.abgleichen(); // vor dem Start: nichts
  assert.equal(verlauf.state, null);
  t.starten();
  assert.deepEqual(verlauf.eintraege, [eintrag("heute")]);
});

test("0.88.0: Fenster auf legt einen Eintrag an, Zurück schließt es über anwenden", () => {
  const { verlauf, lage, angewendet, t } = aufbau();
  t.starten();
  lage.ui = z("heute", 1);
  t.abgleichen();
  assert.equal(verlauf.length, 2);
  assert.deepEqual(verlauf.state, eintrag("heute", 1));
  t.beiPopstate(verlauf.zurueck());
  assert.deepEqual(angewendet, [z("heute")]);
  assert.equal(verlauf.index, 0);
  assert.deepEqual(verlauf.gos, []);
});

test("0.88.0: Fenster per Knopf zu geht im Verlauf zurück, das popstate danach ändert nichts", () => {
  const { verlauf, lage, angewendet, t } = aufbau();
  t.starten();
  lage.ui = z("heute", 1);
  t.abgleichen();
  lage.ui = z("heute");
  t.abgleichen();
  assert.deepEqual(verlauf.gos, [-1]);
  t.beiPopstate(verlauf.ausfuehren());
  assert.deepEqual(angewendet, []);
  assert.equal(verlauf.index, 0);
  assert.deepEqual(verlauf.gos, []);
});

test("0.88.0: gleichzeitig zu und auf (Futterliste → Sorte) ändert den Verlauf nicht", () => {
  const { verlauf, lage, t } = aufbau();
  t.starten();
  lage.ui = z("futter");
  t.abgleichen();
  lage.ui = z("futter", 1);
  t.abgleichen();
  const vorher = JSON.stringify(verlauf.eintraege);
  // Liste zu und Sorte auf im selben Schritt: lesen() sieht weiter ein Fenster.
  t.abgleichen();
  assert.equal(JSON.stringify(verlauf.eintraege), vorher);
  assert.deepEqual(verlauf.gos, []);
});

test("0.88.0: neues Fenster, während go noch läuft, wird erst danach eingetragen", () => {
  const { verlauf, lage, angewendet, t } = aufbau();
  t.starten();
  lage.ui = z("mehr", 1);
  t.abgleichen(); // [heute, mehr, mehr1]
  lage.ui = z("mehr");
  t.abgleichen(); // go(-1) läuft
  lage.ui = z("mehr", 1);
  t.abgleichen(); // muss warten
  assert.deepEqual(verlauf.gos, [-1]);
  assert.equal(verlauf.length, 3);
  t.beiPopstate(verlauf.ausfuehren());
  assert.deepEqual(angewendet, []);
  assert.deepEqual(verlauf.state, eintrag("mehr", 1));
  assert.equal(verlauf.index, 2);
});

test("0.88.0: kommt nach go kein popstate, wird der Eintrag ersetzt statt endlos zurückzugehen", () => {
  const { verlauf, lage, wecker, t } = aufbau();
  t.starten();
  lage.ui = z("verlauf");
  t.abgleichen();
  lage.ui = z("heute");
  t.abgleichen();
  assert.deepEqual(verlauf.gos, [-1]);
  verlauf.gos.length = 0; // Browser ignoriert go()
  assert.equal(wecker.at(-1).ms, 600);
  wecker.at(-1).f();
  assert.deepEqual(verlauf.state, eintrag("heute"));
  t.abgleichen();
  assert.deepEqual(verlauf.gos, []);
});

test("0.88.0: ein verspäteter Wecker nach dem popstate ändert nichts mehr", () => {
  const { verlauf, lage, wecker, t } = aufbau();
  t.starten();
  lage.ui = z("verlauf");
  t.abgleichen();
  lage.ui = z("heute");
  t.abgleichen();
  t.beiPopstate(verlauf.ausfuehren());
  const vorher = JSON.stringify(verlauf.eintraege);
  wecker.at(-1).f();
  assert.equal(JSON.stringify(verlauf.eintraege), vorher);
  assert.equal(verlauf.index, 0);
});

test("0.88.0: Ansicht über die Leiste nach Heute geht zurück, danach schließt Zurück die App", () => {
  const { verlauf, lage, t } = aufbau();
  t.starten();
  lage.ui = z("futter");
  t.abgleichen();
  lage.ui = z("verlauf");
  t.abgleichen();
  assert.equal(verlauf.length, 2); // ersetzt, nicht gestapelt
  assert.deepEqual(verlauf.state, eintrag("verlauf"));
  lage.ui = z("heute");
  t.abgleichen();
  t.beiPopstate(verlauf.ausfuehren());
  assert.equal(verlauf.index, 0);
});

test("0.88.0: Nutzer-Zurück aus der Übersicht führt nach „Mehr“, dann nach Heute", () => {
  const { verlauf, lage, angewendet, t } = aufbau();
  t.starten();
  lage.ui = z("mehr");
  t.abgleichen();
  lage.ui = z("bericht");
  t.abgleichen();
  t.beiPopstate(verlauf.zurueck());
  t.beiPopstate(verlauf.zurueck());
  assert.deepEqual(angewendet, [z("mehr"), z("heute")]);
  assert.equal(verlauf.index, 0);
});

test("0.88.0: Start nach dem Neuladen mit übrigem Zustand geht überzählige Einträge zurück", () => {
  const { verlauf, t } = aufbau({ startZustand: eintrag("heute", 2) });
  t.starten();
  assert.deepEqual(verlauf.gos, [-2]);
});

test("0.88.0: fremder Zustand beim Zurück gilt als Heute ohne Fenster", () => {
  const { lage, angewendet, t } = aufbau();
  t.starten();
  lage.ui = z("heute", 1);
  t.abgleichen();
  t.beiPopstate(null);
  assert.deepEqual(angewendet, [z("heute")]);
});

test("0.88.0: app.js meldet Ansichten und Fenster an die Zurücktaste", () => {
  const app = readFileSync(new URL("../app.js", import.meta.url), "utf8");
  assert.match(app, /import \{ zuruecktaste \} from "\.\/js\/zurueck\.js";/);
  assert.match(app, /addEventListener\("popstate"/);
  assert.match(app, /attributeFilter: \["open"\]/);
  assert.match(app, /zurueck\.starten\(\)/);
});
