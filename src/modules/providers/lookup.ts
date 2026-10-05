/** Resolve provider slugs to display names, so a service can say who sees you. */

export function providersBySlug<T extends { slug: string }>(providers: T[]): Map<string, T> {
  return new Map(providers.map((p) => [p.slug, p]));
}

/** Names for the given slugs, in the order asked for, skipping any that do not resolve. */
export function providerNamesFor<T extends { slug: string; name: string }>(providers: T[], slugs: string[]): string[] {
  const index = providersBySlug(providers);
  return slugs.map((slug) => index.get(slug)?.name).filter((n): n is string => Boolean(n));
}