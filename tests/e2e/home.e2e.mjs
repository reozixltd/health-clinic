import { BASE, SITE_ID, closeBrowser, expect, finish, step, withPage } from './harness.mjs';

const vet = SITE_ID === 'hollybank';

await step('home order and primary actions', async () => {
  await withPage({}, async (page) => {
    await page.goto(`${BASE}/`);
    expect((await page.locator('h1').count()) === 1, 'one h1');
    expect((await page.locator('.hero a[href^="/book/"]:visible').count()) >= 1, 'Book link in hero');
    expect((await page.locator('.hero a[href^="tel:"]:visible').count()) >= 1, 'tel link in hero');
    expect(await page.locator('.emergency-note:visible').first().isVisible(), 'emergency note visible');
    expect((await page.locator('#first-visit ol > li').count()) === 4, 'four first visit steps');
    expect((await page.locator('main ol').count()) === 1, 'numbered list only in first visit');
    const ids = await page.locator('main > section[id], main > div > section[id]').evaluateAll((els) => els.map((e) => e.id));
    const order = ['services', 'team', 'first-visit', 'reviews', 'location', 'faq'].filter((id) => ids.includes(id));
    expect(order.join() === ids.filter((id) => order.includes(id)).join(), `section order: ${ids}`);
    expect((await page.locator('#faq dt').count()) >= 5, 'five FAQs');
  });
});

if (!vet) {
  await step('AU home shows no review quotes', async () => {
    await withPage({}, async (page) => {
      await page.goto(`${BASE}/`);
      if (SITE_ID === 'fernway-au') {
        expect((await page.locator('[data-review]:visible').count()) === 0, 'visible review quotes on AU');
        expect((await page.getByRole('link', { name: /Read our reviews/ }).count()) >= 1, 'reviews link missing');
        await page.goto(`${BASE}/?market=CA`);
      }
      const reviews = page.locator('[data-review]:visible');
      expect((await reviews.count()) >= 2, 'CA reviews should display');
      expect((await page.locator('[data-review]:visible time[datetime]').count()) === (await reviews.count()), 'each review dated');
    });
  });
}

await step(vet ? 'vet home shows price-list teaser with last reviewed date and no fees teaser' : 'allied home shows fees teaser and no price-list teaser', async () => {
  await withPage({}, async (page) => {
    await page.goto(`${BASE}/`);
    const text = await page.locator('main').innerText();
    if (vet) {
      expect(/Last reviewed Thu 3 Sept 2026/.test(text), 'last reviewed missing');
      expect((await page.locator('main a[href="/prices/"]').count()) >= 1, 'prices link');
      expect((await page.locator('main a[href="/fees/"]').count()) === 0, 'fees teaser on vet');
    } else {
      expect((await page.locator('main a[href="/fees/"]').count()) >= 1, 'fees link');
      expect(!/Last reviewed/.test(text), 'price-list teaser on allied');
    }
  });
});

await step('services band has from prices only where allowed', async () => {
  await withPage({}, async (page) => {
    await page.goto(`${BASE}/`);
    const text = await page.locator('#services').innerText();
    expect((await page.locator('#services li').count()) >= 3, 'service rows');
    expect(/From [$£]\d+/.test(text) === !vet, `from prices: ${text.slice(0, 300)}`);
  });
});

await closeBrowser();
finish();
