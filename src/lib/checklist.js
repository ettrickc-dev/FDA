// Document checklist (spec Screen 11). Pure logic so it can be tested and reused by the
// server-side download gate in step 6.

export const BASE_DOCS = [
  { key: 'pay_stubs', label: 'Your two most recent pay stubs',
    hint: 'If you have more than one job, bring stubs from each job.' },
  { key: 'tax_returns', label: 'Your most recent federal and New York State tax returns' },
  { key: 'w2_1099', label: 'Your W-2s and/or 1099 forms' },
  { key: 'other_income_debt', label: 'Papers that show any other income, debts, and loans',
    hint: 'For example: benefit award letters, unemployment statements, loan or credit card statements.' },
  { key: 'health_proof', label: 'Proof of your health insurance coverage and what it costs',
    hint: 'For example: an insurance card plus a pay stub or bill that shows the cost.' },
  { key: 'public_assistance', label: 'Proof of public assistance',
    hint: 'For example: a benefits letter or budget letter.' },
];

export function buildChecklist(answers = {}) {
  const docs = [...BASE_DOCS];
  if (answers.other_support?.paying_other === 'yes') {
    docs.push({ key: 'support_orders', label: 'Copies of all your other child support orders', added: true });
  }
  if (answers.child_care?.has_child_care === 'yes') {
    docs.push({ key: 'child_care_receipts', label: 'Child care receipts', added: true });
  }
  if ((answers.health_insurance?.coverage || []).includes('none')) {
    docs.push({ key: 'insurance_available', label: 'If your job offers health insurance: proof of what is available and what it costs', added: true });
  }
  return docs;
}

// statuses: { [key]: 'have' | 'na' }
export function checklistComplete(answers = {}) {
  const statuses = answers.doc_checklist?.status || {};
  return buildChecklist(answers).every((d) => statuses[d.key] === 'have' || statuses[d.key] === 'na');
}

export function checklistCounts(answers = {}) {
  const statuses = answers.doc_checklist?.status || {};
  const docs = buildChecklist(answers);
  const done = docs.filter((d) => statuses[d.key] === 'have' || statuses[d.key] === 'na').length;
  return { done, total: docs.length };
}
