import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame} from 'remotion';
import './fonts';
import {CrtOff} from './components/CrtOff';
import {Footage, keyMap} from './components/Footage';
import {Static} from './components/Static';
import {prog} from './lib/anim';
import {HeroShowcase} from './scenes/HeroShowcase';
import {LogoSlam} from './scenes/LogoSlam';
import {RarOpen} from './scenes/RarOpen';

// Beat grid @120bpm/60fps: 30 frames per beat.
export const T = {
  rarEnd: 256, // CRT off lands ~ beat 8.5
  staticIn: 250,
  preIn: 262,
  slam: 480, // beat 16 — the drop
  pull: 570,
  end: 840,
};

// Land the preloader's own events on the beat grid (local frames; sequence starts at T.preIn = 262):
// red light + "no signal" @270, amber @300, green @360, CRT reveal @450, hero settles into the slam @480.
const preMap = keyMap([[0, 4], [8, 12], [38, 54], [98, 112], [188, 178], [218, 200]]);

const StaticBurst: React.FC = () => {
  const f = useCurrentFrame();
  return <Static opacity={1 - prog(f, 10, 22)} />;
};

export const Opener: React.FC = () => (
  <AbsoluteFill style={{background: '#000'}}>
    <Audio src={staticFile('audio/opener.wav')} />
    <Sequence durationInFrames={T.rarEnd}>
      <CrtOff at={238}>
        <RarOpen />
      </CrtOff>
    </Sequence>
    <Sequence from={T.preIn} durationInFrames={T.slam - T.preIn}>
      <Footage name="preloader" map={preMap} total={300} />
    </Sequence>
    <Sequence from={T.staticIn} durationInFrames={24}>
      <StaticBurst />
    </Sequence>
    <Sequence from={T.slam} durationInFrames={T.pull - T.slam}>
      <LogoSlam />
    </Sequence>
    <Sequence from={T.pull} durationInFrames={T.end - T.pull}>
      <HeroShowcase slamOffset={T.pull - T.slam} />
    </Sequence>
  </AbsoluteFill>
);
