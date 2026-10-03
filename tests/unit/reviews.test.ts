import { describe, expect, it } from 'vitest';
import { getMarket } from '@/domain/markets';
import { reviewMode } from '@/modules/reviews/reviews';

describe('reviewMode', () => {
  it('AU is link-only, CA and UK display', () => {
    expect(reviewMode(getMarket('AU'))).toBe('link-only');
    expect(reviewMode(getMarket('CA'))).toBe('display');
    expect(reviewMode(getMarket('UK'))).toBe('display');
  });
});
