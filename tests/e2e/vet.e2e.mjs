import { BASE, SITE_ID, closeBrowser, expect, finish, step, withPage } from './harness.mjs';

const ROUTES = ['/prices/', '/estimates/', '/ownership/', '/out-of-hours/'];

if (SITE_ID !== 'hollybank') {
  await step('Fernway has none of these routes', async () => {
    for (const path of ROUTES) {
      const res = await fetch(`${BASE}${path}`);
      expect(res.status === 404, `${path} returned ${res.status}`);
    }
  });
} else {
  await step('prices page shows groups, VAT note and last reviewed date', async () => {
    await withPage({}, async (page) => {
      await page.goto(`${BASE}/prices/`);
      expect((await page.locator('h1').count()) === 1, 'one h1');
      for (const group of ['Consultations', 'Vaccinations', 'Dental', 'Neutering', 'Prescriptions']) {
        expect(await page.getByRole('heading', { name: group, level: 2 }).isVisible(), `group ${group} missing`);
      }
      const text = await page.locator('main').innerText();
      expect(/Prices include VAT/.test(text), 'VAT note missing');
      expect(/Last reviewed Thu 3 Sept 2026/.test(text), `reviewed date missing: ${text.slice(0, 200)}`);
      expect(/£42 for 15 minutes/.test(text), 'unit text missing');
      expect(/Re-check within 14 days\s+Included/.test(text), 'zero amount should read Included');
    });
  });

  await step('prescription fees £21 and £12.50 shown', async () => {
    await withPage({}, async (page) => {
      await page.goto(`${BASE}/prices/`);
      const row = (label) => page.locator('tr', { hasText: label }).innerText();
      expect(/£21\b(?!\.)/.test(await row('first item')), 'first item fee');
      expect(/£12\.50/.test(await row('each additional item')), 'additional item fee');
      expect(!/£13\b/.test(await page.locator('main').innerText()), 'no rounded £13');
    });
  });

  await step('estimate request submits an estimate lead and has no textarea', async () => {
    await withPage({}, async (page) => {
      await page.goto(`${BASE}/estimates/`);
      expect((await page.locator('textarea').count()) === 0, 'estimate form must not have a textarea');
      await page.fill('#petName', 'Biscuit');
      await page.selectOption('#species', 'Dog');
      await page.selectOption('#reason', 'Dental treatment');
      await page.fill('#firstName', 'Sam');
      await page.fill('#lastName', 'Lee');
      await page.fill('#email', 'sam@example.com');
      await page.fill('#phone', '0113 496 0123');
      await page.check('#terms');
      await page.waitForTimeout(3200); // past the too-fast submit hold
      await page.getByRole('button', { name: 'Request an estimate' }).click();
      await page.getByRole('heading', { name: 'Estimate request sent' }).waitFor();
      const leads = await page.evaluate(() => {
        const key = Object.keys(localStorage).find((k) => k.endsWith(':leads'));
        return key ? JSON.parse(localStorage.getItem(key)) : [];
      });
      expect(leads.length === 1 && leads[0].kind === 'estimate', `leads: ${JSON.stringify(leads)}`);
      expect(JSON.stringify(leads[0].payload) === JSON.stringify({ petName: 'Biscuit', species: 'Dog', reason: 'Dental treatment' }), 'payload should be pet name, species, reason only');
    });
  });

  await step('estimate form shows errors for an empty submit', async () => {
    await withPage({}, async (page) => {
      await page.goto(`${BASE}/estimates/`);
      await page.getByRole('button', { name: 'Request an estimate' }).click();
      expect(await page.locator('[data-error-summary]').isVisible(), 'error summary should show');
      expect((await page.locator('[data-error-list] a').count()) >= 5, 'expected several errors');
    });
  });

  await step('ownership page states independent ownership and owner name', async () => {
    await withPage({}, async (page) => {
      await page.goto(`${BASE}/ownership/`);
      const text = await page.locator('main').innerText();
      expect(/independently owned/.test(text), 'independent statement missing');
      expect(/Hollybank Veterinary Practice Ltd/.test(text), 'owner name missing');
    });
  });

  await step('out-of-hours page shows the emergency number as tel link', async () => {
    await withPage({}, async (page) => {
      await page.goto(`${BASE}/out-of-hours/`);
      const link = page.locator('main a[href="tel:01134960199"]');
      expect(await link.isVisible(), 'tel link missing');
      expect((await link.innerText()).trim() === '0113 496 0199', 'number text');
    });
  });
}

await closeBrowser();
finish();
