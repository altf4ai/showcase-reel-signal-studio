import React from 'react';
import {AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Grain} from '../components/Grain';
import {interTight} from '../fonts';
import {E, clamp, prog, rand, sp} from '../lib/anim';
import {BEAT, SR} from '../theme';

/** Signalroom's hero red with broadcast rings, and the sticker logo slammed on the downbeat. Local frame 0 = the hit. */
export const LogoSlam: React.FC<{w?: number; h?: number}> = ({w = 1920, h = 1080}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const s = sp(f, fps, 0, {damping: 11, mass: 0.55, stiffness: 260});
  const scale = interpolate(s, [0, 1], [2.6, 1]);
  const rot = interpolate(s, [0, 1], [-18, -5]);
  const shake = f < 10 ? (rand(f) - 0.5) * 26 * (1 - f / 10) : 0;
  const flash = 1 - prog(f, 0, 8);
  const chip = sp(f, fps, BEAT, {damping: 14, stiffness: 300});
  const url = 'signalroom.studio';
  const typed = Math.floor(interpolate(f, [BEAT * 2, BEAT * 2 + url.length * 2], [0, url.length], clamp));
  const k = w / 1920;

  return (
    <AbsoluteFill style={{background: SR.red, overflow: 'hidden', transform: `translate(${shake * k}px, ${shake * 0.6 * k}px)`}}>
      {/* broadcast rings, like the site hero */}
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
        {Array.from({length: 6}).map((_, i) => {
          const t = ((f + i * 22) % 132) / 132;
          const d = (280 + t * 1500) * k;
          return <div key={i} style={{position: 'absolute', width: d, height: d, borderRadius: '50%', border: `${2 * k}px solid rgba(249,236,212,${0.35 * (1 - t)})`}} />;
        })}
      </AbsoluteFill>
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', transform: `translateY(${-40 * k}px)`}}>
        <Img src={staticFile('brand/signalroom/logo_black.png')}
          style={{width: 420 * k, transform: `scale(${scale}) rotate(${rot}deg)`, filter: `drop-shadow(0 ${24 * k}px ${30 * k}px rgba(0,0,0,0.35))`}} />
      </AbsoluteFill>
      <div style={{position: 'absolute', left: 0, right: 0, bottom: 190 * k, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16 * k,
        transform: `translateY(${(1 - chip) * 40 * k}px)`, opacity: Math.min(1, chip * 2)}}>
        <div style={{background: SR.ink, color: SR.lime, fontFamily: interTight, fontWeight: 800, fontSize: 30 * k, letterSpacing: '-0.01em', padding: `${12 * k}px ${26 * k}px`, borderRadius: 99, display: 'flex', alignItems: 'center', gap: 12 * k}}>
          <span style={{width: 12 * k, height: 12 * k, borderRadius: 99, background: SR.red, boxShadow: `0 0 ${12 * k}px ${SR.red}`}} />
          new website — on air
        </div>
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, bottom: 132 * k, textAlign: 'center', fontFamily: interTight, fontWeight: 700, fontSize: 26 * k, color: SR.ink, letterSpacing: '-0.01em', opacity: 0.85}}>
        {url.slice(0, typed)}
        <span style={{opacity: typed < url.length || Math.floor(f / 15) % 2 ? 1 : 0}}>▍</span>
      </div>
      <AbsoluteFill style={{background: '#fff', opacity: flash * 0.85}} />
      <Grain opacity={0.06} />
    </AbsoluteFill>
  );
};
