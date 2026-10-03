/** Display and date helpers. Dates are always computed in the clinic's time zone, never the device's. */

export type Currency = 'AUD' | 'CAD' | 'GBP';

/** Whole units: 120 → "$120" (AUD en-AU, CAD en-CA) or "£120" (GBP en-GB). */
export function formatMoney(n: number, currency: Currency, locale: string): string {
  return new Intl.NumberFormat(locale, { style: 'currency', currency, currencyDisplay: 'narrowSymbol', maximumFractionDigits: 0 }).format(n);
}

/** "2026-10-09" → "Fri 9 Oct" (en-AU). A plain date has no zone, so it is formatted in UTC. */
export function formatDay(iso: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' })
    .format(new Date(`${iso}T00:00:00Z`))
    .replace(',', '');
}

function parts(date: Date, timeZone: string): Record<string, string> {
  const out: Record<string, string> = {};
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
  });
  for (const p of fmt.formatToParts(date)) out[p.type] = p.value;
  return out;
}

/** Today's date ("YYYY-MM-DD") in the given time zone. */
export function todayIn(timeZone: string, now: Date): string {
  const p = parts(now, timeZone);
  return `${p.year}-${p.month}-${p.day}`;
}

function wallTime(date: Date, timeZone: string): string {
  const p = parts(date, timeZone);
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
}

/** The instant a zone-less "YYYY-MM-DDTHH:mm" wall time falls on in `timeZone`. */
function instantFromWall(iso: string, timeZone: string): Date {
  const asUtc = new Date(`${iso}:00Z`);
  let guess = asUtc;
  for (let i = 0; i < 2; i++) {
    const shown = new Date(`${wallTime(guess, timeZone)}:00Z`);
    guess = new Date(guess.getTime() + (asUtc.getTime() - shown.getTime()));
  }
  return guess;
}

/**
 * Adds real elapsed hours and returns the clinic wall time ("YYYY-MM-DDTHH:mm") in `timeZone`.
 * `iso` is either a wall time in that zone ("2026-10-09T09:00") or an instant with Z/offset.
 */
export function addHoursIso(iso: string, hours: number, timeZone: string): string {
  const start = /(Z|[+-]\d{2}:?\d{2})$/.test(iso) ? new Date(iso) : instantFromWall(iso.slice(0, 16), timeZone);
  return wallTime(new Date(start.getTime() + hours * 3_600_000), timeZone);
}
