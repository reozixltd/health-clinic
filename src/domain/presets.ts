import type { LeadKind } from '@/core/leads/types';
import { getMarket, type MarketId, type MarketPack } from './markets';
import { MODULE_IDS, validateModules, type ModuleId } from './modules';
import type { BookingConfig, Clinic, MessageTemplate } from './types';

export interface NavItem {
  label: string;
  href: string;
  module?: ModuleId;
  /** Shown in the footer only. */
  footer?: boolean;
}

export interface Preset {
  id: 'allied-health' | 'vet';
  modules: ModuleId[];
  nav: NavItem[];
  schemaType: string;
  leadKinds: LeadKind[];
  messages: MessageTemplate[];
  copy: { heroLine: string; bookLabel: string; trust: string[] };
  emergencyPage: boolean;
  extraPages: { slug: string; policy: string }[];
}

export interface SiteConfigInput {
  site: {
    id: string;
    preset: 'allied-health' | 'vet';
    market: MarketId;
    markets?: MarketId[];
    modules?: Partial<Record<ModuleId, boolean>>;
    demoMode: boolean;
    theme: string;
    themes?: string[];
    contentDir: string;
  };
  clinic: Clinic;
  booking: BookingConfig;
  messages?: MessageTemplate[];
}

export interface Site {
  id: string;
  preset: Preset;
  market: MarketPack;
  modules: ModuleId[];
  demoMode: boolean;
  theme: string;
  themes: string[];
  markets: MarketId[];
  contentDir: string;
  clinic: Clinic;
  booking: BookingConfig;
  messages: MessageTemplate[];
}

export function resolveSite(config: SiteConfigInput, presets: Record<string, Preset>): Site {
  const { site } = config;
  const preset = presets[site.preset];
  if (!preset) throw new Error(`Unknown preset: ${site.preset}`);
  const overrides = Object.entries(site.modules ?? {}) as [ModuleId, boolean][];
  for (const [id] of overrides) {
    if (!(MODULE_IDS as readonly string[]).includes(id)) throw new Error(`Unknown module: ${id}`);
  }
  const off = new Set(overrides.filter(([, v]) => !v).map(([id]) => id));
  const added = overrides.filter(([, v]) => v).map(([id]) => id);
  const modules = [...new Set([...preset.modules.filter((id) => !off.has(id)), ...added])];
  const [problem] = validateModules(modules);
  if (problem) throw new Error(problem);
  return {
    id: site.id,
    preset: { ...preset, nav: preset.nav.filter((n) => !n.module || modules.includes(n.module)) },
    market: getMarket(site.market),
    modules,
    demoMode: site.demoMode,
    theme: site.theme,
    themes: site.themes ?? [site.theme],
    markets: site.markets ?? [site.market],
    contentDir: site.contentDir,
    clinic: config.clinic,
    booking: config.booking,
    messages: config.messages ?? preset.messages,
  };
}
