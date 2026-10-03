/** schema.org JSON-LD builders. Callers pass plain data; nothing here reads config. */
export interface OrgInput {
  type: string;
  name: string;
  legalName: string;
  url: string;
  phone: string;
  email: string;
  address: { street: string; locality: string; region: string; postcode: string; country: string };
  hours: { days: string[]; opens: string; closes: string }[];
  rating?: { value: number; count: number };
}

const CONTEXT = 'https://schema.org';

export function organizationSchema(o: OrgInput): object {
  const schema: Record<string, unknown> = {
    '@context': CONTEXT,
    '@type': o.type,
    name: o.name,
    legalName: o.legalName,
    url: o.url,
    telephone: o.phone,
    email: o.email,
    address: {
      '@type': 'PostalAddress',
      streetAddress: o.address.street,
      addressLocality: o.address.locality,
      addressRegion: o.address.region,
      postalCode: o.address.postcode,
      addressCountry: o.address.country,
    },
    openingHoursSpecification: o.hours.map((h) => ({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: h.days,
      opens: h.opens,
      closes: h.closes,
    })),
  };
  if (o.rating) {
    schema.aggregateRating = { '@type': 'AggregateRating', ratingValue: o.rating.value.toFixed(1), reviewCount: o.rating.count };
  }
  return schema;
}

export function personSchema(p: { name: string; jobTitle: string; credential: { body: string; number: string }; worksFor: string }): object {
  return {
    '@context': CONTEXT,
    '@type': 'Person',
    name: p.name,
    jobTitle: p.jobTitle,
    worksFor: { '@type': 'Organization', name: p.worksFor },
    hasCredential: {
      '@type': 'EducationalOccupationalCredential',
      identifier: p.credential.number,
      recognizedBy: { '@type': 'Organization', name: p.credential.body },
    },
  };
}

export function serviceSchema(s: { name: string; description: string; provider: string; priceFrom?: number; currency: string }): object {
  return {
    '@context': CONTEXT,
    '@type': 'Service',
    name: s.name,
    description: s.description,
    provider: { '@type': 'Organization', name: s.provider },
    ...(s.priceFrom !== undefined && {
      offers: { '@type': 'Offer', price: String(s.priceFrom), priceCurrency: s.currency },
    }),
  };
}

export function faqSchema(items: { q: string; a: string }[]): object {
  return {
    '@context': CONTEXT,
    '@type': 'FAQPage',
    mainEntity: items.map((i) => ({ '@type': 'Question', name: i.q, acceptedAnswer: { '@type': 'Answer', text: i.a } })),
  };
}

/** JSON for <script type="application/ld+json">, with "<" escaped so content can never close the tag. */
export function jsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}
