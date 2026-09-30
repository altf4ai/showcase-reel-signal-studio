import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';

export const Smoke: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const s = spring({frame: f, fps, config: {damping: 14, mass: 0.6}});
  return (
    <AbsoluteFill style={{background: '#050505', alignItems: 'center', justifyContent: 'center'}}>
      <div style={{color: 'white', fontSize: 160, fontWeight: 800, letterSpacing: -6, transform: `scale(${interpolate(s, [0, 1], [1.6, 1])})`, opacity: s, filter: `blur(${(1 - s) * 20}px)`}}>
        RENDER OK
      </div>
    </AbsoluteFill>
  );
};
