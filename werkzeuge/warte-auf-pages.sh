#!/usr/bin/env bash
# Wartet nach einem Push, bis GitHub Pages den neuen Cache ausliefert.
# Seit 06.11.2026 abends (Stefans Ja): nur noch warten, NIE abbrechen oder neu anstoßen.
# Grund: Abbrechen nach 2 Minuten plus neuer Anstoß führte fünfmal in Folge zu „Deployment cancelled“;
# der erste Lauf ohne Eingriff war in 40 s durch. Scheitert ein Lauf, meldet das Skript es und hört auf.
# Aufruf: bash werkzeuge/warte-auf-pages.sh kilossos-v122
ziel="$1"
repo="stefanpude/Kilossos"
[ -z "$ziel" ] && { echo "Bitte den neuen CACHE_NAME angeben, z. B. kilossos-v122"; exit 2; }
start=$(date +%s)
for i in $(seq 1 40); do
  if curl -s "https://stefanpude.github.io/Kilossos/sw.js?x=$RANDOM" | grep -q "\"$ziel\""; then
    echo "live: $ziel nach $(( $(date +%s) - start )) s"; date; exit 0
  fi
  lauf=$(gh run list -R "$repo" -L 1 --json databaseId,status,conclusion,createdAt --jq '.[0] | "\(.databaseId) \(.status) \(if .conclusion == "" then "-" else .conclusion end) \(.createdAt)"')
  read -r id status ergebnis erstellt <<< "$lauf"
  # Nur Läufe zählen, die nach dem Start des Skripts (minus 2 Min. für den Push davor) begonnen haben.
  if [ "$status" = "completed" ] && [ "$ergebnis" != "success" ] && [ "$(date -d "$erstellt" +%s)" -ge $(( start - 120 )) ]; then
    echo "Lauf $id ist gescheitert ($ergebnis). Kein neuer Versuch, Stefan fragen."; date; exit 1
  fi
  sleep 15
done
echo "nach 10 Min. noch nicht live"; gh run list -R "$repo" -L 3
exit 1
