// GET /api/preview?case=<id>
// Returns the DRAFT preview as page images (PNG, base64). A PDF never leaves the server
// on this path, and the watermark is part of the pixels (spec Section 10.3).
// Nothing is stored: the images are generated on demand from current answers.
import { activeFormVersion, loadAnswers } from './_lib/answers.js';
import { admin, audit, handler, HttpError, json, requireOwnCase, requireUser } from './_lib/http.js';
import { fillForm } from './_lib/pdf/fill.js';
import { rasterize } from './_lib/pdf/raster.js';

const MAX_PREVIEWS_PER_HOUR = 40;

export default handler('preview', async (req) => {
  if (req.method !== 'GET') throw new HttpError(405);
  const user = await requireUser(req);
  const caseId = new URL(req.url).searchParams.get('case');
  await requireOwnCase(user.id, caseId);

  // Simple rate limit per case.
  const since = new Date(Date.now() - 3600_000).toISOString();
  const { count } = await admin().from('documents_generated')
    .select('id', { count: 'exact', head: true })
    .eq('case_id', caseId).eq('watermarked', true).gte('generated_at', since);
  if ((count ?? 0) >= MAX_PREVIEWS_PER_HOUR) throw new HttpError(429, 'Please wait a few minutes before making another preview.');

  const version = await activeFormVersion('4-17a');
  const answers = await loadAnswers(caseId);
  const { bytes, warnings, attachmentPages } = await fillForm(answers, { watermark: true });
  const pages = await rasterize(bytes, { dpi: 110 });

  await admin().from('documents_generated').insert({
    case_id: caseId, form_version_id: version.id, watermarked: true, storage_key: null,
  });
  await audit(user.id, 'preview.generated', caseId);

  return json({
    formRevision: version.revision_date,
    attachmentPages,
    // Field keys only (never values) so the review screen can say which lines overflowed.
    overflowed: warnings.filter((w) => w.includes('too long')).map((w) => w.match(/"([^"]+)"/)?.[1]).filter(Boolean),
    pages: pages.map((p) => ({ width: p.width, height: p.height, src: `data:image/png;base64,${p.png.toString('base64')}` })),
  });
});

export const config = { path: '/api/preview' };
