import {chromium} from 'playwright';
const browser = await chromium.launch({executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
const page = await browser.newPage({viewport: {width: 1600, height: 900}});
await page.goto('https://signalroom.framer.website/', {waitUntil: 'networkidle', timeout: 60000});
await page.waitForTimeout(4000);
const t = await page.evaluate(() => {
  const svc = document.querySelector('[data-framer-name="Services"]');
  const why = document.querySelector('[data-framer-name="Why us"]');
  const bring = document.querySelector('[data-framer-name="Our Superpower"]');
  const cta = [...document.querySelectorAll('h2')].find(h => /remember/.test(h.innerText))?.parentElement?.parentElement;
  return {services: svc?.innerText, why: why?.innerText, bring: bring?.innerText, cta: cta?.innerText};
});
for (const [k, v] of Object.entries(t)) console.log('=====', k, '\n', (v || '').replace(/\n{2,}/g, '\n').slice(0, 1800));
await browser.close();
