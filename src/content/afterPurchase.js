// After-purchase content (spec Section 4 step 13, Section 8). DRAFT — ATTORNEY TO REVIEW.
// General information only.

export const DOWNLOAD_DISCLAIMER =
  "Before you sign: read every line, make sure it's accurate and complete, and attach the required documents. " +
  'This form is not complete until you sign it yourself. We did not review your answers for legal sufficiency. ' +
  'For advice about your case, consult a lawyer.';

export const NEXT_STEPS = [
  'Print the form. Read every line one more time.',
  'Sign and date the form yourself at the end, where it says "I affirm this ___ day of ___." We left the signature and date blank on purpose.',
  'If your form has an attachment page, keep it with the form and write your initials where shown.',
  'Gather the papers on your document checklist and make copies.',
  'Make a copy of the signed form for yourself.',
  'Bring the form and your papers to your next court date, or follow the instructions on the papers you received from the court.',
  'If anything changes before your court date (for example, a new job), update your answers here and download a new form.',
];

export const REFUND_SUMMARY = (refundDays) =>
  refundDays === null || refundDays === undefined
    ? 'Refund policy: [refund window not set yet].'
    : `Full refund if you ask within ${refundDays} days and before your first download.`;
