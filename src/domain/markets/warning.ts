/** Build-time warning for a live site whose market pack has not been confirmed by local counsel. No alias imports: astro.config.mjs loads this file. */
interface WarnSite {
  id: string;
  demoMode: boolean;
  /** Every market id the site uses: its configured market and any demo switch markets. */
  marketIds: string[];
}

const CHECKLIST: Record<string, string[]> = {
  AU: ['testimonial rules on clinic pages (AHPRA)', 'Spam Act wording', 'GST wording'],
  CA: ['provincial privacy and health information rules', 'college advertising and testimonial rules for Ontario', 'CASL wording', 'AODA wording'],
  UK: ['PECR wording', 'price display rules', 'the vet module wording'],
};

/** Text to print, or null when the site is a demo or every market it uses is verified. */
export function unverifiedMarketWarning(site: WarnSite, isVerified: (id: string) => boolean): string | null {
  if (site.demoMode) return null;
  const ids = [...new Set(site.marketIds)].filter((id) => !isVerified(id));
  if (ids.length === 0) return null;
  const lines = ids.map((id) => `  ${id}: confirm ${(CHECKLIST[id] ?? ['the market rules']).join(', ')}`);
  return [
    `Site "${site.id}" is built with demoMode false but its market pack is not verified (verified: false).`,
    'Have local counsel confirm the following, then set verified: true in the pack:',
    ...lines,
  ].join('\n');
}
