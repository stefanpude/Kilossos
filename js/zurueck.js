// Zurücktaste des Handys (seit 0.88.0, .planning/zuruecktaste.md). Ohne eigene Verlaufseinträge schloss Android
// die installierte App beim ersten Druck auf Zurück. Hier wird aus dem, was gerade zu sehen ist (Ansicht und Zahl
// offener Fenster), der passende Verlaufsstapel abgeleitet und mit dem Browser-Verlauf abgeglichen:
//   Heute                       → [Heute]                       Zurück schließt die App
//   Gewicht/Verlauf/Futter/Mehr → [Heute, Seite]                Zurück führt zu Heute
//   Übersicht (bericht)         → [Heute, Mehr, Übersicht]      Zurück führt zu Mehr
//   je offenem Fenster ein Eintrag mehr                         Zurück schließt das oberste Fenster
// Kein DOM hier: app.js liefert lesen() und anwenden(), die Tests einen nachgebauten Verlauf.

const GRUND = "heute";

export function sollStapel({ ansicht, fenster }) {
  const stapel = [{ ansicht: GRUND, fenster: 0 }];
  if (ansicht === "bericht") stapel.push({ ansicht: "mehr", fenster: 0 });
  if (ansicht !== GRUND) stapel.push({ ansicht, fenster: 0 });
  for (let i = 1; i <= fenster; i++) stapel.push({ ansicht, fenster: i });
  return stapel;
}

export function zustandAus(state) {
  if (!state || typeof state !== "object" || state.kilossos !== 1) return null;
  return { ansicht: state.ansicht, fenster: state.fenster };
}

const gleich = (a, b) => a.ansicht === b.ansicht && a.fenster === b.fenster;

// null: passt schon. { zurueck: n }: n Einträge zurück, danach neu abgleichen.
// { ersetzen, neu }: obersten Eintrag ersetzen (falls nicht null), dann die neuen anhängen.
export function abgleichPlan(ist, soll) {
  const a = sollStapel(ist);
  const b = sollStapel(soll);
  let p = 0;
  while (p < a.length && p < b.length && gleich(a[p], b[p])) p++;
  const zuViel = a.length - p;
  if (zuViel === 0) return b.length === p ? null : { ersetzen: null, neu: b.slice(p) };
  if (zuViel === 1 && b.length > p) return { ersetzen: b[p], neu: b.slice(p + 1) };
  return { zurueck: zuViel - (b.length > p ? 1 : 0) };
}

const eintrag = ({ ansicht, fenster }) => ({ kilossos: 1, ansicht, fenster });

// verlauf: window.history (oder ein Nachbau). lesen(): { ansicht, fenster } wie gerade sichtbar.
// anwenden(ziel): Fenster schließen / Ansicht wechseln, nachdem der Nutzer Zurück gedrückt hat.
export function zuruecktaste({ verlauf, lesen, anwenden, planen = queueMicrotask, uhr = setTimeout, warteMs = 600 }) {
  let gestartet = false;
  let geplant = false;
  let wartet = 0; // Nummer des laufenden go(); 0 = keins
  let zaehler = 0;

  const istZustand = () => zustandAus(verlauf.state) ?? { ansicht: GRUND, fenster: 0 };

  function jetztAbgleichen() {
    if (!gestartet || wartet) return;
    const soll = lesen();
    const plan = abgleichPlan(istZustand(), soll);
    if (!plan) return;
    if (plan.zurueck) {
      const nummer = ++zaehler;
      wartet = nummer;
      verlauf.go(-plan.zurueck);
      // Am Anfang des Verlaufs kommt kein popstate: dann den Eintrag passend machen statt es erneut zu versuchen.
      uhr(() => {
        if (wartet !== nummer) return;
        wartet = 0;
        verlauf.replaceState(eintrag(soll), "");
      }, warteMs);
      return;
    }
    if (plan.ersetzen) verlauf.replaceState(eintrag(plan.ersetzen), "");
    for (const neu of plan.neu) verlauf.pushState(eintrag(neu), "");
  }

  function abgleichen() {
    if (geplant) return;
    geplant = true;
    planen(() => {
      geplant = false;
      jetztAbgleichen();
    });
  }

  return {
    starten() {
      gestartet = true;
      if (!zustandAus(verlauf.state)) verlauf.replaceState(eintrag({ ansicht: GRUND, fenster: 0 }), "");
      abgleichen();
    },
    abgleichen,
    beiPopstate(state) {
      if (wartet) {
        // Unser eigenes go(): nichts anwenden, nur nachziehen, was inzwischen passiert ist.
        wartet = 0;
        return abgleichen();
      }
      anwenden(zustandAus(state) ?? { ansicht: GRUND, fenster: 0 });
      abgleichen();
    },
  };
}
