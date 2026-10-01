"""v2 audio: tactile ASMR sound design only (no music, no drums).

Every sound is tied to something on screen. It is mixed quiet and clean so a track added inside
Instagram (or one supplied later) sits on top without fighting it. Timeline mirrors src/Film.tsx.
"""
import os
import numpy as np
import soundfile as sf
from synth import *  # noqa

B = 30
SECTIONS = [('opener', 840), ('about', 180), ('flurry', 60), ('story', 360), ('services', 360), ('proof', 120),
            ('bring', 300), ('why', 300), ('responsive', 360), ('cta', 300), ('end', 300)]
AT, t = {}, 0
for k, d in SECTIONS:
    AT[k] = t
    t += d
TOTAL = t
DUR = TOTAL / FPS + 1.0
fx = Track(DUR)
room = Track(DUR)

# CTA beats (local frames), must match src/Film.tsx
CTA_SCROLL = (90, 140)
CTA_LOGO = 168
CTA_CREDIT = 236
CTA_ZOOM = 226


def keys(frame, n, step=2.0, amp=0.32, pan=0.0, seed=0):
    for j in range(n):
        fx.place(mech_key(seed + j, amp * (0.85 + 0.15 * ((j * 7) % 3) / 2)), fr(frame + j * step), 1, pan=pan + (j % 3 - 1) * 0.08)


def scroll(f0, f1, rate=16, amp=0.16):
    fx.place(wheel_ticks(fr(f1) - fr(f0), rate=rate, amp=amp, seed=f0), fr(f0), 1, pan=0.15)


# ---------------------------------------------------------------- RAR cold open
room.place(air_swell(2.0, 0.10, 150, 1800), 0.0, 1)
room.place(drone(4.2, (43.65, 87.3), amp=0.12, attack=1.5), 0.0, 1)
for i, f0 in enumerate([30, 36, 42, 46]):
    keys(f0, 4, 2.2, 0.20, pan=(-0.6 if i % 2 == 0 else 0.6), seed=i * 10)
fx.place(soft_thump(0.75, 90, 42), fr(120), 1)
fx.place(shimmer(2093, 2.2, 0.06), fr(120), 1, pan=-0.2)
fx.place(shimmer(3136, 2.2, 0.04), fr(122), 1, pan=0.2)
for j in range(8):
    fx.place(tick(5000 - j * 150, amp=0.05), fr(120 + j * 2.4), 1, pan=-0.6 + j * 0.15)
keys(180, 11, 1.6, 0.24, seed=40)
fx.place(air_whoosh(0.9, 300, 6000, -0.2, 0.2, 0.6), fr(186), 1)
room.place(air_swell(0.45, 0.22, 600, 7000), fr(235), 1)      # light-speed whiteout
fx.place(soft_thump(0.5, 120, 60), fr(262), 1)                 # cut to "no signal"
fx.place(crackle(0.25, 0.01, 0.3), fr(262), 1)

# ---------------------------------------------------------------- Tune in (preloader)
fx.place(crackle(3.6, 0.0015, 0.16), fr(262), 1)
fx.place(tuning_sweep(1.0, 700, 2200) * 0.35, fr(264), 1, pan=-0.2)
fx.place(soft_ping(660, 0.6, 0.16), fr(270), 1)
fx.place(soft_ping(880, 0.6, 0.16), fr(300), 1)
fx.place(soft_ping(1320, 0.7, 0.15), fr(360), 1)
fx.place(soft_ping(1760, 0.7, 0.08), fr(363), 1)
room.place(air_swell(0.75, 0.24, 300, 6000), fr(432), 1)      # rush into the green light

# ---------------------------------------------------------------- Logo slam + hero
fx.place(soft_thump(0.8, 110, 50), fr(480), 1)
fx.place(paper_pat(0.7), fr(480), 1)
fx.place(bubble_pop(0.3, 1100), fr(510), 1)
keys(540, 17, 2.0, 0.28, seed=80)                     # s-i-g-n-a-l-r-o-o-m-.-s-t-u-d-i-o
fx.place(air_whoosh(0.7, 200, 2500, 0.5, -0.5, 0.55), fr(570), 1)
for j in range(10):                                   # headline scramble flicker
    fx.place(tick(2600 + (j % 4) * 700, amp=0.05), fr(612 + j * 1.3), 1, pan=-0.3 + j * 0.06)
fx.place(tick(3400, amp=0.12), fr(635), 1)            # hover on "Book a call"
scroll(730, 830, rate=14, amp=0.14)

# ---------------------------------------------------------------- About
fx.place(air_whoosh(0.35, 600, 6000, 0.7, -0.2, 0.55), fr(AT['about']) - 0.1, 1)
scroll(AT['about'] + 10, AT['about'] + 170, rate=12, amp=0.12)

# ---------------------------------------------------------------- Flurry: tactile chaos
f0 = AT['flurry']
for st in range(8):
    fx.place(crackle(0.09, 0.02, 0.35), fr(f0 + st * 7.5), 1, pan=(-0.5 if st % 2 else 0.5))
    fx.place(mech_key(200 + st, 0.3), fr(f0 + st * 7.5), 1)

# ---------------------------------------------------------------- Story
s0 = AT['story']
fx.place(peel(0.4, 0.4), fr(s0), 1)
fx.place(crackle(3.0, 0.002, 0.14), fr(s0), 1)
for at, words in ((16, 6), (90, 3), (180, 3)):
    for j in range(words):
        fx.place(tick(3000 + j * 120, amp=0.06), fr(s0 + at + 2 + j * 2.5), 1)
fx.place(soft_ping(1320, 1.0, 0.14), fr(s0 + 180), 1)
fx.place(soft_ping(1980, 1.0, 0.07), fr(s0 + 182), 1)

# ---------------------------------------------------------------- Services
v0 = AT['services']
for i in range(6):
    c = v0 + i * 60
    fx.place(air_whoosh(0.18, 500, 4000, 0, 0, 0.45), fr(c) - 0.05, 1)
    fx.place(paper_pat(0.55), fr(c + 5), 1, pan=0.4)
    for j in range(4):
        fx.place(bubble_pop(0.14, 800 + j * 140), fr(c + 10 + j * 3), 1, pan=-0.4 + j * 0.25)
p0 = AT['proof']
fx.place(air_whoosh(0.4, 300, 3000, 0, 0, 0.45), fr(p0) - 0.05, 1)
scroll(p0 + 8, p0 + 115, rate=26, amp=0.13)

# ---------------------------------------------------------------- Bring: TV knob on the beat
b0 = AT['bring']
fx.place(air_whoosh(0.35, 600, 5000, -0.4, 0.4, 0.45), fr(b0) - 0.08, 1)
for b in (2, 4, 6, 8):
    ts = b0 + b * B
    fx.place(mouse_click(0.3), fr(ts) - 0.03, 1)
    fx.place(knob_detent(0.55), fr(ts), 1)
    fx.place(crackle(0.12, 0.02, 0.35), fr(ts), 1)

# ---------------------------------------------------------------- Why
w0 = AT['why']
fx.place(soft_thump(0.55, 100, 55), fr(w0), 1)
for i in range(4):
    c = w0 + 60 + i * 60
    fx.place(air_whoosh(0.2, 800, 6000, 0.7, -0.4, 0.5), fr(c) - 0.06, 1)
    fx.place(paper_pat(0.5), fr(c + 4), 1)

# ---------------------------------------------------------------- Responsive
r0 = AT['responsive']
fx.place(air_whoosh(0.35, 500, 4000, -0.3, 0.3, 0.4), fr(r0) - 0.05, 1)
for b in (45, 90):
    fx.place(air_whoosh(0.3, 900, 6000, 0.4, -0.4, 0.45), fr(r0 + b) - 0.05, 1)
    fx.place(tick(2800, amp=0.1), fr(r0 + b + 14), 1)
for i, d in enumerate((0, 6, 12)):
    fx.place(soft_thump(0.25, 160, 90), fr(r0 + 150 + d + 8), 1, pan=(-0.6, 0, 0.6)[i])
    fx.place(tick(3600, amp=0.08), fr(r0 + 150 + d + 8), 1, pan=(-0.6, 0, 0.6)[i])

# ---------------------------------------------------------------- CTA -> footer -> credit
c0 = AT['cta']
fx.place(air_whoosh(0.35, 500, 4000, 0, 0, 0.45), fr(c0) - 0.08, 1)
fx.place(tick(3400, amp=0.12), fr(c0 + 55), 1)
scroll(c0 + CTA_SCROLL[0], c0 + CTA_SCROLL[1], rate=30, amp=0.15)
fx.place(paper_pat(0.6), fr(c0 + CTA_LOGO), 1)
fx.place(bubble_pop(0.25, 950), fr(c0 + CTA_LOGO + 3), 1)
fx.place(tick(3600, amp=0.14), fr(c0 + CTA_CREDIT), 1)
room.place(air_swell((300 - CTA_ZOOM) / FPS, 0.14, 300, 4000), fr(c0 + CTA_ZOOM), 1)

# ---------------------------------------------------------------- End lockup
e0 = AT['end']
fx.place(soft_thump(0.8, 90, 40), fr(e0), 1)
fx.place(shimmer(2093, 3.0, 0.06), fr(e0), 1, pan=-0.3)
fx.place(shimmer(3136, 3.0, 0.04), fr(e0 + 2), 1, pan=0.3)
for j, fq in enumerate((698.5, 880.0, 1046.5)):
    fx.place(soft_ping(fq, 2.2, 0.07), fr(e0 + 60 + j * 4), 1, pan=(-0.3 + j * 0.3))
room.place(drone(5.0, (43.65, 87.3), amp=0.10, attack=0.3), fr(e0), 1)
fx.place(paper_pat(0.4), fr(e0 + 8), 1, pan=0.4)

# ---------------------------------------------------------------- mix: small room, quiet master
wet = reverb(fx.buf, reverb_ir(0.7, 7000, 11), 0.14)
mix = wet + room.buf * 0.8
end_i = int(fr(TOTAL) * SR)
fade = int(1.2 * SR)
mix[end_i - fade:end_i] *= np.linspace(1, 0, fade)[:, None] ** 1.5
mix = mix[:end_i]
mix = hp(mix.T, 30).T
peak = np.abs(mix).max()
mix = mix / peak * 0.9  # Instagram lets the poster balance this against an added track
here = os.path.dirname(os.path.abspath(__file__))
sf.write(os.path.join(here, '..', 'public', 'audio', 'film.wav'), mix, SR, subtype='PCM_24')
sf.write(os.path.join(here, '..', 'public', 'audio', 'stem_sfx.wav'), mix, SR, subtype='PCM_24')
rms = np.sqrt((mix ** 2).mean())
print('asmr sfx', round(mix.shape[0] / SR, 2), 's, rms dBFS %.1f' % (20 * np.log10(rms)))
