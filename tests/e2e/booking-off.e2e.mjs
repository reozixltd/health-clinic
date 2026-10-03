import { BASE, SITE_ID, closeBrowser, expect, finish, skip, step, withPage } from './harness.mjs';

if (SITE_ID !== 'fixture-no-booking') {
  skip('booking-off checks (fixture-no-booking build only)');
  finish();
}

await step('/book/ returns 404 and the sitemap omits it', async () => {
  const res = await fetch(`${BASE}/book/`);
  expect(res.status === 404, `/book/ should 404, got ${res.status}`);
  const sitemap = await (await fetch(`${BASE}/sitemap-0.xml`)).text();
  expect(!/\/book\//.test(sitemap), 'sitemap lists /book/');
});

await step('no page links to /book/, on desktop or on the mobile bar', async () => {
  const sitemap = await (await fetch(`${BASE}/sitemap-0.xml`)).text();
  const paths = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname);
  expect(paths.length > 5, `sitemap lists too few pages: ${paths.length}`);
  for (const viewport of [{ width: 1280, height: 800 }, { width: 375, height: 800 }]) {
    await withPage({ viewport }, async (page) => {
      for (const path of paths) {
        const res = await page.goto(`${BASE}${path}`);
        expect(res?.status() === 200, `${path} returned ${res?.status()}`);
        const hrefs = await page.locator('a[href]').evaluateAll((els) => els.map((e) => e.getAttribute('href')));
        const bad = hrefs.filter((h) => /^\/book\//.test(h));
        expect(bad.length === 0, `${path} @${viewport.width} links to ${bad.join(', ')}`);
      }
    });
  }
});

await closeBrowser();
finish();
