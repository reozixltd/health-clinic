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
  messages: [
    { id: 'confirmation', channel: 'sms', marketing: false, appliesTo: 'appointment', trigger: { on: 'confirmed', offsetHours: 0 },
      body: 'Hi {firstName}, your appointment on {dayLabel}, {windowLabel} is confirmed. {clinicName}' },
    { id: 'reminder', channel: 'sms', marketing: false, appliesTo: 'appointment', trigger: { on: 'visit', offsetHours: -24 },
      body: 'Hi {firstName}, a reminder of your appointment on {dayLabel}, {windowLabel}. Please call us if you need to change it. {clinicName}' },
    { id: 'vaccination-recall', channel: 'sms', marketing: false, appliesTo: 'appointment', trigger: { on: 'visit', offsetHours: 8760 }, whenService: ['vaccinations'],
      body: 'Hi {firstName}, it is about a year since your pet\'s vaccinations. You can book the next visit on our website. {clinicName}' },
    { id: 'parasite-reminder', channel: 'sms', marketing: false, appliesTo: 'appointment', trigger: { on: 'visit', offsetHours: 2190, repeatEveryHours: 2190 },
      body: 'Hi {firstName}, a reminder that parasite prevention is due about every three months. {clinicName}' },
    { id: 'estimate-follow-up', channel: 'email', marketing: false, appliesTo: 'estimate', trigger: { on: 'created', offsetHours: 48 },
      body: 'Hi {firstName}, we sent your estimate two days ago. Reply to this email or call us if you have any questions. {clinicName}' },
  ],
  copy: {
    heroLine: 'Local vets who explain the plan and the price',
    bookLabel: 'Book an appointment',
    trust: ['Registered vets and nurses', 'Prices published up front', 'Clear out of hours cover'],
    treatsLead: 'We care for pets with',
    firstVisit: [
      'Ask for a time|{booking}',
      'We confirm|{confirm}',
      'What to bring|Bring your pet\'s vaccination record and any previous notes. Arrive a few minutes early.',
      'After the visit|We go through the plan and the price with you and book the next visit if your pet needs one.',
    ],
  },
  emergencyPage: true,
  extraPages: [{ slug: 'pet-health-plans', policy: 'pet-health-plans' }],
};
