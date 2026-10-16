// "What counts here?" help text. Reviewed Oct 2026 against Form 4-17a (1/2026); owner sign-off pending.
// Rules for this file (spec Section 5): describe what a field means; never tell people
// what number to enter or how to lower an obligation. Plain language, about 6th-8th grade.
// `maybe: true` adds "We can't tell you whether this will count in your case." and a
// "talk to a lawyer" link under the text.

export const HELP = {
  gross_vs_takehome: {
    title: 'Gross pay vs. take-home pay',
    body: [
      'Gross pay is what you earn before anything is taken out — before taxes, Social Security, health insurance, union dues, or other deductions.',
      'Take-home pay is what is left after those deductions. It is the amount that actually reaches your bank account or paycheck.',
      'Your pay stub usually shows both. Gross is often labeled "gross" or "total earnings." Take-home is often labeled "net pay."',
      'If you have more than one job, add the jobs together for each line.',
    ],
  },
  irregular_pay: {
    title: 'If your pay changes from week to week',
    body: [
      'If your hours or pay go up and down, many people look at several recent pay stubs and work out an average.',
      'Choose the time period ("per week," "per month," and so on) that matches how you worked out the number.',
      'Bring the pay stubs you used, so the court can see where the number came from.',
    ],
  },
  self_employment: {
    title: 'Self-employment and business income',
    body: [
      'Self-employed means you work for yourself: you own a business, do contract or "1099" work, drive for an app, or get paid directly by customers.',
      'Business income can be complicated to report. The court has a longer form (Form 4-17) that asks more detailed questions about business income and expenses.',
      'Because this form is a sworn statement, you may want legal advice about which form fits your situation.',
    ],
    maybe: true,
  },
  cash_tips: {
    title: 'Cash, tips, and side jobs',
    body: [
      'Income is not only what shows up on a paycheck. Cash payments, tips, and side jobs are also income.',
      'This form asks about income "from all sources." Report what you actually receive.',
    ],
    maybe: true,
  },
  other_income: {
    title: 'What is "other income"?',
    body: [
      'Other income is money you get that is not from a job. The form lists examples: public assistance, SNAP (food stamps), rent you collect, tips, unemployment, workers\' compensation, Social Security Disability (SSD), Supplemental Security Income (SSI), pensions and retirement, fellowships, stipends, annuities, and investment income.',
      'For each one, enter how much you get and how often.',
      'Bring papers that show each amount, such as award letters or statements.',
    ],
    maybe: true,
  },
  gifts_family_help: {
    title: 'Help from family or friends',
    body: [
      'Some people get regular help, such as a relative paying a bill or giving money each month.',
      'This form does not have its own line for gifts. You can mention it with your household information, or ask a lawyer how to handle it.',
    ],
    maybe: true,
  },
  household_contributions: {
    title: 'Income from other household members',
    body: [
      '"Household" means the people who live with you.',
      'The form asks for income from other household members. It does not say whether that means everything they earn or only what they put toward household costs, such as rent, food, or bills.',
      'If you are not sure which your court expects, ask the court\'s help center or a lawyer, and be ready to explain the number you used.',
    ],
    maybe: true,
  },
  other_support_orders: {
    title: 'Other child support orders',
    body: [
      'This means court orders that require you to pay child support for other children — for example, from a different case.',
      'Informal arrangements, where you pay without a court order, are not court orders.',
      'If you have other orders, attach a copy of each one to your form.',
    ],
    maybe: true,
  },
  insurance_not_enrolled: {
    title: 'Insurance available through work',
    body: [
      'If your job offers health insurance but you have not signed up, the form says you still must bring proof of what coverage is available and what it would cost.',
      'Your employer\'s human resources or benefits office can usually give you this information in writing.',
    ],
  },
  family_vs_individual: {
    title: 'Family plan vs. individual plan',
    body: [
      'An individual plan covers only you. A family plan covers you and others, such as your children.',
      'Enter what each type of plan costs you, and how often you pay it. If you only know one of the costs, fill in that one and leave the other blank.',
      'Your pay stub, enrollment papers, or benefits office can show these costs.',
    ],
  },
  children_coverage: {
    title: 'Who covers the children',
    body: [
      'Check every source that covers your child or children. If different children have different coverage, check each one that applies.',
      'Child Health Plus is New York\'s health insurance program for children.',
    ],
  },
  monthly_expenses: {
    title: 'Monthly expenses',
    body: [
      'Enter what you usually spend each month on each item. If a bill comes weekly, multiply by 4.33 to get a monthly amount. If it comes once a year, divide by 12.',
      'Leave a line blank if it does not apply to you.',
      'Only list each expense once. For example, if health insurance comes out of your paycheck, list it on the health insurance line.',
    ],
  },
  assets: {
    title: 'What counts as an asset',
    body: [
      'Assets are things you own that have money value: bank accounts, vehicles, homes or other property, retirement accounts, stocks, bonds, and cryptocurrency or other digital assets.',
      'For value, use your best estimate of what it is worth today. For bank accounts, use the current balance.',
    ],
  },
  debts: {
    title: 'Loans and debt',
    body: [
      'List money you owe: car loans, student loans, credit cards, personal loans, medical bills, and similar debts.',
      'Do not list your mortgage here — it goes with the home under Assets and on the rent or mortgage expense line.',
      'Bring statements that show each balance and payment.',
    ],
  },
};

export const CANT_TELL = "We can't tell you whether this will count in your case.";
