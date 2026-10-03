import type { BookingConfig } from '@/domain/types';

export const booking: BookingConfig = {
  provider: 'link',
  url: 'https://example.cliniko.com/bookings',
  windows: [
    { id: 'morning', label: 'Morning', start: '08:00', end: '12:00' },
    { id: 'afternoon', label: 'Afternoon', start: '12:00', end: '17:00' },
  ],
  leadDays: 1,
  horizonDays: 21,
  daysOff: [0],
  confirmPromise: 'within 1 business day',
};
