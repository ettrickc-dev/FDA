// Pure helpers shared by the screen engine (no React), so they can be unit-tested.

export const PERIODS = [
  ['week', 'week'],
  ['2weeks', '2 weeks'],
  ['month', 'month'],
  ['year', 'year'],
];
export const periodLabel = (p) => (PERIODS.find(([v]) => v === p) || [null, ''])[1];

// Accepts "1,234.50", a leading dollar sign, and spaces; returns null for blank, NaN for junk.
export function parseMoney(v) {
  if (v === null || v === undefined) return null;
  const s = String(v).replace(/[$,\s]/g, '');
  if (s === '') return null;
  if (!/^\d+(\.\d{0,2})?$/.test(s)) return NaN;
  return Number(s);
}

export function moneyError(v) {
  const n = parseMoney(v);
  if (n === null) return '';
  if (Number.isNaN(n)) return 'Enter a dollar amount, like 250 or 1250.50';
  if (n > 10_000_000) return 'That number looks too large. Please check it.';
  return '';
}

export function formatMoney(n) {
  if (n === null || n === undefined || Number.isNaN(n)) return '';
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Sum of the named money fields in data (blank and invalid entries count as 0).
export function sumFields(data, names) {
  let total = 0;
  for (const n of names) {
    const v = parseMoney(data?.[n]);
    if (typeof v === 'number' && !Number.isNaN(v)) total += v;
  }
  return Math.round(total * 100) / 100;
}

export function isVisible(field, data) {
  return typeof field.showIf === 'function' ? !!field.showIf(data || {}) : true;
}

// Toggle a value in a checkbox array, honoring "exclusive" options like "none".
export function toggleChoice(current, value, options) {
  const list = Array.isArray(current) ? [...current] : [];
  const opt = options.find((o) => o.value === value);
  if (list.includes(value)) return list.filter((v) => v !== value);
  if (opt?.exclusive) return [value];
  const exclusive = new Set(options.filter((o) => o.exclusive).map((o) => o.value));
  return [...list.filter((v) => !exclusive.has(v)), value];
}

// Default (empty) value for a field, used when building a screen's initial data.
export function emptyValue(field) {
  switch (field.type) {
    case 'checkboxes': return [];
    case 'list': return [];
    case 'moneyPeriod': return { amount: '', period: '' };
    case 'checklistDetails': return { selected: [], details: {} };
    case 'notice': case 'heading': case 'total': return undefined;
    default: return '';
  }
}

export function emptyScreen(fields) {
  const out = {};
  for (const f of fields) {
    if (!f.name) continue;
    const v = emptyValue(f);
    if (v !== undefined) out[f.name] = v;
  }
  return out;
}

// Merge saved data over defaults, without dropping unknown saved keys.
export function hydrate(fields, saved) {
  return { ...emptyScreen(fields), ...(saved || {}) };
}
