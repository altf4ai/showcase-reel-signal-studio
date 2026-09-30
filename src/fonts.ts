import {continueRender, delayRender, staticFile} from 'remotion';
import {loadFont as loadInterTight} from '@remotion/google-fonts/InterTight';
import {loadFont as loadShrikhand} from '@remotion/google-fonts/Shrikhand';

export const interTight = loadInterTight('normal', {weights: ['500', '600', '700', '800', '900'], subsets: ['latin']}).fontFamily;
export const shrikhand = loadShrikhand('normal', {subsets: ['latin']}).fontFamily;

// RAR brand faces (Fontshare, self-hosted by riseabovereality.com).
export const clash = 'Clash Display';
export const satoshi = 'Satoshi';

const handle = delayRender('local brand fonts');
Promise.all([
  new FontFace(clash, `url(${staticFile('fonts/ClashDisplay-Variable.woff2')}) format('woff2')`, {weight: '200 700'}),
  new FontFace(satoshi, `url(${staticFile('fonts/Satoshi-Variable.woff2')}) format('woff2')`, {weight: '300 900'}),
].map(f => f.load().then(l => document.fonts.add(l))))
  .then(() => continueRender(handle))
  .catch(e => { console.error(e); continueRender(handle); });
