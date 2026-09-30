import React from 'react';
import {Freeze, OffthreadVideo, staticFile, useCurrentFrame} from 'remotion';

/**
 * A captured site shot with free time-remapping. `map(frame)` returns the source frame to show,
 * so speed ramps / holds / reverse are all just functions.
 */
export const Footage: React.FC<{name: string; map?: (f: number) => number; style?: React.CSSProperties; total?: number}> = ({name, map, style, total}) => {
  const f = useCurrentFrame();
  let src = Math.max(0, Math.round(map ? map(f) : f));
  if (total) src = Math.min(total - 1, src);
  return (
    <Freeze frame={src}>
      <OffthreadVideo src={staticFile(`captures/${name}.mp4`)} muted style={{width: '100%', height: '100%', objectFit: 'cover', display: 'block', ...style}} />
    </Freeze>
  );
};

/**
 * Speed-ramp time map. keys: [outFrame, speed] pairs; speed is eased (smoothstep) between keys and
 * integrated, so ramps have no jumps. Returns source frame for an output frame.
 */
export const speedRamp = (keys: [number, number][], startSrc = 0) => {
  const table: number[] = [startSrc];
  const last = keys[keys.length - 1][0];
  const speedAt = (x: number) => {
    if (x <= keys[0][0]) return keys[0][1];
    for (let i = 0; i < keys.length - 1; i++) {
      const [a, sa] = keys[i];
      const [b, sb] = keys[i + 1];
      if (x <= b) {
        const t = (x - a) / (b - a);
        const s = t * t * (3 - 2 * t);
        return sa + (sb - sa) * s;
      }
    }
    return keys[keys.length - 1][1];
  };
  for (let x = 1; x <= last + 600; x++) table.push(table[x - 1] + speedAt(x));
  return (f: number) => table[Math.max(0, Math.min(table.length - 1, Math.round(f)))];
};

/** Piecewise-linear time map through [outFrame, srcFrame] keys (for landing source events on beats). */
export const keyMap = (keys: [number, number][]) => (f: number) => {
  if (f <= keys[0][0]) return keys[0][1];
  for (let i = 0; i < keys.length - 1; i++) {
    const [a, sa] = keys[i];
    const [b, sb] = keys[i + 1];
    if (f <= b) return sa + ((f - a) / (b - a)) * (sb - sa);
  }
  const [a, sa] = keys[keys.length - 2];
  const [b, sb] = keys[keys.length - 1];
  return sb + (f - b) * ((sb - sa) / (b - a));
};
