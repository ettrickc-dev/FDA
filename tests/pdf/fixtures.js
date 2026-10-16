// Fictional test cases for the PDF filler (spec Section 10.5). All people are made up.

const mp = (amount, period) => ({ amount, period });

export const EMPTY = {};

export const TYPICAL = {
  case_info: {
    county: 'Kings (Brooklyn)', file_no: '123456', docket_no: 'F-01234-26', court_date: 'Nov 3, 2026, 9:30 AM, Part 4',
    party: 'respondent', full_name: 'Jordan A. Rivera', confidential: 'no',
    street: '1450 Ocean Ave', apt: '4B', city: 'Brooklyn', state: 'NY', zip: '11230',
  },
  job_income: {
    self_employed: 'no', has_job: 'yes', employer: 'Atlantic Medical Supply LLC', hours_per_week: '40',
    employer_address: '200 Water St, New York, NY 10038', gross: mp('1,240.00', 'week'), takehome: mp('968.15', 'week'),
  },
  other_income: { sources: { selected: ['snap'], details: { snap: { amount: '180', period: 'month', source: 'NYC HRA' } } } },
  household: { others: '2', household_income: mp('600', 'month') },
  other_support: { paying_other: 'no' },
  health_insurance: {
    coverage: ['job'], includes: ['medical', 'dental', 'prescription'], plan_name: 'EmpireCare Silver PPO', policy_no: 'XJ4471920',
    family_cost: mp('142.50', '2weeks'), individual_cost: mp('48.00', '2weeks'), children_covered_by: ['my_plan'],
  },
  child_care: { has_child_care: 'yes', provider: 'Little Steps Daycare', hours_per_week: '25', cost: mp('300', 'week') },
  assets: {
    savings: [{ bank: 'Brooklyn Federal CU', balance: '1,200' }],
    checking: [{ bank: 'Chase', balance: '430.22' }],
    vehicles: [{ year: '2016', make: 'Honda', model: 'Civic LX', value: '9500' }],
    homes: [],
    other_assets: [{ details: '401(k) — employer plan', value: '6,800' }],
  },
  expenses: {
    rent_mortgage: '1,650', health_insurance: '308.75', util_gas: '45', util_electric: '90', util_phone: '120',
    ins_auto: '160', trans_auto_payment: '0', trans_gas: '120', trans_public: '132', child_care: '1300', food: '650',
    clothing: '80', medical: '40', contributions: '25',
  },
  debts: {
    debts: [
      { owed_to: 'Capital One', for: 'Credit card', balance: '2,340', payment: '75', frequency: 'monthly' },
      { owed_to: 'NY HESC', for: 'Student loan', balance: '14,900', payment: '160', frequency: 'monthly' },
    ],
  },
};

export const CONFIDENTIAL = {
  ...TYPICAL,
  case_info: { ...TYPICAL.case_info, party: 'petitioner', confidential: 'yes', street: '', apt: '', city: '', zip: '' },
};

export const SELF_EMPLOYED = {
  case_info: { full_name: 'Sam Okafor', party: 'petitioner', confidential: 'no', street: '88 Grand St', city: 'Albany', state: 'NY', zip: '12207' },
  job_income: { self_employed: 'yes', has_job: 'no', gross: mp('3,900', 'month'), takehome: mp('3,100', 'month') },
  other_income: { sources: { selected: ['none'], details: {} } },
  household: { others: '0' },
  other_support: { paying_other: 'no' },
  health_insurance: { coverage: ['none'], children_covered_by: ['chp'] },
  child_care: { has_child_care: 'no' },
  expenses: { rent_mortgage: '1200', food: '400', total_custom: true, total: '1,700' },
};

// Every checkbox on the form checked at least once across these two.
export const EVERY_CHECKBOX_A = {
  case_info: { full_name: 'Test Checkbox A', party: 'petitioner' },
  job_income: { self_employed: 'yes' },
  other_support: { paying_other: 'yes', orders: [{ amount: mp('250', 'month'), to_whom: 'Support Collection Unit' }] },
  health_insurance: {
    coverage: ['job', 'private', 'medicaid', 'medicare'], includes: ['medical', 'dental', 'vision', 'prescription'],
    children_covered_by: ['my_plan', 'other_parent', 'chp', 'medicaid', 'other'], children_other: 'Tribal health program',
  },
  debts: { debts: [{ owed_to: 'A', balance: '1', payment: '1', frequency: 'monthly' }, { owed_to: 'B', balance: '1', payment: '1', frequency: 'weekly' }] },
};
export const EVERY_CHECKBOX_B = {
  case_info: { full_name: 'Test Checkbox B', party: 'respondent' },
  job_income: { self_employed: 'no' },
  other_support: { paying_other: 'no' },
  health_insurance: { coverage: ['none'] },
  debts: { debts: [{ owed_to: 'A', balance: '1', payment: '1', frequency: 'weekly' }, { owed_to: 'B', balance: '1', payment: '1', frequency: 'monthly' }] },
};

const LONG = (n, s) => (s.repeat(Math.ceil(n / s.length))).slice(0, n);
export const MAX_LENGTH = {
  case_info: {
    full_name: 'Maria-Fernanda Guadalupe Hernández-Villanueva de la Cruz Montenegro', party: 'respondent', confidential: 'no',
    file_no: '1234567890123456789012345678901234567890', docket_no: 'F-12345-26/26A/26B/26C/27A/27B/27C/28',
    court_date: 'Wednesday, December 16, 2026 at 2:15 PM in Part 12, Room 6.04',
    street: '12345 South Conduit Boulevard Service Road East', apt: 'Apartment 23-F (rear entrance)', city: 'Springfield Gardens', state: 'NY', zip: '11413-2214',
  },
  job_income: {
    self_employed: 'no', has_job: 'yes', employer: 'The Metropolitan Transportation Authority Bridges and Tunnels Division',
    hours_per_week: '60', employer_address: LONG(160, '2 Broadway, Floor 21, Suite 2100, New York, NY 10004 '),
    gross: mp('1,234,567.89', '2weeks'), takehome: mp('999,999.99', 'year'),
  },
  other_income: { sources: { selected: ['ssd'], details: { ssd: { amount: '12,345.67', period: 'month', source: 'Social Security Administration — Office of Disability Operations, Baltimore' } } } },
  household: { others: '12', household_income: mp('123,456.78', '2weeks') },
  health_insurance: { coverage: ['private'], plan_name: 'Healthfirst Leaf Premier Platinum Family Plus Dental Vision', policy_no: 'ABCDEFGHIJ-1234567890' },
  child_care: { has_child_care: 'yes', provider: 'Sunshine Bright Futures Early Childhood Learning and Development Center Inc.', hours_per_week: '168', cost: mp('12,345.67', '2weeks') },
  assets: { homes: [{ address: '9876 Long Island Expressway Service Road, Little Neck, NY 11362-1234', market_value: '1,250,000', mortgage: '987,654.32' }] },
  expenses: { rent_mortgage: '12,345.67', other_label: 'Pet care and veterinary', other: '1,234.56', util_other_label: 'Water and sewer service', util_other: '99.99' },
};

export const OVERFLOW = {
  case_info: { full_name: 'Alex Chen', party: 'petitioner', docket_no: 'F-55555-26' },
  job_income: {
    self_employed: 'no', has_job: 'yes', employer: 'Main Job Inc', hours_per_week: '30', gross: mp('900', 'week'), takehome: mp('700', 'week'),
    other_jobs: [{ employer: 'Weekend Café', address: '10 Main St', hours: '12' }, { employer: 'Rideshare', address: '', hours: '8' }],
  },
  other_income: { sources: {
    selected: ['public_assistance', 'snap', 'rent', 'tips', 'unemployment', 'investment'],
    details: {
      public_assistance: { amount: '200', period: 'month', source: 'HRA' }, snap: { amount: '150', period: 'month' },
      rent: { amount: '800', period: 'month', source: 'Basement tenant' }, tips: { amount: '60', period: 'week' },
      unemployment: { amount: '300', period: 'week', source: 'NYS DOL' }, investment: { amount: '45', period: 'year', source: 'Dividends' },
    },
  } },
  other_support: { paying_other: 'yes', orders: [
    { amount: mp('400', 'month'), to_whom: 'NYS SCU (Case A)' }, { amount: mp('250', 'month'), to_whom: 'NJ Family Support (Case B)' },
  ] },
  assets: {
    savings: [{ bank: 'Bank A', balance: '100' }, { bank: 'Bank B', balance: '200' }],
    checking: [{ bank: 'Bank C', balance: '50' }],
    vehicles: [{ year: '2012', make: 'Ford', model: 'Focus', value: '3000' }, { year: '2019', make: 'Yamaha', model: 'Motorcycle', value: '4200' }],
    other_assets: [{ details: 'Bitcoin', value: '1,100' }, { details: 'Roth IRA', value: '5,000' }, { details: 'Savings bonds', value: '300' }],
  },
  debts: { debts: [
    { owed_to: 'Card 1', for: 'Credit card', balance: '500', payment: '25', frequency: 'monthly' },
    { owed_to: 'Card 2', for: 'Credit card', balance: '700', payment: '30', frequency: 'monthly' },
    { owed_to: 'Hospital', for: 'Medical bill', balance: '1,200', payment: '50', frequency: 'monthly' },
    { owed_to: 'Friend', for: 'Personal loan', balance: '300', payment: '20', frequency: 'weekly' },
  ] },
};

export const ALL_FIXTURES = {
  empty: EMPTY, typical: TYPICAL, confidential: CONFIDENTIAL, 'self-employed': SELF_EMPLOYED,
  'every-checkbox-a': EVERY_CHECKBOX_A, 'every-checkbox-b': EVERY_CHECKBOX_B, 'max-length': MAX_LENGTH, overflow: OVERFLOW,
};
