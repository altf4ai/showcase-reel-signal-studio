import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {Footage, keyMap} from '../components/Footage';
import {Grain} from '../components/Grain';
import {Slam} from '../components/Slam';
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

/**
 * Scroll-driven noise -> signal story, full-bleed. Source events are landed on the beat grid:
 * noise (fast, jittery) -> amber waveform -> green "one clear signal" on a downbeat -> hold.
 */
export const STORY_DUR = BEAT * 12;
export const Story: React.FC = () => {
  const f = useCurrentFrame();
  // src (story capture): noise 0-160, amber 170-290, green ~300, section leaves ~430
  const map = keyMap([[0, 20], [90, 170], [180, 296], [270, 360], [STORY_DUR, 420]]);
  const noisy = 1 - prog(f, 150, 185);
  const jitter = noisy * (rand(Math.floor(f / 2)) - 0.5) * 18;
  const push = interpolate(f, [0, STORY_DUR], [1.02, 1.12], clamp);
  const green = BEAT * 6; // 180
  const flash = Math.max(0, 1 - Math.abs(f - green) / 6);
  // tape wipe in (first 14 frames)
  const tapeOut = prog(f, 4, 16, E.in);
  return (
    <AbsoluteFill style={{background: SR.ink, overflow: 'hidden'}}>
      <AbsoluteFill style={{transform: `scale(${push}) translateX(${jitter}px)`}}>
        <Footage name="story" map={map} />
      </AbsoluteFill>
      {noisy > 0 && (
        <AbsoluteFill style={{opacity: noisy * 0.5, mixBlendMode: 'screen'}}>
          <AbsoluteFill style={{transform: `translateX(${jitter * 1.4}px)`, background: 'rgba(238,45,54,0.12)'}} />
        </AbsoluteFill>
      )}
      {/* on the green light: the promise, in the site's voice */}
      <AbsoluteFill style={{alignItems: 'flex-end', justifyContent: 'flex-end', padding: '0 90px 70px 0'}}>
        <Slam text="noise → signal." at={green} size={96} color={SR.lime} style={{textShadow: '0 10px 40px rgba(0,0,0,0.6)'}} />
      </AbsoluteFill>
      <AbsoluteFill style={{background: SR.lime, opacity: flash * 0.35, mixBlendMode: 'overlay'}} />
      {/* caution-tape wipe from the previous shot */}
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
