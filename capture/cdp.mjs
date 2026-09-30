// Minimal CDP client over Node's global WebSocket, for deterministic begin-frame capture.
import {spawn} from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';

export async function launch({width = 1440, height = 900, dsf = 2, extraArgs = []} = {}) {
  const userDir = fs.mkdtempSync(path.join(os.tmpdir(), 'hs-'));
  const proc = spawn('/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell', [
    '--remote-debugging-port=0', '--no-sandbox', `--user-data-dir=${userDir}`,
    '--deterministic-mode', '--enable-begin-frame-control', '--run-all-compositor-stages-before-draw',
    '--disable-new-content-rendering-timeout', '--disable-threaded-animation', '--disable-threaded-scrolling',
    '--disable-checker-imaging', '--hide-scrollbars', `--force-device-scale-factor=${dsf}`, '--force-color-profile=srgb', '--font-render-hinting=none',
    `--proxy-server=${process.env.HTTPS_PROXY || ''}`,
    ...extraArgs, 'about:blank',
  ], {stdio: ['ignore', 'ignore', 'pipe']});
  const wsUrl = await new Promise((res, rej) => {
    let buf = '';
    proc.stderr.on('data', d => { buf += d; const m = buf.match(/DevTools listening on (ws:\/\/\S+)/); if (m) res(m[1]); });
    setTimeout(() => rej(new Error('no devtools url: ' + buf)), 20000);
  });
  const ws = new WebSocket(wsUrl);
  await new Promise(r => ws.addEventListener('open', r));
  let id = 0; const pending = new Map(); const listeners = [];
  ws.addEventListener('message', ev => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) { const {res, rej} = pending.get(msg.id); pending.delete(msg.id); msg.error ? rej(new Error(JSON.stringify(msg.error))) : res(msg.result); }
    else for (const l of listeners) l(msg);
  });
  const send = (method, params = {}, sessionId) => new Promise((res, rej) => { const i = ++id; pending.set(i, {res, rej}); ws.send(JSON.stringify({id: i, method, params, sessionId})); });
  const {targetId} = await send('Target.createTarget', {url: 'about:blank', enableBeginFrameControl: true, width, height});
  const {sessionId} = await send('Target.attachToTarget', {targetId, flatten: true});
  const s = (m, p) => send(m, p, sessionId);
  const on = (method, fn) => listeners.push(msg => msg.method === method && msg.sessionId === sessionId && fn(msg.params));
  return {send: s, on, close: () => { try { ws.close(); } catch {} proc.kill('SIGKILL'); }};
}
