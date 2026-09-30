import React from 'react';

/** Flat, modern phone shell (no stock 3D model): titanium edge, glass bezel, dynamic island. Screen 393x852 ratio. */
export const Phone: React.FC<{width: number; children: React.ReactNode; tone?: string}> = ({width, children, tone = '#2b2724'}) => {
  const h = width * (852 / 393);
  const bez = width * 0.035;
  return (
    <div style={{width: width + bez * 2, height: h + bez * 2, borderRadius: width * 0.16, background: '#0b0a0a', padding: bez, position: 'relative',
      boxShadow: `0 0 0 ${width * 0.008}px ${tone}, 0 50px 90px -30px rgba(0,0,0,0.6), 0 25px 40px -25px rgba(0,0,0,0.5)`}}>
      <div style={{width, height: h, borderRadius: width * 0.13, overflow: 'hidden', position: 'relative', background: '#000'}}>
        {children}
        <div style={{position: 'absolute', top: width * 0.03, left: '50%', width: width * 0.3, height: width * 0.085, marginLeft: -width * 0.15, borderRadius: 99, background: '#000'}} />
      </div>
    </div>
  );
};
