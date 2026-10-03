import { existsSync } from 'node:fs';
import { chromium } from 'playwright';

// CHROMIUM_PATH wins; the sandbox path is used when it exists; otherwise Playwright's own download.
const SANDBOX_CHROMIUM = '/opt/pw-browsers/chromium';
const executablePath = process.env.CHROMIUM_PATH ?? (existsSync(SANDBOX_CHROMIUM) ? SANDBOX_CHROMIUM : undefined);

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
  // Windows: process.exit() while Playwright handles are closing trips a libuv assertion (exit 134). Let the loop drain.
  process.exitCode = failures ? 1 : 0;
}

export function skip(name) {
  console.log(`  skip ${name}`);
}

let browser;
export async function withPage(opts, fn) {
  browser ??= await chromium.launch({ executablePath });
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
