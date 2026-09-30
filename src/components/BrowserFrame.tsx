import React from 'react';
import {interTight} from '../fonts';

/** Minimal, modern browser chrome. Content area is exactly width x (width*9/16). */
export const BrowserFrame: React.FC<{width: number; url?: string; dark?: boolean; radius?: number; children: React.ReactNode; shadow?: boolean}> = ({
  width, url = 'signalroom.studio', dark = true, radius = 18, children, shadow = true,
}) => {
  const bar = Math.round(width * 0.028);
  const contentH = Math.round((width * 9) / 16);
  const chrome = dark ? '#1a1717' : '#efe3cc';
  const pill = dark ? 'rgba(249,236,212,0.08)' : 'rgba(18,16,16,0.07)';
  const txt = dark ? 'rgba(249,236,212,0.72)' : 'rgba(18,16,16,0.7)';
  return (
    <div style={{width, height: contentH + bar, borderRadius: radius, overflow: 'hidden', background: chrome,
      boxShadow: shadow ? '0 60px 120px -30px rgba(0,0,0,0.55), 0 30px 60px -30px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.06) inset' : undefined}}>
      <div style={{height: bar, display: 'flex', alignItems: 'center', padding: `0 ${bar * 0.55}px`, gap: bar * 0.26, position: 'relative'}}>
        {['#ff5f57', '#febc2e', '#28c840'].map(c => <div key={c} style={{width: bar * 0.3, height: bar * 0.3, borderRadius: 99, background: c}} />)}
        <div style={{position: 'absolute', left: '50%', transform: 'translateX(-50%)', height: bar * 0.62, padding: `0 ${bar * 0.8}px`, borderRadius: 99, background: pill,
          display: 'flex', alignItems: 'center', gap: bar * 0.22, fontFamily: interTight, fontWeight: 600, fontSize: bar * 0.34, color: txt, letterSpacing: '-0.01em'}}>
          <svg width={bar * 0.3} height={bar * 0.34} viewBox="0 0 10 12"><path d="M2 5V3.5a3 3 0 016 0V5M1.5 5h7v6h-7z" fill="none" stroke={txt} strokeWidth="1.3" /></svg>
          {url}
        </div>
      </div>
      <div style={{width, height: contentH, position: 'relative', overflow: 'hidden'}}>{children}</div>
    </div>
  );
};
