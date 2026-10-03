import { BASE, SITE_ID, closeBrowser, expect, finish, skip, step, withPage } from './harness.mjs';

if (!['fernway-au', 'fernway-ca', 'hollybank'].includes(SITE_ID)) {
  skip('photo checks (demo sites only)');
  finish();
}

const SERVICE = { 'fernway-au': 'physiotherapy', 'fernway-ca': 'physiotherapy', hollybank: 'vaccinations' }[SITE_ID];
const PAGES = ['/', `/services/${SERVICE}/`, '/contact/', '/team/'];

/** Every <img> in main has loaded pixels and alt text. */
async function imagesOk(page, path) {
  const imgs = await page.locator('main img').evaluateAll((els) => els.map((e) => ({ alt: e.alt, ok: e.complete && e.naturalWidth > 0, src: e.currentSrc })));
  for (const i of imgs) {
    expect(i.alt.trim().length > 0, `${path}: image without alt: ${i.src}`);
    expect(i.ok, `${path}: image did not load: ${i.src}`);
  }
  return imgs.length;
}

await step('home hero shows a photo that loads first', async () => {
  await withPage({}, async (page) => {
    await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
    const img = page.locator('.hero img');
    expect((await img.count()) === 1, 'hero should hold one image');
    expect((await img.getAttribute('loading')) === 'eager', 'hero image should not be lazy');
    expect((await img.getAttribute('alt')).trim().length > 0, 'hero image needs alt text');
    expect(await img.evaluate((e) => e.complete && e.naturalWidth > 0), 'hero image did not load');
  });
});

await step('home, service, contact and team pages show photos and no placeholder', async () => {
  await withPage({}, async (page) => {
    for (const path of PAGES) {
      await page.goto(`${BASE}${path}`);
      await page.evaluate(async () => {
        for (let y = 0; y < document.body.scrollHeight; y += innerHeight) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)); }
      });
      await page.waitForLoadState('networkidle');
      expect((await page.locator('.ph').count()) === 0, `${path} shows a placeholder`);
      const count = await imagesOk(page, path);
      if (path !== '/team/') expect(count >= 1, `${path} has no photo`);
    }
  });
});

await step('home shows the first-visit and exterior photos', async () => {
  await withPage({}, async (page) => {
    await page.goto(`${BASE}/`);
    expect((await page.locator('#first-visit img').count()) === 1, 'first-visit photo missing');
    expect((await page.locator('#location img').count()) === 1, 'location photo missing');
  });
});

await step('clinicians without a portrait show an initials tile with their name as its label', async () => {
  await withPage({}, async (page) => {
    await page.goto(`${BASE}/team/`);
    const tiles = page.locator('.initials');
    expect((await tiles.count()) >= 1, 'no initials tile on /team/');
    const first = tiles.first();
    const label = await first.getAttribute('aria-label');
    const text = (await first.innerText()).trim();
    expect(/^\p{Lu}{1,2}$/u.test(text), `tile text: ${text}`);
    expect(label && label.includes(','), `tile label: ${label}`);
  });
});

await step('hero photo sits beside the text at 1280 and below it at 375', async () => {
  const box = async (page, sel) => page.locator(sel).first().boundingBox();
  await withPage({}, async (page) => {
    await page.goto(`${BASE}/`);
    const [h1, img] = [await box(page, '.hero h1'), await box(page, '.hero img')];
    expect(img.x > h1.x + 200, 'at 1280 the photo should be to the right of the heading');
  });
  await withPage({ viewport: { width: 375, height: 800 } }, async (page) => {
    await page.goto(`${BASE}/`);
    const [h1, img] = [await box(page, '.hero h1'), await box(page, '.hero img')];
    expect(img.y > h1.y + h1.height, 'at 375 the photo should be below the heading');
    expect((await page.evaluate(() => document.documentElement.scrollWidth)) <= 375, 'page scrolls sideways at 375');
  });
});

await closeBrowser();
finish();
