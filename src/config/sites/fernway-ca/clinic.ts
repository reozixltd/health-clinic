import type { Clinic } from '@/domain/types';

export const clinic: Clinic = {
  name: 'Fernway Health',
  legalName: 'Fernway Health Inc.',
  legalId: '000000000',
  phone: '613-555-0123',
  email: 'hello@fernway.example',
  address: { street: '250 Sample Avenue', locality: 'Ottawa', region: 'ON', postcode: 'K1P 0A1', country: 'CA' },
  timeZone: 'America/Toronto',
  hours: [
    { days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], opens: '08:00', closes: '18:00' },
    { days: ['Saturday'], opens: '09:00', closes: '13:00' },
  ],
  emergency: { text: 'For an emergency, call 911. For help that can wait, call us in opening hours.', phone: '911', href: 'tel:911' },
  reviewsUrl: 'https://g.page/r/fernway-demo/review',
  map: { lat: 45.4215, lng: -75.6972 },
};
