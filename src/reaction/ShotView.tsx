import React from 'react';
import {AbsoluteFill, Freeze, OffthreadVideo, staticFile, useCurrentFrame} from 'remotion';
import {Shot, frameFor, srcAt} from './edl';
import {E, prog, rand} from '../lib/anim';

/** Virtual camera on a shot: zoom about a focus point (0..1 of the frame), optional punch-in on the cut. */
export type Cam = {from?: number; to?: number; x?: number; y?: number; punch?: number; ease?: 'soft' | 'out' | 'in'};

export const ShotView: React.FC<{shot: Shot; cam?: Cam; jitter?: number; filter?: string}> = ({shot, cam = {}, jitter = 0, filter}) => {
  const local = useCurrentFrame();
  const sec = srcAt(shot, local);
  const {file, index} = frameFor(shot, sec);
  const t = prog(local, 0, shot.dur, cam.ease === 'out' ? E.out : cam.ease === 'in' ? E.in : E.soft);
  const z0 = cam.from ?? 1.0;
  const z1 = cam.to ?? 1.04;
  let s = z0 + (z1 - z0) * t;
  if (cam.punch) s *= 1 + cam.punch * (1 - prog(local, 0, 9, E.out));
  const jx = jitter ? (rand(local * 1.3 + shot.at) - 0.5) * jitter : 0;
  return (
    <AbsoluteFill style={{overflow: 'hidden', background: '#000'}}>
      <AbsoluteFill style={{transformOrigin: `${(cam.x ?? 0.5) * 100}% ${(cam.y ?? 0.5) * 100}%`, transform: `translateX(${jx}px) scale(${s})`, filter}}>
        <Freeze frame={index}>
          <OffthreadVideo src={staticFile(file)} muted style={{width: '100%', height: '100%', objectFit: 'cover', display: 'block'}} />
        </Freeze>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
