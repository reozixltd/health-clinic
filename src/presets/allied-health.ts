import type { Preset } from '@/domain/presets';

export const alliedHealth: Preset = {
  id: 'allied-health',
  modules: ['providers', 'services', 'booking', 'fees', 'reviews', 'reminders', 'referrals', 'emergency'],
  nav: [
    { label: 'Services', href: '/services/', module: 'services' },
    { label: 'Team', href: '/team/', module: 'providers' },
    { label: 'Fees', href: '/fees/', module: 'fees' },
    { label: 'New patients', href: '/new-patients/' },
    { label: 'Contact', href: '/contact/' },
    { label: 'Referrers', href: '/referrers/', module: 'referrals', footer: true },
  ],
  schemaType: 'MedicalClinic',
  leadKinds: ['appointment', 'referral', 'enquiry'],
  messages: [],
  copy: {
    heroLine: 'Care that fits around your week',
    bookLabel: 'Book an appointment',
    trust: ['Registered clinicians', 'Clear fees before you book', 'Reminders by text or email'],
  },
  emergencyPage: false,
  extraPages: [],
};
