// Load and decrypt every saved screen for a case (server-side).
import { aadFor, decrypt } from './crypto.js';
import { admin, HttpError } from './http.js';

export async function loadAnswers(caseId) {
  const { data, error } = await admin().from('answers').select('section,data_enc').eq('case_id', caseId);
  if (error) throw new HttpError(500);
  const out = {};
  for (const row of data) out[row.section] = decrypt(row.data_enc, aadFor(caseId, row.section));
  return out;
}

export async function activeFormVersion(formNumber = '4-17a') {
  const { data, error } = await admin().from('form_versions')
    .select('id,revision_date,pdf_hash').eq('form_number', formNumber).eq('active', true).maybeSingle();
  if (error || !data) throw new HttpError(500);
  return data;
}
