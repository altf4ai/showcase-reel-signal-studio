import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';

/** Fine animated film grain. Re-seeded every 2 frames so it reads as texture, not flicker. */
export const Grain: React.FC<{opacity?: number; blend?: React.CSSProperties['mixBlendMode']}> = ({opacity = 0.07, blend = 'overlay'}) => {
  const f = useCurrentFrame();
  const seed = Math.floor(f / 2) % 97;
  return (
    <AbsoluteFill style={{pointerEvents: 'none', mixBlendMode: blend, opacity}}>
      <svg width="100%" height="100%">
        <filter id={`g${seed}`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={seed} stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter={`url(#g${seed})`} />
      </svg>
    </AbsoluteFill>
  );
};
