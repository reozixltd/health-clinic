import type { LeadKind } from '@/core/leads/types';

export const MODULE_IDS = [
  'providers', 'services', 'booking', 'fees', 'price-list',
  'estimates', 'ownership', 'reviews', 'reminders', 'referrals', 'emergency',
] as const;
export type ModuleId = (typeof MODULE_IDS)[number];

export interface ModuleDef {
  id: ModuleId;
  routes: string[];
  leadKinds?: LeadKind[];
  requires?: ModuleId[];
}

export const MODULES: Record<ModuleId, ModuleDef> = {
  providers: { id: 'providers', routes: ['/team/'] },
  services: { id: 'services', routes: ['/services/'] },
  booking: { id: 'booking', routes: ['/book/'], leadKinds: ['appointment'] },
  fees: { id: 'fees', routes: ['/fees/'] },
  'price-list': { id: 'price-list', routes: ['/prices/'] },
  estimates: { id: 'estimates', routes: ['/estimates/'], leadKinds: ['estimate'], requires: ['price-list'] },
  ownership: { id: 'ownership', routes: ['/ownership/'] },
  reviews: { id: 'reviews', routes: [] },
  reminders: { id: 'reminders', routes: [] },
  referrals: { id: 'referrals', routes: ['/referrers/'], leadKinds: ['referral'] },
  // Route comes from the preset's emergencyPage flag (see routesFor).
  emergency: { id: 'emergency', routes: [] },
};

interface SiteLike {
  modules: ModuleId[];
  preset: { emergencyPage: boolean };
}

export function isOn(id: ModuleId, site: Pick<SiteLike, 'modules'>): boolean {
  return site.modules.includes(id);
}

export function routesFor(site: SiteLike): string[] {
  return site.modules.flatMap((id) =>
    id === 'emergency' ? (site.preset.emergencyPage ? ['/out-of-hours/'] : []) : MODULES[id].routes,
  );
}

/** Unknown ids and missing requirements; empty when valid. */
export function validateModules(on: ModuleId[]): string[] {
  const errors: string[] = [];
  for (const id of on) {
    const def = MODULES[id];
    if (!def) {
      errors.push(`Unknown module: ${id}`);
      continue;
    }
    for (const req of def.requires ?? []) {
      if (!on.includes(req)) errors.push(`${id} requires ${req}`);
    }
  }
  return errors;
}
