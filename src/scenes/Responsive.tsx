import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {Footage} from '../components/Footage';
import {Grain} from '../components/Grain';
import {Phone} from '../components/Phone';
import {Slam} from '../components/Slam';
import {interTight} from '../fonts';
import {E, clamp, lerp, prog, sp} from '../lib/anim';
import {BEAT, SR} from '../theme';

export const RESPONSIVE_DUR = BEAT * 12;

/** One window that morphs desktop -> tablet -> phone with the real reflowed site inside. */
const Morph: React.FC = () => {
  const f = useCurrentFrame();
  const m1 = prog(f, BEAT * 1.5, BEAT * 1.5 + 14, E.inOut); // desktop -> tablet
  const m2 = prog(f, BEAT * 3, BEAT * 3 + 14, E.inOut); // tablet -> phone
  const H = 860;
  const wDesk = H * (16 / 9);
  const wTab = H * (834 / 1112);
  const wPh = H * (393 / 852);
  const w = lerp(lerp(wDesk, wTab, m1), wPh, m2);
  const r = lerp(lerp(18, 34, m1), 64, m2);
  const which = m2 > 0.5 ? 2 : m1 > 0.5 ? 1 : 0;
  const xfade = which === 0 ? 1 - m1 * 2 : which === 1 ? Math.min((m1 - 0.5) * 2, 1 - m2 * 2) : (m2 - 0.5) * 2;
  const names = ['hero', 't_hero', 'm_hero_still'];
  const out = prog(f, BEAT * 5 - 10, BEAT * 5, E.in);
  const label = ['desktop.', 'tablet.', 'mobile.'][which];
  return (
    <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', opacity: 1 - out, transform: `scale(${1 - out * 0.1})`}}>
      <div style={{width: w, height: H, borderRadius: r, overflow: 'hidden', background: SR.red, position: 'relative',
        boxShadow: `0 0 0 ${lerp(0, 12, m2)}px #0b0a0a, 0 60px 120px -30px rgba(0,0,0,0.55)`}}>
        <div style={{position: 'absolute', inset: 0, opacity: Math.max(0.15, xfade)}}>
          <Footage name={names[which]} map={() => (which === 0 ? 180 : 40 + f * 0.5)} style={{objectFit: 'cover', objectPosition: 'top center'}} />
        </div>
      </div>
      <div style={{position: 'absolute', left: 90, bottom: 80, fontFamily: interTight, fontWeight: 900, fontSize: 120, letterSpacing: '-0.055em', color: SR.ink}}>{label}</div>
    </AbsoluteFill>
  );
};

export const Responsive: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const PH = BEAT * 5; // phones section starts
  const g = f - PH;
  const phones = [
    {name: 'm_hero', x: -560, y: 60, d: 0, speed: 1.1},
    {name: 'm_services', x: 0, y: -30, d: 6, speed: 1.0},
    {name: 'm_why', x: 560, y: 60, d: 12, speed: 1.0},
  ];
  return (
    <AbsoluteFill style={{background: SR.cream, overflow: 'hidden'}}>
      {f < PH && <Morph />}
      {g >= 0 && (
        <>
          <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
            {phones.map((p, i) => {
              const e = sp(g, fps, p.d, {damping: 16, stiffness: 150});
              const par = interpolate(g, [0, RESPONSIVE_DUR - PH], [0, -40 * (i - 1)], clamp);
              return (
                <div key={p.name} style={{position: 'absolute', transform: `translate(${p.x}px, ${p.y + (1 - e) * 1000 + par}px) rotate(${(i - 1) * 4 * (1 - e * 0.7)}deg)`}}>
                  <Phone width={380}>
                    <Footage name={p.name} map={x => 20 + (x - PH) * p.speed * 1.4} />
                  </Phone>
                </div>
              );
            })}
          </AbsoluteFill>
          <AbsoluteFill style={{alignItems: 'center', justifyContent: 'flex-start', paddingTop: 36}}>
            <Slam text="every screen. one clear signal." at={PH + BEAT * 2} size={72} color={SR.ink} />
          </AbsoluteFill>
        </>
      )}
      <Grain opacity={0.06} />
    </AbsoluteFill>
  );
};
