import { describe, expect, it } from 'vitest';
import { rasterize } from '../netlify/functions/_lib/pdf/raster.js';
import { fillForm } from '../netlify/functions/_lib/pdf/fill.js';
import { monthly, reviewChecks } from '../src/lib/reviewChecks.js';
import { TYPICAL } from './pdf/fixtures.js';

const texts = (a) => reviewChecks(a).map((c) => c.text).join(' | ');
const levels = (a, lvl) => reviewChecks(a).filter((c) => c.level === lvl);

describe('review checks', () => {
  it('converts to monthly', () => {
    expect(monthly({ amount: '1200', period: 'week' })).toBeCloseTo(5200);
    expect(monthly({ amount: '1200', period: 'year' })).toBe(100);
    expect(monthly({ amount: '', period: 'week' })).toBe(null);
  });

  it('a complete typical case has nothing to fix', () => {
    expect(levels(TYPICAL, 'fix')).toEqual([]);
  });

  it('flags required items on an empty case', () => {
    const t = texts({});
    expect(t).toMatch(/legal name is missing/);
    expect(t).toMatch(/Petitioner or the Respondent/);
    expect(t).toMatch(/self-employed/);
  });

  it('catches take-home higher than gross, across different periods', () => {
    const a = { ...TYPICAL, job_income: { ...TYPICAL.job_income, gross: { amount: '1000', period: 'week' }, takehome: { amount: '5000', period: 'month' } } };
    expect(texts(a)).toMatch(/Take-home income is higher than gross/);
    const ok = { ...TYPICAL, job_income: { ...TYPICAL.job_income, gross: { amount: '1000', period: 'week' }, takehome: { amount: '3000', period: 'month' } } };
    expect(texts(ok)).not.toMatch(/higher than gross/);
  });

  it('catches an amount without "how often"', () => {
    const a = { ...TYPICAL, job_income: { ...TYPICAL.job_income, gross: { amount: '900', period: '' } } };
    expect(texts(a)).toMatch(/Gross income: choose how often/);
  });

  it('does not ask for an address when confidentiality was requested', () => {
    const a = { ...TYPICAL, case_info: { ...TYPICAL.case_info, confidential: 'yes', street: '', city: '' } };
    expect(texts(a)).not.toMatch(/address is incomplete/);
  });

  it('notices a typed total that does not match', () => {
    const a = { ...TYPICAL, expenses: { ...TYPICAL.expenses, total_custom: true, total: '100' } };
    expect(texts(a)).toMatch(/total you typed doesn't match/);
  });

  it('notices child care cost differing from the expense line', () => {
    const a = { ...TYPICAL, expenses: { ...TYPICAL.expenses, child_care: '200' } };
    expect(texts(a)).toMatch(/child care expense line is different/);
    expect(texts(TYPICAL)).not.toMatch(/child care expense line/);
  });

  it('never uses advice-like wording', () => {
    const all = texts({}) + texts(TYPICAL);
    expect(all).not.toMatch(/you should (enter|report|lower|raise)|reduce your|increase your/i);
  });
});

describe('preview images', () => {
  it('renders every page to PNG with no PDF in the output', async () => {
    const { bytes } = await fillForm(TYPICAL, { watermark: true });
    const pages = await rasterize(bytes);
    expect(pages).toHaveLength(3);
    for (const p of pages) {
      expect(p.png.subarray(1, 4).toString()).toBe('PNG');
      expect(p.png.includes(Buffer.from('%PDF'))).toBe(false);
      expect(p.width).toBeGreaterThan(800);
    }
  });
});
