import { describe, expect, it } from 'vitest';
import { faqSchema, jsonLd, organizationSchema, personSchema, serviceSchema } from '@/core/schema';

const org = {
  type: 'PhysicalTherapy',
  name: 'Fernway Physio',
  legalName: 'Fernway Physio Pty Ltd',
  url: 'https://example.test/',
  phone: '03 5550 1200',
  email: 'hello@example.test',
  address: { street: '1 Example St', locality: 'Fernway', region: 'VIC', postcode: '3000', country: 'AU' },
  hours: [{ days: ['Monday', 'Tuesday'], opens: '08:00', closes: '17:00' }],
};

describe('organizationSchema', () => {
  it('omits rating when not given', () => {
    const s = organizationSchema(org) as Record<string, unknown>;
    expect(s).not.toHaveProperty('aggregateRating');
    expect(s['@type']).toBe('PhysicalTherapy');
  });
  it('includes aggregateRating when given', () => {
    const s = organizationSchema({ ...org, rating: { value: 4.8, count: 96 } }) as { aggregateRating: Record<string, unknown> };
    expect(s.aggregateRating.ratingValue).toBe('4.8');
    expect(s.aggregateRating.reviewCount).toBe(96);
  });
});

describe('personSchema', () => {
  it('carries the credential', () => {
    const s = personSchema({ name: 'Dr A', jobTitle: 'Physiotherapist', credential: { body: 'AHPRA', number: 'PHY0000000000' }, worksFor: 'Fernway Physio' }) as {
      hasCredential: { identifier: string; recognizedBy: { name: string } };
    };
    expect(s.hasCredential.recognizedBy.name).toBe('AHPRA');
    expect(s.hasCredential.identifier).toBe('PHY0000000000');
  });
});

describe('serviceSchema and faqSchema', () => {
  it('adds an offer only with priceFrom', () => {
    const base = { name: 'Initial consult', description: 'd', provider: 'Fernway Physio', currency: 'AUD' };
    expect(serviceSchema(base)).not.toHaveProperty('offers');
    expect(serviceSchema({ ...base, priceFrom: 120 })).toHaveProperty('offers.price', '120');
  });
  it('maps FAQ items', () => {
    const s = faqSchema([{ q: 'Q?', a: 'A.' }]) as { mainEntity: { name: string; acceptedAnswer: { text: string } }[] };
    expect(s.mainEntity[0].name).toBe('Q?');
    expect(s.mainEntity[0].acceptedAnswer.text).toBe('A.');
  });
});

describe('jsonLd', () => {
  it('escapes </script> so content cannot close the tag', () => {
    const out = jsonLd({ a: '</script><script>alert(1)</script>' });
    expect(out).not.toContain('</script');
    expect(JSON.parse(out).a).toBe('</script><script>alert(1)</script>');
  });
});
