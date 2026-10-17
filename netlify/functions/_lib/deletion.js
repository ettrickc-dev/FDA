// Data deletion (spec Section 9 "Retention").
// Deleting a user removes: account, cases, answers, red flags, uploads (files + rows), generated-document
// log rows. It KEEPS minimal records stripped of case details:
//   payments  -> amount, status, dates, opaque case_ref (case link removed)
//   consents  -> terms version + time (user link removed)
//   audit_log -> action + time (user and case links removed)
// How long those are kept is an owner/counsel decision (see README).
import { admin } from './http.js';

const UPLOAD_BUCKET = 'uploads';

async function removeUploadFiles(rows) {
  const keys = rows.map((r) => r.storage_key).filter(Boolean);
  if (!keys.length) return;
  try { await admin().storage.from(UPLOAD_BUCKET).remove(keys); } catch { /* bucket may not exist yet */ }
}

export async function deleteCases(caseIds) {
  if (!caseIds.length) return 0;
  const db = admin();
  const { data: uploads } = await db.from('uploads').select('id,storage_key').in('case_id', caseIds);
  await removeUploadFiles(uploads || []);
  await db.from('uploads').delete().in('case_id', caseIds);
  await db.from('answers').delete().in('case_id', caseIds);
  await db.from('red_flags').delete().in('case_id', caseIds);
  await db.from('documents_generated').delete().in('case_id', caseIds);
  await db.from('payments').update({ case_id: null }).in('case_id', caseIds);
  await db.from('audit_log').update({ case_id: null }).in('case_id', caseIds);
  await db.from('cases').delete().in('id', caseIds);
  return caseIds.length;
}

export async function deleteUserData(userId) {
  const db = admin();
  const { data: cases } = await db.from('cases').select('id').eq('user_id', userId);
  await deleteCases((cases || []).map((c) => c.id));
  await db.from('consents').update({ user_id: null }).eq('user_id', userId);
  await db.from('audit_log').update({ actor: null }).eq('actor', userId);
  await db.from('profiles').delete().eq('id', userId);
  const { error } = await db.auth.admin.deleteUser(userId);
  if (error) throw new Error('auth delete failed');
  await db.from('audit_log').insert({ actor: null, action: 'user.deleted', case_id: null });
}
