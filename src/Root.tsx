import React from 'react';
import {Composition} from 'remotion';
import './fonts';
import {Opener, T} from './Opener';
import {FILM_DUR, Film} from './Film';
import {SERVICES_DUR, ServicesBlitz} from './scenes/ServicesBlitz';
import {WHY_DUR, WhyBlitz} from './scenes/WhyBlitz';
import {END_DUR, EndLockup} from './scenes/EndLockup';
import {FLURRY_DUR, NoiseFlurry, STORY_DUR, Story} from './scenes/Story';
import {REEL_DUR, Reel} from './reaction/Reel';

export const Root: React.FC = () => (
  <>
    <Composition id="Film" component={Film} durationInFrames={FILM_DUR} fps={60} width={1920} height={1080} />
    <Composition id="Opener" component={Opener} durationInFrames={T.end} fps={60} width={1920} height={1080} />
    <Composition id="ServicesBlitz" component={ServicesBlitz} durationInFrames={SERVICES_DUR} fps={60} width={1920} height={1080} />
    <Composition id="WhyBlitz" component={WhyBlitz} durationInFrames={WHY_DUR} fps={60} width={1920} height={1080} />
    <Composition id="EndLockup" component={EndLockup} durationInFrames={END_DUR} fps={60} width={1920} height={1080} />
    <Composition id="Story" component={Story} durationInFrames={STORY_DUR} fps={60} width={1920} height={1080} />
    <Composition id="NoiseFlurry" component={NoiseFlurry} durationInFrames={FLURRY_DUR} fps={60} width={1920} height={1080} />
    <Composition id="ReactionReel" component={Reel} durationInFrames={REEL_DUR} fps={30} width={1080} height={1920} />
  </>
);
