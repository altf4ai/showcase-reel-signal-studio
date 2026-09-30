import React from 'react';
import {useCurrentFrame} from 'remotion';
import {RAR} from '../theme';

/**
 * Vector event horizon (RAR's black-hole motif), built from hairline strokes so it stays razor sharp:
 * a lensed photon ring, an accretion disk of flowing dashed ellipses, and the shadow disc.
 * `open` (0..1) grows it out of a single horizontal hairline.
 */
export const EventHorizon: React.FC<{size: number; open: number; energy?: number; frontDim?: number}> = ({size, open, energy = 0, frontDim = 0}) => {
  const f = useCurrentFrame();
  const R = size * 0.13 * open; // shadow radius
  const cx = size / 2;
  const cy = size / 2;
  const diskRx = size * 0.47;
  const tilt = 0.11; // disk ellipse ry/rx
  const rings = 30;
  const glow = 0.55 + energy * 0.45;

  const disk = (front: boolean) =>
    Array.from({length: rings}).map((_, i) => {
      const k = i / (rings - 1);
      const rx = R * 1.3 + (diskRx - R * 1.3) * Math.pow(k, 1.25);
      const ry = Math.max(0.5, rx * tilt * open);
      const circ = Math.PI * (rx + ry);
      const dash = 6 + (1 - k) * 60;
      const speed = (1.4 - k) * 3.2;
      const alpha = (1 - k * 0.8) * glow * (front ? 1 - frontDim * 0.85 : 1);
      return (
        <ellipse
          key={i}
          cx={cx}
          cy={cy}
          rx={Math.max(rx, 1)}
          ry={ry}
          fill="none"
          stroke={k < 0.35 ? RAR.ice : k < 0.7 ? RAR.blue : RAR.cobalt}
          strokeOpacity={alpha}
          strokeWidth={k < 0.15 ? 2 : k < 0.5 ? 1.3 : 1}
          strokeDasharray={`${dash} ${dash * (0.4 + k * 2.2)}`}
          strokeDashoffset={-(f * speed) + i * 37}
          pathLength={circ}
        />
      );
    });

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{overflow: 'visible'}}>
      <defs>
        <radialGradient id="eh-halo" cx="50%" cy="50%" r="50%">
          <stop offset="0.55" stopColor={RAR.cobalt} stopOpacity={0} />
          <stop offset="0.72" stopColor={RAR.cobalt} stopOpacity={0.1 * glow} />
          <stop offset="1" stopColor={RAR.cobalt} stopOpacity={0} />
        </radialGradient>
        <clipPath id="eh-back"><rect x={-size} y={-size} width={size * 3} height={size + cy} /></clipPath>
        <clipPath id="eh-front"><rect x={-size} y={cy} width={size * 3} height={size * 2} /></clipPath>
        <filter id="eh-soft" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation={size * 0.003} />
        </filter>
      </defs>
      {/* back half of the disk */}
      <g clipPath="url(#eh-back)">{disk(false)}</g>
      {/* halo + lensed photon ring */}
      <circle cx={cx} cy={cy} r={R * 1.9} fill="url(#eh-halo)" />
      <circle cx={cx} cy={cy} r={R * 1.04} fill="none" stroke={RAR.blue} strokeWidth={size * 0.005} strokeOpacity={0.45 * glow} filter="url(#eh-soft)" />
      <circle cx={cx} cy={cy} r={R * 1.02} fill="none" stroke={RAR.ice} strokeWidth={1.6} strokeOpacity={0.95 * open} />
      {/* shadow */}
      <circle cx={cx} cy={cy} r={R} fill={RAR.bg} />
      {/* lensed arc over the top of the shadow */}
      {/* gravitationally lensed image of the far disk: thin arcs hugging the shadow top and bottom */}
      {[1.12, 1.2, 1.3].map((m, i) => (
        <ellipse key={i} cx={cx} cy={cy} rx={R * m} ry={R * m * 0.98} fill="none" stroke={i ? RAR.blue : RAR.ice} strokeOpacity={(0.7 - i * 0.2) * open * glow} strokeWidth={i ? 1 : 1.4}
          strokeDasharray={`${R * (1.4 + i)} ${R * (0.5 + i * 0.7)}`} strokeDashoffset={-f * (0.9 + i * 0.5) + i * 50} />
      ))}
      {/* front half of the disk */}
      <g clipPath="url(#eh-front)">{disk(true)}</g>
      {/* the hairline it grows out of */}
      <line x1={cx - diskRx * Math.min(1, open * 3 + 0.02)} x2={cx + diskRx * Math.min(1, open * 3 + 0.02)} y1={cy} y2={cy} stroke={RAR.ice} strokeOpacity={Math.max(0, 1 - open * 1.4)} strokeWidth={1.4} />
    </svg>
  );
};
