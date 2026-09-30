import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame} from 'remotion';
import './fonts';
import {CrtOff} from './components/CrtOff';
import {Footage, keyMap} from './components/Footage';
import {Static} from './components/Static';
import {E, prog} from './lib/anim';
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

/** Keep the site's traffic light big: push in on it, then pull out for the site's own CRT reveal. */
const PreloaderZoom: React.FC = () => {
  const f = useCurrentFrame();
  const inP = prog(f, 0, 14, E.out);
  const outP = prog(f, 160, 176, E.inOut); // local 160 ~ global 422, just before the reveal
  // the site shrinks the light after green (local ~98); push in harder to keep it the same size on screen
  const z = 1 + (0.85 + prog(f, 14, 95) * 0.15 + prog(f, 88, 106, E.inOut) * 1.1) * inP * (1 - outP);
  // light centre in the 1600x900 capture is ~(797, 330) -> in 1920x1080 space
  const ox = (797 / 1600) * 1920;
  const oy = (330 / 900) * 1080;
  return (
    <AbsoluteFill style={{overflow: 'hidden', background: '#0d0d0d'}}>
      <AbsoluteFill style={{transform: `scale(${z})`, transformOrigin: `${ox}px ${oy}px`}}>
        <Footage name="preloader" map={preMap} total={300} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const StaticBurst: React.FC = () => {
  const f = useCurrentFrame();
  return <Static opacity={1 - prog(f, 10, 22)} />;
};

export const Opener: React.FC<{withAudio?: boolean}> = ({withAudio = true}) => (
  <AbsoluteFill style={{background: '#000'}}>
    {withAudio && <Audio src={staticFile('audio/opener.wav')} />}
    <Sequence durationInFrames={T.rarEnd}>
      <CrtOff at={238}>
        <RarOpen />
      </CrtOff>
    </Sequence>
    <Sequence from={T.preIn} durationInFrames={T.slam - T.preIn}>
      <PreloaderZoom />
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
