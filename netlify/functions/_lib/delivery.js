// Shared checks for anything that releases the clean (paid) PDF: download and email.
import { getAccess } from './access.js';
import { loadAnswers } from './answers.js';
import { admin, HttpError } from './http.js';
import { readiness } from './readiness.js';

export const MAX_DOWNLOADS_PER_DAY = 20;

export async function assertCanDownload(caseId) {
  const access = await getAccess(caseId);
  if (access.state === 'expired') throw new HttpError(403, 'Your access period has ended.');
  if (!access.active) throw new HttpError(402, 'Please unlock your final form first.');
  const answers = await loadAnswers(caseId);
  if (!readiness(answers).ready) throw new HttpError(409, 'Please finish your document checklist and review first.');
  return answers;
}

export async function rateLimit(caseId) {
  const since = new Date(Date.now() - 86400_000).toISOString();
  const { count } = await admin().from('documents_generated').select('id', { count: 'exact', head: true })
    .eq('case_id', caseId).eq('watermarked', false).gte('generated_at', since);
  if ((count ?? 0) >= MAX_DOWNLOADS_PER_DAY) throw new HttpError(429, 'You\'ve reached today\'s download limit. Please try again tomorrow.');
}

