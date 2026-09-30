import React from 'react';
import {AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {Footage, hasCapture, keyMap} from '../components/Footage';
import {Grain} from '../components/Grain';
import {clash, satoshi} from '../fonts';
import {E, clamp, prog, rand} from '../lib/anim';
import {BEAT, RAR} from '../theme';

/** Letters rise out of a mask, staggered. */
const MaskWord: React.FC<{text: string; start: number; exit?: number; size: number; stagger?: number; weight?: number; tracking?: string}> = ({
  text, start, exit, size, stagger = 1.1, weight = 600, tracking = '-0.01em',
}) => {
  const f = useCurrentFrame();
  return (
    <div style={{display: 'flex', overflow: 'hidden', fontFamily: clash, fontWeight: weight, fontSize: size, lineHeight: 0.92, letterSpacing: tracking, color: RAR.ice, paddingBottom: size * 0.04}}>
      {text.split('').map((ch, i) => {
        const pin = prog(f, start + i * stagger, start + i * stagger + 22, E.out);
        const pout = exit === undefined ? 0 : prog(f, exit + i * stagger * 0.6, exit + i * stagger * 0.6 + 14, E.in);
        const y = (1 - pin) * 105 - pout * 105;
        return (
          <span key={i} style={{display: 'inline-block', transform: `translateY(${y}%)`, whiteSpace: 'pre'}}>
            {ch}
          </span>
        );
      })}
    </div>
  );
};

/** Text that resolves out of random glyphs (creative-tech decode). */
const Decode: React.FC<{text: string; start: number; dur?: number; style?: React.CSSProperties}> = ({text, start, dur = 16, style}) => {
  const f = useCurrentFrame();
  const glyphs = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#/+=';
  const out = text
    .split('')
    .map((ch, i) => {
      if (ch === ' ') return ' ';
      const t = (f - start - i * 0.9) / dur;
      if (t < 0) return ' ';
      if (t >= 1) return ch;
      return glyphs[Math.floor(rand(i * 31 + Math.floor(f / 2)) * glyphs.length)];
    })
    .join('');
  return <span style={style}>{out}</span>;
};

// Centre of the black hole's shadow in the 1920x1080 capture.
const HOLE = {x: 960, y: 420};

export const RarOpen: React.FC = () => {
  const f = useCurrentFrame();
  const HIT = BEAT * 4; // 120: title hit
  const INTRO = BEAT * 6; // 180: "introducing"
  const END = BEAT * 8; // 240

  // rar_hole capture: the hole materialises ~src 20 and grows; hold it steady and full by the hit.
  const holeMap = keyMap([[0, 10], [HIT, 150], [END, 250]]);
  // rar_dive capture: scroll-driven push through the event horizon into the light streaks.
  const diveMap = keyMap([[INTRO + 6, 30], [END, 250]]);
  const dive = hasCapture('rar_dive') ? prog(f, INTRO + 6, INTRO + 20, E.inOut) : 0;
  const push = interpolate(f, [0, END], [1.0, 1.08], clamp);
  const energy = Math.max(0, 1 - Math.abs(f - HIT) / 18);
  // fade INTRODUCING as the CRT switch approaches
  const intf = prog(f, END - 26, END, E.in);

  const labels: React.CSSProperties = {fontFamily: satoshi, fontWeight: 600, fontSize: 15, letterSpacing: '0.24em', color: RAR.iceDim, textTransform: 'uppercase'};
  const labelIn = prog(f, 30, 60, E.out);

  const content = (
    <AbsoluteFill style={{background: RAR.bg}}>
      {/* deep space vignette */}
      <AbsoluteFill style={{background: `radial-gradient(60% 55% at 50% 42%, rgba(30,98,255,${0.1 + energy * 0.12}) 0%, rgba(5,5,7,0) 70%)`}} />
      {/* RiseAboveReality's own WebGL black hole, captured from riseabovereality.com */}
      <AbsoluteFill style={{transform: `scale(${push})`, filter: `brightness(${1 + energy * 0.9}) saturate(${1 + energy * 0.3})`, opacity: 1 - dive}}>
        <Footage name="rar_hole" map={holeMap} />
      </AbsoluteFill>
      {/* ...and its light-speed section, for the dive out */}
      {dive > 0 && (
        <AbsoluteFill style={{opacity: dive}}>
          <Footage name="rar_dive" map={diveMap} />
        </AbsoluteFill>
      )}
      {/* corner system labels */}
      <div style={{position: 'absolute', left: 64, top: 56, ...labels, opacity: labelIn}}>
        <Decode text="FULL-STACK CREATIVE TECH AGENCY" start={30} />
      </div>
      <div style={{position: 'absolute', right: 64, top: 56, ...labels, opacity: labelIn, textAlign: 'right'}}>
        <Decode text="MUMBAI — 19.07°N 72.87°E" start={36} />
      </div>
      <div style={{position: 'absolute', left: 64, bottom: 52, ...labels, opacity: labelIn}}>
        <Decode text="RAR / 2026" start={42} />
      </div>
      <div style={{position: 'absolute', right: 64, bottom: 52, ...labels, opacity: labelIn, textAlign: 'right'}}>
        <Decode text="TRANSMISSION 01" start={46} />
      </div>
      {/* mark */}
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', transform: `translate(${HOLE.x - 960}px, ${HOLE.y - 540}px)`}}>
        <Img src={staticFile('brand/rar/rar-mark.png')} style={{width: 150, opacity: prog(f, HIT, HIT + 10) * (1 - prog(f, INTRO - 4, INTRO + 6)),
          transform: `scale(${interpolate(prog(f, HIT, HIT + 30, E.out), [0, 1], [1.25, 1])})`, filter: `drop-shadow(0 0 ${18 + energy * 30}px rgba(90,200,255,0.55))`}} />
      </AbsoluteFill>
      {/* title, bottom-anchored like their site */}
      <div style={{position: 'absolute', left: 0, right: 0, bottom: 118, display: 'flex', justifyContent: 'center'}}>
        <MaskWord text="RISE ABOVE REALITY" start={HIT} exit={INTRO - 8} size={172} />
      </div>
      {/* introducing */}
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', transform: 'translateY(-70px)'}}>
        <div style={{opacity: prog(f, INTRO, INTRO + 4) * (1 - intf * 0.4)}}>
          <Decode text="INTRODUCING" start={INTRO} dur={14} style={{fontFamily: clash, fontWeight: 500, fontSize: 64, letterSpacing: '0.42em', color: RAR.ice, marginLeft: '0.42em'}} />
        </div>
      </AbsoluteFill>
      <Grain opacity={0.08} />
    </AbsoluteFill>
  );

  return content;
};
