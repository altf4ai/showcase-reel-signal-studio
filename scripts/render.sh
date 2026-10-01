#!/usr/bin/env bash
# Build audio, render 1080p60 + 4K60 masters once (with the SFX-only track), then mux a music version of each.
set -euo pipefail
cd "$(dirname "$0")/.."
python3 audio/asmr_mix.py   # public/audio/film.wav (SFX only) + sfx_raw.npy
python3 audio/music.py      # public/audio/film_music.wav (music + SFX)
npx remotion render src/index.ts Film out/master_1080p60.mp4 --concurrency=4 --crf=12 --audio-codec=aac --audio-bitrate=320k --log=error
npx remotion render src/index.ts Film out/master_2160p60.mp4 --scale=2 --concurrency=3 --crf=14 --audio-codec=aac --audio-bitrate=320k --log=error
mkdir -p deliverables
rm -f deliverables/*.mp4
NAME=Signalroom_x_RiseAboveReality_launch_16x9
enc1080() { ffmpeg -v error -y -i out/master_1080p60.mp4 -i "$1" -map 0:v -map 1:a -vf fps=30 -c:v libx264 -profile:v high -preset slow -b:v 11M -maxrate 14M -bufsize 22M \
  -pix_fmt yuv420p -c:a aac -b:a 320k -ar 48000 -shortest -movflags +faststart "$2"; }
enc4k() { ffmpeg -v error -y -i out/master_2160p60.mp4 -i "$1" -map 0:v -map 1:a -vf fps=30 -c:v libx265 -preset slow -b:v 12M -maxrate 16M -bufsize 24M -tag:v hvc1 \
  -pix_fmt yuv420p -x265-params log-level=error -c:a aac -b:a 320k -ar 48000 -shortest -movflags +faststart "$2"; }
enc1080 public/audio/film_music.wav deliverables/${NAME}_1080p30_MUSIC.mp4
enc1080 public/audio/film.wav       deliverables/${NAME}_1080p30_SFX-ONLY.mp4
enc4k   public/audio/film_music.wav deliverables/${NAME}_4K_MUSIC.mp4
enc4k   public/audio/film.wav       deliverables/${NAME}_4K_SFX-ONLY.mp4
cp public/audio/stem_sfx.wav deliverables/stem_sfx.wav
cp public/audio/stem_music.wav deliverables/stem_music.wav
echo done
