// GET /api/answers?case=<id>                  -> all saved screens for my case, decrypted
// PUT /api/answers { caseId, section, data }  -> autosave one screen, encrypted
import { aadFor, currentKeyVersion, decrypt, encrypt } from './_lib/crypto.js';
import { admin, handler, HttpError, json, readJson, requireOwnCase, requireUser } from './_lib/http.js';
import { isSection } from './_lib/sections.js';

export default handler('answers', async (req) => {
  const user = await requireUser(req);

  if (req.method === 'GET') {
    const caseId = new URL(req.url).searchParams.get('case');
    await requireOwnCase(user.id, caseId);
    const { data, error } = await admin().from('answers')
      .select('section,data_enc,updated_at').eq('case_id', caseId);
    if (error) throw new HttpError(500);
    const answers = {};
    for (const row of data) {
      answers[row.section] = { data: decrypt(row.data_enc, aadFor(caseId, row.section)), updated_at: row.updated_at };
    }
    return json({ answers });
  }

  if (req.method === 'PUT') {
    const { caseId, section, data } = await readJson(req);
    await requireOwnCase(user.id, caseId);
    if (!isSection(section)) throw new HttpError(400, 'Unknown section.');
    if (typeof data !== 'object' || data === null || Array.isArray(data)) throw new HttpError(400);
    const row = {
      case_id: caseId, section,
      data_enc: encrypt(data, aadFor(caseId, section)),
      key_version: currentKeyVersion(),
      updated_at: new Date().toISOString(),
    };
    const { error } = await admin().from('answers').upsert(row, { onConflict: 'case_id,section' });
    if (error) throw new HttpError(500);
    await admin().from('cases').update({ updated_at: row.updated_at }).eq('id', caseId);
    return json({ ok: true, updated_at: row.updated_at });
  }

  throw new HttpError(405);
});

export const config = { path: '/api/answers' };
