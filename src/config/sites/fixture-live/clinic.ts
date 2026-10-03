import type { Clinic } from '@/domain/types';

export const clinic: Clinic = {
  name: 'Fixture Allied Health',
  legalName: 'Fixture Allied Health Pty Ltd',
  legalId: '00 000 000 000',
  phone: '03 5550 1200',
  mobile: '0491 570 120',
  email: 'hello@fixture.example',
  address: { street: '14 Example Street', locality: 'Fitzroy', region: 'VIC', postcode: '3065', country: 'AU' },
  timeZone: 'Australia/Melbourne',
  hours: [
    { days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], opens: '08:00', closes: '18:00' },
    { days: ['Saturday'], opens: '09:00', closes: '13:00' },
  ],
  emergency: { text: 'For an emergency, call 000. For help that can wait, call us in opening hours.', phone: '000', href: 'tel:000' },
  registerUrl: 'https://www.ahpra.gov.au/Registration/Registers-of-Practitioners.aspx',
  trust: ['Registered with AHPRA', 'Health funds accepted', 'Accessible entrance'],
  accessibility: 'Step-free entrance and an accessible toilet.',
  map: { lat: -37.7998, lng: 144.978 },
};
