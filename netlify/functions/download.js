// POST /api/download            { caseId }  -> { url }   (logged-in; returns a 5-minute signed link)
// GET  /api/download?t=<token>                -> the clean PDF (generated now, never stored)
// The clean PDF only exists after the server verifies: login + ownership + paid + not
// expired/refunded + checklist + acknowledgment (spec Section 10.4).
import { getAccess, signDownloadToken, verifyDownloadToken } from './_lib/access.js';
import { activeFormVersion, loadAnswers } from './_lib/answers.js';
import { admin, audit, handler, HttpError, json, readJson, requireOwnCase, requireUser } from './_lib/http.js';
import { fillForm } from './_lib/pdf/fill.js';
import { readiness } from './_lib/readiness.js';

const MAX_DOWNLOADS_PER_DAY = 20;
const TOKEN_TTL_SECONDS = 300;

async function assertCanDownload(caseId) {
  const access = await getAccess(caseId);
  if (access.state === 'expired') throw new HttpError(403, 'Your access period has ended.');
  if (!access.active) throw new HttpError(402, 'Please unlock your final form first.');
  const answers = await loadAnswers(caseId);
  if (!readiness(answers).ready) throw new HttpError(409, 'Please finish your document checklist and review first.');
  return answers;
}

async function rateLimit(caseId) {
  const since = new Date(Date.now() - 86400_000).toISOString();
  const { count } = await admin().from('documents_generated').select('id', { count: 'exact', head: true })
    .eq('case_id', caseId).eq('watermarked', false).gte('generated_at', since);
  if ((count ?? 0) >= MAX_DOWNLOADS_PER_DAY) throw new HttpError(429, 'You\'ve reached today\'s download limit. Please try again tomorrow.');
}

export default handler('download', async (req) => {
  if (req.method === 'POST') {
    const user = await requireUser(req);
    const { caseId } = await readJson(req, 1024);
    await requireOwnCase(user.id, caseId);
    await assertCanDownload(caseId);
    await rateLimit(caseId);
    const token = signDownloadToken({ caseId, userId: user.id, ttlSeconds: TOKEN_TTL_SECONDS });
    return json({ url: `/api/download?t=${encodeURIComponent(token)}`, expiresInSeconds: TOKEN_TTL_SECONDS });
  }

  if (req.method === 'GET') {
    const { caseId, userId } = verifyDownloadToken(new URL(req.url).searchParams.get('t'));
    await requireOwnCase(userId, caseId);       // ownership re-checked
    const answers = await assertCanDownload(caseId); // payment re-checked at the moment of download
    await rateLimit(caseId);
    const version = await activeFormVersion('4-17a');
    const { bytes } = await fillForm(answers, { watermark: false });
    await admin().from('documents_generated').insert({
      case_id: caseId, form_version_id: version.id, watermarked: false, storage_key: null,
    });
    await audit(userId, 'download.final', caseId);
    return new Response(bytes, {
      status: 200,
      headers: {
        'content-type': 'application/pdf',
        // Neutral filename.
        'content-disposition': 'attachment; filename="form-4-17a.pdf"',
        'cache-control': 'no-store, private',
        'x-content-type-options': 'nosniff',
      },
    });
  }

  throw new HttpError(405);
});

export const config = { path: '/api/download' };
