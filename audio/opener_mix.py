"""Score + sound design for the opener (frames 0-840 @60fps, 120 BPM)."""
import numpy as np
import soundfile as sf
from synth import *  # noqa

DUR = 840 / FPS + 1.5
music = Track(DUR)
drums = Track(DUR)
fx = Track(DUR)
amb = Track(DUR)

# note frequencies
F1, Ab1, Bb1, Db2, Eb2, F2 = 43.65, 51.91, 58.27, 69.30, 77.78, 87.31
C4, Eb4, F4, G4, Ab4, Bb4, C5, Eb5, F5 = 261.6, 311.1, 349.2, 392.0, 415.3, 466.2, 523.3, 622.3, 698.5

# ---------------------------------------------------------------- RAR cold open (f0-256)
amb.place(drone(4.3, (F1, F2, 130.8), attack=1.2), 0, 0.75)
amb.place(pad([174.6, 207.7, 261.6, 392.0], 4.3, amp=0.10, cutoff=1800, attack=1.2), 0.0, 1.0)
fx.place(reverse_swell(1.9, 12000), fr(120) - 1.9, 0.55)
fx.place(riser(1.6, 180, 1400), fr(120) - 1.6, 0.35)
for i, f0 in enumerate([30, 36, 42, 46]):  # corner labels decode
    for j in range(6):
        fx.place(tick(3800 + 400 * ((i + j) % 3), amp=0.10), fr(f0 + j * 2.2), 1, pan=(-0.7 if i % 2 == 0 else 0.7))
# THE HIT: title + mark
fx.place(impact(3.2, 120, 30), fr(120), 1.0)
fx.place(kick(0.8, 1.2, 180, 38), fr(120), 0.9)
fx.place(whoosh(0.45, 2000, 9000, 0, 0) * 0.5, fr(118), 0.6)
fx.place(shimmer(2093, 2.0, 0.10), fr(120), 1, pan=-0.3)
fx.place(shimmer(3136, 2.0, 0.07), fr(122), 1, pan=0.3)
for j in range(8):  # letters rising
    fx.place(tick(5200 - j * 180, amp=0.07), fr(120 + j * 2.4), 1, pan=-0.8 + j * 0.2)
# INTRODUCING decode
for j in range(11):
    fx.place(tick(2600 + (j % 4) * 500, amp=0.09), fr(180 + j * 1.6), 1, pan=-0.5 + j * 0.1)
fx.place(shimmer(1568, 1.2, 0.08), fr(196), 1)
# interference -> CRT off -> static
fx.place(glitch(0.45), fr(214), 0.9)
fx.place(crt_off(), fr(238), 0.9)
fx.place(static_burst(0.42, 0.55), fr(250), 1.0)

# ---------------------------------------------------------------- Tune in (f262-480)
fx.place(static_burst(3.7, 0.12), fr(262), 1.0)
fx.place(tuning_sweep(1.1, 700, 2600), fr(262), 0.8, pan=-0.2)
fx.place(tuning_sweep(1.3, 2400, 900, wobble=11), fr(330), 0.6, pan=0.3)
fx.place(beep(660, 0.14), fr(270), 1.0)           # red
fx.place(beep(880, 0.14), fr(300), 1.0)           # amber
fx.place(beep(1320, 0.10), fr(360), 1.0)          # green
fx.place(beep(1320, 0.10), fr(366), 0.9)
# pulse enters on green: filtered kicks on the beat, building
for b in range(4):
    fx.place(lp(kick(0.4, 0.8), 400), fr(360 + b * 30), 0.45 + b * 0.1)
fx.place(riser(1.95, 150, 2400), fr(360), 0.5)
fx.place(reverse_swell(1.0, 14000), fr(420), 0.5)
fx.place(whoosh(0.35, 400, 6000, -0.5, 0.5), fr(446), 0.8)  # CRT reveal on the site
# silence gap f470-480, then the drop

# ---------------------------------------------------------------- The drop: logo slam + beat (f480-)
DROP = fr(480)
fx.place(impact(2.5, 100, 34), DROP, 0.8)
fx.place(slap(1.0), DROP, 0.9)
fx.place(tick(3000, amp=0.2), fr(510), 1)  # chip pops
for j in range(25):  # typewriter url
    fx.place(ui_click(0.10), fr(540 + j * 0.9), 1, pan=-0.3 + j * 0.02)
fx.place(whoosh(0.7, 200, 3000, 0.6, -0.6), fr(566), 0.9)  # pull-back into the browser
for d in (44, 50, 56, 62):  # stickers lift off
    fx.place(slap(0.55), fr(570 + d + 3), 0.7, pan=(-0.6 if d in (44, 56) else 0.6))

# beat: 16 steps per bar, step = 7.5 frames
STEP = BEAT_S / 4
bars = int((DUR - DROP) / (BEAT_S * 4)) + 1
roots = [F1, Db2 / 2, Ab1, Eb2 / 2]
kick_times = []
for bar in range(bars):
    t0 = DROP + bar * BEAT_S * 4
    root = roots[bar % 4]
    for st in (0, 6, 10):
        drums.place(kick(0.5), t0 + st * STEP, 0.95)
        kick_times.append(t0 + st * STEP)
    for st in (4, 12):
        drums.place(clap(), t0 + st * STEP, 0.55)
        drums.place(snare(), t0 + st * STEP, 0.25)
    for st in range(16):
        if st % 2 == 0 or (bar % 2 == 1 and st >= 12):
            drums.place(hat(open_=(st == 14 and bar % 2 == 0)), t0 + st * STEP, 0.5 if st % 4 == 0 else 0.32, pan=0.25)
    music.place(sub808(root, BEAT_S * 1.5, glide_from=root * 1.5 if bar % 2 else None), t0, 0.75)
    music.place(sub808(root, BEAT_S * 1.0), t0 + 6 * STEP, 0.6)
    music.place(sub808(root * 1.5 if bar % 2 else root, BEAT_S * 1.2), t0 + 10 * STEP, 0.6)
    # radio pluck hook (F minor pentatonic), bandpassed like it's coming off a transistor radio
    hook = [F4, Ab4, C5, Eb5, C5, Ab4, Bb4, G4] if bar % 2 == 0 else [F4, Ab4, C5, F5, Eb5, C5, Bb4, C5]
    for j, nte in enumerate(hook):
        music.place(bp(pluck(nte, 0.3, 0.2), 350, 5000), t0 + j * 2 * STEP, 1.0, pan=(-0.25 if j % 2 else 0.25))
    music.place(pad([roots[bar % 4] * 8, roots[bar % 4] * 8 * 1.189, roots[bar % 4] * 8 * 1.498], BEAT_S * 4, amp=0.05, cutoff=2400, attack=0.05), t0, 1.0)

# ---------------------------------------------------------------- mix
ir = reverb_ir(2.4)
fx_w = reverb(fx.buf, ir, 0.28)
amb_w = amb.buf * 0.7 + hp(reverb(amb.buf, reverb_ir(2.5, 3000, 5), 1.0).T, 160).T * 0.35
music_w = reverb(music.buf, reverb_ir(1.2, 6000, 9), 0.18)
music_sc = sidechain(music_w, kick_times, 0.55)
mix = drums.buf * 0.9 + music_sc * 0.8 + fx_w * 1.0 + amb_w * 0.9
# pre-drop silence gap
g = np.ones(len(mix)); a, b = int(fr(470) * SR), int(fr(480) * SR)
g[a:b] = np.linspace(1, 0, b - a) ** 3
mix *= g[:, None]
out = master(mix)[: int(840 / FPS * SR) + int(0.5 * SR)]
import os; sf.write(os.path.join(os.path.dirname(__file__), '..', 'public', 'audio', 'opener.wav'), out, SR, subtype='PCM_24')
print('wrote', out.shape[0] / SR, 's')
