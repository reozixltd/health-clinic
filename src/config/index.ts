import { resolveSite, type Preset, type Site, type SiteConfigInput } from '@/domain/presets';
import { alliedHealth } from '@/presets/allied-health';
import { vet } from '@/presets/vet';
import { fixtures, registry } from './registry';

const presets: Record<string, Preset> = { 'allied-health': alliedHealth, vet };

const inputs = registry;

export const DEFAULT_SITE_ID = 'fernway-au';

/**
 * The site id for this build. Astro reserves import.meta.env.SITE for the site URL, so the id
 * comes from SITE_ID (set from the SITE environment variable in astro.config.mjs), then process.env.SITE.
 */
export function selectedSiteId(): string {
  const fromVite = (import.meta.env as Record<string, string | undefined>).SITE_ID;
  const fromProcess = typeof process !== 'undefined' ? process.env.SITE : undefined;
  const id = fromVite || fromProcess || DEFAULT_SITE_ID;
  if (!(id in inputs) && !(id in fixtures)) throw new Error(`Unknown SITE "${id}". Use one of: ${[...Object.keys(inputs), ...Object.keys(fixtures)].join(', ')}`);
  return id;
}

export function allSites(): Record<string, Site> {
  return Object.fromEntries(Object.entries(inputs).map(([id, input]) => [id, resolveSite(input, presets)]));
}

export function selectedSite(): Site {
  const id = selectedSiteId();
  return resolveSite(fixtures[id] ?? inputs[id], presets);
}

export const site: Site = selectedSite();
