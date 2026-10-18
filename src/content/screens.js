// Intake screen definitions (spec Section 5), matched to Form 4-17a (1/2026).
// Each screen saves to one encrypted answers row named by `section`.
// Field `name`s are referenced by the PDF field map (build step 4) — rename with care.

import { NY_COUNTIES } from '../config.js';

const YES_NO = [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }];

// Why the form matters (FCA § 424-a). ATTORNEY TO REVIEW — checked against the statute Oct 2026.
export const MANDATORY_NOTICE = [
  'This form is required. Under Family Court Act § 424-a, both parents must give the court a sworn financial statement, a recent pay stub, and their latest tax returns. The court cannot waive this.',
  'If the Respondent doesn\'t provide it without a good reason, the court must either grant what the petition asks for, or stop the Respondent from giving evidence about what they can afford to pay. If the Petitioner doesn\'t provide it, the court may postpone the case until it is filed.',
  'It is a sworn statement, so take the time to get every answer right the first time.',
];

// ---------------- Case setup (user flow step 4) ----------------
export const CASE_SETUP = {
  section: 'case_setup',
  title: 'About your situation',
  intro: 'These questions help us show you information that fits your situation. Only your court date goes on the form.',
  fields: [
    { type: 'notice', tone: 'caution', text: MANDATORY_NOTICE },
    { type: 'date', name: 'next_court_date', label: 'When is your next court date?', optional: true,
      hint: 'It is on the papers you got from the court. We\'ll show how many days you have left on every screen.',
      showIf: (d) => !d.no_court_date },
    { type: 'checkbox', name: 'no_court_date', label: 'I don\'t have a court date yet' },
    { type: 'radio', name: 'role', label: 'Are you paying child support or receiving it?',
      options: [
        { value: 'payor', label: 'Paying (or may be asked to pay)' },
        { value: 'payee', label: 'Receiving (or asking to receive)' },
        { value: 'unsure', label: 'Not sure yet' },
      ] },
    { type: 'radio', name: 'case_type', label: 'What kind of case is this?',
      options: [
        { value: 'new', label: 'A new request for child support' },
        { value: 'modification', label: 'Changing an existing order (modification)' },
        { value: 'enforcement', label: 'Enforcing an order that is not being paid (enforcement / violation)' },
        { value: 'unsure', label: 'Not sure' },
      ] },
    { type: 'radio', name: 'existing_order', label: 'Is there already a child support order between you and the other parent?',
      options: [...YES_NO, { value: 'unsure', label: 'Not sure' }] },
    { type: 'radio', name: 'relationship', label: 'Were you and the other parent ever married?',
      options: [
        { value: 'married', label: 'Married now' },
        { value: 'divorced', label: 'Divorced' },
        { value: 'never', label: 'Never married' },
      ] },
    { type: 'radio', name: 'goal', label: 'What matters most to you right now?',
      options: [
        { value: 'fair', label: 'Getting to a fair amount' },
        { value: 'reduce', label: 'Lowering the amount' },
        { value: 'increase', label: 'Raising the amount' },
        { value: 'understand', label: 'Understanding my options' },
      ] },
  ],
  // Copy routing answers onto the case row (non-sensitive, used for recommendations).
  casePatch: (d) => ({
    role: d.role || null, case_type: d.case_type || null, goal: d.goal || null,
    next_court_date: !d.no_court_date && /^\d{4}-\d{2}-\d{2}$/.test(d.next_court_date || '') ? d.next_court_date : null,
  }),
};

// ---------------- Screen 1: Case info ----------------
export const CASE_INFO = {
  section: 'case_info',
  title: 'Case information',
  eyebrow: 'Form · Part 1 of 10',
  fields: [
    { type: 'select', name: 'county', label: 'County where your case is', options: NY_COUNTIES, placeholder: 'Choose a county' },
    { type: 'radio', name: 'party', label: 'In this case, are you the Petitioner or the Respondent?',
      hint: 'The Petitioner is the person who started the case. The Respondent is the other person. Your court papers say which you are.',
      options: [{ value: 'petitioner', label: 'Petitioner' }, { value: 'respondent', label: 'Respondent' }] },
    { type: 'text', name: 'full_name', label: 'Your full legal name', maxLength: 120,
      hint: 'This also goes on the "Print or type name" line under your signature.' },
    { type: 'heading', text: 'Court papers (optional)' },
    { type: 'notice', text: 'You can find these on the papers you got from the court. Leave them blank if you don\'t have them.' },
    { type: 'text', name: 'file_no', label: 'File #', optional: true, maxLength: 40 },
    { type: 'text', name: 'docket_no', label: 'Docket #', optional: true, maxLength: 40 },
    { type: 'text', name: 'court_date', label: 'Next court date, time, and part', optional: true, maxLength: 80,
      placeholder: 'e.g. Nov 3, 9:30 AM, Part 4',
      hint: 'If you leave this blank, we\'ll use the court date from "Your situation".' },
    { type: 'heading', text: 'Your address' },
    { type: 'radio', name: 'confidential',
      label: 'Would sharing your home address with the other parent put your health, safety, or freedom at risk?',
      options: [...YES_NO, { value: 'prefer_not', label: 'Prefer not to say' }] },
    { type: 'notice', tone: 'safe', showIf: (d) => d.confidential === 'yes', text: [
      'You can ask the court to keep your address confidential under Family Court Act § 154-b, using forms GF-21 and GF-21a (available at nycourts.gov). The court decides whether to grant this request.',
      'Your form will say "Confidential – see GF-21 application" where your address would go. We won\'t ask for your address.',
      'If you are in danger right now, call 911.',
    ] },
    { type: 'text', name: 'street', label: 'Home street address', maxLength: 120, showIf: (d) => d.confidential !== 'yes' },
    { type: 'text', name: 'apt', label: 'Apartment or unit', optional: true, maxLength: 20, showIf: (d) => d.confidential !== 'yes' },
    { type: 'text', name: 'city', label: 'City', maxLength: 60, showIf: (d) => d.confidential !== 'yes' },
    { type: 'text', name: 'state', label: 'State', maxLength: 2, showIf: (d) => d.confidential !== 'yes' },
    { type: 'text', name: 'zip', label: 'ZIP code', maxLength: 10, inputMode: 'numeric', showIf: (d) => d.confidential !== 'yes' },
  ],
  defaults: { state: 'NY' },
  casePatch: (d) => ({ county: d.county || null, confidentiality_requested: d.confidential === 'yes' }),
};

// ---------------- Screen 2: Job income ----------------
export const JOB_INCOME = {
  section: 'job_income',
  title: 'Income from work',
  eyebrow: 'Form · Part 2 of 10',
  fields: [
    { type: 'radio', name: 'self_employed', label: 'Are you self-employed?', options: YES_NO, help: 'self_employment' },
    { type: 'notice', tone: 'caution', showIf: (d) => d.self_employed === 'yes', text: [
      'Business and self-employment income can be complicated, and this short form may not be the best fit. The court\'s longer form (Form 4-17) asks more detailed questions.',
      'You can keep going here, but you may want legal advice about which form to use.',
    ] },
    { type: 'radio', name: 'has_job', label: 'Do you work for an employer right now?', options: YES_NO },
    { type: 'text', name: 'employer', label: 'Employer name', maxLength: 80, showIf: (d) => d.has_job === 'yes',
      hint: 'If you have more than one job, list your main employer here. You can add others below.' },
    { type: 'text', name: 'employer_address', label: 'Employer address', maxLength: 140, showIf: (d) => d.has_job === 'yes' },
    { type: 'number', name: 'hours_per_week', label: 'Hours you work per week', maxLength: 3, showIf: (d) => d.has_job === 'yes' },
    { type: 'list', name: 'other_jobs', label: 'Other jobs', optional: true, itemLabel: 'Job', addLabel: 'Add another job',
      showIf: (d) => d.has_job === 'yes', formLines: 0,
      hint: 'These go on an extra page attached to your form.',
      fields: [
        { type: 'text', name: 'employer', label: 'Employer name', maxLength: 80 },
        { type: 'text', name: 'address', label: 'Employer address', maxLength: 140 },
        { type: 'number', name: 'hours', label: 'Hours per week', maxLength: 3 },
      ] },
    { type: 'moneyPeriod', name: 'gross', label: 'Gross income (all jobs)',
      hint: 'Before taxes and deductions.', help: 'gross_vs_takehome' },
    { type: 'moneyPeriod', name: 'takehome', label: 'Take-home income (all jobs)',
      hint: 'After taxes and deductions.', help: 'irregular_pay' },
    { type: 'notice', text: 'Cash work, tips, and side jobs are income too.', help: 'cash_tips' },
  ],
};

// ---------------- Screen 3: Other income ----------------
export const OTHER_INCOME_OPTIONS = [
  { value: 'public_assistance', label: 'Public assistance' },
  { value: 'snap', label: 'SNAP (food stamps)' },
  { value: 'rent', label: 'Rent you collect' },
  { value: 'tips', label: 'Tips' },
  { value: 'unemployment', label: 'Unemployment insurance benefits' },
  { value: 'workers_comp', label: "Workers' compensation" },
  { value: 'ssd', label: 'Social Security Disability (SSD)' },
  { value: 'ssi', label: 'Supplemental Security Income (SSI)' },
  { value: 'pension', label: 'Pensions and retirement benefits' },
  { value: 'stipend', label: 'Fellowships, stipends, or annuities' },
  { value: 'investment', label: 'Investment income' },
  { value: 'other', label: 'Other income' },
  { value: 'none', label: 'I don\'t have any other income', exclusive: true },
].map((o) => (o.exclusive ? o : { ...o, askSource: true, sourceLabel: o.value === 'other' ? 'What is it, and who pays it?' : 'Paid by (source)' }));

export const OTHER_INCOME = {
  section: 'other_income',
  title: 'Other income',
  eyebrow: 'Form · Part 3 of 10',
  intro: 'Money you get that is not from a job.',
  fields: [
    { type: 'checklistDetails', name: 'sources', label: 'Check each kind of income you get', options: OTHER_INCOME_OPTIONS,
      formLines: 3, help: 'other_income' },
  ],
};

// ---------------- Screen 4: Household ----------------
export const HOUSEHOLD = {
  section: 'household',
  title: 'Your household',
  eyebrow: 'Form · Part 4 of 10',
  fields: [
    { type: 'number', name: 'others', label: 'How many other people live with you?', maxLength: 2,
      hint: 'The form says "Me + ___ others." Enter 0 if you live alone.' },
    { type: 'moneyPeriod', name: 'household_income', label: 'Income from other household members', optional: true,
      hint: 'What other people in your home contribute.', help: 'household_contributions',
      showIf: (d) => d.others && d.others !== '0' },
    { type: 'notice', text: 'Getting regular help from family or friends?', help: 'gifts_family_help' },
  ],
};

// ---------------- Screen 5: Other support orders ----------------
export const OTHER_SUPPORT = {
  section: 'other_support',
  title: 'Other child support orders',
  eyebrow: 'Form · Part 5 of 10',
  fields: [
    { type: 'radio', name: 'paying_other', label: 'Are you paying child support under any other court order?',
      options: YES_NO, help: 'other_support_orders' },
    { type: 'list', name: 'orders', label: 'Your other orders', itemLabel: 'Order', addLabel: 'Add an order',
      formLines: 1, showIf: (d) => d.paying_other === 'yes',
      fields: [
        { type: 'moneyPeriod', name: 'amount', label: 'How much you pay' },
        { type: 'text', name: 'to_whom', label: 'Paid to whom', maxLength: 80 },
      ] },
    { type: 'notice', tone: 'caution', showIf: (d) => d.paying_other === 'yes',
      text: 'Attach a copy of every support order to your form. We\'ve added this to your document checklist.' },
  ],
};

// ---------------- Screen 6: Health insurance ----------------
export const HEALTH = {
  section: 'health_insurance',
  title: 'Health insurance',
  eyebrow: 'Form · Part 6 of 10',
  fields: [
    { type: 'checkboxes', name: 'coverage', label: 'My health insurance is…', options: [
      { value: 'job', label: 'Through my job' },
      { value: 'private', label: 'Privately purchased' },
      { value: 'medicaid', label: 'Medicaid' },
      { value: 'medicare', label: 'Medicare' },
      { value: 'none', label: "I don't have health insurance", exclusive: true },
    ] },
    { type: 'notice', showIf: (d) => (d.coverage || []).includes('none'),
      text: 'If your job offers health insurance but you haven\'t signed up, you still need to bring proof of what coverage is available and what it costs.',
      help: 'insurance_not_enrolled' },
    { type: 'checkboxes', name: 'includes', label: 'My coverage includes', showIf: (d) => (d.coverage || []).some((c) => c !== 'none'),
      options: [
        { value: 'medical', label: 'Medical' }, { value: 'dental', label: 'Dental' },
        { value: 'vision', label: 'Vision' }, { value: 'prescription', label: 'Prescription' },
      ] },
    { type: 'text', name: 'plan_name', label: 'Insurance plan name', maxLength: 60, showIf: (d) => (d.coverage || []).some((c) => c !== 'none') },
    { type: 'text', name: 'policy_no', label: 'Policy #', maxLength: 40, showIf: (d) => (d.coverage || []).some((c) => c !== 'none') },
    { type: 'heading', text: 'What health insurance costs you' },
    { type: 'notice', text: [
      'Enter only what YOU pay, not what your employer pays.',
      'If it comes out of your paycheck, look on your pay stub for a line like "Medical," "Health," or "Dental," and enter that amount and how often you are paid. Example: 48 dollars taken out every 2 weeks.',
      'If your job offers coverage you didn\'t sign up for, enter what it would cost you. Leave these blank if you have Medicaid or pay nothing.',
    ] },
    { type: 'moneyPeriod', name: 'family_cost', label: 'What you pay for a family plan (covers you and others)', optional: true, help: 'family_vs_individual' },
    { type: 'moneyPeriod', name: 'individual_cost', label: 'What you pay for an individual plan (covers only you)', optional: true },
    { type: 'heading', text: 'Your children\'s coverage' },
    { type: 'checkboxes', name: 'children_covered_by', label: "The children's health insurance is covered by", help: 'children_coverage',
      options: [
        { value: 'my_plan', label: 'My plan' },
        { value: 'other_parent', label: "The other parent's plan" },
        { value: 'chp', label: 'Child Health Plus' },
        { value: 'medicaid', label: 'Medicaid' },
        { value: 'other', label: 'Other' },
      ] },
    { type: 'text', name: 'children_other', label: 'Other coverage — please describe', maxLength: 60,
      showIf: (d) => (d.children_covered_by || []).includes('other') },
  ],
};

// ---------------- Screen 7: Child care ----------------
export const CHILD_CARE = {
  section: 'child_care',
  title: 'Child care',
  eyebrow: 'Form · Part 7 of 10',
  fields: [
    { type: 'radio', name: 'has_child_care', label: 'Do you pay for child care?', options: YES_NO },
    { type: 'text', name: 'provider', label: 'Child care provider', maxLength: 80, showIf: (d) => d.has_child_care === 'yes' },
    { type: 'number', name: 'hours_per_week', label: 'Average hours per week you need child care', maxLength: 3, showIf: (d) => d.has_child_care === 'yes' },
    { type: 'moneyPeriod', name: 'cost', label: 'Child care cost', showIf: (d) => d.has_child_care === 'yes' },
    { type: 'notice', showIf: (d) => d.has_child_care === 'yes',
      text: 'The form says to provide receipts. We\'ve added child care receipts to your document checklist.' },
  ],
};

// ---------------- Screen 8: Assets ----------------
export const ASSETS = {
  section: 'assets',
  title: 'What you own',
  eyebrow: 'Form · Part 8 of 10',
  intro: 'Leave a section empty if it doesn\'t apply to you.',
  fields: [
    { type: 'notice', text: 'Not sure what to include?', help: 'assets' },
    { type: 'list', name: 'savings', label: 'Savings accounts', itemLabel: 'Savings account', formLines: 1, fields: [
      { type: 'text', name: 'bank', label: 'Bank name', maxLength: 40 },
      { type: 'money', name: 'balance', label: 'Balance' },
    ] },
    { type: 'list', name: 'checking', label: 'Checking accounts', itemLabel: 'Checking account', formLines: 1, fields: [
      { type: 'text', name: 'bank', label: 'Bank name', maxLength: 40 },
      { type: 'money', name: 'balance', label: 'Balance' },
    ] },
    { type: 'list', name: 'vehicles', label: 'Cars and other vehicles', itemLabel: 'Vehicle', formLines: 1, fields: [
      { type: 'number', name: 'year', label: 'Year', maxLength: 4 },
      { type: 'text', name: 'make', label: 'Make', maxLength: 20, placeholder: 'e.g. Toyota' },
      { type: 'text', name: 'model', label: 'Model', maxLength: 30, placeholder: 'e.g. Camry' },
      { type: 'money', name: 'value', label: 'Value (your best estimate)' },
    ] },
    { type: 'list', name: 'homes', label: 'House or apartment you own', itemLabel: 'Home', formLines: 1, fields: [
      { type: 'text', name: 'address', label: 'Address', maxLength: 140 },
      { type: 'money', name: 'market_value', label: 'Market value (your best estimate)' },
      { type: 'money', name: 'mortgage', label: 'Mortgage balance still owed' },
    ] },
    { type: 'list', name: 'other_assets', label: 'Other assets',
      hint: 'Other real estate, another car, cryptocurrency or other digital assets, boat, snowmobile, stocks, bonds, IRAs, and similar.',
      itemLabel: 'Other asset', formLines: 2, fields: [
        { type: 'text', name: 'details', label: 'What it is', maxLength: 60 },
        { type: 'money', name: 'value', label: 'Value (your best estimate)' },
      ] },
  ],
};

// ---------------- Screen 9: Monthly expenses ----------------
const EXPENSE_LINES = [
  ['rent_mortgage', 'Rent or mortgage'],
  ['health_insurance', 'Health insurance'],
  ['heading', 'Utilities'],
  ['util_gas', 'Gas'],
  ['util_electric', 'Electric'],
  ['util_phone', 'Phone / TV / internet'],
  ['util_other', 'Other utility', 'util_other_label'],
  ['heading', 'Other insurance'],
  ['ins_life', 'Life insurance'],
  ['ins_auto', 'Auto insurance'],
  ['ins_home', 'Home / fire insurance'],
  ['ins_other', 'Other insurance', 'ins_other_label'],
  ['heading', 'Transportation'],
  ['trans_auto_payment', 'Car payment'],
  ['trans_gas', 'Gasoline'],
  ['trans_public', 'Public transportation'],
  ['heading', 'Everyday costs'],
  ['child_care', 'Child care'],
  ['school', 'School tuition and expenses'],
  ['food', 'Food'],
  ['clothing', 'Clothing'],
  ['medical', 'Medical / dental / prescription'],
  ['contributions', 'Contributions'],
  ['other', 'Other expense', 'other_label'],
];
export const EXPENSE_FIELDS = [...EXPENSE_LINES.filter(([n]) => n !== 'heading').map(([n]) => n), 'util_gas_electric'];

// Gas and electric on one bill: count the combined line instead of the two separate ones.
export const combinedUtilities = (d) => d?.util_combined === 'yes';
export function activeExpenseFields(d) {
  return EXPENSE_FIELDS.filter((n) => (combinedUtilities(d)
    ? n !== 'util_gas' && n !== 'util_electric'
    : n !== 'util_gas_electric'));
}

const EXPENSE_HINTS = {
  health_insurance: 'Only what you pay yourself each month (from your paycheck or paid directly). Paid every week? Multiply by 4.33. Every 2 weeks? Multiply by 2.17. Twice a month? Multiply by 2. Enter 0 if you pay nothing.',
};

export const EXPENSES = {
  section: 'expenses',
  title: 'Monthly expenses',
  eyebrow: 'Form · Part 9 of 10',
  intro: 'Enter what you usually spend each month. Leave a line blank if it doesn\'t apply.',
  fields: [
    { type: 'notice', text: 'Bills that aren\'t monthly?', help: 'monthly_expenses' },
    ...EXPENSE_LINES.flatMap(([name, label, labelField]) => {
      if (name === 'heading') return [{ type: 'heading', text: label }];
      const out = [];
      if (name === 'util_gas') {
        out.push({ type: 'radio', name: 'util_combined', label: 'Do you get gas and electric on one bill?',
          hint: 'For example, one Con Edison or National Grid bill for both.', options: YES_NO });
        out.push({ type: 'money', name: 'util_gas_electric', label: 'Gas & electric, one bill (per month)', optional: true,
          showIf: combinedUtilities });
      }
      if (labelField) out.push({ type: 'text', name: labelField, label: `${label} — what is it?`, optional: true, maxLength: 24 });
      const hide = name === 'util_gas' || name === 'util_electric' ? { showIf: (d) => !combinedUtilities(d) } : {};
      out.push({ type: 'money', name, label: `${label} (per month)`, optional: !!labelField, hint: EXPENSE_HINTS[name], ...hide });
      return out;
    }),
    { type: 'total', name: 'total', label: 'Total monthly expenses', sumOf: activeExpenseFields },
  ],
};

// ---------------- Screen 10: Loans and debt ----------------
export const DEBTS = {
  section: 'debts',
  title: 'Loans and debt',
  eyebrow: 'Form · Part 10 of 10',
  fields: [
    { type: 'notice', text: 'What should I list here?', help: 'debts' },
    { type: 'list', name: 'debts', label: 'Money you owe', itemLabel: 'Debt', addLabel: 'Add a debt', formLines: 2, fields: [
      { type: 'text', name: 'owed_to', label: 'Owed to', maxLength: 60 },
      { type: 'text', name: 'for', label: 'What it\'s for', maxLength: 40 },
      { type: 'money', name: 'balance', label: 'Balance owed' },
      { type: 'money', name: 'payment', label: 'Payment amount' },
      { type: 'radio', name: 'frequency', label: 'How often you pay', options: [
        { value: 'monthly', label: 'Monthly' }, { value: 'weekly', label: 'Weekly' },
      ] },
    ] },
  ],
};

export const SCREENS = {
  setup: CASE_SETUP,
  info: CASE_INFO,
  job: JOB_INCOME,
  'other-income': OTHER_INCOME,
  household: HOUSEHOLD,
  'other-orders': OTHER_SUPPORT,
  health: HEALTH,
  'child-care': CHILD_CARE,
  assets: ASSETS,
  expenses: EXPENSES,
  debts: DEBTS,
};

// Order of the whole flow. Custom pages: 'safety', 'documents', 'review'.
export const FLOW = [
  'setup', 'safety', 'documents',
  'info', 'job', 'other-income', 'household', 'other-orders', 'health', 'child-care', 'assets', 'expenses', 'debts',
  'for-you', 'documents-final', 'review',
];

export const STEP_NAMES = {
  setup: 'Your situation', safety: 'A few more questions', documents: 'Papers to gather',
  info: 'Case information', job: 'Income from work', 'other-income': 'Other income', household: 'Household',
  'other-orders': 'Other support orders', health: 'Health insurance', 'child-care': 'Child care',
  assets: 'What you own', expenses: 'Monthly expenses', debts: 'Loans and debt', 'for-you': 'Information for you',
  'documents-final': 'Check your papers', review: 'Review',
};
