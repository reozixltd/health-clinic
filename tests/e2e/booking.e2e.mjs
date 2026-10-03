import { BASE, SITE_ID, closeBrowser, expect, finish, skip, step, withPage } from './harness.mjs';

const vet = SITE_ID === 'hollybank';
const ca = SITE_ID === 'fernway-ca';
const au = SITE_ID === 'fernway-au';
const PHONE = { 'fernway-au': '03 5550 1200', 'fernway-ca': '613-555-0123', hollybank: '0113 496 0123' }[SITE_ID];
const POSTCODE = { 'fernway-au': '3000', 'fernway-ca': 'K1A 0B1', hollybank: 'LS1 1AA' }[SITE_ID];
const MOBILE = { 'fernway-au': '0491 570 120', 'fernway-ca': '613-555-0123', hollybank: '07400 123456' }[SITE_ID];
const SERVICE = vet ? 'consultations' : 'physiotherapy';
const TOO_FAST_MS = 3200; // forms hold a send made in the first 3 seconds

const next = (page) => page.locator('[data-step]:not([hidden]) [data-next]').click();
const heading = (page) => page.locator('[data-step]:not([hidden]) h2').innerText();

/** Walks steps 1 to 4 from /book/?service=..., leaving the browser on step 5. */
async function toYou(page, { service = SERVICE, patient = 'new' } = {}) {
  await page.goto(`${BASE}/book/?service=${service}`);
  await next(page); // service
  await next(page); // clinician
  if (vet) {
    await page.fill('#petName', 'Biscuit');
    await page.selectOption('#species', 'dog');
  }
  await page.check(`#patientType-${patient}`);
  await next(page);
  await page.locator('input[name=day]').first().check();
  await page.check('#windowId-morning');
  await next(page);
}

async function fillYou(page) {
  await page.fill('#firstName', 'Sam');
  await page.fill('#lastName', 'Lee');
  await page.fill('#phone', MOBILE);
  await page.fill('#email', 'sam@example.com');
  await page.fill('#postcode', POSTCODE);
}

async function toCheck(page, opts) {
  await toYou(page, opts);
  await fillYou(page);
  await next(page);
  await page.check('#terms');
}

const leads = (page) => page.evaluate((id) => JSON.parse(localStorage.getItem(`health:v1:${id}:leads`) ?? '[]'), SITE_ID);

if (!ca) {
  await step('book from a service page', async () => {
    await withPage({}, async (page) => {
      const hasService = (await page.request.get(`${BASE}/services/${SERVICE}/`)).ok();
      if (hasService) {
        await page.goto(`${BASE}/services/${SERVICE}/`);
        await page.getByRole('link', { name: /^Book/ }).first().click();
      } else await page.goto(`${BASE}/book/?service=${SERVICE}`); // service pages are another task's
      expect(await page.locator(`#service-${SERVICE}`).isChecked(), 'service not preselected');
      await next(page);
      await next(page);
      if (vet) await page.fill('#petName', 'Biscuit');
      await page.check('#patientType-new');
      await next(page);
      const first = page.locator('input[name=day]').first();
      const label = await first.locator('xpath=..').innerText();
      await first.check();
      await page.check('#windowId-morning');
      await next(page);
      await fillYou(page);
      await next(page);
      const card = await page.locator('[data-card]').innerText();
      expect(card.includes(label.trim()) && card.includes('Morning') && card.includes('First available'), `card: ${card}`);
      await page.check('#terms');
      await page.waitForTimeout(TOO_FAST_MS);
      await page.getByRole('button', { name: 'Send appointment request' }).click();
      await page.getByRole('heading', { name: 'Appointment request sent' }).waitFor();
      const body = await page.locator('#booking-sent').innerText();
      expect(/within 1 business day/.test(body), `sent: ${body}`);
      expect(body.includes(vet ? 'Hollybank' : 'Fernway Health'), `preview missing clinic name: ${body}`);
      expect((await leads(page)).length === 1, 'expected one saved lead');
    });
  });
} else skip('book from a service page (CA hands off to the practice system)');

if (!vet) {
  await step('new patient psychology offers first available and states who is not taking new patients', async () => {
    await withPage({}, async (page) => {
      await page.goto(`${BASE}/book/?service=psychology&patient=new&step=clinician`);
      const labels = await page.locator('[data-step="clinician"] .choice:visible').allInnerTexts();
      expect(labels.some((t) => t.includes('First available')), 'first available missing');
      expect(!labels.some((t) => t.includes('Lucas Brandt')), `clinician not taking new patients is offered: ${labels}`);
      const note = await page.locator('[data-clinician-note]').innerText();
      expect(/not taking new patients/.test(note) && note.includes('Lucas Brandt'), `note: ${note}`);
    });
  });
} else skip('psychology clinician note (Fernway only)');

await step('back keeps values and refresh returns to the right step', async () => {
  await withPage({}, async (page) => {
    await toYou(page);
    await page.getByRole('button', { name: 'Back' }).click();
    expect((await heading(page)) === 'Pick a day and time', 'back should reach step 4');
    expect(await page.locator('#windowId-morning').isChecked(), 'time not kept');
    await page.getByRole('button', { name: 'Back' }).click();
    expect(await page.locator('#patientType-new').isChecked(), 'patient type not kept');
    await page.goBack();
    expect((await heading(page)) === 'Pick a day and time', 'browser back should return to step 4');
    await page.reload();
    expect((await heading(page)) === 'Pick a day and time', `refresh landed on ${await heading(page)}`);
    expect(await page.locator('#windowId-morning').isChecked() && (await page.locator('input[name=day]:checked').count()) === 1, 'choices lost on refresh');
    expect(!/firstName|phone|email/.test(page.url()), 'contact details leaked into the URL');
  });
});

await step('step 5 errors are summarised and focused', async () => {
  await withPage({}, async (page) => {
    await toYou(page);
    await next(page);
    const alert = page.locator('[role=alert]:focus');
    await alert.waitFor();
    expect((await alert.locator('li').count()) === 5, `expected 5 errors, got ${await alert.innerText()}`);
    if (vet) {
      await page.evaluate(() => { const el = document.querySelector('#petName'); el.value = ''; el.dispatchEvent(new Event('input', { bubbles: true })); });
      await next(page);
      expect((await page.locator('[role=alert]:focus li').count()) === 6, 'vet should list 6 errors with a missing pet name');
    }
  });
});

await step('marketing boxes start unticked; consent text matches the pack', async () => {
  await withPage({}, async (page) => {
    await toYou(page);
    await fillYou(page);
    await next(page);
    for (const id of ['terms', 'marketingSms', 'marketingEmail']) expect(!(await page.locator(`#${id}`).isChecked()), `${id} should start unticked`);
    expect(/Reply STOP to opt out/.test(await page.locator('[data-step="check"]').innerText()), 'SMS consent text missing');
  });
});

await step('no textarea in public request forms', async () => {
  await withPage({}, async (page) => {
    await page.goto(`${BASE}/book/`);
    expect((await page.locator('textarea').count()) === 0, 'found a textarea');
  });
});

await step('storage failure shows phone fallback with fields kept', async () => {
  await withPage({}, async (page) => {
    await toCheck(page);
    await page.evaluate(() => { Storage.prototype.setItem = () => { throw new Error('full'); }; });
    await page.waitForTimeout(TOO_FAST_MS);
    await page.getByRole('button', { name: 'Send appointment request' }).click();
    const status = page.locator('[data-form-status]');
    await page.waitForFunction(() => document.querySelector('[data-form-status]')?.textContent);
    expect((await status.innerText()).includes(PHONE), `status: ${await status.innerText()}`);
    expect(await page.locator('#terms').isChecked(), 'terms lost');
    await page.getByRole('button', { name: 'Back' }).click();
    expect((await page.inputValue('#firstName')) === 'Sam', 'fields were not kept');
  });
});

await step('double click sends one request', async () => {
  await withPage({}, async (page) => {
    await toCheck(page);
    await page.waitForTimeout(TOO_FAST_MS);
    await page.getByRole('button', { name: 'Send appointment request' }).dblclick();
    await page.getByRole('heading', { name: 'Appointment request sent' }).waitFor();
    expect((await leads(page)).length === 1, `expected 1 lead, got ${(await leads(page)).length}`);
  });
});

if (ca) {
  await step('CA hand-off links to the practice system and the request flow continues', async () => {
    await withPage({}, async (page) => {
      await page.goto(`${BASE}/book/`);
      await page.check('#service-physiotherapy');
      const href = await page.locator('[data-handoff-link]').getAttribute('href');
      expect(href === 'https://example.cliniko.com/bookings?service=physiotherapy', `href: ${href}`);
      await page.getByRole('button', { name: "Can't find a time? Send a request" }).click();
      expect((await heading(page)) === 'Choose a clinician', `landed on ${await heading(page)}`);
    });
  });
} else skip('CA hand-off (CA build only)');

if (vet) {
  await step('vet booking asks pet name and species, card shows Pet line', async () => {
    await withPage({}, async (page) => {
      await page.goto(`${BASE}/book/?service=consultations&step=patient`);
      await page.fill('#petName', 'Biscuit');
      await page.selectOption('#species', 'dog');
      expect((await page.locator('[data-line="Pet"] dd').innerText()) === 'Biscuit, dog', 'Pet line not filled');
      expect((await page.locator('[data-line="Vet"]').count()) === 1, 'Vet line missing');
      expect(/pet=Biscuit/.test(page.url()), 'pet name should be in the URL (R17)');
      await page.check('#patientType-returning');
      await next(page);
      expect((await heading(page)) === 'Pick a day and time', 'should reach step 4');
    });
  });
} else skip('vet pet line (Hollybank only)');

await closeBrowser();
finish();
