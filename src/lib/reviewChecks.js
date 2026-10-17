// Consistency checks for the review screen (spec Section 4, step 9). Pure function.
// Checks never block the person; they point to something worth a second look.
// level: 'fix'   — very likely a mistake or a required blank
//        'check' — may be fine, but worth confirming
// Wording rule: describe what we noticed; never suggest what number to enter.
import { checklistComplete } from './checklist.js';
import { parseMoney, sumFields } from './formLogic.js';
import { EXPENSE_FIELDS } from '../content/screens.js';

const PER_MONTH = { week: 52 / 12, '2weeks': 26 / 12, month: 1, year: 1 / 12 };

export function monthly(mp) {
  if (!mp) return null;
  const n = parseMoney(mp.amount);
  if (n === null || Number.isNaN(n) || !PER_MONTH[mp.period]) return null;
  return n * PER_MONTH[mp.period];
}

const hasAmount = (mp) => mp && String(mp.amount ?? '').trim() !== '';
const bad = (v) => Number.isNaN(parseMoney(v));

export function reviewChecks(a = {}) {
  const out = [];
  const add = (level, step, text) => out.push({ level, step, text });

  // ---- Case info ----
  const ci = a.case_info || {};
  if (!String(ci.full_name || '').trim()) add('fix', 'info', 'Your full legal name is missing.');
  if (!ci.party) add('fix', 'info', 'Choose whether you are the Petitioner or the Respondent.');
  if (ci.confidential !== 'yes' && !(ci.street && ci.city)) add('fix', 'info', 'Your home address is incomplete.');
  if (!ci.docket_no && !ci.file_no) add('check', 'info', 'No File # or Docket # yet. That\'s fine if you don\'t have court papers — the court can fill these in.');

  // ---- Job income ----
  const job = a.job_income || {};
  if (!job.self_employed) add('fix', 'job', 'Answer whether you are self-employed.');
  if (job.self_employed === 'yes') add('check', 'job', 'You said you are self-employed. The court\'s long form (4-17) may fit better. Consider legal advice before filing.');
  if (job.has_job === 'yes' && !hasAmount(job.gross)) add('fix', 'job', 'You said you work for an employer, but gross income is blank.');
  for (const [k, label] of [['gross', 'Gross income'], ['takehome', 'Take-home income']]) {
    const mp = job[k];
    if (hasAmount(mp) && !mp.period) add('fix', 'job', `${label}: choose how often (per week, per month…).`);
    if (mp && bad(mp.amount)) add('fix', 'job', `${label} isn't a dollar amount.`);
  }
  const g = monthly(job.gross), t = monthly(job.takehome);
  if (g !== null && t !== null && t > g + 0.5) add('fix', 'job', 'Take-home income is higher than gross income. Take-home is usually the smaller number — please double-check both.');
  if (hasAmount(job.gross) && !hasAmount(job.takehome)) add('check', 'job', 'Gross income is filled in, but take-home income is blank.');

  // ---- Other income ----
  const oi = a.other_income?.sources;
  if (!oi || !(oi.selected || []).length) add('check', 'other-income', 'You haven\'t answered the other income question. If you have none, choose "I don\'t have any other income."');
  for (const k of (oi?.selected || []).filter((s) => s !== 'none')) {
    const d = oi.details?.[k] || {};
    if (!String(d.amount || '').trim()) add('fix', 'other-income', 'One of the other income types you checked has no amount.');
    else if (!d.period) add('fix', 'other-income', 'One of your other income amounts is missing how often.');
    if (bad(d.amount)) add('fix', 'other-income', 'One of your other income amounts isn\'t a dollar amount.');
  }

  // ---- Household ----
  const hh = a.household || {};
  if (hh.others === undefined || hh.others === '') add('fix', 'household', 'Enter how many other people live with you (0 if none).');
  if (hasAmount(hh.household_income) && !hh.household_income.period) add('fix', 'household', 'Household members\' income: choose how often.');

  // ---- Other support orders ----
  const os = a.other_support || {};
  if (!os.paying_other) add('fix', 'other-orders', 'Answer whether you pay child support under any other order.');
  if (os.paying_other === 'yes' && !(os.orders || []).some((o) => o.to_whom || o.amount?.amount)) {
    add('fix', 'other-orders', 'You said you pay other support orders, but none are listed.');
  }

  // ---- Health insurance ----
  const h = a.health_insurance || {};
  if (!(h.coverage || []).length) add('fix', 'health', 'Choose what health insurance you have (or that you have none).');
  if ((h.coverage || []).some((c) => c !== 'none') && !h.plan_name) add('check', 'health', 'Insurance plan name is blank.');
  for (const [k, label] of [['family_cost', 'Family plan cost'], ['individual_cost', 'Individual plan cost']]) {
    if (hasAmount(h[k]) && !h[k].period) add('fix', 'health', `${label}: choose how often.`);
  }
  if (!(h.children_covered_by || []).length) add('check', 'health', 'You haven\'t said who covers the children\'s health insurance.');

  // ---- Child care ----
  const cc = a.child_care || {};
  if (!cc.has_child_care) add('fix', 'child-care', 'Answer whether you pay for child care.');
  if (cc.has_child_care === 'yes' && !hasAmount(cc.cost)) add('fix', 'child-care', 'You said you pay for child care, but the cost is blank.');
  if (cc.has_child_care === 'yes' && hasAmount(cc.cost) && !cc.cost.period) add('fix', 'child-care', 'Child care cost: choose how often.');

  // ---- Expenses ----
  const e = a.expenses || {};
  const computed = sumFields(e, EXPENSE_FIELDS);
  if (EXPENSE_FIELDS.some((k) => bad(e[k]))) add('fix', 'expenses', 'One of your expenses isn\'t a dollar amount.');
  if (computed === 0 && !e.total) add('check', 'expenses', 'No monthly expenses are filled in.');
  if (e.total_custom) {
    const typed = parseMoney(e.total);
    if (typeof typed === 'number' && !Number.isNaN(typed) && Math.abs(typed - computed) >= 0.01) {
      add('check', 'expenses', 'The total you typed doesn\'t match the expense lines added together.');
    }
  }
  const ccMonthly = monthly(cc.cost);
  const ccLine = parseMoney(e.child_care);
  if (ccMonthly && typeof ccLine === 'number' && !Number.isNaN(ccLine) && Math.abs(ccMonthly - ccLine) > Math.max(25, ccMonthly * 0.15)) {
    add('check', 'expenses', 'The child care expense line is different from the child care cost you entered earlier (converted to monthly). Please check both.');
  }
  const incomeMonthly = (t ?? g ?? 0) + (oi?.selected || []).reduce((s, k) => s + (monthly(oi.details?.[k]) || 0), 0);
  if (incomeMonthly > 0 && computed > incomeMonthly * 1.5) {
    add('check', 'expenses', 'Your monthly expenses are much higher than the income you listed. That can happen — just make sure both sections are complete.');
  }

  // ---- Debts ----
  for (const d of a.debts?.debts || []) {
    if ((d.balance || d.payment) && !d.owed_to) add('fix', 'debts', 'A debt is missing who it\'s owed to.');
    if (d.payment && !d.frequency) add('fix', 'debts', 'A debt payment is missing monthly or weekly.');
    if (bad(d.balance) || bad(d.payment)) add('fix', 'debts', 'A debt amount isn\'t a dollar amount.');
  }

  // ---- Documents ----
  if (!checklistComplete(a)) add('check', 'documents-final', 'Your document checklist isn\'t finished. You\'ll need to finish it before downloading the final form.');

  // de-duplicate identical messages
  const seen = new Set();
  return out.filter((c) => { const k = c.step + c.text; if (seen.has(k)) return false; seen.add(k); return true; });
}
