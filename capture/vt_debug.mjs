import {launch} from './cdp.mjs';
const b = await launch({width: 1600, height: 900, dsf: 1});
await b.send('Page.enable'); await b.send('Runtime.enable');
const dt = 1000 / 60; let budgetResolve;
b.on('Emulation.virtualTimeBudgetExpired', () => budgetResolve && budgetResolve());
await b.send('Emulation.setVirtualTimePolicy', {policy: 'pause', initialVirtualTime: Date.now() / 1000});
let ticks = 0;
const DRIVE = `(() => { const now = performance.now(); for (const a of document.getAnimations()) { if (a.playState === 'paused' && !a.__drv) continue; if (!a.__drv) { a.__drv = true; a.__t0 = now - (a.currentTime || 0); a.pause(); } a.currentTime = (now - a.__t0) * (a.playbackRate || 1); } })()`;
const frame = async () => { await b.send('Runtime.evaluate', {expression: DRIVE}); const p = new Promise(r => (budgetResolve = r)); await b.send('Emulation.setVirtualTimePolicy', {policy: 'pauseIfNetworkFetchesPending', budget: dt, maxVirtualTimeTaskStarvationCount: 100}); await p; ticks += dt; return b.send('HeadlessExperimental.beginFrame', {frameTimeTicks: ticks, interval: dt}); };
b.send('Page.navigate', {url: 'https://signalroom.framer.website/'});
for (let i = 0; i < 700; i++) await frame();
const ev = async e => (await b.send('Runtime.evaluate', {expression: e, returnByValue: true})).result.value;
console.log(await ev(`(() => {
  const out = [];
  const p = [...document.querySelectorAll('p')].find(p => p.innerText.includes('Strategy, identity'));
  let e = p; while (e && out.length < 8) { const cs = getComputedStyle(e); out.push([e.tagName, e.getAttribute('data-framer-name'), cs.opacity, cs.transform, cs.visibility, e.style.cssText.slice(0,120)].join(' | ')); e = e.parentElement; }
  const imgs = [...document.querySelectorAll('img')].slice(0, 12).map(i => [i.src.slice(-40), i.complete, i.naturalWidth, i.loading, getComputedStyle(i.parentElement).opacity].join(' '));
  return out.join('\\n') + '\\n--imgs\\n' + imgs.join('\\n') + '\\nanims ' + document.getAnimations().length + ' ' + document.getAnimations().slice(0,5).map(a => a.playState + ':' + a.currentTime).join(',');
})()`));
b.close();
