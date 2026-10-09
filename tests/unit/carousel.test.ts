import { describe, expect, it } from 'vitest';
import { nextLeft } from '@/core/carousel';

describe('nextLeft', () => {
  // A 900px window over 3000px of cards, 300px per step.
  it('steps one card along', () => {
    expect(nextLeft(0, 900, 3000, 300, 1)).toBe(300);
    expect(nextLeft(600, 900, 3000, 300, -1)).toBe(300);
  });

  it('stops at the last full view, then wraps to the start', () => {
    expect(nextLeft(2000, 900, 3000, 300, 1)).toBe(2100);
    expect(nextLeft(2100, 900, 3000, 300, 1)).toBe(0);
  });

  it('wraps backwards from the start to the end', () => {
    expect(nextLeft(0, 900, 3000, 300, -1)).toBe(2100);
    expect(nextLeft(100, 900, 3000, 300, -1)).toBe(0);
  });

  it('stays put when everything already fits', () => {
    expect(nextLeft(0, 900, 600, 300, 1)).toBe(0);
    expect(nextLeft(0, 900, 600, 300, -1)).toBe(0);
  });
});
