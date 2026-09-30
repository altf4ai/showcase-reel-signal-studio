import React from 'react';
import {AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Footage} from '../components/Footage';
import {Grain} from '../components/Grain';
import {clash, satoshi} from '../fonts';
import {E, clamp, prog, sp} from '../lib/anim';
import {BEAT, RAR, SR} from '../theme';

export const END_DUR = BEAT * 10;

/** Back in RAR's world: RISEABOVEREALITY × SIGNALROOM, now live. Local 0 = the hit. */
export const EndLockup: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const ring = prog(f, 0, 50, E.out);
  const left = sp(f, fps, 2, {damping: 20, stiffness: 140});
  const right = sp(f, fps, 8, {damping: 14, stiffness: 180});
  const x = prog(f, 14, 26, E.out);
  const sub = prog(f, BEAT * 2, BEAT * 2 + 16, E.out);
  const url = prog(f, BEAT * 3, BEAT * 3 + 16, E.out);
  const out = prog(f, END_DUR - 36, END_DUR - 4, E.in);
  const flash = 1 - prog(f, 0, 10);
  const push = interpolate(f, [0, END_DUR], [1, 1.05], clamp);

  return (
    <AbsoluteFill style={{background: RAR.bg, overflow: 'hidden'}}>
      {/* the real black hole from riseabovereality.com, behind the lockup */}
      <AbsoluteFill style={{opacity: (0.35 + 0.35 * ring) * (1 - out), transform: `scale(${1.12 * push})`}}>
        <Footage name="rar_hole" map={x => 250 + x * 0.5} />
      </AbsoluteFill>
      <AbsoluteFill style={{background: 'radial-gradient(circle at 50% 50%, rgba(5,5,7,0.85) 0%, rgba(5,5,7,0.4) 35%, rgba(5,5,7,0) 60%)'}} />
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', transform: `translateY(-40px) scale(${push * 1.22})`, opacity: 1 - out}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 64}}>
          <div style={{display: 'flex', alignItems: 'center', gap: 26, transform: `translateX(${(1 - left) * -260}px)`, opacity: left}}>
            <Img src={staticFile('brand/rar/rar-mark.png')} style={{width: 118, filter: 'drop-shadow(0 0 22px rgba(90,200,255,0.45))'}} />
            <div style={{fontFamily: clash, fontWeight: 600, fontSize: 62, letterSpacing: '0.01em', color: RAR.ice, lineHeight: 0.92}}>RISE ABOVE<br />REALITY</div>
          </div>
          <div style={{width: 64, height: 64, position: 'relative', opacity: x, transform: `rotate(${(1 - x) * 90}deg) scale(${0.5 + x * 0.5})`}}>
            <div style={{position: 'absolute', left: 31, top: 0, width: 2, height: 64, background: RAR.blue, transform: 'rotate(45deg)'}} />
            <div style={{position: 'absolute', left: 31, top: 0, width: 2, height: 64, background: RAR.blue, transform: 'rotate(-45deg)'}} />
          </div>
          <div style={{transform: `translateX(${(1 - right) * 260}px) rotate(${-5 + (1 - right) * 20}deg)`, opacity: Math.min(1, right * 1.5)}}>
            <Img src={staticFile('brand/signalroom/logo_red.png')} style={{width: 190, filter: 'drop-shadow(0 16px 28px rgba(0,0,0,0.5))'}} />
          </div>
        </div>
        <div style={{marginTop: 70, fontFamily: satoshi, fontWeight: 600, fontSize: 22, letterSpacing: '0.34em', color: RAR.iceDim, opacity: sub, transform: `translateY(${(1 - sub) * 16}px)`}}>
          WEBSITE DESIGNED &amp; DEVELOPED BY RISEABOVEREALITY
        </div>
        <div style={{marginTop: 34, display: 'flex', gap: 18, opacity: url, transform: `translateY(${(1 - url) * 16}px)`}}>
          <div style={{fontFamily: satoshi, fontWeight: 700, fontSize: 26, color: SR.ink, background: SR.lime, borderRadius: 99, padding: '14px 30px', display: 'flex', alignItems: 'center', gap: 12}}>
            <span style={{width: 11, height: 11, borderRadius: 99, background: SR.red, boxShadow: `0 0 10px ${SR.red}`}} />
            now live — signalroom.framer.website
          </div>
          <div style={{fontFamily: satoshi, fontWeight: 600, fontSize: 26, color: RAR.ice, border: '1.5px solid rgba(238,244,255,0.3)', borderRadius: 99, padding: '14px 30px'}}>
            riseabovereality.com
          </div>
        </div>
      </AbsoluteFill>
      <AbsoluteFill style={{background: RAR.ice, opacity: flash * 0.6}} />
      <Grain opacity={0.08} />
    </AbsoluteFill>
  );
};
