// Server-side gate before checkout and download: the person must have finished the
// document checklist (spec Screen 11) and acknowledged the sworn-statement notice (Screen 12).
import { checklistComplete } from '../../../src/lib/checklist.js';

export function readiness(answers) {
  const missing = [];
  if (!checklistComplete(answers)) missing.push('documents');
  if (!answers.review?.understood) missing.push('acknowledgment');
  return { ready: missing.length === 0, missing };
}
