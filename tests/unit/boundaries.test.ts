import { describe, expect, it } from 'vitest';
import { findViolations } from '../../tools/boundaries.mjs';

const RULES = [
  'core-imports-outside',
  'domain-imports-module',
  'market-read-outside-presets',
  'module-imports-module',
  'raw-colour-outside-tokens',
  'section-imports-page',
  'storage-outside-core',
];

describe('boundary checker', () => {
  it('ok fixture has no violations', () => {
    expect(findViolations('tests/fixtures/boundaries/ok')).toEqual([]);
  });

  it('flags each rule once', () => {
    const rules = findViolations('tests/fixtures/boundaries/bad')
      .map((v: { rule: string }) => v.rule)
      .sort();
    expect(rules).toEqual(RULES);
  });
});
