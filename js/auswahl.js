// Auswahlmenü statt Ankreuzliste: ein Feld zeigt den gewählten Wert, beim Antippen klappt ein Menü auf.
// Der Wert steht in einem versteckten <input>, damit FormData und die Formular-Logik unverändert bleiben.
// Gibt es nur eine Möglichkeit (und keine Zusatz-Aktion), wird der Wert fest angezeigt, ohne Menü.
// Alle Knöpfe haben type="button" – sonst würde ein Klick das <form method="dialog"> abschicken.
import { SYMBOL } from "./symbole.js";

const sicher = (text) =>
  String(text).replace(/[&<>"']/g, (z) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[z]);

const anzeige = (option) => `${sicher(option.text)}${option.zusatz ? `<small>${sicher(option.zusatz)}</small>` : ""}`;

// beschriftung: id des Elements mit der Überschrift (z. B. „Futtersorte“), damit die Vorlesefunktion sie mitliest.
export function auswahlFeld({ name, optionen, wert, platzhalter = "Bitte wählen", extra = [], beschriftung }) {
  const knopfId = `auswahl-${sicher(name)}`;
  const label = beschriftung ? ` aria-labelledby="${sicher(beschriftung)} ${knopfId}"` : "";
  const gewaehlt = optionen.find((o) => o.wert === wert);
  const feld = `<input type="hidden" name="${sicher(name)}" value="${sicher(gewaehlt ? wert : "")}">`;
  if (optionen.length === 1 && extra.length === 0) {
    const einzige = optionen[0];
    return `<div class="auswahl-fest"><span>${anzeige(einzige)}</span></div>` +
      `<input type="hidden" name="${sicher(name)}" value="${sicher(einzige.wert)}">`;
  }
  const eintraege = optionen
    .map((o) => {
      const an = o.wert === gewaehlt?.wert;
      return `<li role="option" tabindex="-1" data-wert="${sicher(o.wert)}" data-text="${sicher(o.text)}" data-zusatz="${sicher(o.zusatz ?? "")}" aria-selected="${an}"><span>${anzeige(o)}</span><span class="haken" aria-hidden="true">✓</span></li>`;
    })
    .concat(extra.map((e) => `<li role="option" tabindex="-1" class="extra" data-aktion="${sicher(e.aktion)}" aria-selected="false">${sicher(e.text)}</li>`))
    .join("");
  return `<div class="auswahl" data-auswahl="${sicher(name)}">
    ${feld}
    <button type="button" class="auswahl-knopf" id="${knopfId}"${label} aria-haspopup="listbox" aria-expanded="false"><span class="auswahl-text">${gewaehlt ? anzeige(gewaehlt) : `<span class="platzhalter">${sicher(platzhalter)}</span>`}</span><span class="pfeil" aria-hidden="true">${SYMBOL.runter}</span></button>
    <ul class="auswahl-menue" role="listbox">${eintraege}</ul>
  </div>`;
}

function schliessen(auswahl, fokus = false) {
  if (!auswahl) return;
  auswahl.classList.remove("offen");
  const knopf = auswahl.querySelector(".auswahl-knopf");
  knopf.setAttribute("aria-expanded", "false");
  if (fokus) knopf.focus();
}

// Freier Bereich für das Menü (oben/unten in Bildschirm-Koordinaten): sichtbarer Teil des Bildschirms
// (bei offener Tastatur kleiner). In einem Blatt (<dialog>) zusätzlich dessen Rand, denn das Blatt
// schneidet ab, was darüber hinausragt. Sonst ohne die untere Leiste, die über dem Menü liegt.
// Die Willkommensseite deckt die Leiste ab, dort zählt sie nicht.
function freierBereich(auswahl) {
  const sicht = window.visualViewport;
  let oben = sicht ? sicht.offsetTop : 0;
  let unten = sicht ? sicht.offsetTop + sicht.height : window.innerHeight;
  const blatt = auswahl.closest("dialog");
  if (blatt) {
    const rand = blatt.getBoundingClientRect();
    oben = Math.max(oben, rand.top);
    unten = Math.min(unten, rand.bottom);
  } else if (!auswahl.closest(".willkommen")) {
    // offsetParent taugt hier nicht: Bei position: fixed ist er immer null.
    const leiste = document.querySelector(".leiste");
    if (leiste && leiste.getClientRects().length > 0) unten = Math.min(unten, leiste.getBoundingClientRect().top);
  }
  return { oben, unten };
}

// Klappt das Menü nach oben auf, wenn es unten nicht passt und oben mehr Platz ist.
function richtungWaehlen(auswahl) {
  const menue = auswahl.querySelector(".auswahl-menue");
  auswahl.classList.remove("nach-oben");
  menue.style.maxHeight = "";
  const knopf = auswahl.querySelector(".auswahl-knopf").getBoundingClientRect();
  const bereich = freierBereich(auswahl);
  const abstand = 6 + 8; // Lücke zum Knopf + etwas Luft zum Rand
  const unten = bereich.unten - knopf.bottom - abstand;
  const oben = knopf.top - bereich.oben - abstand;
  const hoehe = menue.scrollHeight + 2; // + Rahmen
  if (hoehe <= unten || unten >= oben) {
    menue.style.maxHeight = `min(50dvh, ${Math.max(unten, 120)}px)`;
    return;
  }
  auswahl.classList.add("nach-oben");
  menue.style.maxHeight = `min(50dvh, ${Math.max(oben, 120)}px)`;
}

// Geht die Tastatur zu oder wird das Handy gedreht, ändert sich der Platz: offenes Menü neu ausrichten.
// typeof-Prüfung: Die Tests laden diese Datei in Node, dort gibt es kein window.
if (typeof window !== "undefined") window.visualViewport?.addEventListener("resize", () => {
  document.querySelectorAll(".auswahl.offen").forEach(richtungWaehlen);
});

function oeffnen(auswahl) {
  document.querySelectorAll(".auswahl.offen").forEach((a) => a !== auswahl && schliessen(a));
  richtungWaehlen(auswahl);
  auswahl.classList.add("offen");
  auswahl.querySelector(".auswahl-knopf").setAttribute("aria-expanded", "true");
  const ziel = auswahl.querySelector('[aria-selected="true"]') ?? auswahl.querySelector('[role="option"]');
  ziel?.focus();
}

function waehle(auswahl, option) {
  const feld = auswahl.querySelector('input[type="hidden"]');
  auswahl.querySelectorAll("[data-wert]").forEach((o) => o.setAttribute("aria-selected", String(o === option)));
  const zusatz = option.dataset.zusatz ? `<small>${sicher(option.dataset.zusatz)}</small>` : "";
  auswahl.querySelector(".auswahl-text").innerHTML = sicher(option.dataset.text) + zusatz;
  feld.value = option.dataset.wert;
  feld.dispatchEvent(new Event("input", { bubbles: true }));
  feld.dispatchEvent(new Event("change", { bubbles: true }));
  schliessen(auswahl, true);
}

export function auswahlAnmelden(wurzel) {
  wurzel.addEventListener("click", (ereignis) => {
    const auswahl = ereignis.target.closest?.(".auswahl");
    document.querySelectorAll(".auswahl.offen").forEach((a) => a !== auswahl && schliessen(a));
    if (!auswahl) return;
    if (ereignis.target.closest(".auswahl-knopf")) {
      if (auswahl.classList.contains("offen")) schliessen(auswahl);
      else oeffnen(auswahl);
      return;
    }
    const option = ereignis.target.closest('[role="option"]');
    if (!option) return;
    // Zusatz-Aktion (z. B. „Aus der Futterliste wählen“): Menü zu, der Klick läuft an app.js weiter.
    if (option.dataset.aktion) return schliessen(auswahl);
    waehle(auswahl, option);
  });

  wurzel.addEventListener("keydown", (ereignis) => {
    const auswahl = ereignis.target.closest?.(".auswahl");
    if (!auswahl) return;
    const optionen = [...auswahl.querySelectorAll('[role="option"]')];
    const jetzt = optionen.indexOf(document.activeElement);
    if (ereignis.key === "Escape" && auswahl.classList.contains("offen")) {
      ereignis.preventDefault();
      ereignis.stopPropagation(); // sonst schließt Escape gleich das ganze Blatt
      return schliessen(auswahl, true);
    }
    if (ereignis.key === "ArrowDown" || ereignis.key === "ArrowUp") {
      ereignis.preventDefault();
      if (!auswahl.classList.contains("offen")) return oeffnen(auswahl);
      const schritt = ereignis.key === "ArrowDown" ? 1 : -1;
      optionen[(jetzt + schritt + optionen.length) % optionen.length]?.focus();
      return;
    }
    if ((ereignis.key === "Enter" || ereignis.key === " ") && jetzt >= 0) {
      ereignis.preventDefault();
      optionen[jetzt].click();
    }
  });

  // Mit Tab aus dem Menü heraus: Menü schließen (sonst bleibt es offen über dem nächsten Feld stehen).
  wurzel.addEventListener("focusout", (ereignis) => {
    const auswahl = ereignis.target.closest?.(".auswahl");
    if (!auswahl || !auswahl.classList.contains("offen")) return;
    if (ereignis.relatedTarget && auswahl.contains(ereignis.relatedTarget)) return;
    // Ohne neues Ziel (z. B. Klick ins Leere) erledigt das der Klick-Listener.
    if (ereignis.relatedTarget) schliessen(auswahl);
  });
}
