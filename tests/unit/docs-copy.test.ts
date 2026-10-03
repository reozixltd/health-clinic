import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const ALLOWED_CAPS = new Set(['ABN', 'BN', 'GST', 'VAT', 'AHPRA', 'RCVS', 'SMS', 'CASL', 'PECR', 'AODA', 'WCAG', 'GP']);
const files = ['README.md', ...readdirSync('docs').filter((f) => f.endsWith('.md') && f !== 'spec.md').map((f) => join('docs', f))];

describe('docs copy rules', () => {
  for (const file of files) {
    it(`${file} headings have no all-caps runs, arrows or middle dots`, () => {
      const headings = readFileSync(file, 'utf8').split('\n').filter((l) => /^#{1,6} /.test(l));
      for (const h of headings) {
        for (const run of h.match(/\b[A-Z]{2,}\b/g) ?? []) expect(ALLOWED_CAPS.has(run), `${file}: ${h}`).toBe(true);
        expect(h, file).not.toMatch(/→|·/);
      }
    });
  }
});
