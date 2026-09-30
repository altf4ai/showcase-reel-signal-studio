import React from 'react';

/** Crisp vector pointer (macOS-style) with an optional press ring. */
export const Cursor: React.FC<{x: number; y: number; scale?: number; press?: number; hand?: boolean}> = ({x, y, scale = 1, press = 0, hand}) => (
  <div style={{position: 'absolute', left: x, top: y, transform: `scale(${scale * (1 - press * 0.12)})`, transformOrigin: '0 0', filter: 'drop-shadow(0 6px 10px rgba(0,0,0,0.35))', zIndex: 50}}>
    {press > 0 && (
      <div style={{position: 'absolute', left: -28, top: -28, width: 56, height: 56, borderRadius: 99, border: '3px solid rgba(255,255,255,0.9)', opacity: 1 - press, transform: `scale(${0.4 + press * 1.2})`}} />
    )}
    {hand ? (
      <svg width="34" height="38" viewBox="0 0 34 38" style={{marginLeft: -10}}>
        <path d="M12 3.5c0-1.7 1.3-3 3-3s3 1.3 3 3V15l1-.2c1.6-.3 3 .9 3 2.5l.9-.1c1.6-.1 3 1.1 3 2.7l.6-.1c1.6-.1 3 1.2 3 2.8V29c0 4.7-3.8 8.5-8.5 8.5h-2.6c-2.5 0-4.8-1.1-6.4-3L2.9 24.4c-1-1.2-.9-3 .3-4 1.2-1 3-.9 4 .3L12 26V3.5z" fill="#fff" stroke="#111" strokeWidth="1.6" strokeLinejoin="round" />
      </svg>
    ) : (
      <svg width="30" height="40" viewBox="0 0 30 40">
        <path d="M2 2v30.5l7.6-7.2 5 11.7 5.6-2.4-5-11.5H26L2 2z" fill="#111" stroke="#fff" strokeWidth="2.2" strokeLinejoin="round" />
      </svg>
    )}
  </div>
);
