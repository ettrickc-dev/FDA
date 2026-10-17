// POST /api/consent  { termsVersion, acceptedAt }
// Records that the logged-in user accepted a given version of the Terms.
import { admin, audit, handler, hashIp, HttpError, json, readJson, requireUser } from './_lib/http.js';

export const ACCEPTED_TERMS_VERSIONS = ['2026-10-draft-1'];

export const CURRENT_TERMS_VERSION = ACCEPTED_TERMS_VERSIONS[ACCEPTED_TERMS_VERSIONS.length - 1];

export default handler('consent', async (req, context) => {
  const user = await requireUser(req);
  if (req.method === 'GET') {
    const { data, error } = await admin().from('consents').select('terms_version')
      .eq('user_id', user.id).eq('terms_version', CURRENT_TERMS_VERSION).limit(1);
    if (error) throw new HttpError(500);
    return json({ current: CURRENT_TERMS_VERSION, accepted: data.length > 0 });
  }
  if (req.method !== 'POST') throw new HttpError(405);
  const { termsVersion, acceptedAt } = await readJson(req, 2048);
  if (!ACCEPTED_TERMS_VERSIONS.includes(termsVersion)) throw new HttpError(400, 'Please review the current terms.');
  const when = new Date(acceptedAt);
  const accepted_at = isNaN(when) || when > new Date() ? new Date() : when;
  const { error } = await admin().from('consents').insert({
    user_id: user.id, terms_version: termsVersion,
    accepted_at: accepted_at.toISOString(), ip_hash: hashIp(req, context),
  });
  if (error) throw new HttpError(500);
  await audit(user.id, 'consent.accepted');
  return json({ ok: true });
});

export const config = { path: '/api/consent' };
