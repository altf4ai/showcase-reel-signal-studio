import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {Grain} from '../components/Grain';
import {Sticker} from '../components/Sticker';
import {interTight} from '../fonts';
import {E, clamp, prog, sp} from '../lib/anim';
import {BEAT, SR} from '../theme';

const WHY = [
  {n: '/01', title: 'founder led', line: 'You work directly with the two people who built the studio.', bg: SR.cream, sticker: 'st_walkie', tilt: -4},
  {n: '/02', title: 'one clear signal', line: 'Brand, design, content and copy made together.', bg: SR.lime, sticker: 'st_dish', tilt: 3},
  {n: '/03', title: 'less noise', line: 'We would rather say less and mean it.', bg: SR.amber, sticker: 'st_radio', tilt: -3},
  {n: '/04', title: 'made in mumbai', line: 'Built in the loudest city we know.', bg: SR.pink, sticker: 'st_taxi', tilt: 4},
];
const PER = BEAT * 2;
export const WHY_DUR = BEAT * 2 + PER * WHY.length; // 1-beat title card... + cards

/** "why signalroom?" then four tilted sticky-note cards, whip-panned in on the beat. */
export const WhyBlitz: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const TITLE = BEAT * 2;
  if (f < TITLE) {
    return (
      <AbsoluteFill style={{background: SR.red, alignItems: 'center', justifyContent: 'center'}}>
        <div style={{fontFamily: interTight, fontWeight: 900, fontSize: 215, letterSpacing: '-0.06em', color: SR.ink, transform: `scale(${1.25 - 0.25 * prog(f, 0, 8, E.out)})`}}>
          why signal<span style={{color: SR.cream}}>room?</span>
        </div>
        <Grain opacity={0.07} />
      </AbsoluteFill>
    );
  }
  const g = f - TITLE;
  const i = Math.min(WHY.length - 1, Math.floor(g / PER));
  const local = g - i * PER;
  const w = WHY[i];
  const whip = 1 - prog(local, 0, 8, E.out); // whip in from the right
  const st = sp(local, fps, 3, {damping: 10, stiffness: 260, mass: 0.6});
  const drift = interpolate(local, [0, PER], [0, -24], clamp);
  return (
    <AbsoluteFill style={{background: SR.red, overflow: 'hidden'}}>
      <AbsoluteFill style={{background: `repeating-linear-gradient(90deg, rgba(18,16,16,0.06) 0 2px, transparent 2px 120px)`}} />
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', transform: `translateX(${whip * 1900 + drift}px) skewX(${-whip * 12}deg)`, filter: whip > 0.05 ? `blur(${whip * 18}px)` : undefined}}>
        <div style={{width: 1320, height: 720, background: w.bg, borderRadius: 40, border: `5px solid ${SR.ink}`, transform: `rotate(${w.tilt}deg)`, position: 'relative',
          boxShadow: '0 40px 80px -20px rgba(0,0,0,0.45)', padding: '70px 90px', boxSizing: 'border-box'}}>
          <div style={{display: 'flex', justifyContent: 'space-between', fontFamily: interTight, fontWeight: 800, fontSize: 34, color: SR.ink, opacity: 0.7}}>
            <span>{w.n}</span>
            <svg width="44" height="32" viewBox="0 0 15 11">{[0, 1, 2, 3].map(b => <rect key={b} x={b * 4} y={10 - (b + 1) * 2.5} width="2.6" height={(b + 1) * 2.5} fill={SR.ink} />)}</svg>
          </div>
          <div style={{position: 'absolute', left: 90, bottom: 150, fontFamily: interTight, fontWeight: 900, fontSize: w.title.length > 12 ? 150 : 180, lineHeight: 0.85, letterSpacing: '-0.06em', color: SR.ink, maxWidth: 820}}>
            {w.title}
          </div>
          <div style={{position: 'absolute', left: 94, bottom: 80, fontFamily: interTight, fontWeight: 600, fontSize: 30, color: SR.ink, opacity: 0.75, letterSpacing: '-0.01em'}}>{w.line}</div>
          <div style={{position: 'absolute', right: 40, top: 60, transform: `scale(${st}) rotate(${10 - (1 - st) * 40}deg)`}}>
            <Sticker name={w.sticker} size={440} />
          </div>
        </div>
      </AbsoluteFill>
      <Grain opacity={0.07} />
    </AbsoluteFill>
  );
};
