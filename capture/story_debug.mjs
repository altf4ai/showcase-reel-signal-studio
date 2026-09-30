import {chromium} from 'playwright';
const browser = await chromium.launch({executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
const page = await browser.newPage({viewport: {width: 1600, height: 900}});
await page.goto('https://signalroom.framer.website/', {waitUntil: 'networkidle', timeout: 60000});
await page.waitForTimeout(4000);
for (const y of [2300, 3000, 3600, 4300]) {
  await page.evaluate(yy => window.scrollTo(0, yy), y);
  await page.waitForTimeout(1500);
  const r = await page.evaluate(() => [...document.querySelectorAll('h2')].filter(h => /feed|signal|broadcast/i.test(h.innerText)).map(h => {
    const cs = getComputedStyle(h); const p = getComputedStyle(h.parentElement);
    return `${JSON.stringify(h.innerText.replace(/\s+/g,' '))} op=${cs.opacity} pop=${p.opacity} tr=${cs.transform} anims=${h.getAnimations({subtree:true}).length} key=${h.parentElement.getAttribute('data-framer-name')||''} vis=${cs.visibility} disp=${cs.display}`;
  }));
  console.log(y, r);
}
await browser.close();
