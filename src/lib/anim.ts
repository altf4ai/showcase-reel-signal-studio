import {Easing, interpolate, spring} from 'remotion';

export const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

/** Map frame f across [a,b] to [0,1] with an easing, clamped. */
export const prog = (f: number, a: number, b: number, ease: (t: number) => number = Easing.linear) =>
  ease(interpolate(f, [a, b], [0, 1], clamp));

export const E = {
  out: Easing.bezier(0.16, 1, 0.3, 1), // expo-ish out, the "premium" settle
  inOut: Easing.bezier(0.83, 0, 0.17, 1), // snappy in-out for whips
  in: Easing.bezier(0.7, 0, 0.84, 0),
  soft: Easing.bezier(0.45, 0, 0.55, 1),
  back: Easing.bezier(0.34, 1.56, 0.64, 1),
};

export const sp = (frame: number, fps: number, delay = 0, config: Partial<{damping: number; mass: number; stiffness: number}> = {}) =>
  spring({frame: frame - delay, fps, config: {damping: 18, mass: 0.7, stiffness: 180, ...config}});

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Deterministic pseudo-random in [0,1). */
export const rand = (seed: number) => {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
};
