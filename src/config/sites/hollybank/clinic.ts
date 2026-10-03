import type { Clinic } from '@/domain/types';

export const clinic: Clinic = {
  name: 'Hollybank Vets',
  legalName: 'Hollybank Veterinary Practice Ltd',
  legalId: '00000000',
  phone: '0113 496 0123',
  email: 'hello@hollybank.example',
  address: { street: '8 Holly Walk', locality: 'Leeds', region: 'West Yorkshire', postcode: 'LS1 4AB', country: 'GB' },
  timeZone: 'Europe/London',
  hours: [
    { days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], opens: '08:30', closes: '18:30' },
    { days: ['Saturday'], opens: '09:00', closes: '13:00' },
  ],
  emergency: {
    text: 'Outside opening hours, call our out of hours service. A vet will call you back.',
    phone: '0113 496 0199',
    href: 'tel:01134960199',
  },
  owner: { name: 'Hollybank Veterinary Practice Ltd', independent: true },
  estimateThreshold: 500,
  reviewsUrl: 'https://g.page/r/hollybank-demo/review',
  map: { lat: 53.8008, lng: -1.5491 },
};
