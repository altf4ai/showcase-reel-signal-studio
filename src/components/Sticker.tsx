import React from 'react';
import {Img, staticFile} from 'remotion';

/** Signalroom die-cut sticker asset with a soft cast shadow. */
export const Sticker: React.FC<{name: string; size: number; style?: React.CSSProperties}> = ({name, size, style}) => (
  <Img src={staticFile(`brand/signalroom/${name}.png`)} style={{width: size, height: 'auto', filter: 'drop-shadow(0 18px 22px rgba(0,0,0,0.35))', ...style}} />
);
