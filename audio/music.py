"""Chill-house score (120 BPM, D-flat major) arranged to the film, plus the final music+SFX mix.

Soft four-on-the-floor, warm FM electric piano, sub bass, swung shaker, airy pad, vinyl texture.
Writes public/audio/film_music.wav (music + ASMR SFX). Run audio/asmr_mix.py first.
"""
import os
import numpy as np
import soundfile as sf
from synth import *  # noqa

here = os.path.dirname(os.path.abspath(__file__))
B = 30  # frames per beat
SECTIONS = [('opener', 660), ('about', 180), ('flurry', 60), ('story', 360), ('services', 360), ('proof', 120),
            ('bring', 300), ('why', 300), ('responsive', 360), ('cta', 300), ('end', 300)]
AT, t = {}, 0
for k, d in SECTIONS:
    AT[k] = t
    t += d
TOTAL = t
N = int((TOTAL / FPS + 3.0) * SR)
SLAM = 240

ep, pad_t, bass, drums, perc, mel, tex = (np.zeros((N, 2)) for _ in range(7))


def put(buf, sig, at_s, gain=1.0, pan=0.0):
    s = np.asarray(sig, float)
    if s.ndim == 1:
        s = np.stack([s * np.sqrt((1 - pan) / 2) * 1.414, s * np.sqrt((1 + pan) / 2) * 1.414], axis=1)
    i = int(round(at_s * SR))
    if i >= N:
        return
    m = min(len(s), N - i)
    buf[i:i + m] += s[:m] * gain


# ---------------------------------------------------------------- instruments
def epiano(f, dur, vel=1.0):
    """FM electric piano (Rhodes-ish): bell-y attack mellowing into a round sustain, gentle tremolo."""
    n = int(dur * SR)
    tt = np.arange(n) / SR
    idx = 0.35 + 2.2 * vel * np.exp(-tt / 0.25)
    mod = np.sin(2 * np.pi * f * tt) * idx
    car = np.sin(2 * np.pi * f * tt + mod)
    tine = np.sin(2 * np.pi * f * 7.0 * tt) * np.exp(-tt / 0.02) * 0.12 * vel
    env = np.minimum(1, tt / 0.003) * np.exp(-tt / 1.4)
    rel = np.minimum(1, (dur - tt) / 0.08).clip(0, 1)
    trem = 1 - 0.12 * (0.5 + 0.5 * np.sin(2 * np.pi * 4.6 * tt))
    return (car + tine) * env * rel * trem * 0.22 * vel


def chord(notes, at_s, dur, vel=1.0, spread=0.5):
    for j, f in enumerate(notes):
        pan = -spread + 2 * spread * j / max(1, len(notes) - 1)
        put(ep, epiano(f * (1 + (j - 2) * 0.0007), dur, vel), at_s + j * 0.004, 1.0, pan)


def sub(f, dur):
    n = int(dur * SR)
    tt = np.arange(n) / SR
    x = np.sin(2 * np.pi * f * tt) + 0.25 * np.sin(2 * np.pi * 2 * f * tt) + 0.08 * np.sin(2 * np.pi * 3 * f * tt)
    env = np.minimum(1, tt / 0.01) * np.minimum(1, (dur - tt) / 0.06).clip(0, 1) * (0.75 + 0.25 * np.exp(-tt / 0.2))
    return sat(x * env, 1.4) * 0.5


def soft_kick():
    x = kick(0.38, 0.85, 120, 48)
    return lp(x, 2500) * 0.9


def rim():
    n = int(0.18 * SR)
    x = bp(noise(n), 900, 4200) * exp_decay(n, 0.018) + np.sin(2 * np.pi * 820 * t_axis(0.18)) * exp_decay(n, 0.01) * 0.4
    return x * 0.35


def shaker(acc=1.0):
    n = int(0.06 * SR)
    e = np.minimum(1, np.arange(n) / (0.008 * SR)) * exp_decay(n, 0.018)
    return bp(noise(n), 5000, 11000) * e * 0.16 * acc


def open_hat():
    return hp(hat(open_=True, dur=0.22), 8000) * 0.5


def bell(f, dur=1.2):
    n = int(dur * SR)
    tt = np.arange(n) / SR
    x = np.sin(2 * np.pi * f * tt + 1.2 * np.sin(2 * np.pi * f * 3.5 * tt) * np.exp(-tt / 0.15))
    return x * np.minimum(1, tt / 0.002) * np.exp(-tt / 0.5) * 0.10


# ---------------------------------------------------------------- harmony (D-flat major, 1 chord per bar)
Db3, Eb3, F3, Gb3, Ab3, Bb3, C4, Db4, Eb4, F4 = 138.59, 155.56, 174.61, 185.0, 207.65, 233.08, 261.63, 277.18, 311.13, 349.23
C3, Bb2, G3, D4 = 130.81, 116.54, 196.0, 293.66
PROG = [
    ([Db3, F3, Ab3, C4, Eb4], 69.30),     # Dbmaj9
    ([C3, Eb3, G3, Bb3, D4], 65.41),      # Cm9
    ([Bb2, Db3, F3, Ab3, C4], 58.27),     # Bbm9
    ([Gb3, Bb3, Db4, F4], 51.91),         # Gbmaj7 over Ab
]
BAR = BEAT_S * 4
bars = int(np.ceil(TOTAL / (B * 4))) + 1


def in_sec(frame, *names):
    for nm in names:
        a = AT[nm]
        d = dict(SECTIONS)[nm]
        if a <= frame < a + d:
            return True
    return False


for bar in range(bars):
    f0 = bar * B * 4
    if f0 >= TOTAL:
        break
    t0 = fr(f0)
    notes, root = PROG[bar % 4]
    ending = f0 >= AT['end']
    intro = f0 < SLAM
    # electric piano: lo-fi house comp (1, &2, &4), long held chord in the intro and on the end card
    if intro or ending:
        chord(notes, t0, BAR * (2 if ending else 1) + 0.2, 0.75)
    else:
        chord(notes, t0, BEAT_S * 1.4, 0.9)
        chord(notes, t0 + BEAT_S * 1.5, BEAT_S * 0.9, 0.6)
        chord(notes, t0 + BEAT_S * 3.5, BEAT_S * 0.6, 0.55)
    # pad: always there, soft
    put(pad_t, pad([n * 2 for n in notes[:4]], BAR + 0.3, amp=0.05, cutoff=2200, attack=0.35), t0, 1.0)
    # bass + drums after the slam (break out during the noise breakdown and on the end card)
    if not intro and not ending:
        breakdown = in_sec(f0, 'story') and f0 < AT['story'] + 6 * B
        flurry = in_sec(f0, 'flurry')
        for st, dur in ((0, 0.9), (2.5, 0.4), (3.0, 0.45)):
            put(bass, sub(root, BEAT_S * dur), t0 + st * BEAT_S, 0.9 if not breakdown else 0.5)
        for b in range(4):
            tb = t0 + b * BEAT_S
            if not breakdown and not flurry:
                put(drums, soft_kick(), tb, 0.8)
            if b in (1, 3) and not flurry:
                put(drums, rim(), tb, 0.8, pan=0.1)
            if not breakdown:
                put(perc, open_hat(), tb + BEAT_S / 2, 0.5, pan=0.3)
        for s16 in range(16):
            swing = 0.022 if s16 % 2 else 0.0
            put(perc, shaker(1.0 if s16 % 4 == 2 else 0.6), t0 + s16 * BEAT_S / 4 + swing, 1.0, pan=-0.25)
    # sparse bell melody from the services section on (lift)
    if f0 >= AT['services'] and not ending and bar % 2 == 0:
        line = [830.6, 698.5, 622.3] if bar % 4 == 0 else [698.5, 554.4, 622.3]
        for j, nf in enumerate(line):
            put(mel, bell(nf), t0 + (0.5 + j * 1.5) * BEAT_S, 1.0, pan=(-0.3 if j % 2 else 0.3))

# vinyl / room texture throughout
tex[:, 0] += bp(noise(N), 2000, 9000) * 0.004 + (rng.random(N) < 0.0006) * rng.standard_normal(N) * 0.08
tex[:, 1] += bp(noise(N), 2000, 9000) * 0.004 + (rng.random(N) < 0.0006) * rng.standard_normal(N) * 0.08

# ---------------------------------------------------------------- mix
kicks = [fr(f) for f in range(SLAM, TOTAL, B)]
ep_w = hp(reverb(ep, reverb_ir(1.6, 5000, 21), 0.22).T, 170).T   # bass owns the lows
pad_w = hp(reverb(pad_t, reverb_ir(2.5, 4000, 22), 0.35).T, 220).T
mel_w = reverb(mel, reverb_ir(2.0, 6000, 23), 0.35)
perc_w = reverb(perc + drums * 0.0, reverb_ir(0.6, 8000, 24), 0.12)
drums_w = drums + reverb(drums * 0.4, reverb_ir(0.5, 5000, 25), 0.15) * 0.3
music = sidechain(ep_w * 0.9 + pad_w + bass * 0.85 + mel_w, kicks, 0.28, 0.2) + drums_w * 0.9 + perc_w * 0.9 + tex

# intro: lowpass that opens up into the logo slam, plus a soft swell
iz = int(fr(SLAM) * SR)
intro = music[:iz].copy()
music[:iz] = np.stack([sweep_filter(intro[:, c], 350, 4500, 'low', steps=48) for c in range(2)], axis=1)
# end: drums already out; fade the tail
end_i = int(fr(TOTAL) * SR)
fade = int(1.6 * SR)
music[end_i - fade:end_i] *= np.linspace(1, 0, fade)[:, None] ** 1.3
music = music[:end_i]
music = hp(music.T, 28).T
music = np.tanh(music * 1.2)
music = music / (np.abs(music).max() + 1e-9) * 0.8

sfx = np.load(os.path.join(here, '..', 'public', 'audio', 'sfx_raw.npy'))[:end_i]
mix = music * 0.85 + sfx * 0.75
mix = mix / (np.abs(mix).max() + 1e-9) * 0.93
sf.write(os.path.join(here, '..', 'public', 'audio', 'film_music.wav'), mix, SR, subtype='PCM_24')
sf.write(os.path.join(here, '..', 'public', 'audio', 'stem_music.wav'), music, SR, subtype='PCM_24')
rms = np.sqrt((mix ** 2).mean())
print('music mix', round(len(mix) / SR, 2), 's, rms dBFS %.1f' % (20 * np.log10(rms)))
