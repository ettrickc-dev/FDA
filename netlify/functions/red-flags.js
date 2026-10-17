// POST  /api/red-flags { caseId, flagType, answer }      -> log that a flag prompt was shown; returns { id }
// PATCH /api/red-flags { caseId, id, userAction }         -> record which button the person chose
// Answers are encrypted. Flags are never included in emails or notifications (spec Section 6).
import { aadFor, encrypt } from './_lib/crypto.js';
import { admin, handler, HttpError, json, readJson, requireOwnCase, requireUser } from './_lib/http.js';

const FLAG_TYPES = new Set([
  'safety_contact', 'threats_violence', 'custody_case', 'relocation',
  'business_income', 'orders_arrears', 'parentage', 'opposing_counsel',
]);
const ACTIONS = new Set(['attorney', 'free_help', 'continue']);
const ANSWERS = new Set(['yes', 'no', 'unsure', 'prefer_not']);

export default handler('red-flags', async (req) => {
  const user = await requireUser(req);
  const body = await readJson(req, 2048);
  await requireOwnCase(user.id, body.caseId);

  if (req.method === 'POST') {
    if (!FLAG_TYPES.has(body.flagType) || !ANSWERS.has(body.answer)) throw new HttpError(400);
    const { data, error } = await admin().from('red_flags').insert({
      case_id: body.caseId,
      flag_type: body.flagType,
      answer_enc: encrypt({ answer: body.answer }, aadFor(body.caseId, `flag:${body.flagType}`)),
    }).select('id').single();
    if (error) throw new HttpError(500);
    return json({ id: data.id }, 201);
  }

  if (req.method === 'PATCH') {
    if (!ACTIONS.has(body.userAction)) throw new HttpError(400);
    const { error } = await admin().from('red_flags')
      .update({ user_action: body.userAction })
      .eq('id', body.id).eq('case_id', body.caseId);
    if (error) throw new HttpError(500);
    return json({ ok: true });
  }

  throw new HttpError(405);
});

export const config = { path: '/api/red-flags' };
