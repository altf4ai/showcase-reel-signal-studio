import {launch} from './cdp.mjs';
import fs from 'fs';
const out = 'capture/bf_test'; fs.rmSync(out, {recursive: true, force: true}); fs.mkdirSync(out, {recursive: true});
const b = await launch({width: 1440, height: 900});
await b.send('Page.enable'); await b.send('Runtime.enable');

let t = 0; const dt = 1000 / 60;
const frame = async (shot) => { t += dt; const r = await b.send('HeadlessExperimental.beginFrame', {frameTimeTicks: t, interval: dt, noDisplayUpdates: false, ...(shot ? {screenshot: {format: 'jpeg', quality: 92}} : {})}); return r; };
const loaded = new Promise(r => b.on('Page.loadEventFired', r));
b.send('Page.navigate', {url: 'https://signalroom.framer.website/'});
// pump frames while loading
let done = false; loaded.then(() => done = true);
let n = 0; while (!done && n < 2000) { await frame(false); n++; }
console.log('loaded after frames', n);
const t0 = Date.now();
for (let i = 0; i < 3; i++) {
  const r = await frame(true);
  if (r.screenshotData) fs.writeFileSync(`${out}/f${String(i).padStart(4, '0')}.jpg`, Buffer.from(r.screenshotData, 'base64'));
  else console.log('no shot', i, r.hasDamage);
}
console.log('180 frames in', (Date.now() - t0) / 1000, 's');
b.close();
