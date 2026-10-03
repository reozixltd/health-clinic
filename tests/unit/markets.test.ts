import { describe, expect, it } from 'vitest';
import { getMarket, resolveMarketOverride } from '@/domain/markets';
import type { MarketId } from '@/domain/markets';

const ids: MarketId[] = ['AU', 'CA', 'UK'];

describe('markets', () => {
  it('AU bans testimonials and links reviews only', () => {
    const au = getMarket('AU');
    expect(au.testimonials).toBe('banned');
    expect(au.reviews).toBe('link-only');
    expect(au.consent.law).toBe('Spam Act 2003');
  });

  it('CA is marked unverified', () => {
    expect(getMarket('CA').verified).toBe(false);
    expect(getMarket('AU').verified).toBe(true);
    expect(getMarket('UK').verified).toBe(true);
  });

  it('every pack has consent wording, required pages and a legal id label', () => {
    for (const id of ids) {
      const m = getMarket(id);
      expect(m.consent.sms).toBe('Send me reminders and occasional offers by SMS. Reply STOP to opt out.');
      expect(m.consent.email).toBe('Send me occasional news and offers by email. Unsubscribe any time.');
      expect(m.requiredPages).toEqual(['/privacy/', '/accessibility/', '/terms/']);
      expect(m.legalIdLabel).toBeTruthy();
      expect(m.identifiers.label).toBe(m.legalIdLabel);
    }
    expect(getMarket('AU').legalIdLabel).toBe('ABN');
    expect(getMarket('CA').legalIdLabel).toBe('BN');
    expect(getMarket('UK').legalIdLabel).toBe('Company number');
  });

  it('pack values for locale, currency, tax and price display', () => {
    expect(getMarket('AU')).toMatchObject({ locale: 'en-AU', currency: 'AUD', taxNote: 'GST included where it applies', priceDisplay: 'from-allowed' });
    expect(getMarket('CA')).toMatchObject({ locale: 'en-CA', currency: 'CAD', taxNote: 'Taxes extra where they apply', testimonials: 'allowed', reviews: 'display' });
    expect(getMarket('UK')).toMatchObject({ locale: 'en-GB', currency: 'GBP', taxNote: 'Prices include VAT', priceDisplay: 'list-required' });
  });

  it('phone and postcode patterns', () => {
    const phoneOk = (id: MarketId, v: string) => getMarket(id).phone.pattern.test(v.replace(/[\s-]/g, ''));
    expect(phoneOk('AU', '03 5550 1200')).toBe(true);
    expect(phoneOk('AU', '0491 570 120')).toBe(true);
    expect(phoneOk('CA', '613-555-0123')).toBe(true);
    expect(phoneOk('UK', '0113 496 0123')).toBe(true);
    expect(phoneOk('AU', '1234')).toBe(false);
    expect(getMarket('CA').postcode.pattern.test('K1P 1J1')).toBe(true);
    expect(getMarket('CA').postcode.pattern.test('1234')).toBe(false);
    expect(getMarket('AU').postcode.pattern.test('3000')).toBe(true);
    expect(getMarket('UK').postcode.pattern.test('LS1 4AP')).toBe(true);
    expect(getMarket('CA').postcode.label).toBe('Postal code');
  });

  it('identifier patterns accept the demo identities', () => {
    expect(getMarket('AU').identifiers.pattern.test('00 000 000 000')).toBe(true);
    expect(getMarket('CA').identifiers.pattern.test('000000000')).toBe(true);
    expect(getMarket('UK').identifiers.pattern.test('00000000')).toBe(true);
  });

  it('phone href is a tel: link', () => {
    expect(getMarket('AU').phone.href('03 5550 1200')).toBe('tel:0355501200');
    expect(getMarket('CA').phone.href('613-555-0123')).toBe('tel:6135550123');
  });

  it('fundingLabels are keyed per market', () => {
    expect(getMarket('AU').fundingLabels).toEqual({
      fund: 'Private health fund rebate may apply',
      medicare: 'Medicare rebate with an eligible GP referral',
    });
    expect(getMarket('CA').fundingLabels).toEqual({
      extended: 'Extended health benefits may apply',
      direct: 'Direct billing where offered',
    });
    expect(getMarket('UK').fundingLabels).toEqual({});
  });

  it('resolveMarketOverride rejects unknown', () => {
    const base = { stored: null, configured: 'AU' as MarketId, allowed: ['AU', 'CA'] as MarketId[], demoMode: true };
    expect(resolveMarketOverride({ ...base, param: 'US' })).toBe('AU');
    expect(resolveMarketOverride({ ...base, param: 'CA' })).toBe('CA');
    expect(resolveMarketOverride({ ...base, param: null, stored: 'CA' })).toBe('CA');
    expect(resolveMarketOverride({ ...base, param: 'UK' })).toBe('AU');
    expect(resolveMarketOverride({ ...base, param: 'CA', demoMode: false })).toBe('AU');
  });
});
