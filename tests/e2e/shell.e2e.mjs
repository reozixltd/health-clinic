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

await step('nav only links generated routes', async () => {
  await withPage({}, async (page) => {
    await page.goto(`${BASE}/`);
    const hrefs = await page.locator('a[href]').evaluateAll((els) => els.map((e) => e.getAttribute('href')));
    const banned = fernway ? '/prices/' : '/fees/';
    expect(!hrefs.includes(banned), `found link to ${banned}`);
  });
});

await closeBrowser();
finish();
