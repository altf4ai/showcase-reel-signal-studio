"""Full-film score + sound design. Timeline mirrors src/Film.tsx (60fps, 120 BPM, 30 frames/beat)."""
import os
import numpy as np
import soundfile as sf
from synth import *  # noqa

B = 30  # frames per beat
SECTIONS = [('opener', 840), ('about', 180), ('flurry', 60), ('story', 360), ('services', 360), ('proof', 120),
            ('bring', 300), ('why', 300), ('responsive', 360), ('cta', 300), ('end', 300)]
AT = {}
t = 0
for k, d in SECTIONS:
    AT[k] = t
    t += d
TOTAL = t
DUR = TOTAL / FPS + 2.0

music, drums, fx, amb = Track(DUR), Track(DUR), Track(DUR), Track(DUR)
F1, Ab1, Db2, Eb2, F2 = 43.65, 51.91, 69.30, 77.78, 87.31
F4, G4, Ab4, Bb4, C5, Eb5, F5 = 349.2, 392.0, 415.3, 466.2, 523.3, 622.3, 698.5
STEP = BEAT_S / 4
ROOTS = [F1, Db2 / 2, Ab1, Eb2 / 2]
kick_times = []
gaps = []  # (start_frame, end_frame) silence gaps before big hits


def beat(f0, f1, energy=1.0, halftime=False, hook=True, filt=None, bar_offset=0):
    """Lay the groove between two frames. energy scales hats/claps, filt=lowpass Hz for breakdowns."""
    bars = int(np.ceil((f1 - f0) / (B * 4)))
    d_tr, m_tr = Track(DUR), Track(DUR)
    for bar in range(bars):
        t0 = fr(f0) + bar * BEAT_S * 4
        root = ROOTS[(bar + bar_offset) % 4]
        kicks = (0, 10) if halftime else (0, 6, 10)
        for st in kicks:
            ts = t0 + st * STEP
            if ts < fr(f1):
                d_tr.place(kick(0.5), ts, 0.95)
                kick_times.append(ts)
        for st in ((8,) if halftime else (4, 12)):
            if t0 + st * STEP < fr(f1):
                d_tr.place(clap(), t0 + st * STEP, 0.55 * energy)
                d_tr.place(snare(), t0 + st * STEP, 0.25 * energy)
        for st in range(16):
            ts = t0 + st * STEP
            if ts >= fr(f1):
                break
            if st % 2 == 0 or (energy > 0.9 and (bar % 2 == 1 and st >= 12)):
                d_tr.place(hat(open_=(st == 14 and bar % 2 == 0)), ts, (0.5 if st % 4 == 0 else 0.32) * energy, pan=0.25)
        seg_end = fr(f1)
        for st, dur, g, gl in ((0, 1.5, 0.75, bar % 2), (6, 1.0, 0.6, 0), (10, 1.2, 0.6, 0)):
            ts = t0 + st * STEP
            if ts < seg_end:
                m_tr.place(sub808(root * (1.5 if (st == 10 and bar % 2) else 1), BEAT_S * dur, glide_from=root * 1.5 if gl else None), ts, g)
        if hook:
            notes = [F4, Ab4, C5, Eb5, C5, Ab4, Bb4, G4] if bar % 2 == 0 else [F4, Ab4, C5, F5, Eb5, C5, Bb4, C5]
            for j, n in enumerate(notes):
                ts = t0 + j * 2 * STEP
                if ts < seg_end:
                    m_tr.place(bp(pluck(n, 0.3, 0.2), 350, 5000), ts, 1.0, pan=(-0.25 if j % 2 else 0.25))
        m_tr.place(pad([root * 8, root * 8 * 1.189, root * 8 * 1.498], min(BEAT_S * 4, seg_end - t0), amp=0.05, cutoff=2400, attack=0.05), t0, 1.0)
    # trim to section
    a, b = int(fr(f0) * SR), int(fr(f1) * SR)
    for tr, dst in ((d_tr, drums), (m_tr, music)):
        seg = tr.buf[a:b].copy()
        if filt:
            seg = np.stack([lp(seg[:, c], filt, 4) for c in range(2)], axis=1)
        fade = min(len(seg), int(0.01 * SR))
        seg[-fade:] *= np.linspace(1, 0, fade)[:, None]
        dst.buf[a:b] += seg


# ================================================================ OPENER (0-840) — same cues as the approved test
amb.place(drone(4.3, (F1, F2, 130.8), attack=1.2), 0, 0.75)
amb.place(pad([174.6, 207.7, 261.6, 392.0], 4.3, amp=0.10, cutoff=1800, attack=1.2), 0.0, 1.0)
fx.place(reverse_swell(1.9, 12000), fr(120) - 1.9, 0.55)
fx.place(riser(1.6, 180, 1400), fr(120) - 1.6, 0.35)
for i, f0 in enumerate([30, 36, 42, 46]):
    for j in range(6):
        fx.place(tick(3800 + 400 * ((i + j) % 3), amp=0.10), fr(f0 + j * 2.2), 1, pan=(-0.7 if i % 2 == 0 else 0.7))
fx.place(impact(3.2, 120, 30), fr(120), 1.0)
fx.place(kick(0.8, 1.2, 180, 38), fr(120), 0.9)
fx.place(whoosh(0.45, 2000, 9000, 0, 0) * 0.5, fr(118), 0.6)
fx.place(shimmer(2093, 2.0, 0.10), fr(120), 1, pan=-0.3)
fx.place(shimmer(3136, 2.0, 0.07), fr(122), 1, pan=0.3)
for j in range(8):
    fx.place(tick(5200 - j * 180, amp=0.07), fr(120 + j * 2.4), 1, pan=-0.8 + j * 0.2)
for j in range(11):
    fx.place(tick(2600 + (j % 4) * 500, amp=0.09), fr(180 + j * 1.6), 1, pan=-0.5 + j * 0.1)
fx.place(shimmer(1568, 1.2, 0.08), fr(196), 1)
fx.place(whoosh(0.9, 150, 9000, -0.2, 0.2), fr(186), 0.9)   # dive into RAR's light streaks
fx.place(riser(0.9, 600, 6000), fr(186), 0.35)
fx.place(glitch(0.45), fr(214), 0.9)
fx.place(crt_off(), fr(238), 0.9)
fx.place(static_burst(0.42, 0.55), fr(250), 1.0)
fx.place(static_burst(3.7, 0.12), fr(262), 1.0)
fx.place(tuning_sweep(1.1, 700, 2600), fr(262), 0.8, pan=-0.2)
fx.place(tuning_sweep(1.3, 2400, 900, wobble=11), fr(330), 0.6, pan=0.3)
fx.place(beep(660, 0.14), fr(270), 1.0)
fx.place(beep(880, 0.14), fr(300), 1.0)
fx.place(beep(1320, 0.10), fr(360), 1.0)
fx.place(beep(1320, 0.10), fr(366), 0.9)
for b in range(4):
    fx.place(lp(kick(0.4, 0.8), 400), fr(360 + b * 30), 0.45 + b * 0.1)
fx.place(riser(1.95, 150, 2400), fr(360), 0.5)
fx.place(reverse_swell(1.0, 14000), fr(420), 0.5)
fx.place(whoosh(0.35, 400, 6000, -0.5, 0.5), fr(446), 0.8)
gaps.append((470, 480))
fx.place(impact(2.5, 100, 34), fr(480), 0.8)
fx.place(slap(1.0), fr(480), 0.9)
fx.place(tick(3000, amp=0.2), fr(510), 1)
for j in range(25):
    fx.place(ui_click(0.10), fr(540 + j * 0.9), 1, pan=-0.3 + j * 0.02)
fx.place(whoosh(0.7, 200, 3000, 0.6, -0.6), fr(566), 0.9)
for d in (44, 50, 56, 62):
    fx.place(slap(0.55), fr(570 + d + 3), 0.7, pan=(-0.6 if d in (44, 56) else 0.6))
beat(480, AT['flurry'])

# ================================================================ ABOUT (whip in)
fx.place(whip(), fr(AT['about']) - 0.08, 0.9)
fx.place(ui_click(0.3), fr(AT['about'] + 120), 1)

# ================================================================ FLURRY — 16th-note chaos
f0 = AT['flurry']
for st in range(8):
    ts = fr(f0 + st * 7.5)
    drums.place(kick(0.18, 0.9), ts, 0.7)
    fx.place(static_burst(0.07, 0.6), ts, 0.8, pan=(-0.6 if st % 2 else 0.6))
    fx.place(glitch(0.1), ts + 0.02, 0.6)
fx.place(riser(1.0, 400, 5000), fr(f0), 0.4)

# ================================================================ STORY — noise breakdown -> signal
s0 = AT['story']
fx.place(whoosh(0.4, 300, 5000, 0.8, -0.8), fr(s0), 0.9)  # tape wipe
fx.place(slap(0.6), fr(s0 + 4), 0.6)
noise_bed = bp(noise(int(3.0 * SR)), 500, 9000) * np.linspace(0.18, 0.05, int(3.0 * SR))
fx.place(noise_bed, fr(s0), 0.9)
fx.place(tuning_sweep(2.8, 500, 1800, wobble=5), fr(s0 + 20), 0.5)
beat(s0, s0 + 6 * B, energy=0.5, halftime=True, hook=False, filt=700)
for i in range(3):
    fx.place(beep([660, 880, 1320][i], 0.12), fr(s0 + [16, 90, 180][i]), 0.9)
# the signal locks: clean sine + hit on the green light
g = s0 + 6 * B
fx.place(impact(1.8, 90, 36), fr(g), 0.6)
sig = np.sin(2 * np.pi * 880 * t_axis(2.5)) * np.minimum(1, t_axis(2.5) / 0.02) * exp_decay(int(2.5 * SR), 1.2) * 0.12
fx.place(sig, fr(g), 1.0)
fx.place(shimmer(1760, 2.0, 0.1), fr(g), 1)
beat(g, AT['services'], energy=1.0, bar_offset=2)

# ================================================================ SERVICES — card per 2 beats
v0 = AT['services']
fx.place(whoosh(0.3, 600, 8000, -0.3, 0.3), fr(v0) - 0.12, 0.8)
for i in range(6):
    c = v0 + i * 2 * B
    fx.place(whoosh(0.16, 300, 4000, 0, 0), fr(c) - 0.04, 0.7)
    fx.place(slap(0.9), fr(c + 4), 0.8, pan=0.4)
    fx.place(kick(0.35, 1.0, 200, 60), fr(c), 0.5)
    for j in range(4):
        fx.place(tick(3200 + j * 300, amp=0.08), fr(c + 10 + j * 3), 1, pan=-0.4 + j * 0.2)
beat(v0, AT['proof'], energy=1.0)
# proof
p0 = AT['proof']
fx.place(whoosh(0.5, 200, 3000, 0, 0), fr(p0) - 0.05, 0.8)
beat(p0, AT['bring'], energy=0.8, hook=False, bar_offset=1)
fx.place(riser(2.0, 250, 3000), fr(p0), 0.35)

# ================================================================ BRING — TV channel flips on beats 2/4/6/8
t0 = AT['bring']
fx.place(whip(), fr(t0) - 0.1, 0.8)
for i, b in enumerate((2, 4, 6, 8)):
    ts = fr(t0 + b * B)
    fx.place(ui_click(0.6), ts - 0.02, 1)
    fx.place(static_burst(0.22, 0.5), ts, 1.0)
    fx.place(tuning_sweep(0.25, 1200 + i * 300, 2000 + i * 300), ts + 0.05, 0.4)
    fx.place(slap(0.5), ts + 0.03, 0.5, pan=(-0.5 if i % 2 == 0 else 0.5))
beat(t0, AT['why'], energy=0.8, halftime=True)

# ================================================================ WHY — title slam + 4 whips
w0 = AT['why']
fx.place(impact(1.2, 110, 40), fr(w0), 0.6)
fx.place(slap(0.8), fr(w0), 0.7)
for i in range(4):
    c = w0 + 2 * B + i * 2 * B
    fx.place(whip(), fr(c) - 0.06, 0.9)
    fx.place(slap(0.7), fr(c + 3), 0.6)
beat(w0, AT['responsive'], energy=1.0, bar_offset=3)

# ================================================================ RESPONSIVE — morphs + phones
r0 = AT['responsive']
fx.place(whoosh(0.4, 400, 5000, -0.4, 0.4), fr(r0) - 0.05, 0.7)
for b in (1.5, 3):
    fx.place(whoosh(0.3, 800, 7000, 0.5, -0.5), fr(r0 + b * B) - 0.05, 0.8)
    fx.place(ui_click(0.4), fr(r0 + b * B + 14), 1)
for i, d in enumerate((0, 6, 12)):
    fx.place(slap(0.5), fr(r0 + 5 * B + d + 6), 0.6, pan=(-0.6, 0, 0.6)[i])
beat(r0, AT['cta'], energy=0.9, bar_offset=1)

# ================================================================ CTA — hover, scroll, push into the credit
c0 = AT['cta']
fx.place(whip(), fr(c0) - 0.08, 0.8)
fx.place(ui_click(0.5), fr(c0 + 60), 1)
fx.place(whoosh(0.6, 200, 2000, 0, 0), fr(c0 + 3 * B), 0.6)
beat(c0, c0 + 7 * B, energy=0.9, bar_offset=2)
fx.place(riser(1.5, 200, 3200), fr(c0 + 7 * B), 0.6)
fx.place(reverse_swell(1.5, 14000), fr(c0 + 7 * B), 0.6)
fx.place(ui_click(0.5), fr(c0 + 7 * B + 10), 1)
gaps.append((AT['end'] - 8, AT['end']))

# ================================================================ END — back to RAR
e0 = AT['end']
fx.place(impact(4.0, 120, 28), fr(e0), 1.0)
fx.place(kick(0.9, 1.2, 180, 36), fr(e0), 0.9)
fx.place(shimmer(2093, 3.0, 0.10), fr(e0), 1, pan=-0.3)
fx.place(shimmer(3136, 3.0, 0.07), fr(e0 + 2), 1, pan=0.3)
amb.place(pad([174.6, 207.7, 261.6, 349.2, 523.3], 5.0, amp=0.10, cutoff=2200, attack=0.3), fr(e0), 1.0)
amb.place(drone(5.0, (F1, F2), amp=0.35, attack=0.2), fr(e0), 1.0)
for j, ff in enumerate([14, 26, 60, 90]):
    fx.place(tick(3600 + j * 250, amp=0.1), fr(e0 + ff), 1, pan=(-0.5 + j * 0.3))
fx.place(slap(0.6), fr(e0 + 8), 0.6, pan=0.4)

# ================================================================ MIX
fx_w = reverb(fx.buf, reverb_ir(2.4), 0.28)
amb_w = amb.buf * 0.7 + hp(reverb(amb.buf, reverb_ir(2.5, 3000, 5), 1.0).T, 160).T * 0.35
music_w = reverb(music.buf, reverb_ir(1.2, 6000, 9), 0.18)
music_sc = sidechain(music_w, kick_times, 0.55)
mix = drums.buf * 0.9 + music_sc * 0.8 + fx_w * 1.0 + amb_w * 0.9
gain = np.ones(len(mix))
for a, b in gaps:
    ia, ib = int(fr(a) * SR), int(fr(b) * SR)
    gain[ia:ib] = np.minimum(gain[ia:ib], np.linspace(1, 0, ib - ia) ** 3)
mix *= gain[:, None]
# tail fade over the last beat and a half
end_i = int(fr(TOTAL) * SR)
fade = int(1.2 * SR)
mix[end_i - fade:end_i] *= np.linspace(1, 0, fade)[:, None] ** 1.5
mix[end_i:] = 0
out = master(mix)[: end_i]
here = os.path.dirname(os.path.abspath(__file__))
sf.write(os.path.join(here, '..', 'public', 'audio', 'film.wav'), out, SR, subtype='PCM_24')
# stems for the editor
for name, tr in (('stem_music', music_sc * 0.8 + drums.buf * 0.9), ('stem_sfx', fx_w + amb_w * 0.9)):
    st = tr[:end_i] * gain[:end_i, None]
    sf.write(os.path.join(here, '..', 'public', 'audio', f'{name}.wav'), st / (np.abs(st).max() + 1e-9) * 0.9, SR, subtype='PCM_24')
print('film audio', TOTAL, 'frames', out.shape[0] / SR, 's')
