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
  armGewicht,
  prozentInGramm,
  menschVergleich,
} from "./js/rechnen.js";
import { zeichneVerlauf } from "./js/verlauf.js";
import { berichtDaten, berichtHtml } from "./js/bericht.js";
import {
  FUTTERLISTE,
  sucheFutter,
  ausListe,
  normalesFutterKcal,
  eanAusEingabe,
  findeNachEan,
} from "./js/futterliste.js";
import { kameraScanMoeglich, starteScanner } from "./js/scanner.js";
import { ringWerte, leckerliKachel, monatsGruppen, tempoRueckmeldung, achtWochen } from "./js/zusammenfassung.js";
import { SYMBOL } from "./js/symbole.js";
import { leseAnzeige, merkeAnzeige, aufgeloest } from "./js/anzeige.js";
import { aufklappKarte, merkeZustand, zustandVon, zustandVergessen, aufklappenAnmelden } from "./js/aufklappen.js";
import { auswahlFeld, auswahlAnmelden } from "./js/auswahl.js";
import { alterText, telefonLink, telefonGueltig, istWiegetag, WOCHENTAGE, HALTUNG } from "./js/profil.js";
import { aktivesTier, leseAktivesTier, merkeAktivesTier, neuesTier, eintraegeVon, tierEntfernen } from "./js/tiere.js";
import { wischenAnmelden } from "./js/wischen.js";
import { datumText, freigabeTafel } from "./js/mehr.js";
import { fotoImZeitraum, fotoAngebot, istFotoTag, vorherNachher } from "./js/fotos.js";
import { belegteZeichen, speicherAnzeige } from "./js/speicher.js";
import { sicherungPruefen, einleseFrage } from "./js/sicherung.js";

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
const TYP_SYMBOL = { nass: SYMBOL.nass, trocken: SYMBOL.trocken, leckerli: SYMBOL.leckerli };
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
  $("theme-farbe").content = thema === "dunkel" ? "#131b1a" : "#f3f5f2";
}
handyDunkel.addEventListener("change", () => {
  if (leseAnzeige() === "handy") wendeAnzeigeAn("handy");
});
wendeAnzeigeAn(leseAnzeige());

// Demo-Modus (Link mit "?demo"): lädt bei jedem Öffnen frisch die Simulation aus werkzeuge/erzeuge-testdaten.js,
// verschoben auf heute, in einen eigenen Speicherplatz. Die echten Einträge bleiben unberührt.
const demo = new URLSearchParams(location.search).has("demo");

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
  karte.addEventListener("click", (ereignis) => {
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
        if (!confirm(frage)) return;
        if (!confirm("Letzte Rückfrage: Das lässt sich nicht rückgängig machen.")) return;
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
    if (!confirm(einleseFrage(neu, pruefung, " Die unlesbaren Daten auf diesem Gerät werden dadurch ersetzt."))) return;
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
// Ohne eigenes Foto: ruhige Initiale auf Salbei (seit 0.23.0, vorher Zeichentrick-Katze).
function profilHtml(einTier, groesse) {
  const initiale = sicher((einTier.name?.trim()[0] ?? "?").toLocaleUpperCase("de-DE"));
  const bild = fotoGueltig(einTier.foto)
    ? `<img src="${sicher(einTier.foto)}" alt="">`
    : `<span class="initiale" aria-hidden="true">${initiale}</span>`;
  if (groesse === "klein") return `<span class="avatar">${bild}</span>`;
  return `${bild}<span class="kamera" aria-hidden="true">${SYMBOL.kamera}</span>`;
}

// ---------- Heute ----------

let kcalZahl = 0;

// Füllt das Lineal auf "anteil" (0–1; null = ohne Freigabe: kein Lineal) und zählt die Zahl hoch.
// vonNull: beim Wechsel auf „Heute“ und beim Tageswechsel von 0 an, sonst vom alten Wert aus.
function zeichneLineal(anteil, kcal, ueber, vonNull) {
  const fuell = $("lineal-fuell");
  $("lineal").hidden = anteil === null;
  fuell.classList.toggle("ueber", ueber);
  if (vonNull) {
    fuell.style.transition = "none";
    fuell.style.width = "0";
    fuell.getBoundingClientRect();
    fuell.style.transition = "";
    kcalZahl = 0;
  }
  fuell.style.width = `${((anteil ?? 0) * 100).toFixed(1)}%`;
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

// Mini-Kurve der Wägungen aus den letzten 8 Wochen (älteste zuerst), letzter Punkt in Tanne.
function miniKurve(liste) {
  if (liste.length < 2) return "";
  const kgs = liste.map((g) => g.kg);
  const min = Math.min(...kgs);
  const max = Math.max(...kgs);
  const punkte = liste.map((g, i) => [4 + (i / (liste.length - 1)) * 88, 6 + ((max - g.kg) / (max - min || 1)) * 32]);
  const [lx, ly] = punkte.at(-1);
  const linie = punkte.map((p) => p.map((v) => v.toFixed(1)).join(",")).join(" ");
  return `<svg class="mini" viewBox="0 0 96 44" aria-hidden="true"><polyline points="${linie}"/><circle cx="${lx.toFixed(1)}" cy="${ly.toFixed(1)}" r="3.5"/></svg>`;
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

  // Lineal: ohne Freigabe kein Ziel und kein Füllstand.
  const ring = ringWerte(summe.kcal, freigabe);
  const ca = summe.unsicher ? "ca. " : "";
  $("kcal-titel").textContent = tag === heute ? "Heute gefüttert" : "Gefüttert";
  zeichneLineal(ring.anteil, Math.round(summe.kcal), ring.ueber, vonNull);
  if (freigabe) {
    $("kcal-von").textContent = `${ca}von ${zahl(freigabe.kcalProTag)} kcal`;
    $("lineal-mitte").textContent = zahl(Math.round(freigabe.kcalProTag / 2));
    $("lineal-ende").textContent = zahl(freigabe.kcalProTag);
    let satz;
    if (ring.darueber > 0) satz = `<b>${zahl(ring.darueber)} kcal</b> über der Tagesmenge vom Tierarzt.`;
    else if (tag === heute) satz = `Noch <b>${zahl(ring.offen)} kcal</b> bis zur Tagesmenge vom Tierarzt.`;
    else satz = `<b>${zahl(ring.offen)} kcal</b> unter der Tagesmenge vom Tierarzt.`;
    $("kcal-text").innerHTML =
      `<p class="kcal-rest">${satz}</p><p class="kcal-zeilen"><span>Menge <b>${zahl(summe.gramm)} g</b></span></p>`;
  } else {
    $("kcal-von").textContent = `${ca}kcal · ${zahl(summe.gramm)} g Futter`;
    $("kcal-text").innerHTML =
      `<p class="kcal-rest">Ziel kommt mit der Freigabe vom Tierarzt.</p>` +
      `<button type="button" class="knopf-text" data-aktion="warum-kein-ziel">Warum kein Ziel?</button>`;
  }
  $("summe-hinweis").hidden = !summe.unsicher;

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
        return `<li><button type="button" class="protokoll-knopf tippbar" data-aktion="mahlzeit-bearbeiten" data-id="${m.id}">
          <span class="zeit">${uhr(m)}</span>
          <span class="was">${sicher(f ? f.name : "Gelöschte Sorte")}<small>${f ? TYP_NAMEN[f.typ] : "Sorte fehlt"}</small></span>
          <span class="wert">${zahl(m.gramm)} g<small>${kcal}</small></span><span class="nur-vorlesen">, ändern</span></button>
          <button type="button" class="knopf-loeschen" data-aktion="mahlzeit-loeschen" data-id="${m.id}" aria-label="Mahlzeit um ${uhr(m)}, ${sicher(f ? f.name : "Gelöschte Sorte")}, löschen">${SYMBOL.loeschen}</button></li>`;
      })
      .join("");
    $("heute-mahlzeiten").innerHTML = `<ul class="protokoll">${zeilen}</ul>`;
  }

  // Gewicht: Mini-Kurve der letzten 8 Wochen, Änderung zur Messung davor und Tempo (Regeln wie im Verlauf).
  const letzte = sortiert[0];
  let gewichtText;
  if (!letzte) {
    gewichtText = `<p>Noch nicht gewogen.<br><span class="leise">Am besten 1× pro Woche, immer zur gleichen Zeit.</span></p>`;
  } else {
    const r = tempoRueckmeldung({
      gewichte: sortiert.slice(1),
      freigaben: daten.freigaben.filter((f) => f.tierId === tier.id && f.datum <= tag),
      kg: letzte.kg,
      datum: letzte.datum,
    });
    const bewertung = { gut: ", sicher", langsam: ", langsamer als 0,5 %", "zu-schnell": ", schneller als 2 %", zunahme: "" };
    const tempo = r
      ? `${r.prozent < 0 ? "Zunahme " : ""}${zahl(Math.abs(r.prozent), 1)} % pro Woche${bewertung[r.bewertung] ?? ""}`
      : `gewogen am ${datumText(letzte.datum)}`;
    const kopf = r ? `Letzte Messung <b>${sicher(r.titel.split(" seit")[0])}</b>` : `<b>${zahl(letzte.kg, 2)} kg</b>`;
    gewichtText = `<p>${kopf}<br><span class="leise">${tempo}</span></p>`;
  }
  $("heute-gewicht").innerHTML = `<section class="karte" aria-label="Gewicht in den letzten 8 Wochen">
      <div class="mini-zeile">${miniKurve(achtWochen(gewichte, tag))}${gewichtText}</div></section>`;

  // Leckerli: gleiche Basis wie die Leckerli-Warnung in warnungen().
  const lk = leckerliKachel({ tag, heute, kcal: summe.kcal, leckerli, freigabe, warnungAktiv: liste.some((w) => w.id === "leckerli") });
  const anteilText =
    lk.anteil === null ? (lk.amTagesende ? "wird am Tagesende bewertet" : "") : `${zahl(lk.anteil * 100)} % der Tages-kcal · Grenze 10 %`;
  const breite = lk.anteil === null ? 0 : Math.min(100, (lk.anteil / GRENZEN.leckerliMax) * 100);
  $("heute-leckerli").innerHTML = `<section class="karte leckerli-zeile" aria-label="Leckerli">
      <div class="oben"><span class="label">Leckerli</span><span class="wert">${zahl(lk.kcal)} <small class="leise">kcal</small></span></div>
      ${anteilText ? `<span class="leise">${anteilText}</span>` : ""}
      ${lk.anteil === null ? "" : `<span class="balken sofort${lk.stufe === "achtung" ? " gefahr" : ""}"><i style="--w: ${breite.toFixed(1)}%"></i></span>`}</section>`;
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
            ? `<button type="button" class="waegung-foto-knopf" data-aktion="waegung-foto-ansehen" data-id="${g.id}" aria-label="Foto vom ${datumText(g.datum)} ansehen"><img class="waegung-foto" src="${sicher(g.foto)}" alt=""></button>`
            : "";
          return `<div class="zeile">${bild}<span class="name"><b>${zahl(g.kg, 2)} kg</b><small>${datumText(g.datum)}${g.notiz ? " · " + sicher(g.notiz) : ""}</small></span>
            ${marke}
            <button type="button" class="knopf-loeschen" data-aktion="gewicht-loeschen" data-id="${g.id}" aria-label="Gewicht vom ${datumText(g.datum)} löschen">${SYMBOL.loeschen}</button></div>`;
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
  return `<button type="button" class="zeile zeile-knopf tippbar" data-aktion="futter-bearbeiten" data-id="${f.id}">
    <span class="icon" aria-hidden="true">${TYP_SYMBOL[f.typ]}</span>
    <span class="name">${sicher(f.name)}<small>${TYP_NAMEN[f.typ]} · ${zahl(f.kcalPro100g, f.kcalPro100g % 1 ? 1 : 0)} kcal/100 g</small></span>
    <span class="marke marke-${f.kcalQuelle}">${QUELLE_NAMEN[f.kcalQuelle]}</span><span class="nur-vorlesen">, ändern</span>
  </button>`;
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


function freigabeVonTier(stichtag) {
  return aktuelleFreigabe(daten.freigaben.filter((f) => f.tierId === tier.id), stichtag);
}

function zeichneFreigabe() {
  const freigabe = freigabeVonTier();
  $("titel-tierarzt").textContent = daten.tiere.length > 1 ? `Tierarzt · ${tier.name}` : "Tierarzt";
  const tafel = freigabeTafel(freigabe);
  $("freigabe-tafel").innerHTML = tafel
    ? `<div class="eckdaten">${tafel.felder
        .map((f) => `<div><span class="label">${sicher(f.titel)}</span><strong>${sicher(f.wert)}</strong></div>`)
        .join("")}</div>
      <p class="leise">${[tafel.zeile, tafel.befund, tafel.notiz].filter(Boolean).map(sicher).join(" · ")}</p>`
    : '<p class="leise">Noch keine Freigabe eingetragen.</p>';
  const link = telefonLink(tier.tierarzt?.telefon);
  $("praxis-anrufen").hidden = !link;
  if (link) {
    $("praxis-anrufen").href = link;
    $("praxis-anrufen").innerHTML = `<span data-symbol="telefon">${SYMBOL.telefon}</span>` +
      `<span class="text">${sicher(tier.tierarzt.praxis ?? "Praxis")} anrufen</span>` +
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
      return `<button type="button" class="eintrag eintrag-tier" data-aktion="profil-oeffnen" data-id="${t.id}" aria-label="Profil von ${sicher(t.name)} bearbeiten">
        ${profilHtml(t, "klein")}
        <span class="text"><b>${sicher(t.name)}</b>
          <small>${sicher(zusammen || "Profil")}</small>
          ${fehlt ? "<small>Profil ergänzen: Alter, Körperbau, Tierarzt</small>" : ""}${aktiv}</span>
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

function verlaufKopf() {
  const erste = gewichteSortiert(daten.gewichte.filter((g) => g.tierId === tier.id)).at(-1);
  const seit = erste ? ` · seit dem ${new Date(erste.datum + "T12:00").toLocaleDateString("de-DE")}` : "";
  return `<div class="verlauf-kopf">${profilHtml(tier, "klein")}<div><h2>Verlauf</h2><p>${sicher(tier.name)}${seit}</p></div></div>`;
}

// Vorher/Nachher: ältestes und neuestes Foto an Wägungen; fehlt eins, steht der gezeichnete Katzenkopf da.
function vorherNachherKarte() {
  const { vorher, nachher } = vorherNachher(daten.gewichte, tier.id);
  const seite = (titel, w, leer) =>
    `<figure class="vn-seite">
      ${w ? `<img src="${sicher(w.foto)}" alt="${titel}: ${sicher(tier.name)} am ${datumText(w.datum)}">` : `<div class="vn-platzhalter" role="img" aria-label="${titel}: noch kein Foto">${SYMBOL.katzenkopf}<span>Noch kein Foto</span></div>`}
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
  </section>`;
}

function zeichneVerlaufAnsicht() {
  $("verlauf-inhalt").innerHTML = zeichneVerlauf({
    gewichte: daten.gewichte.filter((g) => g.tierId === tier.id),
    mahlzeiten: daten.mahlzeiten.filter((m) => m.tierId === tier.id),
    freigaben: daten.freigaben.filter((f) => f.tierId === tier.id),
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
    fotos: $("bericht-fotos").checked,
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

// Nach dem Schließen eines Blatts zurück zu dem Knopf, der es geöffnet hat. Wurde die Liste dahinter neu gezeichnet
// (z. B. nach dem Speichern einer Mahlzeit), ist der alte Knopf weg: dann den neuen mit gleicher Aktion und Kennung
// suchen. Sonst stünde der Fokus am Seitenanfang und die Vorlesefunktion finge oben wieder an.
let oeffner = null;
for (const dialog of document.querySelectorAll("dialog")) {
  dialog.addEventListener("close", () => {
    const merk = oeffner;
    requestAnimationFrame(() => {
      // Beim close-Ereignis steht der Fokus oft noch im (jetzt geschlossenen) Blatt, danach fällt er auf body.
      const fokus = document.activeElement;
      const verloren = !fokus || fokus === document.body || !fokus.isConnected || fokus.closest("dialog:not([open])");
      if (!merk?.aktion || !verloren) return;
      const passend = [...document.querySelectorAll(`[data-aktion="${CSS.escape(merk.aktion)}"]`)].filter((el) => el.getClientRects().length);
      const knopf = passend.find((el) => el.dataset.id === merk.id) ?? passend[0];
      knopf?.focus({ preventScroll: true });
    });
  });
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
function beimSpeichern(formId, fehlerId, pruefenUndSpeichern) {
  $(formId).addEventListener("submit", (ereignis) => {
    if (ereignis.submitter?.value !== "speichern") return;
    speicherFehler = false;
    // Rückgabe: Fehlertext (Dialog bleibt offen) oder { toast } für eine eigene Erfolgsmeldung.
    const ergebnis = pruefenUndSpeichern(new FormData($(formId)));
    if (typeof ergebnis === "string") {
      ereignis.preventDefault();
      zeigeFehler(fehlerId, ergebnis);
    } else if (!speicherFehler) {
      zeigeToast(ergebnis?.toast ?? "✓ Gespeichert");
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

// − / + in 5-g-Schritten; eintippen bleibt möglich.
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

// Gewicht eintragen: große Zahl, ±10 g, sofortige Rückmeldung zum Tempo.
// Das Feld bleibt leer (das letzte Gewicht steht nur als Platzhalter da), damit nie ungewogen gespeichert wird.
// ±10 g startet bei leerem Feld vom letzten Gewicht.
// Foto im Gewicht-Dialog: erst beim Speichern übernommen, Abbrechen verwirft es.
let gewichtFoto = null;
let fotoNachgeholt = false; // „Monatsfoto nachholen“ angetippt
let fotoLauf = 0; // zählt Dialog-Öffnungen und Bildauswahlen, damit ein spät fertiges Bild nicht im falschen Dialog landet

function zeigeGewichtFoto() {
  const vorschau = $("gewicht-foto-vorschau");
  vorschau.hidden = !gewichtFoto;
  if (gewichtFoto) vorschau.src = gewichtFoto;
  else vorschau.removeAttribute("src");
  $("gewicht-foto-entfernen").hidden = !gewichtFoto;
  $("gewicht-foto-knopf").textContent = gewichtFoto ? "Anderes Foto" : "Foto hinzufügen";
  zeigeFotoAngebot();
}

// Foto-Feld offen nur am Foto-Tag (letzter Wiegetag im Monat, Datum im Dialog); sonst höchstens ein ruhiger Link, solange das Monatsfoto fehlt.
// Ein schon gewähltes Foto bleibt sichtbar, damit man es wieder entfernen kann.
function zeigeFotoAngebot() {
  const angebot = fotoAngebot({ gewichte: daten.gewichte, tierId: tier.id, datum: $("form-gewicht").datum.value, wiegetag: tier.wiegetag });
  const offen = angebot === "fototag" || Boolean(gewichtFoto) || (angebot === "nachholen" && fotoNachgeholt);
  $("gewicht-foto-bereich").hidden = !offen;
  $("gewicht-foto-nachholen").hidden = offen || angebot !== "nachholen";
  $("gewicht-foto-wiegetag-tipp").hidden = Number.isInteger(tier.wiegetag) || angebot === "keins";
  // Foto gewählt, und der Foto-Zeitraum hat schon eins: vorher sagen, nicht erst beim Speichern.
  const belegt = gewichtFoto ? fotoImZeitraum(daten.gewichte, tier.id, $("form-gewicht").datum.value, tier.wiegetag) : null;
  $("gewicht-foto-belegt").hidden = !belegt;
  if (belegt) $("gewicht-foto-belegt").textContent = `Seit dem letzten Foto-Tag gibt es schon ein Monatsfoto (vom ${datumText(belegt.datum)}). Beim Speichern fragt die App, ob das neue es ersetzen soll.`;
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

function oeffneGewicht() {
  const form = $("form-gewicht");
  form.reset();
  $("gewicht-titel").textContent = `Gewicht von ${tier.name}`;
  zeigeFehler("gewicht-fehler", "");
  form.datum.value = tagSchluessel(new Date());
  form.datum.max = tagSchluessel(new Date());
  const letzte = gewichteSortiert(eigeneGewichte())[0];
  form.kg.placeholder = letzte ? zahl(letzte.kg, 2) : "0,00";
  gewichtFoto = null;
  fotoNachgeholt = false;
  fotoLauf += 1;
  zeigeGewichtFoto();
  armZuruecksetzen(letzte);
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
    ? `Bei ${tier.name} sind 1 % des Gewichts ${prozentInGramm(letzte.kg, 1)} g. ` +
      `Schon 100 g sind bei ${tier.name} so viel wie etwa ${zahl(menschVergleich(letzte.kg), 1)} kg bei einem Menschen mit 75 kg. ` +
      `Die Leitlinien nennen als Abnahme ${zahl(GRENZEN.abnahmeMin, 1)}–${GRENZEN.abnahmeMax} % pro Woche, ` +
      `das sind ${prozentInGramm(letzte.kg, GRENZEN.abnahmeMin)}–${prozentInGramm(letzte.kg, GRENZEN.abnahmeMax)} g.`
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
    // Damit der Tierarzt im Bericht sieht, woher der Wert kommt (sichtbar und änderbar).
    if (!form.notiz.value.trim()) {
      form.notiz.value = ARM_NOTIZ;
      armNotizGesetzt = true;
    }
  } else {
    // Ein Wert, den der Bereich selbst eingetragen hat, passt nicht mehr: wieder leeren. Eigene Eingaben bleiben.
    if (armKg && form.kg.value === armKg) form.kg.value = "";
    armKg = "";
    // Ebenso die vorgeschlagene Notiz, sonst stünde beim Tierarzt eine falsche Herkunft des Werts.
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
  const letzte = gewichteSortiert(eigeneGewichte())[0];
  const jetzt = leseZahl(form.kg.value) ?? letzte?.kg ?? null;
  if (jetzt === null) return form.kg.focus();
  const neu = Math.min(20, Math.max(0.5, Math.round((jetzt + schritt) * 100) / 100));
  form.kg.value = zahl(neu, 2);
  zeigeGewichtRueckmeldung();
}

$("form-gewicht").addEventListener("input", zeigeGewichtRueckmeldung);
// Anderes Datum = evtl. Foto-Tag oder anderer Foto-Zeitraum.
$("form-gewicht").datum.addEventListener("change", zeigeFotoAngebot);
$("form-gewicht").datum.addEventListener("input", zeigeFotoAngebot);

beimSpeichern("form-gewicht", "gewicht-fehler", (werte) => {
  const kg = leseZahl(werte.get("kg"));
  if (!kg || kg < 0.5 || kg > 20) return "Bitte ein Gewicht zwischen 0,5 und 20 kg eingeben, z. B. 9,32.";
  const eintrag = { id: neueId(), tierId: tier.id, kg, datum: werte.get("datum"), notiz: werte.get("notiz").trim() };
  // Höchstens ein Monatsfoto (Zeitraum ab dem letzten Wiegetag im Monat): das neue ersetzt nach Rückfrage das alte, sonst ohne Foto.
  let ersetzt = null;
  if (gewichtFoto) {
    const vorhanden = fotoImZeitraum(daten.gewichte, tier.id, eintrag.datum, tier.wiegetag);
    const ersetzen =
      !vorhanden ||
      confirm(`Seit dem letzten Foto-Tag gibt es schon ein Monatsfoto (vom ${datumText(vorhanden.datum)}). Soll das neue Foto es ersetzen?\n\n„Abbrechen“ speichert das Gewicht ohne das neue Foto.`);
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

// Foto einer Wägung groß ansehen und einzeln entfernen (die Wägung bleibt).
let angesehen = null;
let tauschLauf = 0; // wie fotoLauf: nur die zuletzt gewählte Datei im selben geöffneten Dialog zählt

function oeffneFoto(waegung) {
  if (!waegung || !fotoGueltig(waegung.foto)) return;
  angesehen = waegung;
  $("foto-titel").textContent = `Foto vom ${datumText(waegung.datum)}`;
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

function fotoEntfernen() {
  const waegung = angesehen;
  if (!waegung) return;
  if (!confirm("Dieses Foto entfernen? Das Gewicht bleibt gespeichert. Das Foto lässt sich nicht zurückholen, außer aus einer Sicherung.")) return;
  delete waegung.foto;
  $("dialog-foto").close();
  if (sichern()) zeigeToast("✓ Foto entfernt");
  // Der Knopf mit dem Vorschaubild ist weg: Fokus auf die Wägungsliste statt ins Leere.
  const liste = $("gewicht-monate");
  liste.tabIndex = -1;
  liste.addEventListener("blur", () => liste.removeAttribute("tabindex"), { once: true });
  liste.focus({ preventScroll: true });
}

$("dialog-foto").addEventListener("close", () => {
  angesehen = null;
  tauschLauf += 1;
  $("foto-gross").removeAttribute("src");
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

// Nummer aus dem Scanner für eine neue eigene Sorte; wird beim Speichern an der Sorte gemerkt.
let neueEan = null;

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
  const kcal = leseZahl(werte.get("kcal"));
  if (!name) return "Bitte einen Namen eingeben.";
  if (!werte.get("typ")) return "Bitte die Art wählen.";
  if (!kcal || kcal < 20 || kcal > 700) return "Bitte einen kcal-Wert zwischen 20 und 700 pro 100 g eingeben.";
  if (!werte.get("quelle")) return "Bitte angeben, woher der Wert stammt.";
  const felder = { name, typ: werte.get("typ"), kcalPro100g: kcal, kcalQuelle: werte.get("quelle") };
  if (bearbeitetesFutter) {
    Object.assign(bearbeitetesFutter, felder);
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
      ${e.diaet ? '<p class="leise"><strong>Diätfutter vom Tierarzt:</strong> nur nach Rücksprache.</p>' : ""}
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
  if (!confirm(einleseFrage(neu, pruefung, ersetzen))) return;
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
    case "gramm-minus":
      return grammSchritt(-5);
    case "gramm-plus":
      return grammSchritt(5);
    case "kg-minus":
      return kgSchritt(-0.01);
    case "kg-plus":
      return kgSchritt(0.01);
    case "mahlzeit-loeschen":
      if (confirm("Diese Mahlzeit löschen?")) {
        daten.mahlzeiten = daten.mahlzeiten.filter((m) => m.id !== id);
        sichern();
      }
      return;
    case "gewicht-neu":
      return oeffneGewicht();
    case "waegung-foto-ansehen":
      return oeffneFoto(daten.gewichte.find((g) => g.id === id));
    case "waegung-foto-entfernen":
      return fotoEntfernen();
    case "waegung-foto-tauschen":
      return $("foto-tauschen-datei").click();
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
      gewichtFoto = null;
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
