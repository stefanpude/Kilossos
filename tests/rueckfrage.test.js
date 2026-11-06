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

// ---------- Aufgabe 2: Speichern wartet auf die Antwort, einfache Lösch-Stellen ----------
const app = () => lies("app.js");
// Text von "anfang" bis zum ersten "ende" danach (ohne "ende").
const abschnitt = (quelle, anfang, ende) => {
  const a = quelle.indexOf(anfang);
  assert.ok(a >= 0, `nicht gefunden: ${anfang}`);
  const e = quelle.indexOf(ende, a + anfang.length);
  return quelle.slice(a, e < 0 ? undefined : e);
};
const fall = (name) => abschnitt(app(), `case "${name}":`, "\n    case ");

test("beimSpeichern verhindert das Schließen immer, wartet auf die Prüfung und schließt das Blatt selbst", () => {
  const rumpf = abschnitt(app(), "function beimSpeichern(", "\n}\n");
  const verhindern = rumpf.indexOf("ereignis.preventDefault()");
  const warten = rumpf.indexOf("await pruefenUndSpeichern(");
  assert.ok(verhindern > 0 && warten > verhindern, "preventDefault vor dem await");
  assert.match(rumpf, /if \(laeuft\) return/);
  assert.match(rumpf, /\.close\("speichern"\)/);
  assert.match(rumpf, /finally/);
});

test("Fokus-Rückgabe nach dem Schließen lässt das Rückfrage-Blatt aus (es gibt den Fokus selbst zurück)", () => {
  const schleife = abschnitt(app(), "let oeffner = null;", "requestAnimationFrame");
  assert.match(schleife, /dialog-rueckfrage/);
});

test("Mahlzeit, Gewicht und besonderen Tag löschen fragt mit eigenem Blatt", () => {
  for (const [name, text] of [
    ["mahlzeit-loeschen", "Diese Mahlzeit löschen?"],
    ["gewicht-loeschen", "Diesen Gewichtseintrag löschen?"],
    ["besonders-loeschen", "Diesen Eintrag löschen?"],
  ]) {
    assert.ok(fall(name).includes(`await bestaetigt({ text: "${text}", ja: "Löschen", gefahr: true })`), name);
  }
});

test("Sorte, Foto und Tier fragen mit eigenem Blatt und rotem Knopf", () => {
  const quelle = app();
  assert.match(abschnitt(quelle, '$("form-futter").addEventListener("submit"', "\n});\n"), /await bestaetigt\(\{ text: `„\$\{futter\.name\}“ wirklich löschen\?`, ja: "Sorte löschen", gefahr: true \}\)/);
  assert.match(abschnitt(quelle, "async function fotoEntfernen()", "\n}\n"), /await bestaetigt\(\{[\s\S]*ja: "Foto entfernen",\s*gefahr: true,?\s*\}\)/);
  assert.match(abschnitt(quelle, '$("form-profil").addEventListener("submit", async', "\n});\n"), /await bestaetigt\(\{ text: frage, ja: "Entfernen", gefahr: true \}\)/);
});

test("Lösch-Formulare verhindern das Schließen immer und schließen nach dem Ja selbst", () => {
  const quelle = app();
  const futter = abschnitt(quelle, '$("form-futter").addEventListener("submit", async', "\n});\n");
  assert.match(futter, /preventDefault\(\);[\s\S]*await bestaetigt/);
  assert.match(futter, /\$\("dialog-futter"\)\.close\("loeschen"\)/);
  const tier = abschnitt(quelle, '$("form-profil").addEventListener("submit", async', "\n});\n");
  assert.match(tier, /preventDefault\(\);[\s\S]*await bestaetigt/);
  assert.match(tier, /\$\("dialog-profil"\)\.close\("entfernen"\)/);
});

// ---------- Aufgabe 3: Freigabe ----------
const SICHERHEIT = "Das empfehlen die Leitlinien nur mit einem Fachtierarzt für Ernährung. Hat der Tierarzt das genau so festgelegt?";

test("Sicherheitsfrage unter 60 % RER: Wortlaut gleich, Knöpfe „Ja, so festgelegt“ und „Nein“, Rückgabetext gleich", () => {
  const quelle = app();
  assert.equal(quelle.split(SICHERHEIT).length - 1, 1, "genau einmal");
  const block = abschnitt(quelle, "const grenze = Math.round(harteUntergrenze(ziel));", 'return "Bitte die Tagesmenge mit dem Tierarzt klären.";');
  assert.ok(block.includes(SICHERHEIT));
  assert.match(block, /ja: "Ja, so festgelegt",\s*nein: "Nein",?/);
  assert.match(block, /await bestaetigt\(/);
  assert.ok(quelle.includes('return "Bitte die Tagesmenge mit dem Tierarzt klären.";'));
  assert.ok(quelle.includes('`${zahl(kcal)} kcal liegen unter ${grenze} kcal (60 % des Ruhebedarfs beim Zielgewicht). `'));
});

test("Freigabe speichern: Reihenfolge Datum, Ziel, 60 %, welche gilt, ersetzen bleibt", () => {
  const quelle = app();
  const stellen = [
    'if (plan.datumFrage && !(await bestaetigt({ text: plan.datumFrage, ja: "Ja, Datum stimmt", nein: "Nein, ändern" })))',
    'if (plan.zielFrage && !(await bestaetigt({ text: plan.zielFrage, ja: "Ja, Ziel stimmt", nein: "Nein, ändern" })))',
    SICHERHEIT,
    'if (plan.frage && !(await bestaetigt({ text: plan.frage, ja: "Ja, Datum stimmt", nein: "Nein, ändern" }))) return TEXT_DATUM_PRUEFEN;',
    'if (plan.ersetzen && !(await bestaetigt({ text: ersetzenFrage(plan.ueberschrieben), ja: "Ersetzen" })))',
  ].map((t) => quelle.indexOf(t));
  assert.ok(stellen.every((i) => i > 0), JSON.stringify(stellen));
  assert.deepEqual([...stellen].sort((a, b) => a - b), stellen);
  assert.match(quelle, /beimSpeichern\("form-freigabe", "freigabe-fehler", async \(werte\) =>/);
});

test("Freigabe löschen: eigenes Blatt mit rotem Knopf, schließt nach dem Ja selbst", () => {
  const block = abschnitt(app(), "// Löschen nur im Fenster „Freigabe ändern“", "\n});\n");
  assert.match(block, /preventDefault\(\);[\s\S]*await bestaetigt\(\{ text: loeschFrage\(eigeneFreigaben\(\), weg, tier\.name, tagSchluessel\(new Date\(\)\)\), ja: "Freigabe löschen", gefahr: true \}\)/);
  assert.match(block, /\$\("dialog-freigabe"\)\.close\("loeschen"\)/);
});

// ---------- Aufgabe 4: Monatsfoto mit drei Wegen ----------
const gewichtSpeichern = () => abschnitt(app(), 'beimSpeichern("form-gewicht"', "\n});\n");

test("Monatsfoto: kein „Abbrechen speichert …“-Satz mehr, Text und drei Knöpfe fest", () => {
  const quelle = app();
  assert.ok(!quelle.includes("„Abbrechen“ speichert"));
  const hilfe = abschnitt(quelle, "function monatsfotoFrage(", "\n}\n");
  assert.ok(hilfe.includes("`Seit dem letzten Foto-Tag gibt es schon ein Monatsfoto (vom ${datumText(vorhanden.datum)}). Soll das neue Foto es ersetzen?`"));
  assert.match(hilfe, /ja: "Foto ersetzen"/);
  assert.match(hilfe, /dritte: "Ohne neues Foto speichern"/);
  assert.doesNotMatch(hilfe, /nein:/, "Nein heißt „Abbrechen“ (Standard)");
});

test("Monatsfoto beim Ändern fragt, bevor die Wägung verändert wird, und mit dem neuen Datum", () => {
  const block = gewichtSpeichern();
  assert.match(block, /^beimSpeichern\("form-gewicht", "gewicht-fehler", async \(werte\) =>/);
  const fragen = block.indexOf("await frage(monatsfotoFrage(vorhanden))");
  const aendern = block.indexOf("waegungAendern(bearbeiteteWaegung");
  assert.ok(fragen > 0 && aendern > fragen, `Frage ${fragen} vor Ändern ${aendern}`);
  assert.match(block.slice(0, aendern), /fotoImZeitraum\(andere, bearbeiteteWaegung\.tierId, werte\.get\("datum"\), tier\.wiegetag\)/);
});

test("Monatsfoto: „Abbrechen“ lässt beide Fenster-Wege offen, ohne etwas zu speichern", () => {
  const block = gewichtSpeichern();
  const treffer = [...block.matchAll(/await frage\(monatsfotoFrage\(vorhanden\)\);\s*if \(antwort === "nein"\) return "";/g)];
  assert.equal(treffer.length, 2, "Ändern und Eintragen");
  const eintragen = block.lastIndexOf("await frage(monatsfotoFrage(vorhanden))");
  assert.ok(eintragen < block.indexOf("daten.gewichte.push(eintrag)"), "vor dem Anlegen");
});

// ---------- Aufgabe 5: Einlesen und alle Daten löschen ----------
test("Kein Browser-Fenster confirm() mehr in app.js und js/", () => {
  const dateien = ["app.js", ...readdirSync(new URL("../js/", import.meta.url)).filter((d) => d.endsWith(".js")).map((d) => `js/${d}`)];
  for (const datei of dateien) {
    const code = lies(datei).replace(/\/\/.*$/gm, "");
    assert.doesNotMatch(code, /\bconfirm\(/, datei);
  }
});

test("Alle Daten löschen fragt zweimal, erst „Alles löschen“, dann „Endgültig löschen“, Texte gleich", () => {
  const quelle = app();
  const mehr = abschnitt(quelle, "async function allesLoeschen()", "\n}\n");
  const notfall = abschnitt(quelle, '} else if (aktion === "loeschen") {', "location.reload();\n    }");
  for (const [block, erste, zweite] of [
    [mehr, "Wirklich ALLE Daten löschen? Einträge, Profil, Foto und Einstellungen auf diesem Handy gehen verloren.", "Letzte Rückfrage: Das lässt sich nicht rückgängig machen. Hast du eine Sicherung, falls du die Daten noch brauchst?"],
    [notfall, "frage", "Letzte Rückfrage: Das lässt sich nicht rückgängig machen."],
  ]) {
    const a = block.indexOf(`await bestaetigt({ text: ${erste === "frage" ? "frage" : `"${erste}"`}, ja: "Alles löschen", gefahr: true })`);
    const b = block.indexOf(`await bestaetigt({ text: "${zweite}", ja: "Endgültig löschen", gefahr: true })`);
    assert.ok(a > 0 && b > a, `${a} < ${b}`);
  }
});

test("Sicherung einlesen: Knopf „Einlesen“, rot, wenn Daten ersetzt werden", () => {
  const quelle = app();
  assert.ok(quelle.includes('await bestaetigt({ text: einleseFrage(neu, pruefung, ersetzen), ja: "Einlesen", gefahr: !einrichtungLaeuft })'));
  assert.ok(quelle.includes('await bestaetigt({ text: einleseFrage(neu, pruefung, " Die unlesbaren Daten auf diesem Gerät werden dadurch ersetzt."), ja: "Einlesen", gefahr: true })'));
});

// Browser-Fund 0.52.0: .knopf-zweit setzt display: inline-flex und überschreibt damit hidden (leeres Kästchen).
test("styles.css: versteckter dritter Knopf bleibt wirklich unsichtbar", () => {
  assert.match(lies("styles.css"), /\.rueckfrage-knoepfe > \[hidden\] \{ display: none; \}/);
});
