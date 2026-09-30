// Deterministic, frame-stepped capture of a live site. Usage: node capture/shoot.mjs <shotName> [...]
import {launch} from './cdp.mjs';
import {shots} from './shots.mjs';
import fs from 'fs';
import {execFileSync} from 'child_process';

const ease = {
  linear: t => t,
  inOut: t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  inOutQuint: t => (t < 0.5 ? 16 * t ** 5 : 1 - Math.pow(-2 * t + 2, 5) / 2),
  out: t => 1 - Math.pow(1 - t, 3),
};

async function shoot(name) {
  const shot = shots[name];
  if (!shot) throw new Error('unknown shot ' + name);
  const {url, width = 1440, height = 900, dsf = 2, quality = 94} = shot;
  const dir = `capture/frames/${name}`;
  fs.rmSync(dir, {recursive: true, force: true}); fs.mkdirSync(dir, {recursive: true});
  const b = await launch({width, height, dsf});
  await b.send('Page.enable'); await b.send('Runtime.enable');
  const evalJs = async expr => (await b.send('Runtime.evaluate', {expression: expr, awaitPromise: true, returnByValue: true})).result.value;

  // One clock for everything: Chrome virtual time (timers, Date, performance.now, network-aware),
  // begin-frame control for rendering, and WAAPI/CSS animations stepped manually from virtual time.
  const dt = 1000 / 60; let ticks = 0; let recording = false; let idx = 0;
  let budgetResolve; b.on('Emulation.virtualTimeBudgetExpired', () => budgetResolve && budgetResolve());
  await b.send('Emulation.setVirtualTimePolicy', {policy: 'pause', initialVirtualTime: Date.now() / 1000});
  const DRIVE = `(() => { const now = performance.now(); for (const a of document.getAnimations()) { if (a.__done || (a.timeline && a.timeline !== document.timeline)) continue; if (a.playState === 'paused' && !a.__drv) continue; if (!a.__drv) { a.__drv = true; a.__t0 = now - (a.currentTime || 0); a.pause(); } const t = (now - a.__t0) * (a.playbackRate || 1); const end = a.effect ? a.effect.getComputedTiming().endTime : Infinity; if (Number.isFinite(end) && t >= end) { a.__done = true; a.finish(); } else a.currentTime = t; } })()`;
  const mouse = {x: width / 2, y: height / 2};
  const track = [];
  const frame = async () => {
    const p = new Promise(r => (budgetResolve = r));
    await b.send('Emulation.setVirtualTimePolicy', {policy: 'pauseIfNetworkFetchesPending', budget: dt, maxVirtualTimeTaskStarvationCount: 100});
    await p;
    await b.send('Runtime.evaluate', {expression: DRIVE}).catch(() => {});
    ticks += dt;
    const r = await b.send('HeadlessExperimental.beginFrame', {frameTimeTicks: ticks, interval: dt, ...(recording ? {screenshot: {format: 'jpeg', quality}} : {})});
    if (recording) {
      if (!r.screenshotData) { console.warn('missing frame', idx); return; }
      fs.writeFileSync(`${dir}/f${String(idx).padStart(5, '0')}.jpg`, Buffer.from(r.screenshotData, 'base64'));
      track.push({x: mouse.x, y: mouse.y, down: mouse.down || false});
      idx++;
    }
  };
  const moveMouse = (x, y) => { mouse.x = x; mouse.y = y; return b.send('Input.dispatchMouseEvent', {type: 'mouseMoved', x, y}); };

  if (shot.recordFromStart) recording = true;
  b.send('Page.navigate', {url});
  for (const a of shot.actions) {
    if (a.record !== undefined) recording = a.record;
    if (a.js) await evalJs(a.js);
    if (a.jump !== undefined) { await evalJs(`window.scrollTo(0, ${typeof a.jump === 'string' ? `document.querySelector(${JSON.stringify(a.jump)}).getBoundingClientRect().top + scrollY + ${a.offset || 0}` : a.jump})`); }
    if (a.wait) for (let i = 0; i < a.wait; i++) await frame();
    if (a.scroll || a.scrollJs) {
      const from = await evalJs('scrollY');
      const to = a.scrollJs ? await evalJs(a.scrollJs) : typeof a.scroll === 'string' ? await evalJs(`document.querySelector(${JSON.stringify(a.scroll)}).getBoundingClientRect().top + scrollY + ${a.offset || 0}`) : a.scroll;
      const f = ease[a.ease || 'inOut'];
      for (let i = 1; i <= a.frames; i++) { await evalJs(`window.scrollTo(0, ${from + (to - from) * f(i / a.frames)})`); await frame(); }
    }
    if (a.mouse) {
      const [x0, y0] = [mouse.x, mouse.y]; const [x1, y1] = a.mouse; const f = ease[a.ease || 'inOut'];
      for (let i = 1; i <= (a.frames || 1); i++) { const k = f(i / (a.frames || 1)); const m = moveMouse(x0 + (x1 - x0) * k, y0 + (y1 - y0) * k); await frame(); await m; }
    }
    if (a.click) {
      const p1 = b.send('Input.dispatchMouseEvent', {type: 'mousePressed', x: mouse.x, y: mouse.y, button: 'left', clickCount: 1}); mouse.down = true; await frame(); await p1; await frame();
      const p2 = b.send('Input.dispatchMouseEvent', {type: 'mouseReleased', x: mouse.x, y: mouse.y, button: 'left', clickCount: 1}); mouse.down = false; await frame(); await p2;
    }
    if (a.shot) { const r = await b.send('Page.captureScreenshot', {format: 'png'}); fs.writeFileSync(`capture/frames/${name}_${a.shot}.png`, Buffer.from(r.data, 'base64')); }
  }
  b.close();
  fs.writeFileSync(`public/captures/${name}.json`, JSON.stringify({width, height, dsf, frames: idx, track}));
  // Near-lossless intermediate for Remotion: H.264 High, CRF 12, 60fps, full 2x resolution.
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-framerate', '60', '-i', `${dir}/f%05d.jpg`, '-c:v', 'libx264', '-preset', 'slow', '-crf', '12', '-g', '10', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', `public/captures/${name}.mp4`]);
  console.log(`${name}: ${idx} frames (${(idx / 60).toFixed(2)}s) @ ${width * dsf}x${height * dsf}`);
}

fs.mkdirSync('public/captures', {recursive: true});
for (const n of process.argv.slice(2)) await shoot(n);
