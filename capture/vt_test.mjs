import {launch} from './cdp.mjs';
import fs from 'fs';
const out = 'capture/vt_test'; fs.rmSync(out, {recursive: true, force: true}); fs.mkdirSync(out, {recursive: true});
const b = await launch({width: 1600, height: 900, dsf: 1});
await b.send('Page.enable'); await b.send('Runtime.enable');
const dt = 1000 / 60;
let budgetResolve;
b.on('Emulation.virtualTimeBudgetExpired', () => budgetResolve && budgetResolve());
await b.send('Emulation.setVirtualTimePolicy', {policy: 'pause', initialVirtualTime: Date.now() / 1000});
let ticks = 0;
const frame = async (shot) => {
  const p = new Promise(r => (budgetResolve = r));
  await b.send('Emulation.setVirtualTimePolicy', {policy: 'pauseIfNetworkFetchesPending', budget: dt, maxVirtualTimeTaskStarvationCount: 100});
  await p;
  ticks += dt;
  return b.send('HeadlessExperimental.beginFrame', {frameTimeTicks: ticks, interval: dt, ...(shot ? {screenshot: {format: 'jpeg', quality: 80}} : {})});
};
b.send('Page.navigate', {url: 'https://signalroom.framer.website/'});
const t0 = Date.now();
for (let i = 0; i < 600; i++) {
  const r = await frame(i % 20 === 0);
  if (r.screenshotData) fs.writeFileSync(`${out}/f${String(i).padStart(4, '0')}.jpg`, Buffer.from(r.screenshotData, 'base64'));
}
console.log('600 frames in', (Date.now() - t0) / 1000, 's');
b.close();
