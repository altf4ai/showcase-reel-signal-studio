import {chromium} from 'playwright';
const url = process.argv[2];
const out = process.argv[3];
const browser = await chromium.launch({executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
const page = await browser.newPage({viewport: {width: 1440, height: 900}, deviceScaleFactor: 1});
await page.goto(url, {waitUntil: 'networkidle', timeout: 60000});
await page.waitForTimeout(2500);
const info = await page.evaluate(() => {
  const h = document.documentElement.scrollHeight;
  const fonts = new Set(); const colors = {}; const bgs = {};
  for (const el of document.querySelectorAll('body *')) {
    const cs = getComputedStyle(el);
    if (el.childNodes.length && [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim())) {
      fonts.add(cs.fontFamily + ' | ' + cs.fontWeight);
      colors[cs.color] = (colors[cs.color] || 0) + 1;
    }
    if (cs.backgroundColor !== 'rgba(0, 0, 0, 0)') bgs[cs.backgroundColor] = (bgs[cs.backgroundColor] || 0) + 1;
  }
  const heads = [...document.querySelectorAll('h1,h2,h3,h4,p')].map(e => e.tagName + ': ' + e.innerText.replace(/\s+/g, ' ').trim()).filter(t => t.length > 4).slice(0, 150);
  const sections = [...document.querySelectorAll('section, [data-framer-name]')].filter(e => e.offsetHeight > 300).map(e => ({name: e.getAttribute('data-framer-name'), top: Math.round(e.getBoundingClientRect().top + scrollY), h: e.offsetHeight})).slice(0, 80);
  const imgs = [...document.querySelectorAll('img')].map(i => i.src).filter(Boolean);
  const svgLogos = [...document.querySelectorAll('header svg, nav svg, a[href="/"] svg, a[href="./"] svg')].map(s => s.outerHTML.length);
  return {h, title: document.title, fonts: [...fonts], colors: Object.entries(colors).sort((a,b)=>b[1]-a[1]).slice(0,15), bgs: Object.entries(bgs).sort((a,b)=>b[1]-a[1]).slice(0,15), heads, sections, imgs: imgs.slice(0, 80), svgLogos};
});
const fs = await import('fs');
fs.writeFileSync(out + '.json', JSON.stringify(info, null, 2));
console.log(JSON.stringify({h: info.h, title: info.title, fonts: info.fonts, colors: info.colors, bgs: info.bgs}, null, 1));
console.log(info.heads.join('\n'));
await browser.close();
