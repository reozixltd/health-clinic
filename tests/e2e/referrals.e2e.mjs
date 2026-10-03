import { BASE, SITE_ID, closeBrowser, expect, finish, step, withPage } from './harness.mjs';

if (SITE_ID === 'hollybank') {
  await step('/referrers/ absent on Hollybank', async () => {
    const res = await fetch(`${BASE}/referrers/`);
    expect(res.status === 404, `returned ${res.status}`);
  });
} else {
  const phone = SITE_ID === 'fernway-ca' ? '613-555-0123' : '0491 570 120';
  await step('referrer form submits and states clinical details go by secure channel', async () => {
    await withPage({}, async (page) => {
      await page.goto(`${BASE}/referrers/`);
      expect(/secure/.test(await page.locator('main').innerText()), 'secure channel note missing');
      expect((await page.locator('textarea').count()) === 0, 'no textarea allowed');
      await page.fill('#referrerName', 'Dr Alex Moss');
      await page.fill('#practice', 'Moss Family Clinic');
      await page.fill('#referrerEmail', 'alex@example.com');
      await page.fill('#patientFirstName', 'Jo');
      await page.fill('#patientPhone', phone);
      await page.selectOption('#service', 'physiotherapy');
      await page.selectOption('#urgency', 'Soon');
      await page.waitForTimeout(3200);
      await page.getByRole('button', { name: 'Send referral' }).click();
      await page.getByRole('heading', { name: 'Referral sent' }).waitFor();
      const leads = await page.evaluate(() => {
        const key = Object.keys(localStorage).find((k) => k.endsWith(':leads'));
        return key ? JSON.parse(localStorage.getItem(key)) : [];
      });
      expect(leads.length === 1 && leads[0].kind === 'referral', `leads: ${JSON.stringify(leads)}`);
      expect(Object.keys(leads[0].payload).join() === 'practice,patientFirstName,patientPhone,service,urgency', 'payload keys');
    });
  });

  await step('empty submit shows errors; phone check follows the market switch', async () => {
    await withPage({}, async (page) => {
      await page.goto(`${BASE}/referrers/`);
      await page.getByRole('button', { name: 'Send referral' }).click();
      expect((await page.locator('[data-error-list] a').count()) >= 6, 'expected several errors');
      const other = SITE_ID === 'fernway-ca' ? 'AU' : 'CA';
      await page.goto(`${BASE}/referrers/?market=${other}`);
      await page.fill('#patientPhone', other === 'CA' ? '613-555-0123' : '0491 570 120');
      await page.getByRole('button', { name: 'Send referral' }).click();
      expect((await page.locator('#patientPhone[aria-invalid="true"]').count()) === 0, 'phone valid in switched market');
    });
  });
}

await closeBrowser();
finish();
