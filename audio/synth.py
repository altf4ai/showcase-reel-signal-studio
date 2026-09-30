"""Procedural sound design + music toolkit for the launch film.

Everything is synthesized (no samples, no licensing risk) and placed on an exact frame grid:
60fps video, 120 BPM => 1 beat = 30 frames = 0.5s.
"""
import numpy as np
from scipy import signal

SR = 48000
FPS = 60
BPM = 120
BEAT_S = 60 / BPM
rng = np.random.default_rng(7)


def fr(frame):
    """Video frame -> seconds."""
    return frame / FPS


def t_axis(dur):
    return np.arange(int(dur * SR)) / SR


def env_adsr(n, a=0.005, d=0.1, s=0.0, r=0.05, sustain_time=None):
    a_n, d_n, r_n = int(a * SR), int(d * SR), int(r * SR)
    s_n = max(0, n - a_n - d_n - r_n) if sustain_time is None else int(sustain_time * SR)
    e = np.concatenate([
        np.linspace(0, 1, max(a_n, 1), endpoint=False),
        np.linspace(1, s, max(d_n, 1), endpoint=False),
        np.full(s_n, s),
        np.linspace(s, 0, max(r_n, 1)),
    ])
    out = np.zeros(n)
    out[: min(n, len(e))] = e[:n]
    return out


def exp_decay(n, tau):
    return np.exp(-np.arange(n) / (tau * SR))


def noise(n, color='white'):
    x = rng.standard_normal(n)
    if color == 'pink':
        b, a = [0.049922035, -0.095993537, 0.050612699, -0.004408786], [1, -2.494956002, 2.017265875, -0.522189400]
        x = signal.lfilter(b, a, x) * 4
    return x


def bp(x, lo, hi, order=2):
    sos = signal.butter(order, [lo, hi], btype='band', fs=SR, output='sos')
    return signal.sosfilt(sos, x)


def hp(x, f, order=2):
    return signal.sosfilt(signal.butter(order, f, btype='high', fs=SR, output='sos'), x)


def lp(x, f, order=2):
    return signal.sosfilt(signal.butter(order, f, btype='low', fs=SR, output='sos'), x)


def sweep_filter(x, f0, f1, kind='low', q=0.7, steps=64):
    """Time-varying biquad (block-wise) for filter sweeps."""
    out = np.zeros_like(x)
    n = len(x)
    blk = max(1, n // steps)
    zi = None
    for i in range(0, n, blk):
        k = i / max(1, n - 1)
        fc = f0 * (f1 / f0) ** k
        fc = min(max(fc, 20), SR / 2 - 100)
        if kind == 'band':
            sos = signal.butter(2, [fc / (1 + 0.5 / q), fc * (1 + 0.5 / q)], btype='band', fs=SR, output='sos')
        else:
            sos = signal.butter(2, fc, btype=kind, fs=SR, output='sos')
        if zi is None or zi.shape[0] != sos.shape[0]:
            zi = signal.sosfilt_zi(sos) * 0
        out[i:i + blk], zi = signal.sosfilt(sos, x[i:i + blk], zi=zi)
    return out


def sat(x, drive=1.0):
    return np.tanh(x * drive) / np.tanh(drive)


def osc_sine_glide(f0, f1, dur, curve=4.0):
    n = int(dur * SR)
    k = np.linspace(0, 1, n)
    f = f1 + (f0 - f1) * np.exp(-curve * k)
    return np.sin(2 * np.pi * np.cumsum(f) / SR)


def saw(freq, dur, detune=0.0):
    t = t_axis(dur)
    f = freq * (1 + detune)
    return 2 * ((t * f) % 1) - 1


# ------------------------------------------------------------------ drums

def kick(dur=0.55, punch=1.0, f_hi=160, f_lo=46):
    n = int(dur * SR)
    body = osc_sine_glide(f_hi, f_lo, dur, curve=28) * exp_decay(n, 0.22)
    click = hp(noise(n), 2000) * exp_decay(n, 0.004) * 0.5
    return sat((body + click) * 1.3 * punch, 1.6) * 0.95


def sub808(freq, dur, glide_from=None, drive=2.2):
    n = int(dur * SR)
    if glide_from:
        k = np.linspace(0, 1, n)
        f = freq + (glide_from - freq) * np.exp(-k * 18)
    else:
        f = np.full(n, freq)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR)
    e = env_adsr(n, a=0.003, d=dur * 0.6, s=0.55, r=0.08)
    return sat(x * e, drive) * 0.8


def clap(dur=0.35):
    n = int(dur * SR)
    x = np.zeros(n)
    for i, off in enumerate([0, 0.011, 0.022]):
        o = int(off * SR)
        m = n - o
        x[o:] += bp(noise(m), 900, 2600) * exp_decay(m, 0.006 if i < 2 else 0.09)
    return sat(x * 2.2, 1.4) * 0.7


def snare(dur=0.3):
    n = int(dur * SR)
    tone = np.sin(2 * np.pi * 190 * t_axis(dur)) * exp_decay(n, 0.05)
    nz = bp(noise(n), 1500, 9000) * exp_decay(n, 0.08)
    return sat(tone * 0.6 + nz * 0.9, 1.5) * 0.7


def hat(open_=False, dur=None):
    dur = dur or (0.3 if open_ else 0.06)
    n = int(dur * SR)
    t = t_axis(dur)
    metal = sum(np.sign(np.sin(2 * np.pi * f * t)) for f in [3140, 4265, 5389, 6817, 8201])
    x = hp(metal * 0.15 + noise(n) * 0.6, 7000) * exp_decay(n, 0.12 if open_ else 0.018)
    return x * 0.45


# ------------------------------------------------------------------ fx

def reverse_swell(dur=2.0, bright=9000):
    """Reverse-cymbal style swell into a hit."""
    n = int(dur * SR)
    x = hp(noise(n), 3000) * (np.linspace(0, 1, n) ** 3.2)
    x = sweep_filter(x, 1500, bright, 'low')
    return x * 0.7


def riser(dur=2.0, f0=200, f1=1800):
    n = int(dur * SR)
    k = np.linspace(0, 1, n)
    tone = np.sin(2 * np.pi * np.cumsum(f0 * (f1 / f0) ** k) / SR)
    tone += 0.5 * np.sin(2 * np.pi * np.cumsum(f0 * 1.5 * (f1 / f0) ** k) / SR)
    nz = sweep_filter(noise(n), 400, 9000, 'band', q=1.2)
    return (tone * 0.25 + nz * 0.6) * (k ** 2.2)


def impact(dur=3.0, f0=110, f1=28):
    n = int(dur * SR)
    boom = osc_sine_glide(f0, f1, dur, curve=5) * exp_decay(n, 0.7)
    crack = bp(noise(n), 400, 6000) * exp_decay(n, 0.05)
    tail = lp(noise(n), 900) * exp_decay(n, 0.6) * 0.3
    return sat(boom * 1.4 + crack * 0.8 + tail, 1.8) * 0.9


def whoosh(dur=0.5, f0=300, f1=4000, pan_from=-0.8, pan_to=0.8):
    n = int(dur * SR)
    k = np.linspace(0, 1, n)
    e = np.sin(np.pi * k) ** 1.6
    x = sweep_filter(noise(n, 'pink'), f0, f1, 'band', q=1.5) * e * 1.8
    pan = np.linspace(pan_from, pan_to, n)
    return np.stack([x * np.sqrt((1 - pan) / 2), x * np.sqrt((1 + pan) / 2)], axis=1)


def whip(dur=0.22):
    return whoosh(dur, 800, 7000, -0.6, 0.6) * 1.2


def static_burst(dur=0.4, amp=0.5):
    n = int(dur * SR)
    x = bp(noise(n), 800, 11000)
    crackle = (rng.random(n) > 0.997) * rng.standard_normal(n) * 3
    e = env_adsr(n, a=0.002, d=0.02, s=0.8, r=dur * 0.4)
    return (x + crackle) * e * amp


def tuning_sweep(dur=1.2, f0=900, f1=2400, wobble=7):
    """Radio dial: whistling heterodyne tone drifting through static."""
    n = int(dur * SR)
    k = np.linspace(0, 1, n)
    f = f0 + (f1 - f0) * (0.5 - 0.5 * np.cos(np.pi * k)) + 60 * np.sin(2 * np.pi * wobble * k * dur)
    tone = np.sin(2 * np.pi * np.cumsum(f) / SR) * (0.3 + 0.7 * np.abs(np.sin(np.pi * k * 3)))
    st = bp(noise(n), 1000, 8000) * 0.35
    e = env_adsr(n, a=0.05, d=0.1, s=0.9, r=0.2)
    return (tone * 0.25 + st) * e


def beep(freq=1000, dur=0.12):
    n = int(dur * SR)
    t = t_axis(dur)
    x = np.sin(2 * np.pi * freq * t) + 0.3 * np.sin(2 * np.pi * freq * 2 * t)
    return x * env_adsr(n, a=0.002, d=0.02, s=0.8, r=0.03) * 0.35


def tick(freq=4200, dur=0.03, amp=0.35):
    n = int(dur * SR)
    return np.sin(2 * np.pi * freq * t_axis(dur)) * exp_decay(n, 0.006) * amp


def ui_click(amp=0.5):
    n = int(0.05 * SR)
    x = bp(noise(n), 2000, 9000) * exp_decay(n, 0.002)
    x += np.sin(2 * np.pi * 1800 * t_axis(0.05)) * exp_decay(n, 0.004) * 0.6
    return x * amp


def slap(amp=0.7):
    """Sticker slap: short thump + papery snap."""
    n = int(0.25 * SR)
    thump = osc_sine_glide(220, 70, 0.25, curve=20) * exp_decay(n, 0.04)
    snap = bp(noise(n), 1200, 7000) * exp_decay(n, 0.012)
    return sat(thump + snap * 0.8, 1.5) * amp


def crt_off():
    dur = 0.45
    n = int(dur * SR)
    zip_ = osc_sine_glide(9000, 120, dur, curve=9) * exp_decay(n, 0.12) * 0.35
    thunk = osc_sine_glide(140, 50, dur, curve=25) * exp_decay(n, 0.06)
    return sat(zip_ + thunk, 1.3) * 0.8


def glitch(dur=0.45, seed_src=None):
    """Stutter/bitcrush burst."""
    n = int(dur * SR)
    src = seed_src if seed_src is not None else bp(noise(n), 200, 6000) + np.sin(2 * np.pi * 110 * t_axis(dur))
    out = np.zeros(n)
    i = 0
    while i < n:
        L = int(SR * rng.choice([0.008, 0.016, 0.024, 0.04]))
        rep = rng.integers(1, 4)
        chunk = src[i:i + L]
        for _ in range(rep):
            if i >= n:
                break
            m = min(len(chunk), n - i)
            out[i:i + m] = chunk[:m] * (rng.random() > 0.15)
            i += m
    bits = 5
    out = np.round(out * 2 ** bits) / 2 ** bits
    return out * np.linspace(0.3, 1, n) * 0.5


def shimmer(freq=2637, dur=1.2, amp=0.12):
    n = int(dur * SR)
    t = t_axis(dur)
    x = np.sin(2 * np.pi * freq * t) + 0.4 * np.sin(2 * np.pi * freq * 2.01 * t)
    return x * exp_decay(n, 0.35) * env_adsr(n, a=0.003, d=0.01, s=1, r=0.01) * amp


def drone(dur, freqs=(43.65, 87.3, 130.8), amp=0.3, attack=1.5):
    n = int(dur * SR)
    t = t_axis(dur)
    x = sum(np.sin(2 * np.pi * f * t + i) * (0.6 ** i) for i, f in enumerate(freqs))
    x += 0.15 * lp(noise(n, 'pink'), 300)
    e = np.minimum(1, t / attack) * np.minimum(1, (dur - t) / 0.3)
    return x * e * amp


def pad(freqs, dur, amp=0.12, cutoff=1400, attack=0.4):
    n = int(dur * SR)
    x = np.zeros(n)
    for fq in freqs:
        for d in (-0.006, 0.0, 0.007):
            x += saw(fq, dur, d)
    x = lp(x / (len(freqs) * 3), cutoff, 2)
    t = t_axis(dur)
    e = np.minimum(1, t / attack) * np.minimum(1, (dur - t) / 0.25)
    return x * e * amp


def pluck(freq, dur=0.35, amp=0.22, bright=5000):
    n = int(dur * SR)
    x = saw(freq, dur, 0) + saw(freq, dur, 0.004)
    x = sweep_filter(x, bright, 400, 'low', steps=24)
    return x * exp_decay(n, 0.12) * amp


# ------------------------------------------------------------------ space + master

def reverb_ir(dur=2.2, damp=5000, seed=3):
    r = np.random.default_rng(seed)
    n = int(dur * SR)
    t = np.arange(n) / SR
    ir = np.stack([r.standard_normal(n), r.standard_normal(n)], axis=1) * np.exp(-t / (dur / 6.9))[:, None]
    ir = np.stack([lp(ir[:, 0], damp), lp(ir[:, 1], damp)], axis=1)
    ir[: int(0.01 * SR)] *= np.linspace(0, 1, int(0.01 * SR))[:, None]
    return ir / np.sqrt((ir ** 2).sum(axis=0))


def reverb(x_st, ir, wet=0.25):
    out = np.stack([signal.fftconvolve(x_st[:, c], ir[:, c])[: len(x_st)] for c in range(2)], axis=1)
    return x_st * (1 - wet) + out * wet * 1.5


class Track:
    """Stereo bus. place(sig, at_s, gain, pan)."""

    def __init__(self, dur):
        self.buf = np.zeros((int(dur * SR), 2))

    def place(self, sig, at, gain=1.0, pan=0.0):
        s = np.asarray(sig, dtype=float)
        if s.ndim == 1:
            s = np.stack([s * np.sqrt((1 - pan) / 2) * 1.414, s * np.sqrt((1 + pan) / 2) * 1.414], axis=1)
        i = int(round(at * SR))
        if i >= len(self.buf):
            return
        if i < 0:
            s = s[-i:]
            i = 0
        m = min(len(s), len(self.buf) - i)
        self.buf[i:i + m] += s[:m] * gain


def sidechain(x_st, kick_times, depth=0.6, release=0.18):
    n = len(x_st)
    g = np.ones(n)
    rel = int(release * SR)
    curve = 1 - depth * np.exp(-np.arange(rel) / (rel / 4))
    for kt in kick_times:
        i = int(kt * SR)
        m = min(rel, n - i)
        if m > 0:
            g[i:i + m] = np.minimum(g[i:i + m], curve[:m])
    return x_st * g[:, None]


def master(x_st, target_peak=0.93):
    # glue: gentle soft-knee compression via RMS envelope
    rms = np.sqrt(signal.sosfilt(signal.butter(1, 8, fs=SR, output='sos'), (x_st ** 2).mean(axis=1)) + 1e-9)
    thr = 0.22
    gain = np.where(rms > thr, (thr / rms) ** 0.45, 1.0)
    y = x_st * gain[:, None]
    y = hp(y.T, 25).T
    y = np.tanh(y * 1.15)
    return y / (np.abs(y).max() + 1e-9) * target_peak
