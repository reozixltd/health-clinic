/**
 * The one list of sites. src/config/index.ts and astro.config.mjs both read it, so registering a
 * site means adding an entry here. Plain data with type-only imports, so astro.config.mjs can load it.
 */
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
import { site as fxSite } from './sites/fixture-minimal/site';
import { clinic as fxClinic } from './sites/fixture-minimal/clinic';
import { booking as fxBooking } from './sites/fixture-minimal/booking';
import { messages as fxMessages } from './sites/fixture-minimal/messages';
import { site as nbSite } from './sites/fixture-no-booking/site';
import { clinic as nbClinic } from './sites/fixture-no-booking/clinic';
import { booking as nbBooking } from './sites/fixture-no-booking/booking';
import { messages as nbMessages } from './sites/fixture-no-booking/messages';
import type { SiteConfigInput } from '@/domain/presets';

/** Sites that build:all builds and allSites() returns. */
export const registry: Record<string, SiteConfigInput> = {
  'fernway-au': { site: auSite, clinic: auClinic, booking: auBooking, messages: auMessages },
  'fernway-ca': { site: caSite, clinic: caClinic, booking: caBooking, messages: caMessages },
  hollybank: { site: hbSite, clinic: hbClinic, booking: hbBooking, messages: hbMessages },
};

/** Module-off test fixtures. Built by the e2e run only, and kept out of allSites(). */
export const fixtures: Record<string, SiteConfigInput> = {
  'fixture-minimal': { site: fxSite, clinic: fxClinic, booking: fxBooking, messages: fxMessages },
  'fixture-no-booking': { site: nbSite, clinic: nbClinic, booking: nbBooking, messages: nbMessages },
};
