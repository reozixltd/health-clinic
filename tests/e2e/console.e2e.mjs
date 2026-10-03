import { BASE, SITE_ID, closeBrowser, expect, finish, step, withPage } from './harness.mjs';

const vet = SITE_ID === 'hollybank';
const POSTCODE = { 'fernway-au': '3000', 'fernway-ca': 'K1A 0B1', hollybank: 'LS1 1AA' }[SITE_ID];
const MOBILE = { 'fernway-au': '0491 570 120', 'fernway-ca': '613-555-0123', hollybank: '07400 123456' }[SITE_ID];
const next = (page) => page.locator('[data-step]:not([hidden]) [data-next]').click();

/** Sends an appointment request through /book/ as Sam Lee. */
async function book(page, { service, marketing = false }) {
  await page.goto(`${BASE}/book/?service=${service}`);
  await next(page);
  await next(page);
  if (vet) {
    await page.fill('#petName', 'Biscuit');
    await page.selectOption('#species', 'dog');
  }
  await page.check('#patientType-new');
  await next(page);
  await page.locator('input[name=day]').first().check();
  await page.check('#windowId-morning');
  await next(page);
  await page.fill('#firstName', 'Sam');
  await page.fill('#lastName', 'Lee');
  await page.fill('#phone', MOBILE);
  await page.fill('#email', 'sam@example.com');
  await page.fill('#postcode', POSTCODE);
  await page.check('#terms');
  if (marketing) {
    await page.check('#marketingSms:visible');
    await page.check('#marketingEmail:visible');
  }
  await next(page);
  await page.waitForTimeout(3200);
  await page.getByRole('button', { name: 'Send appointment request' }).click();
  await page.getByRole('heading', { name: 'Appointment request sent' }).waitFor();
}

async function signIn(page, email = 'clinic@demo.reozix', password = 'demo1234') {
  await page.goto(`${BASE}/console/`);
  await page.fill('#console-email', email);
  await page.fill('#console-password', password);
  await page.getByRole('button', { name: 'Sign in' }).click();
}

async function openSam(page) {
  await page.locator('[data-inbox] button', { hasText: 'Sam Lee' }).click();
  await page.getByRole('button', { name: 'Confirm', exact: true }).click();
  await page.locator('[data-timeline] li').first().waitFor();
}

const msg = (page, id) => page.locator(`[data-timeline] [data-message=${id}]`);
const text = (page, id) => msg(page, id).innerText();

await step('sign in, open the appointment sent from /book/, confirm, see previews', async () => {
  await withPage({}, async (page) => {
    await book(page, { service: vet ? 'consultations' : 'physiotherapy' });
    await signIn(page);
    await openSam(page);
    for (const id of ['confirmation', 'reminder']) {
      expect(!(await msg(page, id).getAttribute('data-skipped')), `${id} should be scheduled`);
      expect((await text(page, id)).includes('Preview, not sent'), `${id} lacks the preview label`);
    }
    if (vet) {
      expect((await text(page, 'vaccination-recall')).includes('Not for this service'), 'vaccination recall should not apply to a consultation');
    } else {
      for (const id of ['review-request', 'recall']) {
        const t = await text(page, id);
        expect(t.includes('No marketing consent') && t.includes('Preview, not sent'), `${id}: ${t}`);
      }
    }
    expect((await page.locator('[data-timeline] li').count()) === (vet ? 4 : 4), 'unexpected timeline length');
  });
});

if (!vet) {
  await step('marketing consent schedules the review request and recall', async () => {
    await withPage({}, async (page) => {
      await book(page, { service: 'physiotherapy', marketing: true });
      await signIn(page);
      await openSam(page);
      for (const id of ['review-request', 'recall']) {
        expect(!(await msg(page, id).getAttribute('data-skipped')), `${id} should be scheduled with consent`);
      }
    });
  });
}

if (vet) {
  await step('vet console shows vaccination recall for a vaccinations booking', async () => {
    await withPage({}, async (page) => {
      await book(page, { service: 'vaccinations' });
      await signIn(page);
      await openSam(page);
      expect(!(await msg(page, 'vaccination-recall').getAttribute('data-skipped')), 'vaccination recall should be scheduled');
      expect((await text(page, 'vaccination-recall')).includes('Preview, not sent'), 'preview label missing');
    });
  });

  await step('stale price list shows a warning', async () => {
    await withPage({}, async (page) => {
      await signIn(page);
      await page.locator('[data-inbox] button').first().waitFor();
      expect(await page.locator('[data-stale]').isHidden(), 'fresh price list should not warn');
    });
    // Staleness is decided when the site is built (isStale has unit tests); flip the built flag to check the warning shows.
    await withPage({}, async (page) => {
      await page.route('**/console/', async (route) => {
        const res = await route.fetch();
        const body = await res.text();
        expect(body.includes('"pricesStale":false'), 'console data should carry pricesStale');
        await route.fulfill({ response: res, body: body.replace('"pricesStale":false', '"pricesStale":true') });
      });
      await signIn(page);
      await page.locator('[data-stale]').waitFor();
      expect((await page.locator('[data-stale]').innerText()).includes('Price list last reviewed over 180 days ago'), 'warning text missing');
    });
  });
}

await step('filter chips match preset', async () => {
  await withPage({}, async (page) => {
    await signIn(page);
    const chips = await page.locator('[data-chips] button').allInnerTexts();
    const want = vet ? ['All', 'Appointments', 'Estimates', 'Enquiries'] : ['All', 'Appointments', 'Referrals', 'Enquiries'];
    expect(JSON.stringify(chips) === JSON.stringify(want), `chips: ${chips}`);
    await page.getByRole('button', { name: vet ? 'Estimates' : 'Referrals' }).click();
    await page.locator('[data-inbox] button').first().waitFor();
    expect((await page.locator('[data-inbox] button').count()) === 2, 'expected two filtered rows');
  });
});

await step('seeds seven samples once, then Clear and Load samples work', async () => {
  await withPage({}, async (page) => {
    await signIn(page);
    await page.locator('[data-inbox] button').first().waitFor();
    expect((await page.locator('[data-inbox] button').count()) === 7, 'expected seven sample leads');
    await page.reload();
    await page.locator('[data-inbox] button').first().waitFor();
    expect((await page.locator('[data-inbox] button').count()) === 7, 'samples should seed once');
    page.once('dialog', (d) => d.accept());
    await page.getByRole('button', { name: 'Clear', exact: true }).click();
    await page.getByText('No requests here yet').waitFor();
    await page.getByRole('button', { name: 'Load samples' }).click();
    await page.locator('[data-inbox] button').first().waitFor();
    expect((await page.locator('[data-inbox] button').count()) === 7, 'Load samples should add seven');
  });
});

await step('CSV export downloads', async () => {
  await withPage({ acceptDownloads: true }, async (page) => {
    await signIn(page);
    await page.locator('[data-inbox] button').first().waitFor();
    const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Export CSV' }).click()]);
    expect(download.suggestedFilename().endsWith('.csv'), `filename: ${download.suggestedFilename()}`);
  });
});

await step('wrong password message', async () => {
  await withPage({}, async (page) => {
    await signIn(page, 'clinic@demo.reozix', 'nope');
    const error = await page.locator('[data-login-error]').innerText();
    expect(error.includes('not right'), `error: ${error}`);
    expect(await page.locator('[data-app]').isHidden(), 'app should stay hidden');
  });
});

await step('console is not indexed and has no mobile bar', async () => {
  await withPage({}, async (page) => {
    await page.goto(`${BASE}/console/`);
    expect((await page.locator('meta[name=robots]').getAttribute('content')).includes('noindex'), 'noindex missing');
    expect((await page.locator('[data-mobile-bar]').count()) === 0, 'mobile bar present');
  });
});

await closeBrowser();
finish();
