import { describe, expect, it } from 'vitest';
import { getMarket } from '@/domain/markets';
import { fromPriceLabel } from '@/modules/services/from-price';
import { registrationFor } from '@/modules/providers/registration';

describe('fromPriceLabel', () => {
  it('formats per market and hides when absent', () => {
    expect(fromPriceLabel({ fromPrice: 95 }, getMarket('AU'))).toBe('From $95');
    expect(fromPriceLabel({ fromPrice: 95 }, getMarket('CA'))).toBe('From $95');
    expect(fromPriceLabel({}, getMarket('AU'))).toBeNull();
  });
  it('is hidden where a full price list is required', () => {
    expect(fromPriceLabel({ fromPrice: 48 }, getMarket('UK'))).toBeNull();
  });
});

describe('registrationFor', () => {
  const physio = {
    registration: { body: 'AHPRA', number: 'PHY0000000001', byMarket: { CA: { body: 'College of Physiotherapists of Ontario', number: '000001' } } },
  };
  it('uses the CA body in CA', () => {
    expect(registrationFor(physio, 'AU')).toEqual({ body: 'AHPRA', number: 'PHY0000000001' });
    expect(registrationFor(physio, 'CA').body).toBe('College of Physiotherapists of Ontario');
  });
  it('falls back to the main registration when a market has none', () => {
    expect(registrationFor({ registration: { body: 'RCVS', number: '1' } }, 'CA')).toEqual({ body: 'RCVS', number: '1' });
  });
});

import { indexPaths } from '@/domain/modules';

describe('indexPaths', () => {
  it('emits the index only when the module is on', () => {
    expect(indexPaths('services', { modules: ['services'] })).toEqual([{ params: { slug: undefined } }]);
    expect(indexPaths('services', { modules: ['providers'] })).toEqual([]);
    expect(indexPaths('providers', { modules: [] })).toEqual([]);
  });
});
