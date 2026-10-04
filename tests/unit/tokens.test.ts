import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync('src/styles/tokens.css', 'utf8');

/** Value of a custom property declared in the `:root` block. */
function token(name: string): string {
  const m = css.match(new RegExp(`--${name}:\\s*([^;]+);`));
  if (!m) throw new Error(`--${name} is missing`);
  return m[1]!.trim();
}

describe('Stitch type scale', () => {
  it('keeps the body size and leads at Stitch values', () => {
    expect(token('body-size')).toBe('106.25%');
    expect(token('leading-body')).toBe('1.55');
  });

  it('uses the Stitch display and headline sizes', () => {
    expect(token('text-14')).toBe('0.875rem');
    expect(token('text-16')).toBe('1rem');
    expect(token('text-18')).toBe('1.125rem');
    expect(token('text-20')).toBe('1.25rem');
    expect(token('text-22')).toBe('1.5rem');
    expect(token('text-28')).toBe('1.75rem');
    expect(token('text-36')).toBe('2.25rem');
  });

  it('runs the hero from 36px on mobile to 56px on desktop', () => {
    expect(token('text-hero')).toBe('clamp(2.25rem, 4.5vw, 3.5rem)');
  });

  it('uses Stitch letter spacing for the hero, headings and labels', () => {
    expect(token('track-hero')).toBe('-0.03em');
    expect(token('track-heading')).toBe('-0.02em');
    expect(token('track-label')).toBe('0.04em');
  });
});

describe('Stitch shapes and depth', () => {
  it('uses the Stitch radius set', () => {
    expect(token('radius-control')).toBe('8px');
    expect(token('radius-card')).toBe('16px');
    expect(token('radius-panel')).toBe('24px');
    expect(token('radius-pill')).toBe('9999px');
  });

  it('keeps the 44px tap target floor and gives fields 48px', () => {
    expect(token('target')).toBe('44px');
    expect(token('target-field')).toBe('48px');
  });

  it('keeps the card fill fade at 160ms', () => {
    expect(token('dur-fill')).toBe('160ms');
  });

  it('defines the three Stitch elevation levels and the hairline', () => {
    expect(token('shadow-1')).toBe('0 4px 20px -2px rgba(18,38,58,.04)');
    expect(token('shadow-2')).toBe('0 12px 32px -4px rgba(18,38,58,.08)');
    expect(token('shadow-3')).toBe('0 24px 48px -8px rgba(18,38,58,.14)');
    expect(token('hairline')).toBe('1px solid rgba(18,38,58,.08)');
  });
});

describe('spacing', () => {
  it('keeps the existing scale and adds Stitch space-xl', () => {
    for (const [name, value] of [['space-1', '4px'], ['space-2', '8px'], ['space-3', '12px'], ['space-4', '16px'], ['space-5', '24px'], ['space-6', '32px'], ['space-7', '48px'], ['space-8', '64px'], ['space-xl', '40px']] as const) {
      expect(token(name), name).toBe(value);
    }
  });
});
