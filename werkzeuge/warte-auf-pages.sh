#!/usr/bin/env bash
# Wartet nach einem Push, bis GitHub Pages den neuen Cache ausliefert.
# Stefans Regel (06.11.2026): Hängt ein Pages-Lauf länger als 2 Minuten, abbrechen und einen neuen starten.
# Aufruf: bash werkzeuge/warte-auf-pages.sh kilossos-v119
ziel="$1"
repo="stefanpude/Kilossos"
neu_gestartet=""
[ -z "$ziel" ] && { echo "Bitte den neuen CACHE_NAME angeben, z. B. kilossos-v119"; exit 2; }
for i in $(seq 1 60); do
  if curl -s "https://stefanpude.github.io/Kilossos/sw.js?x=$RANDOM" | grep -q "\"$ziel\""; then
    echo "live: $ziel"; date; exit 0
  fi
  lauf=$(gh run list -R "$repo" -L 1 --json databaseId,status,createdAt --jq '.[0] | "\(.databaseId) \(.status) \(.createdAt)"')
  id=${lauf%% *}; rest=${lauf#* }; status=${rest%% *}; start=${rest#* }
  if [ "$status" != "completed" ]; then
    alter=$(( $(date +%s) - $(date -d "$start" +%s) ))
    if [ "$alter" -gt 120 ] && [ "$neu_gestartet" != "$id" ]; then
      echo "Lauf $id hängt seit $alter s: abbrechen und neu anstoßen"
      gh run cancel "$id" -R "$repo" >/dev/null
      sleep 5
      gh api -X POST "repos/$repo/pages/builds" --jq .status
      sleep 10
      neu_gestartet=$(gh run list -R "$repo" -L 1 --json databaseId --jq '.[0].databaseId')
    fi
  fi
  sleep 15
done
echo "nach 15 Min. noch nicht live"; gh run list -R "$repo" -L 3
exit 1
