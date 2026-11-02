// Auswahlmenü statt Ankreuzliste: ein Feld zeigt den gewählten Wert, beim Antippen klappt ein Menü auf.
// Der Wert steht in einem versteckten <input>, damit FormData und die Formular-Logik unverändert bleiben.
// Gibt es nur eine Möglichkeit (und keine Zusatz-Aktion), wird der Wert fest angezeigt, ohne Menü.
// Alle Knöpfe haben type="button" – sonst würde ein Klick das <form method="dialog"> abschicken.

const sicher = (text) =>
  String(text).replace(/[&<>"']/g, (z) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[z]);

const anzeige = (option) => `${sicher(option.text)}${option.zusatz ? `<small>${sicher(option.zusatz)}</small>` : ""}`;

export function auswahlFeld({ name, optionen, wert, platzhalter = "Bitte wählen", extra = [] }) {
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
    <button type="button" class="auswahl-knopf" aria-haspopup="listbox" aria-expanded="false"><span class="auswahl-text">${gewaehlt ? anzeige(gewaehlt) : `<span class="platzhalter">${sicher(platzhalter)}</span>`}</span><span class="pfeil" aria-hidden="true">⌄</span></button>
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

function oeffnen(auswahl) {
  document.querySelectorAll(".auswahl.offen").forEach((a) => a !== auswahl && schliessen(a));
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
}
