import React from 'react';
import {AbsoluteFill} from 'remotion';
import {loadFont} from '@remotion/google-fonts/VT323';
import {E, prog} from '../lib/anim';

export const vt = loadFont('normal', {weights: ['400'], subsets: ['latin']}).fontFamily;

const INK = '#F7F2E8';
const glow = '0 0 10px rgba(255,246,230,0.55), 0 2px 0 rgba(0,0,0,0.5)';

const Tri: React.FC<{dir: 'l' | 'r'; s: number}> = ({dir, s}) => (
  <div style={{width: 0, height: 0, borderTop: `${s * 0.5}px solid transparent`, borderBottom: `${s * 0.5}px solid transparent`,
    [dir === 'r' ? 'borderLeft' : 'borderRight']: `${s * 0.8}px solid ${INK}`, filter: 'drop-shadow(0 0 6px rgba(255,246,230,0.5))'}} />
);
const Bars: React.FC<{s: number}> = ({s}) => (
  <div style={{display: 'flex', gap: s * 0.22}}>
    {[0, 1].map(i => <div key={i} style={{width: s * 0.26, height: s, background: INK, boxShadow: '0 0 6px rgba(255,246,230,0.5)'}} />)}
  </div>
);

export type Mode = 'play' | 'pause' | 'rew';

const tc = (sec: number) => {
  const s = Math.max(0, sec);
  const m = Math.floor(s / 60);
  const ss = Math.floor(s % 60);
  const ff = Math.floor((s * 30) % 30);
  return `${String(m).padStart(2, '0')}:${String(ss).padStart(2, '0')}:${String(ff).padStart(2, '0')}`;
};

/** VCR on-screen display: transport state + tape counter (it really runs backwards on the rewind). */
export const Osd: React.FC<{f: number; srcSec: number; mode: Mode | null; modeAge: number; opacity: number; bigRew?: number}> = ({f, srcSec, mode, modeAge, opacity, bigRew = 0}) => {
  if (opacity <= 0.01 || !mode) return null;
  const s = 34;
  // PLAY settles to a quiet persistent label; PAUSE blinks; REW stays lit
  const modeVis = mode === 'pause' ? (Math.floor(modeAge / 8) % 2 === 0 ? 1 : 0.3) : mode === 'play' ? 1 - 0.45 * prog(modeAge, 26, 40) : 1;
  return (
    <AbsoluteFill style={{pointerEvents: 'none', opacity}}>
      <div style={{position: 'absolute', left: 66, top: 226, fontFamily: vt, color: INK, textShadow: glow, lineHeight: 1, letterSpacing: '0.04em'}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 14, fontSize: 50, opacity: modeVis}}>
          {mode === 'play' && <><span>PLAY</span><Tri dir="r" s={s} /></>}
          {mode === 'pause' && <><span>PAUSE</span><Bars s={s} /></>}
          {mode === 'rew' && <><div style={{display: 'flex'}}><Tri dir="l" s={s} /><Tri dir="l" s={s} /></div><span>REW</span></>}
        </div>
        <div style={{marginTop: 12, fontSize: 40, opacity: 0.6 + 0.3 * (mode === 'play' ? 1 - prog(modeAge, 26, 40) : 1)}}>{tc(srcSec)}</div>
      </div>
      {bigRew > 0 && (
        <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', opacity: bigRew}}>
          <div style={{display: 'flex', alignItems: 'center', gap: 26, transform: `translateY(-120px) scale(${0.9 + 0.1 * prog(bigRew, 0, 1, E.out)})`}}>
            <div style={{display: 'flex'}}><Tri dir="l" s={120} /><Tri dir="l" s={120} /></div>
            <span style={{fontFamily: vt, fontSize: 170, color: INK, textShadow: glow, letterSpacing: '0.06em'}}>REW</span>
          </div>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};
