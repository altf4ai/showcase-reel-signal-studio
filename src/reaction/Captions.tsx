import React from 'react';
import {AbsoluteFill} from 'remotion';
import {interTight} from '../fonts';
import {E, prog} from '../lib/anim';
import {SR} from '../theme';

export type Word = {t: string; at: number; box?: 'lime' | 'red'};
export type Cap = {from: number; to: number; y: number; size?: number; lines: Word[][]};

const BOX: Record<string, React.CSSProperties> = {
  lime: {background: SR.lime, color: SR.ink, textShadow: 'none'},
  red: {background: SR.red, color: SR.cream, textShadow: 'none'},
};

/** Word-by-word kinetic captions in Signal Room's voice: lowercase Inter Tight, key words on highlighter chips. */
export const Captions: React.FC<{f: number; caps: Cap[]}> = ({f, caps}) => (
  <>
    {caps.map((c, i) => {
      if (f < c.from || f >= c.to) return null;
      const out = prog(f, c.to - 6, c.to, E.in);
      const size = c.size ?? 84;
      return (
        <AbsoluteFill key={i} style={{pointerEvents: 'none'}}>
          <div style={{position: 'absolute', left: 90, right: 90, top: c.y, transform: `translateY(-50%) translateY(${-out * 24}px)`, opacity: 1 - out,
            filter: out > 0 ? `blur(${out * 8}px)` : undefined, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: size * 0.1}}>
            {c.lines.map((ln, j) => (
              <div key={j} style={{display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', columnGap: size * 0.24}}>
                {ln.map((w, k) => {
                  const p = prog(f, w.at, w.at + 7, E.back);
                  const vis = f >= w.at;
                  return (
                    <span key={k} style={{display: 'inline-block', fontFamily: interTight, fontWeight: 800, fontSize: size, lineHeight: 1.08, letterSpacing: '-0.035em',
                      color: '#FFF6E6', textShadow: '0 3px 22px rgba(0,0,0,0.55), 0 1px 3px rgba(0,0,0,0.65)', whiteSpace: 'nowrap',
                      opacity: vis ? Math.min(1, prog(f, w.at, w.at + 3)) : 0,
                      transform: `translateY(${(1 - p) * 30}px) scale(${0.72 + 0.28 * p}) rotate(${w.box ? -2.5 : 0}deg)`,
                      ...(w.box ? {...BOX[w.box], padding: `0 ${size * 0.17}px ${size * 0.06}px`, borderRadius: size * 0.14, boxShadow: '0 10px 30px rgba(0,0,0,0.35)'} : {})}}>
                      {w.t}
                    </span>
                  );
                })}
              </div>
            ))}
          </div>
        </AbsoluteFill>
      );
    })}
  </>
);

/** Build a caption line from "word word [chip words]" with words appearing every `step` frames from `start`. */
export const words = (text: string, start: number, step: number, box?: 'lime' | 'red'): Word[] => {
  const out: Word[] = [];
  const re = /\[([^\]]+)\]|(\S+)/g;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text))) {
    out.push({t: m[1] ?? m[2], at: start + i * step, box: m[1] ? box : undefined});
    i++;
  }
  return out;
};
