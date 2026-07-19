#!/usr/bin/env bash
set -euo pipefail
P="/Users/openclaw-server/.openclaw/workspace/paperline/app/docs/portfolio"
S="$P/presentation-preview"
OUT="$P/Paperline_PowerPoint_Walkthrough.mp4"
AUDIO="$P/paperline-ops-agent-walkthrough.mp4"

# Audio-aligned slide plan (seconds):
#  0.0–12.5   slide 2: document AI problem
# 12.5–34.5   slide 1: Paperline / product introduction
# 34.5–42.5   slide 3: documents + end-to-end workflow
# 42.5–84.5   slide 4: cited extraction + approval-ready actions
# 84.5–124.5  slide 8: Stripe test mode + approval boundary + trace + NVIDIA direction
# 124.5–136.166 slide 10: recruiter close
# Each still except the last includes 0.5 s of overlap for crossfades.

ffmpeg -y \
  -loop 1 -t 13.0    -i "$S/slide-02.png" \
  -loop 1 -t 22.5    -i "$S/slide-01.png" \
  -loop 1 -t 8.5     -i "$S/slide-03.png" \
  -loop 1 -t 42.5    -i "$S/slide-04.png" \
  -loop 1 -t 40.5    -i "$S/slide-08.png" \
  -loop 1 -t 11.6667 -i "$S/slide-10.png" \
  -i "$AUDIO" \
  -filter_complex "\
    [0:v]scale=1920:1080:flags=lanczos,setsar=1,fps=30,format=yuv420p[v0];\
    [1:v]scale=1920:1080:flags=lanczos,setsar=1,fps=30,format=yuv420p[v1];\
    [2:v]scale=1920:1080:flags=lanczos,setsar=1,fps=30,format=yuv420p[v2];\
    [3:v]scale=1920:1080:flags=lanczos,setsar=1,fps=30,format=yuv420p[v3];\
    [4:v]scale=1920:1080:flags=lanczos,setsar=1,fps=30,format=yuv420p[v4];\
    [5:v]scale=1920:1080:flags=lanczos,setsar=1,fps=30,format=yuv420p[v5];\
    [v0][v1]xfade=transition=fade:duration=0.5:offset=12.5[x1];\
    [x1][v2]xfade=transition=fade:duration=0.5:offset=34.5[x2];\
    [x2][v3]xfade=transition=fade:duration=0.5:offset=42.5[x3];\
    [x3][v4]xfade=transition=fade:duration=0.5:offset=84.5[x4];\
    [x4][v5]xfade=transition=fade:duration=0.5:offset=124.5,format=yuv420p[vout]" \
  -map "[vout]" -map 6:a:0 \
  -c:v libx264 -preset slow -crf 18 -profile:v high -level 4.1 \
  -c:a copy \
  -movflags +faststart -shortest "$OUT"

echo "$OUT"
