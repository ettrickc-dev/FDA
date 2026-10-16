// Who may download the clean form: paid, not refunded, not expired.
// The Stripe webhook is the ONLY thing that marks a payment paid (spec Section 11).
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { admin, HttpError } from './http.js';

export const addDays = (date, days) => new Date(new Date(date).getTime() + days * 86400_000);

export async function getAccess(caseId, now = new Date()) {
  const { data, error } = await admin().from('payments')
    .select('id,status,paid_at,access_expires_at,refunded_at,amount_cents')
    .eq('case_id', caseId).eq('status', 'paid')
    .order('paid_at', { ascending: false }).limit(1);
  if (error) throw new HttpError(500);
  const p = data?.[0];
  if (!p) return { active: false, state: 'unpaid' };
  if (p.access_expires_at && new Date(p.access_expires_at) <= now) {
    return { active: false, state: 'expired', payment: p };
  }
  return { active: true, state: 'paid', payment: p, expiresAt: p.access_expires_at };
}

// Keep cases.status in line with the payment state (lazy expiry; nightly job also does this).
export async function syncCaseStatus(caseId, access) {
  const status = access.state === 'paid' ? 'paid' : access.state === 'expired' ? 'expired' : 'draft';
  await admin().from('cases').update({ status }).eq('id', caseId);
  return status;
}

export const newCaseRef = () => `r_${randomBytes(12).toString('hex')}`;

// ---- short-lived signed download links ----
function secret() {
  const s = process.env.DOWNLOAD_TOKEN_SECRET;
  if (!s || s.length < 32) throw new HttpError(500);
  return s;
}
const b64u = (buf) => Buffer.from(buf).toString('base64url');

export function signDownloadToken({ caseId, userId, ttlSeconds = 300, now = Date.now() }) {
  const payload = b64u(JSON.stringify({ c: caseId, u: userId, exp: Math.floor(now / 1000) + ttlSeconds, n: randomBytes(6).toString('hex') }));
  const sig = b64u(createHmac('sha256', secret()).update(payload).digest());
  return `${payload}.${sig}`;
}

export function verifyDownloadToken(token, now = Date.now()) {
  const [payload, sig] = String(token || '').split('.');
  if (!payload || !sig) throw new HttpError(403, 'This download link is not valid. Please go back and try again.');
  const expected = createHmac('sha256', secret()).update(payload).digest();
  const given = Buffer.from(sig, 'base64url');
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) {
    throw new HttpError(403, 'This download link is not valid. Please go back and try again.');
  }
  const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
  if (!data.exp || data.exp * 1000 < now) throw new HttpError(403, 'This download link has expired. Please go back and download again.');
  return { caseId: data.c, userId: data.u, exp: data.exp };
}
