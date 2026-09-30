import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {Cursor} from '../components/Cursor';
import {Footage, keyMap} from '../components/Footage';
import {Grain} from '../components/Grain';
import {Static} from '../components/Static';
import {interTight} from '../fonts';
import {E, clamp, prog} from '../lib/anim';
import {useCaptureTrack} from '../lib/track';
import {BEAT, SR} from '../theme';

export const BRING_DUR = BEAT * 10;

// The site's channels (what-we-bring chips), in their chip colours.
const CHANNELS = [
  {n: '01', name: 'strategy first', line: 'Thinking before making. Every project starts with why.', bg: SR.red, fg: SR.ink},
  {n: '02', name: 'straight talk', line: '', bg: SR.amber, fg: SR.ink},
  {n: '03', name: 'type nerds', line: '', bg: SR.ink, fg: SR.lime},
  {n: '04', name: 'anti noise', line: '', bg: SR.pink, fg: SR.ink},
  {n: '05', name: 'culture fluent', line: '', bg: SR.cream, fg: SR.ink},
];

// TV geometry in the 1600x900 capture (CSS px).
const SCREEN = {x: 415, y: 270, w: 590, h: 425, r: 34};
const TV_CENTER = {x: 800, y: 468};

const ChannelScreen: React.FC<{i: number; local: number}> = ({i, local}) => {
  const c = CHANNELS[i];
  const p = prog(local, 4, 16, E.out);
  return (
    <AbsoluteFill style={{background: c.bg, padding: '38px 44px', boxSizing: 'border-box'}}>
      <div style={{position: 'absolute', right: 34, top: 26, fontFamily: interTight, fontWeight: 900, fontSize: 30, color: c.fg, opacity: 0.85}}>CH {c.n}</div>
      <div style={{position: 'absolute', left: 44, bottom: 110, fontFamily: interTight, fontWeight: 900, fontSize: 92, lineHeight: 0.86, letterSpacing: '-0.055em', color: c.fg,
        transform: `translateY(${(1 - p) * 30}px)`, opacity: p}}>{c.name}</div>
      <div style={{position: 'absolute', left: 46, bottom: 58, fontFamily: interTight, fontWeight: 600, fontSize: 22, color: c.fg, opacity: 0.75 * p}}>{c.line}</div>
      {/* CRT glass: scanlines, curvature vignette, glare */}
      <AbsoluteFill style={{background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.12) 0 2px, transparent 2px 5px)'}} />
      <AbsoluteFill style={{background: 'radial-gradient(120% 110% at 50% 50%, transparent 55%, rgba(0,0,0,0.45) 100%)'}} />
      <AbsoluteFill style={{background: 'linear-gradient(160deg, rgba(255,255,255,0.18) 0%, transparent 35%)'}} />
    </AbsoluteFill>
  );
};

/** "What we bring": push into the site's retro TV and flip channels with CH on the beat. */
export const Bring: React.FC = () => {
  const f = useCurrentFrame();
  const track = useCaptureTrack('bring');
  const clicks: number[] = [];
  track.forEach((p, i) => { if (p.down && !(track[i - 1]?.down)) clicks.push(i); });
  const beatsAt = [BEAT * 2, BEAT * 4, BEAT * 6, BEAT * 8];
  const keys: [number, number][] = [[0, Math.max(0, (clicks[0] ?? 70) - BEAT * 2)]];
  clicks.slice(0, 4).forEach((c, i) => keys.push([beatsAt[i], c]));
  keys.push([BRING_DUR, (clicks[3] ?? 229) + BEAT * 2]);
  const map = keyMap(keys);
  const src = map(f);
  const pt = track[Math.max(0, Math.min(track.length - 1, Math.round(src)))];

  const k = 1920 / 1600;
  const zoom = interpolate(f, [0, 22], [1.0, 1.46], {...clamp, easing: E.out}) + interpolate(f, [22, BRING_DUR], [0, 0.05], clamp);
  // keep the TV centred on screen as we push in
  const tx = 960 - TV_CENTER.x * k;
  const ty = 540 - TV_CENTER.y * k;
  const ch = beatsAt.filter(b => f >= b).length;
  const lastFlip = ch ? beatsAt[ch - 1] : -100;
  const sinceFlip = f - lastFlip;
  const staticOn = sinceFlip >= -2 && sinceFlip < 6;

  return (
    <AbsoluteFill style={{background: SR.cream, overflow: 'hidden'}}>
      <AbsoluteFill style={{transform: `translate(${tx * prog(f, 0, 22, E.out)}px, ${ty * prog(f, 0, 22, E.out)}px) scale(${zoom})`, transformOrigin: `${TV_CENTER.x * k}px ${TV_CENTER.y * k}px`}}>
        <Footage name="bring" map={map} />
        <div style={{position: 'absolute', left: SCREEN.x * k, top: SCREEN.y * k, width: SCREEN.w * k, height: SCREEN.h * k, borderRadius: SCREEN.r * k, overflow: 'hidden'}}>
          <div style={{width: SCREEN.w, height: SCREEN.h, transform: `scale(${k})`, transformOrigin: '0 0', position: 'relative'}}>
            <ChannelScreen i={ch} local={ch ? sinceFlip : f} />
            {staticOn && <AbsoluteFill><Static /></AbsoluteFill>}
          </div>
        </div>
        {pt && <Cursor x={pt.x * k} y={pt.y * k} press={pt.down ? 1 : 0} scale={1.1} />}
      </AbsoluteFill>
      <div style={{position: 'absolute', left: 64, top: 50, fontFamily: interTight, fontWeight: 800, fontSize: 22, letterSpacing: '0.12em', color: SR.ink, opacity: 0.7}}>
        CH {CHANNELS[ch].n} — WHAT WE BRING
      </div>
      <Grain opacity={0.06} />
    </AbsoluteFill>
  );
};
