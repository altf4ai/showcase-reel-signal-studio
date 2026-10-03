import React from 'react';
import {AbsoluteFill, Sequence, useCurrentFrame} from 'remotion';
import '../fonts';
import {prog} from '../lib/anim';
import {SHOTS, TOTAL, at, end, shot, srcAt} from './edl';
import {Cam, ShotView} from './ShotView';
import {Cap, Captions, words} from './Captions';
import {Mode, Osd} from './Osd';
import {BarCue, Flash, FlashCue, HitCue, LeakCue, Letterbox, LightLeaks, VhsRewind, Vignette, shakeAt} from './Fx';
import {EndCard} from './EndCard';

export const REEL_DUR = TOTAL;

// ---------------------------------------------------------------- virtual camera per shot
const CAM: Record<string, Cam> = {
  hook: {from: 1.0, to: 1.03, y: 0.42},
  hookSlo: {from: 1.03, to: 1.06, x: 0.55, y: 0.42},
  hookHold: {from: 1.06, to: 1.12, x: 0.55, y: 0.42, ease: 'out'},
  rewind: {from: 1.08, to: 1.08},
  greet: {from: 1.0, to: 1.05, y: 0.3},
  walkIn: {from: 1.04, to: 1.0, y: 0.35},
  gesture: {from: 1.06, to: 1.02},
  toScreen: {from: 1.0, to: 1.06, y: 0.7},
  hole: {from: 1.0, to: 1.08, x: 0.5, y: 0.55},
  slam: {from: 1.04, to: 1.1, y: 0.55, punch: 0.05},
  watch: {from: 1.0, to: 1.05, y: 0.4},
  point: {from: 1.02, to: 1.07, y: 0.42},
  phones: {from: 1.05, to: 1.0, y: 0.6},
  intent: {from: 1.0, to: 1.06, y: 0.4},
  endCard: {from: 1.0, to: 1.1, x: 0.55, y: 0.55},
  cheer: {from: 1.02, to: 1.1, x: 0.45, y: 0.38, ease: 'out'},
  preload: {from: 1.0, to: 1.08, x: 0.4, y: 0.62},
  reveal: {from: 1.04, to: 1.2, x: 0.42, y: 0.66, ease: 'out', punch: 0.06},
  closeUp: {from: 1.0, to: 1.04},
  bigLaugh: {from: 1.02, to: 1.08, y: 0.4},
  handHead: {from: 1.0, to: 1.05, y: 0.45},
  turn: {from: 1.04, to: 1.1, x: 0.5, y: 0.55},
  look: {from: 1.0, to: 1.04, y: 0.38},
  smile: {from: 1.02, to: 1.08, x: 0.45, y: 0.4},
  mindSlo: {from: 1.06, to: 1.12, x: 0.45, y: 0.4},
  mindHold: {from: 1.12, to: 1.2, x: 0.45, y: 0.38, ease: 'out'},
  laughEnd: {from: 1.0, to: 1.06, y: 0.45},
};
for (let i = 1; i <= 8; i++) CAM[`m${i}`] = {from: 1.03, to: 1.07, punch: 0.09, y: 0.6};

const FILTER: Record<string, string> = {
  hookHold: 'contrast(1.06) saturate(0.88)',
  rewind: 'contrast(1.3) saturate(1.5) brightness(1.06)',
  mindHold: 'contrast(1.06) saturate(0.88)',
};

// ---------------------------------------------------------------- captions
const CAPS: Cap[] = [
  {from: 3, to: 92, y: 1250, lines: [words('we showed our client', 3, 4), words('their [new website]', 22, 6, 'red')]},
  {from: 127, to: 236, y: 1250, size: 96, lines: [words('[launch day.]', 127, 0, 'lime')]},
  {from: 246, to: 332, y: 1360, size: 80, lines: [words('first:', 246, 0), words('the [launch film]', 252, 6, 'lime')]},
  {from: 636, to: 719, y: 1290, size: 80, lines: [words('then:', 636, 0), words('the [website] went live', 644, 6, 'red')]},
  {from: at('m1'), to: end('m8') - 1, y: 960, size: 124, lines: [[{t: 'every.', at: at('m1')}], [{t: 'single.', at: at('m3')}], [{t: 'page.', at: at('m5'), box: 'lime'}]]},
  {from: at('look') + 6, to: at('mindSlo') - 2, y: 1330, size: 88, lines: [words('the [verdict?]', at('look') + 6, 6, 'lime')]},
  {from: at('mindHold') + 2, to: end('mindHold'), y: 1330, size: 98, lines: [words('mind = [blown.]', at('mindHold') + 2, 3, 'red')]},
  {from: at('laughEnd') + 8, to: end('laughEnd') - 2, y: 1340, size: 78, lines: [words('this is why', at('laughEnd') + 8, 4), words('we do [what we do.]', at('laughEnd') + 22, 4, 'lime')]},
];

// ---------------------------------------------------------------- light cuts, bars, hits
const FLASHES: FlashCue[] = [
  {at: at('hookHold'), dur: 9, peak: 0.95},
  {at: end('rewind') - 2, dur: 10, peak: 0.75, color: '#FFE9CC'},
  {at: at('hole') - 1, dur: 7, peak: 0.35, color: '#FFE2C2'},
  {at: at('cheer'), dur: 9, peak: 0.6, color: '#FFE9CC'},
  {at: at('reveal') + 2, dur: 15, peak: 1.0},
  ...[1, 2, 3, 4, 5, 6, 7, 8].map(i => ({at: at(`m${i}`), dur: 4, peak: 0.28, color: '#FFF1DD'})),
  {at: at('look'), dur: 7, peak: 0.35, color: '#FFE2C2'},
  {at: at('mindHold'), dur: 9, peak: 0.9},
  {at: at('end') + 30, dur: 8, peak: 0.45, color: '#FFE9CC'},
];
const LEAKS: LeakCue[] = [
  {at: end('rewind') - 8, dur: 30, tint: 'warm', seed: 3},
  {at: at('hole') - 8, dur: 30, tint: 'gold', seed: 11, peak: 0.85},
  {at: at('cheer') - 6, dur: 36, tint: 'red', seed: 5},
  {at: at('preload') - 8, dur: 26, tint: 'warm', seed: 8, peak: 0.8},
  {at: at('reveal') - 2, dur: 42, tint: 'red', seed: 2},
  {at: at('m1') - 6, dur: 20, tint: 'gold', seed: 13, peak: 0.7},
  {at: at('look') - 8, dur: 28, tint: 'gold', seed: 17, peak: 0.8},
  {at: at('laughEnd') - 8, dur: 30, tint: 'warm', seed: 21},
  {at: at('end') - 6, dur: 28, tint: 'red', seed: 7, peak: 0.9},
];
const BARS: BarCue[] = [
  {from: at('hookSlo'), to: end('hookHold'), h: 170},
  {from: at('cheer') + 12, to: end('cheer'), h: 150},
  {from: at('mindSlo'), to: end('mindHold'), h: 170},
];
const HITS: HitCue[] = [
  {at: at('hookHold'), amp: 14, dur: 10},
  {at: at('cheer'), amp: 9, dur: 10},
  {at: at('reveal') + 2, amp: 22, dur: 16},
  {at: at('mindHold'), amp: 16, dur: 12},
];

// ---------------------------------------------------------------- camcorder OSD
const MODES: [number, Mode][] = [[0, 'play'], [at('hookHold'), 'pause'], [at('rewind'), 'rew'], [at('greet'), 'play'], [at('mindHold'), 'pause'], [at('laughEnd'), 'play']];

export const Reel: React.FC = () => {
  const f = useCurrentFrame();
  const cur = SHOTS.find(s => f >= s.at && f < s.at + s.dur) ?? SHOTS[SHOTS.length - 1];
  const sh = shakeAt(f, HITS);
  let mode: Mode | null = null;
  let modeAt = 0;
  for (const [t, m] of MODES) if (f >= t) { mode = m; modeAt = t; }
  const rw0 = at('rewind');
  const bigRew = f >= rw0 && f < end('rewind') ? prog(f, rw0, rw0 + 4) * (1 - prog(f, end('rewind') - 5, end('rewind'))) : 0;
  const osdOpacity = 0.9 * (1 - prog(f, at('end') - 4, at('end') + 4));

  return (
    <AbsoluteFill style={{background: '#000'}}>
      <AbsoluteFill style={{transform: `translate(${sh.x}px, ${sh.y}px) rotate(${sh.r}deg) scale(1.045)`}}>
        {SHOTS.filter(s => s.id !== 'end').map(s => (
          <Sequence key={s.id} from={s.at} durationInFrames={s.dur}>
            <ShotView shot={s} cam={CAM[s.id]} jitter={s.id === 'rewind' ? 18 : 0} filter={FILTER[s.id]} />
          </Sequence>
        ))}
      </AbsoluteFill>
      <Vignette strength={0.55} />
      <VhsRewind f={f} from={rw0} to={end('rewind')} />
      <Letterbox f={f} cues={BARS} />
      <Sequence from={at('end')} durationInFrames={shot('end').dur}>
        <EndCard shot={shot('end')} />
      </Sequence>
      <LightLeaks f={f} cues={LEAKS} />
      <Flash f={f} cues={FLASHES} />
      <Captions f={f} caps={CAPS} />
      <Osd f={f} srcSec={srcAt(cur, f - cur.at)} mode={mode} modeAge={f - modeAt} opacity={osdOpacity} bigRew={bigRew} />
    </AbsoluteFill>
  );
};
