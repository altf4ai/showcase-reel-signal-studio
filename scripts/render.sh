#!/usr/bin/env bash
# Build audio, render the master and an Instagram-ready 30fps version.
set -euo pipefail
cd "$(dirname "$0")/.."
python3 audio/film_mix.py
npx remotion render src/index.ts Film out/master_1080p60.mp4 --concurrency=3 --crf=12 --audio-codec=aac --audio-bitrate=320k --log=error
# Instagram feed (16:9): H.264 High, 1080p, 30fps, ~20 Mbps, AAC 320k, faststart.
ffmpeg -v error -y -i out/master_1080p60.mp4 -vf "fps=30" -c:v libx264 -profile:v high -preset slow -b:v 20M -maxrate 25M -bufsize 40M \
  -pix_fmt yuv420p -c:a aac -b:a 320k -ar 48000 -movflags +faststart out/instagram_1080p30.mp4
echo "done: out/master_1080p60.mp4, out/instagram_1080p30.mp4"
