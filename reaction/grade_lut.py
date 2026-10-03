"""Film grade for the client-reaction reel, baked into a 65^3 .cube for ffmpeg's lut3d.

Shot on a phone under warm office light (beige blinds, brick, tungsten-ish LEDs), then squashed
by WhatsApp. The grade: pull the yellow cast back a touch, filmic S-curve with a soft toe and
shoulder, teal shadows / warm highlights, slightly muted overall saturation, and the monitor's
magenta-pink (hue ~336) pulled toward Signal Room red (#EE2D36, hue ~357). Skin (hue 10-20,
sat ~0.4) sits outside both hue windows and keeps its colour.
"""
import os
import sys
import numpy as np

N = 65


def srgb_to_lin(x):
    return np.where(x <= 0.04045, x / 12.92, ((x + 0.055) / 1.055) ** 2.4)


def lin_to_srgb(x):
    x = np.clip(x, 0, None)
    return np.where(x <= 0.0031308, 12.92 * x, 1.055 * x ** (1 / 2.4) - 0.055)


def smooth(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0, 1)
    return t * t * (3 - 2 * t)


def rgb_to_hsv(c):
    r, g, b = c[..., 0], c[..., 1], c[..., 2]
    mx, mn = c.max(-1), c.min(-1)
    d = mx - mn
    h = np.zeros_like(mx)
    m = d > 1e-9
    rm = m & (mx == r)
    gm = m & (mx == g) & ~rm
    bm = m & ~rm & ~gm
    h[rm] = ((g - b)[rm] / d[rm]) % 6
    h[gm] = (b - r)[gm] / d[gm] + 2
    h[bm] = (r - g)[bm] / d[bm] + 4
    h = h * 60
    s = np.where(mx > 1e-9, d / np.maximum(mx, 1e-9), 0)
    return h, s, mx


def hsv_to_rgb(h, s, v):
    h = (h % 360) / 60
    i = np.floor(h).astype(int) % 6
    f = h - np.floor(h)
    p, q, t = v * (1 - s), v * (1 - s * f), v * (1 - s * (1 - f))
    out = np.zeros(h.shape + (3,))
    for k, (a, b_, c) in enumerate([(v, t, p), (q, v, p), (p, v, t), (p, q, v), (t, p, v), (v, p, q)]):
        m = i == k
        out[m, 0], out[m, 1], out[m, 2] = a[m], b_[m], c[m]
    return out


def bell(h, centre, width):
    d = (h - centre + 180) % 360 - 180
    return np.exp(-0.5 * (d / width) ** 2)


def grade(rgb, strength=1.0):
    src = rgb.copy()
    lin = srgb_to_lin(rgb)
    lin = lin * np.array([0.965, 1.0, 1.045])            # take some of the yellow cast out
    lin = lin * 2 ** 0.10                                  # a hair brighter: phone footage sits low
    x = lin_to_srgb(lin)
    # filmic S-curve around mid grey (logistic in "logit" space), per channel
    c = 1.30
    xc = np.clip(x, 1e-4, 1 - 1e-4)
    x = 1 / (1 + ((1 - xc) / xc) ** c)
    x = 0.018 + x * (0.975 - 0.018)                        # soft toe lift + shoulder
    L = x @ np.array([0.2126, 0.7152, 0.0722])
    # teal lives in the shadows (not in pure black), warmth in the highlights
    ws = (smooth(0.0, 0.10, L) * (1 - smooth(0.12, 0.46, L)))[..., None]
    wh = (smooth(0.55, 1.0, L))[..., None]
    x = x + ws * np.array([-0.022, 0.003, 0.024]) + wh * np.array([0.020, 0.007, -0.024])
    x = np.clip(x, 0, 1)
    h, s, v = rgb_to_hsv(x)
    # monitor magenta-pink -> Signal Room red, only for strongly saturated pixels
    w_pink = bell(h, 336, 13) * smooth(0.45, 0.75, s)
    h = h + 15 * w_pink
    # saturation: slightly muted overall, reds of the site kept punchy, the beige blinds and
    # walls (hue ~30-40 in the upper mids) eased toward cream so faces separate from them
    w_red = bell(h, 352, 20) * smooth(0.55, 0.85, s)
    w_beige = bell(h, 36, 9) * smooth(0.45, 0.75, v) * (1 - smooth(0.45, 0.6, s))
    s = s * (0.94 + 0.12 * w_red - 0.16 * w_beige)
    s = np.clip(s, 0, 1)
    x = hsv_to_rgb(h, s, v)
    return src + (x - src) * strength


def write_cube(path, strength=1.0):
    g = np.linspace(0, 1, N)
    b, gg, r = np.meshgrid(g, g, g, indexing='ij')            # .cube: red varies fastest
    rgb = np.stack([r, gg, b], -1).reshape(-1, 3)
    out = np.clip(grade(rgb, strength), 0, 1)
    with open(path, 'w') as f:
        f.write('TITLE "signalroom reaction grade"\nLUT_3D_SIZE %d\n' % N)
        np.savetxt(f, out, fmt='%.6f')


if __name__ == '__main__':
    here = os.path.dirname(os.path.abspath(__file__))
    out = sys.argv[1] if len(sys.argv) > 1 else os.path.join(here, 'grade.cube')
    write_cube(out)
    print('wrote', out)
