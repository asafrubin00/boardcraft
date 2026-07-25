/**
 * Tablet screenshot harness — captures the key screens across iPad-class
 * viewports in BOTH orientations, using the ?dev= shortcuts.
 *
 * Usage:  npm run dev   (in another terminal, port 3000)
 *         node scripts/tablet-shots.js
 *         DEVICES=ipad-air-portrait node scripts/tablet-shots.js
 * Output: tablet-shots/<device>/*.png + tablet-shots/log.json (gitignored)
 *
 * Beyond the images, each shot logs layout offenders:
 *   - clippedX: elements running past the right edge (horizontal overflow)
 *   - clippedY: elements whose content is taller than their box but that
 *     cannot scroll — the "crush" bug shape that has bitten mobile twice
 *   - tiny:     text rendered below 11px (tablet legibility floor)
 */
const { chromium } = require('playwright-core');
const fs = require('fs');
const os = require('os');
const path = require('path');

const BASE = process.env.BASE_URL || 'http://localhost:3000';
const OUT = path.join(__dirname, '..', 'tablet-shots');

// Real iPad CSS-pixel viewports. Portrait first, landscape is the swap.
const DEVICE_LIST = [
  { name: 'ipad-mini-portrait', w: 744, h: 1133 },
  { name: 'ipad-mini-landscape', w: 1133, h: 744 },
  { name: 'ipad-air-portrait', w: 820, h: 1180 },
  { name: 'ipad-air-landscape', w: 1180, h: 820 },
  { name: 'ipad-pro13-portrait', w: 1032, h: 1376 },
  { name: 'ipad-pro13-landscape', w: 1376, h: 1032 },
];

const only = process.env.DEVICES ? process.env.DEVICES.split(',') : null;
const DEVICES = only ? DEVICE_LIST.filter((d) => only.includes(d.name)) : DEVICE_LIST;

const IPAD_UA =
  'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';

function findChromium() {
  const cache = path.join(os.homedir(), 'Library/Caches/ms-playwright');
  const dirs = fs.existsSync(cache)
    ? fs.readdirSync(cache).filter((d) => /^chromium-\d+$/.test(d)).sort()
    : [];
  if (!dirs.length) {
    console.error('No Playwright Chromium found. Run: npx playwright-core install chromium');
    process.exit(1);
  }
  return path.join(
    cache, dirs[dirs.length - 1],
    'chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing'
  );
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function runDevice(browser, device, log) {
  const dir = path.join(OUT, device.name);
  fs.mkdirSync(dir, { recursive: true });

  const ctx = await browser.newContext({
    viewport: { width: device.w, height: device.h },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    userAgent: IPAD_UA,
  });
  const page = await ctx.newPage();

  async function shot(name) {
    await sleep(900); // let enter animations finish
    await page.screenshot({ path: path.join(dir, name + '.png') });
    const findings = await page.evaluate((vw) => {
      const els = [...document.querySelectorAll('body *')];
      const label = (e) => e.tagName + '.' + String(e.className).slice(0, 55);

      const clippedX = els
        .filter((e) => {
          const r = e.getBoundingClientRect();
          const cs = getComputedStyle(e);
          return (
            r.width > 30 && r.right > vw + 1 && r.left > -1 &&
            cs.position !== 'fixed' && cs.overflow !== 'hidden' &&
            cs.pointerEvents !== 'none' && // decorative glow/grain layers
            !e.className.toString().includes('news-ticker')
          );
        })
        .slice(0, 4).map(label);

      // Content taller than its box, with no way to scroll it into view.
      const clippedY = els
        .filter((e) => {
          const cs = getComputedStyle(e);
          if (cs.pointerEvents === 'none') return false; // decorative glow/grain layers
          const overflowsY = e.scrollHeight > e.clientHeight + 8 && e.clientHeight > 40;
          const canScroll = /auto|scroll/.test(cs.overflowY);
          return overflowsY && !canScroll && cs.overflowY === 'hidden';
        })
        .slice(0, 5)
        .map((e) => label(e) + ` (${e.clientHeight}<${e.scrollHeight})`);

      const tiny = [...new Set(
        els.filter((e) => {
          const txt = [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim().length > 2);
          if (!txt) return false;
          const r = e.getBoundingClientRect();
          if (r.width < 1 || r.height < 1) return false;
          return parseFloat(getComputedStyle(e).fontSize) < 11;
        }).map((e) => parseFloat(getComputedStyle(e).fontSize) + 'px ' + label(e))
      )].slice(0, 4);

      return { scrollW: document.documentElement.scrollWidth, clippedX, clippedY, tiny };
    }, device.w);

    const entry = { device: device.name, name, ...findings };
    log.push(entry);
    const flag =
      findings.scrollW > device.w + 1 || findings.clippedX.length || findings.clippedY.length
        ? '  <<<' : '';
    console.log(`  ${name}`, JSON.stringify(findings) + flag);
  }

  // Tutorial hints and the intro sequence cover the screen we're auditing.
  // Hints come in chains, so keep dismissing until none is left.
  async function dismissOverlays() {
    for (let pass = 0; pass < 6; pass++) {
      let clicked = false;
      for (const label of ['Skip', 'Got it']) {
        const b = page.locator(`button:has-text("${label}")`).first();
        if ((await b.count()) && (await b.isVisible().catch(() => false))) {
          await b.click({ timeout: 3000 }).catch(() => {});
          await sleep(450);
          clicked = true;
        }
      }
      if (!clicked) return;
    }
  }

  async function go(url) {
    await page.goto(BASE + url, { waitUntil: 'networkidle' });
    await sleep(600);
    await dismissOverlays();
  }

  const scrollAll = (frac) =>
    page.evaluate((f) => {
      [...document.querySelectorAll('*')]
        .filter((e) => e.scrollHeight > e.clientHeight + 50)
        .forEach((e) => (e.scrollTop = e.scrollHeight * f));
      window.scrollTo(0, document.body.scrollHeight * f);
    }, frac);

  console.log(`\n=== ${device.name} (${device.w}x${device.h}) ===`);

  // Landing page
  await go('/');
  await shot('00-landing');

  // Company select
  await go('/play');
  await shot('01-company-select-top');
  await scrollAll(1);
  await shot('02-company-select-bottom');

  // Expanded company card → board construction
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.locator('text=Harwick Energy PLC').first().click().catch(() => {});
  await sleep(1200);
  await shot('03-company-card-expanded');

  const start = page.locator('button:has-text("Start Game")').first();
  if ((await start.count()) && (await start.isVisible().catch(() => false))) {
    await start.click({ timeout: 10000 }).catch(() => {});
    await sleep(1800);
    await dismissOverlays();
    await shot('04-construction-empty');

    // The touch layout hides the pool behind a POOL side-tab; the desktop
    // layout shows it inline as the left panel, so this is a no-op there.
    const poolTab = page.locator('text=POOL >> visible=true').first();
    if (await poolTab.count()) {
      await poolTab.click({ timeout: 3000 }).catch(() => {});
      await sleep(800);
      await dismissOverlays();
      await shot('05-construction-pool');
    }

    // Open a candidate's detail view from whichever pool is on screen
    const cand = page.locator('button:has-text("£"), [draggable="true"]').first();
    if (await cand.count()) {
      await cand.click({ timeout: 3000 }).catch(() => {});
      await sleep(900);
      await shot('06-construction-candidate');
    }

    const compTab = page.locator('text=COMPLIANCE >> visible=true').first();
    if (await compTab.count()) {
      await compTab.click({ timeout: 3000 }).catch(() => {});
      await sleep(800);
      await shot('07-construction-compliance');
    }
  } else {
    console.log('  !! could not reach board construction');
  }

  // Q1 event
  await go('/play?dev=q1');
  await shot('08-q1-board-event');
  await scrollAll(1);
  await shot('09-q1-event-options');

  // Director profile overlay
  const seatLabel = page.locator('text=Mensah >> visible=true').first();
  if (await seatLabel.count()) {
    await seatLabel.click({ timeout: 5000 }).catch(() => {});
    await shot('10-director-profile');
    const ret = page.locator('button:has-text("Return")').first();
    if ((await ret.count()) && (await ret.isVisible().catch(() => false))) {
      await ret.click();
      await sleep(600);
    }
  }

  // Deployment modal → outcome
  await scrollAll(1);
  const opts = page.locator('main button');
  const n = await opts.count();
  for (let i = 0; i < n; i++) {
    const t = await opts.nth(i).innerText().catch(() => '');
    if (/High impact|Committee|Proactive/i.test(t)) { await opts.nth(i).click(); break; }
  }
  await sleep(800);
  await shot('11-deployment-modal');
  for (const nm of ['Mensah', 'Tanaka', 'Voss']) {
    const d = page.locator(`text=${nm} >> visible=true`).last();
    if (await d.count()) await d.click({ timeout: 3000 }).catch(() => {});
    await sleep(300);
  }
  const send = page.locator('button:has-text("Confirm Deployment")');
  if ((await send.count()) && (await send.first().isEnabled().catch(() => false))) {
    await send.first().click();
    await sleep(1500);
    await shot('12-outcome');
  }

  // AGM
  await go('/play?dev=agm');
  await shot('13-agm-top');
  await scrollAll(0.5);
  await shot('14-agm-mid');
  await scrollAll(1);
  await shot('15-agm-bottom');

  // Year end
  await go('/play?dev=yearend');
  await shot('16-yearend-top');
  await scrollAll(0.5);
  await shot('17-yearend-mid');
  await scrollAll(1);
  await shot('18-yearend-bottom');

  // Company variants (two-tier grid board + bespoke AGMs)
  await go('/play?dev=rheinfeld-q1');
  await shot('19-rheinfeld-q1');
  await go('/play?dev=rheinfeld-agm');
  await shot('20-rheinfeld-agm');
  await go('/play?dev=vantage-agm');
  await shot('21-vantage-agm');

  await ctx.close();
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ executablePath: findChromium(), headless: true });
  const log = [];
  for (const device of DEVICES) {
    await runDevice(browser, device, log).catch((e) =>
      console.error(`FAIL ${device.name}:`, e.message)
    );
  }
  fs.writeFileSync(path.join(OUT, 'log.json'), JSON.stringify(log, null, 2));
  await browser.close();

  const widthOf = Object.fromEntries(DEVICE_LIST.map((d) => [d.name, d.w]));
  const bad = log.filter(
    (l) => l.clippedX.length || l.clippedY.length || l.scrollW > widthOf[l.device] + 1
  );
  console.log(`\nDONE — ${log.length} shots in ${OUT}`);
  console.log(`${bad.length} shots with layout offenders`);
})().catch((e) => {
  console.error('FAIL', e.message);
  process.exit(1);
});
