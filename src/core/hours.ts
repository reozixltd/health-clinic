/** Opening hours as text, and whether the clinic is open at a given moment in its own time zone. Pure. */

export interface HoursRow {
  days: string[];
  opens: string;
  closes: string;
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/** '08:00' as '8 am', '17:30' as '5:30 pm'. */
export function clock(t: string): string {
  const [h, m] = t.split(':').map(Number);
  const hour = h % 12 || 12;
  return `${hour}${m ? `:${String(m).padStart(2, '0')}` : ''} ${h < 12 ? 'am' : 'pm'}`;
}

const minutes = (t: string) => {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};

/**
 * Open or closed right now, with the next change. The weekday and time are read in the clinic's
 * time zone, not the visitor's, so someone abroad sees the clinic's own day.
 */
export function openStatus(hours: HoursRow[], now: Date, timeZone: string): { open: boolean; label: string } {
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone, weekday: 'long', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(now);
  const part = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  const today = DAYS.indexOf(part('weekday'));
  const time = Number(part('hour')) * 60 + Number(part('minute'));
  const on = (day: number) => hours.filter((h) => h.days.includes(DAYS[day])).sort((a, b) => minutes(a.opens) - minutes(b.opens));

  const current = on(today).find((h) => time >= minutes(h.opens) && time < minutes(h.closes));
  if (current) return { open: true, label: `Open now, closes ${clock(current.closes)}` };
  const later = on(today).find((h) => time < minutes(h.opens));
  if (later) return { open: false, label: `Closed, opens ${clock(later.opens)}` };
  for (let i = 1; i <= 7; i++) {
    const day = (today + i) % 7;
    const next = on(day)[0];
    if (next) return { open: false, label: `Closed, opens ${DAYS[day]} ${clock(next.opens)}` };
  }
  return { open: false, label: 'Closed' };
}

/** One row per day, Monday first: '8 am to 6 pm', or 'Closed' for a day with no hours. */
export function weekHours(hours: HoursRow[]): { day: string; text: string }[] {
  return [...DAYS.slice(1), DAYS[0]!].map((day) => {
    const rows = hours.filter((h) => h.days.includes(day)).sort((a, b) => minutes(a.opens) - minutes(b.opens));
    return { day, text: rows.map((h) => `${clock(h.opens)} to ${clock(h.closes)}`).join(', ') || 'Closed' };
  });
}
