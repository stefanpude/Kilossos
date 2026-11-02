import {
  laden,
  speichern,
  istGueltig,
  neueId,
  dauerhaftSpeichern,
  futterNachId,
  demoModus,
  verschiebeDaten,
  letzteSicherung,
  sicherungMerken,
  sicherungsHinweis,
  SICHERUNG_ALLE_TAGE,
  fotoGueltig,
  fotoBereinigen,
  freigabenBereinigen,
  befundText,
  MCS,
} from "./js/daten.js";
import {
  leseZahl,
  kcalFuer,
  tagesSumme,
  tagSchluessel,
  mahlzeitenAm,
  gewichteSortiert,
  GRENZEN,
  harteUntergrenze,
  abnahmeProWoche,
  leckerliKcal,
  aktuelleFreigabe,
  gewichteBis,
  warnungen,
} from "./js/rechnen.js";
import { zeichneVerlauf, glatt } from "./js/verlauf.js";
import { berichtDaten, berichtHtml } from "./js/bericht.js";
import { FUTTERLISTE, sucheFutter, ausListe, normalesFutterKcal } from "./js/futterliste.js";
import { ringWerte, leckerliKachel, monatsGruppen } from "./js/zusammenfassung.js";
import { leseAnzeige, merkeAnzeige, aufgeloest } from "./js/anzeige.js";
import { aufklappKarte, merkeZustand, zustandVon, zustandVergessen, aufklappenAnmelden } from "./js/aufklappen.js";
import { auswahlFeld, auswahlAnmelden } from "./js/auswahl.js";
import { profilBereinigen, alterText, telefonLink, telefonGueltig, istWiegetag, WOCHENTAGE, HALTUNG } from "./js/profil.js";
import { aktivesTier, leseAktivesTier, merkeAktivesTier, neuesTier, eintraegeVon, tierEntfernen } from "./js/tiere.js";
import { wischenAnmelden } from "./js/wischen.js";

// Offline-Fähigkeit: den Service Worker anmelden, sobald die Seite geladen ist.
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch((fehler) => {
      console.error("Service Worker konnte nicht angemeldet werden:", fehler);
    });
  });
}

const $ = (id) => document.getElementById(id);
const zahl = (wert, stellen = 0) =>
  wert.toLocaleString("de-DE", { minimumFractionDigits: stellen, maximumFractionDigits: stellen });
const sicher = (text) =>
  String(text).replace(/[&<>"']/g, (z) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[z]);
const ohneBewegung = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

const TYP_NAMEN = { nass: "Nassfutter", trocken: "Trockenfutter", leckerli: "Leckerli" };
const TYP_SYMBOL = { nass: "🥫", trocken: "🥣", leckerli: "🍬" };
const QUELLE_NAMEN = { packung: "Packung", hersteller: "Hersteller", ungefaehr: "ungefähr", geschaetzt: "geschätzt" };

// Kurztitel für Hinweise (Art "hinweis"): zugeklappt steht nur diese Zeile, der volle Text klappt auf.
// Warnungen der Art "sofort" und "achtung" sind nie zugeklappt.
const HINWEIS_TITEL = {
  "ueber-freigabe": "Mehr als freigegeben",
  diaetfutter: "Diätfutter mit dem Tierarzt besprechen",
  stillstand: "Abnahme stockt",
  "ziel-erreicht": "Zielgewicht erreicht",
  "freigabe-alt": "Freigabe ist älter als 3 Monate",
};

// ---------- Darstellung Hell / Dunkel / Wie das Handy ----------

const handyDunkel = matchMedia("(prefers-color-scheme: dark)");
function wendeAnzeigeAn(wahl) {
  const thema = aufgeloest(wahl, handyDunkel.matches);
  document.documentElement.dataset.theme = thema;
  $("theme-farbe").content = thema === "dunkel" ? "#1c1714" : "#fbf6f1";
}
handyDunkel.addEventListener("change", () => {
  if (leseAnzeige() === "handy") wendeAnzeigeAn("handy");
});
wendeAnzeigeAn(leseAnzeige());

// Demo-Modus (Link mit "?demo"): lädt bei jedem Öffnen frisch die Simulation aus werkzeuge/erzeuge-testdaten.js,
// verschoben auf heute, in einen eigenen Speicherplatz. Die echten Einträge bleiben unberührt.
const demo = new URLSearchParams(location.search).has("demo");
if (demo) {
  demoModus(true);
  $("demo-leiste").hidden = false;
  try {
    const simulation = await (await fetch("demo/kito-simulation.json")).json();
    const letzterTag = [...simulation.gewichte].sort((a, b) => b.datum.localeCompare(a.datum))[0].datum;
    const [j, m, t] = letzterTag.split("-").map(Number);
    const heute = new Date();
    const tage = Math.round((new Date(heute.getFullYear(), heute.getMonth(), heute.getDate()) - new Date(j, m - 1, t)) / 86400000);
    speichern(verschiebeDaten(simulation, tage));
  } catch (fehler) {
    console.error("Demo-Daten konnten nicht geladen werden:", fehler);
  }
}

let daten;
try {
  daten = laden();
} catch (fehler) {
  document.querySelector("main").innerHTML =
    `<div class="karte"><h2>Daten konnten nicht geladen werden</h2><p>${sicher(fehler.message)}</p></div>`;
  throw fehler;
}
// Alle Ansichten zeigen das aktive Tier; gewechselt wird oben auf „Heute“.
let tier = aktivesTier(daten, leseAktivesTier(demo));
let gewaehlterTag = new Date();
let zeitraum = "3m";

function sichern() {
  speichern(daten);
  zeichneAlles();
}

function wechsleTier(id) {
  tier = aktivesTier(daten, id);
  merkeAktivesTier(tier.id, demo);
  zeichneAlles();
  zeichneHeute(true);
}

// Kurze Bestätigung unten, z. B. „✓ Gespeichert“.
let toastUhr;
function zeigeToast(text, dauerMs = 1800) {
  const toast = $("toast");
  toast.textContent = text;
  toast.classList.add("zeigen");
  clearTimeout(toastUhr);
  toastUhr = setTimeout(() => toast.classList.remove("zeigen"), dauerMs);
}

// ---------- Ansichten ----------

// richtung: 1/-1 nach einem Wischen, dann gleitet der Bereich von der Seite herein.
function zeigeAnsicht(name, richtung = 0) {
  document.querySelectorAll(".ansicht").forEach((el) => {
    el.hidden = el.dataset.ansicht !== name;
    el.classList.remove("rein", "rein-rechts", "rein-links");
  });
  const ansicht = document.querySelector(`.ansicht[data-ansicht="${name}"]`);
  void ansicht.offsetWidth; // Animation neu starten
  ansicht.classList.add(richtung > 0 ? "rein-rechts" : richtung < 0 ? "rein-links" : "rein");
  document.querySelectorAll(".leiste button").forEach((knopf) => {
    if (knopf.dataset.ziel === name) knopf.setAttribute("aria-current", "page");
    else knopf.removeAttribute("aria-current");
  });
  window.scrollTo(0, 0);
  versteckeInfoblase();
  if (name === "heute") zeichneHeute(true);
}

function tagTitel(datum) {
  const heute = tagSchluessel(new Date());
  const gestern = tagSchluessel(new Date(Date.now() - 86400000));
  const schluessel = tagSchluessel(datum);
  if (schluessel === heute) return "Heute";
  if (schluessel === gestern) return "Gestern";
  return datum.toLocaleDateString("de-DE", { weekday: "short", day: "numeric", month: "long" });
}

// Rundes Profilbild: "gross" füllt den Knopf auf „Heute“, "klein" steht im Kopf von „Verlauf“.
function profilHtml(einTier, groesse) {
  const bild = fotoGueltig(einTier.foto) ? `<img src="${sicher(einTier.foto)}" alt="">` : "🐱";
  if (groesse === "klein") return `<span class="avatar">${bild}</span>`;
  return `${bild}<span class="kamera" aria-hidden="true">📷</span>`;
}

// ---------- Heute ----------

const UMFANG = 2 * Math.PI * 54;
let ringZahl = 0;

// Füllt den Ring auf "anteil" (0–1; null = ohne Freigabe, nur die Bahn) und zählt die Zahl hoch.
// vonNull: beim Wechsel auf „Heute“ und beim Tageswechsel von 0 an, sonst vom alten Wert aus.
function zeichneRing(anteil, kcal, ueber, vonNull) {
  const fuell = $("ring-fuell");
  fuell.setAttribute("stroke-dasharray", UMFANG);
  fuell.classList.toggle("ueber", ueber);
  fuell.style.visibility = anteil === null ? "hidden" : "visible";
  if (vonNull) {
    fuell.style.transition = "none";
    fuell.setAttribute("stroke-dashoffset", UMFANG);
    fuell.getBoundingClientRect();
    fuell.style.transition = "";
    ringZahl = 0;
  }
  fuell.setAttribute("stroke-dashoffset", UMFANG * (1 - (anteil ?? 0)));
  const start = performance.now();
  const von = ringZahl;
  const dauer = ohneBewegung() ? 1 : 1000;
  const zahlFeld = $("ring-zahl");
  (function schritt(jetzt) {
    const p = Math.min(1, (jetzt - start) / dauer);
    const e = 1 - (1 - p) ** 3;
    zahlFeld.textContent = zahl(Math.round(von + (kcal - von) * e));
    if (p < 1) requestAnimationFrame(schritt);
  })(start);
  ringZahl = kcal;
}

// Kleine Kurve der letzten Wägungen für die Gewichtskachel.
function miniKurve(gewichte) {
  const liste = [...gewichte].reverse().slice(-6);
  if (liste.length < 2) return "";
  const kgs = liste.map((g) => g.kg);
  const min = Math.min(...kgs);
  const max = Math.max(...kgs);
  const punkte = liste.map((g, i) => [4 + (i / (liste.length - 1)) * 112, 30 - ((g.kg - min) / (max - min || 1)) * 26]);
  return `<svg class="mini" viewBox="0 0 120 34" aria-hidden="true"><path d="${glatt(punkte)}"/></svg>`;
}

function zeichneHeute(vonNull = false) {
  const tag = tagSchluessel(gewaehlterTag);
  const heute = tagSchluessel(new Date());
  const futter = futterNachId(daten);
  const mahlzeiten = mahlzeitenAm(daten.mahlzeiten.filter((m) => m.tierId === tier.id), tag);
  const summe = tagesSumme(mahlzeiten, futter);
  const leckerli = leckerliKcal(mahlzeiten, futter);
  // Ein vergangener Tag wird an der Freigabe und den Gewichten gemessen, die an diesem Tag galten.
  const freigabe = freigabeVonTier(tag);
  const gewichte = gewichteBis(daten.gewichte.filter((g) => g.tierId === tier.id), tag);
  const sortiert = gewichteSortiert(gewichte);

  // Kopf
  $("profil").innerHTML = profilHtml(tier, "gross");
  $("profil").setAttribute("aria-label", `Profil und Foto von ${tier.name}`);
  const mehrere = daten.tiere.length > 1;
  $("tier-wechsel").disabled = !mehrere;
  $("tier-pfeil").hidden = !mehrere;
  if (mehrere) $("tier-wechsel").setAttribute("aria-label", `${tier.name}, Tier wechseln`);
  else $("tier-wechsel").removeAttribute("aria-label");
  const art = { kater: "Kater", katze: "Katze" }[tier.geschlecht] ?? "";
  $("kopf-gewicht").textContent = [art, sortiert[0] ? `${zahl(sortiert[0].kg, 2)} kg` : ""].filter(Boolean).join(" · ");

  // Wiegetag: nur am heutigen Tag und nur, solange heute noch kein Gewicht eingetragen ist.
  const wiegen = tag === heute && istWiegetag(tier, heute) && !gewichte.some((g) => g.datum === heute);
  $("wiegetag-hinweis").hidden = !wiegen;
  if (wiegen) $("wiegetag-hinweis-text").textContent = `⚖️ Heute ist Wiegetag für ${tier.name}. Am besten zur gewohnten Uhrzeit mit der gleichen Waage.`;
  $("kopf-datum").textContent = new Date().toLocaleDateString("de-DE", { weekday: "short", day: "numeric", month: "short" });
  $("tag-titel").textContent = tagTitel(gewaehlterTag);
  document.querySelector('[data-aktion="tag-vor"]').disabled = tag >= heute;

  // Warnungen: "sofort" und "achtung" immer offen, "hinweis" einzeilig und aufklappbar.
  const liste = warnungen({
    name: tier.name,
    tag,
    heute,
    kcal: summe.kcal,
    leckerli,
    freigabe,
    gewichte,
    fruehereMahlzeiten: daten.mahlzeiten.some((m) => m.tierId === tier.id && tagSchluessel(new Date(m.zeitpunkt)) < tag),
    normalesFutterKcal: normalesFutterKcal(mahlzeiten, futter),
  });
  $("warnungen-liste").innerHTML = liste
    .map((w) =>
      w.art === "hinweis"
        ? `<li>${aufklappKarte({
            id: "hinweis-" + w.id,
            klasse: "hinweis",
            kopf: `<span class="punkt" aria-hidden="true">i</span><span class="zusammen">${sicher(HINWEIS_TITEL[w.id] ?? "Hinweis")}</span>`,
            inhalt: `<p>${sicher(w.text)}</p><span class="quelle">Quelle: ${sicher(w.quelle)}</span>`,
          })}</li>`
        : `<li class="warnung warnung-${w.art}">${sicher(w.text)}<span class="quelle">Quelle: ${sicher(w.quelle)}</span></li>`
    )
    .join("");

  // Ring: ohne Freigabe kein Ziel und kein Füllstand.
  const ring = ringWerte(summe.kcal, freigabe);
  const ca = summe.unsicher ? "ca. " : "";
  zeichneRing(ring.anteil, Math.round(summe.kcal), ring.ueber, vonNull);
  const zeile = (titel, wert) => `<div><span>${titel}</span><b>${wert}</b></div>`;
  if (freigabe) {
    $("ring-unter").textContent = `${ca}von ${zahl(freigabe.kcalProTag)} kcal`;
    $("ring-rechts").innerHTML =
      zeile("Gefüttert", `${ca}${zahl(summe.kcal)} kcal`) +
      zeile("Freigabe", `${zahl(freigabe.kcalProTag)} kcal`) +
      (ring.darueber > 0 ? zeile("darüber", `${zahl(ring.darueber)} kcal`) : zeile("Noch offen", `${zahl(ring.offen)} kcal`));
  } else {
    $("ring-unter").textContent = `${ca}kcal · ${zahl(summe.gramm)} g Futter`;
    $("ring-rechts").innerHTML =
      zeile("Gefüttert", `${ca}${zahl(summe.kcal)} kcal`) +
      zeile("Menge", `${zahl(summe.gramm)} g`) +
      `<p>Ziel kommt mit der Freigabe vom Tierarzt.</p>` +
      `<button type="button" class="knopf-text" data-aktion="warum-kein-ziel">Warum kein Ziel?</button>`;
  }
  $("summe-hinweis").hidden = !summe.unsicher;

  // Kacheln: Gewicht und Leckerli
  const trend = abnahmeProWoche(gewichte, GRENZEN.tageZuSchnell);
  const gewichtKachel = sortiert[0]
    ? `<div class="kachel"><span class="label">Gewicht</span>
        <div class="wert">${zahl(sortiert[0].kg, 2)} <small>kg</small></div>
        ${trend ? `<span class="leise">${trend.prozent >= 0 ? "−" : "+"}${zahl(Math.abs(trend.prozent), 1)} % pro Woche</span>` : ""}
        ${miniKurve(sortiert)}</div>`
    : `<div class="kachel"><span class="label">Gewicht</span><div class="wert">–</div><span class="leise">noch nicht gewogen</span></div>`;
  const lk = leckerliKachel({ tag, heute, kcal: summe.kcal, leckerli, freigabe, warnungAktiv: liste.some((w) => w.id === "leckerli") });
  const anteilText = lk.anteil === null ? (lk.amTagesende ? "wird am Tagesende bewertet" : "") : `${zahl(lk.anteil * 100)} % der Tages-kcal · Grenze 10 %`;
  const breite = lk.anteil === null ? 0 : Math.min(100, (lk.anteil / GRENZEN.leckerliMax) * 100);
  const leckerliKachelHtml = `<div class="kachel"><span class="label">Leckerli</span>
      <div class="wert">${zahl(lk.kcal)} <small>kcal</small></div>
      <span class="leise">${anteilText}</span>
      ${lk.anteil === null ? "" : `<span class="balken sofort${lk.stufe === "achtung" ? " gefahr" : ""}"><i style="--w: ${breite.toFixed(1)}%"></i></span>`}</div>`;
  $("heute-kacheln").innerHTML = gewichtKachel + leckerliKachelHtml;

  // Mahlzeiten des Tages: zugeklappt nur die Zusammenfassung.
  if (mahlzeiten.length === 0) {
    $("heute-mahlzeiten").innerHTML = '<p class="leer">Noch keine Mahlzeit an diesem Tag.</p>';
  } else {
    const uhr = (m) => new Date(m.zeitpunkt).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
    const zeilen = mahlzeiten
      .map((m) => {
        const f = futter.get(m.futterId);
        const kcal = f ? `${zahl(kcalFuer(m.gramm, f.kcalPro100g))} kcal` : "kcal unbekannt";
        return `<div class="zeile tippbar" data-aktion="mahlzeit-bearbeiten" data-id="${m.id}"><span class="icon" aria-hidden="true">${TYP_SYMBOL[f?.typ] ?? "🍽️"}</span>
          <span class="name">${sicher(f ? f.name : "Gelöschte Sorte")}<small>${uhr(m)} · ${zahl(m.gramm)} g</small></span>
          <span class="kcal">${kcal}</span>
          <button type="button" class="knopf-loeschen" data-aktion="mahlzeit-loeschen" data-id="${m.id}" aria-label="Mahlzeit löschen">✕</button></div>`;
      })
      .join("");
    const anzahl = mahlzeiten.length === 1 ? "1 Eintrag" : `${mahlzeiten.length} Einträge`;
    $("heute-mahlzeiten").innerHTML = aufklappKarte({
      id: "mahlzeiten-heute",
      klasse: "karte",
      kopf: `<span class="zusammen"><span class="label">Mahlzeiten</span><br>${anzahl} · ${ca}${zahl(summe.kcal)} kcal · zuletzt ${uhr(mahlzeiten.at(-1))}</span>`,
      inhalt: zeilen,
    });
  }
}

// ---------- Gewicht ----------

function zeichneGewicht() {
  const gewichte = gewichteSortiert(daten.gewichte.filter((g) => g.tierId === tier.id));
  const [neuestes, vorheriges] = gewichte;
  $("gewicht-aktuell").textContent = neuestes ? zahl(neuestes.kg, 2) : "–";
  if (!neuestes) {
    $("gewicht-aenderung").textContent = "Noch kein Gewicht eingetragen.";
  } else if (!vorheriges) {
    $("gewicht-aenderung").textContent = `am ${datumText(neuestes.datum)}`;
  } else {
    const diffGramm = Math.round((neuestes.kg - vorheriges.kg) * 1000);
    const richtung = diffGramm < 0 ? "weniger" : "mehr";
    $("gewicht-aenderung").textContent =
      diffGramm === 0
        ? `am ${datumText(neuestes.datum)} · unverändert`
        : `am ${datumText(neuestes.datum)} · ${zahl(Math.abs(diffGramm))} g ${richtung} als am ${datumText(vorheriges.datum)}`;
  }
  const trend = abnahmeProWoche(gewichte, GRENZEN.tageZuSchnell);
  $("gewicht-trend").hidden = !trend;
  if (trend) {
    const richtung = trend.prozent >= 0 ? "Abnahme" : "Zunahme";
    $("gewicht-trend").textContent =
      `${richtung}: ${zahl(Math.abs(trend.prozent), 1)} % pro Woche (seit ${datumText(trend.von.datum)}) · ` +
      `sicherer Bereich ${zahl(GRENZEN.abnahmeMin, 1)}–${zahl(GRENZEN.abnahmeMax)} %`;
  }
  // Wägungen nach Monaten: der neueste Monat offen, ältere zu.
  $("gewicht-monate").hidden = gewichte.length === 0;
  $("gewicht-monate").innerHTML = monatsGruppen(gewichte)
    .map((monat, index) => {
      const zeilen = monat.eintraege
        .map((g) => {
          const g100 = g.diffKg === null ? null : Math.round(g.diffKg * 1000);
          const marke =
            g100 === null
              ? ""
              : `<span class="marke">${g100 < 0 ? "−" : g100 > 0 ? "+" : "±"}${zahl(Math.abs(g100))} g</span>`; // neutral, siehe verlauf.js
          return `<div class="zeile"><span class="name"><b>${zahl(g.kg, 2)} kg</b><small>${datumText(g.datum)}${g.notiz ? " · " + sicher(g.notiz) : ""}</small></span>
            ${marke}
            <button type="button" class="knopf-loeschen" data-aktion="gewicht-loeschen" data-id="${g.id}" aria-label="Gewicht löschen">✕</button></div>`;
        })
        .join("");
      const anzahl = monat.eintraege.length === 1 ? "1 Wägung" : `${monat.eintraege.length} Wägungen`;
      return aufklappKarte({
        id: "monat-" + monat.schluessel,
        offen: index === 0,
        klasse: "tag-klapp",
        kopf: `<span class="zusammen">${monat.titel}<small>${anzahl} · Ø ${zahl(monat.durchschnitt, 2)} kg</small></span>`,
        inhalt: zeilen,
      });
    })
    .join("");
}

// ---------- Futter ----------

function sortenZeile(f) {
  return `<div class="zeile tippbar" data-aktion="futter-bearbeiten" data-id="${f.id}">
    <span class="icon" aria-hidden="true">${TYP_SYMBOL[f.typ]}</span>
    <span class="name">${sicher(f.name)}<small>${TYP_NAMEN[f.typ]} · ${zahl(f.kcalPro100g, f.kcalPro100g % 1 ? 1 : 0)} kcal/100 g</small></span>
    <span class="marke marke-${f.kcalQuelle}">${QUELLE_NAMEN[f.kcalQuelle]}</span>
  </div>`;
}

function zeichneFutter() {
  const offen = daten.futter.length <= 5;
  $("futter-gruppen").innerHTML =
    ["nass", "trocken", "leckerli"]
      .map((typ) => {
        const sorten = daten.futter.filter((f) => f.typ === typ);
        if (sorten.length === 0) return "";
        return aufklappKarte({
          id: "futter-" + typ,
          offen,
          festhalten: true,
          klasse: "tag-klapp",
          kopf: `<span class="icon" aria-hidden="true">${TYP_SYMBOL[typ]}</span><span class="zusammen">${TYP_NAMEN[typ]}<small>${sorten.length === 1 ? "1 Sorte" : `${sorten.length} Sorten`}</small></span>`,
          inhalt: sorten.map(sortenZeile).join(""),
        });
      })
      .join("") || '<p class="leer">Noch keine Sorte angelegt.</p>';
}

function datumText(iso) {
  const [j, m, t] = iso.split("-").map(Number);
  return new Date(j, m - 1, t).toLocaleDateString("de-DE", { day: "numeric", month: "short", year: "numeric" });
}

function freigabeVonTier(stichtag) {
  return aktuelleFreigabe(daten.freigaben.filter((f) => f.tierId === tier.id), stichtag);
}

function zeichneFreigabe() {
  const freigabe = freigabeVonTier();
  $("titel-tierarzt").textContent = daten.tiere.length > 1 ? `Tierarzt · ${tier.name}` : "Tierarzt";
  $("freigabe-text").textContent = freigabe
    ? `${zahl(freigabe.zielgewichtKg, 1)} kg Zielgewicht · ${zahl(freigabe.kcalProTag)} kcal pro Tag · ` +
      `${befundText(freigabe) ? befundText(freigabe) + " · " : ""}` +
      `${freigabe.tierarzt}, ${datumText(freigabe.datum)}${freigabe.notiz ? " · " + freigabe.notiz : ""}`
    : "Noch keine Freigabe eingetragen.";
  const link = telefonLink(tier.tierarzt?.telefon);
  $("praxis-anrufen").hidden = !link;
  if (link) {
    $("praxis-anrufen").href = link;
    $("praxis-anrufen").textContent = `📞 ${tier.tierarzt.praxis ?? "Praxis"} anrufen`;
  }
}

// ---------- Profil ----------

const GESCHLECHT_NAMEN = { kater: "Kater", katze: "Katze" };

function profilZusammenfassung(einTier) {
  const heute = tagSchluessel(new Date());
  const geschlecht = [GESCHLECHT_NAMEN[einTier.geschlecht], einTier.kastriert ? "kastriert" : ""].filter(Boolean).join(", ");
  const alter = alterText(einTier.geburtsdatum, heute);
  return [geschlecht, alter, HALTUNG[einTier.haltung]].filter(Boolean).join(" · ");
}

// „Mehr“ → Tiere: eine Karte je Tier, Antippen öffnet sein Profil.
function zeichneTiere() {
  const mehrere = daten.tiere.length > 1;
  $("tiere-liste").innerHTML = daten.tiere
    .map((t) => {
      const zusammen = profilZusammenfassung(t);
      const fehlt = !t.geburtsdatum && !t.tierarzt && !t.koerperbau;
      const aktiv = mehrere && t === tier ? '<small class="aktiv-marke">wird gerade angezeigt</small>' : "";
      return `<button type="button" class="karte profil-karte" data-aktion="profil-oeffnen" data-id="${t.id}" aria-label="Profil von ${sicher(t.name)} bearbeiten">
        ${profilHtml(t, "klein")}
        <span class="profil-text"><b>${sicher(t.name)}</b>
          <small>${sicher(zusammen || "Profil")}</small>
          ${fehlt ? "<small>Profil ergänzen: Alter, Körperbau, Tierarzt</small>" : ""}${aktiv}</span>
        <span class="weiter" aria-hidden="true">›</span></button>`;
    })
    .join("");
}

// Tierwahl auf „Heute“: nur Wechseln, Hinzufügen gibt es unter „Mehr“.
function tierMenueZu(fokus = false) {
  if (!$("tier-feld").classList.contains("offen")) return;
  $("tier-feld").classList.remove("offen");
  $("tier-feld").querySelector(".tier-menue")?.remove();
  $("tier-wechsel").setAttribute("aria-expanded", "false");
  if (fokus) $("tier-wechsel").focus();
}

function tierWahlAntippen() {
  if ($("tier-feld").classList.contains("offen")) return tierMenueZu();
  profilMenueZu();
  const eintraege = daten.tiere
    .map(
      (t) => `<li role="none"><button type="button" role="menuitem" data-aktion="tier-waehlen" data-id="${t.id}">
        ${profilHtml(t, "klein")}<span>${sicher(t.name)}</span>${t === tier ? '<span class="haken" aria-hidden="true">✓</span>' : ""}</button></li>`
    )
    .join("");
  $("tier-feld").insertAdjacentHTML("beforeend", `<ul class="auswahl-menue tier-menue" role="menu">${eintraege}</ul>`);
  $("tier-feld").classList.add("offen");
  $("tier-wechsel").setAttribute("aria-expanded", "true");
  $("tier-feld").querySelector(".tier-menue button").focus();
}

// Das Profil-Blatt dient zum Bearbeiten (einTier) und zum Anlegen (null).
let bearbeitetesTier = null;

function oeffneProfil(einTier) {
  bearbeitetesTier = einTier;
  const p = einTier ?? {};
  const form = $("form-profil");
  form.reset();
  zeigeFehler("profil-fehler", "");
  $("profil-titel").textContent = einTier ? `Profil von ${einTier.name}` : "Neues Tier";
  $("profil-entfernen").hidden = !einTier || daten.tiere.length <= 1;
  form.name.value = p.name ?? "";
  $("profil-geschlecht").innerHTML = auswahlFeld({
    name: "geschlecht",
    beschriftung: "label-geschlecht",
    optionen: [
      { wert: "kater", text: "Kater" },
      { wert: "katze", text: "Katze" },
    ],
    wert: p.geschlecht,
  });
  $("profil-kastriert").innerHTML = auswahlFeld({
    name: "kastriert",
    beschriftung: "label-kastriert",
    optionen: [
      { wert: "ja", text: "ja" },
      { wert: "nein", text: "nein" },
    ],
    wert: einTier ? (p.kastriert ? "ja" : "nein") : undefined,
  });
  $("profil-haltung").innerHTML = auswahlFeld({
    name: "haltung",
    beschriftung: "label-haltung",
    optionen: [{ wert: "", text: "Keine Angabe" }, ...Object.entries(HALTUNG).map(([wert, text]) => ({ wert, text }))],
    wert: p.haltung ?? "",
  });
  form.geburtsdatum.value = p.geburtsdatum ?? "";
  form.geburtsdatum.max = tagSchluessel(new Date());
  form.koerperbau.value = p.koerperbau ?? "";
  form.schlank.value = p.schlankKg ? String(p.schlankKg).replace(".", ",") : "";
  form.praxis.value = p.tierarzt?.praxis ?? "";
  form.telefon.value = p.tierarzt?.telefon ?? "";
  $("dialog-profil").showModal();
}

beimSpeichern("form-profil", "profil-fehler", (werte) => {
  const name = werte.get("name").trim();
  const geburtsdatum = werte.get("geburtsdatum");
  const schlankText = werte.get("schlank").trim();
  const schlank = schlankText ? leseZahl(schlankText) : null;
  const praxis = werte.get("praxis").trim();
  const telefon = werte.get("telefon").trim();
  if (!name) return "Bitte einen Namen eingeben.";
  if (geburtsdatum && geburtsdatum > tagSchluessel(new Date())) return "Das Geburtsdatum liegt in der Zukunft.";
  if (schlankText && (!schlank || schlank < 0.5 || schlank > 20)) return "Bitte ein Gewicht zwischen 0,5 und 20 kg eingeben, z. B. 7,5.";
  if (telefon && !telefonGueltig(telefon)) return "Die Telefonnummer darf nur Ziffern, Leerzeichen und + ( ) / - enthalten.";

  const ziel = bearbeitetesTier ?? neuesTier(neueId(), name);
  // Leere Angaben werden entfernt statt als leerer Text gespeichert.
  const setze = (feld, wert) => {
    if (wert === "" || wert === null) delete ziel[feld];
    else ziel[feld] = wert;
  };
  ziel.name = name;
  setze("geschlecht", werte.get("geschlecht"));
  ziel.kastriert = werte.get("kastriert") === "ja";
  setze("geburtsdatum", geburtsdatum);
  setze("koerperbau", werte.get("koerperbau").trim());
  setze("haltung", werte.get("haltung"));
  setze("schlankKg", schlank);
  const tierarzt = { ...(praxis && { praxis }), ...(telefon && { telefon }) };
  setze("tierarzt", Object.keys(tierarzt).length ? tierarzt : null);
  if (bearbeitetesTier) return sichern();
  // Ein neues Tier wird gleich angezeigt, damit die ersten Einträge nicht beim alten Tier landen.
  daten.tiere.push(ziel);
  speichern(daten);
  wechsleTier(ziel.id);
});

// Entfernen mit Rückfrage: löscht das Tier mit allen Mahlzeiten, Gewichten und Freigaben. Das letzte Tier bleibt.
$("form-profil").addEventListener("submit", (ereignis) => {
  if (ereignis.submitter?.value !== "entfernen" || !bearbeitetesTier) return;
  const anzahl = eintraegeVon(daten, bearbeitetesTier.id);
  const teile = [
    [anzahl.mahlzeiten, "Mahlzeit", "Mahlzeiten"],
    [anzahl.gewichte, "Gewicht", "Gewichte"],
    [anzahl.freigaben, "Freigabe", "Freigaben"],
  ]
    .filter(([n]) => n > 0)
    .map(([n, eins, mehr]) => `${n} ${n === 1 ? eins : mehr}`);
  const eintraege = teile.length
    ? ` Dabei werden auch ${teile.length > 1 ? `${teile.slice(0, -1).join(", ")} und ${teile.at(-1)}` : teile[0]} von ${bearbeitetesTier.name} gelöscht. Das lässt sich nicht rückgängig machen.`
    : "";
  const frage = `${bearbeitetesTier.name} wirklich entfernen?${eintraege} Die Futtersorten bleiben.`;
  if (!confirm(frage)) {
    ereignis.preventDefault();
    return;
  }
  const name = bearbeitetesTier.name;
  if (!tierEntfernen(daten, bearbeitetesTier.id)) {
    ereignis.preventDefault();
    return zeigeFehler("profil-fehler", "Das letzte Tier kann nicht entfernt werden.");
  }
  speichern(daten);
  wechsleTier(tier.id); // war es das angezeigte Tier, springt die Anzeige auf das erste
  zeigeToast(`${name} entfernt`);
});

function zeichneVerlaufAnsicht() {
  $("verlauf-inhalt").innerHTML = zeichneVerlauf({
    gewichte: daten.gewichte.filter((g) => g.tierId === tier.id),
    mahlzeiten: daten.mahlzeiten.filter((m) => m.tierId === tier.id),
    freigaben: daten.freigaben.filter((f) => f.tierId === tier.id),
    futterNachId: futterNachId(daten),
    zeitraum,
    heute: tagSchluessel(new Date()),
    kopf: `<div class="verlauf-kopf">${profilHtml(tier, "klein")}<h2>Verlauf</h2></div>`,
  });
}

function zeichneAlles() {
  $("tiername").textContent = tier.name;
  zeichneHeute();
  zeichneGewicht();
  zeichneFutter();
  zeichneFreigabe();
  zeichneTiere();
  zeichneWiegetag();
  zeichneSicherung();
  zeichneVerlaufAnsicht();
}

function zeichneBericht() {
  const heute = tagSchluessel(new Date());
  const eigene = {
    gewichte: daten.gewichte.filter((g) => g.tierId === tier.id),
    mahlzeiten: daten.mahlzeiten.filter((m) => m.tierId === tier.id),
    freigaben: daten.freigaben.filter((f) => f.tierId === tier.id),
  };
  const auswahl = document.querySelector('[name="bericht-zeitraum"]').value;
  let von;
  if (auswahl === "alles") {
    const anfaenge = [
      ...eigene.gewichte.map((g) => g.datum),
      ...eigene.mahlzeiten.map((m) => tagSchluessel(new Date(m.zeitpunkt))),
      ...eigene.freigaben.map((f) => f.datum),
    ].sort();
    von = anfaenge[0] ?? heute;
  } else {
    const d = new Date();
    d.setDate(d.getDate() - Number(auswahl));
    von = tagSchluessel(d);
  }
  const bericht = berichtDaten({ tier, ...eigene, futter: daten.futter, von, bis: heute, heute });
  $("bericht-inhalt").innerHTML = berichtHtml(bericht, {
    tier,
    ...eigene,
    futterNachId: futterNachId(daten),
    erstellt: heute,
    demo,
  });
}

// Infoblase der Gewichtskurve: Antippen oder Ziehen zeigt den nächsten Punkt mit Datum und kg.
function zeigeInfoblase(ereignis) {
  const kurve = ereignis.target.closest?.("svg.kurve");
  const blase = $("infoblase");
  if (!kurve || !blase) return;
  const punkte = JSON.parse(kurve.dataset.punkte);
  const flaeche = kurve.getBoundingClientRect();
  const breite = kurve.viewBox.baseVal.width;
  const hoehe = kurve.viewBox.baseVal.height;
  const x = ((ereignis.clientX - flaeche.left) * breite) / flaeche.width;
  const naechster = punkte.reduce((a, b) => (Math.abs(b[0] - x) < Math.abs(a[0] - x) ? b : a));
  const linie = kurve.querySelector(".hilfslinie");
  const punkt = kurve.querySelector(".punkt.aktiv");
  linie.setAttribute("x1", naechster[0]);
  linie.setAttribute("x2", naechster[0]);
  punkt.setAttribute("cx", naechster[0]);
  punkt.setAttribute("cy", naechster[1]);
  linie.setAttribute("visibility", "visible");
  punkt.setAttribute("visibility", "visible");
  blase.textContent = naechster[2];
  blase.hidden = false;
  const links = (naechster[0] * flaeche.width) / breite;
  blase.style.left = `${Math.min(Math.max(links, blase.offsetWidth / 2), flaeche.width - blase.offsetWidth / 2)}px`;
  blase.style.top = `${(naechster[1] * flaeche.height) / hoehe}px`;
}
function versteckeInfoblase() {
  const blase = $("infoblase");
  if (blase) blase.hidden = true;
  document.querySelectorAll(".kurve .hilfslinie, .kurve .punkt.aktiv").forEach((el) => el.setAttribute("visibility", "hidden"));
}
$("verlauf-inhalt").addEventListener("pointerdown", zeigeInfoblase);
$("verlauf-inhalt").addEventListener("pointermove", zeigeInfoblase);
$("verlauf-inhalt").addEventListener("pointerleave", versteckeInfoblase);

// ---------- Formulare (als Blätter von unten) ----------

aufklappenAnmelden(document);
auswahlAnmelden(document);

// Antippen des abgedunkelten Hintergrunds schließt das Blatt wie „Abbrechen“; gespeichert wird nichts.
// Nur wenn Drücken UND Loslassen draußen waren – wer Text in einem Feld markiert und dabei über den
// Rand hinauszieht, verliert sonst das ganze Blatt.
document.querySelectorAll("dialog").forEach((dialog) => {
  const draussen = (ereignis) => {
    if (ereignis.target !== dialog) return false;
    const r = dialog.getBoundingClientRect();
    return ereignis.clientX < r.left || ereignis.clientX > r.right || ereignis.clientY < r.top || ereignis.clientY > r.bottom;
  };
  let gedruecktDraussen = false;
  dialog.addEventListener("pointerdown", (ereignis) => {
    gedruecktDraussen = draussen(ereignis);
  });
  dialog.addEventListener("click", (ereignis) => {
    if (gedruecktDraussen && draussen(ereignis)) dialog.close("abbrechen");
    gedruecktDraussen = false;
  });

  // Am Griff oder an der Überschrift nach unten ziehen schließt das Blatt wie „Abbrechen“.
  // Ein Viertel der Höhe oder ein schneller Wisch reicht; sonst springt das Blatt zurück.
  const griff = document.createElement("div");
  griff.className = "griff";
  griff.setAttribute("aria-hidden", "true");
  dialog.prepend(griff);
  let zug = null;
  dialog.addEventListener("pointerdown", (ereignis) => {
    if (!ereignis.target.closest(".griff, h2")) return;
    zug = { y: ereignis.clientY, zeit: ereignis.timeStamp };
    dialog.setPointerCapture(ereignis.pointerId);
    dialog.style.transition = "none";
  });
  dialog.addEventListener("pointermove", (ereignis) => {
    if (!zug) return;
    const weg = Math.max(0, ereignis.clientY - zug.y);
    dialog.style.transform = weg ? `translateY(${weg}px)` : "";
  });
  const loslassen = (ereignis) => {
    if (!zug) return;
    const weg = ereignis.clientY - zug.y;
    const schnell = weg / Math.max(1, ereignis.timeStamp - zug.zeit) > 0.5;
    zug = null;
    dialog.style.transition = "";
    if (ereignis.type === "pointerup" && (weg > dialog.offsetHeight / 4 || (weg > 30 && schnell))) {
      dialog.style.transform = "translateY(100%)";
      setTimeout(() => {
        dialog.close("abbrechen");
        dialog.style.transform = "";
      }, 200);
    } else {
      dialog.style.transform = "";
    }
  };
  dialog.addEventListener("pointerup", loslassen);
  dialog.addEventListener("pointercancel", loslassen);
});

// Enter in einem Eingabefeld speichert. Der Browser würde sonst den ersten Knopf auslösen
// („Abbrechen“ oder sogar „Löschen“). Im Suchfeld der Futterliste passiert nichts.
document.querySelectorAll("dialog form").forEach((form) => {
  form.addEventListener("keydown", (ereignis) => {
    if (ereignis.key !== "Enter" || ereignis.target.tagName !== "INPUT" || ereignis.isComposing) return;
    ereignis.preventDefault();
    const speichern = form.querySelector('button[value="speichern"]');
    if (speichern) form.requestSubmit(speichern);
  });
});

function zeigeFehler(id, text) {
  $(id).textContent = text;
  $(id).hidden = !text;
}

// Speichert nur, wenn "pruefen" keinen Fehlertext liefert; sonst bleibt das Formular offen.
function beimSpeichern(formId, fehlerId, pruefenUndSpeichern) {
  $(formId).addEventListener("submit", (ereignis) => {
    if (ereignis.submitter?.value !== "speichern") return;
    const fehler = pruefenUndSpeichern(new FormData($(formId)));
    if (fehler) {
      ereignis.preventDefault();
      zeigeFehler(fehlerId, fehler);
    } else {
      zeigeToast("✓ Gespeichert");
    }
  });
}

function futterMenue(gewaehlt) {
  $("mahlzeit-futter").innerHTML = auswahlFeld({
    name: "futter",
    beschriftung: "label-futter",
    optionen: daten.futter.map((f) => ({
      wert: f.id,
      text: f.name,
      zusatz: `${TYP_NAMEN[f.typ]} · ${zahl(f.kcalPro100g, f.kcalPro100g % 1 ? 1 : 0)} kcal/100 g`,
    })),
    wert: gewaehlt,
    extra: [{ text: "＋ Aus der Futterliste wählen", aktion: "liste-oeffnen" }],
  });
}

// Ohne Mahlzeit: neu eintragen. Mit Mahlzeit: Sorte, Uhrzeit und Menge nachträglich ändern (der Tag bleibt).
let bearbeiteteMahlzeit = null;

function oeffneMahlzeit(mahlzeit = null) {
  bearbeiteteMahlzeit = mahlzeit;
  const form = $("form-mahlzeit");
  form.reset();
  zeigeFehler("mahlzeit-fehler", "");
  $("mahlzeit-titel").textContent = mahlzeit ? `Mahlzeit von ${tier.name} ändern` : `Mahlzeit für ${tier.name}`;
  futterMenue(mahlzeit ? mahlzeit.futterId : daten.futter[0]?.id);
  const zeit = mahlzeit ? new Date(mahlzeit.zeitpunkt) : new Date();
  form.uhrzeit.value = `${String(zeit.getHours()).padStart(2, "0")}:${String(zeit.getMinutes()).padStart(2, "0")}`;
  if (mahlzeit) form.gramm.value = String(mahlzeit.gramm).replace(".", ",");
  zeigeMahlzeitVorschau();
  $("dialog-mahlzeit").showModal();
}

function zeigeMahlzeitVorschau() {
  const form = $("form-mahlzeit");
  const gramm = leseZahl(form.gramm.value);
  const futter = futterNachId(daten).get(form.futter.value);
  $("mahlzeit-vorschau").textContent =
    gramm && futter ? `= ${zahl(kcalFuer(gramm, futter.kcalPro100g))} kcal` : "";
}

// − / ＋ in 5-g-Schritten; eintippen bleibt möglich.
function grammSchritt(schritt) {
  const feld = $("form-mahlzeit").gramm;
  const jetzt = leseZahl(feld.value) ?? 0;
  const neu = Math.max(0, Math.round((jetzt + schritt) / 5) * 5);
  feld.value = neu ? String(neu) : "";
  zeigeMahlzeitVorschau();
}

$("form-mahlzeit").addEventListener("input", zeigeMahlzeitVorschau);

beimSpeichern("form-mahlzeit", "mahlzeit-fehler", (werte) => {
  if (!werte.get("futter")) return "Bitte eine Futtersorte wählen.";
  const gramm = leseZahl(werte.get("gramm"));
  if (!gramm || gramm > 1000) return "Bitte eine Menge zwischen 1 und 1000 g eingeben.";
  const [stunde, minute] = werte.get("uhrzeit").split(":").map(Number);
  const zeitpunkt = new Date(bearbeiteteMahlzeit ? bearbeiteteMahlzeit.zeitpunkt : gewaehlterTag);
  zeitpunkt.setHours(stunde, minute, 0, 0);
  if (bearbeiteteMahlzeit) {
    Object.assign(bearbeiteteMahlzeit, { futterId: werte.get("futter"), gramm, zeitpunkt: zeitpunkt.toISOString() });
    return sichern();
  }
  daten.mahlzeiten.push({
    id: neueId(),
    tierId: tier.id,
    futterId: werte.get("futter"),
    gramm,
    zeitpunkt: zeitpunkt.toISOString(),
  });
  sichern();
});

function oeffneGewicht() {
  const form = $("form-gewicht");
  form.reset();
  $("gewicht-titel").textContent = `Gewicht von ${tier.name}`;
  zeigeFehler("gewicht-fehler", "");
  form.datum.value = tagSchluessel(new Date());
  form.datum.max = tagSchluessel(new Date());
  $("dialog-gewicht").showModal();
}

beimSpeichern("form-gewicht", "gewicht-fehler", (werte) => {
  const kg = leseZahl(werte.get("kg"));
  if (!kg || kg < 0.5 || kg > 20) return "Bitte ein Gewicht zwischen 0,5 und 20 kg eingeben, z. B. 9,32.";
  daten.gewichte.push({
    id: neueId(),
    tierId: tier.id,
    kg,
    datum: werte.get("datum"),
    notiz: werte.get("notiz").trim(),
  });
  sichern();
});

// BCS 1–9 mit grober Einordnung als Hilfe beim Abschreiben – den Wert selbst legt nur der Tierarzt fest.
const BCS_GRUPPE = (bcs) => (bcs <= 3 ? "zu dünn" : bcs <= 5 ? "ideal" : bcs === 6 ? "etwas zu schwer" : "übergewichtig");
const BCS_OPTIONEN = [1, 2, 3, 4, 5, 6, 7, 8, 9].map((bcs) => ({ wert: String(bcs), text: String(bcs), zusatz: BCS_GRUPPE(bcs) }));

function oeffneFreigabe() {
  const form = $("form-freigabe");
  form.reset();
  $("freigabe-titel").textContent = `Freigabe für ${tier.name}`;
  zeigeFehler("freigabe-fehler", "");
  form.datum.value = tagSchluessel(new Date());
  form.datum.max = tagSchluessel(new Date());
  form.tierarzt.value = tier.tierarzt?.praxis ?? "";
  $("freigabe-bcs").innerHTML = auswahlFeld({
    name: "bcs",
    beschriftung: "label-bcs",
    optionen: [{ wert: "", text: "Keine Angabe" }, ...BCS_OPTIONEN],
    wert: "",
  });
  $("freigabe-mcs").innerHTML = auswahlFeld({
    name: "mcs",
    beschriftung: "label-mcs",
    optionen: [{ wert: "", text: "Keine Angabe" }, ...Object.entries(MCS).map(([wert, text]) => ({ wert, text }))],
    wert: "",
  });
  $("dialog-freigabe").showModal();
}

// Eine neue Freigabe ersetzt die alte nicht, sondern kommt dazu – so bleibt der Verlauf für den Tierarzt erhalten.
beimSpeichern("form-freigabe", "freigabe-fehler", (werte) => {
  const ziel = leseZahl(werte.get("ziel"));
  const kcal = leseZahl(werte.get("kcal"));
  const tierarzt = werte.get("tierarzt").trim();
  if (!ziel || ziel < 1 || ziel > 15) return "Bitte ein Zielgewicht zwischen 1 und 15 kg eingeben.";
  if (!kcal || kcal < 50 || kcal > 600) return "Bitte eine Tagesmenge zwischen 50 und 600 kcal eingeben.";
  if (!tierarzt) return "Bitte Tierarzt oder Praxis eintragen.";
  const grenze = Math.round(harteUntergrenze(ziel));
  if (
    kcal < grenze &&
    !confirm(
      `${zahl(kcal)} kcal liegen unter ${grenze} kcal (60 % des Ruhebedarfs beim Zielgewicht). ` +
        "Das empfehlen die Leitlinien nur mit einem Fachtierarzt für Ernährung. Hat der Tierarzt das genau so festgelegt?"
    )
  )
    return "Bitte die Tagesmenge mit dem Tierarzt klären.";
  daten.freigaben.push({
    id: neueId(),
    tierId: tier.id,
    datum: werte.get("datum"),
    zielgewichtKg: ziel,
    kcalProTag: kcal,
    tierarzt,
    notiz: werte.get("notiz").trim(),
    // BCS und MCS sind freiwillig: ohne Angabe fehlen die Felder ganz, wie in Freigaben vor 0.12.0.
    ...(werte.get("bcs") ? { bcs: Number(werte.get("bcs")) } : {}),
    ...(werte.get("mcs") ? { mcs: werte.get("mcs") } : {}),
  });
  sichern();
});

let bearbeitetesFutter = null;

const TYP_OPTIONEN = [
  { wert: "nass", text: "Nassfutter" },
  { wert: "trocken", text: "Trockenfutter" },
  { wert: "leckerli", text: "Leckerli / Snack" },
];
const QUELLE_OPTIONEN = [
  { wert: "packung", text: "Genau von der Packung" },
  { wert: "hersteller", text: "Herstellerangabe (z. B. Website)" },
  { wert: "geschaetzt", text: "Aus den Bestandteilen berechnet" },
  { wert: "ungefaehr", text: "Ungefähr" },
];

function oeffneFutter(futter) {
  bearbeitetesFutter = futter;
  const form = $("form-futter");
  form.reset();
  zeigeFehler("futter-fehler", "");
  $("futter-titel").textContent = futter ? "Sorte ändern" : "Eigene Sorte";
  $("futter-loeschen").hidden = !futter;
  $("futter-typ").innerHTML = auswahlFeld({ name: "typ", beschriftung: "label-typ", optionen: TYP_OPTIONEN, wert: futter?.typ });
  $("futter-quelle").innerHTML = auswahlFeld({ name: "quelle", beschriftung: "label-quelle", optionen: QUELLE_OPTIONEN, wert: futter?.kcalQuelle });
  if (futter) {
    form.name.value = futter.name;
    form.kcal.value = String(futter.kcalPro100g).replace(".", ",");
  }
  $("futter-notiz").textContent = futter?.notiz ?? "";
  $("futter-notiz").hidden = !futter?.notiz;
  $("dialog-futter").showModal();
}

beimSpeichern("form-futter", "futter-fehler", (werte) => {
  const name = werte.get("name").trim();
  const kcal = leseZahl(werte.get("kcal"));
  if (!name) return "Bitte einen Namen eingeben.";
  if (!werte.get("typ")) return "Bitte die Art wählen.";
  if (!kcal || kcal < 20 || kcal > 700) return "Bitte einen kcal-Wert zwischen 20 und 700 pro 100 g eingeben.";
  if (!werte.get("quelle")) return "Bitte angeben, woher der Wert stammt.";
  const felder = { name, typ: werte.get("typ"), kcalPro100g: kcal, kcalQuelle: werte.get("quelle") };
  if (bearbeitetesFutter) {
    Object.assign(bearbeitetesFutter, felder);
  } else {
    daten.futter.push({ id: neueId(), notiz: "", ...felder });
  }
  sichern();
});

$("form-futter").addEventListener("submit", (ereignis) => {
  if (ereignis.submitter?.value !== "loeschen" || !bearbeitetesFutter) return;
  const benutzt = daten.mahlzeiten.some((m) => m.futterId === bearbeitetesFutter.id);
  if (benutzt) {
    ereignis.preventDefault();
    zeigeFehler("futter-fehler", "Diese Sorte steckt in eingetragenen Mahlzeiten und kann nicht gelöscht werden.");
    return;
  }
  if (!confirm(`„${bearbeitetesFutter.name}“ wirklich löschen?`)) {
    ereignis.preventDefault();
    return;
  }
  daten.futter = daten.futter.filter((f) => f !== bearbeitetesFutter);
  sichern();
});

// ---------- Futterliste ----------

// Auf/Zu der Listen-Gruppen vor Beginn einer Suche; nach dem Leeren des Suchfelds wird er wiederhergestellt.
let vorSuche = null;
const LISTEN_GRUPPEN = ["liste-diaet", "liste-weitere"];

function zeichneListe() {
  const vorhanden = new Set(daten.futter.map((f) => f.listeId).filter(Boolean));
  const suche = $("liste-suche").value.trim();
  if (suche && !vorSuche) vorSuche = new Map(LISTEN_GRUPPEN.map((id) => [id, zustandVon(id)]));
  if (!suche && vorSuche) {
    for (const [id, offen] of vorSuche) offen === undefined ? zustandVergessen(id) : merkeZustand(id, offen);
    vorSuche = null;
  }
  const treffer = sucheFutter(suche);
  const gruppe = (id, titel, eintraege) => {
    if (eintraege.length === 0) return "";
    if (suche) merkeZustand(id, true); // bei einer Suche alle Gruppen mit Treffern aufklappen
    const zeilen = eintraege
      .map((e) => {
        const drin = vorhanden.has(e.id);
        return `<div class="zeile${drin ? "" : " tippbar"}" ${drin ? "" : `data-aktion="liste-uebernehmen" data-id="${e.id}"`}>
          <span class="icon" aria-hidden="true">${TYP_SYMBOL[e.typ]}</span>
          <span class="name">${sicher(e.name)}<small>${TYP_NAMEN[e.typ]} · ${zahl(e.kcalPro100g, e.kcalPro100g % 1 ? 1 : 0)} kcal/100 g</small></span>
          ${drin ? '<span class="marke">in deiner Liste</span>' : `<span class="marke marke-${e.kcalQuelle}">${QUELLE_NAMEN[e.kcalQuelle]}</span>`}
        </div>`;
      })
      .join("");
    return aufklappKarte({
      id,
      klasse: "tag-klapp",
      kopf: `<span class="zusammen">${titel}<small>${eintraege.length === 1 ? "1 Sorte" : `${eintraege.length} Sorten`}</small></span>`,
      inhalt: zeilen,
    });
  };
  $("liste-treffer").innerHTML =
    gruppe("liste-diaet", "Diätfutter vom Tierarzt – nur nach Rücksprache", treffer.filter((e) => e.diaet)) +
      gruppe("liste-weitere", "Weitere Sorten", treffer.filter((e) => !e.diaet)) ||
    '<p class="leise">Keine Sorte gefunden. Du kannst sie unter „Eigene Sorte anlegen“ selbst eintragen.</p>';
}

function oeffneListe() {
  $("liste-suche").value = "";
  zeichneListe();
  $("dialog-liste").showModal();
}

$("liste-suche").addEventListener("input", zeichneListe);

// Wurde die Liste aus dem Mahlzeit-Blatt geöffnet, bleibt dieses offen: neue Sorte gewählt, Menge und Uhrzeit bleiben.
function uebernehmeAusListe(listeId) {
  const eintrag = FUTTERLISTE.find((e) => e.id === listeId);
  if (!eintrag) return;
  const neu = ausListe(eintrag, neueId());
  daten.futter.push(neu);
  sichern();
  $("dialog-liste").close();
  if ($("dialog-mahlzeit").open) {
    futterMenue(neu.id);
    zeigeMahlzeitVorschau();
  }
  zeigeToast(`✓ ${eintrag.name} übernommen`);
}

// ---------- Profilbild ----------

// Mittig quadratisch zuschneiden, auf 256 × 256 px verkleinern, als JPEG speichern (wenige KB statt mehrerer MB).
async function fotoZuschneiden(datei) {
  const bild = await createImageBitmap(datei);
  const seite = Math.min(bild.width, bild.height);
  const ziel = 256;
  const leinwand = document.createElement("canvas");
  leinwand.width = leinwand.height = ziel;
  leinwand.getContext("2d").drawImage(bild, (bild.width - seite) / 2, (bild.height - seite) / 2, seite, seite, 0, 0, ziel, ziel);
  return leinwand.toDataURL("image/jpeg", 0.8);
}

// Speichern kann scheitern, wenn der Speicher voll ist: dann bleibt alles wie vorher.
function setzeFoto(foto) {
  const vorher = tier.foto;
  if (foto) tier.foto = foto;
  else delete tier.foto;
  try {
    speichern(daten);
  } catch {
    if (vorher) tier.foto = vorher;
    else delete tier.foto;
    zeigeToast("Das Foto passt nicht mehr in den Speicher. Die übrigen Daten sind unverändert.", 4000);
    return false;
  }
  zeichneAlles();
  return true;
}

function profilMenueZu(fokus = false) {
  if (!$("profil-feld").classList.contains("offen")) return;
  $("profil-feld").classList.remove("offen");
  $("profil-feld").querySelector(".profil-menue")?.remove();
  if (fokus) $("profil").focus();
}

// Tastatur im Profil- und im Tier-Menü: Pfeile wandern, Escape schließt; mit Tab hinaus schließt es ebenfalls.
function menueTastatur(feld, zu) {
  feld.addEventListener("keydown", (ereignis) => {
    const knoepfe = [...feld.querySelectorAll(".auswahl-menue button")];
    if (knoepfe.length === 0) return;
    const jetzt = knoepfe.indexOf(document.activeElement);
    if (ereignis.key === "Escape") {
      ereignis.preventDefault();
      return zu(true);
    }
    if (ereignis.key === "ArrowDown" || ereignis.key === "ArrowUp") {
      ereignis.preventDefault();
      const schritt = ereignis.key === "ArrowDown" ? 1 : -1;
      knoepfe[(jetzt + schritt + knoepfe.length) % knoepfe.length].focus();
    }
  });
  feld.addEventListener("focusout", (ereignis) => {
    if (ereignis.relatedTarget && !feld.contains(ereignis.relatedTarget)) zu();
  });
}
menueTastatur($("profil-feld"), profilMenueZu);
menueTastatur($("tier-feld"), tierMenueZu);

function profilAntippen() {
  if ($("profil-feld").classList.contains("offen")) return profilMenueZu();
  tierMenueZu();
  const mitFoto = fotoGueltig(tier.foto);
  $("profil-feld").insertAdjacentHTML(
    "beforeend",
    `<ul class="auswahl-menue profil-menue" role="menu">
      <li role="none"><button type="button" role="menuitem" data-aktion="profil-oeffnen">Profil bearbeiten</button></li>
      <li role="none"><button type="button" role="menuitem" data-aktion="foto-aendern">${mitFoto ? "Foto ändern" : "Foto wählen"}</button></li>
      ${mitFoto ? '<li role="none"><button type="button" role="menuitem" data-aktion="foto-entfernen">Foto entfernen</button></li>' : ""}
    </ul>`
  );
  $("profil-feld").classList.add("offen");
  $("profil-feld").querySelector(".profil-menue button").focus();
}

$("foto-datei").addEventListener("change", async (ereignis) => {
  const datei = ereignis.target.files[0];
  ereignis.target.value = "";
  if (!datei) return;
  let foto;
  try {
    foto = await fotoZuschneiden(datei);
  } catch {
    return zeigeToast("Dieses Bild konnte nicht gelesen werden.", 3000);
  }
  if (setzeFoto(foto)) zeigeToast("✓ Foto übernommen");
});

// ---------- Sicherung ----------

function exportieren() {
  const datei = new Blob([JSON.stringify(daten, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(datei);
  link.download = `kilossos-${demo ? "demo" : "sicherung"}-${tagSchluessel(new Date())}.json`;
  link.click();
  URL.revokeObjectURL(link.href);
  if (!demo) {
    sicherungMerken(tagSchluessel(new Date()));
    zeichneSicherung();
  }
}

// Erinnert auf "Heute" an eine Sicherung; im Demo-Modus nie (dort gibt es nichts Echtes zu sichern).
function zeichneSicherung() {
  const letzte = letzteSicherung();
  const tage = [
    ...daten.mahlzeiten.map((m) => tagSchluessel(new Date(m.zeitpunkt))),
    ...daten.gewichte.map((g) => g.datum),
    ...daten.freigaben.map((f) => f.datum),
  ].sort();
  const hinweis = demo
    ? null
    : sicherungsHinweis({ letzte, ersterEintrag: tage[0], letzterEintrag: tage.at(-1), heute: tagSchluessel(new Date()) });
  $("sicherung-hinweis").hidden = !hinweis;
  if (hinweis) {
    $("sicherung-hinweis-text").textContent = hinweis.nieGesichert
      ? "Du hast noch nie eine Sicherung gespeichert. Alle Einträge liegen nur auf diesem Handy – geht es verloren, sind sie weg."
      : `Deine letzte Sicherung ist ${hinweis.tage} Tage her. Seitdem ist Neues dazugekommen.`;
  }
  $("sicherung-datum").textContent = demo
    ? "Demo: Sicherungen werden hier nicht gemerkt."
    : letzte
      ? `Letzte Sicherung: ${datumText(letzte)}. Kilossos erinnert dich alle ${SICHERUNG_ALLE_TAGE} Tage.`
      : "Noch keine Sicherung gespeichert.";
}

$("import-datei").addEventListener("change", async (ereignis) => {
  const datei = ereignis.target.files[0];
  ereignis.target.value = "";
  if (!datei) return;
  let neu;
  try {
    neu = JSON.parse(await datei.text());
  } catch {
    alert("Diese Datei ist keine Kilossos-Sicherung.");
    return;
  }
  if (!istGueltig(neu)) {
    alert("Diese Datei ist keine gültige Kilossos-Sicherung.");
    return;
  }
  const verworfen = fotoBereinigen(neu);
  const profilFehler = profilBereinigen(neu, tagSchluessel(new Date())) + freigabenBereinigen(neu);
  const anzahl = `${neu.mahlzeiten.length} Mahlzeiten und ${neu.gewichte.length} Gewichte`;
  const fotoText = verworfen > 0 ? " Das Profilbild in der Datei war ungültig und wird nicht übernommen." : "";
  const profilText = profilFehler > 0 ? " Einige Angaben im Profil oder in den Freigaben waren ungültig und werden nicht übernommen." : "";
  if (!confirm(`Sicherung mit ${anzahl} einlesen? Alle Einträge auf diesem Handy werden dadurch ersetzt.${fotoText}${profilText}`)) return;
  speichern(neu);
  location.reload();
});

// Recht auf Löschung (DSGVO): alles, was Kilossos auf diesem Gerät gespeichert hat. Doppelt nachfragen.
function allesLoeschen() {
  if (demo) return zeigeToast("In der Demo gibt es nichts Echtes zu löschen.", 2500);
  if (!confirm("Wirklich ALLE Daten löschen? Einträge, Profil, Foto und Einstellungen auf diesem Handy gehen verloren.")) return;
  if (!confirm("Letzte Rückfrage: Das lässt sich nicht rückgängig machen. Hast du eine Sicherung, falls du die Daten noch brauchst?")) return;
  for (const schluessel of Object.keys(localStorage)) {
    if (schluessel.startsWith("kilossos-")) localStorage.removeItem(schluessel);
  }
  location.reload();
}

async function zeigeSpeicherStatus() {
  const dauerhaft = await dauerhaftSpeichern();
  $("speicher-status").textContent = dauerhaft
    ? "Der Browser hält die Daten dauerhaft fest."
    : "Hinweis: Der Browser könnte die Daten bei Speichermangel löschen – Sicherungen sind deshalb wichtig.";
}

// ---------- Auswahlfelder in „Mehr“ ----------

$("bericht-zeitraum-feld").innerHTML = auswahlFeld({
  name: "bericht-zeitraum",
  beschriftung: "label-bericht-zeitraum",
  optionen: [
    { wert: "28", text: "letzte 4 Wochen" },
    { wert: "84", text: "letzte 12 Wochen" },
    { wert: "alles", text: "alles" },
  ],
  wert: "alles",
});
$("anzeige-feld").innerHTML = auswahlFeld({
  name: "anzeige",
  beschriftung: "label-anzeige",
  optionen: [
    { wert: "hell", text: "Hell" },
    { wert: "dunkel", text: "Dunkel" },
    { wert: "handy", text: "Wie das Handy" },
  ],
  wert: leseAnzeige(),
});
// Der Wiegetag gehört zum aktiven Tier; beim Wechsel wird das Feld neu gezeichnet.
function zeichneWiegetag() {
  $("label-wiegetag").textContent = daten.tiere.length > 1 ? `Wiegetag von ${tier.name}` : "Wiegetag";
  $("wiegetag-feld").innerHTML = auswahlFeld({
    name: "wiegetag",
    beschriftung: "label-wiegetag",
    // Montag zuerst, wie im deutschen Kalender
    optionen: [{ wert: "", text: "Kein fester Tag" }, ...[1, 2, 3, 4, 5, 6, 0].map((t) => ({ wert: String(t), text: WOCHENTAGE[t] }))],
    wert: Number.isInteger(tier.wiegetag) ? String(tier.wiegetag) : "",
  });
}
document.addEventListener("change", (ereignis) => {
  if (ereignis.target.name !== "wiegetag") return;
  if (ereignis.target.value === "") delete tier.wiegetag;
  else tier.wiegetag = Number(ereignis.target.value);
  sichern();
  zeigeToast("✓ Wiegetag gespeichert");
});
document.addEventListener("change", (ereignis) => {
  if (ereignis.target.name !== "anzeige") return;
  try {
    merkeAnzeige(ereignis.target.value);
  } catch {
    // Speicher gesperrt: die Wahl gilt dann nur bis zum Schließen der App.
  }
  wendeAnzeigeAn(ereignis.target.value);
});

// ---------- Willkommensseite ----------

// Einmal beim ersten Öffnen, nie in der Demo. „Alle Daten löschen“ entfernt den Schlüssel, dann erscheint sie wieder.
// Neuer Name (0.13.2), damit sie nach dem Logo-Wechsel auf jedem Gerät noch einmal erscheint.
const WILLKOMMEN_SCHLUESSEL = "kilossos-willkommen-2";

function willkommenZeigen() {
  $("willkommen").hidden = false;
  document.body.classList.add("willkommen-offen");
  $("willkommen-titel").focus();
}

function willkommenSchliessen() {
  try {
    localStorage.setItem(WILLKOMMEN_SCHLUESSEL, "gesehen");
  } catch {
    // Speicher gesperrt: dann erscheint die Seite beim nächsten Öffnen noch einmal.
  }
  $("willkommen").hidden = true;
  document.body.classList.remove("willkommen-offen");
}

function willkommenGesehen() {
  try {
    return localStorage.getItem(WILLKOMMEN_SCHLUESSEL) !== null;
  } catch {
    return true;
  }
}

// ---------- Wischen zwischen den Bereichen ----------

wischenAnmelden(document.querySelector("main"), {
  leiste: () => [...document.querySelectorAll(".leiste button[data-ziel]")].map((knopf) => knopf.dataset.ziel),
  aktuell: () => document.querySelector(".ansicht:not([hidden])")?.dataset.ansicht,
  wechseln: zeigeAnsicht,
  gesperrt: () => document.body.classList.contains("willkommen-offen") || !!document.querySelector("dialog[open]"),
});

// ---------- Klicks ----------

document.addEventListener("click", (ereignis) => {
  if (!ereignis.target.closest?.("#profil-feld")) profilMenueZu();
  if (!ereignis.target.closest?.("#tier-feld")) tierMenueZu();
  const ziel = ereignis.target.closest("[data-ziel], [data-aktion]");
  if (!ziel) return;
  if (ziel.dataset.ziel) return zeigeAnsicht(ziel.dataset.ziel);

  const id = ziel.dataset.id;
  switch (ziel.dataset.aktion) {
    case "tag-zurueck":
      gewaehlterTag = new Date(gewaehlterTag.getFullYear(), gewaehlterTag.getMonth(), gewaehlterTag.getDate() - 1);
      return zeichneHeute(true);
    case "tag-vor":
      gewaehlterTag = new Date(gewaehlterTag.getFullYear(), gewaehlterTag.getMonth(), gewaehlterTag.getDate() + 1);
      return zeichneHeute(true);
    case "mahlzeit-neu":
      return oeffneMahlzeit();
    case "mahlzeit-bearbeiten":
      return oeffneMahlzeit(daten.mahlzeiten.find((m) => m.id === id));
    case "warum-kein-ziel":
      return $("dialog-warum").showModal();
    case "bcs-erklaerung":
      return $("dialog-bcs").showModal();
    case "gramm-minus":
      return grammSchritt(-5);
    case "gramm-plus":
      return grammSchritt(5);
    case "mahlzeit-loeschen":
      if (confirm("Diese Mahlzeit löschen?")) {
        daten.mahlzeiten = daten.mahlzeiten.filter((m) => m.id !== id);
        sichern();
      }
      return;
    case "gewicht-neu":
      return oeffneGewicht();
    case "gewicht-loeschen":
      if (confirm("Diesen Gewichtseintrag löschen?")) {
        daten.gewichte = daten.gewichte.filter((g) => g.id !== id);
        sichern();
      }
      return;
    case "futter-neu":
      return oeffneFutter(null);
    case "futter-bearbeiten":
      return oeffneFutter(daten.futter.find((f) => f.id === id));
    case "liste-oeffnen":
      return oeffneListe();
    case "liste-uebernehmen":
      return uebernehmeAusListe(id);
    case "freigabe-neu":
      return oeffneFreigabe();
    case "zeitraum": {
      // Die Markierung startet an der alten Stelle und gleitet zur neuen (die Ansicht wird neu gezeichnet).
      const altePos = ziel.closest(".umschalter").style.getPropertyValue("--pos");
      zeitraum = ziel.dataset.wert;
      zeichneVerlaufAnsicht();
      const umschalter = document.querySelector("#verlauf-inhalt .umschalter");
      const neuePos = umschalter.style.getPropertyValue("--pos");
      umschalter.style.setProperty("--pos", altePos);
      requestAnimationFrame(() => requestAnimationFrame(() => umschalter.style.setProperty("--pos", neuePos)));
      return;
    }
    case "profil":
      return profilAntippen();
    case "profil-oeffnen":
      profilMenueZu();
      return oeffneProfil(id ? daten.tiere.find((t) => t.id === id) : tier);
    case "tier-neu":
      return oeffneProfil(null);
    case "tier-wahl":
      return tierWahlAntippen();
    case "tier-waehlen":
      tierMenueZu(true);
      if (id !== tier.id) {
        wechsleTier(id);
        zeigeToast(`${tier.name} wird angezeigt`);
      }
      return;
    case "foto-aendern":
      profilMenueZu();
      if (demo) return zeigeToast("In der Demo lässt sich kein Foto setzen.", 2500);
      return $("foto-datei").click();
    case "alles-loeschen":
      return allesLoeschen();
    case "foto-entfernen":
      profilMenueZu();
      if (setzeFoto(null)) zeigeToast("Foto entfernt");
      return;
    case "bericht-oeffnen":
      zeichneBericht();
      zeigeAnsicht("bericht");
      return window.scrollTo(0, 0);
    case "bericht-drucken":
      return window.print();
    case "export":
      return exportieren();
    case "willkommen-weiter":
      return willkommenSchliessen();
    case "willkommen-geschichte":
      willkommenSchliessen();
      zeigeAnsicht("mehr");
      return $("geschichte").scrollIntoView();
  }
});

zeichneAlles();
zeichneHeute(true);
zeigeSpeicherStatus();
if (!demo && !willkommenGesehen()) willkommenZeigen();
