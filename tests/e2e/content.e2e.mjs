import { BASE, SITE_ID, closeBrowser, expect, finish, skip, step, withPage } from './harness.mjs';

const fernway = SITE_ID.startsWith('fernway');
const SERVICE = { 'fernway-au': 'physiotherapy', 'fernway-ca': 'physiotherapy', hollybank: 'vaccinations' }[SITE_ID];
const PROVIDER = { 'fernway-au': 'priya-nair', 'fernway-ca': 'priya-nair', hollybank: 'amelia-thornton' }[SITE_ID];

await step('service page shows clinicians who offer it and a Book this link carrying ?service=', async () => {
  await withPage({}, async (page) => {
    await page.goto(`${BASE}/services/${SERVICE}/`);
    expect((await page.locator('h1').count()) === 1, 'one h1');
    expect((await page.locator(`main a[href="/team/${PROVIDER}/"]`).count()) >= 1, 'clinician link missing');
    const href = await page.locator('main a[href^="/book/"]').first().getAttribute('href');
    expect(href === `/book/?service=${SERVICE}`, `book href: ${href}`);
    const ld = await page.locator('script[type="application/ld+json"]').allInnerTexts();
    expect(ld.some((t) => t.includes('"Service"')), 'Service JSON-LD missing');
    await page.goto(`${BASE}/services/`);
    expect((await page.locator(`main a[href="/services/${SERVICE}/"]`).count()) >= 1, 'index link missing');
  });
});

await step('profile shows registration body and number and Book with <first name>', async () => {
  await withPage({}, async (page) => {
    await page.goto(`${BASE}/team/${PROVIDER}/`);
    const main = await page.locator('main').innerText();
    const expected = { 'fernway-au': ['AHPRA', 'PHY0000000001'], 'fernway-ca': ['College of Physiotherapists of Ontario', '000001'], hollybank: ['RCVS', '0000001'] }[SITE_ID];
    for (const t of expected) expect(main.includes(t), `profile missing ${t}`);
    const first = fernway ? 'Priya' : 'Amelia';
    const link = page.locator(`main a[href*="provider=${PROVIDER}"]`).first();
    expect((await link.innerText()).includes(`Book with ${first}`), `link text: ${await link.innerText()}`);
    const ld = await page.locator('script[type="application/ld+json"]').allInnerTexts();
    expect(ld.some((t) => t.includes('"Person"')), 'Person JSON-LD missing');
  });
});

if (SITE_ID === 'fernway-au') {
  await step('CA profile shows the Ontario college', async () => {
    await withPage({}, async (page) => {
      await page.goto(`${BASE}/team/priya-nair/?market=CA`);
      const text = await page.locator('main').innerText();
      expect(text.includes('College of Physiotherapists of Ontario'), `text: ${text}`);
      expect(!text.includes('AHPRA'), 'AU body should be hidden');
    });
  });
} else skip('CA profile (AU build only)');

if (fernway) {
  await step('not accepting new patients is stated', async () => {
    await withPage({}, async (page) => {
      await page.goto(`${BASE}/team/lucas-brandt/`);
      expect(/not accepting new patients/i.test(await page.locator('main').innerText()), 'statement missing');
    });
  });
} else skip('not accepting new patients (Fernway only)');

await closeBrowser();
finish();
