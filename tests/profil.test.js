import { test } from "node:test";
import assert from "node:assert/strict";
import { profilBereinigen, alterText, telefonLink, istWiegetag, WOCHENTAGE, kartenLink, praxisVorschlag } from "../js/profil.js";

const kito = () => ({ id: "kito", name: "Kito", art: "katze", geschlecht: "kater", kastriert: true });

test("profilBereinigen lässt gültige Angaben stehen", () => {
  const tier = {
    ...kito(),
    geburtsdatum: "2019-05-01",
    koerperbau: "von Natur aus sehr groß",
    haltung: "wohnung",
    schlankKg: 7.5,
    tierarzt: { praxis: "Tierarztpraxis am Markt", telefon: "+49 441 123456" },
    wiegetag: 6,
  };
  const daten = { tiere: [tier] };
  assert.equal(profilBereinigen(daten, "2026-11-02"), 0);
  assert.deepEqual(daten.tiere[0], tier);
});

test("profilBereinigen entfernt ungültige Angaben einzeln", () => {
  const daten = {
    tiere: [
      {
        ...kito(),
        geburtsdatum: "2030-01-01", // in der Zukunft
        koerperbau: "x".repeat(81),
        haltung: "garten",
        schlankKg: 40,
        tierarzt: { praxis: "Praxis", telefon: 'javascript:alert(1)"' },
        wiegetag: 9,
      },
    ],
  };
  assert.equal(profilBereinigen(daten, "2026-11-02"), 6);
  assert.deepEqual(daten.tiere[0], { ...kito(), tierarzt: { praxis: "Praxis" } });
});

test("profilBereinigen repariert Name, Geschlecht und kastriert statt sie zu löschen", () => {
  const daten = { tiere: [{ id: "a", name: "", art: "katze", geschlecht: "hund", kastriert: "ja" }] };
  assert.equal(profilBereinigen(daten, "2026-11-02"), 3);
  assert.equal(daten.tiere[0].name, "Tier");
  assert.equal("geschlecht" in daten.tiere[0], false);
  assert.equal(daten.tiere[0].kastriert, false);
});

test("profilBereinigen akzeptiert kein ungültiges Datum wie den 31. Februar", () => {
  const daten = { tiere: [{ ...kito(), geburtsdatum: "2020-02-31" }] };
  assert.equal(profilBereinigen(daten, "2026-11-02"), 1);
  assert.equal("geburtsdatum" in daten.tiere[0], false);
});

test("profilBereinigen entfernt einen leeren Tierarzt-Eintrag ganz", () => {
  const daten = { tiere: [{ ...kito(), tierarzt: { praxis: 5, telefon: "" } }] };
  profilBereinigen(daten, "2026-11-02");
  assert.equal("tierarzt" in daten.tiere[0], false);
});

// 0.49.0: Adresse der Praxis (neues freiwilliges Feld, Datenformat bleibt Version 1).
test("0.49.0: profilBereinigen lässt eine gültige Adresse der Praxis stehen", () => {
  const tierarzt = { praxis: "Tierarztpraxis Muster", telefon: "0441 123456", adresse: "Musterstraße 1, 12345 Musterstadt" };
  const daten = { tiere: [{ ...kito(), tierarzt: { ...tierarzt } }] };
  assert.equal(profilBereinigen(daten, "2026-11-06"), 0);
  assert.deepEqual(daten.tiere[0].tierarzt, tierarzt);
});

test("0.49.0: profilBereinigen entfernt eine Adresse, die kein Text oder zu lang ist", () => {
  for (const adresse of [5, "", "   ", null, ["Musterstraße 1"], "x".repeat(81)]) {
    const daten = { tiere: [{ ...kito(), tierarzt: { praxis: "Tierarztpraxis Muster", adresse } }] };
    assert.equal(profilBereinigen(daten, "2026-11-06"), 1);
    assert.deepEqual(daten.tiere[0].tierarzt, { praxis: "Tierarztpraxis Muster" });
  }
  // Genau 80 Zeichen sind erlaubt (wie maxlength im Formular).
  const daten = { tiere: [{ ...kito(), tierarzt: { adresse: "x".repeat(80) } }] };
  assert.equal(profilBereinigen(daten, "2026-11-06"), 0);
});

test("0.49.0: profilBereinigen entfernt weiter unbekannte Felder in der Tierarztpraxis", () => {
  const daten = { tiere: [{ ...kito(), tierarzt: { adresse: "Musterstraße 1", email: "praxis@example.org", x: 1 } }] };
  assert.equal(profilBereinigen(daten, "2026-11-06"), 2);
  assert.deepEqual(daten.tiere[0].tierarzt, { adresse: "Musterstraße 1" });
});

test("0.49.0: profilBereinigen entfernt den Tierarzt ganz, wenn nur eine ungültige Adresse da war", () => {
  const daten = { tiere: [{ ...kito(), tierarzt: { adresse: 42 } }] };
  profilBereinigen(daten, "2026-11-06");
  assert.equal("tierarzt" in daten.tiere[0], false);
});

const KARTE = "https://www.google.com/maps/search/?api=1&query=";

test("0.49.0: kartenLink ohne Adresse ist null", () => {
  assert.equal(kartenLink("Tierarztpraxis Muster", undefined), null);
  assert.equal(kartenLink("Tierarztpraxis Muster", ""), null);
  assert.equal(kartenLink("Tierarztpraxis Muster", "   "), null);
  assert.equal(kartenLink(undefined, 7), null);
});

test("0.49.0: kartenLink sucht Praxis und Adresse bei Google Maps", () => {
  assert.equal(
    kartenLink("Tierarztpraxis Muster", "Musterstraße 1, 12345 Musterstadt"),
    KARTE + encodeURIComponent("Tierarztpraxis Muster, Musterstraße 1, 12345 Musterstadt"),
  );
});

test("0.49.0: kartenLink ohne Praxisnamen sucht nur die Adresse", () => {
  assert.equal(kartenLink(undefined, "Musterstraße 1"), KARTE + encodeURIComponent("Musterstraße 1"));
  assert.equal(kartenLink("  ", "Musterstraße 1"), KARTE + encodeURIComponent("Musterstraße 1"));
});

test("0.49.0: kartenLink kodiert Umlaute, &, # und Leerzeichen", () => {
  const link = kartenLink("Praxis Müller & Söhne", "Hauptstraße 3 #2");
  assert.ok(link.startsWith(KARTE), "Anfang genau wie in der Google-Dokumentation");
  const suche = link.slice(KARTE.length);
  assert.doesNotMatch(suche, /[ &#äöüß]/);
  assert.match(suche, /%26/);
  assert.match(suche, /%23/);
  assert.match(suche, /%C3%BC/);
  assert.equal(decodeURIComponent(suche), "Praxis Müller & Söhne, Hauptstraße 3 #2");
});

test("0.49.0: praxisVorschlag kopiert nur Praxis, Telefon und Adresse", () => {
  const tier = {
    ...kito(),
    tierarzt: { praxis: "Tierarztpraxis Muster", telefon: "0441 123456", adresse: "Musterstraße 1, 12345 Musterstadt", fremd: "x" },
  };
  const vorschlag = praxisVorschlag(tier);
  assert.deepEqual(vorschlag, { praxis: "Tierarztpraxis Muster", telefon: "0441 123456", adresse: "Musterstraße 1, 12345 Musterstadt" });
  // Eine Kopie: Ändern des Vorschlags ändert das andere Tier nicht.
  vorschlag.praxis = "Andere Praxis";
  assert.equal(tier.tierarzt.praxis, "Tierarztpraxis Muster");
});

test("0.49.0: praxisVorschlag übernimmt auch nur einen Teil", () => {
  assert.deepEqual(praxisVorschlag({ ...kito(), tierarzt: { telefon: "0441 123456" } }), { telefon: "0441 123456" });
});

test("0.49.0: praxisVorschlag ohne Angaben ist null", () => {
  assert.equal(praxisVorschlag(null), null);
  assert.equal(praxisVorschlag(undefined), null);
  assert.equal(praxisVorschlag(kito()), null);
  assert.equal(praxisVorschlag({ ...kito(), tierarzt: {} }), null);
  assert.equal(praxisVorschlag({ ...kito(), tierarzt: { praxis: "", fremd: "x" } }), null);
});

test("alterText rechnet in Jahren und Monaten", () => {
  assert.equal(alterText("2019-05-01", "2026-11-02"), "7 Jahre, 6 Monate");
  assert.equal(alterText("2025-11-02", "2026-11-02"), "1 Jahr");
  assert.equal(alterText("2026-03-15", "2026-11-02"), "7 Monate");
  assert.equal(alterText("2026-10-20", "2026-11-02"), "unter 1 Monat");
  assert.equal(alterText("2025-10-01", "2026-11-02"), "1 Jahr, 1 Monat");
  assert.equal(alterText(undefined, "2026-11-02"), null);
});

test("telefonLink lässt nur Ziffern und ein führendes Plus übrig", () => {
  assert.equal(telefonLink("+49 (441) 12 34-56"), "tel:+494411234-56".replace("-", ""));
  assert.equal(telefonLink("0441 / 123456"), "tel:0441123456");
  assert.equal(telefonLink("12"), null);
  assert.equal(telefonLink(undefined), null);
});

test("Tierarzt-Bericht zeigt die Profilangaben und schützt vor eingeschleustem Code", async () => {
  const { berichtDaten, berichtHtml } = await import("../js/bericht.js");
  const tier = {
    ...kito(),
    geburtsdatum: "2019-05-01",
    koerperbau: "groß <script>",
    haltung: "wohnung",
    schlankKg: 7.5,
    tierarzt: { praxis: "Praxis am Markt", telefon: "0441 123456" },
  };
  const leer = { gewichte: [], mahlzeiten: [], freigaben: [] };
  const b = berichtDaten({ tier, ...leer, futter: [], von: "2026-10-01", bis: "2026-11-02", heute: "2026-11-02" });
  const html = berichtHtml(b, { tier, ...leer, futterNachId: new Map(), erstellt: "2026-11-02", demo: false });
  assert.match(html, /Alter 7 Jahre, 6 Monate \(geb\. 01\.05\.2019\)/);
  assert.match(html, /Wohnungskatze/);
  assert.match(html, /schlanken Zeit laut Halter: 7,5 kg/);
  assert.match(html, /Praxis: Praxis am Markt, 0441 123456/);
  assert.match(html, /groß &lt;script&gt;/);
  assert.doesNotMatch(html, /<script>/);
});

test("istWiegetag vergleicht den Wochentag (0 = Sonntag)", () => {
  assert.equal(WOCHENTAGE.length, 7);
  // 2. November 2026 ist ein Montag
  assert.equal(istWiegetag({ wiegetag: 1 }, "2026-11-02"), true);
  assert.equal(istWiegetag({ wiegetag: 0 }, "2026-11-02"), false);
  assert.equal(istWiegetag({}, "2026-11-02"), false);
});
