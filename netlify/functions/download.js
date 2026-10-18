// POST /api/download            { caseId }  -> { url }   (logged-in; returns a 5-minute signed link)
// GET  /api/download?t=<token>                -> the clean PDF (generated now, never stored)
// The clean PDF only exists after the server verifies: login + ownership + paid + not
// expired/refunded + checklist + acknowledgment (spec Section 10.4).
import { signDownloadToken, verifyDownloadToken } from './_lib/access.js';
import { activeFormVersion } from './_lib/answers.js';
import { assertCanDownload, rateLimit } from './_lib/delivery.js';
import { admin, audit, handler, HttpError, json, readJson, requireOwnCase, requireUser } from './_lib/http.js';
import { fillForm } from './_lib/pdf/fill.js';

const TOKEN_TTL_SECONDS = 300;

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
