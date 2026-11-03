// Strichcode lesen mit der Kamera und der eingebauten Erkennung des Browsers (BarcodeDetector).
// Gibt es in Chrome auf Android, nicht in Chrome auf Windows und nicht in Firefox: dort bleibt nur das Eintippen.
// Die Kamera läuft nur, solange gescannt wird. Bilder werden nicht gespeichert und verlassen das Gerät nicht.

const FORMATE = ["ean_13", "ean_8", "upc_a"];

// Kann dieses Gerät Strichcodes mit der Kamera lesen?
export async function kameraScanMoeglich() {
  if (!("BarcodeDetector" in globalThis) || !navigator.mediaDevices?.getUserMedia) return false;
  try {
    const formate = await BarcodeDetector.getSupportedFormats();
    return FORMATE.some((format) => formate.includes(format));
  } catch {
    return false;
  }
}

// Startet Kamera und Erkennung im <video>. beiTreffer(nummer) bekommt jede gelesene Nummer und gibt true zurück,
// wenn sie passt; dann endet das Scannen. Eine Nummer zählt erst, wenn sie zweimal hintereinander gleich gelesen
// wurde (weniger Lesefehler). Rückgabe: Funktion zum Beenden. Wirft, wenn die Kamera nicht erlaubt ist.
export async function starteScanner(video, beiTreffer) {
  const formate = (await BarcodeDetector.getSupportedFormats()).filter((format) => FORMATE.includes(format));
  const erkenner = new BarcodeDetector({ formats: formate });
  const strom = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
  let aktiv = true;
  const beenden = () => {
    aktiv = false;
    for (const spur of strom.getTracks()) spur.stop();
    video.srcObject = null;
  };
  video.srcObject = strom;
  // Nicht auf play() warten: das kann hängen bleiben, und dann ließe sich die Kamera nicht mehr ausschalten.
  // Solange das Video nicht läuft, schlägt detect() fehl und die nächste Runde versucht es erneut.
  video.play().catch(() => {});
  let letzte = null;
  const runde = async () => {
    if (!aktiv) return;
    try {
      const nummer = (await erkenner.detect(video))[0]?.rawValue ?? null;
      if (nummer && nummer === letzte && beiTreffer(nummer)) return beenden();
      letzte = nummer;
    } catch {
      // Einzelbild nicht lesbar (z. B. Video noch nicht bereit): nächster Versuch
    }
    setTimeout(runde, 120);
  };
  runde();
  return beenden;
}
