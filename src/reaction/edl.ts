import {getInputProps, getStaticFiles} from 'remotion';
import raw from './edl.json';

/** [localFrame, sourceSeconds] with an optional easing name for the segment that ends at this key. */
export type Key = [number, number] | [number, number, string];
export type Shot = {id: string; sec: string; dur: number; keys: Key[]; slo?: string; at: number};

export const FPS = raw.fps;
export const BEAT = 15; // 120 BPM at 30fps
export const SLO = raw.slo as Record<string, {from: number; to: number}>;
export const SHOTS: Shot[] = (() => {
  let t = 0;
  return (raw.shots as unknown as Omit<Shot, 'at'>[]).map(s => {
    const o = {...s, at: t};
    t += s.dur;
    return o;
  });
})();
export const TOTAL = SHOTS.reduce((a, s) => a + s.dur, 0);
const byId = Object.fromEntries(SHOTS.map(s => [s.id, s]));
export const shot = (id: string) => {
  const s = byId[id];
  if (!s) throw new Error(`no shot ${id}`);
  return s;
};
/** Global start frame of a shot. */
export const at = (id: string) => shot(id).at;
export const end = (id: string) => shot(id).at + shot(id).dur;

const ease = (name: string | undefined, t: number) => {
  switch (name) {
    case 'out': return 1 - (1 - t) * (1 - t);
    case 'in': return t * t * t;
    case 'inOut': return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    default: return t;
  }
};

/** Source time (seconds) shown at a shot-local frame. */
export const srcAt = (s: Shot, local: number): number => {
  const k = s.keys;
  if (k.length === 1 || local <= k[0][0]) return k[0][1];
  for (let i = 0; i < k.length - 1; i++) {
    const [a, sa] = k[i];
    const [b, sb, e] = k[i + 1];
    if (local <= b) return sa + (sb - sa) * ease(e, (local - a) / (b - a));
  }
  return k[k.length - 1][1];
};

// --props='{"raw":true}' previews on the ungraded WhatsApp file (e.g. while prep.sh is still writing).
const RAW = (getInputProps() as {raw?: boolean}).raw === true;
const has = (name: string) => !RAW && getStaticFiles().some(f => f.name === name);

/** Which file + frame index shows source time `sec` for this shot (4x slow-mo clip when covered). */
export const frameFor = (s: Shot, sec: number): {file: string; index: number} => {
  const sf = sec * FPS;
  const graded = has('react/graded.mp4') ? 'react/graded.mp4' : 'react/src.mp4';
  if (s.slo) {
    const r = SLO[s.slo];
    const file = `react/slo_${s.slo}.mp4`;
    if (r && sf >= r.from - 0.01 && sf <= r.to + 0.01 && has(file)) return {file, index: Math.round((sf - r.from) * 4)};
  }
  return {file: graded, index: Math.round(sf)};
};
