// Builds the three demo sites: node tools/build-all.mjs [siteId ...]. Exits 1 on the first failed build.
// The SITE variable is per process, so this cannot be a `SITE=x astro build && ...` chain in an npm script: that is
// POSIX shell syntax and cmd.exe reads `SITE` as a command, so the script fails outright on Windows.
import { spawnSync } from 'node:child_process';

const sites = process.argv.slice(2);
if (sites.length === 0) sites.push('fernway-au', 'fernway-ca', 'hollybank');

for (const id of sites) {
  console.log(`build ${id}`);
  const r = spawnSync('npx', ['astro', 'build', '--outDir', `dist/${id}`], {
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env: { ...process.env, SITE: id },
  });
  if (r.status !== 0) {
    console.error(`build failed for ${id}`);
    process.exit(r.status ?? 1);
  }
}