import { describe, expect, it } from 'vitest';
import { getMarket } from '@/domain/markets';
import { hasReviewContent, reviewMode } from '@/modules/reviews/reviews';

describe('reviewMode', () => {
  it('AU is link-only, CA and UK display', () => {
    expect(reviewMode(getMarket('AU'))).toBe('link-only');
    expect(reviewMode(getMarket('CA'))).toBe('display');
    expect(reviewMode(getMarket('UK'))).toBe('display');
  });
});

describe('hasReviewContent', () => {
  it('link-only needs a profile url, display needs reviews', () => {
    expect(hasReviewContent('link-only', 3, undefined)).toBe(false);
    expect(hasReviewContent('link-only', 0, 'https://g.page/x')).toBe(true);
    expect(hasReviewContent('display', 0, 'https://g.page/x')).toBe(false);
    expect(hasReviewContent('display', 2)).toBe(true);
  });
});
