import { describe, expect, it } from 'vitest';
import type { Clinic } from '@/domain/types';
import { ownershipView } from '@/modules/ownership/ownership';

const base = { name: 'Elm Vets', legalName: 'Elm Practice Ltd', legalId: '12345678' } as Clinic;

describe('ownershipView', () => {
  it('puts the owner name in the Owner row and the legal name in the company row', () => {
    const v = ownershipView({ ...base, owner: { name: 'Dr Ada Elm', independent: true } });
    expect(v.lead).toContain('independently owned');
    expect(v.rows.find((r) => r.term === 'Owner')?.detail).toBe('Dr Ada Elm');
    expect(v.rows.find((r) => r.term === 'Registered company')?.detail).toBe('Elm Practice Ltd, company number 12345678');
  });

  it('names the group when not independent', () => {
    const v = ownershipView({ ...base, owner: { name: 'Big Vets Ltd', group: 'Big Vets Group', independent: false } });
    expect(v.lead).toBe('Elm Vets is part of Big Vets Group.');
    expect(v.rows.map((r) => r.term)).toEqual(['Owner', 'Group', 'Registered company']);
  });

  it('has no rows without an owner', () => {
    expect(ownershipView(base).rows).toEqual([]);
  });
});
