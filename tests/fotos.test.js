import { test } from "node:test";
import assert from "node:assert/strict";
import { letzterWiegetag, fotoZeitraum, fotoImZeitraum, istFotoTag, fotoAngebot, vorherNachher, fotoFeld, nachEntfernen } from "../js/fotos.js";

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
  const neu = { label: "Monatsfoto (freiwillig)", speichertipp: false, hinweis: null };
  assert.deepEqual(fotoFeld({ ...basis, angebot: "fototag" }), { bereich: true, link: false, linkText: "Monatsfoto nachholen (freiwillig)", tipp: false, ...neu });
  assert.deepEqual(fotoFeld({ ...basis, angebot: "nachholen" }), { bereich: false, link: true, linkText: "Monatsfoto nachholen (freiwillig)", tipp: false, ...neu });
  assert.equal(fotoFeld({ ...basis, angebot: "nachholen", nachgeholt: true }).bereich, true);
  assert.equal(fotoFeld({ ...basis, angebot: "keins" }).bereich, false);
  assert.equal(fotoFeld({ ...basis, angebot: "keins" }).link, false);
  assert.equal(fotoFeld({ ...basis, angebot: "keins", gewaehlt: true }).bereich, true, "gewähltes Foto bleibt sichtbar");
  // Ohne Wiegetag: Tipp, solange ein Foto sinnvoll wäre
  assert.equal(fotoFeld({ ...basis, wiegetag: undefined, angebot: "nachholen" }).tipp, true);
  assert.equal(fotoFeld({ ...basis, wiegetag: undefined, angebot: "keins" }).tipp, false);
});

// 0.43.0 (Funde 06.11., Paket A): Wo ein Foto zu sehen ist, kann man es dort ändern oder entfernen.
test("fotoFeld: Ändern einer Wägung mit Foto zeigt das Foto mit „Anderes Foto“ und „Entfernen“", () => {
  for (const angebot of ["fototag", "nachholen", "keins"]) {
    for (const [gewaehlt, entfernt] of [[false, false], [true, false], [false, true], [true, true]]) {
      const z = fotoFeld({ angebot, gewaehlt, nachgeholt: false, aendern: true, hatFoto: true, entfernt, wiegetag: undefined });
      assert.deepEqual(z, {
        bereich: true,
        link: false,
        linkText: "Foto nachtragen (freiwillig)",
        tipp: false,
        label: "Foto",
        speichertipp: true,
        hinweis: null,
      }, `${angebot} ${gewaehlt} ${entfernt}`);
    }
  }
});

test("fotoFeld: neue Wägung, Zeitraum hat schon ein Monatsfoto: ruhige Zeile und Link „ersetzen“", () => {
  const basis = { angebot: "keins", gewaehlt: false, nachgeholt: false, aendern: false, hatFoto: false, wiegetag: 3, vorhandenDatum: "2026-11-05" };
  assert.deepEqual(fotoFeld(basis), {
    bereich: false,
    link: true,
    linkText: "Durch neues Foto ersetzen (freiwillig)",
    tipp: false,
    label: "Monatsfoto (freiwillig)",
    speichertipp: false,
    hinweis: "Das Monatsfoto ist schon da (vom 5. Nov. 2026).",
  });
  // Antippen öffnet den Foto-Bereich wie „Monatsfoto nachholen“; die Zeile bleibt, bis ein Foto gewählt ist
  const offen = fotoFeld({ ...basis, nachgeholt: true });
  assert.equal(offen.bereich, true);
  assert.equal(offen.link, false);
  assert.match(offen.hinweis, /^Das Monatsfoto ist schon da/);
  // Gewählt: Die Zeile „Seit dem letzten Foto-Tag …“ im Bereich übernimmt, keine doppelte Aussage
  const gewaehlt = fotoFeld({ ...basis, nachgeholt: true, gewaehlt: true });
  assert.equal(gewaehlt.bereich, true);
  assert.equal(gewaehlt.hinweis, null);
  // Ohne Wiegetag auch kein Wiegetag-Tipp: Es gibt ja schon ein Foto
  assert.equal(fotoFeld({ ...basis, wiegetag: undefined }).tipp, false);
  // Ohne Datum der vorhandenen Wägung (z. B. kaputtes Datum im Feld) bleibt es still wie bisher
  const still = fotoFeld({ ...basis, vorhandenDatum: undefined });
  assert.equal(still.link || still.bereich, false);
  assert.equal(still.hinweis, null);
});

test("fotoFeld: Ändern einer Wägung ohne Foto bietet „Foto nachtragen“ an, an jedem Tag", () => {
  for (const angebot of ["fototag", "nachholen", "keins"]) {
    const z = fotoFeld({ angebot, gewaehlt: false, nachgeholt: false, aendern: true, hatFoto: false, wiegetag: 3 });
    const erwartet = { bereich: false, link: true, linkText: "Foto nachtragen (freiwillig)", tipp: false, label: "Monatsfoto (freiwillig)", speichertipp: false, hinweis: null };
    assert.deepEqual(z, erwartet, angebot);
    // Auch wenn der Zeitraum schon ein Foto hat: beim Ändern unverändert „Foto nachtragen“ (Rückfrage erst beim Speichern)
    assert.deepEqual(fotoFeld({ angebot, gewaehlt: false, nachgeholt: false, aendern: true, hatFoto: false, wiegetag: 3, vorhandenDatum: "2026-11-05" }), erwartet, angebot);
    assert.equal(fotoFeld({ angebot, gewaehlt: false, nachgeholt: true, aendern: true, hatFoto: false, wiegetag: 3 }).bereich, true);
    assert.equal(fotoFeld({ angebot, gewaehlt: true, nachgeholt: false, aendern: true, hatFoto: false, wiegetag: 3 }).bereich, true);
  }
  // Kein Wiegetag-Tipp beim Ändern: der gehört zum Eintragen
  assert.equal(fotoFeld({ angebot: "nachholen", gewaehlt: false, nachgeholt: false, aendern: true, hatFoto: false, wiegetag: undefined }).tipp, false);
});

// 0.43.0: Rückfrage beim Entfernen im Foto-Fenster sagt, was Vorher/Nachher danach zeigt.
test("nachEntfernen: Foto nicht in Vorher/Nachher zu sehen → kein Zusatz", () => {
  const gewichte = [w("a", "2026-09-17", FOTO), w("b", "2026-09-30", FOTO), w("c", "2026-11-05", FOTO)];
  assert.equal(nachEntfernen(gewichte, "kito", gewichte[1]), "");
  assert.equal(nachEntfernen(gewichte, "kito", w("x", "2026-10-01")), "", "Wägung ohne Foto");
  assert.equal(nachEntfernen(gewichte, "kito", null), "");
});

test("nachEntfernen: Nachher-Foto weg, ein anderes rückt nach", () => {
  const gewichte = [w("a", "2026-09-17", FOTO), w("b", "2026-09-30", FOTO), w("c", "2026-11-05", FOTO)];
  assert.equal(nachEntfernen(gewichte, "kito", gewichte[2]), "Vorher/Nachher zeigt dann das Foto vom 30. Sept. 2026.");
});

test("nachEntfernen: Vorher-Foto weg, ein anderes rückt nach", () => {
  const gewichte = [w("c", "2026-11-05", FOTO), w("a", "2026-09-17", FOTO), w("b", "2026-09-30", FOTO)];
  assert.equal(nachEntfernen(gewichte, "kito", gewichte[1]), "Vorher/Nachher zeigt dann das Foto vom 30. Sept. 2026.");
});

test("nachEntfernen: nur noch ein Foto übrig → kein Nachher-Foto mehr", () => {
  const gewichte = [w("a", "2026-09-17", FOTO), w("c", "2026-11-05", FOTO), w("z", "2026-12-01", FOTO, "zuki")];
  assert.equal(nachEntfernen(gewichte, "kito", gewichte[1]), "Vorher/Nachher zeigt dann kein Nachher-Foto mehr.");
  assert.equal(nachEntfernen(gewichte, "kito", gewichte[0]), "Vorher/Nachher zeigt dann kein Nachher-Foto mehr.");
});

test("nachEntfernen: das einzige Foto → Vorher/Nachher zeigt kein Foto mehr", () => {
  const gewichte = [w("a", "2026-09-17", FOTO), w("b", "2026-09-30"), w("z", "2026-12-01", FOTO, "zuki")];
  assert.equal(nachEntfernen(gewichte, "kito", gewichte[0]), "Vorher/Nachher zeigt dann kein Foto mehr.");
});

// 0.43.0: Markup und Verdrahtung (Text-Prüfung, die Oberfläche selbst prüft die Hauptsitzung im Browser)
import { readFileSync } from "node:fs";
const lies = (datei) => readFileSync(new URL(`../${datei}`, import.meta.url), "utf8");

test("0.43.0: Gewicht-Fenster hat Zeile „Monatsfoto ist schon da“ vor dem Link und den Speicher-Hinweis im Foto-Bereich", () => {
  const html = lies("index.html");
  const vorhanden = html.indexOf('id="gewicht-foto-vorhanden"');
  assert.ok(vorhanden > 0, "Zeile fehlt");
  assert.ok(vorhanden < html.indexOf('id="gewicht-foto-nachholen"'), "Zeile steht vor dem Link");
  const bereich = html.slice(html.indexOf('id="gewicht-foto-bereich"'), html.indexOf('id="gewicht-fehler"'));
  assert.match(bereich, /<p class="tipp" id="gewicht-foto-monatstipp">Ein Foto im Monat reicht/);
  assert.match(bereich, /<p class="tipp" id="gewicht-foto-speichertipp" hidden>„Anderes Foto“ und „Entfernen“ gelten erst beim Speichern\.<\/p>/);
});

test("0.43.0: Vorher/Nachher-Bilder sind Knöpfe zum Foto-Fenster, mit Stift-Plakette und Hinweis", () => {
  const app = lies("app.js");
  const karte = app.slice(app.indexOf("function vorherNachherKarte"), app.indexOf("function zeichneVerlaufAnsicht"));
  assert.match(karte, /data-aktion="waegung-foto-ansehen" data-id="\$\{sicher\(w\.id\)\}"/);
  assert.match(karte, /aria-label="\$\{titel\}-Foto ändern oder entfernen"/);
  assert.match(karte, /class="vn-plakette" aria-hidden="true">\$\{SYMBOL\.stift\}Ändern</);
  assert.match(karte, /Foto antippen, um es zu ändern oder zu entfernen\./);
  // Der Hinweis nur, wenn mindestens ein Foto da ist
  assert.match(karte, /vorher \? `<p class="tipp">Foto antippen/);
});

test("0.43.0: Entfernen im Foto-Fenster nennt, was Vorher/Nachher danach zeigt", () => {
  const app = lies("app.js");
  const entfernen = app.slice(app.indexOf("function fotoEntfernen"), app.indexOf('$("dialog-foto").addEventListener("close"'));
  assert.match(entfernen, /nachEntfernen\(daten\.gewichte, tier\.id, waegung\)/);
});
