import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {Footage, keyMap} from '../components/Footage';
import {Grain} from '../components/Grain';
import {Static} from '../components/Static';
import {Tape} from '../components/Tape';
import {interTight} from '../fonts';
import {E, clamp, prog, rand} from '../lib/anim';
import {BEAT, SR} from '../theme';

// The site's own "noise" words from the TV screen in the How-it-works section.
const NOISE = ['ALGORITHM', 'MORE CONTENT', 'LINK IN BIO', 'GO VIRAL', 'POST DAILY', 'GROWTH HACKS', 'TRENDING AUDIO', 'ENGAGEMENT', 'COLLAB?', 'REACH', 'RELATABLE', 'HOOK IN 3s'];

/** 2 beats of chaos: 16th-note cuts of feed-noise words, then "noise." */
export const NoiseFlurry: React.FC = () => {
  const f = useCurrentFrame();
  const step = Math.floor(f / 7.5);
  const bgs = [SR.ink, SR.cream, SR.red, SR.ink, SR.amber, SR.ink, SR.pink, SR.ink];
  const bg = bgs[step % bgs.length];
  const fg = bg === SR.ink ? SR.cream : SR.ink;
  const words = Array.from({length: 3}).map((_, j) => NOISE[(step * 3 + j) % NOISE.length]);
  return (
    <AbsoluteFill style={{background: bg, overflow: 'hidden'}}>
      {words.map((w, j) => {
        const r = rand(step * 11 + j);
        const size = 90 + rand(step * 5 + j) * 170;
        return (
          <div key={j} style={{position: 'absolute', left: 80 + r * 1100, top: 120 + j * 300 + rand(step + j * 3) * 80, fontFamily: interTight, fontWeight: 900, fontSize: size,
            letterSpacing: '-0.05em', color: fg, opacity: j === 0 ? 1 : 0.35, transform: `skewX(${(rand(step + j) - 0.5) * 16}deg)`, whiteSpace: 'nowrap'}}>
            {w}
          </div>
        );
      })}
      <AbsoluteFill style={{mixBlendMode: 'multiply', opacity: 0.35}}><Static /></AbsoluteFill>
      <Grain opacity={0.1} />
    </AbsoluteFill>
  );
};
export const FLURRY_DUR = BEAT * 2;

const STAGES = [
  {at: 16, kicker: '01 · stop', color: SR.red, title: ['the', 'feed', 'is', 'full', 'of', 'noise.'], body: "Everyone's posting. Hardly anyone's saying anything."},
  {at: BEAT * 3, kicker: '02 · wait', color: SR.amber, title: ['find', 'the', 'signal.'], body: 'Strategy before making. We dig until we find it.'},
  {at: BEAT * 6, kicker: '03 · go', color: SR.lime, title: ['now', 'broadcast', 'it.'], body: 'Identity, content and campaigns that carry one clear signal.'},
];

const Heading: React.FC<{i: number}> = ({i}) => {
  const f = useCurrentFrame();
  const st = STAGES[i];
  const next = STAGES[i + 1];
  const local = f - st.at;
  if (local < 0 || (next && f >= next.at)) return null;
  const out = next ? prog(f, next.at - 6, next.at, E.in) : 0;
  return (
    <div style={{position: 'absolute', left: 1150, top: 330, width: 700, opacity: 1 - out, transform: `translateY(${-out * 30}px)`}}>
      <div style={{display: 'inline-flex', alignItems: 'center', gap: 10, background: st.color, color: SR.ink, fontFamily: interTight, fontWeight: 800, fontSize: 22,
        letterSpacing: '0.08em', textTransform: 'uppercase', padding: '8px 16px', borderRadius: 6, transform: `scale(${0.6 + 0.4 * prog(local, 0, 8, E.out)})`, transformOrigin: 'left center'}}>
        {st.kicker}
      </div>
      <div style={{fontFamily: interTight, fontWeight: 900, fontSize: 118, lineHeight: 0.9, letterSpacing: '-0.055em', color: i === 2 ? SR.lime : SR.cream, marginTop: 26}}>
        {st.title.map((w, j) => {
          const p = prog(local, 2 + j * 2.5, 16 + j * 2.5, E.out);
          return <span key={j} style={{display: 'inline-block', marginRight: '0.2em', transform: `translateY(${(1 - p) * 0.5}em)`, opacity: p}}>{w}</span>;
        })}
      </div>
      <div style={{fontFamily: interTight, fontWeight: 500, fontSize: 28, lineHeight: 1.35, letterSpacing: '-0.015em', color: 'rgba(249,236,212,0.75)', marginTop: 26, maxWidth: 560,
        opacity: prog(local, 12, 24)}}>{st.body}</div>
    </div>
  );
};

/**
 * Scroll-driven noise -> signal story. We crop tight on the site's TV + traffic light (which run off the
 * scroll position) and drive the three headings ourselves, landed on the beat.
 */
export const STORY_DUR = BEAT * 12;
export const Story: React.FC = () => {
  const f = useCurrentFrame();
  // src (story capture): noise 0-160, amber 170-290, green ~300, section leaves ~430
  const map = keyMap([[0, 20], [BEAT * 3, 170], [BEAT * 6, 300], [STORY_DUR, 410]]);
  const noisy = 1 - prog(f, BEAT * 5.5, BEAT * 6);
  const jitter = noisy * (rand(Math.floor(f / 2)) - 0.5) * 10;
  const push = interpolate(f, [0, STORY_DUR], [1, 1.07], clamp);
  const green = BEAT * 6;
  const flash = Math.max(0, 1 - Math.abs(f - green) / 6);
  const tapeOut = prog(f, 4, 16, E.in);
  // crop of the capture (CSS px of the 1600x900 viewport) -> panel on the left
  const crop = {x: 40, y: 105, w: 800, h: 720};
  const panelH = 900;
  const k = panelH / crop.h;
  return (
    <AbsoluteFill style={{background: SR.ink, overflow: 'hidden'}}>
      <div style={{position: 'absolute', left: 30, top: 70, width: crop.w * k, height: panelH, overflow: 'hidden', transform: `scale(${push}) translateX(${jitter}px)`, transformOrigin: '40% 50%',
        WebkitMaskImage: 'linear-gradient(90deg, #000 88%, transparent 100%)'}}>
        <div style={{position: 'absolute', left: -crop.x * k, top: -crop.y * k, width: 1600 * k, height: 900 * k}}>
          <Footage name="story" map={map} />
        </div>
      </div>
      {STAGES.map((_, i) => <Heading key={i} i={i} />)}
      <AbsoluteFill style={{background: SR.lime, opacity: flash * 0.25, mixBlendMode: 'overlay'}} />
      {tapeOut < 1 && (
        <AbsoluteFill style={{transform: `translateX(${tapeOut * 2600}px)`}}>
          <Tape height={420} angle={-8} y={-160} speed={14} />
          <Tape height={420} angle={6} y={260} speed={-14} color={SR.lime} offset={900} />
        </AbsoluteFill>
      )}
      <Grain opacity={0.06} />
    </AbsoluteFill>
  );
};
