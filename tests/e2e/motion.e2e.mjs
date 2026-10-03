import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { BASE, SITE_ID, closeBrowser, expect, finish, skip, step, withPage } from './harness.mjs';

if (!['fernway-au', 'fernway-ca', 'hollybank'].includes(SITE_ID)) {
  skip('motion checks (demo sites only)');
  finish();
}

/** The text of every script a built page loads, following relative imports between chunks. */
function loadedJs(distDir, page) {
  const seen = new Set();
  const read = (file) => {
    if (seen.has(file)) return '';
    seen.add(file);
    let text = '';
    try { text = readFileSync(file, 'utf8'); } catch { return ''; }
    const refs = [...text.matchAll(/(?:from|import)\s*["'](\.[^"']+\.js)["']/g)].map((m) => join(file, '..', m[1]));
    return text + refs.map(read).join('');
  };
  const srcs = [...readFileSync(join(distDir, page), 'utf8').matchAll(/<script[^>]*src=["']([^"']+)["']/g)].map((m) => m[1]);
  return srcs.map((src) => read(join(distDir, src))).join('');
}

const ITEMS = '[data-reveal], [data-reveal-group] > *';

/** Opacity and transform of every reveal element that is rendered. */
const states = (page) =>
  page.locator(ITEMS).evaluateAll((els) =>
    els.filter((e) => e.getClientRects().length).map((e) => {
      const s = getComputedStyle(e);
      return { tag: e.tagName, id: e.closest('section')?.id ?? '', opacity: s.opacity, transform: s.transform };
    }),
  );

const scrollToBottom = (page) =>
  page.evaluate(async () => {
    for (let y = 0; y <= document.body.scrollHeight; y += innerHeight * 0.8) {
      scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 120));
    }
    scrollTo(0, document.body.scrollHeight);
  });

const allVisible = (list, where) => {
  expect(list.length > 5, `${where}: expected reveal elements, found ${list.length}`);
  for (const s of list) {
    expect(s.opacity === '1', `${where}: ${s.tag} in #${s.id} has opacity ${s.opacity}`);
    expect(s.transform === 'none', `${where}: ${s.tag} in #${s.id} has transform ${s.transform}`);
  }
};

for (const width of [1280, 375]) {
  await step(`home at ${width}: sections below the fold start hidden and all end visible`, async () => {
    await withPage({ viewport: { width, height: 800 } }, async (page) => {
      await page.goto(`${BASE}/`);
      await page.waitForFunction((sel) => [...document.querySelectorAll(sel)].some((e) => getComputedStyle(e).opacity === '0'), ITEMS);
      await scrollToBottom(page);
      await page.waitForTimeout(900);
      allVisible(await states(page), `home ${width}`);
    });
  });
}

await step('nothing on screen at load is hidden', async () => {
  await withPage({}, async (page) => {
    await page.goto(`${BASE}/`);
    await page.waitForTimeout(300);
    const hidden = await page.locator(ITEMS).evaluateAll((els) =>
      els.filter((e) => { const r = e.getBoundingClientRect(); return r.height > 0 && r.top < innerHeight && r.bottom > 0 && getComputedStyle(e).opacity === '0'; }).length,
    );
    expect(hidden === 0, `${hidden} on-screen elements are hidden at load`);
  });
});

await step('an anchor link to a lower section shows that section', async () => {
  await withPage({ viewport: { width: 375, height: 800 } }, async (page) => {
    await page.goto(`${BASE}/#faq`);
    await page.waitForTimeout(900);
    const opacities = await page.locator('#faq dl > *').evaluateAll((els) => els.map((e) => getComputedStyle(e).opacity));
    expect(opacities.length >= 5 && opacities.every((o) => o === '1'), `faq opacities: ${opacities}`);
  });
});

await step('reduced motion: nothing is ever hidden or moved', async () => {
  await withPage({ reducedMotion: 'reduce' }, async (page) => {
    await page.goto(`${BASE}/`);
    await page.waitForTimeout(300);
    allVisible(await states(page), 'reduced motion at load');
    await scrollToBottom(page);
    allVisible(await states(page), 'reduced motion after scroll');
  });
});

await step('JavaScript off: every section is visible', async () => {
  await withPage({ javaScriptEnabled: false }, async (page) => {
    await page.goto(`${BASE}/`);
    await page.waitForTimeout(900);
    allVisible(await states(page), 'no JavaScript');
    expect(await page.locator('.hero h1').evaluate((e) => getComputedStyle(e).opacity === '1'), 'hero heading hidden without JavaScript');
  });
});

await step('print: sections not yet scrolled to still print', async () => {
  await withPage({}, async (page) => {
    await page.goto(`${BASE}/`);
    await page.waitForFunction((sel) => [...document.querySelectorAll(sel)].some((e) => getComputedStyle(e).opacity === '0'), ITEMS);
    await page.emulateMedia({ media: 'print' });
    allVisible(await states(page), 'print');
  });
});

await step('a focused link inside a hidden reveal is shown', async () => {
  await withPage({}, async (page) => {
    await page.goto(`${BASE}/`);
    await page.waitForFunction((sel) => [...document.querySelectorAll(sel)].some((e) => getComputedStyle(e).opacity === '0'), ITEMS);
    const opacity = await page.evaluate(() => {
      const link = [...document.querySelectorAll('[data-reveal] a, [data-reveal-group] > * a')].find((a) => {
        const host = a.closest('[data-reveal-group] > *') ?? a.closest('[data-reveal]');
        return getComputedStyle(host).opacity === '0';
      });
      if (!link) return 'no hidden link at load';
      link.focus({ preventScroll: true });
      return getComputedStyle(link.closest('[data-reveal-group] > *') ?? link.closest('[data-reveal]')).opacity;
    });
    expect(opacity === '1', `focused link's reveal ancestor has opacity ${opacity}`);
  });
});

await step('the console has no reveal markup', async () => {
  await withPage({}, async (page) => {
    await page.goto(`${BASE}/console/`);
    expect((await page.locator('[data-reveal], [data-reveal-group]').count()) === 0, 'console has reveal attributes');
  });
});

await closeBrowser();
finish();
