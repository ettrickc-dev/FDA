import { randomBytes } from 'node:crypto';
import { beforeEach, describe, expect, it } from 'vitest';
import { __setAdmin } from '../netlify/functions/_lib/http.js';
import { runCleanup } from '../netlify/functions/cleanup.js';
import deleteMyData from '../netlify/functions/delete-my-data.js';
import { fakeDb } from './helpers/fakeDb.js';

const U = { id: 'u-1' }, V = { id: 'u-2' };
let db;
const daysAgo = (n) => new Date(Date.now() - n * 86400_000).toISOString();
const req = (body, token = 'tok-u') => new Request('https://x.test/api/delete-my-data', {
  method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` }, body: JSON.stringify(body),
});

function seed() {
  db = fakeDb({ users: { 'tok-u': U, 'tok-v': V } });
  __setAdmin(db);
  db.T('profiles').push({ id: U.id, last_active_at: daysAgo(0) }, { id: V.id, last_active_at: daysAgo(0) });
  db.T('cases').push(
    { id: 'c-1', user_id: U.id, status: 'paid', updated_at: daysAgo(1) },
    { id: 'c-2', user_id: U.id, status: 'draft', updated_at: daysAgo(1) },
    { id: 'c-3', user_id: V.id, status: 'draft', updated_at: daysAgo(1) },
  );
  for (const c of ['c-1', 'c-2', 'c-3']) {
    db.T('answers').push({ case_id: c, section: 'case_info', data_enc: 'v1.x' });
    db.T('red_flags').push({ case_id: c, flag_type: 'safety_contact' });
    db.T('documents_generated').push({ case_id: c, watermarked: true });
  }
  db.T('uploads').push({ id: 'up-1', case_id: 'c-1', storage_key: 'k1', delete_after: daysAgo(-5) });
  db.T('payments').push({ id: 'p-1', case_id: 'c-1', case_ref: 'r_abc', status: 'paid', amount_cents: 4900, access_expires_at: daysAgo(-30) });
  db.T('consents').push({ user_id: U.id, terms_version: 'v1', accepted_at: daysAgo(2) }, { user_id: V.id, terms_version: 'v1', accepted_at: daysAgo(2) });
  db.T('audit_log').push({ actor: U.id, action: 'case.created', case_id: 'c-1' });
}

beforeEach(() => { process.env.ANSWERS_ENC_KEY = randomBytes(32).toString('base64'); delete process.env.DRAFT_RETENTION_DAYS; seed(); });

describe('delete my data', () => {
  it('requires typing DELETE', async () => {
    const r = await deleteMyData(req({ confirm: 'yes' }));
    expect(r.status).toBe(400);
    expect(db.T('cases')).toHaveLength(3);
  });

  it('deletes everything of that user, keeps stripped payment and consent, leaves others alone', async () => {
    const r = await deleteMyData(req({ confirm: 'DELETE' }));
    expect(r.status).toBe(200);
    expect(db.T('cases').map((c) => c.id)).toEqual(['c-3']);
    for (const t of ['answers', 'red_flags', 'documents_generated']) {
      expect(db.T(t).every((x) => x.case_id === 'c-3'), t).toBe(true);
    }
    expect(db.T('uploads')).toHaveLength(0);
    expect(db.tables.__removedFiles).toEqual(['k1']);
    expect(db.T('payments')[0]).toMatchObject({ case_id: null, case_ref: 'r_abc', amount_cents: 4900, status: 'paid' });
    expect(db.T('consents').find((c) => c.terms_version === 'v1' && c.user_id === null)).toBeTruthy();
    expect(db.T('consents').some((c) => c.user_id === V.id)).toBe(true);
    expect(db.T('audit_log').some((a) => a.actor === U.id || a.case_id === 'c-1')).toBe(false);
    expect(db.tables.__deletedUsers).toEqual([U.id]);
    expect(db.T('profiles').map((p) => p.id)).toEqual([V.id]);
  });
});

describe('nightly cleanup', () => {
  it('expires ended access windows', async () => {
    db.T('payments')[0].access_expires_at = daysAgo(1);
    const c = await runCleanup();
    expect(c.expired).toBe(1);
    expect(db.T('cases').find((x) => x.id === 'c-1').status).toBe('expired');
  });

  it('skips deleting drafts while the retention period is a placeholder', async () => {
    db.T('cases').forEach((c) => { c.updated_at = daysAgo(400); });
    const c = await runCleanup();
    expect(c.casesDeleted).toBe(0);
    expect(c.skipped).toContain('DRAFT_RETENTION_DAYS not set');
  });

  it('deletes stale drafts and idle empty accounts once retention is set, never active paid cases', async () => {
    process.env.DRAFT_RETENTION_DAYS = '30';
    db.T('cases').find((x) => x.id === 'c-3').updated_at = daysAgo(31);
    db.T('cases').find((x) => x.id === 'c-1').updated_at = daysAgo(90); // paid & active: kept
    db.T('profiles').find((p) => p.id === V.id).last_active_at = daysAgo(31);
    const c = await runCleanup();
    expect(c.casesDeleted).toBe(1);
    expect(db.T('cases').map((x) => x.id).sort()).toEqual(['c-1', 'c-2']);
    expect(c.usersDeleted).toBe(1);
    expect(db.tables.__deletedUsers).toEqual([V.id]);
  });

  it('removes uploads past their delete date and abandoned checkouts', async () => {
    db.T('uploads')[0].delete_after = daysAgo(1);
    db.T('payments').push({ id: 'p-2', case_id: 'c-2', case_ref: 'r_x', status: 'pending', created_at: daysAgo(3) });
    const c = await runCleanup();
    expect(c.uploadsDeleted).toBe(1);
    expect(c.abandoned).toBe(1);
    expect(db.T('payments').find((p) => p.id === 'p-2').status).toBe('failed');
  });
});
