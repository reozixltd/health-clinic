import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { BASE, SITE_ID, closeBrowser, expect, finish, skip, step, withPage } from './harness.mjs';

if (SITE_ID !== 'fixture-live') {
  skip('live-site checks (fixture-live build only)');
  finish();
}

const ORIGIN = 'https://clinic.example';
const dist = join('dist', SITE_ID);
const html = (file) => readFileSync(join(dist, file), 'utf8');

await step('the site url comes from config: canonical, og:url, sitemap and JSON-LD', async () => {
  const home = html('index.html');
  expect(home.includes(`<link rel="canonical" href="${ORIGIN}/"`), 'canonical should use the configured url');
  expect(home.includes(`content="${ORIGIN}/"`), 'og:url should use the configured url');
  const files = readdirSync(dist, { recursive: true }).filter((f) => /\.(html|xml)$/.test(String(f)));
  const stray = files.filter((f) => readFileSync(join(dist, String(f)), 'utf8').includes('health.reozix.com'));
  expect(stray.length === 0, `another clinic's url appears in ${stray.join(', ')}`);
  expect((await (await fetch(`${BASE}/sitemap-0.xml`)).text()).includes(`<loc>${ORIGIN}/`), 'sitemap should use the configured url');
});

await step('a live site embeds only its own market and details', async () => {
  const home = html('index.html');
  expect(!/data-market-only="CA"/.test(home), 'home carries Canadian details');
  expect(!home.includes('613-555-0123'), 'home carries the Ottawa phone number');
  expect(home.includes('data-market="AU"') || home.includes('"AU"'), 'expected the AU market');
});

await step('the component gallery is not built', async () => {
  const res = await fetch(`${BASE}/dev/ui/`);
  expect(res.status === 404, `/dev/ui/ should 404, got ${res.status}`);
  expect(!/\/dev\//.test(await (await fetch(`${BASE}/sitemap-0.xml`)).text()), 'sitemap lists /dev/');
});

await step('no reviews heading without a reviews link', async () => {
  expect(!html('index.html').includes('What patients say'), 'home has an empty reviews band');
});

await step('the console neither seeds nor offers sample data or clearing', async () => {
  await withPage({}, async (page) => {
    await page.goto(`${BASE}/console/`);
    await page.fill('#console-email', 'clinic@demo.reozix');
    await page.fill('#console-password', 'demo1234');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await page.locator('[data-inbox]').waitFor();
    expect((await page.locator('[data-load], [data-clear]').count()) === 0, 'sample or clear buttons are present');
    expect(!(await page.locator('[data-inbox]').innerText()).includes('Load samples'), 'the empty inbox points at Load samples');
    expect((await page.locator('[data-inbox] button').count()) === 0, 'the inbox was seeded');
    const keys = await page.evaluate(() => [...Object.keys(localStorage), ...Object.keys(sessionStorage)]);
    expect(!keys.some((k) => k.endsWith(':seeded')), `seed flag written: ${keys.join(', ')}`);
  });
});

await closeBrowser();
finish();
