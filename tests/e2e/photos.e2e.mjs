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
    // The exterior slot is claimed by the facilities band, so only one component carries that photo.
    expect((await page.locator('#facilities img').count()) === 1, 'exterior photo missing');
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

/**
 * The corner a box actually draws, measured from pixels rather than read off the style.
 *
 * `cornerInset` is the horizontal distance from the box's left edge to the first non-background
 * pixel, `depth` CSS px down from its top edge. For a circular corner of radius r that is
 * r - sqrt(r*r - (r-depth)*(r-depth)), so at depth 2 an 8px corner insets about 2.7px and a 16px
 * corner about 8.3px. Measured at deviceScaleFactor 4 so the answer is not off by a whole CSS pixel,
 * and compared against the background captured beside the box, since the tile does not always sit
 * on the page background.
 *
 * This has to be a pixel measurement. `.photo` sets `overflow: hidden`, and an ancestor's overflow
 * clips descendants to the ancestor's own rounded padding box, so a tile can compute a smaller
 * radius than it draws. Reading the computed style would have passed while the 72px tile still
 * rendered the 16px card corner.
 */
const RADIUS_SCALE = 4;
const PROBE_DEPTH = 2;

async function cornerInset(page, locator) {
  await locator.scrollIntoViewIfNeeded();
  // Scroll reveals set an inline opacity:0 and a translateY on the tile's ancestor, so a box read
  // too early is both invisible and moving. Wait for the reveal to finish before measuring.
  const handle = await locator.elementHandle();
  await page.waitForFunction(
    (el) => {
      for (let n = el; n; n = n.parentElement) {
        const s = getComputedStyle(n);
        if (Number(s.opacity) < 0.99) return false;
        if (s.transform !== 'none' && s.transform !== 'matrix(1, 0, 0, 1, 0, 0)') return false;
      }
      return true;
    },
    handle,
    { timeout: 8000 }
  );

  const box = await locator.boundingBox();
  const PAD = 8; // page background captured around the box, to compare pixels against
  const left = Math.max(0, box.x - PAD);
  const top = Math.max(0, box.y - PAD);
  const buf = await page.screenshot({
    clip: { x: left, y: top, width: box.x + box.width - left, height: Math.min(box.height, 64) + (box.y - top) },
    type: 'png',
  });

  return page.evaluate(
    async ({ dataUrl, scale, depth, offsetX, offsetY }) => {
      const img = new Image();
      await new Promise((res, rej) => {
        img.onload = res;
        img.onerror = rej;
        img.src = dataUrl;
      });
      const c = document.createElement('canvas');
      c.width = img.naturalWidth;
      c.height = img.naturalHeight;
      const ctx = c.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(img, 0, 0);
      // Reference background: a pixel up and to the left of the box, inside the captured margin.
      const ref = ctx.getImageData(Math.max(0, Math.round(offsetX * scale) - 2), Math.max(0, Math.round(offsetY * scale) - 2), 1, 1).data;
      const isBg = (d, o) => Math.abs(d[o] - ref[0]) <= 4 && Math.abs(d[o + 1] - ref[1]) <= 4 && Math.abs(d[o + 2] - ref[2]) <= 4;
      const y = Math.round((offsetY + depth) * scale);
      if (y >= c.height) return null;
      const x0 = Math.round(offsetX * scale);
      const d = ctx.getImageData(x0, y, c.width - x0, 1).data;
      for (let i = x0; i < c.width; i++) {
        if (!isBg(d, (i - x0) * 4)) return (i - x0) / scale;
      }
      return null;
    },
    { dataUrl: 'data:image/png;base64,' + buf.toString('base64'), scale: RADIUS_SCALE, depth: PROBE_DEPTH, offsetX: box.x - left, offsetY: box.y - top }
  );
}

/** The radius a measured inset implies, for the failure message. */
function radiusFor(inset, depth = PROBE_DEPTH) {
  let best = 0;
  for (let r = 0; r <= 40; r += 0.05) {
    if (r - Math.sqrt(Math.max(0, r * r - (r - depth) * (r - depth))) <= inset + 0.3) best = r;
  }
  return Math.round(best * 10) / 10;
}

await step('the initials tile curves by its own width, control radius small and card radius large', async () => {
  await withPage({ deviceScaleFactor: RADIUS_SCALE }, async (page) => {
    // Every initials tile in the shipped design is card sized, because the team band and /team/
    // are card grids. So the two branches are read off one tile rather than off two pages that
    // happened to differ in size: the tile is constrained in the browser and the same corner is
    // measured on each side of the 160px container threshold. That probes the boundary itself,
    // which comparing two incidental page sizes never did.
    await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
    const tile = page.locator('.initials').first();
    expect((await tile.count()) === 1, 'no initials tile on the home page');
    const naturalW = Math.round((await tile.boundingBox()).width);

    /** Constrain the tile and re-measure its rendered corner. */
    const measureAt = async (width) => {
      await page.evaluate((w) => {
        const el = document.querySelector('.initials');
        el.style.maxWidth = `${w}px`;
        el.style.width = `${w}px`;
      }, width);
      // The container query resolves on the tile's own inline size, so let layout settle.
      await page.waitForFunction((w) => Math.round(document.querySelector('.initials').getBoundingClientRect().width) === w, width);
      return cornerInset(page, tile);
    };

    // 120px is under the threshold and 240px is over it, so neither sits on the boundary itself.
    const smallInset = await measureAt(120);
    const largeInset = await measureAt(240);

    expect(smallInset !== null && largeInset !== null, `could not measure a corner: ${smallInset} and ${largeInset}`);
    // --radius-control is 8px and --radius-card is 16px; 5 sits between the two insets above.
    expect(
      smallInset < 5,
      `the 120px initials tile draws a ~${radiusFor(smallInset)}px corner (inset ${smallInset}px), so it is not the 8px control radius. A border-radius left on .photo.initials masks the tile's own, because the ancestor clips it.`
    );
    expect(
      largeInset >= 7,
      `the 240px initials tile draws a ~${radiusFor(largeInset)}px corner (inset ${largeInset}px), so the container query is not reaching --radius-card`
    );
    expect(
      naturalW >= 160,
      `the home page tile is ${naturalW}px wide, so the shipped design has no small avatar and this step would no longer cover the sub-threshold branch on any real page.`
    );
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

await step('contact photo keeps a usable width at 768 and the page does not scroll sideways', async () => {
  await withPage({ viewport: { width: 768, height: 900 } }, async (page) => {
    await page.goto(`${BASE}/contact/`);
    const w = (await page.locator('main img').first().boundingBox()).width;
    expect(w >= 280, `contact photo is ${Math.round(w)}px wide at 768`);
    expect((await page.evaluate(() => document.documentElement.scrollWidth)) <= 768, 'page scrolls sideways at 768');
  });
});

await closeBrowser();
finish();
