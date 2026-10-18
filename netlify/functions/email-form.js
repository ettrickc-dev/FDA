// POST /api/email-form { caseId, email } -> emails the clean PDF to the address the person chose.
// Same checks as a download (login + ownership + paid + not expired/refunded + checklist), and the
// same daily limit. The PDF is generated now and never stored. The email address is not logged
// or saved; the audit log records only that an email was sent.
import { activeFormVersion } from './_lib/answers.js';
import { assertCanDownload, rateLimit } from './_lib/delivery.js';
import { admin, audit, handler, HttpError, json, readJson, requireOwnCase, requireUser } from './_lib/http.js';
import { fillForm } from './_lib/pdf/fill.js';

const EMAIL_RE = /^[^\s@<>()",;:]+@[^\s@<>()",;:]+\.[a-z]{2,}$/i;
const FROM = () => process.env.EMAIL_FROM || 'Form Prep <noreply@mail.ettrickcampbell.com>';

// Neutral wording: nothing about court, support, or the other parent.
const BODY = [
  'Hello,',
  '',
  'The document you asked for is attached as a PDF.',
  '',
  'Before you use it: print it, read every line, and sign and date it yourself where shown.',
  '',
  'If you did not ask for this email, you can delete it.',
].join('\n');

export async function sendEmail({ to, pdfBytes }) {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new HttpError(503, 'Email is not available right now. Please use Download instead.');
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      from: FROM(),
      to: [to],
      subject: 'Your document',
      text: BODY,
      attachments: [{ filename: 'form-4-17a.pdf', content: Buffer.from(pdfBytes).toString('base64') }],
    }),
  });
  if (!res.ok) throw new HttpError(502, 'We could not send the email. Please check the address, or use Download instead.');
}

export default handler('email-form', async (req) => {
  if (req.method !== 'POST') throw new HttpError(405);
  const user = await requireUser(req);
  const { caseId, email } = await readJson(req, 2048);
  const to = String(email || '').trim();
  if (to.length > 254 || !EMAIL_RE.test(to)) throw new HttpError(400, 'Please enter a valid email address.');
  await requireOwnCase(user.id, caseId);
  const answers = await assertCanDownload(caseId);
  await rateLimit(caseId);
  const version = await activeFormVersion('4-17a');
  const { bytes } = await fillForm(answers, { watermark: false });
  await sendEmail({ to, pdfBytes: bytes });
  await admin().from('documents_generated').insert({
    case_id: caseId, form_version_id: version.id, watermarked: false, storage_key: null,
  });
  await audit(user.id, 'email.final', caseId);
  return json({ sent: true });
});

export const config = { path: '/api/email-form' };
