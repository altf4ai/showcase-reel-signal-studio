import {chromium} from 'playwright';
import fs from 'fs';
const browser = await chromium.launch({executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
for (const [name, url] of [['rar', 'https://www.riseabovereality.com'], ['signalroom', 'https://signalroom.framer.website/']]) {
  const page = await browser.newPage({viewport: {width: 1440, height: 900}});
  const media = [];
  page.on('response', r => { const u = r.url(); if (/\.(svg|png|webp|jpg|jpeg|avif|mp4|webm|woff2?|glb|gltf)(\?|$)/i.test(u)) media.push(u); });
  await page.goto(url, {waitUntil: 'networkidle', timeout: 60000});
  await page.waitForTimeout(2000);
  const res = await page.evaluate(() => {
    const els = [...document.querySelectorAll('a, header *, nav *')].filter(e => { const r = e.getBoundingClientRect(); return r.top < 90 && r.left < 200 && r.width > 15 && r.width < 220; });
    return els.slice(0, 12).map(e => ({tag: e.tagName, cls: e.className?.baseVal ?? e.className, html: e.outerHTML.slice(0, 400), rect: e.getBoundingClientRect().toJSON()}));
  });
  fs.writeFileSync(`capture/${name}_media.txt`, [...new Set(media)].join('\n'));
  console.log('==', name); console.log(JSON.stringify(res, null, 1).slice(0, 4000));
  await page.close();
}
await browser.close();
