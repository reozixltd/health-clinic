import { describe, expect, it } from 'vitest';
import { leadsToCsv } from '@/core/leads/csv';
import type { Lead } from '@/core/leads/types';

const lead: Lead<Record<string, unknown>> = {
  id: 'L-1',
  kind: 'enquiry',
  status: 'new',
  createdAt: '2026-10-03T00:00:00.000Z',
  contact: { firstName: 'Sam "S"', lastName: 'Lee', phone: '0491 570 120', email: 'sam@example.com' },
  postcode: '3000',
  consent: { terms: true, remindersSms: false, marketingSms: false, marketingEmail: false, at: null },
  payload: {},
  clientRef: 'r1',
  history: [{ at: '2026-10-03T01:00:00.000Z', type: 'note', value: 'Line one, with comma\nLine two' }],
};

describe('leadsToCsv', () => {
  it('writes a header row and escapes quotes, commas and newlines', () => {
    const csv = leadsToCsv([lead]);
    const [header, row] = csv.split('\r\n');
    expect(header).toContain('"Postcode"');
    expect(row).toContain('"Sam ""S"""');
    expect(csv).toContain('"Line one, with comma\nLine two"');
    expect(row).toContain('"Enquiry"');
  });

  it('neutralises spreadsheet formulas', () => {
    const csv = leadsToCsv([{ ...lead, contact: { ...lead.contact, firstName: '=HYPERLINK("x")' } }]);
    expect(csv).toContain(`"'=HYPERLINK(""x"")"`);
  });

  it('accepts custom columns', () => {
    const csv = leadsToCsv([lead], [{ header: 'Ref', value: (l) => l.clientRef }]);
    expect(csv).toBe('"Ref"\r\n"r1"');
  });
});
