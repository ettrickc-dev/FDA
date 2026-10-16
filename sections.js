// One encrypted answers row per screen (spec Section 5 / Section 9).
export const SECTIONS = [
  'case_setup',      // role, case type, goal (step 4 of the user flow)
  'red_flags',       // screening answers (step 5)
  'case_info',       // Screen 1
  'job_income',      // Screen 2
  'other_income',    // Screen 3
  'household',       // Screen 4
  'other_support',   // Screen 5
  'health_insurance',// Screen 6
  'child_care',      // Screen 7
  'assets',          // Screen 8
  'expenses',        // Screen 9
  'debts',           // Screen 10
  'doc_checklist',   // Screen 11
  'review',          // Screen 12
];
export const isSection = (s) => SECTIONS.includes(s);
