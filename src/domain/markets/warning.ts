/** Build-time warnings for a live site (demoMode false): an unconfirmed market pack and a browser-only lead store. No alias imports: astro.config.mjs loads this file. */
interface WarnSite {
  id: string;
  demoMode: boolean;
  /** Every market id the site uses: its configured market and any demo switch markets. */
  marketIds: string[];
}

/** The parts of a MarketPack the warning reads. */
interface PackInfo {
  verified: boolean;
  checklist: string[];
}

/** Text to print, or null when the site is a demo or every market it uses is verified. */
export function unverifiedMarketWarning(site: WarnSite, pack: (id: string) => PackInfo | undefined): string | null {
  if (site.demoMode) return null;
  const ids = [...new Set(site.marketIds)].filter((id) => pack(id)?.verified !== true);
  if (ids.length === 0) return null;
  const lines = ids.map((id) => `  ${id}: confirm ${(pack(id)?.checklist ?? ['the market rules']).join(', ')}`);
  return [
    `Site "${site.id}" is built with demoMode false but its market pack is not verified (verified: false).`,
    'Have local counsel confirm the following, then set verified: true in the pack:',
    ...lines,
  ].join('\n');
}

/** Text to print for a live site that still keeps leads in the visitor's browser, or null. */
export function localLeadStoreWarning(site: { id: string; demoMode: boolean; leadStore: string }): string | null {
  if (site.demoMode || site.leadStore !== 'local') return null;
  return [
    `Site "${site.id}" is built with demoMode false but leads are still kept in the visitor's browser (LocalLeadRepository).`,
    'Requests sent from this site never reach the clinic. Implement HttpLeadRepository and set LEAD_STORE to "http" in src/core/leads/store.ts.',
  ].join('\n');
}
