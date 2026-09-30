import {chromium} from 'playwright';
const browser = await chromium.launch({executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
const page = await browser.newPage({viewport: {width: 1600, height: 900}});
await page.goto('https://signalroom.framer.website/', {waitUntil: 'networkidle', timeout: 60000});
await page.waitForTimeout(5000);
const r = await page.evaluate(() => {
  const hits = [];
  const want = /CH ?\+|CH\+|channel|built by|riseabovereality|book a call|see the work|start a project|strategy first|founder led|about us/i;
  for (const e of document.querySelectorAll('a, button, [role=button], div, span, p')) {
    const t = (e.innerText || e.getAttribute('aria-label') || '').trim();
    if (!t || t.length > 40 || !want.test(t)) continue;
    const b = e.getBoundingClientRect();
    if (b.width < 5 || b.width > 600) continue;
    hits.push([e.tagName, t.replace(/\s+/g, ' '), Math.round(b.left + b.width / 2), Math.round(b.top + scrollY + b.height / 2), Math.round(b.width), Math.round(b.height), e.getAttribute('href') || '']);
  }
  const H = document.documentElement.scrollHeight;
  return {H, hits: hits.filter((h, i) => hits.findIndex(k => k[1] === h[1] && Math.abs(k[3] - h[3]) < 5) === i)};
});
console.log('H', r.H); for (const h of r.hits) console.log(h.join(' | '));
await browser.close();
