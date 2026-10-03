import { describe, expect, it } from 'vitest';
// @ts-ignore plain .mjs tool without types
import { ownOrigin, thirdParty } from '../../tools/third-party.mjs';

const own = 'https://health.reozix.com';

describe('thirdParty', () => {
  it('flags a foreign script and a foreign preconnect', () => {
    const html = '<script src="https://x.example/a.js"></script><link rel="preconnect" href="https://y.example">';
    expect(thirdParty(html, own)).toEqual(['https://x.example (script)', 'https://y.example (preconnect)']);
  });
  it('flags a protocol-relative foreign script', () => {
    expect(thirdParty('<script src="//cdn.example/a.js"></script>', own)).toHaveLength(1);
  });
  it('allows own-origin, relative and protocol-relative own-origin sources', () => {
    const html = [
      '<script src="https://health.reozix.com/a.js"></script>',
      '<script src="/_astro/b.js"></script>',
      '<script src="//health.reozix.com/c.js"></script>',
      '<link rel="preconnect" href="https://health.reozix.com">',
      '<link rel="stylesheet" href="https://fonts.example/x.css">',
      '<script>inline()</script>',
    ].join('');
    expect(thirdParty(html, own)).toEqual([]);
  });
});

describe('ownOrigin', () => {
  it('reads the origin from the canonical link, so another clinic url is not flagged', () => {
    const html = '<link rel="canonical" href="https://clinic.example/">';
    expect(ownOrigin(html)).toBe('https://clinic.example');
    expect(thirdParty('<script src="https://clinic.example/a.js"></script>', ownOrigin(html)!)).toEqual([]);
    expect(thirdParty('<script src="https://health.reozix.com/a.js"></script>', ownOrigin(html)!)).toHaveLength(1);
  });
  it('is null without a canonical link', () => {
    expect(ownOrigin('<html></html>')).toBeNull();
  });
});
