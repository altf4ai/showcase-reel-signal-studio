import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile} from 'remotion';
import './fonts';
import {HeroShowcase} from './scenes/HeroShowcase';
import {LogoSlam} from './scenes/LogoSlam';
import {RarOpen} from './scenes/RarOpen';

// Beat grid @120bpm/60fps: 30 frames per beat.
// RAR open (0-240) -> logo slam on beat 8 (240) -> hold for the URL -> clean exit -> pull back into the site.
export const T = {
  rarEnd: 240,
  slam: 240,
  pull: 390, // slam gets 5 beats: chip @+30, URL types +60..+94, hold, logo exits +120..+134, clean red
  end: 660,
};

export const Opener: React.FC<{withAudio?: boolean}> = ({withAudio = true}) => (
  <AbsoluteFill style={{background: '#000'}}>
    {withAudio && <Audio src={staticFile('audio/opener.wav')} />}
    <Sequence durationInFrames={T.rarEnd}>
      <RarOpen />
    </Sequence>
    <Sequence from={T.slam} durationInFrames={T.pull - T.slam}>
      <LogoSlam />
    </Sequence>
    <Sequence from={T.pull} durationInFrames={T.end - T.pull}>
      <HeroShowcase slamOffset={T.pull - T.slam} />
    </Sequence>
  </AbsoluteFill>
);
