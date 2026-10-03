import { BASE, SITE_ID, closeBrowser, expect, finish, skip, step, withPage } from './harness.mjs';

const fernway = SITE_ID.startsWith('fernway');
const visibleText = (page, sel) => page.locator(sel).innerText();

await step('one h1, tap-to-call and legal id in footer', async () => {
  await withPage({}, async (page) => {
    await page.goto(`${BASE}/`);
    expect((await page.locator('h1').count()) === 1, 'expected exactly one h1');
    const footer = await visibleText(page, 'footer');
    if (SITE_ID === 'fernway-au') {
      expect(await page.locator('header a[href="tel:+61355501200"]').isVisible(), 'AU tap-to-call missing');
      expect(/ABN 00 000 000 000/.test(footer), `footer: ${footer}`);
    } else if (SITE_ID === 'fernway-ca') {
      expect(await page.locator('header a[href="tel:+16135550123"]').isVisible(), 'CA tap-to-call missing');
      expect(/BN 000000000/.test(footer), `footer: ${footer}`);
    } else {
      expect(await page.locator('header a[href="tel:+441134960123"]').isVisible(), 'UK tap-to-call missing');
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

// Routes built so far. Fixed pages not yet built are allowed temporarily; each is removed when its task lands.
const FIXED = ['/', '/contact/', '/new-patients/', '/faq/', '/privacy/', '/accessibility/', '/terms/'];
const MODULE_ROUTES = {
  'fernway-au': ['/services/', '/team/', '/fees/', '/book/', '/referrers/'],
  'fernway-ca': ['/services/', '/team/', '/fees/', '/book/', '/referrers/'],
  hollybank: ['/services/', '/team/', '/prices/', '/estimates/', '/ownership/', '/book/', '/out-of-hours/', '/pet-health-plans/'],
};
// Temporary: pages other tasks build (services/team: Task 9; fees, new-patients, contact, faq, referrers, prices,
// estimates, ownership, out-of-hours, pet-health-plans, policies: Tasks 11-15; book: Task 10).
const ALLOWED = new Set([...FIXED, ...MODULE_ROUTES[SITE_ID]]);

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

await step('mobile layout at 375px: compact header, full-width book button, footer not covered', async () => {
  await withPage({ viewport: { width: 375, height: 800 } }, async (page) => {
    await page.goto(`${BASE}/`);
    expect(!(await page.locator('header a[href="/book/"]').isVisible()), 'header book button should be hidden');
    expect(await page.locator('header [data-menu-toggle]').isVisible(), 'menu toggle missing');
    const call = page.locator('header a[aria-label^="Call"]:visible');
    expect((await call.count()) === 1, 'header call link should be visible and labelled');
    expect(!(await call.locator('span').isVisible()), 'number text should be hidden on mobile');
    const bar = await page.locator('.mobile-bar').boundingBox();
    const book = await page.locator('.mobile-bar a[href="/book/"]').boundingBox();
    expect(book.width > bar.width * 0.6, `book button ${book.width}px in bar ${bar.width}px`);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    const last = page.locator('footer a:visible').last();
    const box = await last.boundingBox();
    const hit = await page.evaluate(([x, y]) => document.elementFromPoint(x, y)?.closest('a')?.getAttribute('href'), [box.x + box.width / 2, box.y + box.height / 2]);
    expect(hit === (await last.getAttribute('href')), `last footer link covered (hit ${hit})`);
  });
});

await closeBrowser();
finish();
