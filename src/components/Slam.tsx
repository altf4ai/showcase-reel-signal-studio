import React from 'react';
import {useCurrentFrame} from 'remotion';
import {interTight} from '../fonts';
import {E, prog} from '../lib/anim';

/**
 * Kinetic word slam in Signalroom's type voice: Inter Tight Black, lowercase, crushed tracking.
 * Lands in ~6 frames (scale + blur), optional highlight box like the site's "we find it.".
 */
export const Slam: React.FC<{
  text: string; at: number; size?: number; color?: string; box?: string; boxText?: string; rotate?: number; exit?: number; style?: React.CSSProperties;
}> = ({text, at, size = 220, color = '#121010', box, boxText, rotate = 0, exit, style}) => {
  const f = useCurrentFrame();
  if (f < at || (exit !== undefined && f >= exit)) return null;
  const p = prog(f, at, at + 7, E.out);
  const s = 1.35 - 0.35 * p;
  const blur = (1 - p) * 14;
  return (
    <div style={{fontFamily: interTight, fontWeight: 900, fontSize: size, lineHeight: 0.86, letterSpacing: '-0.055em', color, whiteSpace: 'nowrap',
      transform: `scale(${s}) rotate(${rotate}deg)`, filter: blur > 0.3 ? `blur(${blur}px)` : undefined, opacity: Math.min(1, p * 2.5), ...style}}>
      {box ? (
        <span style={{background: box, color: boxText ?? color, padding: `0 ${size * 0.12}px ${size * 0.06}px`, display: 'inline-block', transform: 'rotate(-1.5deg)'}}>{text}</span>
      ) : text}
    </div>
  );
};
