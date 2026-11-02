import { test } from "node:test";
import assert from "node:assert/strict";
import { verlaufGewichte, weicheKurve, zeichneVerlauf } from "../js/verlauf.js";

const G = (datum, kg) => ({ id: datum, tierId: "k", datum, kg, notiz: "" });
const gewichte = [G("2026-10-15", 9.0), G("2026-10-01", 9.32), G("2026-10-08", 9.25)];
const freigabe = { id: "f", tierId: "k", datum: "2026-10-08", zielgewichtKg: 7.2, kcalProTag: 220, tierarzt: "T", notiz: "" };

test("verlaufGewichte: nur ab dem Starttag, aufsteigend", () => {
  assert.deepEqual(verlaufGewichte(gewichte, "2026-10-08").map((g) => g.datum), ["2026-10-08", "2026-10-15"]);
  assert.deepEqual(verlaufGewichte(gewichte, null).map((g) => g.datum), ["2026-10-01", "2026-10-08", "2026-10-15"]);
});

test("weicheKurve: erst ab zwei Wägungen, ohne NaN", () => {
  assert.equal(weicheKurve([G("2026-10-01", 9.32)], []), "");
  const kurve = weicheKurve(gewichte, []);
  assert.match(kurve, /<svg[^>]*class="kurve"/);
  assert.match(kurve, /<path/);
  assert.match(kurve, /data-punkte=/);
  assert.doesNotMatch(kurve, /NaN/);
  assert.doesNotMatch(kurve, /class="ziel"/);
});

test("weicheKurve: Ziellinie nur mit Freigabe und nur im sichtbaren Bereich", () => {
  assert.doesNotMatch(weicheKurve(gewichte, [freigabe]), /class="ziel"/); // 7,2 kg liegt weit unter 9 kg
  assert.match(weicheKurve(gewichte, [{ ...freigabe, zielgewichtKg: 9.1 }]), /class="ziel"/);
  assert.match(weicheKurve(gewichte, [freigabe]), /class="band"/);
});

test("weicheKurve: Korridor im Zeitraum rechnet vom Gewicht am Tag der ersten Freigabe", () => {
  const lang = [G("2026-03-09", 9.32), G("2026-08-03", 7.9), G("2026-08-10", 7.85)];
  const f = { ...freigabe, datum: "2026-03-09" };
  const kurve = weicheKurve(lang, [f], "2026-08-01");
  // 0,5 %/Woche ab 9,32 kg liegt Anfang August noch über 8,3 kg, also über dem sichtbaren Bereich: oberer Rand oben.
  const ersterPunktY = Number(kurve.match(/class="band" points="[\d.]+,([\d.]+)/)[1]);
  assert.ok(ersterPunktY < 20, `oberer Rand bei y=${ersterPunktY}`);
  assert.equal((kurve.match(/data-punkte="([^"]*)"/)[1].match(/kg/g) ?? []).length, 2); // nur Punkte im Zeitraum
});

test("zeichneVerlauf: Zeitraum mit weniger als zwei Wägungen zeigt einen Satz statt einer Kurve", () => {
  const html = zeichneVerlauf({
    gewichte,
    mahlzeiten: [],
    freigaben: [],
    futterNachId: new Map(),
    zeitraum: "1m",
    heute: "2026-11-24",
    kopf: "",
  });
  assert.match(html, /Im gewählten Zeitraum gibt es weniger als zwei Wägungen\./);
  assert.doesNotMatch(html, /class="kurve"/);
  assert.match(html, /data-aktion="zeitraum"/);
});

test("zeichneVerlauf: Zeitraum-Umschalter sind Umschaltknöpfe (aria-pressed), keine Tabs", () => {
  const html = zeichneVerlauf({ gewichte, mahlzeiten: [], freigaben: [], futterNachId: new Map(), zeitraum: "3m", heute: "2026-10-20", kopf: "" });
  assert.doesNotMatch(html, /role="tab/);
  assert.match(html, /data-wert="3m" aria-pressed="true"/);
  assert.match(html, /data-wert="1m" aria-pressed="false"/);
});

test("zeichneVerlauf: Änderungs-Marke ist neutral (kein Grün ohne Bewertung)", () => {
  const html = zeichneVerlauf({ gewichte, mahlzeiten: [], freigaben: [], futterNachId: new Map(), zeitraum: "alles", heute: "2026-10-20", kopf: "" });
  const marke = html.match(/<span class="marke[^"]*">[^<]* kg<\/span>/)[0];
  assert.doesNotMatch(marke, /marke-(gut|warnung|gefahr)/);
});

test("zeichneVerlauf: Kennzahl-Kacheln folgen dem Zeitraum", () => {
  const mitAlt = [G("2026-08-01", 9.6), ...gewichte];
  const html = zeichneVerlauf({ gewichte: mitAlt, mahlzeiten: [], freigaben: [], futterNachId: new Map(), zeitraum: "1m", heute: "2026-10-20", kopf: "" });
  assert.match(html, /Start<\/span><strong>9,32 kg/);
  assert.doesNotMatch(html, /9,60 kg/);
  const alles = zeichneVerlauf({ gewichte: mitAlt, mahlzeiten: [], freigaben: [], futterNachId: new Map(), zeitraum: "alles", heute: "2026-10-20", kopf: "" });
  assert.match(alles, /Start<\/span><strong>9,60 kg/);
});

test("zeichneVerlauf: ohne Freigabe kein „im sicheren Bereich“", () => {
  const html = zeichneVerlauf({ gewichte, mahlzeiten: [], freigaben: [], futterNachId: new Map(), zeitraum: "alles", heute: "2026-10-20", kopf: "" });
  assert.match(html, /Ø [\d,]+ % pro Woche/);
  assert.doesNotMatch(html, /im sicheren Bereich/);
  const mit = zeichneVerlauf({ gewichte, mahlzeiten: [], freigaben: [freigabe], futterNachId: new Map(), zeitraum: "alles", heute: "2026-10-20", kopf: "" });
  assert.match(mit, /von 1 Wochen? im sicheren Bereich/);
});

test("zeichneVerlauf: Karte „Befunde vom Tierarzt“ nur mit Freigaben, mit BCS und MCS", () => {
  const ohne = zeichneVerlauf({ gewichte, mahlzeiten: [], freigaben: [], futterNachId: new Map(), zeitraum: "alles", heute: "2026-10-20", kopf: "" });
  assert.doesNotMatch(ohne, /Befunde vom Tierarzt/);
  const mit = zeichneVerlauf({
    gewichte,
    mahlzeiten: [],
    freigaben: [{ ...freigabe, bcs: 8, mcs: "leicht" }, { ...freigabe, id: "g", datum: "2026-10-15" }],
    futterNachId: new Map(),
    zeitraum: "alles",
    heute: "2026-10-20",
    kopf: "",
  });
  assert.match(mit, /Befunde vom Tierarzt/);
  assert.match(mit, /BCS 8 von 9 · leichter Muskelabbau/);
  assert.match(mit, /ohne BCS/);
  // neueste Freigabe zuerst
  assert.ok(mit.indexOf("15.10.") < mit.indexOf("8.10."));
});
