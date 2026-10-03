import { BASE, SITE_ID, closeBrowser, expect, finish, skip, step, withPage } from './harness.mjs';

if (SITE_ID !== 'fixture-minimal') {
  skip('module-off checks (fixture-minimal build only)');
  finish();
}

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

await closeBrowser();
finish();
