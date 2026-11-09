import {
  laden,
  speichern as speichernInSpeicher,
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
  MCS,
  istErsterStart,
  ersteDaten,
  waegungAendern,
  analyseGueltig,
  befundText,
  bcsGueltig,
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
  gesternWenigGefressen,
  abendHinweis,
  ABEND_STUNDE,
  armGewicht,
  restAbziehen,
  prozentInGramm,
  menschVergleich,
  kcalKasten,
  rechnerPruefen,
  kcalPruefen,
  RECHNER_FELDER,
  FEUCHTE_TROCKEN_ANNAHME,
} from "./js/rechnen.js";
import { zeichneVerlauf, naechsterZeitleistenEintrag } from "./js/verlauf.js";
import { BESONDERE_ARTEN, artVon, eintraegeAm, zeitraumText, eintragAusFormular, beenden, notfallJetzt, speicherMeldung } from "./js/besondere-tage.js";
import { berichtDaten, berichtHtml } from "./js/bericht.js";
import {
  FUTTERLISTE,
  sucheFutter,
  ausListe,
  normalesFutterKcal,
  eanAusEingabe,
  findeNachEan,
  listenGruppen,
  LISTEN_GRUPPEN,
} from "./js/futterliste.js";
import { kameraScanMoeglich, starteScanner } from "./js/scanner.js";
import { leckerliKachel, monatsGruppen, tempoRueckmeldung, gefuettertWerte, gefuettertMehr, messungWerte } from "./js/zusammenfassung.js";
import { gefuettertHtml, gefuettertMehrHtml, messungHtml } from "./js/heute-grafiken.js";
import { SYMBOL } from "./js/symbole.js";
import { leseAnzeige, merkeAnzeige, aufgeloest } from "./js/anzeige.js";
import { aufklappKarte, merkeZustand, zustandVon, zustandVergessen, aufklappenAnmelden } from "./js/aufklappen.js";
import { begriffeHtml, hinweisKnopf, kcalSpanne } from "./js/wissen.js";
import { auswahlFeld, auswahlAnmelden } from "./js/auswahl.js";
import { alterText, telefonLink, telefonGueltig, istWiegetag, wiegetagAusAuswahl, WOCHENTAGE, HALTUNG, kartenLink, praxisVorschlag } from "./js/profil.js";
import { aktivesTier, leseAktivesTier, merkeAktivesTier, vergissDemoTier, neuesTier, eintraegeVon, tierEntfernen } from "./js/tiere.js";
import { wischenAnmelden } from "./js/wischen.js";
import { datumText, freigabeTafel } from "./js/mehr.js";
import {
  freigabeAendern,
  fruehereFreigaben,
  freigabeKurz,
  loeschFrage,
  ersetzenFrage,
  speicherPlan,
  HINWEIS_AENDERN,
  TEXT_GLEICHER_TAG_NICHT_GESPEICHERT,
  TEXT_DATUM_PRUEFEN,
  TEXT_DATUM_KORRIGIEREN,
  TEXT_ZIEL_PRUEFEN,
} from "./js/freigaben.js";
import { fotoImZeitraum, fotoAngebot, fotoFeld, istFotoTag, vorherNachher, nachEntfernen } from "./js/fotos.js";
import { belegteZeichen, speicherAnzeige } from "./js/speicher.js";
import { sicherungPruefen, einleseFrage } from "./js/sicherung.js";
import { frage, bestaetigt } from "./js/rueckfrage.js";
import { uhrzeitVorbelegung, tagAusKalender } from "./js/nachtragen.js";
import { zuruecktaste } from "./js/zurueck.js";

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

const TYP_NAMEN = { nass: "Nassfutter", trocken: "Trockenfutter", frischfleisch: "Frischfleisch / BARF", leckerli: "Leckerli" };
const TYP_SYMBOL = { nass: SYMBOL.nass, trocken: SYMBOL.trocken, frischfleisch: SYMBOL.frischfleisch, leckerli: SYMBOL.leckerli };
const QUELLE_NAMEN = { packung: "Packung", hersteller: "Hersteller", ungefaehr: "ungefähr", geschaetzt: "geschätzt" };

// Kurztitel für Hinweise (Art "hinweis"): zugeklappt steht nur diese Zeile, der volle Text klappt auf.
// Warnungen der Art "sofort" und "achtung" sind nie zugeklappt.
const HINWEIS_TITEL = {
  "ueber-freigabe": "Mehr als freigegeben",
  diaetfutter: "Diätfutter mit der Tierarztpraxis besprechen",
  stillstand: "Abnahme stockt",
  "ziel-erreicht": "Zielgewicht erreicht",
  "freigabe-alt": "Freigabe ist älter als 3 Monate",
  "abend-nichts-eingetragen": "Heute noch nichts eingetragen",
};

// ---------- Darstellung Hell / Dunkel / Wie das Handy ----------

const handyDunkel = matchMedia("(prefers-color-scheme: dark)");
function wendeAnzeigeAn(wahl) {
  const thema = aufgeloest(wahl, handyDunkel.matches);
  document.documentElement.dataset.theme = thema;
  $("theme-farbe").content = thema === "dunkel" ? "#131b1a" : "#f3f5f2";
}
handyDunkel.addEventListener("change", () => {
  if (leseAnzeige() === "handy") wendeAnzeigeAn("handy");
});
wendeAnzeigeAn(leseAnzeige());

// Demo-Modus (Link mit "?demo"): lädt bei jedem Öffnen frisch die Simulation von Kito und Zuki aus werkzeuge/erzeuge-testdaten.js,
// verschoben auf heute, in einen eigenen Speicherplatz. Die echten Einträge bleiben unberührt.
const demo = new URLSearchParams(location.search).has("demo");
// „Demo ansehen“ unter „Mehr“ (seit 0.56.0): öffnet die Demo aus der installierten App, weil ein Startbildschirm-Symbol
// immer die start_url aus manifest.webmanifest nimmt und "?demo" verliert. In der Demo selbst ist der Eintrag unnötig.
$("demo-oeffnen").hidden = demo;

// Erster Start (noch nichts gespeichert): Willkommen und Einrichtung, siehe unten. Bis dahin darf nichts gespeichert
// werden, sonst stünde der Platzhalter „Deine Katze“ im Speicher. Alle Schreibwege laufen über speichern().
let einrichtungLaeuft = false;
function speichern(neueDaten) {
  if (einrichtungLaeuft) throw new Error("Während der Einrichtung wird nichts gespeichert.");
  speichernInSpeicher(neueDaten);
}
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
    // Die Demo hat zwei Katzen (seit 0.47.0) und startet wie ihre Daten jedes Mal frisch: mit Kito (erstes Tier),
    // auch wenn beim letzten Mal zu Zuki gewechselt wurde.
    merkeAktivesTier(simulation.tiere[0].id, true);
  } catch (fehler) {
    console.error("Demo-Daten konnten nicht geladen werden:", fehler);
  }
} else {
  // Die Demo lädt bei jedem Öffnen frisch; ihr alter Stand würde sonst dauerhaft Speicher belegen (Speicheranzeige).
  try {
    localStorage.removeItem("kilossos-demo");
  } catch {
    // Speicher gesperrt: nichts zu tun.
  }
  vergissDemoTier();
}

let daten;
try {
  einrichtungLaeuft = !demo && istErsterStart();
  daten = laden();
} catch (fehler) {
  zeigeLadeFehler(fehler);
  throw fehler;
}

// Gespeicherte Daten unlesbar (z. B. beschädigt oder aus einer neueren Fassung): Ausweg statt Sackgasse.
// Läuft, bevor der Rest der App eingerichtet ist, deshalb mit eigenen Listenern. Reihenfolge der Knöpfe:
// erst retten (Rohdaten herunterladen), dann Sicherung einlesen oder neu anfangen.
function zeigeLadeFehler(fehler) {
  const schluessel = demo ? "kilossos-demo" : "kilossos-daten";
  let roh = null;
  let gesperrt = false;
  try {
    roh = localStorage.getItem(schluessel);
  } catch {
    gesperrt = true; // z. B. privater Modus oder Speicher in den Browser-Einstellungen blockiert
  }
  document.querySelector(".leiste").style.display = "none"; // ihre Knöpfe funktionieren hier nicht
  document.querySelector("main").innerHTML = `<section class="karte lade-fehler" aria-labelledby="lade-fehler-titel">
    <h2 id="lade-fehler-titel" tabindex="-1">Daten konnten nicht geladen werden</h2>
    ${
      gesperrt
        ? `<p>Dieser Browser erlaubt Kilossos gerade keinen Zugriff auf den Speicher (z. B. im privaten Modus oder durch eine Einstellung). Deine Daten sind dadurch nicht gelöscht. Öffne Kilossos normal, nicht privat, oder prüfe die Einstellungen des Browsers.</p>`
        : demo
          ? `<p>Die Demo-Daten konnten nicht geladen werden. Deine echten Einträge sind davon nicht betroffen.</p>`
          : `<p>Die gespeicherten Einträge auf diesem Gerät sind beschädigt oder stammen aus einer neueren Fassung von Kilossos.</p>
             <p>Lade die gespeicherten Daten zuerst herunter, damit nichts verloren geht. Danach kannst du eine Sicherung einlesen oder neu anfangen.</p>`
    }
    <p class="tipp">Technischer Hinweis: ${sicher(fehler.message)}</p>
    <div class="lade-fehler-knoepfe">
      <button type="button" class="knopf-haupt" data-notfall="herunterladen"${roh && !demo ? "" : " hidden"}>Gespeicherte Daten herunterladen</button>
      <button type="button" class="knopf-zweit" data-notfall="einlesen"${gesperrt || demo ? " hidden" : ""}>Sicherung einlesen</button>
      <button type="button" class="knopf-gefahr" data-notfall="loeschen"${gesperrt ? " hidden" : ""}>${demo ? "Demo neu starten" : "Alle Daten löschen und neu anfangen"}</button>
    </div>
    <input type="file" accept="application/json,.json" class="nur-vorlesen" id="notfall-datei" tabindex="-1" aria-hidden="true">
  </section>`;
  document.getElementById("lade-fehler-titel").focus();
  const karte = document.querySelector(".lade-fehler");
  karte.addEventListener("click", async (ereignis) => {
    const aktion = ereignis.target.closest("[data-notfall]")?.dataset.notfall;
    if (aktion === "herunterladen") {
      const link = document.createElement("a");
      link.href = URL.createObjectURL(new Blob([roh], { type: "application/json" }));
      link.download = `kilossos-gespeichert-${tagSchluessel(new Date())}.json`;
      link.click();
      URL.revokeObjectURL(link.href);
    } else if (aktion === "einlesen") {
      document.getElementById("notfall-datei").click();
    } else if (aktion === "loeschen") {
      try {
        // Demo: nur ihr eigener Speicherplatz, die echten Daten bleiben unberührt.
        if (demo) {
          localStorage.removeItem(schluessel);
          return location.reload();
        }
        const frage = roh
          ? "Wirklich ALLE Daten löschen und neu anfangen? Hast du die gespeicherten Daten vorher heruntergeladen?"
          : "Wirklich ALLE Daten löschen und neu anfangen?";
        if (!(await bestaetigt({ text: frage, ja: "Alles löschen", gefahr: true }))) return;
        if (!(await bestaetigt({ text: "Letzte Rückfrage: Das lässt sich nicht rückgängig machen.", ja: "Endgültig löschen", gefahr: true }))) return;
        for (const s of Object.keys(localStorage)) if (s.startsWith("kilossos-")) localStorage.removeItem(s);
      } catch {
        return alert("Der Speicher dieses Browsers ist gesperrt. Es wurde nichts gelöscht.");
      }
      location.reload();
    }
  });
  document.getElementById("notfall-datei").addEventListener("change", async (ereignis) => {
    const datei = ereignis.target.files[0];
    ereignis.target.value = "";
    if (!datei) return;
    let neu;
    try {
      neu = JSON.parse(await datei.text());
    } catch {
      return alert("Diese Datei ist keine Kilossos-Sicherung.");
    }
    const pruefung = sicherungPruefen(neu, tagSchluessel(new Date()));
    if (!pruefung) return alert("Diese Datei ist keine gültige Kilossos-Sicherung.");
    if (!(await bestaetigt({ text: einleseFrage(neu, pruefung, " Die unlesbaren Daten auf diesem Gerät werden dadurch ersetzt."), ja: "Einlesen", gefahr: true }))) return;
    try {
      speichernInSpeicher(neu);
    } catch {
      return alert("Die Sicherung passt nicht in den Speicher dieses Browsers. Es wurde nichts geändert.");
    }
    location.reload();
  });
}
// Alle Ansichten zeigen das aktive Tier; gewechselt wird oben auf „Heute“.
let tier = aktivesTier(daten, leseAktivesTier(demo));
let gewaehlterTag = new Date();
let zeitraum = "3m";

// Bleibt der Tab über Nacht offen (Opera), stünde „Heute“ sonst noch auf dem Vortag, und neue Mahlzeiten landeten dort.
// Beim Zurückkehren in den Tab nach einem Tageswechsel: auf den neuen Tag springen und neu zeichnen (seit 0.36.2).
// Ebenso, wenn seit dem letzten Zeichnen 19 Uhr vorbei ist: Dann erscheint der ruhige Abend-Hinweis (0.50.0).
let tagBeimZeichnen = tagSchluessel(new Date());
let abendBeimZeichnen = new Date().getHours() >= ABEND_STUNDE;
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState !== "visible") return;
  const jetzt = tagSchluessel(new Date());
  const abend = new Date().getHours() >= ABEND_STUNDE;
  if (jetzt === tagBeimZeichnen && abend === abendBeimZeichnen) return;
  // Ist ein Fenster offen (z. B. Mahlzeit um 23:50 angefangen), nicht springen: Die Eingabe gehört zum alten Tag.
  // Beim nächsten Zurückkehren ohne offenes Fenster wird nachgeholt.
  if (document.querySelector("dialog[open]")) return;
  if (tagSchluessel(gewaehlterTag) === tagBeimZeichnen) gewaehlterTag = new Date();
  tagBeimZeichnen = jetzt;
  abendBeimZeichnen = abend;
  zeichneAlles();
});
// Hat ein zweiter Tab mit Kilossos gespeichert: neu laden. Sonst überschriebe dieser Tab dessen Einträge beim nächsten
// Speichern, und „Alle Daten löschen“ im anderen Tab wäre wirkungslos (Sicherheits-Review 05.11.2026).
// Nicht in der Demo: Sie schreibt bei jedem Laden neu, zwei Demo-Tabs würden sich sonst endlos gegenseitig neu laden.
if (!demo) {
  window.addEventListener("storage", (e) => {
    if (e.key === null || e.key === "kilossos-daten") location.reload();
  });
}

// Speicher voll (z. B. durch viele Fotos): Änderung verwerfen, gespeicherten Stand neu laden und deutlich melden,
// statt sie nur im Arbeitsspeicher zu halten und beim nächsten Öffnen still zu verlieren.
let speicherFehler = false;
function sichern() {
  // Während der Einrichtung gibt es nur einen Platzhalter, der nie gespeichert werden darf.
  if (einrichtungLaeuft) return false;
  try {
    speichern(daten);
  } catch {
    speicherFehler = true;
    daten = laden();
    tier = aktivesTier(daten, tier.id);
    zeichneAlles();
    zeigeToast("Der Speicher ist voll: Die letzte Änderung wurde nicht gespeichert. Bitte speichere eine Sicherung.", 6000);
    return false;
  }
  zeichneAlles();
  return true;
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

// Offener Bereich, damit Aktualisieren dort bleibt (Handy-Test 04.11.2026). sessionStorage gilt nur für diesen Tab:
// Ein frischer Start der App beginnt wieder auf „Heute“. Den Bericht gibt es nur aus „Mehr“ heraus.
const ANSICHT_SCHLUESSEL = demo ? "kilossos-demo-ansicht" : "kilossos-ansicht";

function merkeAnsicht(name) {
  try {
    sessionStorage.setItem(ANSICHT_SCHLUESSEL, name === "bericht" ? "mehr" : name);
  } catch {
    // Speicher gesperrt: Nach dem Aktualisieren kommt dann eben „Heute“.
  }
}

function gemerkteAnsichtZeigen() {
  let name = null;
  try {
    name = sessionStorage.getItem(ANSICHT_SCHLUESSEL);
  } catch {
    return;
  }
  const erlaubt = [...document.querySelectorAll(".leiste button[data-ziel]")].map((knopf) => knopf.dataset.ziel);
  if (name && name !== "heute" && erlaubt.includes(name)) zeigeAnsicht(name);
}

// Zurücktaste des Handys (0.88.0, js/zurueck.js): Fenster in der Reihenfolge, in der sie aufgingen. Erklärseiten
// öffnen über anderen Fenstern (z. B. „Für den Alltag“ aus „Tipps“), die Reihenfolge im HTML hilft da nicht.
let offeneFenster = [];
const sichtbareAnsicht = () => document.querySelector(".ansicht:not([hidden])")?.dataset.ansicht ?? "heute";
const zurueck = zuruecktaste({
  verlauf: history,
  lesen: () => ({ ansicht: sichtbareAnsicht(), fenster: offeneFenster.length }),
  // Nach Zurück: oberste Fenster schließen wie „Abbrechen“ (Rückfrage zählt dann als „Nein“), dann die Ansicht.
  anwenden: (ziel) => {
    offeneFenster = offeneFenster.filter((dialog) => dialog.open);
    while (offeneFenster.length > ziel.fenster) offeneFenster.pop().close("abbrechen");
    if (offeneFenster.length || ziel.ansicht === sichtbareAnsicht()) return;
    if (ziel.ansicht === "bericht") zeichneBericht();
    zeigeAnsicht(ziel.ansicht);
  },
});
new MutationObserver((aenderungen) => {
  for (const { target } of aenderungen) {
    if (target.tagName !== "DIALOG") continue;
    offeneFenster = offeneFenster.filter((dialog) => dialog !== target);
    if (target.open) offeneFenster.push(target);
  }
  zurueck.abgleichen();
}).observe(document.body, { subtree: true, attributes: true, attributeFilter: ["open"] });
window.addEventListener("popstate", (ereignis) => zurueck.beiPopstate(ereignis.state));

// richtung: 1/-1 nach einem Wischen, dann gleitet der Bereich von der Seite herein.
function zeigeAnsicht(name, richtung = 0) {
  merkeAnsicht(name);
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
  zurueck.abgleichen();
}

// Kalender am Tagestitel (0.70.0): gewählter Tag wird gezeigt; leer, kaputt oder Zukunft ändert nichts.
$("tag-kalender").addEventListener("change", () => {
  const tag = tagAusKalender($("tag-kalender").value, new Date());
  if (!tag) return;
  const jetzt = new Date();
  gewaehlterTag = tagSchluessel(tag) === tagSchluessel(jetzt) ? jetzt : tag; // heute wie beim Start: mit Uhrzeit
  zeichneHeute(true);
});

function tagTitel(datum) {
  const heute = tagSchluessel(new Date());
  const jetzt = new Date();
  const gestern = tagSchluessel(new Date(jetzt.getFullYear(), jetzt.getMonth(), jetzt.getDate() - 1)); // nicht −24 h: Zeitumstellung
  const schluessel = tagSchluessel(datum);
  if (schluessel === heute) return "Heute";
  if (schluessel === gestern) return "Gestern";
  return datum.toLocaleDateString("de-DE", { weekday: "short", day: "numeric", month: "long" });
}

// Profilbild (seit 0.74.0 Quadrat mit runden Ecken wie auf der Willkommensseite): "gross" füllt den Knopf auf „Heute“, "klein" steht im Kopf von „Verlauf“.
// Ohne eigenes Foto: ruhige Initiale auf Salbei (seit 0.23.0, vorher Zeichentrick-Katze).
function profilHtml(einTier, groesse) {
  const initiale = sicher((einTier.name?.trim()[0] ?? "?").toLocaleUpperCase("de-DE"));
  const bild = fotoGueltig(einTier.foto)
    ? `<img src="${sicher(einTier.foto)}" alt="">`
    : `<span class="initiale" aria-hidden="true">${initiale}</span>`;
  if (groesse === "klein") return `<span class="avatar">${bild}</span>`;
  // Kamera-Symbol nur als Hinweis ohne Foto (0.86.2): Auf einem Foto verdeckte es dessen Ecke.
  return fotoGueltig(einTier.foto) ? bild : `${bild}<span class="kamera" aria-hidden="true">${SYMBOL.kamera}</span>`;
}

// ---------- Heute ----------

let kcalZahl = 0;

// Zählt die große kcal-Zahl auf „Gefüttert“ hoch (bei „weniger Bewegung“ sofort).
// vonNull: beim Wechsel auf „Heute“ und beim Tageswechsel von 0 an, sonst vom alten Wert aus.
function zaehleKcal(kcal, vonNull) {
  if (vonNull) kcalZahl = 0;
  const start = performance.now();
  const von = kcalZahl;
  const dauer = ohneBewegung() ? 1 : 900;
  const zahlFeld = $("kcal-zahl");
  (function schritt(jetzt) {
    const p = Math.min(1, (jetzt - start) / dauer);
    const e = 1 - (1 - p) ** 3;
    zahlFeld.textContent = zahl(Math.round(von + (kcal - von) * e));
    if (p < 1) requestAnimationFrame(schritt);
  })(start);
  kcalZahl = kcal;
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
  $("kopf-gewicht").textContent = sortiert[0]
    ? `${zahl(sortiert[0].kg, 2)} kg` + (freigabe ? `, Ziel ${zahl(freigabe.zielgewichtKg, 2)} kg` : art ? ` · ${art}` : "")
    : art;

  // Wiegetag: nur am heutigen Tag und nur, solange heute noch kein Gewicht eingetragen ist.
  const wiegen = tag === heute && istWiegetag(tier, heute) && !gewichte.some((g) => g.datum === heute);
  $("wiegetag-hinweis").hidden = !wiegen;
  if (wiegen)
    $("wiegetag-hinweis-text").textContent =
      `Heute ist Wiegetag für ${tier.name}. Am besten zur gewohnten Uhrzeit mit der gleichen Waage.` +
      (istFotoTag(heute, tier.wiegetag) ? " Heute ist auch Foto-Tag: Wenn du magst, mach das Monatsfoto." : "");
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
  // Auf „Heute“ zusätzlich gestern: Hat die Katze kaum etwas gefressen, steht das oben – nicht erst beim
  // Zurückblättern (Sicherheits-Review 05.11.2026).
  if (tag === heute) {
    const jetzt = new Date();
    const gestern = tagSchluessel(new Date(jetzt.getFullYear(), jetzt.getMonth(), jetzt.getDate() - 1));
    const eigene = daten.mahlzeiten.filter((m) => m.tierId === tier.id);
    const mahlzeitenGestern = mahlzeitenAm(eigene, gestern);
    const warnungGestern = gesternWenigGefressen({
      name: tier.name,
      tag: gestern,
      heute,
      kcal: tagesSumme(mahlzeitenGestern, futter).kcal,
      leckerli: leckerliKcal(mahlzeitenGestern, futter),
      freigabe: freigabeVonTier(gestern),
      gewichte: gewichteBis(daten.gewichte.filter((g) => g.tierId === tier.id), gestern),
      fruehereMahlzeiten: eigene.some((m) => tagSchluessel(new Date(m.zeitpunkt)) < gestern),
    });
    if (warnungGestern) liste.unshift(warnungGestern);
    // Abends ruhig an einen leeren Tag erinnern (0.50.0), hinter allen Warnungen.
    const abend = abendHinweis({
      name: tier.name,
      tag,
      heute,
      stunde: jetzt.getHours(),
      // Ein Leckerli allein ist noch keine Mahlzeit (Prüfer-Fund 0.50.0).
      mahlzeitenHeute: mahlzeiten.filter((m) => futter.get(m.futterId)?.typ !== "leckerli").length,
      fruehereMahlzeiten: eigene.some((m) => tagSchluessel(new Date(m.zeitpunkt)) < heute),
      futterVerweigert: notfallJetzt(daten.besondereTage, tier.id, heute),
    });
    if (abend) liste.push(abend);
  }
  $("warnungen-liste").innerHTML = liste
    .map((w) =>
      w.art === "hinweis"
        ? `<li>${aufklappKarte({
            id: "hinweis-" + w.id,
            klasse: "hinweis",
            kopf: `<span class="punkt" aria-hidden="true">i</span><span class="zusammen">${sicher(HINWEIS_TITEL[w.id] ?? "Hinweis")}</span>`,
            inhalt: `<p>${sicher(w.text)}</p>${hinweisKnopf(w.id)}${w.quelle ? `<span class="quelle">Quelle: ${sicher(w.quelle)}</span>` : ""}`,
          })}</li>`
        : `<li class="warnung warnung-${w.art}">${sicher(w.text)}<span class="quelle">Quelle: ${sicher(w.quelle)}</span></li>`
    )
    .join("");

  // Gefüttert (ab 0.38.0): Mahlzeiten als Stücke im Balken; ohne Freigabe kein Ziel und kein Balken.
  const gefuettert = gefuettertWerte({ mahlzeiten, futterNachId: futter, freigabe, tag, heute });
  const ca = gefuettert.unsicher ? "ca. " : "";
  $("kcal-titel").textContent = tag === heute ? "Heute gefüttert" : "Gefüttert";
  zaehleKcal(Math.round(gefuettert.kcal), vonNull);
  $("kcal-von").textContent = gefuettert.ziel
    ? `${ca}von ${zahl(gefuettert.ziel.soll)} kcal laut Freigabe`
    : `${ca}kcal · ${zahl(gefuettert.gramm)} g Futter`;
  // Darunter „Mehr zur Fütterung“ (0.44.0): aufklappbar, nur mit mindestens einer Mahlzeit; die ca.-Zeile bleibt darunter.
  // Seit 0.78.0 stehen dort auch die Leckerlis (vorher eigene Karte unter „Letzte Messung“), gleiche Basis wie die
  // Leckerli-Warnung in warnungen().
  $("kcal-text").innerHTML =
    gefuettertHtml(gefuettert) +
    gefuettertMehrHtml(
      gefuettertMehr({ mahlzeiten, futterNachId: futter, freigabe, tag, heute }),
      leckerliKachel({ tag, heute, kcal: summe.kcal, leckerli, freigabe, warnungAktiv: liste.some((w) => w.id === "leckerli") })
    );
  $("summe-hinweis").hidden = !gefuettert.unsicher;

  // Mahlzeiten als Protokoll: Uhrzeit, Futter, Gramm und kcal. Antippen ändert, Kreuz löscht.
  if (mahlzeiten.length === 0) {
    $("heute-mahlzeiten").innerHTML = '<p class="leer">Noch keine Mahlzeit an diesem Tag.</p>';
  } else {
    const uhr = (m) => new Date(m.zeitpunkt).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
    const zeilen = mahlzeiten
      .map((m) => {
        const f = futter.get(m.futterId);
        const kcal = f ? `${zahl(kcalFuer(m.gramm, f.kcalPro100g))} kcal` : "kcal unbekannt";
        // Die Zeile selbst ist ein Knopf (Tastatur, Vorlesefunktion); Löschen bleibt ein eigener Knopf daneben.
        return `<li><button type="button" class="protokoll-knopf tippbar" data-aktion="mahlzeit-bearbeiten" data-id="${sicher(m.id)}">
          <span class="zeit">${uhr(m)}</span>
          <span class="was">${sicher(f ? f.name : "Gelöschte Sorte")}<small>${f ? TYP_NAMEN[f.typ] : "Sorte fehlt"}</small></span>
          <span class="wert">${zahl(m.gramm)} g<small>${kcal}</small></span><span class="nur-vorlesen">, ändern</span></button>
          <button type="button" class="knopf-loeschen" data-aktion="mahlzeit-loeschen" data-id="${sicher(m.id)}" aria-label="Mahlzeit um ${uhr(m)}, ${sicher(f ? f.name : "Gelöschte Sorte")}, löschen">${SYMBOL.loeschen}</button></li>`;
      })
      .join("");
    $("heute-mahlzeiten").innerHTML = `<ul class="protokoll">${zeilen}</ul>`;
  }

  // Letzte Messung (ab 0.39.0): Gewicht, Gramm seit der Messung davor, Kurve der letzten 8 Wochen, Tempo-Skala.
  // Alles bis zum gewählten Tag (gewichte ist schon bis „tag“ gefiltert, Freigaben ebenso).
  // Ist oben die Warnung „zu schnell“ (Mittel über 2 Wochen) aktiv, folgt die Karte ihr (seit 0.40.1).
  const messung = messungWerte({
    gewichte,
    freigaben: daten.freigaben.filter((f) => f.tierId === tier.id && f.datum <= tag),
    tag,
    mittelZuSchnell: liste.some((w) => w.id === "zu-schnell"),
  });
  $("heute-gewicht").innerHTML = messungHtml(messung);

  zeichneBesondereTage(tag, heute);
}

// ---------- Besonderer Tag (0.33.0, .planning/besonderer-tag.md) ----------
// Karte unter „Mahlzeiten“: Einträge, die den gezeigten Tag betreffen (auch laufende Phasen). Antippen ändert, Kreuz
// löscht, eine laufende Phase lässt sich mit einem Tipp beenden. Dazu der rote Notfall-Kasten bei „Futter verweigert“.
function zeichneBesondereTage(tag, heute) {
  // Hängt am echten Datum, nicht am gezeigten Tag: Es geht um die Katze jetzt.
  $("notfall-kasten").hidden = !notfallJetzt(daten.besondereTage, tier.id, heute);
  const liste = eintraegeAm(daten.besondereTage, tier.id, tag);
  if (liste.length === 0) {
    $("heute-besonders").innerHTML =
      '<p class="tipp">Draußen gewesen, genascht, krank? Hier festhalten, damit du und die Tierarztpraxis später seht, warum sich das Gewicht so bewegt.</p>';
    return;
  }
  const zeilen = liste
    .map((e) => {
      const art = artVon(e.art);
      const id = sicher(e.id);
      const wann = zeitraumText(e);
      const notiz = e.notiz ? `<small class="notiz">${sicher(e.notiz)}</small>` : "";
      const ende =
        e.bis === null
          ? `<button type="button" class="knopf-zweit knopf-beenden" data-aktion="besonders-beenden" data-id="${id}" aria-label="${sicher(art.text)} seit ${sicher(wann.replace(/^seit /, ""))}: ${sicher(art.ende ?? "Beendet")}">${sicher(art.ende ?? "Beendet")}</button>`
          : "";
      return `<li><button type="button" class="protokoll-knopf tippbar" data-aktion="besonders-bearbeiten" data-id="${id}">
          <span class="was"><b>${sicher(art.text)}</b><small>${sicher(wann)}</small>${notiz}</span><span class="nur-vorlesen">, ändern</span></button>
          <button type="button" class="knopf-loeschen" data-aktion="besonders-loeschen" data-id="${id}" aria-label="${sicher(art.text)}, ${sicher(wann)}, löschen">${SYMBOL.loeschen}</button>${ende}</li>`;
    })
    .join("");
  $("heute-besonders").innerHTML = `<ul class="protokoll besonders-liste">${zeilen}</ul>`;
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
          const bild = fotoGueltig(g.foto)
            ? `<button type="button" class="waegung-foto-knopf" data-aktion="waegung-foto-ansehen" data-id="${sicher(g.id)}" aria-label="Foto vom ${datumText(g.datum)} ansehen"><img class="waegung-foto" src="${sicher(g.foto)}" alt=""></button>`
            : "";
          // Gewicht, Datum, Notiz und Marke sind ein Knopf „ändern“ (seit 0.31.0); Foto und Kreuz bleiben eigene Knöpfe daneben.
          return `<div class="zeile">${bild}<button type="button" class="waegung-knopf tippbar" data-aktion="gewicht-bearbeiten" data-id="${sicher(g.id)}">
            <span class="name"><b>${zahl(g.kg, 2)} kg</b><small>${datumText(g.datum)}${g.notiz ? " · " + sicher(g.notiz) : ""}</small></span>
            ${marke}<span class="nur-vorlesen">, ändern</span></button>
            <button type="button" class="knopf-loeschen" data-aktion="gewicht-loeschen" data-id="${sicher(g.id)}" aria-label="Gewicht vom ${datumText(g.datum)} löschen">${SYMBOL.loeschen}</button></div>`;
        })
        .join("");
      const anzahl = monat.eintraege.length === 1 ? "einmal gewogen" : `${monat.eintraege.length}-mal gewogen`;
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
  return `<button type="button" class="zeile zeile-knopf tippbar" data-aktion="futter-bearbeiten" data-id="${sicher(f.id)}">
    <span class="icon" aria-hidden="true">${TYP_SYMBOL[f.typ]}</span>
    <span class="name">${sicher(f.name)}<small>${TYP_NAMEN[f.typ]} · ${zahl(f.kcalPro100g, f.kcalPro100g % 1 ? 1 : 0)} kcal/100 g</small></span>
    <span class="marke marke-${sicher(f.kcalQuelle)}">${QUELLE_NAMEN[f.kcalQuelle]}</span><span class="nur-vorlesen">, ändern</span>
  </button>`;
}

function zeichneFutter() {
  const offen = daten.futter.length <= 5;
  $("futter-gruppen").innerHTML =
    ["nass", "trocken", "frischfleisch", "leckerli"]
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


function freigabeVonTier(stichtag) {
  return aktuelleFreigabe(daten.freigaben.filter((f) => f.tierId === tier.id), stichtag);
}

function eigeneFreigaben() {
  return daten.freigaben.filter((f) => f.tierId === tier.id);
}

// Tafel mit der geltenden Freigabe; antippen = ändern (seit 0.34.0). Ein Knopf darf nur span enthalten,
// deshalb Eckdaten und Zeile als span (Aussehen wie vorher, siehe styles.css „Freigabe-Tafel“).
// Seit 0.35.1 steht sichtbar „Korrigieren oder löschen“ darauf (Stefan hatte das Antippen nicht entdeckt);
// „Korrigieren“, weil Ändern nur für Fehler ist, ein neuer Plan kommt über „Freigabe eintragen“ dazu.
// Darunter „Frühere Freigaben (n)“: jede Zeile ein Knopf mit kleinem Stift, auch ältere sollen korrigierbar sein.
function zeichneFreigabe() {
  const freigabe = freigabeVonTier();
  $("titel-tierarzt").textContent = daten.tiere.length > 1 ? `Tierarztpraxis · ${tier.name}` : "Tierarztpraxis";
  const tafel = freigabeTafel(freigabe);
  $("freigabe-tafel").innerHTML = tafel
    ? `<button type="button" class="freigabe-knopf tippbar" data-aktion="freigabe-bearbeiten" data-id="${sicher(freigabe.id)}">
        <span class="eckdaten">${tafel.felder
          .map((f) => `<span><span class="label">${sicher(f.titel)}</span><strong>${sicher(f.wert)}</strong></span>`)
          .join("")}</span>
        <span class="leise">${[tafel.zeile, tafel.befund, tafel.notiz].filter(Boolean).map(sicher).join(" · ")}</span>
        <span class="freigabe-hinweis">${SYMBOL.stift}Korrigieren oder löschen</span></button>`
    : '<p class="leise">Noch keine Freigabe eingetragen.</p>';
  const frueher = fruehereFreigaben(eigeneFreigaben());
  $("freigaben-frueher").innerHTML = frueher.length
    ? aufklappKarte({
        id: "freigaben-frueher",
        klasse: "tag-klapp",
        kopf: `<span class="zusammen">Frühere Freigaben (${frueher.length})</span>`,
        inhalt: frueher
          .map((f) => {
            const unten = [f.tierarzt, freigabeKurz(f), befundText(f)].filter(Boolean).map(sicher).join(" · ");
            return `<div class="zeile"><button type="button" class="waegung-knopf freigabe-zeile tippbar" data-aktion="freigabe-bearbeiten" data-id="${sicher(f.id)}">
              <span class="name"><b>${sicher(datumText(f.datum))}</b><small>${unten}</small></span>
              <span class="stift" aria-hidden="true">${SYMBOL.stift}</span><span class="nur-vorlesen">, korrigieren oder löschen</span></button></div>`;
          })
          .join(""),
      })
    : "";
  const link = telefonLink(tier.tierarzt?.telefon);
  const karte = kartenLink(tier.tierarzt?.praxis, tier.tierarzt?.adresse);
  $("praxis-anrufen").hidden = !link;
  $("praxis-weg").hidden = !karte;
  // Die Liste unter „Tierarztpraxis“ enthält nur „Praxis anrufen“ und „Weg zur Praxis“: ohne beides kein leerer Kasten
  // (0.45.0, seit 0.49.0 auch mit Adresse allein sichtbar).
  $("tierarzt-liste").hidden = !link && !karte;
  if (link) {
    $("praxis-anrufen").href = link;
    $("praxis-anrufen").innerHTML = `<span data-symbol="telefon">${SYMBOL.telefon}</span>` +
      `<span class="text">${sicher(tier.tierarzt.praxis ?? "Praxis")} anrufen</span>` +
      `<span class="weiter" data-symbol="weiter">${SYMBOL.weiter}</span>`;
  }
  // „Weg zur Praxis“ (0.49.0): öffnet Google Maps in einem neuen Tab, erst beim Antippen gehen Name und Adresse an Google.
  if (karte) {
    $("praxis-weg").href = karte;
    $("praxis-weg").innerHTML = `<span data-symbol="ort">${SYMBOL.ort}</span>` +
      `<span class="text">Weg zur Praxis<small>öffnet Google Maps</small></span>` +
      `<span class="weiter" data-symbol="weiter">${SYMBOL.weiter}</span>`;
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

// „Mehr“ → Tiere: ein Eintrag je Tier, Antippen öffnet sein Profil.
function zeichneTiere() {
  const mehrere = daten.tiere.length > 1;
  $("tiere-liste").innerHTML = daten.tiere
    .map((t) => {
      const zusammen = profilZusammenfassung(t);
      const fehlt = !t.geburtsdatum && !t.tierarzt && !t.koerperbau;
      const aktiv = mehrere && t === tier ? '<small class="aktiv-marke">wird gerade angezeigt</small>' : "";
      return `<button type="button" class="eintrag eintrag-tier" data-aktion="profil-oeffnen" data-id="${sicher(t.id)}" aria-label="Profil von ${sicher(t.name)} bearbeiten">
        ${profilHtml(t, "klein")}
        <span class="text"><b>${sicher(t.name)}</b>
          <small>${sicher(zusammen || "Profil")}</small>
          ${fehlt ? "<small>Profil ergänzen: Alter, Körperbau, Tierarztpraxis</small>" : ""}${aktiv}</span>
        <span class="weiter" aria-hidden="true">${SYMBOL.weiter}</span></button>`;
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
      (t) => `<li role="none"><button type="button" role="menuitem" data-aktion="tier-waehlen" data-id="${sicher(t.id)}">
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
// Foto im Profil (0.41.0): erst beim Speichern übernommen, Abbrechen verwirft es. null = kein Foto.
let profilFoto = null;
let profilFotoLauf = 0; // wie fotoLauf: ein spät fertiges Bild landet nicht im falschen Fenster

function zeigeProfilFoto() {
  const initiale = sicher(($("form-profil").name.value.trim()[0] ?? "?").toLocaleUpperCase("de-DE"));
  $("profil-avatar").innerHTML = profilFoto
    ? `<img src="${sicher(profilFoto)}" alt="">`
    : `<span class="initiale" aria-hidden="true">${initiale}</span>`;
  $("profil-foto-knopf").textContent = profilFoto ? "Anderes Foto" : "Foto wählen";
  $("profil-foto-entfernen").hidden = !profilFoto;
}

$("form-profil").name.addEventListener("input", () => {
  if (!profilFoto) zeigeProfilFoto();
});

$("profil-foto-datei").addEventListener("change", async (ereignis) => {
  const datei = ereignis.target.files[0];
  ereignis.target.value = "";
  if (!datei) return;
  const lauf = ++profilFotoLauf;
  try {
    const foto = await fotoZuschneiden(datei);
    if (lauf !== profilFotoLauf) return;
    profilFoto = foto;
    zeigeFehler("profil-fehler", "");
  } catch {
    if (lauf !== profilFotoLauf) return;
    zeigeFehler("profil-fehler", "Dieses Bild lässt sich nicht öffnen. Bitte ein anderes Foto wählen.");
  }
  zeigeProfilFoto();
});

function oeffneProfil(einTier) {
  bearbeitetesTier = einTier;
  const p = einTier ?? {};
  const form = $("form-profil");
  form.reset();
  zeigeFehler("profil-fehler", "");
  profilFoto = fotoGueltig(p.foto) ? p.foto : null;
  profilFotoLauf += 1;
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
  // Wiegetag (0.85.0) nur beim Anlegen eines weiteren Tiers; ändern lässt er sich danach unter „Gewicht“.
  $("profil-wiegetag-bereich").hidden = Boolean(einTier);
  $("profil-wiegetag").innerHTML = auswahlFeld({
    name: "profil-wiegetag",
    beschriftung: "label-profil-wiegetag",
    // Montag zuerst, wie im deutschen Kalender
    optionen: [{ wert: "", text: "Kein fester Tag" }, ...[1, 2, 3, 4, 5, 6, 0].map((t) => ({ wert: String(t), text: WOCHENTAGE[t] }))],
    wert: "",
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
  // Neues Tier (0.49.0): Praxis, Telefon und Adresse vom gerade gewählten Tier vorschlagen, frei änderbar.
  // Beim Bearbeiten eines vorhandenen Tiers wird nichts übernommen.
  const vorschlag = einTier ? null : praxisVorschlag(tier);
  const praxisDaten = einTier ? p.tierarzt : vorschlag;
  form.praxis.value = praxisDaten?.praxis ?? "";
  form.telefon.value = praxisDaten?.telefon ?? "";
  form.adresse.value = praxisDaten?.adresse ?? "";
  $("profil-praxis-hinweis").hidden = !vorschlag;
  $("profil-praxis-hinweis").textContent = vorschlag ? `Von ${tier.name} übernommen. Bei einer anderen Praxis einfach ändern.` : "";
  zeigeProfilFoto();
  $("dialog-profil").showModal();
}

beimSpeichern("form-profil", "profil-fehler", (werte) => {
  const name = werte.get("name").trim();
  const geburtsdatum = werte.get("geburtsdatum");
  const schlankText = werte.get("schlank").trim();
  const schlank = schlankText ? leseZahl(schlankText) : null;
  const praxis = werte.get("praxis").trim();
  const telefon = werte.get("telefon").trim();
  const adresse = werte.get("adresse").trim();
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
  if (!bearbeitetesTier) setze("wiegetag", wiegetagAusAuswahl(werte.get("profil-wiegetag")));
  const tierarzt = { ...(praxis && { praxis }), ...(telefon && { telefon }), ...(adresse && { adresse }) };
  setze("tierarzt", Object.keys(tierarzt).length ? tierarzt : null);
  const fotoNeu = bearbeitetesTier ? profilFoto !== (fotoGueltig(bearbeitetesTier.foto) ? bearbeitetesTier.foto : null) : Boolean(profilFoto);
  setze("foto", profilFoto);
  const zuVoll = fotoNeu && profilFoto
    ? "Das Foto passt nicht mehr in den Speicher. Entferne das Foto und speichere ohne Foto."
    : "Der Speicher ist voll, nichts wurde gespeichert. Bitte speichere zuerst eine Sicherung.";
  if (bearbeitetesTier) {
    if (!fotoNeu) return sichern();
    // Neues Foto: Passt es nicht in den Speicher, bleibt das Fenster offen (wie beim Gewicht mit Foto).
    try {
      speichern(daten);
    } catch {
      const id = bearbeitetesTier.id;
      daten = laden();
      tier = aktivesTier(daten, tier.id);
      bearbeitetesTier = daten.tiere.find((t) => t.id === id) ?? null;
      zeichneAlles();
      if (profilFoto) {
        // Das bisherige Foto wieder einstellen, sonst ginge es beim nächsten „Foto entfernen“ mit verloren.
        profilFoto = fotoGueltig(bearbeitetesTier?.foto) ? bearbeitetesTier.foto : null;
        zeigeProfilFoto();
        return "Das neue Foto passt nicht mehr in den Speicher. Es ist wieder das bisherige Foto eingestellt. Speichere noch einmal, dann bleiben die übrigen Angaben erhalten.";
      }
      return zuVoll;
    }
    return void zeichneAlles();
  }
  // Ein neues Tier wird gleich angezeigt, damit die ersten Einträge nicht beim alten Tier landen.
  daten.tiere.push(ziel);
  try {
    speichern(daten);
  } catch {
    daten.tiere.pop();
    return zuVoll;
  }
  wechsleTier(ziel.id);
});

// Entfernen mit Rückfrage: löscht das Tier mit allen Mahlzeiten, Gewichten, Freigaben und besonderen Tagen. Das letzte Tier bleibt.
$("form-profil").addEventListener("submit", async (ereignis) => {
  if (ereignis.submitter?.value !== "entfernen" || !bearbeitetesTier) return;
  ereignis.preventDefault(); // geschlossen wird erst nach dem Ja (eigene Rückfrage, 0.52.0)
  const entfernt = bearbeitetesTier;
  const anzahl = eintraegeVon(daten, bearbeitetesTier.id);
  const teile = [
    [anzahl.mahlzeiten, "Mahlzeit", "Mahlzeiten"],
    [anzahl.gewichte, "Gewicht", "Gewichte"],
    [anzahl.freigaben, "Freigabe", "Freigaben"],
    [anzahl.besondereTage, "besonderer Tag", "besondere Tage"],
  ]
    .filter(([n]) => n > 0)
    .map(([n, eins, mehr]) => `${n} ${n === 1 ? eins : mehr}`);
  // Genau ein Eintrag insgesamt: „wird“ statt „werden“ („Dabei wird auch 1 besonderer Tag … gelöscht“).
  const verb = teile.length === 1 && teile[0].startsWith("1 ") ? "wird" : "werden";
  const eintraege = teile.length
    ? ` Dabei ${verb} auch ${teile.length > 1 ? `${teile.slice(0, -1).join(", ")} und ${teile.at(-1)}` : teile[0]} von ${bearbeitetesTier.name} gelöscht. Das lässt sich nicht rückgängig machen.`
    : "";
  const frage = `${bearbeitetesTier.name} wirklich entfernen?${eintraege} Die Futtersorten bleiben.`;
  if (!(await bestaetigt({ text: frage, ja: "Entfernen", gefahr: true }))) return;
  // Fenster inzwischen zu oder anderes Tier. Der Merker wird beim Schließen nicht geleert, daher auch „open“ prüfen.
  if (!$("dialog-profil").open || bearbeitetesTier !== entfernt) return;
  const name = entfernt.name;
  if (!tierEntfernen(daten, entfernt.id)) {
    return zeigeFehler("profil-fehler", "Das letzte Tier kann nicht entfernt werden.");
  }
  $("dialog-profil").close("entfernen");
  tier = aktivesTier(daten, tier.id); // war es das angezeigte Tier, springt die Anzeige auf das erste
  if (!sichern()) return; // Speicher voll: sichern() lädt den alten Stand und meldet es
  wechsleTier(tier.id);
  zeigeToast(`${name} entfernt`);
});

function verlaufKopf() {
  const erste = gewichteSortiert(daten.gewichte.filter((g) => g.tierId === tier.id)).at(-1);
  const seit = erste ? ` · seit dem ${new Date(erste.datum + "T12:00").toLocaleDateString("de-DE")}` : "";
  return `<div class="verlauf-kopf">${profilHtml(tier, "klein")}<div><h2>Verlauf</h2><p>${sicher(tier.name)}${seit}</p></div></div>`;
}

// Vorher/Nachher: ältestes und neuestes Foto an Wägungen; fehlt eins, steht der gezeichnete Katzenkopf da.
// Seit 0.43.0 ist jedes Foto ein Knopf zum Foto-Fenster (ändern oder entfernen); die Plakette „Ändern“ ist nur Schmuck,
// Tippfläche ist das ganze Bild.
function vorherNachherKarte() {
  const { vorher, nachher } = vorherNachher(daten.gewichte, tier.id);
  // Ohne jedes Foto nur eine kurze Zeile statt zwei großer Platzhalter (0.59.0, Stefan 06.11.: in der Demo „ganz groß“).
  if (!vorher) return `<section class="karte vorher-nachher vn-leer" aria-label="Vorher und Nachher">
    <span class="label">Vorher / Nachher</span>
    <p class="tipp">Noch keine Fotos. Füge beim Wiegen ab und zu ein Foto hinzu, am besten immer aus der gleichen Richtung.</p>
  </section>`;
  const seite = (titel, w, leer) =>
    `<figure class="vn-seite">
      ${w ? `<button type="button" class="vn-bild" data-aktion="waegung-foto-ansehen" data-id="${sicher(w.id)}" aria-label="${titel}-Foto ändern oder entfernen"><img src="${sicher(w.foto)}" alt=""><span class="vn-plakette" aria-hidden="true">${SYMBOL.stift}Ändern</span></button>` : `<div class="vn-platzhalter" role="img" aria-label="${titel}: noch kein Foto">${SYMBOL.katzenkopf}<span>Noch kein Foto</span></div>`}
      <figcaption><span class="label">${titel}</span>${w ? `<b>${zahl(w.kg, 2)} kg</b><small>${datumText(w.datum)}</small>` : `<small>${leer}</small>`}</figcaption>
    </figure>`;
  const diff = vorher && nachher ? vorher.kg - nachher.kg : null;
  const satz =
    diff === null
      ? "Füge beim Wiegen ab und zu ein Foto hinzu, am besten immer aus der gleichen Richtung."
      : `${diff >= 0 ? "Abgenommen" : "Zugenommen"} zwischen den Fotos: ${zahl(Math.abs(diff), 2)} kg.`;
  return `<section class="karte vorher-nachher" aria-label="Vorher und Nachher">
    <span class="label">Vorher / Nachher</span>
    <div class="vn-paar">${seite("Vorher", vorher, "erstes Foto")}${seite("Nachher", nachher, "neuestes Foto")}</div>
    <p class="tipp">${satz}</p>
    ${vorher ? `<p class="tipp">Foto antippen, um es zu ändern oder zu entfernen.</p>` : ""}
  </section>`;
}

function zeichneVerlaufAnsicht() {
  $("verlauf-inhalt").innerHTML = zeichneVerlauf({
    gewichte: daten.gewichte.filter((g) => g.tierId === tier.id),
    mahlzeiten: daten.mahlzeiten.filter((m) => m.tierId === tier.id),
    freigaben: daten.freigaben.filter((f) => f.tierId === tier.id),
    besondereTage: daten.besondereTage.filter((b) => b.tierId === tier.id),
    futterNachId: futterNachId(daten),
    zeitraum,
    heute: tagSchluessel(new Date()),
    kopf: verlaufKopf(),
    fotos: vorherNachherKarte(),
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
  zeichneSpeicherBelegt();
}

// Füllstand unter „Mehr“ → „Daten“; ab 70 % mit Hinweis (Fotos sind der größte Teil).
function zeichneSpeicherBelegt() {
  const anzeige = speicherAnzeige(belegteZeichen(localStorage));
  $("speicher-belegt").hidden = !anzeige;
  if (!anzeige) return;
  $("speicher-belegt").className = `speicher-belegt mehr-hinweis ${anzeige.stufe}`;
  $("speicher-balken-wert").style.width = `${anzeige.prozent}%`;
  $("speicher-belegt-text").textContent = anzeige.text;
  $("speicher-belegt-hinweis").hidden = !anzeige.hinweis;
  $("speicher-belegt-hinweis").textContent = anzeige.hinweis;
}

function zeichneBericht() {
  const heute = tagSchluessel(new Date());
  const eigene = {
    gewichte: daten.gewichte.filter((g) => g.tierId === tier.id),
    mahlzeiten: daten.mahlzeiten.filter((m) => m.tierId === tier.id),
    freigaben: daten.freigaben.filter((f) => f.tierId === tier.id),
    besondereTage: daten.besondereTage.filter((b) => b.tierId === tier.id),
  };
  const auswahl = document.querySelector('[name="bericht-zeitraum"]').value;
  let von;
  if (auswahl === "alles") {
    const anfaenge = [
      ...eigene.gewichte.map((g) => g.datum),
      ...eigene.mahlzeiten.map((m) => tagSchluessel(new Date(m.zeitpunkt))),
      ...eigene.freigaben.map((f) => f.datum),
      ...eigene.besondereTage.map((b) => b.von),
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
    fotos: $("bericht-fotos").checked,
  });
}
// Schalter „Fotos zeigen“ in der geöffneten Übersicht (0.45.0): zeichnet sofort neu, Standard aus.
$("bericht-fotos").addEventListener("change", zeichneBericht);
// Zeitraum steht seit 0.64.0 ebenfalls in der geöffneten Übersicht und zeichnet sofort neu.
document.addEventListener("change", (ereignis) => {
  if (ereignis.target.name === "bericht-zeitraum") zeichneBericht();
});

// Infoblase der Gewichtskurve: Antippen oder Ziehen zeigt den nächsten Punkt mit Datum und kg.
function zeigeInfoblase(ereignis) {
  const leiste = ereignis.target.closest?.("svg.zeitleiste");
  if (leiste) return zeigeZeitleistenBlase(ereignis, leiste);
  const kurve = ereignis.target.closest?.("svg.kurve");
  const blase = $("infoblase");
  if (!kurve || !blase) return;
  blase.classList.remove("lang");
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
// Zeitleiste der besonderen Tage (0.33.0): Antippen zeigt Art, Zeitraum und Notiz des nächsten Eintrags in derselben Blase.
function zeigeZeitleistenBlase(ereignis, leiste) {
  const blase = $("infoblase");
  if (!blase) return;
  document.querySelectorAll(".kurve .hilfslinie, .kurve .punkt.aktiv").forEach((el) => el.setAttribute("visibility", "hidden"));
  const flaeche = leiste.getBoundingClientRect();
  const feld = leiste.parentElement.getBoundingClientRect(); // .kurve-feld: Bezug für die Lage der Blase
  const breite = leiste.viewBox.baseVal.width;
  const hoehe = leiste.viewBox.baseVal.height;
  const x = ((ereignis.clientX - flaeche.left) * breite) / flaeche.width;
  const y = ((ereignis.clientY - flaeche.top) * hoehe) / flaeche.height;
  const [x1, x2, ey, text] = naechsterZeitleistenEintrag(JSON.parse(leiste.dataset.eintraege), x, y);
  blase.classList.add("lang");
  blase.textContent = text;
  blase.hidden = false;
  const links = (Math.min(Math.max(x, x1), x2) * flaeche.width) / breite + (flaeche.left - feld.left);
  blase.style.left = `${Math.min(Math.max(links, blase.offsetWidth / 2), feld.width - blase.offsetWidth / 2)}px`;
  blase.style.top = `${flaeche.top - feld.top + (ey * flaeche.height) / hoehe}px`;
}
// Maus: Die Blase verschwindet, wenn der Zeiger die Fläche verlässt. Finger (0.79.1): Der Browser meldet nach dem
// Loslassen ebenfalls „verlassen“, die Blase blieb also nur, solange der Finger exakt auf dem Punkt lag (Handy-Test
// 07.11.). Sie bleibt daher stehen, bis man woanders hintippt.
function versteckeInfoblase(ereignis) {
  if (ereignis?.type === "pointerleave" && ereignis.pointerType !== "mouse") return;
  const blase = $("infoblase");
  if (blase) blase.hidden = true;
  document.querySelectorAll(".kurve .hilfslinie, .kurve .punkt.aktiv").forEach((el) => el.setAttribute("visibility", "hidden"));
}
$("verlauf-inhalt").addEventListener("pointerdown", zeigeInfoblase);
$("verlauf-inhalt").addEventListener("pointermove", zeigeInfoblase);
$("verlauf-inhalt").addEventListener("pointerleave", versteckeInfoblase);
document.addEventListener("pointerdown", (ereignis) => {
  if (!ereignis.target.closest?.("svg.kurve, svg.zeitleiste")) versteckeInfoblase();
});

// ---------- Formulare (als Blätter von unten) ----------

aufklappenAnmelden(document);
auswahlAnmelden(document);

// Nach dem Schließen eines Blatts zurück zu dem Knopf, der es geöffnet hat. Wurde die Liste dahinter neu gezeichnet
// (z. B. nach dem Speichern einer Mahlzeit), ist der alte Knopf weg: dann den neuen mit gleicher Aktion und Kennung
// suchen. Sonst stünde der Fokus am Seitenanfang und die Vorlesefunktion finge oben wieder an.
let oeffner = null;
// Das Rückfrage-Blatt liegt über einem anderen Blatt oder der Liste und gibt den Fokus selbst zurück (js/rueckfrage.js).
for (const dialog of document.querySelectorAll("dialog:not(#dialog-rueckfrage)")) {
  dialog.addEventListener("close", () => {
    const merk = oeffner;
    requestAnimationFrame(() => {
      // Beim close-Ereignis steht der Fokus oft noch im (jetzt geschlossenen) Blatt, danach fällt er auf body.
      const fokus = document.activeElement;
      const verloren = !fokus || fokus === document.body || !fokus.isConnected || fokus.closest("dialog:not([open])");
      if (!merk?.aktion || !verloren) return;
      // checkVisibility: Knöpfe in zugeklappten Karten (visibility: hidden) zählen nicht als sichtbar (seit 0.41.0).
      const sichtbar = (el) => (el.checkVisibility ? el.checkVisibility({ visibilityProperty: true }) : el.getClientRects().length > 0);
      const passend = [...document.querySelectorAll(`[data-aktion="${CSS.escape(merk.aktion)}"]`)].filter(sichtbar);
      const knopf = passend.find((el) => el.dataset.id === merk.id) ?? passend[0];
      knopf?.focus({ preventScroll: true });
    });
  });
}

// Erklärseite „Begriffe kurz erklärt“: einmal beim Start einsetzen, die Begriffe ändern sich nicht.
{
  const ort = $("begriffe-liste");
  if (ort) ort.innerHTML = begriffeHtml();
}

// Jedes Blatt heißt wie seine Überschrift: Die Vorlesefunktion sagt dann beim Öffnen „Gewicht eintragen, Dialog“.
for (const dialog of document.querySelectorAll("dialog")) {
  const titel = dialog.querySelector("h2");
  if (!titel || dialog.hasAttribute("aria-labelledby") || dialog.hasAttribute("aria-label")) continue;
  titel.id ||= `${dialog.id}-titel`;
  dialog.setAttribute("aria-labelledby", titel.id);
}

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
// Seit 0.52.0 darf "pruefen" auf eine Rückfrage warten (async). Deshalb verhindert der Handler das Schließen immer
// und schließt das Blatt nach dem Speichern selbst. "laeuft": zweimal schnell getippt speichert nur einmal.
function beimSpeichern(formId, fehlerId, pruefenUndSpeichern) {
  let laeuft = false;
  $(formId).addEventListener("submit", async (ereignis) => {
    if (ereignis.submitter?.value !== "speichern") return;
    ereignis.preventDefault();
    if (laeuft) return;
    laeuft = true;
    try {
      speicherFehler = false;
      const werte = new FormData($(formId)); // vor dem Warten, wie beim Absenden
      // Rückgabe: Fehlertext (Dialog bleibt offen, "" ohne Meldung) oder { toast } für eine eigene Erfolgsmeldung.
      const ergebnis = await pruefenUndSpeichern(werte);
      if (typeof ergebnis === "string") return zeigeFehler(fehlerId, ergebnis);
      $(formId).closest("dialog").close("speichern");
      if (!speicherFehler) zeigeToast(ergebnis?.toast ?? "✓ Gespeichert", ergebnis?.dauer);
    } finally {
      laeuft = false;
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
    platzhalter: daten.futter.length ? "Bitte wählen" : "Noch keine Sorte gespeichert",
    extra: [
      { text: "Aus der Futterliste wählen", aktion: "liste-oeffnen" },
      { text: "Strichcode scannen", aktion: "scanner-oeffnen" },
    ],
  });
  const ohneSorte = daten.futter.length === 0;
  $("mahlzeit-futter-tipp").hidden = !ohneSorte;
  // Vorlesefunktion liest den Hinweis mit, solange es keine Sorte gibt.
  if (ohneSorte) $("mahlzeit-futter").querySelector(".auswahl-knopf")?.setAttribute("aria-describedby", "mahlzeit-futter-tipp");
}

// Ohne Mahlzeit: neu eintragen. Mit Mahlzeit: Sorte, Uhrzeit und Menge nachträglich ändern (der Tag bleibt).
let bearbeiteteMahlzeit = null;

// Tageswechsel nachholen, bevor eine neue Mahlzeit eingetragen wird (Prüfer-Fund 0.54.0): Blieb der Tab über
// Mitternacht sichtbar, stünde „Heute“ noch auf dem alten Tag, gespeichert würde dort, und das leere Uhrzeitfeld
// sagte „nachtragen“. Gleiche Regel wie beim Zurückkehren in den Tab (visibilitychange).
function tagwechselNachholen() {
  const jetzt = tagSchluessel(new Date());
  if (jetzt === tagBeimZeichnen) return;
  if (tagSchluessel(gewaehlterTag) === tagBeimZeichnen) gewaehlterTag = new Date();
  tagBeimZeichnen = jetzt;
  abendBeimZeichnen = new Date().getHours() >= ABEND_STUNDE;
  zeichneAlles();
}

function oeffneMahlzeit(mahlzeit = null) {
  if (!mahlzeit) tagwechselNachholen();
  bearbeiteteMahlzeit = mahlzeit;
  const form = $("form-mahlzeit");
  form.reset();
  zeigeFehler("mahlzeit-fehler", "");
  $("mahlzeit-titel").textContent = mahlzeit ? `Mahlzeit von ${tier.name} ändern` : `Mahlzeit für ${tier.name}`;
  // Neue Mahlzeit: keine Sorte vorgewählt, damit niemand aus Versehen die falsche einträgt (seit 0.36.4;
  // vorher stand die erste Sorte drin). Gibt es nur eine Sorte, bleibt sie vorgewählt.
  futterMenue(mahlzeit ? mahlzeit.futterId : daten.futter.length === 1 ? daten.futter[0].id : null);
  // Nachtragen für einen anderen Tag (seit 0.54.0): Uhrzeit leer statt „jetzt“, Hinweis mit Datum (0.54.1). Sonst lagen
  // mehrere Fütterungen, auf einmal nachgetragen, Minuten auseinander und zählten im PDF als eine Mahlzeit.
  const { uhrzeit, tipp } = uhrzeitVorbelegung({ mahlzeit, gewaehlterTag, jetzt: new Date() });
  const nachtragen = tipp !== null;
  form.uhrzeit.value = uhrzeit;
  $("uhrzeit-tipp").textContent = tipp ?? "";
  $("uhrzeit-tipp").hidden = !nachtragen;
  // Mit dem Fehlerfeld, damit die Vorlesefunktion „Bitte die Uhrzeit …“ nach dem Fokus mitliest (wie beim Rest-Feld).
  if (nachtragen) form.uhrzeit.setAttribute("aria-describedby", "uhrzeit-tipp mahlzeit-fehler");
  else form.uhrzeit.removeAttribute("aria-describedby");
  if (mahlzeit) form.gramm.value = String(mahlzeit.gramm).replace(".", ",");
  restZuruecksetzen(mahlzeit);
  zeigeMahlzeitVorschau();
  $("dialog-mahlzeit").showModal();
}

// ---------- Rest zurückwiegen (0.46.0, Ideen-Tafel „rest-zurueckwiegen“, Weg 1) ----------
// Nur beim Ändern einer Mahlzeit. „Anfangs gegeben“ und „Übrig“ stehen nur in den Feldern (ohne name) und werden nie
// gespeichert; der Bereich schreibt die gefressene Menge ins Gramm-Feld. Aufbau wie „Auf dem Arm gewogen?“.
// „Anfangs gegeben“ wird bewusst NICHT mit der gespeicherten Menge vorbelegt (Prüfer-Fund 06.11.): Wurde schon
// einmal ein Rest abgezogen, ist die gespeicherte Menge die gefressene, und der Rest würde doppelt abgezogen
// (zu wenig gespeichert, größeres „Noch“, Gefahr des Nachfütterns). Die gespeicherte Menge steht nur als Platzhalter da.
let restGramm = ""; // Wert, den der Bereich zuletzt ins Gramm-Feld geschrieben hat
let grammVorbelegt = ""; // Gramm-Feld, bevor der Bereich zum ersten Mal hineingeschrieben hat, für die Rücknahme
const TEXT_REST_OFFEN = "Der Rest ist noch nicht abgezogen. Bitte „Übrig“ prüfen oder das Feld leeren.";

function restZuruecksetzen(mahlzeit) {
  $("rest-bereich").hidden = !mahlzeit;
  $("rest-bereich").open = false;
  $("rest-gegeben").value = "";
  $("rest-gegeben").placeholder = mahlzeit ? `z. B. ${String(mahlzeit.gramm).replace(".", ",")}` : "";
  $("rest-uebrig").value = "";
  $("rest-ergebnis").textContent = "";
  zeigeFehler("rest-fehler", "");
  restGramm = "";
  grammVorbelegt = $("form-mahlzeit").gramm.value;
}

// Menge oben von Hand geändert (tippen oder ±5), nachdem der Bereich etwas abgezogen hat: Dann gilt die eigene Zahl.
// „Übrig“ wird geleert, damit keine veraltete Zeile „Gefressen: … oben eingetragen“ stehen bleibt (Prüfer-Fund 06.11.).
function restNachHandAenderung() {
  if (!restGramm || $("form-mahlzeit").gramm.value === restGramm) return;
  restGramm = "";
  $("rest-uebrig").value = "";
  $("rest-ergebnis").textContent = "Menge oben von Hand geändert: „Übrig“ geleert, es wird nichts mehr abgezogen.";
}

// fehlerZeigen: erst beim Verlassen eines Feldes, damit beim Tippen von „12“ nicht schon bei „1“ ein Fehler erscheint.
function restRechnen(fehlerZeigen) {
  const form = $("form-mahlzeit");
  const textGegeben = $("rest-gegeben").value.trim();
  const textUebrig = $("rest-uebrig").value.trim();
  let fehler = "";
  let ergebnis = null;
  if (!textGegeben !== !textUebrig) fehler = "Bitte beide Mengen eintragen.";
  else if (textGegeben && textUebrig) {
    const gegeben = leseZahl(textGegeben);
    const uebrig = leseZahl(textUebrig);
    if (gegeben === null || uebrig === null) fehler = "Bitte Zahlen eingeben, zum Beispiel 12.";
    else {
      const r = restAbziehen(gegeben, uebrig);
      if (r.fehler) fehler = r.fehler;
      else ergebnis = r.gramm;
    }
  }
  if (ergebnis !== null) {
    if (!restGramm) grammVorbelegt = form.gramm.value; // eigene Korrektur oben bleibt für die Rücknahme erhalten
    restGramm = String(ergebnis).replace(".", ",");
    form.gramm.value = restGramm;
    $("rest-ergebnis").textContent = `Gefressen: ${restGramm} g (${textGegeben} g gegeben, ${textUebrig} g übrig), oben eingetragen.`;
    zeigeFehler("rest-fehler", "");
    if ($("mahlzeit-fehler").textContent === TEXT_REST_OFFEN) zeigeFehler("mahlzeit-fehler", "");
  } else {
    // Ein Wert, den der Bereich selbst eingetragen hat, passt nicht mehr: zurück zur gespeicherten Menge.
    // Eigene Eingaben im Gramm-Feld bleiben.
    if (restGramm && form.gramm.value === restGramm) form.gramm.value = grammVorbelegt;
    restGramm = "";
    $("rest-ergebnis").textContent = "";
    if (fehlerZeigen || !fehler) zeigeFehler("rest-fehler", fehler);
  }
  zeigeMahlzeitVorschau();
}

// Steht etwas unter „Übrig“, das nicht abgezogen werden konnte? Dann nicht speichern, sonst landet still die
// volle Menge in den Daten (bei „alles übrig“ wäre eine Futterverweigerung verdeckt).
function restUngeklaert() {
  return !$("rest-bereich").hidden && $("rest-uebrig").value.trim() !== "" && !restGramm;
}

$("rest-bereich").addEventListener("input", () => restRechnen(false));
$("rest-bereich").addEventListener("change", () => restRechnen(true));
// Enter in den Rest-Feldern soll nicht speichern: weiter zum zweiten Feld bzw. Eingabe abschließen.
$("rest-bereich").addEventListener("keydown", (ereignis) => {
  if (ereignis.key !== "Enter" || ereignis.target.tagName !== "INPUT" || ereignis.isComposing) return;
  ereignis.preventDefault();
  ereignis.stopPropagation(); // sonst speichert der Enter-Listener des Formulars
  if (ereignis.target.id === "rest-gegeben") $("rest-uebrig").focus();
  else ereignis.target.blur();
});

function zeigeMahlzeitVorschau() {
  const form = $("form-mahlzeit");
  const gramm = leseZahl(form.gramm.value);
  const futter = futterNachId(daten).get(form.futter.value);
  $("mahlzeit-vorschau").textContent =
    gramm && futter ? `= ${zahl(kcalFuer(gramm, futter.kcalPro100g))} kcal` : "";
}

// − / + in 5-g-Schritten; eintippen bleibt möglich.
function grammSchritt(schritt) {
  const feld = $("form-mahlzeit").gramm;
  const jetzt = leseZahl(feld.value) ?? 0;
  const neu = Math.max(0, Math.round((jetzt + schritt) / 5) * 5);
  feld.value = neu ? String(neu) : "";
  restNachHandAenderung();
  zeigeMahlzeitVorschau();
}

$("form-mahlzeit").addEventListener("input", () => {
  restNachHandAenderung();
  zeigeMahlzeitVorschau();
});

beimSpeichern("form-mahlzeit", "mahlzeit-fehler", (werte) => {
  if (!werte.get("futter")) return "Bitte eine Futtersorte wählen.";
  if (!werte.get("uhrzeit")) {
    $("form-mahlzeit").uhrzeit.focus();
    return "Bitte die Uhrzeit der Fütterung eintragen.";
  }
  if (restUngeklaert()) {
    $("rest-bereich").open = true;
    restRechnen(true);
    // Fokus ins Feld, das fehlt (sonst „Übrig“): Die Vorlesefunktion liest dort den Grund mit (aria-describedby).
    ($("rest-gegeben").value.trim() ? $("rest-uebrig") : $("rest-gegeben")).focus();
    return TEXT_REST_OFFEN;
  }
  const gramm = leseZahl(werte.get("gramm"));
  // Ab 0,1 g: ein einzelnes Leckerli wiegt etwa 0,5 g; „0,085“ (in kg gedacht) wird abgelehnt (seit 0.36.2).
  if (!gramm || gramm < 0.1 || gramm > 1000) return "Bitte eine Menge zwischen 0,1 und 1000 g eingeben.";
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

// Gewicht eintragen: große Zahl, ±10 g, sofortige Rückmeldung zum Tempo.
// Das Feld bleibt leer (das letzte Gewicht steht nur als Platzhalter da), damit nie ungewogen gespeichert wird.
// ±10 g startet bei leerem Feld vom letzten Gewicht.
// Foto im Gewicht-Dialog: erst beim Speichern übernommen, Abbrechen verwirft es.
let gewichtFoto = null;
// Ohne Wägung: neu eintragen. Mit Wägung: Gewicht, Datum und Notiz nachträglich ändern (seit 0.31.0, Plan .planning/gewicht-aendern.md).
let bearbeiteteWaegung = null;
let kgVorbelegt = ""; // Inhalt des kg-Felds beim Öffnen (beim Ändern das gespeicherte Gewicht), für die Arm-Rücknahme
let fotoNachgeholt = false; // „Monatsfoto nachholen“ angetippt
// Ändern einer Wägung mit Foto (0.43.0): „Entfernen“ angetippt. Drei Fälle beim Speichern: unverändert (kein neues Foto,
// nicht entfernt), ersetzt (gewichtFoto), entfernt (fotoEntfernt ohne gewichtFoto). gewichtFoto allein reicht nicht,
// weil „vorhanden“ nicht „neu gewählt“ ist.
let fotoEntfernt = false;
let fotoLauf = 0; // zählt Dialog-Öffnungen und Bildauswahlen, damit ein spät fertiges Bild nicht im falschen Dialog landet

// Was die Vorschau zeigt: ein neu gewähltes Foto, sonst beim Ändern das vorhandene (solange es nicht entfernt ist).
function gezeigtesGewichtFoto() {
  if (gewichtFoto) return gewichtFoto;
  return !fotoEntfernt && fotoGueltig(bearbeiteteWaegung?.foto) ? bearbeiteteWaegung.foto : null;
}

function zeigeGewichtFoto() {
  const foto = gezeigtesGewichtFoto();
  const vorschau = $("gewicht-foto-vorschau");
  vorschau.hidden = !foto;
  if (foto) vorschau.src = foto;
  else vorschau.removeAttribute("src");
  $("gewicht-foto-entfernen").hidden = !foto;
  $("gewicht-foto-knopf").textContent = foto ? "Anderes Foto" : "Foto hinzufügen";
  zeigeFotoAngebot();
}

// Foto-Feld offen nur am Foto-Tag (letzter Wiegetag im Monat, Datum im Dialog); sonst höchstens ein ruhiger Link, solange das Monatsfoto fehlt.
// Ein schon gewähltes Foto bleibt sichtbar, damit man es wieder entfernen kann.
function zeigeFotoAngebot() {
  // Beim Ändern einer Wägung mit Foto (seit 0.43.0): Foto mit „Anderes Foto“ und „Entfernen“, beides gilt erst beim Speichern.
  // Ohne Foto (0.41.0): ruhiger Link „Foto nachtragen“, egal an welchem Tag.
  // Neue Wägung, Zeitraum hat schon ein Monatsfoto (0.43.0): ruhige Zeile mit dem Datum und Link „Durch neues Foto ersetzen“.
  const datum = $("form-gewicht").datum.value;
  const gueltig = /^\d{4}-\d{2}-\d{2}$/.test(datum);
  // Beim Ändern zählt die bearbeitete Wägung selbst nicht als „anderes“ Monatsfoto.
  const andere = bearbeiteteWaegung ? daten.gewichte.filter((g) => g !== bearbeiteteWaegung) : daten.gewichte;
  const angebot = fotoAngebot({ gewichte: daten.gewichte, tierId: tier.id, datum, wiegetag: tier.wiegetag });
  const vorhanden = angebot === "keins" && gueltig ? fotoImZeitraum(daten.gewichte, tier.id, datum, tier.wiegetag) : null;
  const hatFoto = fotoGueltig(bearbeiteteWaegung?.foto);
  const zustand = fotoFeld({
    angebot,
    gewaehlt: Boolean(gewichtFoto),
    nachgeholt: fotoNachgeholt,
    aendern: Boolean(bearbeiteteWaegung),
    hatFoto,
    wiegetag: tier.wiegetag,
    vorhandenDatum: vorhanden?.datum,
  });
  $("gewicht-foto-bereich").hidden = !zustand.bereich;
  $("gewicht-foto-vorhanden").hidden = !zustand.hinweis;
  $("gewicht-foto-vorhanden").textContent = zustand.hinweis ?? "";
  $("gewicht-foto-nachholen").hidden = !zustand.link;
  $("gewicht-foto-nachholen").textContent = zustand.linkText;
  $("gewicht-foto-wiegetag-tipp").hidden = !zustand.tipp;
  $("label-gewicht-foto").textContent = zustand.label;
  $("gewicht-foto-monatstipp").hidden = zustand.speichertipp;
  $("gewicht-foto-speichertipp").hidden = !zustand.speichertipp;
  if (!zustand.bereich) return;
  // Foto gewählt, und der Foto-Zeitraum hat schon eins (von einer anderen Wägung): vorher sagen, nicht erst beim Speichern.
  const belegt = gewichtFoto && gueltig ? fotoImZeitraum(andere, tier.id, datum, tier.wiegetag) : null;
  const entfernt = hatFoto && fotoEntfernt && !gewichtFoto;
  $("gewicht-foto-belegt").hidden = !belegt && !entfernt;
  if (belegt) $("gewicht-foto-belegt").textContent = `Seit dem letzten Foto-Tag gibt es schon ein Monatsfoto (vom ${datumText(belegt.datum)}). Beim Speichern fragt die App, ob das neue es ersetzen soll.`;
  else if (entfernt) $("gewicht-foto-belegt").textContent = "Das Foto wird beim Speichern entfernt.";
}

function fotoNachholen() {
  fotoNachgeholt = true;
  zeigeFotoAngebot();
  $("gewicht-foto-bereich").querySelector('[data-aktion="gewicht-foto-waehlen"]').focus();
}

$("gewicht-foto-datei").addEventListener("change", async (ereignis) => {
  const datei = ereignis.target.files[0];
  ereignis.target.value = "";
  if (!datei) return;
  const lauf = ++fotoLauf;
  try {
    const foto = await fotoZuschneiden(datei);
    if (lauf !== fotoLauf) return;
    gewichtFoto = foto;
    zeigeFehler("gewicht-fehler", "");
  } catch {
    if (lauf !== fotoLauf) return;
    zeigeFehler("gewicht-fehler", "Dieses Bild lässt sich nicht öffnen. Bitte ein anderes Foto wählen.");
  }
  zeigeGewichtFoto();
});

function eigeneGewichte() {
  return daten.gewichte.filter((g) => g.tierId === tier.id);
}

function oeffneGewicht(waegung = null) {
  bearbeiteteWaegung = waegung;
  const form = $("form-gewicht");
  form.reset();
  $("gewicht-titel").textContent = waegung ? `Gewicht von ${tier.name} ändern` : `Gewicht von ${tier.name}`;
  zeigeFehler("gewicht-fehler", "");
  form.datum.value = waegung ? waegung.datum : tagSchluessel(new Date());
  form.datum.max = tagSchluessel(new Date());
  // Bezug für Platzhalter, ±10 g und die Zahlen im Arm-Bereich: beim Ändern die Wägung selbst, sonst die letzte.
  const bezug = waegung ?? gewichteSortiert(eigeneGewichte())[0];
  form.kg.placeholder = bezug ? zahl(bezug.kg, 2) : "0,00";
  if (waegung) {
    // Wie in der Liste mit zwei Nachkommastellen („7,20“); eine dritte bleibt stehen, damit Speichern nichts still rundet.
    form.kg.value = waegung.kg.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 3 });
    form.notiz.value = waegung.notiz ?? "";
  }
  kgVorbelegt = form.kg.value;
  gewichtFoto = null;
  fotoNachgeholt = false;
  fotoEntfernt = false;
  fotoLauf += 1;
  zeigeGewichtFoto();
  armZuruecksetzen(bezug);
  zeigeGewichtRueckmeldung();
  $("dialog-gewicht").showModal();
}

// ---------- Auf dem Arm gewogen (Plan .planning/arm-wiegen.md) ----------
// Die beiden Halter-Gewichte stehen nur in den Feldern (ohne name, nicht in FormData) und werden nie gespeichert.
let armKg = ""; // Wert, den der Bereich zuletzt ins kg-Feld geschrieben hat
const ARM_NOTIZ = "auf dem Arm gewogen";
let armNotizGesetzt = false; // Notiz stammt vom Bereich (nicht vom Nutzer)

function armZuruecksetzen(letzte) {
  $("arm-bereich").open = false;
  $("arm-mit").value = "";
  $("arm-allein").value = "";
  $("arm-ergebnis").textContent = "";
  zeigeFehler("arm-fehler", "");
  armKg = "";
  armNotizGesetzt = false;
  // Zahlen je Tier aus dem letzten Gewicht: Wie viel ist 1 % und was nennen die Leitlinien pro Woche?
  $("arm-zahlen").textContent = letzte
    ? `Bei ${tier.name} sind 1 % des Gewichts ${prozentInGramm(letzte.kg, 1)} g. ` +
      `Schon 100 g sind bei ${tier.name} so viel wie etwa ${zahl(menschVergleich(letzte.kg), 1)} kg bei einem Menschen mit 75 kg. ` +
      `Die Leitlinien nennen als Abnahme ${zahl(GRENZEN.abnahmeMin, 1)}–${GRENZEN.abnahmeMax} % pro Woche, ` +
      `das sind ${prozentInGramm(letzte.kg, GRENZEN.abnahmeMin)}–${prozentInGramm(letzte.kg, GRENZEN.abnahmeMax)} g.`
    : "Schon 100 g sind bei einer Katze oft mehr als 1 % ihres Gewichts.";
}

// fehlerZeigen: erst beim Verlassen eines Feldes, damit beim Tippen von „74,6“ nicht schon bei „7“ ein Fehler erscheint.
function armRechnen(fehlerZeigen) {
  const form = $("form-gewicht");
  const textMit = $("arm-mit").value.trim();
  const textAllein = $("arm-allein").value.trim();
  const mit = leseZahl(textMit);
  const allein = leseZahl(textAllein);
  let fehler = "";
  let ergebnis = null;
  if (textMit && textAllein) {
    if (mit === null || allein === null) fehler = "Bitte Zahlen eingeben, zum Beispiel 74,6.";
    else {
      const r = armGewicht(mit, allein);
      if (r.fehler) fehler = r.fehler;
      else ergebnis = r.kg;
    }
  }
  if (ergebnis !== null) {
    armKg = zahl(ergebnis, 2);
    form.kg.value = armKg;
    $("arm-ergebnis").textContent = `Differenz: ${armKg} kg, oben eingetragen.`;
    zeigeFehler("arm-fehler", "");
    // Damit die Tierarztpraxis im Bericht sieht, woher der Wert kommt (sichtbar und änderbar).
    if (!form.notiz.value.trim()) {
      form.notiz.value = ARM_NOTIZ;
      armNotizGesetzt = true;
    }
  } else {
    // Ein Wert, den der Bereich selbst eingetragen hat, passt nicht mehr: zurück zum Stand beim Öffnen
    // (leer beim Eintragen, das gespeicherte Gewicht beim Ändern). Eigene Eingaben bleiben.
    if (armKg && form.kg.value === armKg) form.kg.value = kgVorbelegt;
    armKg = "";
    // Ebenso die vorgeschlagene Notiz, sonst stünde in der Tierarztpraxis eine falsche Herkunft des Werts.
    if (armNotizGesetzt && form.notiz.value === ARM_NOTIZ) form.notiz.value = "";
    armNotizGesetzt = false;
    $("arm-ergebnis").textContent = "";
    if (fehlerZeigen || !fehler) zeigeFehler("arm-fehler", fehler);
  }
  zeigeGewichtRueckmeldung();
}

$("arm-bereich").addEventListener("input", () => armRechnen(false));
$("arm-bereich").addEventListener("change", () => armRechnen(true));
// Enter in den Arm-Feldern soll nicht speichern oder schließen: weiter zum zweiten Feld bzw. Eingabe abschließen.
$("arm-bereich").addEventListener("keydown", (ereignis) => {
  if (ereignis.key !== "Enter" || ereignis.target.tagName !== "INPUT" || ereignis.isComposing) return;
  ereignis.preventDefault();
  ereignis.stopPropagation(); // sonst speichert der Enter-Listener des Formulars (siehe oben „Enter in einem Eingabefeld“)
  if (ereignis.target.id === "arm-mit") $("arm-allein").focus();
  else ereignis.target.blur();
});

function zeigeGewichtRueckmeldung() {
  const form = $("form-gewicht");
  const feld = $("gewicht-rueckmeldung");
  const kg = leseZahl(form.kg.value);
  const r =
    kg && kg >= 0.5 && kg <= 20 && form.datum.value
      ? tempoRueckmeldung({
          gewichte: eigeneGewichte(),
          freigaben: daten.freigaben.filter((f) => f.tierId === tier.id),
          kg,
          datum: form.datum.value,
          ohneId: bearbeiteteWaegung?.id, // beim Ändern nicht mit sich selbst vergleichen
        })
      : null;
  feld.hidden = !r;
  if (!r) return;
  const zeichen = { gut: SYMBOL.haken, "zu-schnell": "!", langsam: "!", zunahme: "!" }[r.bewertung] ?? "i";
  feld.className = `rueckmeldung ${r.bewertung}`;
  feld.innerHTML = `<span class="zeichen" aria-hidden="true">${zeichen}</span><span><b>${sicher(r.titel)}</b><span class="leise">${sicher(r.text)}</span></span>`;
}

function kgSchritt(schritt) {
  const form = $("form-gewicht");
  // Leeres Feld: beim Ändern von der Wägung selbst aus, sonst vom letzten Gewicht.
  const bezug = bearbeiteteWaegung ?? gewichteSortiert(eigeneGewichte())[0];
  const jetzt = leseZahl(form.kg.value) ?? bezug?.kg ?? null;
  if (jetzt === null) return form.kg.focus();
  const neu = Math.min(20, Math.max(0.5, Math.round((jetzt + schritt) * 100) / 100));
  form.kg.value = zahl(neu, 2);
  zeigeGewichtRueckmeldung();
}

$("form-gewicht").addEventListener("input", zeigeGewichtRueckmeldung);
// Anderes Datum = evtl. Foto-Tag oder anderer Foto-Zeitraum.
$("form-gewicht").datum.addEventListener("change", zeigeFotoAngebot);
$("form-gewicht").datum.addEventListener("input", zeigeFotoAngebot);
// Sicherheitsnetz: Nach dem Schließen gilt das Fenster wieder als „neu eintragen“. Sonst überschriebe ein späteres
// Öffnen ohne oeffneGewicht() beim Speichern eine alte Wägung. (Das close-Ereignis kommt erst nach dem Speichern.)
// Ein verzögertes close (verstecktes Fenster) darf ein inzwischen neu geöffnetes Fenster nicht zurücksetzen.
$("dialog-gewicht").addEventListener("close", () => {
  if (!$("dialog-gewicht").open) {
    bearbeiteteWaegung = null;
    fotoEntfernt = false;
  }
});

// Rückfrage, wenn es im Zeitraum schon ein Monatsfoto gibt (höchstens eins je Zeitraum). Drei Wege seit 0.52.0:
// ersetzen, ohne das neue Foto speichern oder „Abbrechen“ (zurück ins Fenster, nichts gespeichert).
function monatsfotoFrage(vorhanden) {
  return {
    text: `Seit dem letzten Foto-Tag gibt es schon ein Monatsfoto (vom ${datumText(vorhanden.datum)}). Soll das neue Foto es ersetzen?`,
    ja: "Foto ersetzen",
    dritte: "Ohne neues Foto speichern",
  };
}

beimSpeichern("form-gewicht", "gewicht-fehler", async (werte) => {
  const kg = leseZahl(werte.get("kg"));
  if (!kg || kg < 0.5 || kg > 20) return "Bitte ein Gewicht zwischen 0,5 und 20 kg eingeben, z. B. 9,32.";
  // Ändern: dieselbe Wägung, das Foto bleibt. Speicher voll: sichern() lädt den gespeicherten Stand neu und meldet es
  // (wie bei „Mahlzeit ändern“).
  if (bearbeiteteWaegung) {
    const hatteFoto = fotoGueltig(bearbeiteteWaegung.foto);
    // Foto nachtragen (0.41.0) oder ersetzen (0.43.0): gleiche Regel wie beim Eintragen, höchstens eins je Zeitraum.
    // Rückfrage nur, wenn eine andere Wägung im Ziel-Zeitraum ein Foto hat (z. B. weil das Datum geändert wurde).
    // Gefragt wird vor jeder Änderung an der Wägung (mit dem neuen Datum), damit „Abbrechen“ nichts verändert (0.52.0).
    let vorhanden = null;
    let ersetzen = true;
    if (gewichtFoto) {
      const andere = daten.gewichte.filter((g) => g !== bearbeiteteWaegung);
      vorhanden = fotoImZeitraum(andere, bearbeiteteWaegung.tierId, werte.get("datum"), tier.wiegetag);
      if (vorhanden) {
        const antwort = await frage(monatsfotoFrage(vorhanden));
        if (antwort === "nein") return "";
        ersetzen = antwort === "ja";
      }
    }
    waegungAendern(bearbeiteteWaegung, { kg, datum: werte.get("datum"), notiz: werte.get("notiz") });
    // Zielmonat aufklappen: Rutscht die Wägung in einen zugeklappten Monat, sieht man sie dort, und der Fokus findet sie.
    merkeZustand("monat-" + bearbeiteteWaegung.datum.slice(0, 7), true);
    if (!gewichtFoto) {
      // Entfernt (0.43.0): ohne weitere Rückfrage, „Abbrechen“ im Fenster war der Rückweg. Sonst bleibt das Foto, wie es war.
      if (hatteFoto && fotoEntfernt) delete bearbeiteteWaegung.foto;
      return sichern();
    }
    if (ersetzen) {
      bearbeiteteWaegung.foto = gewichtFoto;
      if (vorhanden) delete vorhanden.foto;
    } else if (hatteFoto && fotoEntfernt) {
      delete bearbeiteteWaegung.foto; // „ohne das neue Foto“ heißt hier: wie ohne Auswahl, also entfernt
    }
    try {
      speichern(daten);
    } catch {
      // Speicher voll: gespeicherten Stand neu laden, Fenster bleibt offen (wie beim Eintragen mit Foto).
      const id = bearbeiteteWaegung.id;
      daten = laden();
      tier = aktivesTier(daten, tier.id);
      bearbeiteteWaegung = daten.gewichte.find((g) => g.id === id) ?? null;
      zeichneAlles();
      if (ersetzen && hatteFoto) {
        // Wie im Profil: das bisherige Foto wieder einstellen, sonst ginge es mit „Entfernen“ verloren.
        gewichtFoto = null;
        fotoEntfernt = false;
        zeigeGewichtFoto();
        return "Das neue Foto passt nicht mehr in den Speicher. Es ist wieder das bisherige Foto eingestellt. Speichere noch einmal, dann bleiben die übrigen Angaben erhalten.";
      }
      return ersetzen
        ? "Das Foto passt nicht mehr in den Speicher. Entferne das Foto und speichere die Änderung ohne Foto."
        : "Der Speicher ist voll, die Änderung wurde nicht gespeichert. Bitte speichere zuerst eine Sicherung.";
    }
    zeichneAlles();
    return ersetzen ? undefined : { toast: "✓ Gespeichert, ohne das neue Foto" };
  }
  const eintrag = { id: neueId(), tierId: tier.id, kg, datum: werte.get("datum"), notiz: werte.get("notiz").trim() };
  // Höchstens ein Monatsfoto (Zeitraum ab dem letzten Wiegetag im Monat): das neue ersetzt nach Rückfrage das alte, sonst ohne Foto.
  let ersetzt = null;
  if (gewichtFoto) {
    const vorhanden = fotoImZeitraum(daten.gewichte, tier.id, eintrag.datum, tier.wiegetag);
    let ersetzen = true;
    if (vorhanden) {
      const antwort = await frage(monatsfotoFrage(vorhanden));
      if (antwort === "nein") return ""; // zurück ins Fenster, nichts angelegt
      ersetzen = antwort === "ja";
    }
    if (ersetzen) {
      eintrag.foto = gewichtFoto;
      if (vorhanden) {
        ersetzt = { waegung: vorhanden, foto: vorhanden.foto };
        delete vorhanden.foto;
      }
    }
  }
  daten.gewichte.push(eintrag);
  try {
    speichern(daten);
  } catch {
    // Speicher voll: alles zurücknehmen, nichts halb speichern.
    daten.gewichte.pop();
    if (ersetzt) ersetzt.waegung.foto = ersetzt.foto;
    return eintrag.foto
      ? "Das Foto passt nicht mehr in den Speicher. Entferne das Foto und speichere das Gewicht ohne Foto."
      : "Der Speicher ist voll, das Gewicht wurde nicht gespeichert. Bitte speichere zuerst eine Sicherung.";
  }
  zeichneAlles();
  if (gewichtFoto && !eintrag.foto) return { toast: "✓ Gespeichert, ohne das neue Foto" };
});

// ---------- Fenster „Besonderer Tag“ (0.33.0) ----------
// Ohne Eintrag: neu, Datum ist der gezeigte Tag. Mit Eintrag: ändern (wie „Gewicht ändern“ seit 0.31.0).
let bearbeiteterTag = null;

function zeigeBesondersFelder() {
  const form = $("form-besonders");
  const art = BESONDERE_ARTEN.find((a) => a.wert === form.art.value);
  $("besonders-art-tipp").textContent = art?.hinweis ?? "";
  $("besonders-art-tipp").hidden = !art?.hinweis;
  $("besonders-notiz-zusatz").textContent = art?.notizPflicht ? "(bitte ausfüllen)" : "(freiwillig)";
  $("besonders-bis-feld").hidden = !form.mehrere.checked;
  // Gesperrt, solange das Häkchen aus ist: Der Browser prüft ein verstecktes Feld sonst trotzdem (min = Datum) und
  // verweigert das Speichern ohne sichtbare Meldung (Review 05.11.). Gesperrte Felder fehlen in FormData.
  form.bis.disabled = !form.mehrere.checked;
  form.bis.min = form.von.value;
}

function oeffneBesonders(eintrag = null) {
  bearbeiteterTag = eintrag;
  const form = $("form-besonders");
  form.reset();
  zeigeFehler("besonders-fehler", "");
  $("besonders-dialog-titel").textContent = eintrag ? `Besonderen Tag von ${tier.name} ändern` : `Besonderer Tag für ${tier.name}`;
  $("besonders-art").innerHTML = auswahlFeld({
    name: "art",
    beschriftung: "label-besonders-art",
    optionen: BESONDERE_ARTEN,
    wert: eintrag?.art ?? "",
  });
  const heute = tagSchluessel(new Date());
  form.von.max = heute;
  form.bis.max = heute;
  form.von.value = eintrag ? eintrag.von : tagSchluessel(gewaehlterTag);
  form.mehrere.checked = !!eintrag && eintrag.bis !== eintrag.von;
  form.bis.value = eintrag && eintrag.bis !== null && eintrag.bis !== eintrag.von ? eintrag.bis : "";
  form.notiz.value = eintrag?.notiz ?? "";
  zeigeBesondersFelder();
  $("dialog-besonders").showModal();
}

// Art (Auswahlmenü meldet change), Häkchen und Datum: Hinweise, Feld „bis“ und dessen frühestes Datum anpassen.
$("form-besonders").addEventListener("change", zeigeBesondersFelder);
$("form-besonders").von.addEventListener("input", zeigeBesondersFelder);
// Wie beim Gewicht: Nach dem Schließen gilt das Fenster wieder als „neu eintragen“.
$("dialog-besonders").addEventListener("close", () => {
  if (!$("dialog-besonders").open) bearbeiteterTag = null;
});

beimSpeichern("form-besonders", "besonders-fehler", (werte) => {
  const heute = tagSchluessel(new Date());
  const ergebnis = eintragAusFormular(
    {
      art: werte.get("art"),
      von: werte.get("von"),
      mehrere: werte.get("mehrere") !== null,
      bis: werte.get("bis") ?? "",
      notiz: werte.get("notiz"),
    },
    heute
  );
  if (ergebnis.fehler) return ergebnis.fehler;
  if (bearbeiteterTag) Object.assign(bearbeiteterTag, ergebnis.eintrag);
  else daten.besondereTage.push({ id: neueId(), tierId: tier.id, ...ergebnis.eintrag });
  // Speicher voll: sichern() lädt den gespeicherten Stand neu und meldet es.
  if (!sichern()) return;
  // „Futter verweigert“ und jetzt dringend: den roten Kasten oben auf „Heute“ zeigen.
  if (artVon(ergebnis.eintrag.art).notfall && notfallJetzt(daten.besondereTage, tier.id, heute)) {
    requestAnimationFrame(() => $("notfall-kasten").scrollIntoView({ block: "center", behavior: ohneBewegung() ? "auto" : "smooth" }));
  }
  // Art und Zeitraum nennen (0.71.0): länger sichtbar als das kurze „✓ Gespeichert“, weil mehr zu lesen ist.
  return { toast: speicherMeldung(ergebnis.eintrag), dauer: 3500 };
});

// Foto einer Wägung groß ansehen und einzeln entfernen (die Wägung bleibt).
let angesehen = null;
let tauschLauf = 0; // wie fotoLauf: nur die zuletzt gewählte Datei im selben geöffneten Dialog zählt
let fotoAusVerlauf = false; // geöffnet über die Karte „Vorher / Nachher“ (0.43.0): Fokus danach dorthin, nicht in die Gewichtsliste

function oeffneFoto(waegung, ausVerlauf = false) {
  if (!waegung || !fotoGueltig(waegung.foto)) return;
  angesehen = waegung;
  fotoAusVerlauf = ausVerlauf;
  const { vorher } = vorherNachher(daten.gewichte, tier.id);
  const art = ausVerlauf ? (vorher === waegung ? "Vorher-Foto" : "Nachher-Foto") : "Foto";
  $("foto-titel").textContent = `${art} vom ${datumText(waegung.datum)}`;
  $("foto-gross").src = waegung.foto;
  $("foto-gross").alt = `${tier.name} am ${datumText(waegung.datum)}, ${zahl(waegung.kg, 2)} kg`;
  zeigeFehler("foto-fehler", "");
  tauschLauf += 1;
  $("dialog-foto").showModal();
}

// Falsches Foto erwischt: direkt austauschen, Gewicht und Datum bleiben.
$("foto-tauschen-datei").addEventListener("change", async (ereignis) => {
  const datei = ereignis.target.files[0];
  ereignis.target.value = "";
  const waegung = angesehen;
  if (!datei || !waegung) return;
  const lauf = ++tauschLauf;
  let foto;
  try {
    foto = await fotoZuschneiden(datei);
  } catch {
    if (lauf !== tauschLauf) return;
    return zeigeFehler("foto-fehler", "Dieses Bild lässt sich nicht öffnen. Bitte ein anderes Foto wählen.");
  }
  if (lauf !== tauschLauf || angesehen !== waegung) return; // inzwischen anderes Bild gewählt oder Dialog zu
  waegung.foto = foto;
  if (!sichern()) return $("dialog-foto").close(); // Speicher voll: alter Stand ist wieder geladen, sichern() meldet es
  $("foto-gross").src = foto;
  zeigeFehler("foto-fehler", "");
  zeigeToast("✓ Foto ausgetauscht");
});

async function fotoEntfernen() {
  const waegung = angesehen;
  if (!waegung) return;
  // Ist das Foto in Vorher/Nachher zu sehen, sagt die Rückfrage, was dort danach steht (0.43.0).
  const zusatz = nachEntfernen(daten.gewichte, tier.id, waegung);
  const ja = await bestaetigt({
    text: `Dieses Foto entfernen? Das Gewicht bleibt gespeichert. Das Foto lässt sich nicht zurückholen, außer aus einer Sicherung.${zusatz ? "\n\n" + zusatz : ""}`,
    ja: "Foto entfernen",
    gefahr: true,
  });
  if (!ja || angesehen !== waegung || !$("dialog-foto").open) return; // inzwischen anderes Foto oder Fenster zu
  const ausVerlauf = fotoAusVerlauf;
  delete waegung.foto;
  $("dialog-foto").close();
  if (sichern()) zeigeToast("✓ Foto entfernt");
  // Der Knopf mit dem Bild ist weg: Fokus auf die Karte „Vorher / Nachher“ bzw. die Wägungsliste statt ins Leere.
  const ziel = ausVerlauf ? document.querySelector("#verlauf-inhalt .vorher-nachher") : $("gewicht-monate");
  if (!ziel) return;
  ziel.tabIndex = -1;
  ziel.addEventListener("blur", () => ziel.removeAttribute("tabindex"), { once: true });
  ziel.focus({ preventScroll: true });
}

$("dialog-foto").addEventListener("close", () => {
  if ($("dialog-foto").open) return; // verspätetes close: ein inzwischen neu geöffnetes Fenster nicht zurücksetzen
  angesehen = null;
  fotoAusVerlauf = false;
  tauschLauf += 1;
  $("foto-gross").removeAttribute("src");
});

// BCS 1–9 mit grober Einordnung als Hilfe beim Abschreiben – den Wert selbst legt nur die Tierarztpraxis fest.
const BCS_GRUPPE = (bcs) => (bcs <= 3 ? "zu dünn" : bcs <= 5 ? "ideal" : bcs === 6 ? "etwas zu schwer" : "übergewichtig");
const BCS_OPTIONEN = [1, 2, 3, 4, 5, 6, 7, 8, 9].map((bcs) => ({ wert: String(bcs), text: String(bcs), zusatz: BCS_GRUPPE(bcs) }));

// Ohne Freigabe: neu eintragen. Mit Freigabe: einen Fehler beim Eintragen korrigieren oder sie löschen (seit 0.34.0,
// Entwurf .planning/freigabe-aendern.md). Ein neuer Plan des Tierarztes kommt weiter als neue Freigabe dazu.
let bearbeiteteFreigabe = null;

function oeffneFreigabe(freigabe = null) {
  bearbeiteteFreigabe = freigabe;
  const form = $("form-freigabe");
  form.reset();
  $("freigabe-titel").textContent = freigabe ? `Freigabe für ${tier.name} ändern` : `Freigabe für ${tier.name}`;
  $("freigabe-hinweis-aendern").textContent = HINWEIS_AENDERN;
  $("freigabe-hinweis-aendern").hidden = !freigabe;
  // Die Vorlesefunktion liest den Hinweis „Nur für Fehler beim Eintragen …“ beim Öffnen mit (seit 0.41.0).
  if (freigabe) $("dialog-freigabe").setAttribute("aria-describedby", "freigabe-hinweis-aendern");
  else $("dialog-freigabe").removeAttribute("aria-describedby");
  $("freigabe-loeschen").hidden = !freigabe;
  zeigeFehler("freigabe-fehler", "");
  const heute = tagSchluessel(new Date());
  form.datum.max = heute;
  form.datum.value = freigabe?.datum ?? heute;
  // Beim Ändern die Praxis aus der Freigabe, nicht aus dem Tierprofil (die Praxis kann inzwischen gewechselt haben).
  form.tierarzt.value = freigabe ? freigabe.tierarzt ?? "" : tier.tierarzt?.praxis ?? "";
  if (freigabe) {
    form.ziel.value = String(freigabe.zielgewichtKg).replace(".", ",");
    form.kcal.value = String(freigabe.kcalProTag).replace(".", ",");
    form.notiz.value = freigabe.notiz ?? "";
  }
  $("freigabe-bcs").innerHTML = auswahlFeld({
    name: "bcs",
    beschriftung: "label-bcs",
    optionen: [{ wert: "", text: "Keine Angabe" }, ...BCS_OPTIONEN],
    wert: freigabe && bcsGueltig(freigabe.bcs) ? String(freigabe.bcs) : "",
  });
  $("freigabe-mcs").innerHTML = auswahlFeld({
    name: "mcs",
    beschriftung: "label-mcs",
    optionen: [{ wert: "", text: "Keine Angabe" }, ...Object.entries(MCS).map(([wert, text]) => ({ wert, text }))],
    wert: freigabe && Object.hasOwn(MCS, freigabe.mcs ?? "") ? freigabe.mcs : "",
  });
  $("dialog-freigabe").showModal();
}

// Reihenfolge wie im Entwurf: Werte, Datum (gleicher Tag), „Stimmt das Datum?“ beim Korrigieren (0.36.5),
// „Stimmt das Ziel?“ (0.36.6), 60-%-Rückfrage, „welche Freigabe gilt“, Ersetzen am selben Tag. Geändert wird erst nach allen Rückfragen,
// ein Abbruch lässt also nichts halb geändert zurück.
beimSpeichern("form-freigabe", "freigabe-fehler", async (werte) => {
  const ziel = leseZahl(werte.get("ziel"));
  const kcal = leseZahl(werte.get("kcal"));
  const tierarzt = werte.get("tierarzt").trim();
  if (!ziel || ziel < 1 || ziel > 15) return "Bitte ein Zielgewicht zwischen 1 und 15 kg eingeben.";
  if (!kcal || kcal < 50 || kcal > 600) return "Bitte eine Tagesmenge zwischen 50 und 600 kcal eingeben.";
  if (!tierarzt) return "Bitte die Tierarztpraxis eintragen.";
  const datum = werte.get("datum");
  const alt = bearbeiteteFreigabe;
  // Was passiert, entscheidet speicherPlan (js/freigaben.js, mit Tests); hier nur noch fragen und ausführen.
  const plan = speicherPlan({
    freigaben: daten.freigaben,
    tierId: tier.id,
    alt,
    datum,
    zielgewichtKg: ziel,
    kcalProTag: kcal,
    heute: tagSchluessel(new Date()),
    gewichte: daten.gewichte,
  });
  if (plan.fehler) return plan.fehler;
  // Vor der 60-%-Rückfrage: Ist das Korrigieren hier falsch (neuer Plan), wäre die andere Frage umsonst (seit 0.36.5).
  if (plan.datumFrage && !(await bestaetigt({ text: plan.datumFrage, ja: "Ja, Datum stimmt", nein: "Nein, ändern" }))) {
    $("form-freigabe").datum.focus();
    return TEXT_DATUM_KORRIGIEREN;
  }
  // Zahlendreher beim Ziel (seit 0.36.6), vor der 60-%-Rückfrage: Die rechnet mit dem Ziel.
  if (plan.zielFrage && !(await bestaetigt({ text: plan.zielFrage, ja: "Ja, Ziel stimmt", nein: "Nein, ändern" }))) {
    $("form-freigabe").ziel.focus();
    return TEXT_ZIEL_PRUEFEN;
  }
  const grenze = Math.round(harteUntergrenze(ziel));
  const wertGeaendert = !alt || ziel !== alt.zielgewichtKg || kcal !== alt.kcalProTag;
  if (
    wertGeaendert &&
    kcal < grenze &&
    !(await bestaetigt({
      text:
        `${zahl(kcal)} kcal liegen unter ${grenze} kcal (60 % des Ruhebedarfs beim Zielgewicht). ` +
        "Das empfehlen die Leitlinien nur mit tierärztlichen Fachleuten für Ernährung. Wurde das in der Tierarztpraxis genau so festgelegt?",
      ja: "Ja, so festgelegt",
      nein: "Nein",
    }))
  )
    return "Bitte die Tagesmenge mit der Tierarztpraxis klären.";
  const neu = {
    datum,
    zielgewichtKg: ziel,
    kcalProTag: kcal,
    tierarzt,
    notiz: werte.get("notiz"),
    // BCS und MCS sind freiwillig: ohne Angabe fehlen die Felder ganz, wie in Freigaben vor 0.12.0.
    bcs: werte.get("bcs") ? Number(werte.get("bcs")) : undefined,
    mcs: werte.get("mcs") || undefined,
  };
  if (plan.frage && !(await bestaetigt({ text: plan.frage, ja: "Ja, Datum stimmt", nein: "Nein, ändern" }))) return TEXT_DATUM_PRUEFEN;
  if (plan.ersetzen && !(await bestaetigt({ text: ersetzenFrage(plan.ueberschrieben), ja: "Ersetzen" })))
    return TEXT_GLEICHER_TAG_NICHT_GESPEICHERT;
  let gespeichert = plan.ueberschrieben;
  if (gespeichert) {
    freigabeAendern(gespeichert, neu);
  } else {
    gespeichert = { id: neueId(), tierId: tier.id };
    freigabeAendern(gespeichert, neu);
    daten.freigaben.push(gespeichert);
  }
  // Landet die Freigabe unter „Frühere Freigaben“ (z. B. älteres Datum), die Liste aufklappen: Dort sieht man sie,
  // und die Fokus-Rückgabe findet ihren Knopf (zugeklappt wäre er unsichtbar, seit 0.41.0).
  if (fruehereFreigaben(eigeneFreigaben()).includes(gespeichert)) merkeZustand("freigaben-frueher", true);
  sichern();
});

// Löschen nur im Fenster „Freigabe ändern“, mit Rückfrage, die sagt, welche Freigabe danach gilt.
$("form-freigabe").addEventListener("submit", async (ereignis) => {
  if (ereignis.submitter?.value !== "loeschen" || !bearbeiteteFreigabe) return;
  ereignis.preventDefault(); // geschlossen wird erst nach dem Ja (eigene Rückfrage, 0.52.0)
  const weg = bearbeiteteFreigabe;
  if (!(await bestaetigt({ text: loeschFrage(eigeneFreigaben(), weg, tier.name, tagSchluessel(new Date())), ja: "Freigabe löschen", gefahr: true }))) return;
  if (bearbeiteteFreigabe !== weg) return; // Fenster inzwischen zu
  daten.freigaben = daten.freigaben.filter((f) => f.id !== weg.id); // per id wie bei den Sorten
  // Der Knopf der gelöschten Freigabe ist weg: Fokus auf die Tafel, ohne Freigabe auf „Freigabe eintragen“.
  oeffner = eigeneFreigaben().length ? { aktion: "freigabe-bearbeiten" } : { aktion: "freigabe-neu" };
  $("dialog-freigabe").close("loeschen");
  if (sichern()) zeigeToast("✓ Freigabe gelöscht");
});

// Wie bei Gewicht und Besonderer Tag: Nach dem Schließen gilt das Fenster wieder als „neu eintragen“.
// Nur, wenn es wirklich zu ist: Der Browser kann „close“ verspätet schicken (gesehen bei verstecktem Fenster), dann
// wäre das Fenster schon für eine andere Freigabe offen und würde still wie „neu eintragen“ speichern.
$("dialog-freigabe").addEventListener("close", () => {
  if (!$("dialog-freigabe").open) bearbeiteteFreigabe = null;
});

let bearbeitetesFutter = null;

const TYP_OPTIONEN = [
  { wert: "nass", text: "Nassfutter" },
  { wert: "trocken", text: "Trockenfutter" },
  { wert: "frischfleisch", text: "Frischfleisch / BARF" },
  { wert: "leckerli", text: "Leckerli / Snack" },
];
const QUELLE_OPTIONEN = [
  { wert: "packung", text: "Genau von der Packung" },
  { wert: "hersteller", text: "Herstellerangabe (z. B. Website)" },
  { wert: "geschaetzt", text: "Aus den Bestandteilen berechnet" },
  { wert: "ungefaehr", text: "Ungefähr" },
];

// Nummer aus dem Scanner für eine neue eigene Sorte; wird beim Speichern an der Sorte gemerkt.
let neueEan = null;

// ---------- kJ-Schutz und kcal-Rechner (0.32.0, Plan .planning/kcal-rechner-kj.md) ----------
// Beide Merker gelten nur, solange das Fenster offen ist, und nur für genau diesen Wert und diese Art.
let kcalBestaetigt = null; // { text, typ }: „Dort steht kcal pro 100 g“ getippt
// { text, typ, ausRechner }: Wert kam aus dem Rechner oder einer Umrechnung, die Einheit stimmt sicher.
// Eine Umrechnung zählt nur, wenn ihr Ergebnis selbst zur Art passt (Review 05.11.: 3430 kJ pro kg → „pro kg“ → 343).
let kcalVertraut = null;
let kcalMeldung = null; // { text, fuer: { text, typ } }: ruhige Zeile unter dem Feld
const gleicherWert = (merker, text, typ) => !!merker && merker.text === text && merker.typ === typ;
const mitKomma = (wert) => String(wert).replace(".", ",");

function kcalLage() {
  const form = $("form-futter");
  const text = form.kcal.value.trim();
  const typ = form.typ.value;
  const kcal = leseZahl(text);
  let kasten = typ ? kcalKasten(kcal ?? Number.NaN, typ, kcalSpanne(typ)) : null;
  const bestaetigt = gleicherWert(kcalBestaetigt, text, typ);
  if (kasten?.stufe === "rueckfrage" && (bestaetigt || gleicherWert(kcalVertraut, text, typ))) kasten = null;
  return { text, typ, kcal, kasten, bestaetigt };
}

const KASTEN_FEHLER = "Bitte zuerst die Frage im roten Kasten beantworten.";

// Zeigt oder entfernt den roten Kasten; derselbe Kasten ploppt nicht noch einmal auf.
function zeigeKcalKasten() {
  const lage = kcalLage();
  // Wert oder Art geändert: Bestätigung und Herkunft gelten nicht mehr, auch nicht beim Zurückändern.
  if (!gleicherWert(kcalBestaetigt, lage.text, lage.typ)) kcalBestaetigt = null;
  if (!gleicherWert(kcalVertraut, lage.text, lage.typ)) kcalVertraut = null;
  const feld = $("form-futter").kcal;
  const ort = $("kcal-kasten");
  if (!lage.kasten) {
    ort.innerHTML = "";
    if ($("futter-fehler").textContent === KASTEN_FEHLER) zeigeFehler("futter-fehler", "");
    feld.removeAttribute("aria-invalid");
    feld.setAttribute("aria-describedby", "kcal-satz");
  } else {
    const schluessel = `${lage.text}|${lage.typ}`;
    if (ort.firstElementChild?.dataset.schluessel !== schluessel) {
      const k = lage.kasten;
      const knoepfe = k.antworten
        .map((a) => `<button type="button" class="antwort" data-aktion="${a.aktion}">${sicher(a.titel)}<small>${sicher(a.klein)}</small></button>`)
        .join("");
      ort.innerHTML = `<div class="warnung warnung-sofort kcal-kasten plopp" role="alert" data-schluessel="${sicher(schluessel)}">
        <p>${sicher(k.ueberschrift)}</p>${k.saetze.map((s) => `<p class="w-text">${sicher(s)}</p>`).join("")}
        ${knoepfe ? `<div class="w-knoepfe">${knoepfe}</div>` : ""}</div>`;
    }
    feld.setAttribute("aria-invalid", "true");
    feld.setAttribute("aria-describedby", "kcal-satz kcal-kasten");
  }
  if (lage.bestaetigt) {
    kcalMeldung = { text: `Bestätigt: ${mitKomma(lage.kcal)} kcal pro 100 g stehen so auf der Packung.`, fuer: { text: lage.text, typ: lage.typ } };
  }
  if (kcalMeldung && !gleicherWert(kcalMeldung.fuer, lage.text, lage.typ)) kcalMeldung = null;
  if ($("kcal-meldung").textContent !== (kcalMeldung?.text ?? "")) $("kcal-meldung").textContent = kcalMeldung?.text ?? "";
  return lage;
}

// Kurzes Aufleuchten des Felds, wenn Kilossos einen Wert eingetragen hat.
function frisch(feld) {
  feld.classList.remove("frisch");
  void feld.offsetWidth;
  feld.classList.add("frisch");
}

function kcalAntwort(aktion) {
  const lage = kcalLage();
  const form = $("form-futter");
  zeigeFehler("futter-fehler", "");
  if (aktion === "kcal-stimmt") {
    kcalBestaetigt = { text: lage.text, typ: lage.typ };
  } else {
    const antwort = lage.kasten?.antworten.find((a) => a.aktion === aktion);
    if (!antwort) return;
    const neu = mitKomma(antwort.wert);
    form.kcal.value = neu;
    frisch(form.kcal);
    const fuer = { text: neu, typ: lage.typ };
    kcalVertraut = kcalPruefen(antwort.wert, lage.typ).stufe === "ok" ? fuer : null;
    const einheit = aktion === "kcal-kj" ? "kJ" : "kcal pro kg";
    kcalMeldung = { text: `✓ ${mitKomma(lage.kcal)} ${einheit} umgerechnet: ${neu} kcal pro 100 g.`, fuer };
  }
  zeigeKcalKasten();
  // Der getippte Knopf ist weg: Fokus auf die Rückmeldung statt ins Leere (öffnet keine Tastatur).
  $("kcal-meldung").focus();
}

function rechnerEingaben() {
  const form = $("form-futter");
  return Object.fromEntries(RECHNER_FELDER.map((f) => [f.name, form.elements[`analyse-${f.name}`]?.value ?? ""]));
}

function rechnerHtml(analyse) {
  const felder = RECHNER_FELDER.map(
    (f) => `<label class="wert-feld">${f.text} <small>oft „${f.packung}“</small>
      <span class="wert-eingabe"><input name="analyse-${f.name}" inputmode="decimal" autocomplete="off"
        value="${analyse && analyse[f.name] != null ? sicher(mitKomma(analyse[f.name])) : ""}"><span class="einheit" aria-hidden="true">%</span></span></label>`,
  ).join("");
  return aufklappKarte({
    id: "kcal-rechner",
    kopf: `<span class="zusammen">Keine kcal auf der Packung?<small>Aus den Analytischen Bestandteilen berechnen</small></span>`,
    inhalt: `<div class="rechner-inhalt">
      <p class="tipp">Tippe die Prozentwerte von der Packung ab. Du findest sie unter „Analytische Bestandteile“.</p>
      <div class="werte">${felder}</div>
      <div class="rechner-ausgabe" id="rechner-ausgabe" aria-live="polite"></div></div>`,
    offen: !!analyse,
    klasse: "rechner",
  });
}

const ART_DATIV = { nass: "Nassfutter", trocken: "Trockenfutter", frischfleisch: "Frischfleisch", leckerli: "Leckerli" };
const roterHinweis = (zeile, rest) =>
  `<div class="warnung warnung-sofort"><p>${zeile}</p><p class="w-text">${rest}</p></div>`;

function zeichneRechnerAusgabe() {
  const ausgabe = $("rechner-ausgabe");
  if (!ausgabe) return;
  const form = $("form-futter");
  const typ = form.typ.value;
  const r = rechnerPruefen(rechnerEingaben(), typ);
  const falsch = r.art === "keineZahl" ? r.felder : r.art === "feuchteFehlt" ? ["feuchte"] : [];
  for (const f of RECHNER_FELDER) {
    const feld = form.elements[`analyse-${f.name}`];
    if (falsch.includes(f.name)) feld.setAttribute("aria-invalid", "true");
    else feld.removeAttribute("aria-invalid");
  }
  const p = (text) => `<p>${text}</p>`;
  const html = {
    nichts: "",
    keineZahl: p("Bitte nur die Zahl eintragen."),
    leer: r.art === "leer" ? p(`Noch leer: ${r.leer.join(", ")}.`) : "",
    feuchteFehlt:
      typ === "frischfleisch"
        ? roterHinweis(
            "Ohne Feuchte stimmt die Rechnung bei Frischfleisch nicht.",
            "Steht sie nicht auf der Packung, nimm den kcal-Wert aus der Nährwerttabelle (Brennwert).",
          )
        : roterHinweis(
            "Bei Nassfutter steht die Feuchte immer auf der Packung.",
            "Bitte trag sie ein, ohne sie stimmt die Rechnung nicht.",
          ),
    zuViel: roterHinweis(
      `Zusammen sind das ${mitKomma(r.summe)}&nbsp;%, mehr als 100&nbsp;% geht nicht.`,
      "Steht bei einem Wert das Komma an der falschen Stelle? Vergleiche die Zahlen bitte mit der Packung.",
    ),
    feuchte100: roterHinweis("Die Feuchte kann nicht 100&nbsp;% sein.", "Vergleiche die Zahlen bitte mit der Packung."),
  }[r.art];
  const neu = r.art !== "ergebnis" ? html : ergebnisHtml(r, typ);
  if (neu !== letzteAusgabe) {
    ausgabe.innerHTML = neu;
    letzteAusgabe = neu;
  }
}

let letzteAusgabe = null;

// Feuchte fehlt: üblich sind 8 %; käme die Summe damit über 100 %, nimmt der Rechner den Rest bis 100 % (0.42.0).
function feuchteAnnahmeText(prozent) {
  const anfang = "Die Feuchte steht nicht auf der Packung. Das ist erlaubt, wenn sie unter 14&nbsp;% liegt.";
  if (prozent >= FEUCHTE_TROCKEN_ANNAHME) return `${anfang} Kilossos nimmt deshalb ${FEUCHTE_TROCKEN_ANNAHME}&nbsp;% an.`;
  return `${anfang} Mit den üblichen ${FEUCHTE_TROCKEN_ANNAHME}&nbsp;% käme die Summe über 100&nbsp;%. Kilossos nimmt deshalb den Rest bis 100&nbsp;% an: ${mitKomma(prozent)}&nbsp;%.`;
}

function ergebnisHtml(r, typ) {
  return `<div class="ergebnis">
    <p class="ergebnis-zahl">etwa ${r.kcal}&nbsp;<small>kcal pro 100&nbsp;g</small></p>
    ${r.angenommen ? `<p class="annahme">${feuchteAnnahmeText(r.feuchteAnnahme)}</p>` : ""}
    ${r.viel && ART_DATIV[typ] ? `<p class="annahme">Das ist viel für ${ART_DATIV[typ]}. Stimmen Feuchte und Fett?</p>` : ""}
    <p>Geschätzt: Die Rechnung kann bis etwa 10&nbsp;% vom echten Wert abweichen. Nennt der Hersteller einen Wert, zum Beispiel auf seiner Website, nimm lieber den.</p>
    ${r.uebernehmbar
      ? `<button type="button" class="knopf-haupt" data-aktion="rechner-uebernehmen">${r.kcal}&nbsp;kcal übernehmen</button>`
      : `<p class="annahme">Das passt zu keinem Katzenfutter. Vergleiche die Zahlen bitte mit der Packung.</p>`}
  </div>`;
}

// Klappt den Rechner auf und setzt den Fokus auf das erste Feld, das fehlt oder nicht stimmt.
function zeigeRechnerFeld() {
  const karte = document.querySelector("#futter-rechner .aufklapp");
  if (karte && !karte.classList.contains("offen")) karte.querySelector(".aufklapp-kopf").click();
  const form = $("form-futter");
  const felder = RECHNER_FELDER.map((f) => form.elements[`analyse-${f.name}`]);
  (felder.find((el) => el.getAttribute("aria-invalid") === "true") ?? felder.find((el) => !el.value.trim()) ?? felder[0])?.focus();
}

function rechnerUebernehmen() {
  const form = $("form-futter");
  const typ = form.typ.value;
  const r = rechnerPruefen(rechnerEingaben(), typ);
  if (r.art !== "ergebnis" || !r.uebernehmbar) return;
  const neu = String(r.kcal);
  form.kcal.value = neu;
  frisch(form.kcal);
  kcalVertraut = { text: neu, typ, ausRechner: true };
  $("futter-quelle").innerHTML = auswahlFeld({ name: "quelle", beschriftung: "label-quelle", optionen: QUELLE_OPTIONEN, wert: "geschaetzt" });
  zeigeFehler("futter-fehler", "");
  zeigeKcalKasten();
  const ergebnis = $("rechner-ausgabe").querySelector(".ergebnis");
  ergebnis.querySelector(".uebernommen")?.remove();
  ergebnis.insertAdjacentHTML(
    "beforeend",
    `<p class="uebernommen">✓ ${r.kcal}&nbsp;kcal eingetragen, Quelle „Aus den Bestandteilen berechnet“.</p>`,
  );
}

// Kasten beim Verlassen des kcal-Felds und beim Wechsel der Art, nicht bei jedem Tastendruck.
// Das Feld wird über focusout geprüft, nicht über change: change kommt im Browser vor focusout, und nur focusout weiß,
// wohin der Fokus geht. Geht er direkt auf Speichern, Abbrechen oder Löschen, wird nicht neu gezeichnet; sonst springt
// der Knopf unter dem Finger weg und der Tipp geht ins Leere (Review 05.11.). Speichern prüft ohnehin selbst.
$("form-futter").kcal.addEventListener("focusout", (ereignis) => {
  if (ereignis.relatedTarget?.closest?.("#form-futter .knoepfe")) return;
  zeigeKcalKasten();
});
$("form-futter").addEventListener("change", (ereignis) => {
  if (ereignis.target.name !== "typ") return;
  zeigeKcalKasten();
  zeichneRechnerAusgabe();
});
$("form-futter").addEventListener("input", (ereignis) => {
  if (!ereignis.target.name?.startsWith("analyse-")) return;
  zeichneRechnerAusgabe();
  // Rechner-Werte geändert: Ein übernommener Wert stimmt nicht mehr sicher (Review 05.11.: Feuchte 48 statt 84).
  if (kcalVertraut?.ausRechner) {
    kcalVertraut = null;
    zeigeKcalKasten();
  }
});

function oeffneFutter(futter, ean = null) {
  bearbeitetesFutter = futter;
  neueEan = ean;
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
  // Rückfrage bei jedem Öffnen neu (lieber einmal zu oft); der Rechner ist nur mit gespeicherten Werten aufgeklappt.
  kcalBestaetigt = kcalVertraut = kcalMeldung = null;
  letzteAusgabe = null;
  $("kcal-kasten").innerHTML = "";
  $("kcal-meldung").textContent = "";
  form.kcal.removeAttribute("aria-invalid");
  form.kcal.setAttribute("aria-describedby", "kcal-satz");
  zustandVergessen("kcal-rechner");
  $("futter-rechner").innerHTML = rechnerHtml(futter && analyseGueltig(futter.analyse) ? futter.analyse : null);
  zeichneRechnerAusgabe();
  $("futter-notiz").textContent = futter?.notiz ?? "";
  $("futter-notiz").hidden = !futter?.notiz;
  $("futter-ean").textContent = ean
    ? `Strichcode ${ean} wird mit der Sorte gespeichert. Beim nächsten Scan erkennt Kilossos den Beutel.`
    : futter?.ean?.length
      ? `Strichcode: ${futter.ean.join(", ")}`
      : "";
  $("futter-ean").hidden = !$("futter-ean").textContent;
  $("dialog-futter").showModal();
}

beimSpeichern("form-futter", "futter-fehler", (werte) => {
  const name = werte.get("name").trim();
  const typ = werte.get("typ");
  if (!name) return "Bitte einen Namen eingeben.";
  if (!typ) return "Bitte die Art wählen.";
  const rechner = rechnerPruefen(rechnerEingaben(), typ);
  const lage = zeigeKcalKasten();
  if (!lage.text && rechner.art === "ergebnis") return `Tippe im Rechner auf „${rechner.kcal} kcal übernehmen“ oder trag den Wert oben ein.`;
  if (lage.kasten) {
    ($("kcal-kasten").querySelector(".antwort") ?? $("form-futter").kcal).focus();
    return KASTEN_FEHLER;
  }
  const kcal = lage.kcal;
  if (!kcal || kcal < 20 || kcal > 700) return "Bitte einen kcal-Wert zwischen 20 und 700 pro 100 g eingeben.";
  if (!werte.get("quelle")) return "Bitte angeben, woher der Wert stammt.";
  if (rechner.art !== "nichts" && rechner.art !== "ergebnis") {
    zeigeRechnerFeld();
    return "Im Rechner fehlen noch Werte oder einer stimmt nicht. Ergänze sie oder leere die Felder.";
  }
  const felder = { name, typ, kcalPro100g: kcal, kcalQuelle: werte.get("quelle") };
  // Die Packungswerte werden auch gespeichert, wenn die kcal von woanders stammen; leere Felder entfernen sie.
  if (rechner.art === "ergebnis") felder.analyse = rechner.analyse;
  if (bearbeitetesFutter) {
    Object.assign(bearbeitetesFutter, felder);
    if (rechner.art === "nichts") delete bearbeitetesFutter.analyse;
  } else {
    const neu = { id: neueId(), notiz: "", ...felder, ...(neueEan ? { ean: [neueEan] } : {}) };
    daten.futter.push(neu);
    // Aus dem Mahlzeit-Blatt gescannt: die neue Sorte ist gleich gewählt.
    if ($("dialog-mahlzeit").open) {
      futterMenue(neu.id);
      zeigeMahlzeitVorschau();
    }
  }
  sichern();
});

$("form-futter").addEventListener("submit", async (ereignis) => {
  if (ereignis.submitter?.value !== "loeschen" || !bearbeitetesFutter) return;
  ereignis.preventDefault(); // geschlossen wird erst nach dem Ja (eigene Rückfrage, 0.52.0)
  const futter = bearbeitetesFutter;
  const benutzt = daten.mahlzeiten.some((m) => m.futterId === futter.id);
  if (benutzt) {
    zeigeFehler("futter-fehler", "Diese Sorte steckt in eingetragenen Mahlzeiten und kann nicht gelöscht werden.");
    return;
  }
  if (!(await bestaetigt({ text: `„${futter.name}“ wirklich löschen?`, ja: "Sorte löschen", gefahr: true }))) return;
  if (!$("dialog-futter").open || bearbeitetesFutter !== futter) return; // Fenster inzwischen zu oder andere Sorte
  daten.futter = daten.futter.filter((f) => f.id !== futter.id); // per id: daten kann während der Frage neu geladen sein
  $("dialog-futter").close("loeschen");
  sichern();
});

// ---------- Futterliste ----------

// Auf/Zu der Listen-Gruppen vor Beginn einer Suche; nach dem Leeren des Suchfelds wird er wiederhergestellt.
let vorSuche = null;

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
        const tag = drin ? "div" : "button";
        return `<${tag} ${drin ? 'class="zeile"' : `type="button" class="zeile zeile-knopf tippbar" data-aktion="liste-uebernehmen" data-id="${e.id}"`}>
          <span class="icon" aria-hidden="true">${TYP_SYMBOL[e.typ]}</span>
          <span class="name">${sicher(e.name)}<small>${TYP_NAMEN[e.typ]} · ${zahl(e.kcalPro100g, e.kcalPro100g % 1 ? 1 : 0)} kcal/100 g</small></span>
          ${drin ? '<span class="marke">in deiner Liste</span>' : `<span class="marke marke-${e.kcalQuelle}">${QUELLE_NAMEN[e.kcalQuelle]}</span><span class="nur-vorlesen">, übernehmen</span>`}
        </${tag}>`;
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
    listenGruppen(treffer)
      .map((g) => gruppe(g.id, g.titel, g.eintraege))
      .join("") ||
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
  $("dialog-scanner").close();
  if ($("dialog-mahlzeit").open) {
    futterMenue(neu.id);
    zeigeMahlzeitVorschau();
  }
  zeigeToast(`✓ ${eintrag.name} übernommen`);
}

// ---------- Strichcode scannen ----------
// Wurde der Scanner aus dem Mahlzeit-Blatt geöffnet, wird eine Sorte aus der eigenen Liste gleich gewählt.

let scannerStopp = null;

async function oeffneScanner() {
  $("form-scanner").reset();
  $("scanner-ergebnis").innerHTML = "";
  $("scanner-bild").hidden = true;
  $("scanner-tipp").textContent = "";
  $("dialog-scanner").showModal();
  if (!(await kameraScanMoeglich())) {
    $("scanner-tipp").textContent =
      "Dieses Gerät kann Strichcodes nicht mit der Kamera lesen. Tippe die Nummer unter dem Strichcode ein.";
    return;
  }
  $("scanner-bild").hidden = false;
  $("scanner-tipp").textContent = "Halte den Strichcode in den Rahmen. Danach schaltet sich die Kamera aus.";
  try {
    const stopp = await starteScanner($("scanner-video"), (nummer) => {
      const ean = eanAusEingabe(nummer);
      if (!ean) return false;
      $("scanner-bild").hidden = true;
      $("scanner-tipp").textContent = "";
      $("scanner-nummer").value = ean;
      navigator.vibrate?.(60);
      zeigeScanErgebnis(ean);
      return true;
    });
    if ($("dialog-scanner").open) scannerStopp = stopp;
    else stopp();
  } catch {
    $("scanner-bild").hidden = true;
    $("scanner-tipp").textContent =
      "Kilossos darf die Kamera nicht nutzen. Du kannst es in den Einstellungen des Browsers erlauben oder die Nummer eintippen.";
  }
}

$("dialog-scanner").addEventListener("close", () => {
  scannerStopp?.();
  scannerStopp = null;
});

// Enter im Nummernfeld sucht, statt das Blatt zu schließen.
$("scanner-nummer").addEventListener("keydown", (ereignis) => {
  if (ereignis.key !== "Enter") return;
  ereignis.preventDefault();
  scannerSuchen();
});

function scannerSuchen() {
  const text = $("scanner-nummer").value;
  const ean = eanAusEingabe(text);
  if (ean) return zeigeScanErgebnis(ean);
  $("scanner-ergebnis").innerHTML = `<p class="fehler">${
    text.trim()
      ? "Die Nummer stimmt nicht. Bitte prüfe die Ziffern unter dem Strichcode (meist 13)."
      : "Bitte die Nummer unter dem Strichcode eintippen."
  }</p>`;
}

const kcalText = (wert) => `${zahl(wert, wert % 1 ? 1 : 0)} kcal/100 g`;

function zeigeScanErgebnis(ean) {
  const treffer = findeNachEan(ean, daten.futter);
  if (treffer?.art === "eigene" && $("dialog-mahlzeit").open) {
    $("dialog-scanner").close();
    futterMenue(treffer.futter.id);
    zeigeMahlzeitVorschau();
    return zeigeToast(`✓ ${treffer.futter.name} gewählt`);
  }
  let inhalt;
  if (treffer?.art === "eigene") {
    const f = treffer.futter;
    inhalt = `<h3>${sicher(f.name)}</h3>
      <p class="leise">Schon in deiner Liste · ${TYP_NAMEN[f.typ]} · ${kcalText(f.kcalPro100g)}</p>
      <button type="button" class="knopf-haupt" data-aktion="scanner-ansehen" data-id="${sicher(f.id)}">Sorte ansehen</button>`;
  } else if (treffer) {
    const e = treffer.eintrag;
    inhalt = `<h3>${sicher(e.name)}</h3>
      <p class="leise">${TYP_NAMEN[e.typ]} · ${kcalText(e.kcalPro100g)}
        <span class="marke marke-${e.kcalQuelle}">${QUELLE_NAMEN[e.kcalQuelle]}</span></p>
      ${e.diaet ? '<p class="leise"><strong>Diätfutter:</strong> nur nach tierärztlicher Rücksprache.</p>' : ""}
      <p class="tipp">${e.eanHinweis ? `${sicher(e.eanHinweis)} ` : ""}Aus der Kilossos-Futterliste. Bei Abweichung gilt die Packung.</p>
      <button type="button" class="knopf-haupt" data-aktion="liste-uebernehmen" data-id="${e.id}">Übernehmen</button>`;
  } else {
    inhalt = `<h3>Diese Sorte kennt Kilossos noch nicht</h3>
      <p class="leise">Nummer ${ean}. Lege sie als eigene Sorte an. Kilossos merkt sich die Nummer und erkennt den Beutel beim nächsten Mal.</p>
      <button type="button" class="knopf-haupt" data-aktion="scanner-eigene" data-id="${ean}">Als eigene Sorte anlegen</button>`;
  }
  $("scanner-ergebnis").innerHTML = `<div class="scanner-treffer">${inhalt}</div>`;
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
    ...daten.besondereTage.flatMap((b) => [b.von, b.bis].filter(Boolean)),
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
  const pruefung = sicherungPruefen(neu, tagSchluessel(new Date()));
  if (!pruefung) {
    alert("Diese Datei ist keine gültige Kilossos-Sicherung.");
    return;
  }
  const ersetzen = einrichtungLaeuft ? "" : " Alle Einträge auf diesem Handy werden dadurch ersetzt.";
  // Rot, wenn die Sicherung Einträge ersetzt; in der Einrichtung gibt es noch nichts zu ersetzen.
  if (!(await bestaetigt({ text: einleseFrage(neu, pruefung, ersetzen), ja: "Einlesen", gefahr: !einrichtungLaeuft }))) return;
  try {
    // Auch während der Einrichtung erlaubt: Die Sicherung ersetzt den Platzhalter vollständig.
    speichernInSpeicher(neu);
  } catch {
    alert("Die Sicherung passt nicht in den Speicher dieses Browsers (oder er ist gesperrt, z. B. im privaten Modus). Es wurde nichts geändert.");
    return;
  }
  location.reload();
});

// Recht auf Löschung (DSGVO): alles, was Kilossos auf diesem Gerät gespeichert hat. Doppelt nachfragen.
async function allesLoeschen() {
  if (demo) return zeigeToast("In der Demo gibt es nichts Echtes zu löschen.", 2500);
  if (!(await bestaetigt({ text: "Wirklich ALLE Daten löschen? Einträge, Profil, Foto und Einstellungen auf diesem Handy gehen verloren.", ja: "Alles löschen", gefahr: true }))) return;
  if (!(await bestaetigt({ text: "Letzte Rückfrage: Das lässt sich nicht rückgängig machen. Hast du eine Sicherung, falls du die Daten noch brauchst?", ja: "Endgültig löschen", gefahr: true }))) return;
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
  // Tiername klein unter dem Titel wie bei „Darstellung“ (0.63.0), sonst rutscht das Menü in die nächste Zeile.
  const mehrere = daten.tiere.length > 1;
  const klein = $("wiegetag-tier");
  klein.hidden = !mehrere;
  klein.textContent = mehrere ? `Für ${tier.name}.` : "";
  $("wiegetag-feld").innerHTML = auswahlFeld({
    name: "wiegetag",
    beschriftung: "label-wiegetag wiegetag-tier",
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

// ---------- Willkommen und Einrichtung (nur beim ersten Start) ----------

// Seit 0.27.0: Wer noch keine Daten hat (frische Installation oder nach „Alle Daten löschen“), sieht drei Schritte
// und legt dabei seine eigene Katze an. Bis „Los geht's“ liegt nur ein Platzhalter im Arbeitsspeicher; sichern()
// speichert in dieser Zeit nichts. Wer die App mittendrin schließt, beginnt beim nächsten Öffnen von vorn.
// Bestehende Nutzer sehen nichts davon. Der alte Schlüssel der früheren Willkommensseite wird aufgeräumt.
let einrichtungFoto = null;
let einrichtungFotoLauf = 0;

// Alles hinter der Fläche ist für Tastatur und Vorlesefunktion gesperrt (inert), nicht nur verdeckt.
function hintergrundSperren(an) {
  for (const kind of document.body.children) {
    if (kind.id !== "willkommen" && kind.id !== "toast" && kind.tagName !== "SCRIPT" && kind.tagName !== "DIALOG") kind.inert = an;
  }
}

function einrichtungZeigen() {
  $("willkommen").hidden = false;
  document.body.classList.add("willkommen-offen");
  hintergrundSperren(true);
  $("einrichtung-geschlecht").innerHTML = auswahlFeld({
    name: "einrichtung-geschlecht",
    beschriftung: "label-einrichtung-geschlecht",
    optionen: [
      { wert: "kater", text: "Kater" },
      { wert: "katze", text: "Katze" },
    ],
  });
  $("einrichtung-kastriert").innerHTML = auswahlFeld({
    name: "einrichtung-kastriert",
    beschriftung: "label-einrichtung-kastriert",
    optionen: [
      { wert: "ja", text: "ja" },
      { wert: "nein", text: "nein" },
    ],
  });
  $("einrichtung-wiegetag").innerHTML = auswahlFeld({
    name: "einrichtung-wiegetag",
    beschriftung: "label-einrichtung-wiegetag",
    // Montag zuerst, wie im deutschen Kalender
    optionen: [{ wert: "", text: "Kein fester Tag" }, ...[1, 2, 3, 4, 5, 6, 0].map((t) => ({ wert: String(t), text: WOCHENTAGE[t] }))],
    wert: "",
  });
  einrichtungSchritt(1);
}

function einrichtungSchritt(nummer) {
  for (const n of [1, 2, 3]) $(`willkommen-${n}`).hidden = n !== nummer;
  $("willkommen").scrollTop = 0;
  $(nummer === 1 ? "willkommen-titel" : `willkommen-titel-${nummer}`).focus();
}

function zeigeEinrichtungFoto() {
  const name = $("form-einrichtung").name.value;
  const initiale = sicher((name.trim()[0] ?? "?").toLocaleUpperCase("de-DE"));
  $("einrichtung-avatar").innerHTML = einrichtungFoto
    ? `<img src="${sicher(einrichtungFoto)}" alt="">`
    : `<span class="initiale" aria-hidden="true">${initiale}</span>`;
  $("einrichtung-foto-knopf").textContent = einrichtungFoto ? "Anderes Foto" : "Foto wählen";
}

$("form-einrichtung").name.addEventListener("input", () => {
  if (!einrichtungFoto) zeigeEinrichtungFoto();
});

$("einrichtung-foto-datei").addEventListener("change", async (ereignis) => {
  const datei = ereignis.target.files[0];
  ereignis.target.value = "";
  if (!datei) return;
  const lauf = ++einrichtungFotoLauf;
  try {
    const foto = await fotoZuschneiden(datei);
    if (lauf !== einrichtungFotoLauf) return;
    einrichtungFoto = foto;
    zeigeFehler("einrichtung-fehler", "");
  } catch {
    if (lauf !== einrichtungFotoLauf) return;
    zeigeFehler("einrichtung-fehler", "Dieses Bild lässt sich nicht öffnen. Bitte ein anderes Foto wählen, oder ohne Foto weiter.");
  }
  zeigeEinrichtungFoto();
});

$("form-einrichtung").addEventListener("submit", (ereignis) => {
  ereignis.preventDefault();
  const werte = new FormData(ereignis.target);
  const name = werte.get("name").trim();
  const geschlecht = werte.get("einrichtung-geschlecht");
  const kastriert = werte.get("einrichtung-kastriert");
  const wiegetag = werte.get("einrichtung-wiegetag");
  const fehler = !name
    ? ["Bitte gib den Namen deiner Katze ein.", ereignis.target.name]
    : !geschlecht
      ? ["Bitte wähle Kater oder Katze.", $("auswahl-einrichtung-geschlecht")]
      : !kastriert
        ? ["Bitte gib an, ob deine Katze kastriert ist.", $("auswahl-einrichtung-kastriert")]
        : null;
  if (fehler) {
    zeigeFehler("einrichtung-fehler", fehler[0]);
    return fehler[1].focus();
  }
  const neu = ersteDaten({
    name,
    geschlecht,
    kastriert: kastriert === "ja",
    ...(einrichtungFoto && { foto: einrichtungFoto }),
    ...(wiegetag !== "" && { wiegetag: Number(wiegetag) }),
  });
  try {
    speichernInSpeicher(neu);
  } catch {
    // Speicher gesperrt oder voll (z. B. privater Modus): ohne Foto noch einmal, sonst ehrlich melden.
    zeigeFehler(
      "einrichtung-fehler",
      einrichtungFoto
        ? "Das Foto passt nicht in den Speicher. Bitte ohne Foto weiter, du kannst es später im Profil setzen."
        : "Kilossos kann auf diesem Gerät nichts speichern. Ist der private Modus des Browsers an?",
    );
    return;
  }
  einrichtungLaeuft = false;
  daten = neu;
  tier = daten.tiere[0];
  merkeAktivesTier(tier.id, demo);
  $("willkommen").hidden = true;
  document.body.classList.remove("willkommen-offen");
  hintergrundSperren(false);
  zeichneAlles();
  zeigeAnsicht("heute");
  zeigeToast(`Willkommen, ${name}!`);
  // Der Knopf „Los geht's“ ist weg: Fokus an den Anfang der App statt ins Leere.
  $("profil")?.focus();
});

// Alter Schlüssel der Willkommensseite bis 0.26.0: wird nicht mehr gebraucht.
if (!demo) {
  try {
    localStorage.removeItem("kilossos-willkommen-2");
  } catch {
    // Speicher gesperrt: nichts zu tun.
  }
}

// ---------- Wischen zwischen den Bereichen ----------

// Auf der ganzen Seite, nicht nur auf <main>: Ist der Inhalt kürzer als der Bildschirm, liegt darunter
// leere Fläche außerhalb von <main>, und auch dort soll Wischen klappen (Handy-Test 03.11.2026).
wischenAnmelden(document, {
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
  if (!ziel.closest("dialog")) oeffner = { aktion: ziel.dataset.aktion, id: ziel.dataset.id };

  const id = ziel.dataset.id;
  switch (ziel.dataset.aktion) {
    case "tag-zurueck":
      gewaehlterTag = new Date(gewaehlterTag.getFullYear(), gewaehlterTag.getMonth(), gewaehlterTag.getDate() - 1);
      return zeichneHeute(true);
    case "tag-vor":
      gewaehlterTag = new Date(gewaehlterTag.getFullYear(), gewaehlterTag.getMonth(), gewaehlterTag.getDate() + 1);
      return zeichneHeute(true);
    case "tag-kalender": {
      // Kalender des Geräts öffnen, vorbelegt mit dem gezeigten Tag; die Zukunft ist gesperrt wie beim Pfeil „vor“.
      const kalender = $("tag-kalender");
      kalender.max = tagSchluessel(new Date());
      kalender.value = tagSchluessel(gewaehlterTag);
      try {
        kalender.showPicker();
      } catch {
        kalender.focus(); // ältere Browser ohne showPicker()
        kalender.click();
      }
      return;
    }
    case "mahlzeit-neu":
      return oeffneMahlzeit();
    case "mahlzeit-bearbeiten":
      return oeffneMahlzeit(daten.mahlzeiten.find((m) => m.id === id));
    case "warum-kein-ziel":
      return $("dialog-warum").showModal();
    case "bcs-erklaerung":
      return $("dialog-bcs").showModal();
    case "grenzen-erklaerung":
      return $("dialog-grenzen").showModal();
    case "begriffe-erklaerung":
      return $("dialog-begriffe").showModal();
    case "warum-nicht-ab":
      return $("dialog-nicht-ab").showModal();
    case "anleitung-erklaerung":
      return $("dialog-anleitung").showModal();
    case "alltag-erklaerung":
      return $("dialog-alltag").showModal();
    case "wiegen-erklaerung":
      return $("dialog-wiegen").showModal();
    case "tipps-erklaerung":
      return $("dialog-tipps").showModal();
    case "ursachen-erklaerung":
      return $("dialog-ursachen").showModal();
    case "fragen-erklaerung":
      return $("dialog-fragen").showModal();
    case "gramm-minus":
      return grammSchritt(-5);
    case "gramm-plus":
      return grammSchritt(5);
    case "kg-minus":
      return kgSchritt(-0.01);
    case "kg-plus":
      return kgSchritt(0.01);
    case "mahlzeit-loeschen":
      return (async () => {
        if (!(await bestaetigt({ text: "Diese Mahlzeit löschen?", ja: "Löschen", gefahr: true }))) return;
        daten.mahlzeiten = daten.mahlzeiten.filter((m) => m.id !== id);
        sichern();
      })();
    case "gewicht-neu":
      return oeffneGewicht();
    case "gewicht-bearbeiten": {
      const waegung = daten.gewichte.find((g) => g.id === id);
      return waegung ? oeffneGewicht(waegung) : undefined;
    }
    case "waegung-foto-ansehen":
      return oeffneFoto(daten.gewichte.find((g) => g.id === id), Boolean(ziel.closest(".vorher-nachher")));
    case "waegung-foto-entfernen":
      return fotoEntfernen();
    case "waegung-foto-tauschen":
      return $("foto-tauschen-datei").click();
    case "gewicht-loeschen":
      return (async () => {
        if (!(await bestaetigt({ text: "Diesen Gewichtseintrag löschen?", ja: "Löschen", gefahr: true }))) return;
        daten.gewichte = daten.gewichte.filter((g) => g.id !== id);
        sichern();
      })();
    case "besonders-neu":
      return oeffneBesonders();
    case "besonders-bearbeiten": {
      const eintrag = daten.besondereTage.find((b) => b.id === id);
      return eintrag ? oeffneBesonders(eintrag) : undefined;
    }
    case "besonders-loeschen":
      return (async () => {
        if (!(await bestaetigt({ text: "Diesen Eintrag löschen?", ja: "Löschen", gefahr: true }))) return;
        daten.besondereTage = daten.besondereTage.filter((b) => b.id !== id);
        sichern();
      })();
    case "besonders-beenden": {
      const eintrag = daten.besondereTage.find((b) => b.id === id);
      if (!eintrag) return;
      beenden(eintrag, tagSchluessel(gewaehlterTag));
      if (!sichern()) return;
      zeigeToast(`✓ ${artVon(eintrag.art).ende ?? "Beendet"}`);
      // Der Knopf ist weg: Fokus auf den Eintrag selbst, damit Tastatur und Vorlesefunktion nicht oben anfangen.
      document.querySelector(`[data-aktion="besonders-bearbeiten"][data-id="${CSS.escape(eintrag.id)}"]`)?.focus({ preventScroll: true });
      return;
    }
    case "futter-neu":
      return oeffneFutter(null);
    case "futter-bearbeiten":
      return oeffneFutter(daten.futter.find((f) => f.id === id));
    case "kcal-kj":
    case "kcal-kg":
    case "kcal-stimmt":
      return kcalAntwort(ziel.dataset.aktion);
    case "rechner-uebernehmen":
      return rechnerUebernehmen();
    case "liste-oeffnen":
      return oeffneListe();
    case "scanner-oeffnen":
      return oeffneScanner();
    case "scanner-suchen":
      return scannerSuchen();
    case "scanner-ansehen":
      $("dialog-scanner").close();
      return oeffneFutter(daten.futter.find((f) => f.id === id));
    case "scanner-eigene":
      $("dialog-scanner").close();
      return oeffneFutter(null, id);
    case "liste-uebernehmen":
      return uebernehmeAusListe(id);
    case "freigabe-neu":
      return oeffneFreigabe();
    case "freigabe-bearbeiten": {
      const freigabe = eigeneFreigaben().find((f) => f.id === id);
      return freigabe ? oeffneFreigabe(freigabe) : undefined;
    }
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
    case "profil-foto-waehlen":
      return $("profil-foto-datei").click();
    case "profil-foto-entfernen":
      profilFoto = null;
      profilFotoLauf += 1;
      zeigeProfilFoto();
      return document.querySelector('[data-aktion="profil-foto-waehlen"]').focus();
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
    case "einrichtung-weiter":
      zeigeFehler("einrichtung-fehler", "");
      return einrichtungSchritt(Number(ziel.dataset.schritt));
    case "einrichtung-geschichte":
      return $("dialog-geschichte").showModal();
    case "einrichtung-foto":
      return $("einrichtung-foto-datei").click();
    case "einrichtung-sicherung":
      return $("import-datei").click();
    case "gewicht-foto-waehlen":
      return $("gewicht-foto-datei").click();
    case "gewicht-foto-nachholen":
      return fotoNachholen();
    case "gewicht-foto-entfernen": {
      // Entfernt, was die Vorschau zeigt: ein neu gewähltes Foto und beim Ändern auch das vorhandene (gilt erst beim Speichern).
      gewichtFoto = null;
      if (fotoGueltig(bearbeiteteWaegung?.foto)) fotoEntfernt = true;
      zeigeGewichtFoto();
      // Der Knopf verschwindet: Fokus auf das nächste sichtbare Bedienelement, nicht ins Leere.
      const ziel = !$("gewicht-foto-bereich").hidden
        ? $("gewicht-foto-bereich").querySelector('[data-aktion="gewicht-foto-waehlen"]')
        : !$("gewicht-foto-nachholen").hidden
          ? $("gewicht-foto-nachholen")
          : $("form-gewicht").datum;
      return ziel.focus();
    }
    case "geschichte-oeffnen":
      return $("dialog-geschichte").showModal();
  }
});

// Icons im festen Markup („Mehr“): <span data-symbol="name"> bekommt das SVG aus js/symbole.js.
for (const platz of document.querySelectorAll("[data-symbol]:empty")) platz.innerHTML = SYMBOL[platz.dataset.symbol] ?? "";

zeichneAlles();
zeichneHeute(true);
zeigeSpeicherStatus();
if (einrichtungLaeuft) einrichtungZeigen();
else gemerkteAnsichtZeigen();
delete document.documentElement.dataset.start; // Marke aus dem Kopf-Skript in index.html: ab jetzt steuert zeigeAnsicht
zurueck.starten(); // erst jetzt: Ansicht und Einrichtung stehen
