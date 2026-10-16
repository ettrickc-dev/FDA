import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { PDFDocument } from 'pdf-lib';
import { describe, expect, it } from 'vitest';
import { fillForm, FORM_FILES } from '../netlify/functions/_lib/pdf/fill.js';
import { buildFormModel, CONFIDENTIAL_TEXT, money } from '../netlify/functions/_lib/pdf/model.js';
import { ALL_FIXTURES, CONFIDENTIAL, EVERY_CHECKBOX_A, EVERY_CHECKBOX_B, OVERFLOW, SELF_EMPLOYED, TYPICAL } from './pdf/fixtures.js';

const map = JSON.parse(readFileSync(FORM_FILES.map, 'utf8'));

describe('form template', () => {
  it('is the 1/2026 revision the map was measured on', () => {
    const hash = createHash('sha256').update(readFileSync(FORM_FILES.pdf)).digest('hex');
    expect(hash).toBe(map.sha256);
    expect(map.revision).toBe('1/2026');
  });
  it('never maps the signature or the affirmation date', () => {
    const keys = Object.keys(map.text).join(' ');
    expect(keys).not.toMatch(/signature|sign_date|affirm|day_of/);
  });
  it('every map position is on the page', () => {
    for (const f of [...Object.values(map.text), ...Object.values(map.checks), ...Object.values(map.circles)]) {
      expect(f.x0).toBeGreaterThanOrEqual(30); expect(f.x1).toBeLessThanOrEqual(582);
      expect(f.x1).toBeGreaterThan(f.x0); expect(f.top).toBeGreaterThan(40); expect(f.top).toBeLessThan(740);
    }
  });
});

describe('form model', () => {
  it('formats money', () => {
    expect(money('1240')).toBe('1,240');
    expect(money('968.15')).toBe('968.15');
    expect(money('$1,200.5')).toBe('1,200.50');
    expect(money('')).toBe('');
  });

  it('every field the model can produce has a position', () => {
    for (const a of Object.values(ALL_FIXTURES)) {
      const m = buildFormModel(a);
      for (const k of Object.keys(m.text)) expect(map.text[k], k).toBeTruthy();
      for (const k of m.checks) expect(map.checks[k], k).toBeTruthy();
      for (const k of m.circles) expect(map.circles[k], k).toBeTruthy();
      for (const k of m.seeAttached) expect(map.seeAttached[k], k).toBeTruthy();
    }
  });

  it('fills the printed name but never a signature', () => {
    const m = buildFormModel(TYPICAL);
    expect(m.text.printed_name).toBe('Jordan A. Rivera');
    expect(m.text.name).toBe('Jordan A. Rivera');
  });

  it('builds the address, or the confidentiality notice instead', () => {
    expect(buildFormModel(TYPICAL).text.address).toBe('1450 Ocean Ave, Apt 4B, Brooklyn, NY 11230');
    const c = buildFormModel(CONFIDENTIAL);
    expect(c.text.address).toBe(CONFIDENTIAL_TEXT);
    expect(JSON.stringify(c)).not.toContain('Ocean Ave');
  });

  it('circles Petitioner or Respondent', () => {
    expect(buildFormModel(TYPICAL).circles).toEqual(['party_respondent']);
    expect(buildFormModel(CONFIDENTIAL).circles).toEqual(['party_petitioner']);
  });

  it('checks every checkbox across the two checkbox cases', () => {
    const all = new Set([...buildFormModel(EVERY_CHECKBOX_A).checks, ...buildFormModel(EVERY_CHECKBOX_B).checks]);
    expect([...all].sort()).toEqual(Object.keys(map.checks).sort());
  });

  it('does not check "My coverage includes" when there is no insurance', () => {
    const m = buildFormModel({ health_insurance: { coverage: ['none'], includes: ['medical'] } });
    expect(m.checks).toEqual(['cov_none']);
  });

  it('computes the expense total, or uses the person\'s own total', () => {
    expect(buildFormModel(TYPICAL).text.exp_total).toBe('4,720.75');
    expect(buildFormModel(SELF_EMPLOYED).text.exp_total).toBe('1,700');
  });

  it('prints "None" / "Not currently employed" where the person said so', () => {
    const m = buildFormModel(SELF_EMPLOYED);
    expect(m.text.employer).toBe('Not currently employed');
    expect(m.text.oi1_source).toBe('None');
    expect(m.text.cc_provider).toBe('None');
    expect(m.checks).toContain('self_employed_yes');
  });

  it('sends extra rows to attachment pages', () => {
    const m = buildFormModel(OVERFLOW);
    const titles = m.attach.map((a) => a.title);
    expect(titles).toEqual(expect.arrayContaining([
      'Other employers', 'Other income (continued)', 'Additional child support orders', 'Additional assets', 'Additional loans and debt',
    ]));
    expect(m.attach.find((a) => a.title === 'Other income (continued)').rows).toHaveLength(3);
    expect(m.attach.find((a) => a.title === 'Additional loans and debt').rows).toHaveLength(2);
    expect(m.attach.find((a) => a.title === 'Additional assets').rows).toHaveLength(3);
    expect(m.seeAttached.sort()).toEqual(['assets', 'debts', 'jobs', 'other_income', 'other_orders']);
  });
});

describe('PDF output', () => {
  it('fills every fixture without errors', async () => {
    for (const [name, a] of Object.entries(ALL_FIXTURES)) {
      const r = await fillForm(a);
      expect(r.bytes.length, name).toBeGreaterThan(10000);
      expect(r.warnings.filter((w) => w.startsWith('No position')), name).toEqual([]);
    }
  });

  it('empty case = the blank 3-page form', async () => {
    const r = await fillForm({});
    expect(r.pageCount).toBe(3);
    expect(r.attachmentPages).toBe(0);
  });

  it('adds attachment pages for overflow', async () => {
    const r = await fillForm(OVERFLOW);
    expect(r.attachmentPages).toBeGreaterThanOrEqual(1);
    expect(r.pageCount).toBe(3 + r.attachmentPages);
  });

  it('puts too-long entries on the attachment instead of shrinking them unreadably', async () => {
    const r = await fillForm(ALL_FIXTURES['max-length']);
    expect(r.warnings.some((w) => w.includes('employer_address'))).toBe(true);
    expect(r.attachmentPages).toBeGreaterThanOrEqual(1);
  });

  it('handles accented names', async () => {
    const r = await fillForm({ case_info: { full_name: 'José Núñez-Ødegård Łukasz' } });
    expect(r.warnings).toEqual([]);
  });

  it('produces a flat PDF with no fillable fields', async () => {
    const r = await fillForm(TYPICAL);
    const doc = await PDFDocument.load(r.bytes);
    expect(doc.getForm().getFields()).toHaveLength(0);
  });
});

describe('database copy of the field map', () => {
  it('migration 0003 matches forms/4-17a_2026-01.map.json', () => {
    const sql = readFileSync('supabase/migrations/0003_form_version_4-17a_2026-01.sql', 'utf8');
    const json = sql.match(/'(\{"form".*\})'::jsonb/)[1].replace(/''/g, "'");
    expect(JSON.parse(json)).toEqual(map);
  });
});
