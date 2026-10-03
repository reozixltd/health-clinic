import AxeBuilder from '@axe-core/playwright';
import { BASE, SITE_ID, closeBrowser, expect, finish, step, withPage } from './harness.mjs';

const vet = SITE_ID === 'hollybank';
const THEMES = ['fernway', 'harbour'];
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'];
const next = (page) => page.locator('[data-step]:not([hidden]) [data-next]').click();

async function setTheme(page, theme) {
  await page.evaluate((t) => document.documentElement.setAttribute('data-theme', t), theme);
}

async function scan(page, label) {
  // Entrance animations pass through partial opacity; scan the settled page, as a visitor reads it.
  await page.evaluate(() => Promise.race([Promise.all(document.getAnimations().map((a) => a.finished.catch(() => {}))), new Promise((r) => setTimeout(r, 2000))]));
  const { violations } = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  const bad = violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
  expect(bad.length === 0, `${label}: ${bad.map((v) => `${v.id} (${v.nodes.length}) ${v.nodes[0]?.target?.join(' ')}`).join('; ')}`);
}

async function toYou(page) {
  await page.goto(`${BASE}/book/?service=${vet ? 'consultations' : 'physiotherapy'}`);
  await next(page);
  await next(page);
  if (vet) {
    await page.fill('#petName', 'Biscuit');
    await page.selectOption('#species', 'dog');
  }
  await page.check('#patientType-new');
  await next(page);
  await page.locator('input[name=day]').first().check();
  await page.check('#windowId-morning');
  await next(page);
}

await step('axe finds no serious or critical issues', async () => {
  for (const theme of THEMES) {
    await withPage({}, async (page) => {
      const pages = [['/', 'home'], [vet ? '/prices/' : '/fees/', 'fees or prices']];
      for (const [path, name] of pages) {
        await page.goto(`${BASE}${path}`);
        await setTheme(page, theme);
        await scan(page, `${name} ${theme}`);
      }
      await page.goto(`${BASE}/team/`);
      const href = await page.locator('main a[href^="/team/"]').first().getAttribute('href');
      await page.goto(`${BASE}${href}`);
      await setTheme(page, theme);
      await scan(page, `team page ${theme}`);

      await page.goto(`${BASE}/book/`);
      await setTheme(page, theme);
      await scan(page, `book step 1 ${theme}`);
      await toYou(page);
      await next(page);
      await page.locator('[role=alert]:focus').waitFor();
      await setTheme(page, theme);
      await scan(page, `book step 5 errors ${theme}`);

      await page.goto(`${BASE}/console/`);
      await page.fill('#console-email', 'clinic@demo.reozix');
      await page.fill('#console-password', 'demo1234');
      await page.getByRole('button', { name: 'Sign in' }).click();
      await page.locator('[data-inbox]').waitFor();
      await setTheme(page, theme);
      await scan(page, `console ${theme}`);
    });
  }
});

await step('tap targets are at least 44px in header, hero, mobile bar and booking form', async () => {
  await withPage({ viewport: { width: 375, height: 800 } }, async (page) => {
    const small = async (selector) =>
      page.locator(selector).evaluateAll((els) =>
        els.filter((e) => e.getBoundingClientRect().width > 0)
          .map((e) => ({ name: (e.textContent || e.getAttribute('aria-label') || e.id || e.tagName).trim().slice(0, 30), h: e.getBoundingClientRect().height }))
          .filter((e) => e.h < 43.5));
    await page.goto(`${BASE}/`);
    await page.locator('[data-menu-toggle]').click();
    for (const [name, sel] of [['header', 'header a, header button'], ['hero', '.hero a, .hero button'], ['mobile bar', '.mobile-bar a, .mobile-bar button, [data-mobile-bar-root] a']]) {
      expect((await page.locator(sel).count()) > 0, `${name}: selector matched nothing`);
      const bad = await small(sel);
      expect(bad.length === 0, `${name}: ${JSON.stringify(bad)}`);
    }
    await page.goto(`${BASE}/book/`);
    const bad = await small('[data-step]:not([hidden]) :is(button, .choice, input:not([type=radio]):not([type=checkbox]):not([tabindex="-1"]), select)');
    expect(bad.length === 0, `booking form step 1: ${JSON.stringify(bad)}`);
    await toYou(page);
    const you = await small('[data-step]:not([hidden]) :is(button, .choice, input:not([type=radio]):not([type=checkbox]):not([tabindex="-1"]), select)');
    expect(you.length === 0, `booking form step 5: ${JSON.stringify(you)}`);
  });
});

await step('reduced motion removes the button press scale and keeps the card fade at 160ms or less', async () => {
  await withPage({ reducedMotion: 'reduce' }, async (page) => {
    await page.goto(`${BASE}/`);
    const btn = page.locator('.btn:visible').first();
    const box = await btn.boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    const transform = await btn.evaluate((e) => getComputedStyle(e).transform);
    await page.mouse.up();
    expect(transform === 'none', `button transform while pressed: ${transform}`);
    await page.goto(`${BASE}/book/`);
    const fade = await page.locator('[data-line] dd').first().evaluate((e) => {
      const s = getComputedStyle(e);
      return { property: s.transitionProperty, duration: s.transitionDuration };
    });
    expect(fade.property.includes('background-color'), `card fade property: ${fade.property}`);
    const ms = Math.max(...fade.duration.split(',').map((d) => parseFloat(d) * (d.includes('ms') ? 1 : 1000)));
    expect(ms <= 160, `card fade is ${ms}ms`);
  });
});

await closeBrowser();
finish();
