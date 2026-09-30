import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';

/** Analogue TV static with rolling scanlines. Chunky (low-res noise upscaled) like a real CRT. */
export const Static: React.FC<{opacity?: number; tint?: string}> = ({opacity = 1, tint}) => {
  const f = useCurrentFrame();
  const seed = f % 211;
  const roll = (f * 23) % 1080;
  return (
    <AbsoluteFill style={{opacity, background: '#0d0d0d', overflow: 'hidden'}}>
      <svg width="100%" height="100%" viewBox="0 0 480 270" preserveAspectRatio="none" style={{imageRendering: 'pixelated'}}>
        <filter id={`s${seed}`} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={1} seed={seed} />
          <feColorMatrix type="matrix" values="0 0 0 1.6 -0.3  0 0 0 1.6 -0.3  0 0 0 1.6 -0.3  0 0 0 0 1" />
        </filter>
        <rect width="480" height="270" filter={`url(#s${seed})`} />
      </svg>
      <AbsoluteFill style={{background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.28) 0 2px, transparent 2px 4px)'}} />
      <div style={{position: 'absolute', left: 0, right: 0, top: roll - 200, height: 200, background: 'linear-gradient(180deg, transparent, rgba(255,255,255,0.10), transparent)'}} />
      {tint && <AbsoluteFill style={{background: tint, mixBlendMode: 'multiply'}} />}
    </AbsoluteFill>
  );
};
