import React from 'react';
import {useCurrentFrame} from 'remotion';
import {interTight} from '../fonts';
import {SR} from '../theme';

const Dots: React.FC<{h: number}> = ({h}) => (
  <span style={{display: 'inline-flex', gap: h * 0.08, margin: `0 ${h * 0.35}px`, verticalAlign: 'middle'}}>
    {[SR.red, SR.ink, SR.ink].map((c, i) => <span key={i} style={{width: h * 0.16, height: h * 0.16, borderRadius: 99, background: c, display: 'inline-block'}} />)}
  </span>
);

/** Signalroom's caution-tape marquee, rebuilt in vector so it can run huge. */
export const Tape: React.FC<{
  words?: string[]; height?: number; angle?: number; speed?: number; color?: string; ink?: string; y?: number; x?: number; offset?: number; width?: number;
}> = ({words = ['your brand has a signal', 'we find it', 'turning noise into signals worth noticing', 'less noise', 'more signal'], height = 84, angle = -4, speed = 6, color = SR.amber, ink = SR.ink, y = 0, x = 0, offset = 0, width = 3400}) => {
  const f = useCurrentFrame();
  const seq = [...words, ...words, ...words, ...words];
  const shift = -((f * speed + offset) % 2600);
  return (
    <div style={{position: 'absolute', left: '50%', top: '50%', width, height, marginLeft: -width / 2 + x, marginTop: -height / 2 + y, transform: `rotate(${angle}deg)`,
      background: color, overflow: 'hidden', boxShadow: '0 18px 40px rgba(0,0,0,0.35)', borderTop: `${height * 0.05}px solid ${ink}`, borderBottom: `${height * 0.05}px solid ${ink}`}}>
      <div style={{position: 'absolute', left: shift, top: 0, height: '100%', display: 'flex', alignItems: 'center', whiteSpace: 'nowrap',
        fontFamily: interTight, fontWeight: 800, fontSize: height * 0.46, letterSpacing: '-0.03em', color: ink}}>
        {seq.map((w, i) => (
          <React.Fragment key={i}>
            {w}
            <Dots h={height} />
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};
