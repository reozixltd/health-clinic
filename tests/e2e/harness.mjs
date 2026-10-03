import { chromium } from 'playwright';

export const BASE = process.env.SITE_URL ?? 'http://localhost:4321';
export const SITE_ID = process.env.SITE_ID ?? 'fernway-au';

let failures = 0;
export async function step(name, fn) {
  try {
    await fn();
    console.log(`  ok   ${name}`);
  } catch (e) {
    failures += 1;
    console.log(`  FAIL ${name}\n       ${String(e?.message ?? e).split('\n').join('\n       ')}`);
  }
}

export function finish() {
  process.exit(failures ? 1 : 0);
}

export function skip(name) {
  console.log(`  skip ${name}`);
}

let browser;
export async function withPage(opts, fn) {
  browser ??= await chromium.launch({ executablePath: process.env.CHROMIUM_PATH ?? '/opt/pw-browsers/chromium' });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 }, ...opts });
  const page = await context.newPage();
  try {
    return await fn(page, context);
  } finally {
    await context.close();
  }
}

export async function closeBrowser() {
  await browser?.close();
  browser = undefined;
}

export function expect(cond, message) {
  if (!cond) throw new Error(message);
}
