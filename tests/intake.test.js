import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { FLAG_TYPES, RED_FLAG_QUESTIONS } from '../src/content/redFlags.js';
import { HELP } from '../src/content/help.js';
import { EXPENSE_FIELDS, FLOW, SCREENS } from '../src/content/screens.js';
import { buildChecklist, checklistComplete } from '../src/lib/checklist.js';
import { emptyScreen, hydrate, isVisible, moneyError, parseMoney, sumFields, toggleChoice } from '../src/lib/formLogic.js';

describe('money parsing', () => {
  it('accepts common formats', () => {
    expect(parseMoney('1,234.50')).toBe(1234.5);
    expect(parseMoney('$ 250')).toBe(250);
    expect(parseMoney('')).toBe(null);
    expect(Number.isNaN(parseMoney('12a'))).toBe(true);
    expect(Number.isNaN(parseMoney('1.234'))).toBe(true);
    expect(Number.isNaN(parseMoney('-5'))).toBe(true);
  });
  it('explains bad input in plain words', () => {
    expect(moneyError('abc')).toMatch(/dollar amount/);
    expect(moneyError('250')).toBe('');
  });
  it('totals expenses, ignoring blanks and junk', () => {
    expect(sumFields({ food: '400', clothing: '50.25', other: 'x', rent_mortgage: '' }, EXPENSE_FIELDS)).toBe(450.25);
  });
});

describe('checkbox logic', () => {
  const opts = [{ value: 'a' }, { value: 'b' }, { value: 'none', exclusive: true }];
  it('"none" clears the others, and others clear "none"', () => {
    expect(toggleChoice(['a', 'b'], 'none', opts)).toEqual(['none']);
    expect(toggleChoice(['none'], 'a', opts)).toEqual(['a']);
    expect(toggleChoice(['a'], 'a', opts)).toEqual([]);
  });
});

describe('screen definitions', () => {
  it('every flow step has a page', () => {
    const custom = ['safety', 'documents', 'for-you', 'documents-final', 'review'];
    for (const s of FLOW) expect(custom.includes(s) || SCREENS[s]).toBeTruthy();
  });
  it('server step list matches the app flow', () => {
    const src = readFileSync('netlify/functions/cases.js', 'utf8');
    const list = JSON.parse(src.match(/const STEPS = (\[[\s\S]*?\]);/)[1].replace(/'/g, '"'));
    expect(list).toEqual(FLOW);
  });
  it('every section is one the server accepts', () => {
    const src = readFileSync('netlify/functions/_lib/sections.js', 'utf8');
    for (const s of Object.values(SCREENS)) expect(src).toContain(`'${s.section}'`);
    for (const s of ['red_flags', 'doc_checklist']) expect(src).toContain(`'${s}'`);
  });
  it('field names are unique within each screen', () => {
    for (const s of Object.values(SCREENS)) {
      const names = s.fields.filter((f) => f.name).map((f) => f.name);
      expect(new Set(names).size).toBe(names.length);
    }
  });
  it('every help topic referenced exists', () => {
    const walk = (fs) => fs.flatMap((f) => [f.help, ...(f.fields ? walk(f.fields) : [])]).filter(Boolean);
    for (const s of Object.values(SCREENS)) for (const h of walk(s.fields)) expect(HELP[h], h).toBeTruthy();
  });
  it('covers every required help topic from the spec', () => {
    for (const k of ['gross_vs_takehome', 'irregular_pay', 'self_employment', 'cash_tips', 'other_income',
      'gifts_family_help', 'household_contributions', 'other_support_orders', 'insurance_not_enrolled',
      'family_vs_individual', 'children_coverage']) expect(HELP[k], k).toBeTruthy();
  });
  it('builds empty data and keeps saved answers', () => {
    const e = emptyScreen(SCREENS.job.fields);
    expect(e.gross).toEqual({ amount: '', period: '' });
    expect(hydrate(SCREENS.job.fields, { employer: 'X' }).employer).toBe('X');
  });
  it('hides the address when confidentiality is requested', () => {
    const street = SCREENS.info.fields.find((f) => f.name === 'street');
    expect(isVisible(street, { confidential: 'yes' })).toBe(false);
    expect(isVisible(street, { confidential: 'no' })).toBe(true);
    expect(isVisible(street, { confidential: 'prefer_not' })).toBe(true);
  });
  it('expense lines match the form (1/2026)', () => {
    expect(EXPENSE_FIELDS).toEqual(expect.arrayContaining([
      'rent_mortgage', 'health_insurance', 'util_gas', 'util_electric', 'util_phone', 'util_other',
      'ins_life', 'ins_auto', 'ins_home', 'ins_other', 'trans_auto_payment', 'trans_gas', 'trans_public',
      'child_care', 'school', 'food', 'clothing', 'medical', 'contributions', 'other',
    ]));
    expect(EXPENSE_FIELDS).toHaveLength(21);
  });
});

describe('red flags', () => {
  it('has the 9 spec questions plus free text, all with "Prefer not to say"', () => {
    expect(RED_FLAG_QUESTIONS).toHaveLength(9);
    for (const q of RED_FLAG_QUESTIONS) expect(q.options.some((o) => o.value === 'prefer_not')).toBe(true);
  });
  it('server accepts exactly the flag types the app logs', () => {
    const src = readFileSync('netlify/functions/red-flags.js', 'utf8');
    for (const t of FLAG_TYPES) expect(src).toContain(`'${t}'`);
  });
  it('never triggers on "Prefer not to say"', () => {
    for (const q of RED_FLAG_QUESTIONS) expect(q.triggers).not.toContain('prefer_not');
  });
});

describe('document checklist', () => {
  it('has the six documents named on the form', () => {
    expect(buildChecklist({})).toHaveLength(6);
  });
  it('adds orders, receipts and insurance proof based on answers', () => {
    const keys = buildChecklist({
      other_support: { paying_other: 'yes' },
      child_care: { has_child_care: 'yes' },
      health_insurance: { coverage: ['none'] },
    }).map((d) => d.key);
    expect(keys).toEqual(expect.arrayContaining(['support_orders', 'child_care_receipts', 'insurance_available']));
  });
  it('is complete only when every item is marked', () => {
    const status = Object.fromEntries(buildChecklist({}).map((d) => [d.key, 'have']));
    expect(checklistComplete({ doc_checklist: { status } })).toBe(true);
    expect(checklistComplete({ doc_checklist: { status }, child_care: { has_child_care: 'yes' } })).toBe(false);
    status.tax_returns = undefined;
    expect(checklistComplete({ doc_checklist: { status } })).toBe(false);
  });
});
