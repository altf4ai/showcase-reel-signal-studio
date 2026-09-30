import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {E, prog} from '../lib/anim';

/** Old-TV power-off: picture collapses to a bright line, then to a dot. Starts at `at`, lasts ~16 frames. */
export const CrtOff: React.FC<{at: number; children: React.ReactNode}> = ({at, children}) => {
  const f = useCurrentFrame();
  const a = prog(f, at, at + 8, E.in);
  const b = prog(f, at + 7, at + 13, E.in);
  const dot = prog(f, at + 12, at + 18);
  if (f < at) return <>{children}</>;
  return (
    <AbsoluteFill style={{background: '#000'}}>
      {b < 1 && (
        <AbsoluteFill style={{transform: `scale(${1 - b * 0.995}, ${1 - a * 0.996})`, filter: `brightness(${1 + a * 4}) contrast(${1 + a})`}}>
          {children}
        </AbsoluteFill>
      )}
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
        <div style={{width: 10, height: 10, borderRadius: 99, background: '#fff', opacity: b * (1 - dot), boxShadow: '0 0 40px 18px rgba(200,230,255,0.6)'}} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
