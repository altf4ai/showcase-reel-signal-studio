import {chromium} from 'playwright';
const [url, out, w, h] = [process.argv[2], process.argv[3], +process.argv[4] || 1440, +process.argv[5] || 900];
const fs = await import('fs'); fs.mkdirSync(out, {recursive: true});
const browser = await chromium.launch({executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
const page = await browser.newPage({viewport: {width: w, height: h}, deviceScaleFactor: 1});
await page.goto(url, {waitUntil: 'networkidle', timeout: 60000});
await page.waitForTimeout(3000);
const H = await page.evaluate(() => document.documentElement.scrollHeight);
let i = 0;
for (let y = 0; y < H; y += Math.round(h * 0.8)) {
  await page.evaluate(yy => window.scrollTo(0, yy), y);
  await page.waitForTimeout(1400);
  await page.screenshot({path: `${out}/s${String(i++).padStart(3, '0')}_${y}.jpg`, quality: 80});
}
console.log('height', H, 'shots', i);
await browser.close();
