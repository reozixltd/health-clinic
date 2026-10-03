import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { allSites, selectedSite } from '@/config';
import { fixtures, registry } from '@/config/registry';

describe('site registry', () => {
  const pkg = JSON.parse(readFileSync('package.json', 'utf8')) as { scripts: Record<string, string> };
  const buildAll = [...pkg.scripts['build:all'].matchAll(/SITE=(\S+)/g)].map((m) => m[1]);

  it('build:all lists sites and every one is registered', () => {
    expect(buildAll.length).toBeGreaterThanOrEqual(3);
    for (const id of buildAll) expect(registry[id], `${id} is missing from src/config/registry.ts`).toBeDefined();
    expect(Object.keys(allSites()).sort()).toEqual(Object.keys(registry).sort());
  });
  it('each entry carries its own id and fixtures stay out of allSites', () => {
    for (const [id, input] of Object.entries({ ...registry, ...fixtures })) expect(input.site.id).toBe(id);
    expect(Object.keys(allSites())).not.toContain('fixture-no-booking');
  });
  it('the default site resolves', () => {
    expect(selectedSite().id).toBeTruthy();
  });
});
