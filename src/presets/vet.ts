import type { Preset } from '@/domain/presets';

export const vet: Preset = {
  id: 'vet',
  modules: ['providers', 'services', 'booking', 'price-list', 'estimates', 'ownership', 'reviews', 'reminders', 'emergency'],
  nav: [
    { label: 'Services', href: '/services/', module: 'services' },
    { label: 'Prices', href: '/prices/', module: 'price-list' },
    { label: 'Team', href: '/team/', module: 'providers' },
    { label: 'Out of hours', href: '/out-of-hours/', module: 'emergency' },
    { label: 'Contact', href: '/contact/' },
  ],
  schemaType: 'VeterinaryCare',
  leadKinds: ['appointment', 'estimate', 'enquiry'],
  messages: [],
  copy: {
    heroLine: 'Local vets who explain the plan and the price',
    bookLabel: 'Book an appointment',
    trust: ['Registered vets and nurses', 'Prices published up front', 'Clear out of hours cover'],
  },
  emergencyPage: true,
  extraPages: [{ slug: 'pet-health-plans', policy: 'pet-health-plans' }],
};
