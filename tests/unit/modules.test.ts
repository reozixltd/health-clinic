import { describe, expect, it } from 'vitest';
import { MODULES, indexPaths, isOn, routesFor, validateModules } from '@/domain/modules';

describe('module registry', () => {
  it('has the eleven spec ids', () => {
    expect(Object.keys(MODULES)).toHaveLength(11);
  });
  it('estimates requires price-list', () => {
    expect(validateModules(['estimates'])).toEqual(['estimates requires price-list']);
    expect(validateModules(['estimates', 'price-list'])).toEqual([]);
  });
  it('flags unknown ids', () => {
    expect(validateModules(['nope' as never])).toEqual(['Unknown module: nope']);
  });
  it('emergency route follows the preset flag', () => {
    const base = { modules: ['emergency' as const] };
    expect(routesFor({ ...base, preset: { emergencyPage: true } })).toEqual(['/out-of-hours/']);
    expect(routesFor({ ...base, preset: { emergencyPage: false } })).toEqual([]);
    expect(isOn('emergency', base)).toBe(true);
    expect(isOn('fees', base)).toBe(false);
  });
});

describe('booking route gate', () => {
  it('indexPaths for booking follows the module switch', () => {
    expect(indexPaths('booking', { modules: ['fees'] })).toEqual([]);
    expect(indexPaths('booking', { modules: ['booking'] })).toHaveLength(1);
  });
});
