// Shared helpers for Netlify Functions.
// LOGGING RULE (spec Rule 8): never log request bodies, answers, names, emails or
// addresses. Only log an error *category* and the function name.
import { createClient } from '@supabase/supabase-js';
import { createHash } from 'node:crypto';

export class HttpError extends Error {
  constructor(status, publicMessage) {
    super(publicMessage || 'Request failed');
    this.status = status;
  }
}

export const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });

let _admin;
export function admin() {
  if (!_admin) {
    _admin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return _admin;
}

export async function requireUser(req) {
  const token = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  if (!token) throw new HttpError(401, 'Please log in again.');
  const { data, error } = await admin().auth.getUser(token);
  if (error || !data?.user) throw new HttpError(401, 'Please log in again.');
  // Best-effort activity stamp (drives inactivity auto-delete).
  await admin().from('profiles').update({ last_active_at: new Date().toISOString() }).eq('id', data.user.id);
  return data.user;
}

export async function requireOwnCase(userId, caseId) {
  if (!/^[0-9a-f-]{36}$/i.test(String(caseId || ''))) throw new HttpError(400, 'Invalid case.');
  const { data, error } = await admin()
    .from('cases').select('id,user_id,status').eq('id', caseId).maybeSingle();
  if (error) throw new HttpError(500);
  if (!data || data.user_id !== userId) throw new HttpError(404, 'Case not found.');
  return data;
}

export async function audit(actor, action, caseId = null) {
  await admin().from('audit_log').insert({ actor, action, case_id: caseId });
}

export function hashIp(req, context) {
  const ip = context?.ip || req.headers.get('x-nf-client-connection-ip') || '';
  if (!ip || !process.env.IP_HASH_SALT) return null;
  return createHash('sha256').update(process.env.IP_HASH_SALT + ip).digest('hex');
}

export async function readJson(req, maxBytes = 64 * 1024) {
  const text = await req.text();
  if (text.length > maxBytes) throw new HttpError(413, 'Too much data.');
  try { return text ? JSON.parse(text) : {}; } catch { throw new HttpError(400, 'Invalid data.'); }
}

// Wrap a handler: consistent errors, no sensitive logging.
export const handler = (name, fn) => async (req, context) => {
  try {
    return await fn(req, context);
  } catch (e) {
    const status = e instanceof HttpError ? e.status : 500;
    if (status >= 500) console.error(`[${name}] error category=${e?.name || 'Error'}`);
    return json({ error: e instanceof HttpError ? e.message : 'Something went wrong. Please try again.' }, status);
  }
};
