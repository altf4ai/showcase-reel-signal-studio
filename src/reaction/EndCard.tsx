import React from 'react';
import {AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {clash, interTight} from '../fonts';
import {E, clamp, prog, rand, sp} from '../lib/anim';
import {SR} from '../theme';
import {ShotView} from './ShotView';
import {Shot} from './edl';

/**
 * Back in Signal Room's world (same look as the launch film's logo slam): a red broadcast iris opens
 * over the last laugh, the sticker logo slams on the beat, "on air" pill, typed URL, RAR credit.
 */
export const EndCard: React.FC<{shot: Shot}> = ({shot}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const iris = interpolate(f, [0, 20], [0, 1500], {...clamp, easing: E.inOut});
  // the logo lands on the outro's bar-2 downbeat (audio/reel_mix.py)
  const HIT = 30;
  const s = sp(f, fps, HIT, {damping: 11, mass: 0.55, stiffness: 260});
  const scale = interpolate(s, [0, 1], [2.5, 1]);
  const rot = interpolate(s, [0, 1], [-18, -5]);
  const shake = f >= HIT && f < HIT + 10 ? (rand(f) - 0.5) * 30 * (1 - (f - HIT) / 10) : 0;
  const pill = sp(f, fps, HIT + 16, {damping: 14, stiffness: 300});
  const url = 'signalroom.studio';
  const typed = Math.floor(interpolate(f, [HIT + 26, HIT + 26 + url.length * 1.6], [0, url.length], clamp));
  const credit = prog(f, HIT + 50, HIT + 66, E.out);
  const bgPush = interpolate(f, [0, 30], [1.04, 1.18], clamp);

  return (
    <AbsoluteFill style={{background: '#000', overflow: 'hidden'}}>
      <AbsoluteFill style={{filter: `brightness(${1 - prog(f, 0, 14) * 0.5}) blur(${prog(f, 0, 14) * 6}px)`}}>
        <ShotView shot={shot} cam={{from: 1.04, to: bgPush, y: 0.4}} />
      </AbsoluteFill>
      <AbsoluteFill style={{background: SR.red, clipPath: `circle(${iris}px at 50% 42%)`, transform: `translate(${shake}px, ${shake * 0.6}px)`}}>
        <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', transform: 'translateY(-150px)'}}>
          {Array.from({length: 7}).map((_, i) => {
            const t = ((f + i * 19) % 133) / 133;
            const d = 300 + t * 1700;
            return <div key={i} style={{position: 'absolute', width: d, height: d, borderRadius: '50%', border: `3px solid rgba(249,236,212,${0.32 * (1 - t)})`}} />;
          })}
        </AbsoluteFill>
        <AbsoluteFill style={{background: 'radial-gradient(ellipse 80% 60% at 50% 42%, rgba(255,120,90,0.25) 0%, rgba(120,0,10,0.35) 100%)'}} />
        <div style={{position: 'absolute', left: 0, right: 0, top: 760, display: 'flex', justifyContent: 'center'}}>
          <Img src={staticFile('brand/signalroom/logo_black.png')}
            style={{width: 560, transform: `translateY(-50%) scale(${scale}) rotate(${rot}deg)`, opacity: f >= HIT ? 1 : 0, filter: 'drop-shadow(0 30px 40px rgba(0,0,0,0.38))'}} />
        </div>
        <div style={{position: 'absolute', left: 0, right: 0, top: 1136, display: 'flex', justifyContent: 'center',
          transform: `translateY(${(1 - pill) * 50}px)`, opacity: Math.min(1, pill * 2)}}>
          <div style={{background: SR.ink, color: SR.lime, fontFamily: interTight, fontWeight: 800, fontSize: 44, letterSpacing: '-0.01em', padding: '16px 36px', borderRadius: 99, display: 'flex', alignItems: 'center', gap: 16, boxShadow: '0 14px 30px rgba(0,0,0,0.3)'}}>
            <span style={{width: 16, height: 16, borderRadius: 99, background: SR.red, boxShadow: `0 0 14px ${SR.red}`, opacity: Math.floor(f / 12) % 2 ? 1 : 0.35}} />
            new website — on air
          </div>
        </div>
        <div style={{position: 'absolute', left: 0, right: 0, top: 1232, textAlign: 'center', fontFamily: interTight, fontWeight: 800, fontSize: 62, color: SR.ink, letterSpacing: '-0.025em'}}>
          {url.slice(0, typed)}
          <span style={{opacity: typed > 0 && (typed < url.length || Math.floor(f / 12) % 2) ? 1 : 0}}>▍</span>
        </div>
        <div style={{position: 'absolute', left: 0, right: 0, top: 1356, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14,
          opacity: credit, transform: `translateY(${(1 - credit) * 24}px)`}}>
          <div style={{fontFamily: interTight, fontWeight: 700, fontSize: 30, color: 'rgba(249,236,212,0.92)', letterSpacing: '0.01em'}}>website &amp; launch film by</div>
          <div style={{display: 'flex', alignItems: 'center', gap: 16}}>
            <Img src={staticFile('brand/rar/rar-mark.png')} style={{height: 46}} />
            <span style={{fontFamily: clash, fontWeight: 600, fontSize: 40, color: SR.cream, letterSpacing: '0.02em'}}>RISEABOVEREALITY</span>
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
