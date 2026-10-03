#!/usr/bin/env bash
# 4x motion-interpolated slow-motion clips for the reel's speed ramps, graded with the same chain
# as prep.sh. Frame k of slo_<name>.mp4 == source frame (from + k/4). Ranges come from edl.json.
set -euo pipefail
cd "$(dirname "$0")/.."
SRC=${1:-public/react/src.mp4}
python3 - "$SRC" <<'PY'
import json, subprocess, sys
src = sys.argv[1]
edl = json.load(open('src/reaction/edl.json'))
for name, r in edl['slo'].items():
    a, b = r['from'], r['to']
    vf = (f"trim=start_frame={a}:end_frame={b + 1},setpts=PTS-STARTPTS,uspp=quality=4:qp=10,"
          "minterpolate=fps=120:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1:scd=none,setpts=4*PTS,fps=30,"
          "scale=1080:1920:flags=lanczos,cas=0.55,lut3d=file=reaction/grade.cube:interp=tetrahedral,format=gbrp,split[a][b];"
          "[b]curves=all='0/0 0.66/0 1/1',gblur=sigma=24,colorchannelmixer=rr=1:gg=0.40:bb=0.20[g];"
          "[a][g]blend=all_mode=screen:all_opacity=0.32,format=yuv420p")
    out = f'public/react/slo_{name}.mp4'
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', src, '-filter_complex', f'[0:v]{vf}[v]', '-map', '[v]', '-an',
                    '-c:v', 'libx264', '-preset', 'medium', '-crf', '14', '-g', '15', '-bf', '0', out], check=True)
    n = subprocess.run(['node_modules/@remotion/compositor-linux-x64-gnu/ffprobe', '-v', 'error', '-count_frames', '-select_streams', 'v:0',
                        '-show_entries', 'stream=nb_read_frames', '-of', 'csv=p=0', out], capture_output=True, text=True).stdout.strip()
    print(name, a, b, 'frames', n)
PY
