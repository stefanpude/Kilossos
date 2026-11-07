// Erklärseiten (ab 0.30.0): „Begriffe kurz erklärt“ als Daten, damit Reihenfolge, Länge und Quellen testbar sind,
// dazu der Knopf vom Hinweis „Abnahme stockt“ zur Seite „Warum nimmt meine Katze nicht ab?“ (Text in index.html).
// Texte und Quellen: .planning/erklaerseiten.md. Feste Regel: keine Futtermengen, die legt nur die Tierarztpraxis fest.
import { aufklappKarte } from "./aufklappen.js";
import { FUTTERLISTE } from "./futterliste.js";

const sicher = (text) =>
  String(text).replace(/[&<>"']/g, (z) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[z]);

// Kleinster und größter kcal-Wert pro 100 g einer Futterart in der Kilossos-Futterliste, gerundet.
// So passen die Zahlen im Begriff „Nassfutter und Trockenfutter“ immer zur Liste.
export function kcalSpanne(typ) {
  const werte = FUTTERLISTE.filter((f) => f.typ === typ).map((f) => f.kcalPro100g);
  return [Math.round(Math.min(...werte)), Math.round(Math.max(...werte))];
}

const [trockenMin, trockenMax] = kcalSpanne("trocken");
const [nassMin, nassMax] = kcalSpanne("nass");

// Alphabetisch (localeCompare "de"), je 1 bis 3 Sätze, jede Erklärung mit Quelle. Ohne Abkürzungen mit Punkt
// im Text, sonst zählt der Test die Sätze falsch.
export const BEGRIFFE = [
  {
    id: "allein-ergaenzung",
    begriff: "Alleinfutter und Ergänzungsfutter",
    text:
      "Alleinfutter deckt in der Tagesmenge laut Packung den ganzen Bedarf an Nährstoffen. Ergänzungsfutter reicht " +
      "nur zusammen mit anderem Futter; dazu gehören die meisten Leckerlis, Snacks und Pasten und auch manches Nassfutter. Welche Art " +
      "es ist, steht auf jeder Packung.",
    quelle: "EU-Verordnung 767/2009, Art. 3 und 15; Leitfaden zur Kennzeichnung von Futtermitteln (BMLEH)",
  },
  {
    id: "analytische-bestandteile",
    begriff: "Analytische Bestandteile",
    text:
      "Diese Angaben stehen in Prozent auf jeder Packung: Rohprotein (Eiweiß), Rohfett, Rohfaser und Rohasche " +
      "(Mineralstoffe), bei Nassfutter auch die Feuchte. „Roh“ bezieht sich auf die Labormethode, mit der die Werte " +
      "bestimmt werden. Fehlt der kcal-Wert, lässt er sich aus diesen Zahlen schätzen, in der Kilossos-Futterliste " +
      "steht dann „geschätzt“.",
    quelle: "EU-Verordnung 767/2009, Anhang I Nr. 6 und Anhang VII; NRC 2006 (Schätzformel)",
  },
  {
    id: "barf",
    begriff: "BARF",
    text:
      "BARF steht für „biologisch artgerechtes rohes Futter“: rohes Fleisch, Innereien und oft Knochen, meist mit " +
      "Zusätzen. Die kcal hängen vor allem vom Fett im Fleisch ab, deshalb legst du BARF in Kilossos als eigene Sorte " +
      "mit der Art „Frischfleisch / BARF“ und dem kcal-Wert von der Packung oder aus dem Rationsplan an. Plane eine BARF-Ernährung mit der Tierarztpraxis, weil " +
      "selbst gemischte Rationen Nährstofflücken haben können und rohes Fleisch Keime enthalten kann.",
    quelle: "WSAVA Global Nutrition Committee, Raw Meat Based Diets for Pets (2021); NRC 2006",
  },
  {
    id: "bcs-mcs",
    begriff: "BCS und MCS",
    text:
      "Der BCS (Body Condition Score) zeigt auf einer Skala von 1 bis 9, wie viel Fett eine Katze trägt; ideal sind " +
      "4 und 5. Der MCS (Muscle Condition Score) beschreibt die Muskeln. Beide werden in der Tierarztpraxis mit Augen und " +
      "Händen bestimmt.",
    quelle: "WSAVA, Body-Condition-Score- und Muscle-Condition-Score-Tafeln für Katzen",
    mehr: { aktion: "bcs-erklaerung", text: "Mehr zum BCS" },
  },
  {
    id: "diaetfutter",
    begriff: "Diätfutter aus der Tierarztpraxis",
    text:
      "Als „Diätfutter“ darf nur Futter für besondere Ernährungszwecke verkauft werden, das die EU eigens regelt. " +
      "Diätfutter zur Verringerung von Übergewicht liefert wenig Energie, soll dafür mehr Nährstoffe je kcal " +
      "enthalten und trägt den Rat, vorher in der Tierarztpraxis zu fragen. Die Leitlinien empfehlen es, wenn eine Katze zum " +
      "Abnehmen sehr wenig Futter bekommen soll, weil normales Futter dann zu wenig Vitamine und Mineralstoffe liefert.",
    quelle: "EU-Verordnung 767/2009, Art. 18; EU-Verordnung 2020/354, Anhang Teil B Nr. 25; AAHA 2021, Tabelle 8",
  },
  {
    id: "fettleber",
    begriff: "Fettleber (hepatische Lipidose)",
    text:
      "Frisst eine Katze nicht oder viel zu wenig, lagert sich Fett in der Leber ein, bis sie nicht mehr richtig " +
      "arbeitet. Übergewichtige Katzen trifft das besonders oft, und ohne schnelle Behandlung ist es lebensgefährlich. " +
      "Frisst deine Katze einen Tag lang nichts oder kaum etwas, gehört sie sofort in die Tierarztpraxis.",
    quelle: "Cornell Feline Health Center, Hepatic Lipidosis; Armstrong 2011 (WSAVA); AAHA 2014",
  },
  {
    id: "freigabe",
    begriff: "Freigabe (tierärztlich)",
    text:
      "So heißt in Kilossos, was deine Tierarztpraxis für die Abnahme festlegt: Zielgewicht und Tagesmenge in kcal, auf " +
      "Wunsch auch BCS und MCS. Mit der Freigabe vergleicht Kilossos jeden Tag die Fütterung mit dieser Menge und " +
      "bewertet das Tempo der Abnahme. Du trägst sie unter „Mehr“ bei „Tierarztpraxis“ ein.",
    quelle: "AAHA 2014 und 2021 (Zielgewicht und Tagesmenge legt die Tierarztpraxis fest)",
  },
  {
    id: "kcal-me",
    begriff: "kcal und ME",
    text:
      "kcal (Kilokalorien) messen die Energie im Futter. Steht ein Energiewert auf der Packung, ist es meist die " +
      "umsetzbare Energie (ME), also der Teil, den die Katze nach der Verdauung wirklich nutzen kann. Kilossos rechnet " +
      "mit kcal pro 100\u00a0g; kcal pro Kilogramm teilst du durch 10, kJ pro 100\u00a0g durch 4,2.",
    quelle: "NRC 2006; EU-Verordnung 767/2009 mit DIN EN 16967 (Berechnung des Energiewerts)",
  },
  {
    id: "light-sterilised",
    begriff: "Light und Sterilised",
    text:
      "Nach den Regeln des europäischen Herstellerverbands FEDIAF soll Light-Futter mindestens 15\u00a0% weniger Energie " +
      "haben als vergleichbares Futter. Für „Sterilised“ (Futter für kastrierte Katzen) gibt es keine solche Grenze, " +
      "und manche Sterilised-Beutel in der Kilossos-Futterliste haben mehr kcal als manches normale Nassfutter. " +
      "Vergleiche deshalb immer die kcal pro 100\u00a0g.",
    quelle: "FEDIAF Code of Good Labelling Practice for Pet Food (2019), 5.2.4.5; Kilossos-Futterliste",
  },
  {
    id: "nass-trocken",
    begriff: "Nassfutter und Trockenfutter",
    text:
      "Nassfutter besteht zu drei Vierteln oder mehr aus Wasser, Trockenfutter zu etwa einem Zehntel oder weniger. " +
      `Deshalb hat Trockenfutter pro Gramm ein Vielfaches an kcal (in der Kilossos-Futterliste ${trockenMin} bis ` +
      `${trockenMax} kcal pro 100\u00a0g, Nassfutter ${nassMin} bis ${nassMax}). Kilossos rechnet beides in kcal um, ` +
      "damit du es mit der freigegebenen Tagesmenge vergleichen kannst.",
    quelle: "Kilossos-Futterliste (Hersteller- und Packungsangaben, einzelne Werte aus den Analysewerten geschätzt)",
  },
  {
    id: "rer",
    begriff: "RER (Ruheenergiebedarf)",
    text:
      "Der RER ist die Energie, die eine Katze am Tag in Ruhe verbraucht; berechnet wird er aus dem Körpergewicht. " +
      "Beim Abnehmen setzt die Tierarztpraxis dafür das Zielgewicht ein, weil das heutige Gewicht zu viel Energie ergäbe. " +
      "Kilossos nutzt den RER nur für Warnungen und schlägt damit keine Futtermenge vor.",
    quelle: "NRC 2006; AAHA 2014; Armstrong 2011 (WSAVA)",
  },
  {
    // Seit 0.65.0 (Ideen-Tafel, Stefan 06.11.2026). Neutral: Stand der Forschung und Haltung eines Fachverbands,
    // keine eigene Bewertung, keine Sorten, keine Mengen. Am 13.11. in der Tierarztpraxis gegenlesen lassen.
    id: "vegan",
    begriff: "Vegan und vegetarisch",
    text:
      "Katzen sind Fleischfresser: Taurin, Arachidonsäure und Vitamin A müssen sie fertig mit dem Futter aufnehmen, " +
      "veganes oder vegetarisches Katzenfutter setzt sie künstlich zu. Wie gut das auf Dauer klappt, ist wenig erforscht " +
      "(die Studien sind klein oder beruhen auf Angaben der Halter), und der britische tierärztliche Fachverband rät bei Katzen " +
      "derzeit davon ab. Beim Abnehmen braucht die Katze genug Eiweiß, damit sie Fett und nicht Muskeln verliert, " +
      "deshalb besprich eine Umstellung vorher mit der Tierarztpraxis.",
    quelle:
      "NRC 2006; Domínguez-Oliva et al. 2023 (systematische Übersicht, Veterinary Sciences); Knight et al. 2023 " +
      "(Halter-Umfrage, PLOS ONE); British Veterinary Association 2024; AAHA 2014",
  },
  {
    id: "zielgewicht",
    begriff: "Zielgewicht",
    text:
      "Das Zielgewicht ist das Gewicht, das deine Katze am Ende der Abnahme haben soll. Die Tierarztpraxis leitet es zum " +
      "Beispiel aus dem BCS ab, wobei jeder Punkt über 5 ungefähr 10\u00a0% zu viel Gewicht bedeutet. In Kilossos steht es in der " +
      "tierärztlichen Freigabe.",
    quelle: "AAHA 2014; Flanagan et al. 2018",
  },
];

// Ein Begriff als aufklappbare Karte (zu Beginn zugeklappt), die Quelle steht unter der Erklärung.
export function begriffKarte({ id, begriff, text, quelle, mehr }) {
  const knopf = mehr
    ? `<button type="button" class="knopf-text" data-aktion="${sicher(mehr.aktion)}">${sicher(mehr.text)}</button>`
    : "";
  return aufklappKarte({
    id: `begriff-${id}`,
    klasse: "begriff",
    kopf: `<span class="zusammen">${sicher(begriff)}</span>`,
    inhalt: `<p>${sicher(text)}</p>${knopf}<span class="quelle">Quelle: ${sicher(quelle)}</span>`,
  });
}

export function begriffeHtml() {
  return BEGRIFFE.map(begriffKarte).join("");
}

// Hinweise auf „Heute“, die zu einer Erklärseite führen (Schlüssel = id aus warnungen() in js/rechnen.js).
const HINWEIS_KNOEPFE = {
  stillstand: { aktion: "warum-nicht-ab", text: "Warum nimmt meine Katze nicht ab?" },
  "abend-nichts-eingetragen": { aktion: "mahlzeit-neu", text: "Mahlzeit eintragen" },
};

export function hinweisKnopf(id) {
  if (!Object.hasOwn(HINWEIS_KNOEPFE, id ?? "")) return "";
  const { aktion, text } = HINWEIS_KNOEPFE[id];
  return `<button type="button" class="knopf-text" data-aktion="${sicher(aktion)}">${sicher(text)}</button>`;
}
