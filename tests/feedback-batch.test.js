import { describe, expect, it, vi } from 'vitest';
vi.mock('../src/lib/supabase.js', () => ({ supabase: {} }));
import { courtDateFromSetup, effectiveExpenses } from '../netlify/functions/_lib/pdf/model.js';
import { countdownText, daysUntil } from '../src/lib/courtDate.js';
import { activeExpenseFields } from '../src/content/screens.js';

describe('combined gas + electric bill', () => {
  it('puts the combined amount on Electric and notes it on Gas', () => {
    const e = effectiveExpenses({ util_combined: 'yes', util_gas_electric: '180', util_gas: '50', util_electric: '90' });
    expect(e.util_electric).toBe('180');
    expect(e.util_gas).toBe('');
    expect(e.util_gas_note).toBe('incl. in Electric');
  });
  it('leaves separate bills alone', () => {
    const src = { util_combined: 'no', util_gas: '50', util_electric: '90' };
    expect(effectiveExpenses(src)).toBe(src);
  });
  it('totals never count the bill twice', () => {
    const f = activeExpenseFields({ util_combined: 'yes' });
    expect(f).toContain('util_gas_electric');
    expect(f).not.toContain('util_gas');
    expect(f).not.toContain('util_electric');
    const g = activeExpenseFields({});
    expect(g).not.toContain('util_gas_electric');
    expect(g).toEqual(expect.arrayContaining(['util_gas', 'util_electric']));
  });
});

describe('court date', () => {
  it('prints the setup date on the form', () => {
    expect(courtDateFromSetup({ next_court_date: '2026-11-03' })).toBe('Nov 3, 2026');
    expect(courtDateFromSetup({ next_court_date: '2026-11-03', no_court_date: true })).toBe('');
    expect(courtDateFromSetup({ next_court_date: 'soon' })).toBe('');
  });
  it('counts days and picks a tone', () => {
    const now = new Date(2026, 9, 17, 15, 0);
    expect(daysUntil('2026-10-17', now)).toBe(0);
    expect(daysUntil('2026-10-27', now)).toBe(10);
    expect(daysUntil('bad', now)).toBeNull();
    expect(countdownText('2026-10-16', now).tone).toBe('past');
    expect(countdownText('2026-10-18', now).text).toMatch(/tomorrow/);
    expect(countdownText('2026-10-22', now).tone).toBe('urgent');
    expect(countdownText('2026-11-30', now).tone).toBe('soon');
  });
});
