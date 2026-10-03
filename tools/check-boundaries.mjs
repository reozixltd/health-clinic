import { findViolations } from './boundaries.mjs';

const violations = findViolations('.');
for (const v of violations) console.log(`${v.file}: ${v.rule}: ${v.detail}`);
if (violations.length) process.exit(1);
console.log('boundaries ok');
