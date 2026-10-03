import { describe, expect, it } from 'vitest';
import { addHoursIso, formatDay, formatMoney, todayIn } from '@/core/format';

describe('format', () => {
  it('formatMoney per currency', () => {
    expect(formatMoney(120, 'AUD', 'en-AU')).toBe('$120');
    expect(formatMoney(120, 'CAD', 'en-CA')).toBe('$120');
    expect(formatMoney(120, 'GBP', 'en-GB')).toBe('£120');
  });

  it('formatDay is weekday, day and month', () => {
    expect(formatDay('2026-10-09', 'en-AU')).toBe('Fri 9 Oct');
  });

  it('todayIn uses the clinic time zone, not the device', () => {
    expect(todayIn('Australia/Melbourne', new Date('2026-10-08T14:30:00Z'))).toBe('2026-10-09');
    expect(todayIn('America/Toronto', new Date('2026-10-09T03:30:00Z'))).toBe('2026-10-08');
  });

  it('addHoursIso adds real hours to a clinic wall time', () => {
    expect(addHoursIso('2026-10-09T09:00', 2, 'Australia/Melbourne')).toBe('2026-10-09T11:00');
    expect(addHoursIso('2026-10-09T23:00', 2, 'Europe/London')).toBe('2026-10-10T01:00');
  });

  it('addHoursIso respects a daylight-saving change', () => {
    // Melbourne clocks go forward at 02:00 on 2026-10-04: 01:00 + 2h is 04:00 wall time.
    expect(addHoursIso('2026-10-04T01:00', 2, 'Australia/Melbourne')).toBe('2026-10-04T04:00');
  });

  it('addHoursIso accepts an instant with an offset', () => {
    expect(addHoursIso('2026-10-09T00:00:00Z', 1, 'Australia/Melbourne')).toBe('2026-10-09T12:00');
  });
});
