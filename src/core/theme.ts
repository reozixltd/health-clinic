/** Demo-only theme switching. Outside demo mode the configured theme always wins. */
export interface OverrideInput {
  param: string | null;
  stored: string | null;
  configured: string;
  allowed: readonly string[];
  demoMode: boolean;
}

export function resolveOverride({ param, stored, configured, allowed, demoMode }: OverrideInput): string {
  if (!demoMode) return configured;
  if (param && allowed.includes(param)) return param;
  if (stored && allowed.includes(stored)) return stored;
  return configured;
}
