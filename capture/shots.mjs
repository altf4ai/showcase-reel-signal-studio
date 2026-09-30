// Shot scripts. Viewport 1600x900 CSS @2x => 3200x1800 frames (16:9, supersampled for 1080p + push-ins).
const SR = 'https://signalroom.framer.website/';
const V = {width: 1600, height: 900, dsf: 2};
// Hide every DOM element except the WebGL canvas (and its ancestors), keep layout intact.
const HIDE_UI = `(() => { const c = document.querySelector('canvas'); const keep = new Set(); for (let e = c; e; e = e.parentElement) keep.add(e);
  const st = document.createElement('style'); st.textContent = '*{cursor:none!important}'; document.head.appendChild(st);
  for (const e of document.body.querySelectorAll('*')) { if (!keep.has(e) && !e.contains(c)) e.style.setProperty('visibility', 'hidden', 'important'); } })()`;

export const shots = {
  // Site preloader: TV static, traffic light, "tuning in" counter, through to the hero reveal.
  preloader: {url: SR, ...V, recordFromStart: true, actions: [{wait: 60 * 5}]},

  // Hero: settle, cursor glides to "Book a call", hovers, drifts, then a slow scroll into the tape marquee.
  hero: {url: SR, ...V, actions: [
    {wait: 60 * 6},
    {mouse: [1250, 820], frames: 1},
    {record: true, wait: 40},
    {mouse: [820, 300], frames: 34},       // sweep over the headline -> scramble effect
    {mouse: [900, 250], frames: 20},
    {mouse: [724, 756], frames: 40},       // onto "Book a call"
    {wait: 50},
    {mouse: [980, 640], frames: 36},
    {scroll: 1150, frames: 150, ease: 'inOut'},
    {wait: 30},
  ]},

  // Scroll-driven "noise -> signal" TV story (sticky section).
  story: {url: SR, ...V, actions: [
    {wait: 60 * 6}, {jump: 2150}, {wait: 60},
    {record: true, wait: 10},
    {scroll: 4700, frames: 60 * 9, ease: 'linear'},
    {wait: 20},
  ]},

  // Caution-tape marquee -> "who we are" -> mixing console.
  about: {url: SR, ...V, actions: [
    {wait: 60 * 6}, {jump: 640}, {wait: 60},
    {mouse: [1300, 700], frames: 1},
    {record: true, wait: 10},
    {scroll: 1760, frames: 60 * 5, ease: 'inOut'},
    {mouse: [640, 560], frames: 50},
    {mouse: [960, 600], frames: 60},
    {wait: 30},
  ]},

  // Stacked service cards.
  services: {url: SR, ...V, actions: [
    {wait: 60 * 6}, {jump: 6990}, {wait: 60},
    {mouse: [1400, 800], frames: 1},
    {record: true, wait: 10},
    {scroll: 10330, frames: 60 * 9, ease: 'inOut'},
    {wait: 20},
  ]},

  // Retro TV: click CH+ through the channels.
  bring: {url: SR, ...V, actions: [
    {wait: 60 * 6}, {jump: 10440}, {wait: 420},
    {mouse: [1400, 760], frames: 1},
    {record: true, wait: 20},
    {mouse: [1104, 518], frames: 40},
    {wait: 10}, {click: true}, {wait: 50}, {click: true}, {wait: 50}, {click: true}, {wait: 50}, {click: true}, {wait: 50},
    {mouse: [720, 780], frames: 40}, {wait: 20},
  ]},

  // Why signalroom? cards.
  why: {url: SR, ...V, actions: [
    {wait: 60 * 6}, {jump: 11620}, {wait: 60},
    {mouse: [400, 700], frames: 1},
    {record: true, wait: 10},
    {scroll: 12420, frames: 60 * 5, ease: 'inOut'},
    {mouse: [560, 420], frames: 40}, {wait: 30},
    {mouse: [1050, 450], frames: 40}, {wait: 30},
  ]},

  // CTA + footer, ending on the "Built by RiseAboveReality" credit.
  cta: {url: SR, ...V, actions: [
    {wait: 60 * 6}, {jump: 14220}, {wait: 60},
    {mouse: [1200, 500], frames: 1},
    {record: true, wait: 10},
    {mouse: [719, 15017 - 14220], frames: 50}, {wait: 40},
    {scroll: 15350, frames: 60 * 4, ease: 'inOut'},
    {mouse: [1351, 864], frames: 50}, {wait: 70},
  ]},

  // Mobile (iPhone 15 viewport @3x).
  m_hero: {url: SR, width: 393, height: 852, dsf: 3, actions: [
    {wait: 60 * 6}, {record: true, wait: 60},
    {scroll: 2400, frames: 60 * 7, ease: 'inOut'},
  ]},
  m_story: {url: SR, width: 393, height: 852, dsf: 3, actions: [
    {wait: 60 * 6}, {js: "window.scrollTo(0, [...document.querySelectorAll('h2')].find(h => /feed/i.test(h.innerText)).getBoundingClientRect().top + scrollY - 300)"}, {wait: 60},
    {record: true, wait: 10},
    {js: "window.__to = [...document.querySelectorAll('h2')].find(h => /selected/i.test(h.innerText)).getBoundingClientRect().top + scrollY - 900"},
    {scrollJs: 'window.__to', frames: 60 * 7, ease: 'linear'},
  ]},
  m_services: {url: SR, width: 393, height: 852, dsf: 3, actions: [
    {wait: 60 * 6}, {js: "window.scrollTo(0, [...document.querySelectorAll('h2')].find(h => /what we do/i.test(h.innerText)).getBoundingClientRect().top + scrollY - 120)"}, {wait: 60},
    {record: true, wait: 10},
    {js: "window.__to = [...document.querySelectorAll('h2')].find(h => /what we bring/i.test(h.innerText)).getBoundingClientRect().top + scrollY - 100"},
    {scrollJs: 'window.__to', frames: 60 * 8, ease: 'inOut'},
  ]},
  m_why: {url: SR, width: 393, height: 852, dsf: 3, actions: [
    {wait: 60 * 6}, {js: "window.scrollTo(0, [...document.querySelectorAll('h2')].find(h => /why signalroom/i.test(h.innerText)).getBoundingClientRect().top + scrollY - 120)"}, {wait: 60},
    {record: true, wait: 10},
    {js: "window.__to = [...document.querySelectorAll('h2')].find(h => /take our word/i.test(h.innerText)).getBoundingClientRect().top + scrollY - 700"},
    {scrollJs: 'window.__to', frames: 60 * 6, ease: 'inOut'},
  ]},
  // Tablet, for the desktop -> tablet -> mobile morph.
  t_hero: {url: SR, width: 834, height: 1112, dsf: 2, actions: [
    {wait: 60 * 6}, {record: true, wait: 60 * 3},
  ]},
  m_hero_still: {url: SR, width: 393, height: 852, dsf: 3, actions: [
    {wait: 60 * 6}, {record: true, wait: 60 * 3},
  ]},

  // RiseAboveReality's own WebGL black hole (three.js), UI hidden so only the render remains.
  rar_hole_test: {url: 'https://www.riseabovereality.com', width: 1920, height: 1080, dsf: 1, actions: [
    {wait: 60 * 4}, {js: HIDE_UI}, {wait: 10}, {record: true, wait: 20},
  ]},
  // stepFps 30: the black hole moves slowly; half the (software) WebGL renders. Frame indices in the
  // Remotion timeline stay in 60fps units since the mp4 carries real timestamps.
  rar_hole: {url: 'https://www.riseabovereality.com', width: 1920, height: 1080, dsf: 1, stepFps: 30, actions: [
    {wait: 6}, {js: HIDE_UI}, {wait: 104}, {record: true, wait: 30 * 7},
  ]},
  rar_dive: {url: 'https://www.riseabovereality.com', width: 1920, height: 1080, dsf: 1, stepFps: 30, actions: [
    {wait: 6}, {js: HIDE_UI}, {wait: 150}, {record: true, wait: 5},
    {scroll: 2600, frames: 30 * 4, ease: 'inOut'}, {wait: 15},
  ]},
};
