import { BASE, SITE_ID, closeBrowser, expect, finish, step, withPage } from './harness.mjs';

const fernway = SITE_ID !== 'hollybank';

async function routes() {
  const xml = await (await fetch(`${BASE}/sitemap-0.xml`)).text();
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname);
}

await step('every page: one h1, legal id, no horizontal scroll at 375 and 1280', async () => {
  const paths = await routes();
  expect(paths.length > 8, `sitemap routes: ${paths.length}`);
  for (const width of [375, 1280]) {
    await withPage({ viewport: { width, height: 800 } }, async (page) => {
      for (const path of paths) {
        await page.goto(`${BASE}${path}`);
        const h1 = await page.locator('h1').count();
        expect(h1 === 1, `${path} @${width}: ${h1} h1`);
        const footer = await page.locator('footer').innerText();
        expect(/\d/.test(footer) && /ABN|BN|Company number/.test(footer), `${path}: legal id missing`);
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        expect(overflow <= 0, `${path} @${width}: horizontal scroll ${overflow}px`);
      }
    });
  }
});

await step('faq has FAQPage JSON-LD', async () => {
  await withPage({}, async (page) => {
    await page.goto(`${BASE}/faq/`);
    const blocks = await page.locator('script[type="application/ld+json"]').allInnerTexts();
    const faq = blocks.map((b) => JSON.parse(b)).flatMap((j) => (Array.isArray(j) ? j : j['@graph'] ?? [j])).find((j) => j['@type'] === 'FAQPage');
    expect(faq && faq.mainEntity.length === 10, 'FAQPage with ten questions expected');
    expect(!/\]\(/.test(JSON.stringify(faq)), 'markdown links should be stripped from schema text');
  });
});

await step('privacy names the market law', async () => {
  await withPage({}, async (page) => {
    await page.goto(`${BASE}/privacy/`);
    const text = await page.locator('main').innerText();
    const wanted = SITE_ID === 'hollybank' ? ['PECR'] : SITE_ID === 'fernway-ca' ? ['CASL'] : ['Spam Act 2003'];
    for (const w of wanted) expect(text.includes(w), `${w} missing`);
    if (fernway) {
      await page.goto(`${BASE}/privacy/?market=${SITE_ID === 'fernway-ca' ? 'AU' : 'CA'}`);
      const other = await page.locator('main').innerText();
      const want = SITE_ID === 'fernway-ca' ? 'Spam Act 2003' : 'CASL';
      expect(other.includes(want), `${want} should show after switching market`);
    }
  });
});

await step('contact shows after-hours route and building access notes', async () => {
  await withPage({}, async (page) => {
    await page.goto(`${BASE}/contact/`);
    for (const name of ['Getting in', 'After hours', 'Opening hours']) {
      expect(await page.getByRole('heading', { name, level: 2 }).first().isVisible(), `${name} heading missing`);
    }
    const text = await page.locator('main').innerText();
    expect(/step-free/.test(text), 'building access note missing');
  });
});

await step('new patients page has the numbered first visit steps', async () => {
  await withPage({}, async (page) => {
    await page.goto(`${BASE}/new-patients/`);
    expect((await page.locator('main ol li').count()) === 4, 'four steps expected');
  });
});

await step('404 page is served and has one h1', async () => {
  await withPage({}, async (page) => {
    const res = await page.goto(`${BASE}/no-such-page/`);
    expect(res.status() === 404, `status ${res.status()}`);
    expect((await page.locator('h1').count()) === 1, 'one h1');
  });
});

if (fernway) {
  await step('fees switch with market', async () => {
    await withPage({}, async (page) => {
      const home = SITE_ID === 'fernway-ca' ? 'CA' : 'AU';
      const other = home === 'CA' ? 'AU' : 'CA';
      await page.goto(`${BASE}/fees/`);
      const row = (label, section) => page.locator('tr:visible', { hasText: label }).first().innerText();
      const text = await page.locator('main').innerText();
      expect(text.includes(home === 'AU' ? 'Private health fund rebate may apply' : 'Extended health benefits may apply'), 'home market funding note');
      expect(/Dental check-up|dental/i.test(text), 'service title missing');
      const homeFee = await row('Check-up and plan');
      await page.goto(`${BASE}/fees/?market=${other}`);
      const otherFee = await row('Check-up and plan');
      expect(/\$90\b/.test(home === 'AU' ? homeFee : otherFee) && /\$110\b/.test(home === 'CA' ? homeFee : otherFee), `fees: ${homeFee} / ${otherFee}`);
      const text2 = await page.locator('main').innerText();
      expect(text2.includes(other === 'AU' ? 'Private health fund rebate may apply' : 'Extended health benefits may apply'), 'switched funding note');
    });
  });
} else {
  await step('/fees/ is 404 on Hollybank', async () => {
    expect((await fetch(`${BASE}/fees/`)).status === 404, '/fees/ should be 404');
  });
  await step('pet health plans page is served from preset extra pages', async () => {
    await withPage({}, async (page) => {
      await page.goto(`${BASE}/pet-health-plans/`);
      expect((await page.locator('h1').innerText()) === 'Pet health plans', 'h1');
    });
  });
}

await closeBrowser();
finish();
