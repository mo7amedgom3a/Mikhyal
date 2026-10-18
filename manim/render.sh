#!/usr/bin/env bash
# Render Mikhyal Discovery clips with Manim Community and register them for the app.
# Requires: pip install manim (plus its system deps: Cairo, Pango, FFmpeg, a LaTeX distribution).
set -euo pipefail
cd "$(dirname "$0")"
OUT=../public/clips
SCENES=(BrakingDerivation OhmRelation FountainVertex TimeDilation)
mkdir -p "$OUT"
for s in "${SCENES[@]}"; do
  manim -qm --format mp4 -o "$s" scenes/discovery.py "$s"
  cp "media/videos/discovery/720p30/$s.mp4" "$OUT/$s.mp4"
done
python3 - "$OUT" <<'PY'
import json, os, sys
out = sys.argv[1]
clips = sorted(f for f in os.listdir(out) if f.endswith(".mp4"))
json.dump(clips, open(os.path.join(out, "clips.json"), "w"))
print("registered:", clips)
PY
