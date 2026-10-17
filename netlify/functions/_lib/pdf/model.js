// Turns saved answers (one object per screen) into what goes on Form 4-17a.
// Pure function, no PDF code, so it can be unit-tested. Field keys match
// forms/4-17a_2026-01.map.json.
//
// Policies (owner-approved or flagged in README):
// * Signature and affirmation date are never filled.
// * "Print or type name" is filled from the legal name.
// * Confidential address prints "Confidential – see GF-21 application".
// * Where the person explicitly answered "none" / "no", we print "None" or check "No"
//   rather than leaving a sworn line ambiguous.

export const CONFIDENTIAL_TEXT = 'Confidential – see GF-21 application';

const PERIOD = { week: 'week', '2weeks': '2 weeks', month: 'month', year: 'year' };
export const periodText = (p) => PERIOD[p] || '';

export function money(v) {
  if (v === null || v === undefined) return '';
  const s = String(v).replace(/[$,\s]/g, '');
  if (s === '' || !/^\d+(\.\d{0,2})?$/.test(s)) return s === '' ? '' : String(v).trim();
  const n = Number(s);
  return n.toLocaleString('en-US', {
    minimumFractionDigits: Number.isInteger(n) ? 0 : 2,
    maximumFractionDigits: 2,
  });
}
const num = (v) => {
  const n = Number(String(v ?? '').replace(/[$,\s]/g, ''));
  return Number.isFinite(n) ? n : 0;
};
const t = (v) => (v === null || v === undefined ? '' : String(v).trim());
const join = (parts, sep = ', ') => parts.map(t).filter(Boolean).join(sep);
const amtPer = (mp) => (mp && t(mp.amount) ? `${money(mp.amount)}${mp.period ? ` per ${periodText(mp.period)}` : ''}` : '');

export const OTHER_INCOME_LABELS = {
  public_assistance: 'Public assistance', snap: 'SNAP', rent: 'Rent', tips: 'Tips',
  unemployment: 'Unemployment insurance', workers_comp: "Workers' compensation",
  ssd: 'Social Security Disability (SSD)', ssi: 'Supplemental Security Income (SSI)',
  pension: 'Pension / retirement', stipend: 'Fellowship / stipend / annuity',
  investment: 'Investment income', other: 'Other',
};
const OTHER_INCOME_ORDER = Object.keys(OTHER_INCOME_LABELS);

export const EXPENSE_KEYS = [
  'rent_mortgage', 'health_insurance', 'util_gas', 'util_electric', 'util_phone', 'util_other',
  'ins_life', 'ins_auto', 'ins_home', 'ins_other', 'trans_auto_payment', 'trans_gas', 'trans_public',
  'child_care', 'school', 'food', 'clothing', 'medical', 'contributions', 'other',
];

export function buildFormModel(answers = {}) {
  const text = {};
  const checks = [];
  const circles = [];
  const attach = [];        // { title, columns, rows }
  const seeAttached = new Set();
  const set = (k, v) => { const s = t(v); if (s) text[k] = s; };

  // ---- Case info ----
  const ci = answers.case_info || {};
  set('file_no', ci.file_no);
  set('docket_no', ci.docket_no);
  set('court_date', ci.court_date);
  set('name', ci.full_name);
  set('printed_name', ci.full_name);
  if (ci.party === 'petitioner') circles.push('party_petitioner');
  if (ci.party === 'respondent') circles.push('party_respondent');
  if (ci.confidential === 'yes') {
    set('address', CONFIDENTIAL_TEXT);
  } else {
    const line1 = join([ci.street, ci.apt ? (/^(apt|unit|#|suite)/i.test(t(ci.apt)) ? ci.apt : `Apt ${t(ci.apt)}`) : '']);
    const line2 = join([ci.city, join([ci.state, ci.zip], ' ')]);
    set('address', join([line1, line2]));
  }

  // ---- Job income ----
  const job = answers.job_income || {};
  if (job.self_employed === 'yes') checks.push('self_employed_yes');
  if (job.self_employed === 'no') checks.push('self_employed_no');
  if (job.has_job === 'yes') {
    set('employer', job.employer);
    set('hours_per_week', job.hours_per_week);
    set('employer_address', job.employer_address);
    const others = (job.other_jobs || []).filter((j) => t(j.employer) || t(j.address) || t(j.hours));
    if (others.length) {
      seeAttached.add('jobs');
      attach.push({
        title: 'Other employers',
        columns: ['Employer', 'Address', 'Hours per week'],
        rows: others.map((j) => [t(j.employer), t(j.address), t(j.hours)]),
      });
    }
  } else if (job.has_job === 'no') {
    set('employer', 'Not currently employed');
  }
  if (job.gross) { set('gross_amount', money(job.gross.amount)); set('gross_period', periodText(job.gross.period)); }
  if (job.takehome) { set('takehome_amount', money(job.takehome.amount)); set('takehome_period', periodText(job.takehome.period)); }

  // ---- Other income ----
  const oi = answers.other_income?.sources || { selected: [] };
  const selected = OTHER_INCOME_ORDER.filter((k) => (oi.selected || []).includes(k));
  const incomeRows = selected.map((k) => {
    const d = oi.details?.[k] || {};
    return { amount: money(d.amount), period: periodText(d.period), source: join([OTHER_INCOME_LABELS[k], d.source], ' – ') };
  });
  incomeRows.slice(0, 3).forEach((r, i) => {
    set(`oi${i + 1}_amount`, r.amount); set(`oi${i + 1}_period`, r.period); set(`oi${i + 1}_source`, r.source);
  });
  if (incomeRows.length > 3) {
    seeAttached.add('other_income');
    attach.push({ title: 'Other income (continued)', columns: ['Amount', 'Per', 'Source'],
      rows: incomeRows.slice(3).map((r) => [r.amount ? `$${r.amount}` : '', r.period, r.source]) });
  }
  if (!selected.length && (oi.selected || []).includes('none')) set('oi1_source', 'None');

  // ---- Household ----
  const hh = answers.household || {};
  set('household_others', hh.others);
  if (hh.others && hh.others !== '0' && hh.household_income) {
    set('household_amount', money(hh.household_income.amount));
    set('household_period', periodText(hh.household_income.period));
  }

  // ---- Other support orders ----
  const os = answers.other_support || {};
  if (os.paying_other === 'yes') {
    checks.push('other_orders_yes');
    const orders = (os.orders || []).filter((o) => t(o.to_whom) || t(o.amount?.amount));
    if (orders[0]) { set('support_amount', amtPer(orders[0].amount)); set('support_to_whom', orders[0].to_whom); }
    if (orders.length > 1) {
      seeAttached.add('other_orders');
      attach.push({ title: 'Additional child support orders', columns: ['Amount', 'Paid to'],
        rows: orders.slice(1).map((o) => [amtPer(o.amount) ? `$${amtPer(o.amount)}` : '', t(o.to_whom)]) });
    }
  } else if (os.paying_other === 'no') {
    checks.push('other_orders_no');
  }

  // ---- Health insurance ----
  const h = answers.health_insurance || {};
  for (const c of h.coverage || []) if (['job', 'private', 'medicaid', 'medicare', 'none'].includes(c)) checks.push(`cov_${c}`);
  if (!(h.coverage || []).includes('none')) {
    for (const c of h.includes || []) if (['medical', 'dental', 'vision', 'prescription'].includes(c)) checks.push(`inc_${c}`);
    set('plan_name', h.plan_name);
    set('policy_no', h.policy_no);
  }
  if (h.family_cost) { set('family_amount', money(h.family_cost.amount)); set('family_period', periodText(h.family_cost.period)); }
  if (h.individual_cost) { set('individual_amount', money(h.individual_cost.amount)); set('individual_period', periodText(h.individual_cost.period)); }
  const KIDS = { my_plan: 'kids_my_plan', other_parent: 'kids_other_parent', chp: 'kids_chp', medicaid: 'kids_medicaid', other: 'kids_other' };
  for (const c of h.children_covered_by || []) if (KIDS[c]) checks.push(KIDS[c]);
  if ((h.children_covered_by || []).includes('other')) set('children_other', h.children_other);

  // ---- Child care ----
  const cc = answers.child_care || {};
  if (cc.has_child_care === 'yes') {
    set('cc_provider', cc.provider);
    set('cc_hours', cc.hours_per_week);
    if (cc.cost) { set('cc_amount', money(cc.cost.amount)); set('cc_period', periodText(cc.cost.period)); }
  } else if (cc.has_child_care === 'no') {
    set('cc_provider', 'None');
  }

  // ---- Assets ----
  const a = answers.assets || {};
  const nonEmpty = (list) => (list || []).filter((it) => Object.values(it || {}).some((v) => t(v)));
  const savings = nonEmpty(a.savings), checking = nonEmpty(a.checking), vehicles = nonEmpty(a.vehicles);
  const homes = nonEmpty(a.homes), otherAssets = nonEmpty(a.other_assets);
  if (savings[0]) { set('savings_bank', savings[0].bank); set('savings_balance', money(savings[0].balance)); }
  if (checking[0]) { set('checking_bank', checking[0].bank); set('checking_balance', money(checking[0].balance)); }
  if (vehicles[0]) { set('auto_year', vehicles[0].year); set('auto_make', vehicles[0].make); set('auto_model', vehicles[0].model); set('auto_value', money(vehicles[0].value)); }
  if (homes[0]) { set('home_address', homes[0].address); set('home_value', money(homes[0].market_value)); set('home_mortgage', money(homes[0].mortgage)); }
  otherAssets.slice(0, 2).forEach((o, i) => { set(`oa${i + 1}_details`, o.details); set(`oa${i + 1}_value`, money(o.value)); });
  const extraAssets = [
    ...savings.slice(1).map((s) => ['Savings account', t(s.bank), money(s.balance)]),
    ...checking.slice(1).map((s) => ['Checking account', t(s.bank), money(s.balance)]),
    ...vehicles.slice(1).map((v) => ['Vehicle', join([v.year, v.make, v.model], ' '), money(v.value)]),
    ...homes.slice(1).map((ho) => ['Home owned', `${t(ho.address)}${t(ho.mortgage) ? ` (mortgage $${money(ho.mortgage)})` : ''}`, money(ho.market_value)]),
    ...otherAssets.slice(2).map((o) => ['Other asset', t(o.details), money(o.value)]),
  ];
  if (extraAssets.length) {
    seeAttached.add('assets');
    attach.push({ title: 'Additional assets', columns: ['Type', 'Details', 'Value'],
      rows: extraAssets.map(([ty, d, v]) => [ty, d, v ? `$${v}` : '']) });
  }

  // ---- Monthly expenses ----
  const e = answers.expenses || {};
  for (const k of EXPENSE_KEYS) set(`exp_${k}`, money(e[k]));
  set('exp_util_other_label', e.util_other_label);
  set('exp_ins_other_label', e.ins_other_label);
  set('exp_other_label', e.other_label);
  const anyExpense = EXPENSE_KEYS.some((k) => t(e[k]));
  const computedTotal = Math.round(EXPENSE_KEYS.reduce((s, k) => s + num(e[k]), 0) * 100) / 100;
  if (e.total_custom && t(e.total)) set('exp_total', money(e.total));
  else if (anyExpense) set('exp_total', money(computedTotal.toFixed(2)));

  // ---- Loans and debt ----
  const debts = nonEmpty(answers.debts?.debts);
  debts.slice(0, 2).forEach((d, i) => {
    const n = i + 1;
    set(`debt${n}_owed_to`, d.owed_to); set(`debt${n}_for`, d.for);
    set(`debt${n}_balance`, money(d.balance)); set(`debt${n}_payment`, money(d.payment));
    if (d.frequency === 'monthly') checks.push(`debt${n}_monthly`);
    if (d.frequency === 'weekly') checks.push(`debt${n}_weekly`);
  });
  if (debts.length > 2) {
    seeAttached.add('debts');
    attach.push({ title: 'Additional loans and debt', columns: ['Owed to', 'For', 'Balance', 'Payment'],
      rows: debts.slice(2).map((d) => [t(d.owed_to), t(d.for), d.balance ? `$${money(d.balance)}` : '',
        d.payment ? `$${money(d.payment)}${d.frequency ? ` ${d.frequency}` : ''}` : '']) });
  }

  return { text, checks, circles, attach, seeAttached: [...seeAttached], computedTotal };
}
