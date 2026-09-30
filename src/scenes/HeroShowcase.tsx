import React from 'react';
import {AbsoluteFill, Freeze, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {BrowserFrame} from '../components/BrowserFrame';
import {Cursor} from '../components/Cursor';
import {Footage, keyMap} from '../components/Footage';
import {Grain} from '../components/Grain';
import {Sticker} from '../components/Sticker';
import {interTight} from '../fonts';
import {E, clamp, lerp, prog, sp} from '../lib/anim';
import {SR} from '../theme';
import {LogoSlam} from './LogoSlam';
import {useCaptureTrack} from '../lib/track';

const FRAME_W = 1500;
const CAP_W = 1600; // capture viewport (CSS px)

/**
 * The red hero card pulls back into a floating browser window showing the live site; stickers lift off
 * the page into the space around it; a cursor works the hero. Local frame 0 = start of the pull-back.
 * `slamOffset` = frames the logo slam has already been running at local 0.
 */
export const HeroShowcase: React.FC<{slamOffset: number; heroSrcStart?: number}> = ({slamOffset, heroSrcStart = 20}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const track = useCaptureTrack('hero');

  const pull = prog(f, 0, 40, E.inOut);
  const contentH = (FRAME_W * 9) / 16;
  const bar = Math.round(FRAME_W * 0.028);
  // At pull=0 the content area exactly covers the 1920x1080 canvas.
  const coverScale = 1920 / FRAME_W;
  const scale = lerp(coverScale, 0.8, pull) * interpolate(f, [40, 400], [1, 1.035], clamp);
  const yCover = -bar / 2; // hide the chrome bar off-canvas at full cover
  const y = lerp(yCover * coverScale, 18, pull);
  const rx = lerp(0, 9, pull) - interpolate(f, [40, 400], [0, 6], clamp);
  const ry = lerp(0, -12, pull) + interpolate(f, [40, 400], [0, 16], clamp);
  const rz = lerp(0, 1.2, pull);

  const slamFade = 1 - prog(f, 18, 34, E.soft);
  // hero capture: headline sweep (scramble) src 40-94, scramble settles ~150, button hover 134-184, scroll 220+.
  // Race through the scramble so it reads as a flicker, then play the hover and scroll at speed.
  const srcMap = keyMap([[0, heroSrcStart], [10, heroSrcStart], [40, 50], [70, 150], [130, 190], [270, 330]]);
  const srcF = (lf: number) => srcMap(lf);

  // cursor from the capture track, in content px
  const k = FRAME_W / CAP_W;
  const tf = Math.min(track.length - 1, Math.max(0, Math.round(srcF(f))));
  const pt = track[tf] ?? {x: 800, y: 450, down: false};
  const cursorIn = prog(f, 44, 60);

  const stickers: {name: string; x: number; y: number; size: number; d: number; r: number; depth: number}[] = [
    {name: 'st_tv', x: 330, y: 250, size: 270, d: 44, r: -12, depth: 1.2},
    {name: 'st_dish', x: 1610, y: 215, size: 250, d: 50, r: 10, depth: 0.9},
    {name: 'st_radio', x: 300, y: 850, size: 250, d: 56, r: -7, depth: 1.0},
    {name: 'st_walkie', x: 1630, y: 850, size: 215, d: 62, r: 14, depth: 1.3},
  ];
  return (
    <AbsoluteFill style={{background: SR.ink}}>
      <AbsoluteFill style={{background: `radial-gradient(70% 60% at 50% 45%, rgba(238,45,54,${0.2 * pull}) 0%, rgba(18,16,16,0) 70%)`}} />
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', perspective: 2200, zIndex: 2}}>
        <div style={{transform: `translateY(${y}px) scale(${scale}) rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(${rz}deg)`, transformStyle: 'preserve-3d'}}>
          <BrowserFrame width={FRAME_W} radius={lerp(0, 18, pull)} shadow={pull > 0.05}>
            <Footage name="hero" map={srcF} />
            {slamFade > 0 && (
              <AbsoluteFill style={{opacity: slamFade}}>
                <div style={{position: 'relative', width: 1920, height: 1080, transform: `scale(${FRAME_W / 1920})`, transformOrigin: '0 0'}}>
                  <OffsetFrame offset={slamOffset}><LogoSlam /></OffsetFrame>
                </div>
              </AbsoluteFill>
            )}
            {cursorIn > 0 && (
              <div style={{opacity: cursorIn}}>
                <Cursor x={pt.x * k} y={pt.y * k} scale={1.05} press={0} />
              </div>
            )}
          </BrowserFrame>
        </div>
      </AbsoluteFill>
      {/* stickers lifted off the page, in front of the window, counter-drifting for parallax */}
      {stickers.map((s, i) => {
        const p = sp(f, fps, s.d, {damping: 13, stiffness: 170});
        const float = Math.sin((f + i * 40) / 38) * 10;
        const drift = interpolate(f, [40, 400], [0, -40], clamp) * s.depth;
        return (
          <div key={s.name} style={{position: 'absolute', left: s.x + drift, top: s.y + float, transform: `translate(-50%,-50%) scale(${p}) rotate(${s.r + (1 - p) * 30}deg)`, opacity: Math.min(1, p * 1.5), zIndex: 4}}>
            <Sticker name={s.name} size={s.size} />
          </div>
        );
      })}
      {/* lower-third label */}
      <div style={{position: 'absolute', left: 64, bottom: 40, fontFamily: interTight, fontWeight: 700, fontSize: 18, color: 'rgba(249,236,212,0.6)', letterSpacing: '0.02em', opacity: prog(f, 60, 80), display: 'flex', gap: 14, alignItems: 'center', zIndex: 3}}>
        <span style={{color: SR.lime}}>●</span> 01 — the hero
      </div>
      <Grain opacity={0.06} />
    </AbsoluteFill>
  );
};

/** Renders children as if the timeline were `offset` frames further along. */
const OffsetFrame: React.FC<{offset: number; children: React.ReactNode}> = ({offset, children}) => {
  const f = useCurrentFrame();
  return <Freeze frame={f + offset}>{children}</Freeze>;
};
