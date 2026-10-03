import { resolveSite, type Preset, type Site, type SiteConfigInput } from '@/domain/presets';
import { alliedHealth } from '@/presets/allied-health';
import { vet } from '@/presets/vet';
import { site as auSite } from './sites/fernway-au/site';
import { clinic as auClinic } from './sites/fernway-au/clinic';
import { booking as auBooking } from './sites/fernway-au/booking';
import { messages as auMessages } from './sites/fernway-au/messages';
import { site as caSite } from './sites/fernway-ca/site';
import { clinic as caClinic } from './sites/fernway-ca/clinic';
import { booking as caBooking } from './sites/fernway-ca/booking';
import { messages as caMessages } from './sites/fernway-ca/messages';
import { site as hbSite } from './sites/hollybank/site';
import { clinic as hbClinic } from './sites/hollybank/clinic';
import { booking as hbBooking } from './sites/hollybank/booking';
import { messages as hbMessages } from './sites/hollybank/messages';

const presets: Record<string, Preset> = { 'allied-health': alliedHealth, vet };

const inputs: Record<string, SiteConfigInput> = {
  'fernway-au': { site: auSite, clinic: auClinic, booking: auBooking, messages: auMessages },
  'fernway-ca': { site: caSite, clinic: caClinic, booking: caBooking, messages: caMessages },
  hollybank: { site: hbSite, clinic: hbClinic, booking: hbBooking, messages: hbMessages },
};

export const DEFAULT_SITE_ID = 'fernway-au';

/**
 * The site id for this build. Astro reserves import.meta.env.SITE for the site URL, so the id
 * comes from SITE_ID (set from the SITE environment variable in astro.config.mjs), then process.env.SITE.
 */
export function selectedSiteId(): string {
  const fromVite = (import.meta.env as Record<string, string | undefined>).SITE_ID;
  const fromProcess = typeof process !== 'undefined' ? process.env.SITE : undefined;
  const id = fromVite ?? fromProcess ?? DEFAULT_SITE_ID;
  if (!(id in inputs)) throw new Error(`Unknown SITE "${id}". Use one of: ${Object.keys(inputs).join(', ')}`);
  return id;
}

export function allSites(): Record<string, Site> {
  return Object.fromEntries(Object.entries(inputs).map(([id, input]) => [id, resolveSite(input, presets)]));
}

export const site: Site = allSites()[selectedSiteId()];
