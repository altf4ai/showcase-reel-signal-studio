import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {BrowserFrame} from '../components/BrowserFrame';
import {Cursor} from '../components/Cursor';
import {Footage} from '../components/Footage';
import {Grain} from '../components/Grain';
import {interTight} from '../fonts';
import {E, clamp, lerp, prog} from '../lib/anim';
import {useCaptureTrack} from '../lib/track';
import {SR} from '../theme';

const CAP_W = 1600;

/**
 * A captured desktop shot presented in a floating browser window on a brand ground.
 * - enter: whip in from `from` side over 10 frames
 * - drift: slow 3D rotation for life while the site plays
 * - zoom: optional camera push onto a point of the page (capture CSS px) at the end
 */
export const BrowserShot: React.FC<{
  name: string; dur: number; map: (f: number) => number; label?: string; bg?: string; frameW?: number;
  from?: 'left' | 'right' | 'bottom' | 'none'; tilt?: [number, number]; cursor?: boolean; zoom?: {x: number; y: number; at: number; to: number}; children?: React.ReactNode;
}> = ({name, dur, map, label, bg = SR.ink, frameW = 1440, from = 'bottom', tilt = [8, -10], cursor = true, zoom, children}) => {
  const f = useCurrentFrame();
  const track = useCaptureTrack(name);
  const enter = from === 'none' ? 1 : prog(f, 0, 12, E.out);
  const dx = from === 'left' ? -2200 : from === 'right' ? 2200 : 0;
  const dy = from === 'bottom' ? 1300 : 0;
  const rx = lerp(tilt[0], tilt[0] * 0.3, prog(f, 0, dur, E.soft));
  const ry = lerp(tilt[1], -tilt[1] * 0.6, prog(f, 0, dur, E.soft));
  const contentH = (frameW * 9) / 16;
  const bar = Math.round(frameW * 0.028);

  // camera push onto a page point
  let zs = 1;
  let zx = 0;
  let zy = 0;
  if (zoom) {
    const z = prog(f, zoom.at, dur, E.in);
    zs = lerp(1, zoom.to, z);
    const px = (zoom.x / CAP_W) * frameW - frameW / 2;
    const py = (zoom.y / 900) * contentH + bar - (contentH + bar) / 2;
    // bring the point to screen centre while scaling (translate is applied before scale)
    const c = prog(f, zoom.at, zoom.at + (dur - zoom.at) * 0.6, E.inOut);
    zx = -px * zs * c;
    zy = -py * zs * c;
  }
  const k = frameW / CAP_W;
  const src = map(f);
  const pt = track[Math.max(0, Math.min(track.length - 1, Math.round(src)))];
  const drift = interpolate(f, [0, dur], [0.97, 1.02], clamp);
  const flatten = zoom ? prog(f, zoom.at, zoom.at + 20, E.inOut) : 0;

  return (
    <AbsoluteFill style={{background: bg, overflow: 'hidden'}}>
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', perspective: 2400}}>
        <div style={{transform: `translate(${(1 - enter) * dx + zx}px, ${(1 - enter) * dy + zy}px) scale(${drift * zs}) rotateX(${rx * (1 - flatten)}deg) rotateY(${ry * (1 - flatten)}deg)`}}>
          <BrowserFrame width={frameW}>
            <Footage name={name} map={map} />
            {cursor && pt && <Cursor x={pt.x * k} y={pt.y * k} press={pt.down ? 1 : 0} />}
          </BrowserFrame>
        </div>
      </AbsoluteFill>
      {children}
      {label && (
        <div style={{position: 'absolute', left: 64, bottom: 40, fontFamily: interTight, fontWeight: 700, fontSize: 18, color: bg === SR.ink ? 'rgba(249,236,212,0.6)' : 'rgba(18,16,16,0.6)',
          letterSpacing: '0.02em', opacity: prog(f, 10, 24) * (1 - flatten), display: 'flex', gap: 14, alignItems: 'center'}}>
          <span style={{color: bg === SR.ink ? SR.lime : SR.red}}>●</span> {label}
        </div>
      )}
      <Grain opacity={0.06} />
    </AbsoluteFill>
  );
};
