/**
 * Mobile screenshot harness — captures every game phase at a phone viewport
 * (390x844 @2x, iPhone UA) using the ?dev= shortcuts.
 *
 * Usage:  npm run dev   (in another terminal, port 3000)
 *         node scripts/mobile-shots.js
 *         VIEWPORT=375x667 node scripts/mobile-shots.js   (small-phone pass)
 * Output: mobile-shots/*.png + mobile-shots/log.json (gitignored)
 *
 * Each shot also logs horizontal-overflow offenders (elements wider than the
 * viewport that aren't the news ticker) so layout regressions show up in the
 * console, not just the images.
 */
const { chromium } = require('playwright-core');
const fs = require('fs');
const os = require('os');
const path = require('path');

const BASE = process.env.BASE_URL || 'http://localhost:3000';
const [VW, VH] = (process.env.VIEWPORT || '390x844').split('x').map(Number);
const OUT = path.join(__dirname, '..', 'mobile-shots');
fs.mkdirSync(OUT, { recursive: true });

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

(async () => {
  const browser = await chromium.launch({ executablePath: findChromium(), headless: true });
  const ctx = await browser.newContext({
    viewport: { width: VW, height: VH },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  });
  const page = await ctx.newPage();
  const log = [];

  async function shot(name) {
    const vwArg = VW;
    await sleep(900); // let enter animations finish
    await page.screenshot({ path: path.join(OUT, name + '.png') });
    const overflow = await page.evaluate((vw) => {
      const bad = [...document.querySelectorAll('*')]
        .filter((e) => {
          const r = e.getBoundingClientRect();
          const cs = getComputedStyle(e);
          return (
            r.width > 30 && r.right > vw + 1 && r.left > -1 &&
            cs.position !== 'fixed' && cs.overflow !== 'hidden' &&
            !e.className.toString().includes('news-ticker')
          );
        })
        .slice(0, 4)
        .map((e) => e.tagName + '.' + String(e.className).slice(0, 60));
      return { scrollW: document.documentElement.scrollWidth, clipped: bad };
    }, vwArg);
    log.push({ name, ...overflow });
    console.log('SHOT', name, JSON.stringify(overflow));
  }

  async function go(url) {
    await page.goto(BASE + url, { waitUntil: 'networkidle' });
    await sleep(600);
    const skip = page.locator('button:has-text("Skip")');
    if ((await skip.count()) && (await skip.first().isVisible().catch(() => false))) {
      await skip.first().click();
      await sleep(500);
    }
  }

  const scrollAll = (frac) =>
    page.evaluate((f) => {
      [...document.querySelectorAll('*')]
        .filter((e) => e.scrollHeight > e.clientHeight + 50)
        .forEach((e) => (e.scrollTop = e.scrollHeight * f));
      window.scrollTo(0, document.body.scrollHeight * f);
    }, frac);

  // Company select
  await go('/play');
  await shot('01-company-select-top');
  await scrollAll(1);
  await shot('02-company-select-bottom');

  // Expanded company card
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.locator('text=Harwick Energy PLC').first().click();
  await sleep(1200);
  await shot('03-company-card-expanded');

  // Q1 event
  await go('/play?dev=q1');
  await shot('04-q1-board-event');
  await scrollAll(1);
  await shot('05-q1-event-options');

  // Director profile overlay
  const seatLabel = page.locator('text=Mensah >> visible=true').first();
  if (await seatLabel.count()) {
    await seatLabel.click({ timeout: 5000 }).catch(() => {});
    await shot('06-director-profile');
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
  await shot('07-deployment-modal');
  for (const nm of ['Mensah', 'Tanaka', 'Voss']) {
    const d = page.locator(`text=${nm} >> visible=true`).last();
    if (await d.count()) await d.click({ timeout: 3000 }).catch(() => {});
    await sleep(300);
  }
  await shot('08-deployment-selected');
  const send = page.locator('button:has-text("Confirm Deployment")');
  if ((await send.count()) && (await send.first().isEnabled().catch(() => false))) {
    await send.first().click();
    await sleep(1500);
    await shot('09-outcome');
  }

  // AGM
  await go('/play?dev=agm');
  await shot('10-agm-top');
  await scrollAll(0.4);
  await shot('11-agm-mid');
  await scrollAll(1);
  await shot('12-agm-bottom');

  // Year end
  await go('/play?dev=yearend');
  await shot('13-yearend-top');
  await scrollAll(0.5);
  await shot('14-yearend-mid');
  await scrollAll(1);
  await shot('15-yearend-bottom');

  // Company variants
  await go('/play?dev=rheinfeld-q1');
  await shot('16-rheinfeld-q1');
  await go('/play?dev=rheinfeld-agm');
  await shot('17-rheinfeld-agm');
  await go('/play?dev=vantage-agm');
  await shot('18-vantage-agm');

  fs.writeFileSync(path.join(OUT, 'log.json'), JSON.stringify(log, null, 2));
  await browser.close();
  console.log('DONE —', log.length, 'shots in', OUT);
})().catch((e) => {
  console.error('FAIL', e.message);
  process.exit(1);
});
