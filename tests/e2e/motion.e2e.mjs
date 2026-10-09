import { join } from 'node:path';
import { BASE, SITE_ID, closeBrowser, expect, finish, loadedJs, skip, step, withPage } from './harness.mjs';

if (!['fernway-au', 'fernway-ca', 'hollybank'].includes(SITE_ID)) {
  skip('motion checks (demo sites only)');
  finish();
}

/** True when a view-transition rule applies to the page (runs in the page). */
const viewTransitionRule = () => [...document.styleSheets].flatMap((s) => { try { return [...s.cssRules]; } catch { return []; } })
  .some((r) => r.cssText.includes('@view-transition') && matchMedia(r.conditionText ?? 'all').matches);

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
    const opacities = await page.locator('#faq details').evaluateAll((els) => els.map((e) => getComputedStyle(e).opacity));
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
    expect(!(await page.evaluate(viewTransitionRule)), 'console carries a view-transition rule');
    expect(!loadedJs(join('dist', SITE_ID), 'console/index.html').includes('data-reveal-group'), 'console loads the reveal script');
  });
});

await step('mobile menu opens above the hero and takes the clicks', async () => {
  await withPage({ viewport: { width: 375, height: 800 } }, async (page) => {
    await page.goto(`${BASE}/`);
    await page.waitForTimeout(1000);
    await page.locator('[data-menu-toggle]').click();
    await page.waitForTimeout(500); // the panel slides in
    const hits = await page.locator('#site-nav a:visible').evaluateAll((links) => links.map((a) => {
      const r = a.getBoundingClientRect();
      const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      return !!hit?.closest('#site-nav');
    }));
    expect(hits.length > 0 && hits.every(Boolean), `nav links hit-tested inside the menu: ${hits}`);
  });
});

await step('hero text and photo animate in, and end fully visible', async () => {
  await withPage({}, async (page) => {
    await page.goto(`${BASE}/`);
    const names = await page.locator('.hero .copy > *, .hero img').evaluateAll((els) => els.filter((e) => e.getClientRects().length).map((e) => getComputedStyle(e).animationName));
    expect(names.length >= 4 && names.every((n) => n !== 'none'), `hero animation names: ${names}`);
    await page.waitForTimeout(1000);
    const ends = await page.locator('.hero .copy > *, .hero img').evaluateAll((els) => els.filter((e) => e.getClientRects().length).map((e) => getComputedStyle(e).opacity));
    expect(ends.every((o) => o === '1'), `hero end opacities: ${ends}`);
  });
});

await step('reduced motion: the hero does not animate', async () => {
  await withPage({ reducedMotion: 'reduce' }, async (page) => {
    await page.goto(`${BASE}/`);
    const names = await page.locator('.hero .copy > *, .hero img').evaluateAll((els) => els.map((e) => getComputedStyle(e).animationName));
    expect(names.every((n) => n === 'none'), `hero animation names: ${names}`);
  });
});

await step('booking: moving on slides the next step in from the right, going back from the left', async () => {
  await withPage({}, async (page) => {
    await page.goto(`${BASE}/book/`);
    const form = page.locator('#booking-root form');
    expect((await form.getAttribute('data-dir')) === null, 'no direction on first load');
    await page.locator('input[name="service"]').first().check();
    await page.locator('[data-step]:not([hidden]) [data-next]').first().click();
    expect((await form.getAttribute('data-dir')) === 'forward', 'direction after Next');
    const name = await page.locator('[data-step]:not([hidden])').evaluate((e) => getComputedStyle(e).animationName);
    expect(name === 'step-in', `step animation: ${name}`);
    await page.locator('[data-step]:not([hidden]) [data-back]').first().click();
    expect((await form.getAttribute('data-dir')) === 'back', 'direction after Back');
    await page.waitForTimeout(400);
    const end = await page.locator('[data-step]:not([hidden])').evaluate((e) => getComputedStyle(e).opacity);
    expect(end === '1', `step end opacity: ${end}`);
  });
});

await step('booking under reduced motion: steps change with no animation', async () => {
  await withPage({ reducedMotion: 'reduce' }, async (page) => {
    await page.goto(`${BASE}/book/`);
    await page.locator('input[name="service"]').first().check();
    await page.locator('[data-step]:not([hidden]) [data-next]').first().click();
    const s = await page.locator('[data-step]:not([hidden])').evaluate((e) => ({ a: getComputedStyle(e).animationName, t: getComputedStyle(e).transform }));
    expect(s.a === 'none' && s.t === 'none', `step under reduced motion: ${JSON.stringify(s)}`);
  });
});

await step('page changes cross-fade where the browser supports it, and never under reduced motion', async () => {
  await withPage({}, async (page) => {
    await page.goto(`${BASE}/`);
    expect(await page.evaluate(viewTransitionRule), 'view transition rule should apply');
  });
  await withPage({ reducedMotion: 'reduce' }, async (page) => {
    await page.goto(`${BASE}/`);
    expect(!(await page.evaluate(viewTransitionRule)), 'view transition rule should not apply under reduced motion');
  });
});

await closeBrowser();
finish();
