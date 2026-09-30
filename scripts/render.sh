#!/usr/bin/env bash
# Build audio, render 1080p60 + 4K60 masters, and deliverable encodes (each < 100 MB for the repo).
set -euo pipefail
cd "$(dirname "$0")/.."
python3 audio/asmr_mix.py
npx remotion render src/index.ts Film out/master_1080p60.mp4 --concurrency=4 --crf=12 --audio-codec=aac --audio-bitrate=320k --log=error
npx remotion render src/index.ts Film out/master_2160p60.mp4 --scale=2 --concurrency=3 --crf=14 --audio-codec=aac --audio-bitrate=320k --log=error
mkdir -p deliverables
# Instagram (16:9 feed): H.264 High 1080p30 ~11 Mbps.
ffmpeg -v error -y -i out/master_1080p60.mp4 -vf fps=30 -c:v libx264 -profile:v high -preset slow -b:v 11M -maxrate 14M -bufsize 22M \
  -pix_fmt yuv420p -c:a aac -b:a 320k -ar 48000 -movflags +faststart deliverables/Signalroom_x_RiseAboveReality_launch_16x9_1080p30.mp4
# 4K: HEVC 2160p30 ~12.5 Mbps (fits GitHub's 100 MB limit; plays in QuickTime/iOS via hvc1 tag).
ffmpeg -v error -y -i out/master_2160p60.mp4 -vf fps=30 -c:v libx265 -preset slow -b:v 12500k -maxrate 16M -bufsize 25M -tag:v hvc1 \
  -pix_fmt yuv420p -x265-params log-level=error -c:a aac -b:a 320k -ar 48000 -movflags +faststart deliverables/Signalroom_x_RiseAboveReality_launch_16x9_4K_2160p30.mp4
cp public/audio/stem_sfx.wav deliverables/stem_sfx.wav
rm -f deliverables/stem_music.wav
echo done
