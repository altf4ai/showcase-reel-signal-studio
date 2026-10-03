#!/usr/bin/env bash
# Pre-pass for the client-reaction reel (source: the WhatsApp copy, 576x1024 @ 30fps).
#   deblock (uspp) -> lanczos to 1080x1920 -> CAS sharpen -> film LUT -> warm halation
# Output is short-GOP so Remotion can seek it frame-accurately. Grain is added at the very end
# (after captions) in scripts/render_reel.sh so everything shares one texture.
set -euo pipefail
cd "$(dirname "$0")/.."
SRC=${1:-public/react/src.mp4}
mkdir -p public/react
python3 reaction/grade_lut.py reaction/grade.cube
ffmpeg -v error -stats -y -i "$SRC" -filter_complex \
  "[0:v]uspp=quality=4:qp=10,scale=1080:1920:flags=lanczos,cas=0.55,lut3d=file=reaction/grade.cube:interp=tetrahedral,format=gbrp,split[a][b];\
[b]curves=all='0/0 0.66/0 1/1',gblur=sigma=24,colorchannelmixer=rr=1:gg=0.40:bb=0.20[g];\
[a][g]blend=all_mode=screen:all_opacity=0.32,format=yuv420p[v]" \
  -map "[v]" -an -c:v libx264 -preset medium -crf 14 -g 15 -bf 0 -x264-params keyint_min=15:scenecut=0 \
  public/react/graded.tmp.mp4
mv public/react/graded.tmp.mp4 public/react/graded.mp4
ffmpeg -v error -y -i "$SRC" -vn -ac 2 -ar 48000 -c:a pcm_s16le public/react/src_audio.wav
echo "prep done"
