import { laden, speichern, istGueltig, neueId, dauerhaftSpeichern, futterNachId } from "./js/daten.js";
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
  warnungen,
} from "./js/rechnen.js";

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

const TYP_NAMEN = { nass: "Nassfutter", trocken: "Trockenfutter", leckerli: "Leckerli" };
const QUELLE_NAMEN = { packung: "Packung", hersteller: "Hersteller", ungefaehr: "ungefähr", geschaetzt: "geschätzt" };

let daten;
try {
  daten = laden();
} catch (fehler) {
  document.querySelector("main").innerHTML =
    `<div class="karte"><h2>Daten konnten nicht geladen werden</h2><p>${sicher(fehler.message)}</p></div>`;
  throw fehler;
}
const tier = daten.tiere[0]; // vorerst nur Kito sichtbar, das Datenmodell kann mehrere Tiere
let gewaehlterTag = new Date();

function sichern() {
  speichern(daten);
  zeichneAlles();
}

// ---------- Ansichten ----------

function zeigeAnsicht(name) {
  document.querySelectorAll(".ansicht").forEach((el) => (el.hidden = el.dataset.ansicht !== name));
  document.querySelectorAll(".leiste button").forEach((knopf) => {
    if (knopf.dataset.ziel === name) knopf.setAttribute("aria-current", "page");
    else knopf.removeAttribute("aria-current");
  });
}

function tagTitel(datum) {
  const heute = tagSchluessel(new Date());
  const gestern = tagSchluessel(new Date(Date.now() - 86400000));
  const schluessel = tagSchluessel(datum);
  if (schluessel === heute) return "Heute";
  if (schluessel === gestern) return "Gestern";
  return datum.toLocaleDateString("de-DE", { weekday: "short", day: "numeric", month: "long" });
}

function zeichneHeute() {
  const tag = tagSchluessel(gewaehlterTag);
  const futter = futterNachId(daten);
  const mahlzeiten = mahlzeitenAm(daten.mahlzeiten.filter((m) => m.tierId === tier.id), tag);
  const summe = tagesSumme(mahlzeiten, futter);
  const freigabe = freigabeVonTier();
  const gewichte = daten.gewichte.filter((g) => g.tierId === tier.id);

  const liste = warnungen({
    name: tier.name,
    tag,
    heute: tagSchluessel(new Date()),
    kcal: summe.kcal,
    leckerli: leckerliKcal(mahlzeiten, futter),
    freigabe,
    gewichte,
    fruehereMahlzeiten: daten.mahlzeiten.some((m) => m.tierId === tier.id && tagSchluessel(new Date(m.zeitpunkt)) < tag),
  });
  $("warnungen-liste").innerHTML = liste
    .map((w) => `<li class="warnung warnung-${w.art}">${sicher(w.text)}<span class="quelle">Quelle: ${sicher(w.quelle)}</span></li>`)
    .join("");

  $("summe-freigabe").textContent = freigabe ? `von ${zahl(freigabe.kcalProTag)} kcal freigegeben` : "";
  $("summe-freigabe").hidden = !freigabe;
  $("tag-titel").textContent = tagTitel(gewaehlterTag);
  document.querySelector('[data-aktion="tag-vor"]').disabled = tag >= tagSchluessel(new Date());
  $("summe-kcal").textContent = (summe.unsicher ? "ca. " : "") + zahl(summe.kcal);
  $("summe-gramm").textContent = zahl(summe.gramm);
  $("summe-hinweis").hidden = !summe.unsicher;
  $("mahlzeiten-leer").hidden = mahlzeiten.length > 0;

  $("mahlzeiten-liste").innerHTML = mahlzeiten
    .map((m) => {
      const f = futter.get(m.futterId);
      const uhrzeit = new Date(m.zeitpunkt).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
      const kcal = f ? zahl(kcalFuer(m.gramm, f.kcalPro100g)) + " kcal" : "kcal unbekannt";
      return `<li>
        <div><strong>${sicher(f ? f.name : "Gelöschte Sorte")}</strong>
          <span class="leise">${uhrzeit} · ${zahl(m.gramm)} g · ${kcal}</span></div>
        <button class="knopf-loeschen" data-aktion="mahlzeit-loeschen" data-id="${m.id}" aria-label="Mahlzeit löschen">✕</button>
      </li>`;
    })
    .join("");
}

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
  $("gewicht-liste").innerHTML = gewichte
    .map(
      (g) => `<li>
        <div><strong>${zahl(g.kg, 2)} kg</strong>
          <span class="leise">${datumText(g.datum)}${g.notiz ? " · " + sicher(g.notiz) : ""}</span></div>
        <button class="knopf-loeschen" data-aktion="gewicht-loeschen" data-id="${g.id}" aria-label="Gewicht löschen">✕</button>
      </li>`
    )
    .join("");
}

function zeichneFutter() {
  $("futter-liste").innerHTML = daten.futter
    .map(
      (f) => `<li class="tippbar" data-aktion="futter-bearbeiten" data-id="${f.id}">
        <div><strong>${sicher(f.name)}</strong>
          <span class="leise">${TYP_NAMEN[f.typ]} · ${zahl(f.kcalPro100g)} kcal/100 g</span></div>
        <span class="marke marke-${f.kcalQuelle}">${QUELLE_NAMEN[f.kcalQuelle]}</span>
      </li>`
    )
    .join("");
}

function datumText(iso) {
  const [j, m, t] = iso.split("-").map(Number);
  return new Date(j, m - 1, t).toLocaleDateString("de-DE", { day: "numeric", month: "short", year: "numeric" });
}

function freigabeVonTier() {
  return aktuelleFreigabe(daten.freigaben.filter((f) => f.tierId === tier.id));
}

function zeichneFreigabe() {
  const freigabe = freigabeVonTier();
  $("freigabe-text").textContent = freigabe
    ? `${zahl(freigabe.zielgewichtKg, 1)} kg Zielgewicht · ${zahl(freigabe.kcalProTag)} kcal pro Tag · ` +
      `${freigabe.tierarzt}, ${datumText(freigabe.datum)}${freigabe.notiz ? " · " + freigabe.notiz : ""}`
    : "Noch keine Freigabe eingetragen.";
}

function zeichneAlles() {
  $("tiername").textContent = tier.name;
  zeichneHeute();
  zeichneGewicht();
  zeichneFutter();
  zeichneFreigabe();
}

// ---------- Formulare ----------

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
    }
  });
}

function oeffneMahlzeit() {
  const form = $("form-mahlzeit");
  form.reset();
  zeigeFehler("mahlzeit-fehler", "");
  const legende = '<legend>Futter</legend>';
  $("mahlzeit-futter").innerHTML =
    legende +
    daten.futter
      .map(
        (f, i) => `<label><input type="radio" name="futter" value="${f.id}" ${i === 0 ? "checked" : ""} required>
          ${sicher(f.name)} <span class="leise">${zahl(f.kcalPro100g)} kcal/100 g</span></label>`
      )
      .join("");
  const jetzt = new Date();
  form.uhrzeit.value = `${String(jetzt.getHours()).padStart(2, "0")}:${String(jetzt.getMinutes()).padStart(2, "0")}`;
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

$("form-mahlzeit").addEventListener("input", zeigeMahlzeitVorschau);

beimSpeichern("form-mahlzeit", "mahlzeit-fehler", (werte) => {
  const gramm = leseZahl(werte.get("gramm"));
  if (!gramm || gramm > 1000) return "Bitte eine Menge zwischen 1 und 1000 g eingeben.";
  const [stunde, minute] = werte.get("uhrzeit").split(":").map(Number);
  const zeitpunkt = new Date(gewaehlterTag);
  zeitpunkt.setHours(stunde, minute, 0, 0);
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

function oeffneFreigabe() {
  const form = $("form-freigabe");
  form.reset();
  zeigeFehler("freigabe-fehler", "");
  form.datum.value = tagSchluessel(new Date());
  form.datum.max = tagSchluessel(new Date());
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
  });
  sichern();
});

let bearbeitetesFutter = null;

function oeffneFutter(futter) {
  bearbeitetesFutter = futter;
  const form = $("form-futter");
  form.reset();
  zeigeFehler("futter-fehler", "");
  $("futter-titel").textContent = futter ? "Sorte ändern" : "Eigene Sorte";
  $("futter-loeschen").hidden = !futter;
  if (futter) {
    form.name.value = futter.name;
    form.typ.value = futter.typ;
    form.kcal.value = String(futter.kcalPro100g).replace(".", ",");
    form.quelle.value = futter.kcalQuelle;
  }
  $("futter-notiz").textContent = futter?.notiz ?? "";
  $("futter-notiz").hidden = !futter?.notiz;
  $("dialog-futter").showModal();
}

beimSpeichern("form-futter", "futter-fehler", (werte) => {
  const name = werte.get("name").trim();
  const kcal = leseZahl(werte.get("kcal"));
  if (!name) return "Bitte einen Namen eingeben.";
  if (!kcal || kcal < 20 || kcal > 700) return "Bitte einen kcal-Wert zwischen 20 und 700 pro 100 g eingeben.";
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

// ---------- Sicherung ----------

function exportieren() {
  const datei = new Blob([JSON.stringify(daten, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(datei);
  link.download = `kilossos-sicherung-${tagSchluessel(new Date())}.json`;
  link.click();
  URL.revokeObjectURL(link.href);
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
  const anzahl = `${neu.mahlzeiten.length} Mahlzeiten und ${neu.gewichte.length} Gewichte`;
  if (!confirm(`Sicherung mit ${anzahl} einlesen? Alle Einträge auf diesem Handy werden dadurch ersetzt.`)) return;
  speichern(neu);
  location.reload();
});

async function zeigeSpeicherStatus() {
  const dauerhaft = await dauerhaftSpeichern();
  $("speicher-status").textContent = dauerhaft
    ? "Der Browser hält die Daten dauerhaft fest."
    : "Hinweis: Der Browser könnte die Daten bei Speichermangel löschen – Sicherungen sind deshalb wichtig.";
}

// ---------- Klicks ----------

document.addEventListener("click", (ereignis) => {
  const ziel = ereignis.target.closest("[data-ziel], [data-aktion]");
  if (!ziel) return;
  if (ziel.dataset.ziel) return zeigeAnsicht(ziel.dataset.ziel);

  const id = ziel.dataset.id;
  switch (ziel.dataset.aktion) {
    case "tag-zurueck":
      gewaehlterTag = new Date(gewaehlterTag.getFullYear(), gewaehlterTag.getMonth(), gewaehlterTag.getDate() - 1);
      return zeichneHeute();
    case "tag-vor":
      gewaehlterTag = new Date(gewaehlterTag.getFullYear(), gewaehlterTag.getMonth(), gewaehlterTag.getDate() + 1);
      return zeichneHeute();
    case "mahlzeit-neu":
      return oeffneMahlzeit();
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
    case "freigabe-neu":
      return oeffneFreigabe();
    case "export":
      return exportieren();
  }
});

zeichneAlles();
zeigeSpeicherStatus();
