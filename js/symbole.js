// Linien-Icons als Inline-SVG (Design „Wiegeprotokoll“, ab 0.23.0) statt Emoji.
// Strichfarbe = Textfarbe (currentColor), Größe über CSS (.ico). Alle Icons sind Schmuck: aria-hidden.

const ico = (pfade, klasse = "") =>
  `<svg class="ico${klasse ? " " + klasse : ""}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${pfade}</svg>`;

export const SYMBOL = {
  heute: ico('<path d="M4 11l8-6 8 6v8a1 1 0 0 1-1 1h-4v-5h-6v5H5a1 1 0 0 1-1-1z"/>'),
  gewicht: ico('<rect x="4" y="5" width="16" height="15" rx="3"/><path d="M8.5 11a3.5 3.5 0 0 1 7 0M12 11l1.6-2"/>'),
  verlauf: ico('<path d="M4 19h16M5 15l4-4 3 3 6-7"/>'),
  futter: ico('<path d="M4 12h16a8 8 0 0 1-16 0zM9 8c0-1.5 1-2.5 1-4M13 8c0-1.5 1-2.5 1-4"/>'),
  mehr: ico('<path d="M5 7h14M5 12h14M5 17h14"/>'),
  // Futterarten
  nass: ico('<ellipse cx="12" cy="7" rx="7" ry="2.5"/><path d="M5 7v10c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5V7M5 12c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5"/>'),
  trocken: ico('<path d="M4 12h16a8 8 0 0 1-16 0z"/><circle cx="9" cy="9.5" r="1.2"/><circle cx="12.5" cy="8.5" r="1.2"/><circle cx="15.5" cy="10" r="1.2"/>'),
  leckerli: ico('<path d="M8 12a4 4 0 1 0 8 0a4 4 0 1 0-8 0M8 12l-4-3v6zM16 12l4-3v6z"/>'),
  unbekannt: ico('<circle cx="12" cy="12" r="8"/><path d="M9.8 9.5a2.3 2.3 0 1 1 3 2.2c-.6.2-.8.7-.8 1.3M12 16.2v.1"/>'),
  // Sonstiges
  tierarzt: ico('<rect x="4" y="6" width="16" height="13" rx="2"/><path d="M9 6V4.5h6V6M12 9.5v6M9 12.5h6"/>'),
  telefon: ico('<path d="M6.5 4h3l1.5 4-2 1.3a10 10 0 0 0 5.7 5.7L16 13l4 1.5v3a2 2 0 0 1-2.2 2A15.5 15.5 0 0 1 4.5 6.2 2 2 0 0 1 6.5 4z"/>'),
  kamera: ico('<path d="M4 8.5a1.5 1.5 0 0 1 1.5-1.5h2.2L9 5h6l1.3 2h2.2A1.5 1.5 0 0 1 20 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17.5z"/><circle cx="12" cy="13" r="3.2"/>'),
  loeschen: ico('<path d="M7 7l10 10M17 7L7 17"/>'),
  plus: ico('<path d="M12 5v14M5 12h14"/>'),
  minus: ico('<path d="M5 12h14"/>'),
  zurueck: ico('<path d="M14.5 6l-6 6 6 6"/>'),
  weiter: ico('<path d="M9.5 6l6 6-6 6"/>'),
  runter: ico('<path d="M6 9.5l6 6 6-6"/>'),
  haken: ico('<path d="M5.5 12.5l4 4 9-9"/>'),
  // „Mehr“ (ab 0.24.0)
  kalender: ico('<rect x="4" y="5.5" width="16" height="14" rx="2"/><path d="M4 10h16M8.5 3.5v4M15.5 3.5v4"/>'),
  darstellung: ico('<circle cx="12" cy="12" r="7.5"/><path d="M12 4.5a7.5 7.5 0 0 1 0 15z"/>'),
  dokument: ico('<path d="M7 3.5h7l4 4v13H7z"/><path d="M14 3.5v4h4M9.5 12h6M9.5 15.5h6"/>'),
  sichern: ico('<path d="M12 4v10M8 10l4 4 4-4M5 16v3h14v-3"/>'),
  einlesen: ico('<path d="M12 14V4M8 8l4-4 4 4M5 16v3h14v-3"/>'),
  buch: ico('<path d="M5 5.5A1.5 1.5 0 0 1 6.5 4H12v15.5H6.5A1.5 1.5 0 0 0 5 21zM12 4h5.5A1.5 1.5 0 0 1 19 5.5V21a1.5 1.5 0 0 0-1.5-1.5H12"/>'),
  // Platzhalter, solange eine Wägung kein Foto hat (ab 0.25.0)
  katzenkopf: ico('<circle cx="12" cy="13.5" r="7"/><path d="M6.4 9.2 5.6 3.8l4.3 3.4M17.6 9.2l.8-5.4-4.3 3.4M11.2 15.3h1.6L12 16.3z"/><circle cx="9.4" cy="12.6" r=".5"/><circle cx="14.6" cy="12.6" r=".5"/><path d="M2.8 14.4l4.4.6M3.2 17.4l4-1M21.2 14.4l-4.4.6M20.8 17.4l-4-1"/>'),
  info: ico('<circle cx="12" cy="12" r="8"/><path d="M12 11v5.5M12 7.8v.1"/>'),
  waage: ico('<rect x="4" y="5" width="16" height="15" rx="3"/><path d="M8.5 11a3.5 3.5 0 0 1 7 0M12 11l1.6-2"/>'),
  // „Korrigieren oder löschen“ an der Freigabe-Tafel (ab 0.35.1)
  stift: ico('<path d="M4.5 19.5l1-4.2L15.8 5a2.1 2.1 0 0 1 3 3L8.5 18.5z"/><path d="M13.8 7l3 3"/>'),
};
SYMBOL.frage = SYMBOL.unbekannt;
