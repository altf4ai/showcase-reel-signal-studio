import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile} from 'remotion';
import './fonts';
import {keyMap, speedRamp} from './components/Footage';
import {BEAT} from './theme';
import {Opener, T as OT} from './Opener';
import {BrowserShot} from './scenes/BrowserShot';
import {FLURRY_DUR, NoiseFlurry, STORY_DUR, Story} from './scenes/Story';
import {SERVICES_DUR, ServicesBlitz} from './scenes/ServicesBlitz';
import {WHY_DUR, WhyBlitz} from './scenes/WhyBlitz';
import {END_DUR, EndLockup} from './scenes/EndLockup';
import {BRING_DUR, Bring} from './scenes/Bring';
import {RESPONSIVE_DUR, Responsive} from './scenes/Responsive';

// Master timeline — 60fps, 120 BPM (30 frames per beat). Every section starts on a beat.
const ABOUT_DUR = BEAT * 6;
const PROOF_DUR = BEAT * 4;
const CTA_DUR = BEAT * 10;

const seq = (() => {
  let t = OT.end;
  const s: Record<string, [number, number]> = {opener: [0, OT.end]};
  const add = (k: string, d: number) => { s[k] = [t, d]; t += d; };
  add('about', ABOUT_DUR);
  add('flurry', FLURRY_DUR);
  add('story', STORY_DUR);
  add('services', SERVICES_DUR);
  add('proof', PROOF_DUR);
  add('bring', BRING_DUR);
  add('why', WHY_DUR);
  add('responsive', RESPONSIVE_DUR);
  add('cta', CTA_DUR);
  add('end', END_DUR);
  return {s, total: t};
})();
export const FILM = seq;
export const FILM_DUR = seq.total;

const S: React.FC<{k: string; children: React.ReactNode}> = ({k, children}) => (
  <Sequence from={seq.s[k][0]} durationInFrames={seq.s[k][1]}>{children}</Sequence>
);

export const Film: React.FC<{withAudio?: boolean}> = ({withAudio = true}) => (
  <AbsoluteFill style={{background: '#000'}}>
    {withAudio && <Audio src={staticFile('audio/film.wav')} />}
    <S k="opener"><Opener withAudio={false} /></S>
    <S k="about">
      {/* tape marquee -> who we are -> mixing console, sped through */}
      <BrowserShot name="about" dur={ABOUT_DUR} map={speedRamp([[0, 1.0], [180, 0.55]], 0)} label="02 — who we are" from="right" tilt={[6, 12]} />
    </S>
    <S k="flurry"><NoiseFlurry /></S>
    <S k="story"><Story /></S>
    <S k="services"><ServicesBlitz /></S>
    <S k="proof">
      <BrowserShot name="services" dur={PROOF_DUR} map={speedRamp([[0, 4.2], [120, 4.2]], 10)} label="03 — what we do, on the site" from="bottom" cursor={false} bg="#F9ECD4" tilt={[10, -14]} />
    </S>
    <S k="bring"><Bring /></S>
    <S k="why"><WhyBlitz /></S>
    <S k="responsive"><Responsive /></S>
    <S k="cta">
      <BrowserShot name="cta" dur={CTA_DUR} map={keyMap([[0, 10], [BEAT * 3, 100], [BEAT * 5, 330], [BEAT * 7, 400], [CTA_DUR, 460]])} label="05 — let's build"
        from="bottom" tilt={[7, 10]} zoom={{x: 1351, y: 864, at: BEAT * 7, to: 3.4}} />
    </S>
    <S k="end"><EndLockup /></S>
  </AbsoluteFill>
);
