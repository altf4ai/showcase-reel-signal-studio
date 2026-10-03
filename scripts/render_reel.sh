#!/usr/bin/env bash
# Client-reaction reel (Instagram 9:16, 1080x1920 @ 30fps)
#   1. grade pre-pass + 4x slow-mo clips (once; needs public/react/src.mp4 = the client's phone video)
#   2. audio: room re-cut + SFX + score -> reel_music.wav / reel_nomusic.wav at -14 LUFS
#   3. Remotion render (picture only)
#   4. final encode: soft film grain over everything (captions included), mux each audio version
set -euo pipefail
cd "$(dirname "$0")/.."
[ -f public/react/graded.mp4 ] || ./reaction/prep.sh
for n in hook cheer reveal verdict; do [ -f public/react/slo_$n.mp4 ] || { ./reaction/slomo.sh; break; }; done
python3 audio/reel_mix.py
mkdir -p out/reel
npx remotion render src/index.ts ReactionReel out/reel/master.mp4 --concurrency=4 --crf=10 --muted --log=error

OUT=deliverables/reaction-reel
NAME=Signalroom_client-reaction_reel_9x16_1080p30
mkdir -p "$OUT"
DUR=$(python3 -c "import json;d=json.load(open('src/reaction/edl.json'));print(sum(s['dur'] for s in d['shots'])/d['fps'])")
# grain: luma-only noise made at half resolution and scaled up (reads as film grain, not sensor noise),
# laid over the picture in overlay mode so it lives in the midtones
GRAIN="[0:v]format=yuv420p[v];color=c=black:s=540x960:r=30:d=${DUR},format=yuv420p,lutyuv=y=128:u=128:v=128,noise=c0s=50:c0f=t+u,scale=1080:1920:flags=bicubic[g];\
[v][g]blend=all_mode=overlay:all_opacity=0.22,format=yuv420p[out]"
enc() { # $1 audio wav, $2 output, $3 video bitrate
  ffmpeg -v error -y -i out/reel/master.mp4 -i "$1" -filter_complex "$GRAIN" -map "[out]" -map 1:a \
    -c:v libx264 -profile:v high -preset slow -tune grain -b:v "$3" -maxrate "$3" -bufsize 20M -g 30 -pix_fmt yuv420p \
    -color_primaries bt709 -color_trc bt709 -colorspace bt709 \
    -c:a aac -b:a 256k -ar 48000 -shortest -movflags +faststart "$2"
}
enc public/react/reel_music.wav   "$OUT/${NAME}_MUSIC.mp4"    14M
enc public/react/reel_nomusic.wav "$OUT/${NAME}_NO-MUSIC.mp4" 14M
cp public/react/reel_stem_room.wav public/react/reel_stem_sfx.wav public/react/reel_stem_music.wav "$OUT/"
echo "reel done"
