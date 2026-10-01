import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame} from 'remotion';
import './fonts';
import {Footage, keyMap} from './components/Footage';
import {E, prog} from './lib/anim';
import {HeroShowcase} from './scenes/HeroShowcase';
import {LogoSlam} from './scenes/LogoSlam';
import {RarOpen} from './scenes/RarOpen';

// Beat grid @120bpm/60fps: 30 frames per beat.
export const T = {
  rarEnd: 262, // RAR light-speed whiteout cuts straight into the preloader
  preIn: 262,
  slam: 480, // beat 16 — the drop
  pull: 570,
  end: 840,
};

// Land the preloader's own events on the beat grid (local frames; sequence starts at T.preIn = 262):
// red light + "no signal" @270, amber @300, green @360; we stay on the light (never reach the site's reveal).
const preMap = keyMap([[0, 4], [8, 12], [38, 54], [98, 112], [218, 170]]);

/**
 * Keep the site's traffic light big the whole time (the site shrinks it after green, so we push in to
 * compensate), then rush into the green lamp and hard-cut to the logo slam on the drop. We never show
 * the site's own reveal wipe here, so there is no black bar and no shrink.
 */
const PreloaderZoom: React.FC = () => {
  const f = useCurrentFrame();
  // ~2.35x keeps the light around half the frame height with "no signal" still in shot; the site halves
  // the light after green, so we push in further (3.65x) to hold its on-screen size.
  const base = 2.0 + prog(f, 34, 48, E.inOut) * 0.35 + prog(f, 82, 112, E.inOut) * 1.3; // 2.0 keeps "no signal" in shot
  const rush = prog(f, 170, 216, E.in); // global 432 -> 478
  const z = base * (1 + rush * 5);
  const blur = rush * 10;
  const ox = (797 / 1600) * 1920;
  const oy = (320 / 900) * 1080; // light centre
  const lift = 460 - oy; // place the light centre slightly above screen centre
  return (
    <AbsoluteFill style={{overflow: 'hidden', background: '#0d0d0d'}}>
      <AbsoluteFill style={{transform: `translateY(${lift}px) scale(${z})`, transformOrigin: `${ox}px ${oy}px`, filter: blur > 0.3 ? `blur(${blur}px)` : undefined}}>
        <Footage name="preloader" map={preMap} total={300} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const Opener: React.FC<{withAudio?: boolean}> = ({withAudio = true}) => (
  <AbsoluteFill style={{background: '#000'}}>
    {withAudio && <Audio src={staticFile('audio/opener.wav')} />}
    <Sequence durationInFrames={T.rarEnd}>
      <RarOpen />
    </Sequence>
    <Sequence from={T.preIn} durationInFrames={T.slam - T.preIn}>
      <PreloaderZoom />
    </Sequence>
    <Sequence from={T.slam} durationInFrames={T.pull - T.slam}>
      <LogoSlam />
    </Sequence>
    <Sequence from={T.pull} durationInFrames={T.end - T.pull}>
      <HeroShowcase slamOffset={T.pull - T.slam} />
    </Sequence>
  </AbsoluteFill>
);
