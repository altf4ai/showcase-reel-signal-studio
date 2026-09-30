import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {Cursor} from '../components/Cursor';
import {Footage, keyMap} from '../components/Footage';
import {Grain} from '../components/Grain';
import {Slam} from '../components/Slam';
import {E, clamp, prog} from '../lib/anim';
import {useCaptureTrack} from '../lib/track';
import {BEAT, SR} from '../theme';

export const BRING_DUR = BEAT * 10;
const CHANNELS = ['strategy first', 'straight talk', 'type nerds', 'anti noise', 'culture fluent'];

/**
 * "What we bring": push into the site's retro TV and flip channels with CH+ on the beat.
 * The capture's clicks are found from the cursor track and landed on beats 2/4/6/8.
 */
export const Bring: React.FC = () => {
  const f = useCurrentFrame();
  const track = useCaptureTrack('bring');
  const clicks: number[] = [];
  track.forEach((p, i) => { if (p.down && !(track[i - 1]?.down)) clicks.push(i); });
  const beatsAt = [BEAT * 2, BEAT * 4, BEAT * 6, BEAT * 8];
  const keys: [number, number][] = [[0, Math.max(0, (clicks[0] ?? 60) - BEAT * 2)]];
  clicks.slice(0, 4).forEach((c, i) => keys.push([beatsAt[i], c]));
  keys.push([BRING_DUR, (clicks[3] ?? 230) + BEAT * 2]);
  const map = keyMap(keys);
  const src = map(f);
  const pt = track[Math.max(0, Math.min(track.length - 1, Math.round(src)))];
  // TV sits around (807, 450) CSS in the 1600x900 capture
  const zoom = interpolate(f, [0, 20], [1.05, 1.32], {...clamp, easing: E.out}) + interpolate(f, [20, BRING_DUR], [0, 0.06], clamp);
  const ox = (807 / 1600) * 100;
  const oy = (450 / 900) * 100;
  const ch = Math.max(0, beatsAt.filter(b => f >= b).length);
  const k = 1920 / 1600;
  return (
    <AbsoluteFill style={{background: SR.cream, overflow: 'hidden'}}>
      <AbsoluteFill style={{transform: `scale(${zoom})`, transformOrigin: `${ox}% ${oy}%`}}>
        <Footage name="bring" map={map} />
        {pt && <Cursor x={pt.x * k} y={pt.y * k} press={pt.down ? 1 : 0} scale={1.1} />}
      </AbsoluteFill>
      {/* channel name slams on each flip, in the gutters either side of the TV */}
      {beatsAt.map((b, i) => (
        <AbsoluteFill key={b} style={{alignItems: i % 2 ? 'flex-end' : 'flex-start', justifyContent: 'flex-end', padding: '0 70px 80px'}}>
          <Slam text={CHANNELS[i + 1]} at={b} exit={beatsAt[i + 1] ?? BRING_DUR} size={110} color={SR.ink} box={[SR.lime, SR.pink, SR.amber, SR.red][i]} rotate={i % 2 ? 3 : -3} />
        </AbsoluteFill>
      ))}
      <div style={{position: 'absolute', left: 64, top: 50, fontFamily: 'Inter Tight', fontWeight: 800, fontSize: 22, letterSpacing: '0.12em', color: SR.ink, opacity: 0.7}}>
        CH {String(ch + 1).padStart(2, '0')} — WHAT WE BRING
      </div>
      <Grain opacity={0.06} />
    </AbsoluteFill>
  );
};
