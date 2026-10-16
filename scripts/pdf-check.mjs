#!/usr/bin/env node
// Renders every fictional test case to PDF (+ PNG pages if `pdftoppm` is installed) so a
// person can eyeball placement. Run after any change to the field map, and whenever the
// court revises the form:
//
//   node scripts/pdf-check.mjs [outDir] [--draft]
//
// It also checks the template file still matches the hash recorded in the field map.
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { FORM_FILES, fillForm } from '../netlify/functions/_lib/pdf/fill.js';
import { ALL_FIXTURES } from '../tests/pdf/fixtures.js';

const args = process.argv.slice(2);
const out = args.find((a) => !a.startsWith('--')) || 'pdf-check-output';
const draft = args.includes('--draft');
mkdirSync(out, { recursive: true });

const map = JSON.parse(readFileSync(FORM_FILES.map, 'utf8'));
const hash = createHash('sha256').update(readFileSync(FORM_FILES.pdf)).digest('hex');
if (hash !== map.sha256) {
  console.error(`TEMPLATE CHANGED: ${FORM_FILES.pdf} hash ${hash} does not match the field map (${map.sha256}).`);
  console.error('The court form may have been revised. Re-measure positions before using it.');
  process.exit(1);
}
console.log(`Template OK: Form ${map.form} (${map.revision})`);

let hasPdftoppm = true;
try { execFileSync('pdftoppm', ['-v'], { stdio: 'ignore' }); } catch { hasPdftoppm = false; }

for (const [name, answers] of Object.entries(ALL_FIXTURES)) {
  const { bytes, warnings, pageCount, attachmentPages } = await fillForm(answers, { watermark: draft });
  const file = join(out, `${name}.pdf`);
  writeFileSync(file, bytes);
  if (hasPdftoppm) execFileSync('pdftoppm', ['-r', '110', '-png', file, join(out, name)]);
  console.log(`${name.padEnd(18)} pages=${pageCount} attachments=${attachmentPages}${warnings.length ? `\n   - ${warnings.join('\n   - ')}` : ''}`);
}
console.log(`\nWrote files to ${out}/${hasPdftoppm ? ' (PDF + PNG)' : ' (PDF only — install poppler-utils for PNGs)'}`);
