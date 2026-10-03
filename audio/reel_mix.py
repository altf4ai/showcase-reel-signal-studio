"""Client-reaction reel audio: the room's own sound re-cut to the picture, cinematic SFX, and a score.

Reads src/reaction/edl.json (same edit the video uses) and public/react/src_audio.wav.
  - dx: the real room audio follows each shot's time map, so slow-motion drops in pitch like
    a tape slowing down, freezes go silent, and the VHS rewind is the actual audio run backwards.
  - fx: record scratch, shutter, rewind, whooshes, impacts, risers, static, heartbeat, typing.
  - music: 120 BPM D-flat major feel-good groove (same key/tempo family as the launch film),
    arranged to the cut: hook bar -> scratch -> restart -> drop on the cheer -> breakdown on the
    preloader -> big groove on the reveal -> breakdown for the verdict -> warm outro + logo hit.
Writes public/react/reel_music.wav, reel_nomusic.wav and the three stems.
"""
import json
import os
import numpy as np
import soundfile as sf
from synth import (SR, rng, noise, bp, hp, lp, sweep_filter, sat, exp_decay, t_axis, osc_sine_glide, impact, reverse_swell,
                   riser, whoosh, air_whoosh, shimmer, soft_thump, paper_pat, bubble_pop, mech_key, air_swell, reverb_ir, reverb,
                   Track, sidechain, hat)

here = os.path.dirname(os.path.abspath(__file__))
root = os.path.join(here, '..')
EDL = json.load(open(os.path.join(root, 'src', 'reaction', 'edl.json')))
FPS = EDL['fps']
SHOTS = []
_t = 0
for _s in EDL['shots']:
    _s = dict(_s)
    _s['at'] = _t
    _t += _s['dur']
    SHOTS.append(_s)
TOTAL = _t
AT = {s['id']: s['at'] for s in SHOTS}
END = {s['id']: s['at'] + s['dur'] for s in SHOTS}
DUR = TOTAL / FPS
N = int(round(DUR * SR))
BEAT = 0.5  # seconds (120 BPM); 15 video frames


def T(frame):
    return frame / FPS


def smooth(a, b, x):
    k = np.clip((np.asarray(x, float) - a) / (b - a), 0, 1)
    return k * k * (3 - 2 * k)


# ================================================================ dialogue / room (dx)
def ease(name, x):
    if name == 'out':
        return 1 - (1 - x) ** 2
    if name == 'in':
        return x ** 3
    if name == 'inOut':
        return np.where(x < 0.5, 4 * x ** 3, 1 - (-2 * x + 2) ** 3 / 2)
    return x


def src_at(shot, lf):
    """Vectorised twin of srcAt() in src/reaction/edl.ts."""
    k = shot['keys']
    out = np.full(lf.shape, float(k[0][1]))
    for i in range(len(k) - 1):
        a, sa = k[i][0], k[i][1]
        b, sb = k[i + 1][0], k[i + 1][1]
        e = k[i + 1][2] if len(k[i + 1]) > 2 else None
        m = (lf > a) & (lf <= b)
        x = np.clip((lf - a) / (b - a), 0, 1)
        out = np.where(m, sa + (sb - sa) * ease(e, x), out)
    return np.where(lf > k[-1][0], k[-1][1], out)


room, sr0 = sf.read(os.path.join(root, 'public', 'react', 'src_audio.wav'))
assert sr0 == SR, sr0
room = hp(room.T, 70).T                                   # handling rumble
room_lp = lp(room.T, 650, 4).T                           # anti-alias source for the 35x rewind


def sample(buf, sec):
    pos = np.clip(sec * SR, 0, len(buf) - 2)
    i0 = np.floor(pos).astype(int)
    fr_ = (pos - i0)[:, None]
    return buf[i0] * (1 - fr_) + buf[i0 + 1] * fr_


def fade_edges(x, ms=8):
    n = min(len(x) // 2, int(ms / 1000 * SR))
    if n > 0:
        r = np.linspace(0, 1, n)[:, None]
        x[:n] *= r
        x[-n:] *= r[::-1]
    return x


dx = Track(DUR + 1)       # 1x room sound
dx_slow = Track(DUR + 1)  # slowed (pitch-dropped) room sound: gets a big dark reverb
dx_rew = Track(DUR + 1)   # rewind chatter
for s in SHOTS:
    a = s.get('audio', 'follow')
    if a == 'none':
        continue
    if isinstance(a, dict):
        n = int(round(a['dur'] / FPS * SR))
        seg = sample(room, a['src'] + np.arange(n) / SR)
        if s['id'] == 'end':
            seg *= np.linspace(1, 0, n)[:, None] ** 1.5
        dx.place(fade_edges(seg), T(s['at']))
        continue
    n = int(round(s['dur'] / FPS * SR))
    sec = src_at(s, np.arange(n) / SR * FPS)
    speed = np.gradient(sec) * SR
    if np.abs(speed).max() > 3:                           # rewind: backwards at up to ~35x
        seg = sample(room_lp, sec)
        seg *= smooth(0.0, 0.08, np.arange(n) / n)[:, None]
        dx_rew.place(fade_edges(seg), T(s['at']))
        continue
    seg = sample(room, sec)
    gate = smooth(0.06, 0.3, np.abs(speed))[:, None]     # a freeze is silence, not DC
    slow = smooth(0.98, 0.7, np.abs(speed))[:, None]     # 0 at 1x -> 1 at <=0.7x
    dx.place(fade_edges(seg * gate * (1 - slow)), T(s['at']))
    dx_slow.place(fade_edges(seg * gate * slow), T(s['at']))

# slowed room sound: darker, with a long tail that rings into the freeze frames
slow_bus = lp(dx_slow.buf.T, 3200).T
slow_bus = reverb(slow_bus, reverb_ir(2.6, 3500, 41), 0.5)
rew_bus = hp(dx_rew.buf.T, 400).T * 0.5


def leveller(x, target_db=-18.0, lo=0.2, hi=3.2, amount=0.85):
    """Dialogue rider for phone audio: pulls laughs/cheers down, lifts quiet room, then soft-clips."""
    tgt = 10 ** (target_db / 20)
    env = np.sqrt(np.maximum(lp((x ** 2).mean(axis=1), 4, 1), 1e-10))
    g = np.clip((tgt / (env + 1e-4)) ** amount, lo, hi)
    g = lp(g, 2.5, 1)
    y = x * g[:, None]
    return np.tanh(y * 1.6) / 1.6


dx_bus = leveller(dx.buf + slow_bus + rew_bus)

# ================================================================ SFX
fx = Track(DUR + 1)


def record_scratch(src, amp=0.9):
    """Two quick back-and-forth vinyl moves over a snippet of the music."""
    dur = 0.42
    n = int(dur * SR)
    tt = np.arange(n) / SR
    pos = 0.06 * np.sin(2 * np.pi * 5.5 * tt) * np.exp(-tt / 0.3) + 0.03 * np.sin(2 * np.pi * 13 * tt) * (tt > 0.18)
    idx = np.clip(((pos + 0.12) * SR).astype(int), 0, len(src) - 1)
    x = src[idx]
    x = bp(x.T, 300, 7000).T * 2.2 + bp(noise(n), 1500, 6000)[:, None] * 0.08
    return sat(x, 1.6) * np.minimum(1, (dur - tt) / 0.06)[:, None] * amp


def shutter(amp=0.6):
    """DSLR shutter: mirror slap + curtain, two clicks ~60 ms apart."""
    n = int(0.16 * SR)
    one = bp(noise(n), 1800, 9000) * exp_decay(n, 0.003) + np.sin(2 * np.pi * 1150 * t_axis(0.16)) * exp_decay(n, 0.008) * 0.5
    x = one.copy()
    o = int(0.062 * SR)
    x[o:] += one[: n - o] * 0.7
    return x * amp


def tape_motor(dur, amp=0.25):
    tt = t_axis(dur)
    wob = 1 + 0.02 * np.sin(2 * np.pi * 7 * tt)
    whir = sum(np.sin(2 * np.pi * f * np.cumsum(wob) / SR) * g for f, g in ((118, 1), (236, 0.5), (3600, 0.12), (5100, 0.06)))
    squeal = np.sin(2 * np.pi * np.cumsum(4200 + 900 * np.sin(2 * np.pi * 3 * tt)) / SR) * 0.08
    hiss = bp(noise(len(tt)), 3000, 10000) * 0.25
    e = np.minimum(1, tt / 0.05) * np.minimum(1, (dur - tt) / 0.06)
    return (whir * 0.4 + squeal + hiss) * e * amp


def clunk(amp=0.6):
    """VCR transport button."""
    n = int(0.2 * SR)
    x = osc_sine_glide(180, 60, 0.2, curve=22) * exp_decay(n, 0.035) + bp(noise(n), 800, 5000) * exp_decay(n, 0.006) * 0.6
    return sat(x, 1.4) * amp


def heartbeat(amp=0.6):
    n = int(0.5 * SR)
    a = osc_sine_glide(75, 42, 0.5, curve=14) * exp_decay(n, 0.07)
    b = np.zeros(n)
    o = int(0.17 * SR)
    b[o:] = a[: n - o] * 0.65
    return lp(a + b, 400) * amp


def sub_drop(dur=1.4, f0=70, f1=24, amp=0.8):
    n = int(dur * SR)
    return sat(osc_sine_glide(f0, f1, dur, curve=3) * exp_decay(n, dur / 3), 1.5) * amp


def tv_static(dur, amp=0.2):
    n = int(dur * SR)
    x = bp(noise(n), 900, 11000) + (rng.random(n) > 0.996) * rng.standard_normal(n) * 2.5
    return x * np.minimum(1, t_axis(dur) / 0.15) * np.minimum(1, (dur - t_axis(dur)) / 0.1) * amp


def ring(dur=1.6, f=3700, amp=0.05):
    tt = t_axis(dur)
    return np.sin(2 * np.pi * f * tt) * np.minimum(1, tt / 0.15) * np.exp(-tt / 0.7) * amp


# hook: slow-motion entry, freeze
fx.place(sub_drop(1.3, 62, 26, 0.4), T(AT['hookSlo']))
fx.place(air_whoosh(0.9, 2500, 300, 0.3, -0.3, 0.35), T(AT['hookSlo']) - 0.05)
fx.place(record_scratch(room[int(33.55 * SR):int(34.5 * SR)], 0.9), T(AT['hookHold']) - 0.03)   # scratching the laugh itself
fx.place(shutter(0.6), T(AT['hookHold']) + 0.02)
fx.place(impact(2.2, 95, 30) * 0.25, T(AT['hookHold']))
fx.place(ring(1.4, 3500, 0.03), T(AT['hookHold']) + 0.05)
# rewind
fx.place(clunk(0.55), T(AT['rewind']) - 0.02)
fx.place(tape_motor(T(30) + 0.05, 0.22), T(AT['rewind']))
fx.place(clunk(0.6), T(AT['greet']) - 0.04)
fx.place(air_swell(0.5, 0.12, 400, 6000), T(AT['greet']) - 0.45)
# arrival whips + cuts
for sid, d in (('walkIn', 1), ('gesture', -1), ('toScreen', 1)):
    fx.place(whoosh(0.32, 500, 5000, -0.6 * d, 0.6 * d) * 0.45, T(AT[sid]) - 0.16)
# the launch film
fx.place(air_swell(0.8, 0.14, 300, 4000), T(AT['hole']) - 0.7)
fx.place(soft_thump(0.5, 80, 40), T(AT['hole']))
fx.place(paper_pat(0.35), T(AT['slam']) + 0.45)
for sid in ('watch', 'point', 'phones', 'intent', 'endCard'):
    fx.place(air_whoosh(0.28, 600, 5000, -0.4, 0.4, 0.3), T(AT[sid]) - 0.14)
fx.place(riser(2.0, 180, 1500) * 0.32, T(AT['cheer']) - 2.0)
fx.place(reverse_swell(1.2, 9000) * 0.4, T(AT['cheer']) - 1.2)
# the cheer (music drop)
fx.place(impact(2.4, 110, 32) * 0.5, T(AT['cheer']))
fx.place(sub_drop(1.6, 58, 24, 0.45), T(AT['cheer']) + T(30))      # into the slow-mo
# the website: static, heartbeat, riser -> reveal
fx.place(air_whoosh(0.5, 3000, 400, 0.4, -0.4, 0.35), T(AT['preload']) - 0.2)
fx.place(tv_static(T(90), 0.10), T(AT['preload']))
for b in range(6):
    fx.place(heartbeat(0.55 + b * 0.05), T(AT['preload']) + b * BEAT)
fx.place(riser(3.0, 150, 2200) * 0.38, T(AT['reveal']) - 3.0)
fx.place(reverse_swell(1.5, 10000) * 0.55, T(AT['reveal']) + T(2) - 1.5)
fx.place(impact(3.2, 120, 26) * 1.0, T(AT['reveal']) + T(2))
fx.place(sub_drop(1.8, 55, 22, 0.6), T(AT['reveal']) + T(2))
fx.place(shimmer(2093, 2.4, 0.07), T(AT['reveal']) + T(4), pan=-0.3)
fx.place(shimmer(3136, 2.4, 0.05), T(AT['reveal']) + T(5), pan=0.3)
for sid, d in (('closeUp', 1), ('bigLaugh', -1), ('handHead', 1), ('turn', -1)):
    fx.place(whoosh(0.3, 600, 6000, -0.6 * d, 0.6 * d) * 0.4, T(AT[sid]) - 0.15)
# montage: a shutter on every cut
for i in range(1, 9):
    fx.place(shutter(0.38), T(AT[f'm{i}']), pan=(-0.3 if i % 2 else 0.3))
    fx.place(air_whoosh(0.18, 900, 7000, 0, 0, 0.25), T(AT[f'm{i}']) - 0.09)
# verdict
fx.place(air_swell(0.7, 0.12, 300, 5000), T(AT['look']) - 0.6)
fx.place(sub_drop(1.5, 60, 25, 0.5), T(AT['mindSlo']))
fx.place(air_whoosh(1.0, 2600, 300, -0.3, 0.3, 0.35), T(AT['mindSlo']))
fx.place(shutter(0.7), T(AT['mindHold']))
fx.place(impact(2.6, 100, 26) * 0.95, T(AT['mindHold']))
fx.place(ring(1.8, 3900, 0.045), T(AT['mindHold']) + 0.08)
fx.place(lp(noise(int(0.9 * SR)), 1800) * exp_decay(int(0.9 * SR), 0.25) * 0.25, T(AT['mindHold']) + 0.03)  # debris
# ending + end card
fx.place(clunk(0.5), T(AT['laughEnd']) - 0.03)
fx.place(air_swell(0.6, 0.12, 300, 5000), T(AT['laughEnd']) - 0.5)
E0 = AT['end']
fx.place(whoosh(0.6, 300, 4500, -0.5, 0.5) * 0.45, T(E0) - 0.1)
fx.place(soft_thump(0.8, 110, 45), T(E0 + 30))
fx.place(paper_pat(0.7), T(E0 + 30))
fx.place(impact(1.6, 120, 40) * 0.35, T(E0 + 30))
fx.place(bubble_pop(0.3, 1100), T(E0 + 46))
for j in range(17):                                         # s-i-g-n-a-l-r-o-o-m-.-s-t-u-d-i-o
    fx.place(mech_key(300 + j, 0.26), T(E0 + 56 + j * 1.6), pan=(j % 3 - 1) * 0.08)
fx.place(shimmer(2637, 2.0, 0.05), T(E0 + 80), pan=0.2)
fx_bus = reverb(fx.buf, reverb_ir(0.9, 7000, 43), 0.16)

# ================================================================ music
Db3, Eb3, F3, Gb3, Ab3, Bb3, C4, Db4, Eb4, F4, Gb4, Ab4, Bb4, C5, Db5, Eb5, F5 = (
    138.59, 155.56, 174.61, 185.0, 207.65, 233.08, 261.63, 277.18, 311.13, 349.23, 369.99, 415.3, 466.16, 523.25, 554.37, 622.25, 698.46)
C3 = 130.81
# I - V/7 - vi - IV in D-flat: bright, feel-good; descending bass Db C Bb Gb
PROG = [([Db3, F3, Ab3, C4, Eb4], 69.30), ([C3, Eb3, Ab3, C4, Eb4], 65.41), ([Db3, F3, Ab3, Bb3, Db4], 58.27), ([Gb3, Bb3, Db4, F4, Ab4], 46.25)]
BAR = 4 * BEAT


def epiano(f, dur, vel=1.0):
    n = int(dur * SR)
    tt = np.arange(n) / SR
    idx = 0.35 + 2.2 * vel * np.exp(-tt / 0.25)
    car = np.sin(2 * np.pi * f * tt + np.sin(2 * np.pi * f * tt) * idx)
    tine = np.sin(2 * np.pi * f * 7.0 * tt) * np.exp(-tt / 0.02) * 0.12 * vel
    env = np.minimum(1, tt / 0.003) * np.exp(-tt / 1.4) * np.minimum(1, (dur - tt) / 0.08).clip(0, 1)
    return (car + tine) * env * (1 - 0.12 * (0.5 + 0.5 * np.sin(2 * np.pi * 4.6 * tt))) * 0.22 * vel


def sub(f, dur, vel=1.0):
    n = int(dur * SR)
    tt = np.arange(n) / SR
    x = np.sin(2 * np.pi * f * tt) + 0.3 * np.sin(2 * np.pi * 2 * f * tt) + 0.1 * np.sin(2 * np.pi * 3 * f * tt)
    env = np.minimum(1, tt / 0.008) * np.minimum(1, (dur - tt) / 0.05).clip(0, 1) * (0.7 + 0.3 * np.exp(-tt / 0.15))
    return sat(x * env, 1.6) * 0.5 * vel


def kick(vel=1.0):
    n = int(0.42 * SR)
    body = osc_sine_glide(150, 46, 0.42, curve=26) * exp_decay(n, 0.2)
    click = hp(noise(n), 2500) * exp_decay(n, 0.003) * 0.35
    return sat((body + click) * 1.25, 1.5) * 0.9 * vel


def clap(vel=1.0):
    n = int(0.3 * SR)
    x = np.zeros(n)
    for i, off in enumerate((0, 0.009, 0.019)):
        o = int(off * SR)
        x[o:] += bp(noise(n - o), 900, 3200) * exp_decay(n - o, 0.006 if i < 2 else 0.07)
    return sat(x * 2.0, 1.3) * 0.55 * vel


def rim(vel=1.0):
    n = int(0.15 * SR)
    return (bp(noise(n), 900, 4200) * exp_decay(n, 0.015) + np.sin(2 * np.pi * 820 * t_axis(0.15)) * exp_decay(n, 0.01) * 0.4) * 0.35 * vel


def shaker(vel=1.0):
    n = int(0.06 * SR)
    e = np.minimum(1, np.arange(n) / (0.008 * SR)) * exp_decay(n, 0.018)
    return bp(noise(n), 5000, 11000) * e * 0.16 * vel


def pluck(f, dur=0.32, vel=1.0):
    n = int(dur * SR)
    tt = np.arange(n) / SR
    x = np.sin(2 * np.pi * f * tt + 1.4 * np.sin(2 * np.pi * f * 2 * tt) * np.exp(-tt / 0.06))
    x += 0.35 * np.sin(2 * np.pi * f * 2 * tt) * np.exp(-tt / 0.05)
    return x * np.minimum(1, tt / 0.002) * np.exp(-tt / 0.16) * 0.2 * vel


def bell(f, dur=1.2):
    n = int(dur * SR)
    tt = np.arange(n) / SR
    x = np.sin(2 * np.pi * f * tt + 1.2 * np.sin(2 * np.pi * f * 3.5 * tt) * np.exp(-tt / 0.15))
    return x * np.minimum(1, tt / 0.002) * np.exp(-tt / 0.5) * 0.1


def pad_chord(notes, dur, amp=0.05, cutoff=2400):
    n = int(dur * SR)
    tt = np.arange(n) / SR
    x = np.zeros(n)
    for f in notes:
        for d in (-0.004, 0.0, 0.005):
            x += 2 * ((tt * f * 2 * (1 + d)) % 1) - 1
    x = lp(x / (len(notes) * 3), cutoff, 2)
    return x * np.minimum(1, tt / 0.3) * np.minimum(1, (dur - tt) / 0.25).clip(0, 1) * amp


LEAD_A = [(0, Ab4), (0.75, F4), (1.0, Ab4), (1.5, Bb4), (2.5, Ab4), (3.0, F4), (3.5, Eb4)]
LEAD_B = [(0, Db5), (0.5, C5), (0.75, Ab4), (1.5, F4), (2.0, Ab4), (2.75, Bb4), (3.25, Ab4)]


class Song:
    """A bar-grid arranger: bar 0 starts at `t0` seconds on the reel timeline."""

    def __init__(self, t0):
        self.t0 = t0
        self.ep, self.pad, self.bass, self.drums, self.perc, self.lead = (Track(DUR + 3) for _ in range(6))
        self.kicks = []

    def at(self, bar, beat=0.0):
        return self.t0 + bar * BAR + beat * BEAT

    def bar(self, b, style, ci=None, lead=None, vel=1.0, beats=4):
        notes, root = PROG[(b if ci is None else ci) % 4]
        t = self.at(b)
        if style in ('intro', 'outro', 'break', 'end'):
            for j, f in enumerate(notes):
                self.ep.place(epiano(f * (1 + (j - 2) * 0.0007), BAR * (2 if style == 'end' else 1) + 0.25, 0.75 * vel), t + j * 0.004, pan=-0.5 + j * 0.25)
            self.pad.place(pad_chord([n * 2 for n in notes[:4]], BAR + 0.4, 0.05 * vel), t)
        else:
            for st, d, v in ((0, 1.4, 0.9), (1.5, 0.9, 0.6), (2.5, 0.5, 0.5), (3.5, 0.6, 0.55)):
                if st < beats:
                    for j, f in enumerate(notes):
                        self.ep.place(epiano(f * (1 + (j - 2) * 0.0007), BEAT * d, v * vel), t + st * BEAT + j * 0.004, pan=-0.5 + j * 0.25)
            self.pad.place(pad_chord([n * 2 for n in notes[:4]], BAR + 0.3, 0.04 * vel), t)
        if style in ('groove', 'drop', 'big', 'outro'):
            for st, d in ((0, 0.9), (1.5, 0.4), (2.5, 0.4), (3.0, 0.8)):
                if st < beats:
                    self.bass.place(sub(root, BEAT * d, 0.9 * vel), t + st * BEAT)
        for b4 in range(beats):
            tb = t + b4 * BEAT
            if style in ('drop', 'big'):
                self.drums.place(kick(vel), tb)
                self.kicks.append(tb)
                if b4 in (1, 3):
                    self.drums.place(clap(vel), tb, pan=0.05)
                self.perc.place(hp(hat(open_=True, dur=0.2), 8000) * 0.45 * vel, tb + BEAT / 2, pan=0.3)
            elif style in ('groove', 'outro'):
                if b4 in (0, 2) or (style == 'groove' and b4 == 3 and b % 2):
                    self.drums.place(kick(0.85 * vel), tb)
                    self.kicks.append(tb)
                if b4 in (1, 3):
                    self.drums.place(rim(vel), tb, pan=0.1)
            elif style == 'intro':
                if b4 == 0:
                    self.drums.place(kick(0.55 * vel), tb)
            if style != 'end':
                for s16 in range(4):
                    sw = 0.02 if s16 % 2 else 0.0
                    self.perc.place(shaker((1.0 if s16 == 2 else 0.6) * vel), tb + s16 * BEAT / 4 + sw, pan=-0.25)
        if lead:
            for bt, f in lead:
                if bt < beats:
                    self.lead.place(pluck(f, 0.34, vel), t + bt * BEAT, pan=0.15)
                    self.lead.place(pluck(f * 2, 0.2, 0.25 * vel), t + bt * BEAT + 0.003, pan=-0.2)

    def roll(self, b, beats=(2, 4)):
        """Snare/clap roll building into the next bar."""
        n = 0
        for k in np.arange(beats[0], beats[1], 0.25):
            self.drums.place(clap(0.25 + 0.5 * (k - beats[0]) / (beats[1] - beats[0])), self.at(b, k), pan=(-0.2 if n % 2 else 0.2))
            n += 1

    def render(self):
        ep = hp(reverb(self.ep.buf, reverb_ir(1.6, 5000, 51), 0.22).T, 160).T
        pd = hp(reverb(self.pad.buf, reverb_ir(2.4, 4000, 52), 0.35).T, 220).T
        ld = reverb(self.lead.buf, reverb_ir(1.4, 7000, 53), 0.28)
        pc = reverb(self.perc.buf, reverb_ir(0.6, 8000, 54), 0.12)
        body = sidechain(ep * 0.85 + pd + self.bass.buf * 0.9 + ld * 0.9, self.kicks, 0.3, 0.2)
        return body + self.drums.buf * 0.95 + pc * 0.85


def tape_stop(x, t0, t1, end_speed=0.0):
    """Varispeed the stereo buffer from t0 to t1 (seconds) down to end_speed; silence after t1."""
    i0, i1 = int(t0 * SR), int(t1 * SR)
    n = i1 - i0
    k = np.linspace(0, 1, n)
    speed = 1 - (1 - end_speed) * k ** 1.6
    pos = i0 + np.cumsum(speed)
    pos = np.clip(pos, 0, len(x) - 2)
    p0 = np.floor(pos).astype(int)
    fr_ = (pos - p0)[:, None]
    y = x.copy()
    y[i0:i1] = x[p0] * (1 - fr_) + x[p0 + 1] * fr_
    y[i0:i1] = lp(y[i0:i1].T, 9000).T
    y[i1:] = 0
    return y


# --- the hook bar (0-2s): full groove, slowing into the freeze, then a scratch
hook = Song(0.0)
hook.bar(0, 'drop', ci=0, lead=LEAD_A)
hook.bar(1, 'drop', ci=1, lead=LEAD_B)
hook_mix = hook.render()
hook_mix = tape_stop(hook_mix, T(AT['hookSlo']) + 0.15, T(AT['hookHold']), 0.25)

# --- main song (bars from the restart after the rewind)
main = Song(T(AT['greet']))
G = lambda fr: (fr - AT['greet']) / 60.0              # reel frame -> bar index on this grid
plan = {}
for b in range(0, 2):
    plan[b] = ('intro', None)
for b in range(2, 7):
    plan[b] = ('groove', None)
for b in range(7, 9):
    plan[b] = ('drop', LEAD_A if b % 2 else LEAD_B)   # bar 8 is cut to 2 beats below (preloader)
for b in range(int(G(AT['reveal'])), int(G(AT['look']))):
    plan[b] = ('big', LEAD_A if b % 2 == 0 else LEAD_B)
for b in range(int(G(AT['look'])), int(G(AT['look'])) + 2):
    plan[b] = ('break', None)
for b, (style, lead) in sorted(plan.items()):
    main.bar(b, style, lead=lead, beats=2 if b == 8 else 4)
main.roll(6, (2, 4))
main_mix = main.render()
i_pre, i_rev = int(T(AT['preload']) * SR), int(T(AT['reveal']) * SR)
xf = int(0.03 * SR)
main_mix[i_pre:i_pre + xf] *= np.linspace(1, 0, xf)[:, None]
main_mix[i_pre + xf:i_rev] = 0
# preloader breakdown, on its own half-bar-shifted grid: chords closing down, heartbeats are in fx
pre = Song(T(AT['preload']))
pre.bar(0, 'break', ci=2, vel=0.85)
pre.bar(1, 'break', ci=3, vel=0.85)
pre_mix = pre.render()
for c in range(2):
    pre_mix[i_pre:i_rev, c] = sweep_filter(pre_mix[i_pre:i_rev, c], 3000, 450, 'low', steps=48)
main_mix[i_pre:i_rev] += pre_mix[i_pre:i_rev] * np.linspace(1, 0.6, i_rev - i_pre)[:, None]
main_mix = tape_stop(main_mix, T(AT['mindSlo']), T(AT['mindHold']), 0.2)

# --- outro: warm groove under the last laugh, logo hit on the bar-2 downbeat, final chord
outro = Song(T(AT['laughEnd']))
outro.bar(0, 'outro', ci=0)
outro.bar(1, 'outro', ci=3)
outro.roll(1, (3, 4))
outro.bar(2, 'end', ci=0)
outro.ep.place(bell(Ab4 * 2), outro.at(2) + 0.0, pan=0.2)
outro.ep.place(bell(Db5 * 2), outro.at(2) + 0.12, pan=-0.2)
outro.drums.place(kick(1.0), outro.at(2))
outro_mix = outro.render()
tail_i = int(DUR * SR)
fade_n = int(1.0 * SR)
outro_mix[tail_i - fade_n:tail_i] *= np.linspace(1, 0, fade_n)[:, None] ** 1.4
outro_mix[tail_i:] = 0

music = np.zeros((len(fx.buf), 2))
L = min(len(music), len(hook_mix))
music[:L] += hook_mix[:L]
m0 = int(T(AT['greet']) * SR)
seg = main_mix[m0:int(T(AT['mindHold']) * SR) + int(0.05 * SR)]
music[m0:m0 + len(seg)] += seg
o0 = int(T(AT['laughEnd']) * SR)
music[o0:] += outro_mix[o0:len(music)]
# under the launch film the room already carries the film's own soundtrack: keep the score back there
film = np.ones(len(music))
f0_, f1_ = int(T(AT['hole']) * SR), int(T(AT['cheer']) * SR)
ramp = int(0.25 * SR)
film[f0_:f1_] = 0.6
film[f0_:f0_ + ramp] = np.linspace(1, 0.6, ramp)
film[f1_ - int(1.0 * SR):f1_] = np.linspace(0.6, 1.0, int(1.0 * SR))   # opens back up into the drop
music = music * film[:, None]
music = hp(music.T, 28).T
music = np.tanh(music * 1.1)

# ================================================================ mix
n_out = int(DUR * SR)
dx_bus, fx_bus, music = dx_bus[:n_out], fx_bus[:n_out], music[:n_out]
# duck the score under voices and laughs (and lift it where the room is quiet)
env = np.sqrt(lp((dx_bus ** 2).mean(axis=1), 6, 1).clip(0) + 1e-9)
duck = 1 - 0.55 * smooth(0.02, 0.12, env)
mix_music = dx_bus * 1.0 + fx_bus * 0.85 + music * (0.5 * duck)[:, None]
mix_dry = dx_bus * 1.0 + fx_bus * 0.95


def lufs(x):
    """Integrated loudness (ITU-R BS.1770-4, 48 kHz): K-weighting, 400 ms blocks, absolute + relative gates."""
    from scipy.signal import lfilter
    y = lfilter([1.53512485958697, -2.69169618940638, 1.19839281085285], [1, -1.69065929318241, 0.73248077421585], x, axis=0)
    y = lfilter([1.0, -2.0, 1.0], [1, -1.99004745483398, 0.99007225036621], y, axis=0)
    blk, hop = int(0.4 * SR), int(0.1 * SR)
    ms = np.array([(y[i:i + blk] ** 2).mean(axis=0).sum() for i in range(0, len(y) - blk, hop)])
    ld = -0.691 + 10 * np.log10(ms + 1e-12)
    g = ms[ld > -70]
    rel = -0.691 + 10 * np.log10(g.mean()) - 10
    g = ms[(ld > -70) & (ld > rel)]
    return -0.691 + 10 * np.log10(g.mean())


def limit(x, ceiling=0.79, look=0.005, release=0.12):
    """Look-ahead peak limiter (ceiling -2 dBFS: leaves room for AAC inter-sample overs)."""
    from scipy.ndimage import maximum_filter1d
    a = np.abs(x).max(axis=1)
    need = np.minimum(1.0, ceiling / np.maximum(a, 1e-9))
    w = int(look * SR)
    need = -maximum_filter1d(-need, size=2 * w + 1)            # min over the look-ahead window
    g = np.empty_like(need)
    r = np.exp(-1 / (release * SR))
    cur = 1.0
    for i, v in enumerate(need):                                 # instant attack, smooth release
        cur = v if v < cur else v + (cur - v) * r
        g[i] = cur
    return x * g[:, None]


def finish(x, target=-14.0):
    """Loudness-normalise to Instagram's ~-14 LUFS with a -2 dBFS ceiling."""
    x = hp(x.T, 30).T
    for _ in range(3):                      # the limiter shaves a little loudness each pass
        x = limit(x * 10 ** ((target - lufs(x)) / 20))
    return x


def stem(x):
    return hp(x.T, 30).T / (np.abs(x).max() + 1e-9) * 0.89


out_dir = os.path.join(root, 'public', 'react')
sf.write(os.path.join(out_dir, 'reel_music.wav'), finish(mix_music), SR, subtype='PCM_24')
sf.write(os.path.join(out_dir, 'reel_nomusic.wav'), finish(mix_dry), SR, subtype='PCM_24')
sf.write(os.path.join(out_dir, 'reel_stem_room.wav'), stem(dx_bus), SR, subtype='PCM_24')
sf.write(os.path.join(out_dir, 'reel_stem_sfx.wav'), stem(fx_bus), SR, subtype='PCM_24')
sf.write(os.path.join(out_dir, 'reel_stem_music.wav'), stem(music), SR, subtype='PCM_24')
for nm in ('reel_music', 'reel_nomusic'):
    y, _ = sf.read(os.path.join(out_dir, nm + '.wav'))
    print(nm, 'LUFS %.1f' % lufs(y), 'peak dBFS %.1f' % (20 * np.log10(np.abs(y).max())))
print('reel audio', round(n_out / SR, 2), 's')
# balance check per section (dBFS RMS before the final peak normalise)
db = lambda x: 20 * np.log10(np.sqrt((x ** 2).mean()) + 1e-9)
for a, b in (('hook', 'rewind'), ('greet', 'hole'), ('hole', 'cheer'), ('cheer', 'preload'), ('preload', 'reveal'), ('reveal', 'm1'),
             ('m1', 'look'), ('look', 'mindHold'), ('laughEnd', 'end'), ('end', None)):
    i, j = int(T(AT[a]) * SR), int(T(AT[b]) * SR) if b else n_out
    print('  %-9s room %6.1f  sfx %6.1f  music %6.1f' % (a, db(dx_bus[i:j]), db(fx_bus[i:j] * 0.85), db(music[i:j] * (0.5 * duck[i:j])[:, None])))
