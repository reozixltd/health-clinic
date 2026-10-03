/** Message body rendering. `{name}` placeholders are replaced; unknown ones are left visible. */

export const TEMPLATE_VARS = ['firstName', 'clinicName', 'reviewLink', 'optOut', 'dayLabel', 'windowLabel', 'service'] as const;
export type TemplateVar = (typeof TEMPLATE_VARS)[number];

export function render(body: string, vars: Partial<Record<string, string>>): string {
  return body.replace(/\{(\w+)\}/g, (whole, key: string) => vars[key] ?? whole);
}

/** Every `{var}` used in a body. */
export function varsIn(body: string): string[] {
  return [...body.matchAll(/\{(\w+)\}/g)].map((m) => m[1]);
}
