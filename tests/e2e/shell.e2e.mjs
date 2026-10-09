import { BASE, SITE_ID, closeBrowser, expect, finish, skip, step, withPage } from './harness.mjs';

const fernway = SITE_ID.startsWith('fernway');
const visibleText = (page, sel) => page.locator(sel).innerText();

await step('one h1, tap-to-call and legal id in footer', async () => {
  await withPage({}, async (page) => {
    await page.goto(`${BASE}/`);
    expect((await page.locator('h1').count()) === 1, 'expected exactly one h1');
    const footer = await visibleText(page, 'footer');
    // The header holds several tel links: the utility row's, the menu panel's and the call button. The labelled one is the call button.
    // One exists per market variant, so only the current market's is visible.
    const call = page.locator('header a[aria-label^="Call"]:visible');
    if (SITE_ID === 'fernway-au') {
      expect(await call.isVisible(), 'AU tap-to-call missing');
      expect((await call.getAttribute('href')) === 'tel:+61355501200', `AU tap-to-call href ${await call.getAttribute('href')}`);
      expect(/ABN 00 000 000 000/.test(footer), `footer: ${footer}`);
    } else if (SITE_ID === 'fernway-ca') {
      expect(await call.isVisible(), 'CA tap-to-call missing');
      expect((await call.getAttribute('href')) === 'tel:+16135550123', `CA tap-to-call href ${await call.getAttribute('href')}`);
      expect(/BN 000000000/.test(footer), `footer: ${footer}`);
    } else {
      expect(await call.isVisible(), 'UK tap-to-call missing');
      expect((await call.getAttribute('href')) === 'tel:+441134960123', `UK tap-to-call href ${await call.getAttribute('href')}`);
      expect(/Company number 00000000/.test(footer), `footer: ${footer}`);
    }
  });
});

await step('demo ribbon visible', async () => {
  await withPage({}, async (page) => {
    await page.goto(`${BASE}/`);
    const text = 'Sample clinic. Clinicians, prices, reviews and messages are examples.';
    expect(await page.getByText(text).isVisible(), 'ribbon not visible');
  });
});

await step('demo sites ship the component gallery', async () => {
  const res = await fetch(`${BASE}/dev/ui/`);
  expect(res.status === 200, `/dev/ui/ returned ${res.status}`);
});

if (SITE_ID === 'fernway-au') {
  await step('?market=CA switches market for the session', async () => {
    await withPage({}, async (page) => {
      await page.goto(`${BASE}/?market=CA`);
      expect((await page.locator('html').getAttribute('data-market')) === 'CA', 'html data-market should be CA');
      const footer = await visibleText(page, 'footer');
      expect(/613-555-0123/.test(footer) && /BN 000000000/.test(footer), `footer: ${footer}`);
      expect(!/ABN/.test(footer), 'AU identity should be hidden');
      const other = await page.request.get(`${BASE}/contact/`);
      await page.goto(`${BASE}/${other.ok() ? 'contact/' : ''}`);
      expect((await page.locator('html').getAttribute('data-market')) === 'CA', 'market should persist');
    });
    await withPage({}, async (page) => {
      await page.goto(`${BASE}/`);
      expect((await page.locator('html').getAttribute('data-market')) === 'AU', 'fresh context should be AU');
    });
  });

  await step('?market=US is ignored', async () => {
    await withPage({}, async (page) => {
      await page.goto(`${BASE}/?market=US`);
      expect((await page.locator('html').getAttribute('data-market')) === 'AU', 'should stay AU');
    });
  });
} else skip('market switching (AU build only)');

if (fernway) {
  await step('?theme=harbour switches theme', async () => {
    await withPage({}, async (page) => {
      await page.goto(`${BASE}/?theme=harbour`);
      expect((await page.locator('html').getAttribute('data-theme')) === 'harbour', 'theme should be harbour');
    });
  });
} else skip('theme switching (Fernway only)');

// The sitemap lists every route this build generates; the header and footer may link to nothing else.
const sitemap = await (await fetch(`${BASE}/sitemap-0.xml`)).text();
const ALLOWED = new Set([...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname));

await step('nav only links generated routes', async () => {
  await withPage({}, async (page) => {
    await page.goto(`${BASE}/`);
    const hrefs = await page.locator('header nav a[href], footer a[href]').evaluateAll((els) => els.map((e) => e.getAttribute('href')));
    const internal = hrefs.filter((h) => h.startsWith('/'));
    expect(internal.length > 4, `expected nav links, got ${internal.length}`);
    const bad = internal.filter((h) => !ALLOWED.has(h.split('#')[0]));
    expect(bad.length === 0, `links to routes this site does not generate: ${bad.join(', ')}`);
    const banned = fernway ? '/prices/' : '/fees/';
    expect(!internal.includes(banned), `found link to ${banned}`);
  });
});

await step('mobile layout at 375px: compact header, call and book bar, footer not covered', async () => {
  await withPage({ viewport: { width: 375, height: 800 } }, async (page) => {
    await page.goto(`${BASE}/`);
    // The header's book button is hidden on mobile; the bar fixed to the bottom carries booking and a call button.
    expect(!(await page.locator('header .cta a[href="/book/"]').isVisible()), 'header book button should be hidden');
    const barBook = page.locator('.mobile-bar a[href="/book/"]');
    if (SITE_ID === 'fixture-no-booking') expect((await barBook.count()) === 0, 'no-booking fixture should have no book link');
    else expect(await barBook.isVisible(), 'the bottom bar should carry the booking on mobile');
    expect(await page.locator('.mobile-bar a[href^="tel:"]:visible').count() === 1, 'the bottom bar should carry one call button');
    expect(await page.locator('header [data-menu-toggle]').isVisible(), 'menu toggle missing');
    const call = page.locator('header a[aria-label^="Call"]:visible');
    expect((await call.count()) === 1, 'header call link should be visible and labelled');
    expect(!(await call.locator('span').isVisible()), 'number text should be hidden on mobile');
    if (SITE_ID !== 'fixture-no-booking') {
      const callBox = await page.locator('.mobile-bar a[href^="tel:"]:visible').boundingBox();
      const book = await barBook.boundingBox();
      expect(book.width > callBox.width, `book button ${book.width}px should lead the call button ${callBox.width}px`);
    }
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    const last = page.locator('footer a:visible').last();
    const box = await last.boundingBox();
    const hit = await page.evaluate(([x, y]) => document.elementFromPoint(x, y)?.closest('a')?.getAttribute('href'), [box.x + box.width / 2, box.y + box.height / 2]);
    expect(hit === (await last.getAttribute('href')), `last footer link covered (hit ${hit})`);
  });
});

await closeBrowser();
finish();
