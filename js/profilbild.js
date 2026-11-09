// Profilbild-Großansicht (0.89.0, Plan .planning/profilbild-gross.md): reine Funktionen, in tests/profilbild-gross.test.js geprüft.
import { fotoGueltig } from "./daten.js";

// Mit gültigem Foto zeigt Antippen das Bild groß, ohne Foto bleibt das Menü (Profil bearbeiten / Foto wählen).
export function profilAktion(einTier) {
  return einTier && fotoGueltig(einTier.foto) ? "gross" : "menue";
}

// Verschiebung und Maßstab, mit denen das große Bild (ziel) genau auf dem kleinen (quelle) liegt.
// Beide als Rechteck { left, top, width, height }; gerechnet von der Bildmitte (transform-origin: center).
// Ohne sichtbare Quelle oder Ziel: null, dann wird nur ein- und ausgeblendet.
export function zoomVon(quelle, ziel) {
  if (!quelle || !ziel || !(quelle.width > 0) || !(ziel.width > 0)) return null;
  const x = quelle.left + quelle.width / 2 - (ziel.left + ziel.width / 2);
  const y = quelle.top + quelle.height / 2 - (ziel.top + ziel.height / 2);
  const s = quelle.width / ziel.width;
  return { x, y, s, transform: `translate(${x}px, ${y}px) scale(${s})` };
}
