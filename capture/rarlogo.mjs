import {chromium} from 'playwright';
import fs from 'fs';
const browser = await chromium.launch({executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
const page = await browser.newPage({viewport: {width: 1440, height: 900}, deviceScaleFactor: 4});
await page.goto('https://www.riseabovereality.com', {waitUntil: 'networkidle', timeout: 60000});
await page.waitForTimeout(3000);
const r = await page.evaluate(() => {
  const all = [...document.querySelectorAll('svg, img, canvas')].map(e => ({tag: e.tagName, rect: e.getBoundingClientRect().toJSON(), html: e.outerHTML}));
  return all.filter(e => e.rect.top < 80 && e.rect.left < 120);
});
for (const e of r) console.log(e.tag, JSON.stringify(e.rect), e.html.length);
if (r[0]) { fs.writeFileSync('public/brand/rar/logo_raw.html', r.map(e => e.html).join('\n\n')); }
await page.screenshot({path: 'capture/rar_logo_zoom.png', clip: {x: 0, y: 0, width: 140, height: 70}});
await browser.close();
