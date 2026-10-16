// Red-flag screening (spec Section 6). DRAFT — owner to review wording.
// Non-blocking: no answer stops the person from continuing (owner may later make one a hard stop).

const PREFER = { value: 'prefer_not', label: 'Prefer not to say' };
const YN = [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }, PREFER];
const YNU = [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }, { value: 'unsure', label: 'Not sure' }, PREFER];

// Hotlines. NY statewide numbers confirmed on opdv.ny.gov (Oct 2026).
// VERIFY BEFORE LAUNCH: National Domestic Violence Hotline number.
export const HOTLINES = {
  national: '1-800-799-7233',
  nyState: '1-800-942-6906',
  nyStateText: '844-997-2121',
};

export const PROMPTS = {
  safety: [
    'Your safety comes first. If you\'re in danger right now, call 911.',
    `For confidential support, the National Domestic Violence Hotline is ${HOTLINES.national}, and New York's statewide hotline is ${HOTLINES.nyState} (or text ${HOTLINES.nyStateText}).`,
    'You can keep using this tool. Because this involves safety, we strongly suggest speaking with a lawyer or a domestic violence advocate before filing anything that includes your address.',
  ],
  custody: [
    'Your answers suggest your case may involve more than child support. A lawyer can explain how these issues may affect your situation.',
    'You can continue, but this tool only helps with the financial forms.',
  ],
  business: [
    'Business and self-employment income can be complicated, and mistakes on a sworn form can have serious consequences. This short form may not be the right fit.',
    'We recommend reviewing the long form (Form 4-17) or speaking with an attorney.',
  ],
  orders: [
    'Unpaid support and existing orders can change what the court looks at.',
    'Gather copies of all orders and payment records, and consider getting legal advice before filing.',
  ],
  counsel: [
    'The other parent has a lawyer. You\'re allowed to proceed on your own, but you may want legal advice before you sign or file.',
  ],
};

export const RED_FLAG_QUESTIONS = [
  { key: 'safety_contact', prompt: 'safety', options: YN, triggers: ['yes'],
    label: 'Could you be at risk if the other parent learns where you live or how to reach you?' },
  { key: 'threats_violence', prompt: 'safety', options: YN, triggers: ['yes'],
    label: 'Has the other parent threatened you, hurt you, or tried to control you — or is there an order of protection or a court case about violence between you?' },
  { key: 'custody_case', prompt: 'custody', options: YNU, triggers: ['yes'],
    label: 'Is there a custody or visitation case going on or planned, or a disagreement about the children\'s schedule?' },
  { key: 'relocation', prompt: 'custody', options: YNU, triggers: ['yes'],
    label: 'Are you or the other parent planning to move to a different area?' },
  { key: 'business_income', prompt: 'business', options: YN, triggers: ['yes'],
    label: 'Do you own a business, get paid in cash, or work as a contractor (for example, "1099" or app-based work)?' },
  { key: 'orders_arrears', prompt: 'orders', options: YNU, triggers: ['yes'],
    label: 'Is there already a support order, is past support unpaid, or do you pay support in another case?' },
  { key: 'parentage', prompt: 'custody', options: YNU, triggers: ['no', 'unsure'],
    label: 'Has it been legally established who the children\'s parents are (for example, through marriage, an Acknowledgment of Parentage, or a court order)?' },
  { key: 'public_assistance', prompt: null, options: YNU, triggers: [],
    label: 'Do the children receive public assistance (such as cash assistance or Medicaid)?' },
  { key: 'opposing_counsel', prompt: 'counsel', options: YNU, triggers: ['yes'],
    label: 'Does the other parent have a lawyer?' },
];

export const FLAG_TYPES = RED_FLAG_QUESTIONS.filter((q) => q.prompt).map((q) => q.key);
