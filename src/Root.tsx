import React from 'react';
import {Composition} from 'remotion';
import './fonts';
import {Opener, T} from './Opener';
import {SERVICES_DUR, ServicesBlitz} from './scenes/ServicesBlitz';
import {WHY_DUR, WhyBlitz} from './scenes/WhyBlitz';
import {END_DUR, EndLockup} from './scenes/EndLockup';

export const Root: React.FC = () => (
  <>
    <Composition id="Opener" component={Opener} durationInFrames={T.end} fps={60} width={1920} height={1080} />
    <Composition id="ServicesBlitz" component={ServicesBlitz} durationInFrames={SERVICES_DUR} fps={60} width={1920} height={1080} />
    <Composition id="WhyBlitz" component={WhyBlitz} durationInFrames={WHY_DUR} fps={60} width={1920} height={1080} />
    <Composition id="EndLockup" component={EndLockup} durationInFrames={END_DUR} fps={60} width={1920} height={1080} />
  </>
);
