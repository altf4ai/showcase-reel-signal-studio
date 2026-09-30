import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {Grain} from '../components/Grain';
import {Sticker} from '../components/Sticker';
import {interTight} from '../fonts';
import {E, clamp, prog, sp} from '../lib/anim';
import {BEAT, SR} from '../theme';

export const SERVICES = [
  {name: 'brand strategy', bg: SR.red, fg: SR.ink, sticker: 'st_tower', tags: ['Positioning', 'Brand Narrative', 'Naming', 'Audience & Insight']},
  {name: 'brand identity', bg: SR.amber, fg: SR.ink, sticker: 'st_tv', tags: ['Logo Design', 'Visual System', 'Brand Guidelines', 'Packaging']},
  {name: 'creative direction', bg: SR.lime, fg: SR.ink, sticker: 'st_clapper', tags: ['Campaign Concepts', 'Art Direction', 'Shoots & Scripting']},
  {name: 'content', bg: SR.cream, fg: SR.ink, sticker: 'st_mic', tags: ['Copywriting', 'Video & Photography', 'Web Copy']},
  {name: 'illustration', bg: SR.pink, fg: SR.ink, sticker: 'st_hand', tags: ['Custom Artwork', 'Iconography', 'Character Design']},
  {name: 'social media', bg: SR.ink, fg: SR.cream, sticker: 'st_phone', tags: ['Content Strategy', 'Platform Design', 'Community']},
];

const PER = BEAT * 2; // one card per 2 beats

const Card: React.FC<{i: number; local: number}> = ({i, local}) => {
  const {fps} = useVideoConfig();
  const s = SERVICES[i];
  // slides up from below like the site's stacking cards (6 frames), then settles
  const slide = prog(local, 0, 7, E.out);
  const y = (1 - slide) * 1100;
  const rot = (1 - slide) * 3;
  const st = sp(local, fps, 4, {damping: 10, stiffness: 240, mass: 0.6});
  const drift = interpolate(local, [0, PER], [0, -18], clamp);
  const numOutline = String(i + 1).padStart(2, '0');
  return (
    <AbsoluteFill style={{transform: `translateY(${y}px) rotate(${rot}deg)`, transformOrigin: '50% 100%'}}>
      <AbsoluteFill style={{background: s.bg, borderRadius: slide < 1 ? 56 : 0, border: slide < 1 ? `4px solid ${SR.ink}` : undefined, overflow: 'hidden'}}>
        {/* giant outline numeral like the site cards */}
        <div style={{position: 'absolute', right: 70, top: 80, fontFamily: interTight, fontWeight: 900, fontSize: 820, lineHeight: 0.8, letterSpacing: '-0.06em',
          color: 'transparent', WebkitTextStroke: `3px ${s.fg}`, opacity: 0.16, transform: `translateY(${drift * 2}px)`}}>{numOutline}</div>
        <div style={{position: 'absolute', left: 110, top: 96, fontFamily: interTight, fontWeight: 800, fontSize: 26, letterSpacing: '0.12em', color: s.fg, opacity: 0.75, display: 'flex', gap: 14, alignItems: 'center'}}>
          SERVICE / {numOutline}
          <svg width="30" height="22" viewBox="0 0 15 11">{[0, 1, 2, 3].map(b => <rect key={b} x={b * 4} y={10 - (b + 1) * 2.5} width="2.6" height={(b + 1) * 2.5} fill={s.fg} opacity={b <= (local / 8) % 4 ? 1 : 0.25} />)}</svg>
        </div>
        <div style={{position: 'absolute', left: 104, top: s.name.includes(' ') ? 230 : 350, transform: `translateY(${drift}px)`}}>
          {s.name.split(' ').map((w, j) => (
            <div key={w} style={{overflow: 'hidden', paddingBottom: 18}}>
              <div style={{fontFamily: interTight, fontWeight: 900, fontSize: 250, lineHeight: 0.82, letterSpacing: '-0.06em', color: s.fg,
                transform: `translateY(${(1 - prog(local, 2 + j * 3, 14 + j * 3, E.out)) * 105}%)`}}>
                {w}
              </div>
            </div>
          ))}
          <div style={{display: 'flex', gap: 14, marginTop: 40}}>
            {s.tags.map((t, j) => {
              const p = sp(local, fps, 10 + j * 3, {damping: 14, stiffness: 320});
              return (
                <div key={t} style={{border: `2.5px solid ${s.fg}`, color: s.fg, borderRadius: 99, padding: '12px 26px', fontFamily: interTight, fontWeight: 700, fontSize: 28,
                  letterSpacing: '-0.01em', transform: `translateY(${(1 - p) * 30}px) scale(${0.8 + p * 0.2})`, opacity: Math.min(1, p * 2)}}>
                  <span style={{opacity: 0.55, marginRight: 10}}>{String(j + 1).padStart(2, '0')}</span>{t}
                </div>
              );
            })}
          </div>
        </div>
        <div style={{position: 'absolute', right: 140, top: 300, transform: `scale(${st}) rotate(${-8 + (1 - st) * 40}deg) translateY(${drift * 1.5}px)`}}>
          <Sticker name={s.sticker} size={520} />
        </div>
        <Grain opacity={0.07} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/** Six service cards, one per two beats, stacking over each other. */
export const ServicesBlitz: React.FC = () => {
  const f = useCurrentFrame();
  const idx = Math.min(SERVICES.length - 1, Math.floor(f / PER));
  return (
    <AbsoluteFill style={{background: SR.ink}}>
      {idx > 0 && <Card i={idx - 1} local={PER + 20} />}
      <Card i={idx} local={f - idx * PER} />
    </AbsoluteFill>
  );
};
export const SERVICES_DUR = PER * SERVICES.length;
