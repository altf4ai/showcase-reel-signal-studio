import React from 'react';
import {AbsoluteFill} from 'remotion';
import {rand} from '../lib/anim';

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/** Quick exposure flash (shutter / impact). */
export type FlashCue = {at: number; dur: number; peak: number; color?: string};
export const Flash: React.FC<{f: number; cues: FlashCue[]}> = ({f, cues}) => {
  let o = 0;
  let color = '#fff8ec';
  for (const c of cues) {
    if (f < c.at || f >= c.at + c.dur) continue;
    const v = c.peak * Math.pow(1 - (f - c.at) / c.dur, 2);
    if (v > o) { o = v; color = c.color ?? color; }
  }
  if (o <= 0.001) return null;
  return <AbsoluteFill style={{background: color, opacity: o, mixBlendMode: 'screen'}} />;
};

/** Film light leak: warm blobs drifting across the frame, screened over the picture. */
export type LeakCue = {at: number; dur: number; tint?: 'warm' | 'red' | 'gold'; seed?: number; peak?: number};
const TINTS = {
  warm: ['255,138,61', '255,74,38', '255,206,140'],
  red: ['238,45,54', '255,96,64', '255,170,110'],
  gold: ['253,183,20', '255,120,50', '255,226,160'],
};
export const LightLeaks: React.FC<{f: number; cues: LeakCue[]}> = ({f, cues}) => (
  <>
    {cues.map((c, i) => {
      if (f < c.at || f >= c.at + c.dur) return null;
      const t = (f - c.at) / c.dur;
      const env = smooth(0, 0.28, t) * (1 - smooth(0.45, 1, t)) * (c.peak ?? 1);
      const cols = TINTS[c.tint ?? 'warm'];
      const s = c.seed ?? i;
      const dir = rand(s * 3.1) > 0.5 ? 1 : -1;
      const blobs = [0, 1, 2].map(k => {
        const x = 50 + dir * (-90 + 180 * t) * (0.7 + 0.25 * k) + (rand(s + k) - 0.5) * 30;
        const y = 20 + rand(s * 7 + k) * 60 + Math.sin(t * 3 + k) * 6;
        const r = 520 + rand(s * 5 + k) * 520;
        return `radial-gradient(${r}px ${r * 1.25}px at ${x}% ${y}%, rgba(${cols[k]},${(0.9 - k * 0.18).toFixed(2)}) 0%, rgba(${cols[k]},0) 70%)`;
      });
      return (
        <AbsoluteFill key={i} style={{pointerEvents: 'none', mixBlendMode: 'screen', opacity: env}}>
          <AbsoluteFill style={{background: blobs.join(',')}} />
          <AbsoluteFill style={{background: `rgba(${cols[0]},0.18)`}} />
        </AbsoluteFill>
      );
    })}
  </>
);

/** Cinema bars that close in for the dramatic beats. */
export type BarCue = {from: number; to: number; h: number};
export const Letterbox: React.FC<{f: number; cues: BarCue[]}> = ({f, cues}) => {
  let h = 0;
  for (const c of cues) {
    const v = smooth(c.from, c.from + 9, f) * (1 - smooth(c.to - 6, c.to, f)) * c.h;
    h = Math.max(h, v);
  }
  if (h < 0.5) return null;
  return (
    <>
      <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: h, background: '#050404'}} />
      <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: h, background: '#050404'}} />
    </>
  );
};

export const Vignette: React.FC<{strength?: number}> = ({strength = 0.5}) => (
  <AbsoluteFill style={{pointerEvents: 'none', background: `radial-gradient(ellipse 78% 62% at 50% 46%, rgba(0,0,0,0) 55%, rgba(8,4,2,${strength}) 100%)`}} />
);

/** Camera shake from impact cues. */
export type HitCue = {at: number; amp: number; dur: number};
export const shakeAt = (f: number, hits: HitCue[]) => {
  let x = 0;
  let y = 0;
  let r = 0;
  for (const h of hits) {
    if (f < h.at || f >= h.at + h.dur) continue;
    const k = Math.pow(1 - (f - h.at) / h.dur, 2) * h.amp;
    x += (rand(f * 1.7 + h.at) - 0.5) * 2 * k;
    y += (rand(f * 2.3 + h.at + 9) - 0.5) * 2 * k;
    r += (rand(f * 3.1 + h.at + 4) - 0.5) * 0.06 * k;
  }
  return {x, y, r};
};

/** VHS fast-rewind look: scanlines, a rolling tracking-noise band, chroma fringe. */
export const VhsRewind: React.FC<{f: number; from: number; to: number}> = ({f, from, to}) => {
  if (f < from || f >= to) return null;
  const t = (f - from) / (to - from);
  const seed = f % 61;
  const bandY = ((f * 37) % 120) / 100 - 0.1;
  const env = smooth(0, 0.1, t) * (1 - smooth(0.85, 1, t));
  return (
    <AbsoluteFill style={{pointerEvents: 'none', opacity: env}}>
      <AbsoluteFill style={{background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.28) 0px, rgba(0,0,0,0.28) 2px, rgba(0,0,0,0) 2px, rgba(0,0,0,0) 5px)'}} />
      <div style={{position: 'absolute', left: 0, right: 0, top: `${bandY * 100}%`, height: 150, mixBlendMode: 'screen', opacity: 0.85}}>
        <svg width="100%" height="100%">
          <filter id={`vhs${seed}`}>
            <feTurbulence type="fractalNoise" baseFrequency="0.02 0.9" numOctaves={2} seed={seed} />
            <feColorMatrix type="saturate" values="0" />
            <feComponentTransfer><feFuncA type="linear" slope="1.4" /></feComponentTransfer>
          </filter>
          <rect width="100%" height="100%" filter={`url(#vhs${seed})`} />
        </svg>
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: `${((bandY + 0.47) % 1.1) * 100}%`, height: 26, background: 'rgba(255,255,255,0.35)', filter: 'blur(3px)'}} />
      <AbsoluteFill style={{background: 'linear-gradient(90deg, rgba(255,0,60,0.10), rgba(0,0,0,0) 30%, rgba(0,0,0,0) 70%, rgba(0,160,255,0.10))', mixBlendMode: 'screen'}} />
    </AbsoluteFill>
  );
};
