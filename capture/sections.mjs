import {chromium} from 'playwright';
const [w, h] = [+process.argv[2] || 1440, +process.argv[3] || 900];
const browser = await chromium.launch({executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
const page = await browser.newPage({viewport: {width: w, height: h}});
await page.goto('https://signalroom.framer.website/', {waitUntil: 'networkidle', timeout: 60000});
await page.waitForTimeout(4000);
const r = await page.evaluate(() => {
  const out = [];
  for (const e of document.querySelectorAll('section, [data-framer-name], h1, h2, h3')) {
    const b = e.getBoundingClientRect();
    if (b.height < 40) continue;
    out.push([Math.round(b.top + scrollY), Math.round(b.height), e.tagName, (e.getAttribute('data-framer-name') || e.id || '').slice(0, 30), (e.innerText || '').replace(/\s+/g, ' ').slice(0, 50)]);
  }
  return {H: document.documentElement.scrollHeight, out: out.filter(o => o[2] !== 'DIV' || o[3])};
});
console.log('H', r.H); for (const o of r.out) console.log(o.join(' | '));
await browser.close();
