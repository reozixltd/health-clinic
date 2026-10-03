import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { BASE, SITE_ID, closeBrowser, expect, finish, loadedJs, skip, step, withPage } from './harness.mjs';

if (SITE_ID !== 'fixture-minimal') {
  skip('module-off checks (fixture-minimal build only)');
  finish();
}

const html = (file) => readFileSync(join('dist', SITE_ID, file), 'utf8');

await step('switched-off modules leave no trace', async () => {
  for (const path of ['/fees/', '/referrers/']) {
    const res = await fetch(`${BASE}${path}`);
    expect(res.status === 404, `${path} should 404, got ${res.status}`);
  }
  const sitemap = await (await fetch(`${BASE}/sitemap-0.xml`)).text();
  expect(!/\/fees\/|\/referrers\//.test(sitemap), 'sitemap lists a switched-off route');
  await withPage({}, async (page) => {
    const paths = [...sitemap.matchAll(/<loc>[^<]*?(\/[^/<][^<]*|\/)<\/loc>/g)].map((m) => new URL(m[0].replace(/<\/?loc>/g, '')).pathname);
    expect(paths.length > 5, `sitemap lists too few pages: ${paths.length}`);
    for (const path of paths) {
      const res = await page.goto(`${BASE}${path}`);
      expect(res?.status() === 200, `${path} returned ${res?.status()}`);
      const hrefs = await page.locator('a[href]').evaluateAll((els) => els.map((e) => e.getAttribute('href')));
      const bad = hrefs.filter((h) => /^\/(fees|referrers)\//.test(h));
      expect(bad.length === 0, `${path} links to ${bad.join(', ')}`);
    }
    await page.goto(`${BASE}/`);
    expect((await page.locator('#reviews').count()) === 0, 'home has a reviews band');
  });
});

await step('no page loads JavaScript for switched-off modules', async () => {
  const dist = join('dist', SITE_ID);
  const htmlFiles = readdirSync(dist, { recursive: true }).filter((f) => String(f).endsWith('.html'));
  expect(htmlFiles.length > 5, `expected built html in ${dist}`);
  for (const f of htmlFiles) {
    const scripts = readFileSync(join(dist, String(f)), 'utf8').match(/<script\b[^>]*\bsrc=["'][^"']*["']|import\(?\s*["'][^"']*["']/g) ?? [];
    const bad = scripts.filter((t) => /ReferralForm|EstimateForm|ConfirmationPreview/.test(t));
    expect(bad.length === 0, `${f} references ${bad.join(', ')}`);
  }
});

await step('reminders off: /book/ has no sample confirmation and loads no reminders code', async () => {
  const page = html('book/index.html');
  expect(!page.includes('data-preview'), '/book/ has the confirmation preview markup');
  expect(!loadedJs(join('dist', SITE_ID), 'book/index.html').includes('data-preview-text'), '/book/ loads the reminders render code');
  const control = join('dist', 'fernway-au');
  if (existsSync(join(control, 'book/index.html'))) {
    expect(loadedJs(control, 'book/index.html').includes('data-preview-text'), 'control: a demo site with reminders on should load it');
  }
});

await step('reminders off: the console shows no message timelines', async () => {
  await withPage({}, async (page) => {
    await page.goto(`${BASE}/console/`);
    await page.fill('#console-email', 'clinic@demo.reozix');
    await page.fill('#console-password', 'demo1234');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await page.locator('[data-inbox] button').first().click();
    expect((await page.locator('[data-timeline-off]').innerText()) === 'Message previews are off.', 'expected the previews-off notice');
    expect((await page.locator('[data-timeline] li').count()) === 0, 'a timeline rendered');
  });
});

await step('motion off: no page carries reveal code or hides anything', async () => {
  const dist = join('dist', SITE_ID);
  expect(html('index.html').includes('data-motion="off"'), 'html should carry data-motion="off"');
  for (const page of ['index.html', 'book/index.html', 'services/index.html']) {
    expect(!loadedJs(dist, page).includes('data-reveal-group'), `${page} loads the reveal script`);
  }
  const control = join('dist', 'fernway-au');
  if (existsSync(join(control, 'index.html'))) {
    expect(loadedJs(control, 'index.html').includes('data-reveal-group'), 'control: a demo site should load the reveal script');
  }
  await withPage({}, async (page) => {
    await page.goto(`${BASE}/`);
    await page.waitForTimeout(300);
    const hidden = await page.locator('main *').evaluateAll((els) => els.filter((e) => e.getClientRects().length && getComputedStyle(e).opacity === '0').length);
    expect(hidden === 0, `${hidden} hidden elements on a motion-off site`);
    expect(await page.locator('h1').evaluate((e) => getComputedStyle(e).animationName) === 'none', 'hero heading animates on a motion-off site');
    const vt = await page.evaluate(() => [...document.styleSheets].flatMap((s) => { try { return [...s.cssRules]; } catch { return []; } }).some((r) => r.cssText.includes('@view-transition')));
    expect(!vt, 'motion-off site carries a view-transition rule');
  });
});

await closeBrowser();
finish();
