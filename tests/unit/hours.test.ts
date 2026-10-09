import { describe, expect, it } from 'vitest';
import { clock, openStatus, weekHours } from '@/core/hours';

const hours = [
  { days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], opens: '08:00', closes: '18:00' },
  { days: ['Saturday'], opens: '09:00', closes: '13:00' },
];
const MELBOURNE = 'Australia/Melbourne';

describe('clock', () => {
  it('writes 24-hour times the way the clinic says them', () => {
    expect(clock('08:00')).toBe('8 am');
    expect(clock('17:30')).toBe('5:30 pm');
    expect(clock('12:00')).toBe('12 pm');
    expect(clock('00:15')).toBe('12:15 am');
  });
});

describe('openStatus', () => {
  // 2026-10-12 is a Monday. Melbourne is on daylight time (UTC+11) from 4 October 2026.
  it('is open during the day and names the closing time', () => {
    expect(openStatus(hours, new Date('2026-10-12T01:00:00Z'), MELBOURNE)).toEqual({ open: true, label: 'Open now, closes 6 pm' });
  });

  it('is closed before opening and names the time it opens today', () => {
    expect(openStatus(hours, new Date('2026-10-11T20:30:00Z'), MELBOURNE)).toEqual({ open: false, label: 'Closed, opens 8 am' });
  });

  it('opens on the minute and closes on the minute', () => {
    expect(openStatus(hours, new Date('2026-10-11T21:00:00Z'), MELBOURNE).open).toBe(true);
    expect(openStatus(hours, new Date('2026-10-12T07:00:00Z'), MELBOURNE).open).toBe(false);
  });

  it('after closing names the next open day', () => {
    expect(openStatus(hours, new Date('2026-10-12T08:00:00Z'), MELBOURNE)).toEqual({ open: false, label: 'Closed, opens Tuesday 8 am' });
  });

  it('skips a closed Sunday', () => {
    // Saturday 3 pm in Melbourne.
    expect(openStatus(hours, new Date('2026-10-17T04:00:00Z'), MELBOURNE)).toEqual({ open: false, label: 'Closed, opens Monday 8 am' });
  });

  it('uses the clinic time zone, not the visitor one', () => {
    // The same instant: Monday 10 am in Melbourne, Sunday 7 pm in Ottawa.
    const instant = new Date('2026-10-11T23:00:00Z');
    expect(openStatus(hours, instant, MELBOURNE).open).toBe(true);
    expect(openStatus(hours, instant, 'America/Toronto')).toEqual({ open: false, label: 'Closed, opens Monday 8 am' });
  });

  it('copes with no hours at all', () => {
    expect(openStatus([], new Date('2026-10-12T01:00:00Z'), MELBOURNE)).toEqual({ open: false, label: 'Closed' });
  });
});

describe('weekHours', () => {
  it('lists seven days from Monday and marks a day with no hours closed', () => {
    const week = weekHours([
      { days: ['Monday', 'Tuesday'], opens: '08:00', closes: '18:00' },
      { days: ['Saturday'], opens: '09:00', closes: '13:00' },
    ]);
    expect(week.map((d) => d.day)).toEqual(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']);
    expect(week[0]).toEqual({ day: 'Monday', text: '8 am to 6 pm' });
    expect(week[5]!.text).toBe('9 am to 1 pm');
    expect(week[6]!.text).toBe('Closed');
  });

  it('joins a split day in opening order', () => {
    const week = weekHours([
      { days: ['Monday'], opens: '14:00', closes: '18:00' },
      { days: ['Monday'], opens: '08:00', closes: '12:00' },
    ]);
    expect(week[0]!.text).toBe('8 am to 12 pm, 2 pm to 6 pm');
  });
});
