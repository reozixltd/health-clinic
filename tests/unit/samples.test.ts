import { describe, expect, it } from 'vitest';
import { sampleLeads, shouldAutoSeed } from '@/pages/console/_samples';
import { alliedHealth } from '@/presets/allied-health';
import { vet } from '@/presets/vet';
import { todayIn } from '@/core/format';

const now = new Date('2026-10-03T02:00:00Z');
const cases = [
  { name: 'allied', preset: alliedHealth, tz: 'Australia/Melbourne', counts: { appointment: 4, referral: 2, enquiry: 1 } },
  { name: 'vet', preset: vet, tz: 'Europe/London', counts: { appointment: 4, estimate: 2, enquiry: 1 } },
];

describe.each(cases)('sample leads ($name)', ({ preset, tz, counts }) => {
  const leads = sampleLeads(now, { preset, clinic: { timeZone: tz } });
  it('match the preset kinds and are future-dated', () => {
    expect(leads).toHaveLength(7);
    const tally: Record<string, number> = {};
    for (const l of leads) {
      expect(preset.leadKinds).toContain(l.kind);
      tally[l.kind] = (tally[l.kind] ?? 0) + 1;
      if (l.kind === 'appointment') expect((l.payload as { day: string }).day > todayIn(tz, now)).toBe(true);
    }
    expect(tally).toEqual(counts);
    expect(new Set(leads.map((l) => l.id)).size).toBe(7);
  });
  it('covers several appointment statuses', () => {
    const statuses = new Set(leads.filter((l) => l.kind === 'appointment').map((l) => l.status));
    expect(statuses.size).toBeGreaterThanOrEqual(3);
  });
});

it('allied samples include one marketing-consent appointment; vet includes a vaccinations visit', () => {
  const a = sampleLeads(now, { preset: alliedHealth, clinic: { timeZone: 'Australia/Melbourne' } });
  expect(a.filter((l) => l.kind === 'appointment' && l.consent.marketingSms)).toHaveLength(1);
  const v = sampleLeads(now, { preset: vet, clinic: { timeZone: 'Europe/London' } });
  expect(v.some((l) => (l.payload as { service?: string }).service === 'vaccinations')).toBe(true);
});

describe('shouldAutoSeed', () => {
  it('seeds only on a demo site that has not been seeded', () => {
    expect(shouldAutoSeed(true, null)).toBe(true);
    expect(shouldAutoSeed(true, '1')).toBe(false);
    expect(shouldAutoSeed(false, null)).toBe(false);
  });
});
