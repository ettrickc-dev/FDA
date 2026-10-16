// End-to-end tests of paywall -> checkout -> webhook -> download, using the real
// function code with an in-memory database and a fake Stripe Checkout API.
import { randomBytes } from 'node:crypto';
import Stripe from 'stripe';
import { beforeEach, describe, expect, it } from 'vitest';
import { aadFor, encrypt } from '../netlify/functions/_lib/crypto.js';
import { __setAdmin } from '../netlify/functions/_lib/http.js';
import { __setStripe } from '../netlify/functions/_lib/stripe.js';
import checkout from '../netlify/functions/checkout.js';
import download from '../netlify/functions/download.js';
import paywall from '../netlify/functions/paywall.js';
import webhook from '../netlify/functions/stripe-webhook.js';
import { buildChecklist } from '../src/lib/checklist.js';
import { TYPICAL } from './pdf/fixtures.js';
import { fakeDb } from './helpers/fakeDb.js';

const ORIGIN = 'https://forms.example.test';
const WHSEC = 'whsec_test_' + randomBytes(8).toString('hex');
const real = new Stripe('sk_test_dummy');
const USER = { id: '11111111-1111-4111-8111-111111111111' };
const OTHER = { id: '22222222-2222-4222-8222-222222222222' };
const CASE = 'aaaaaaaa-0000-4000-8000-000000000001';

let db, sessions;

function req(path, { method = 'GET', body, token = 'tok-user', headers = {} } = {}) {
  return new Request(ORIGIN + path, {
    method,
    headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}), ...headers },
    body: body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body),
  });
}
const js = async (r) => ({ status: r.status, body: await r.json().catch(() => null) });

function saveAnswers(caseId, answers) {
  for (const [section, data] of Object.entries(answers)) {
    db.T('answers').push({ case_id: caseId, section, data_enc: encrypt(data, aadFor(caseId, section)) });
  }
}
const readyAnswers = () => ({
  ...TYPICAL,
  doc_checklist: { status: Object.fromEntries(buildChecklist(TYPICAL).map((d) => [d.key, 'have'])) },
  review: { understood: true },
});

function signedEvent(type, object) {
  const payload = JSON.stringify({ id: 'evt_' + randomBytes(6).toString('hex'), object: 'event', type, data: { object } });
  const header = real.webhooks.generateTestHeaderString({ payload, secret: WHSEC });
  return req('/api/stripe-webhook', { method: 'POST', body: payload, token: null, headers: { 'stripe-signature': header } });
}

beforeEach(() => {
  Object.assign(process.env, {
    ANSWERS_ENC_KEY: randomBytes(32).toString('base64'), ANSWERS_ENC_KEY_VERSION: '1',
    DOWNLOAD_TOKEN_SECRET: randomBytes(32).toString('hex'),
    STRIPE_SECRET_KEY: 'sk_test_dummy', STRIPE_WEBHOOK_SECRET: WHSEC,
    PRICE_CENTS: '4900', ACCESS_DAYS: '60', REFUND_DAYS: '7', STRIPE_STATEMENT_DESCRIPTOR: 'FORMPREP',
  });
  db = fakeDb({ users: { 'tok-user': USER, 'tok-other': OTHER } });
  db.T('cases').push({ id: CASE, user_id: USER.id, status: 'draft' });
  db.T('form_versions').push({ id: 'fv1', form_number: '4-17a', revision_date: '1/2026', pdf_hash: 'x', active: true });
  __setAdmin(db);
  sessions = [];
  __setStripe({
    webhooks: real.webhooks,
    checkout: { sessions: { create: async (params) => { const s = { id: 'cs_test_' + sessions.length, url: 'https://checkout.stripe.com/c/pay/x', ...params }; sessions.push(s); return s; } } },
  });
});

async function payViaWebhook({ amount = 4900 } = {}) {
  const r = await js(await checkout(req('/api/checkout', { method: 'POST', body: { caseId: CASE } })));
  expect(r.status).toBe(200);
  const s = sessions.at(-1);
  const res = await webhook(signedEvent('checkout.session.completed', {
    id: s.id, object: 'checkout.session', payment_status: 'paid', amount_total: amount,
    client_reference_id: s.client_reference_id, metadata: s.metadata, payment_intent: 'pi_' + s.id,
  }));
  expect(res.status).toBe(200);
  return s;
}

describe('paywall', () => {
  it('is where the price is returned, with placeholders when unset', async () => {
    saveAnswers(CASE, readyAnswers());
    let r = await js(await paywall(req(`/api/paywall?case=${CASE}`)));
    expect(r.body.priceCents).toBe(4900);
    expect(r.body.checkoutAvailable).toBe(true);
    process.env.PRICE_CENTS = '';
    r = await js(await paywall(req(`/api/paywall?case=${CASE}`)));
    expect(r.body.priceCents).toBe(null);
    expect(r.body.checkoutAvailable).toBe(false);
  });
  it('refuses other people\'s cases', async () => {
    const r = await js(await paywall(req(`/api/paywall?case=${CASE}`, { token: 'tok-other' })));
    expect(r.status).toBe(404);
  });
});

describe('checkout', () => {
  it('sends Stripe only an opaque reference and the configured price', async () => {
    saveAnswers(CASE, readyAnswers());
    await checkout(req('/api/checkout', { method: 'POST', body: { caseId: CASE } }));
    const s = sessions[0];
    const sent = JSON.stringify(s);
    expect(s.line_items[0].price_data.unit_amount).toBe(4900);
    expect(s.metadata.case_ref).toMatch(/^r_[0-9a-f]{24}$/);
    expect(sent).not.toContain(CASE);
    expect(sent).not.toContain('Rivera');
    expect(sent).not.toMatch(/support|family court|custody/i);
    expect(s.payment_intent_data.statement_descriptor_suffix).toBe('FORMPREP');
    expect(db.T('payments')[0]).toMatchObject({ status: 'pending', case_id: CASE });
  });
  it('is blocked until the checklist and acknowledgment are done', async () => {
    saveAnswers(CASE, TYPICAL);
    const r = await js(await checkout(req('/api/checkout', { method: 'POST', body: { caseId: CASE } })));
    expect(r.status).toBe(409);
    expect(sessions).toHaveLength(0);
  });
  it('is closed while the price is a placeholder', async () => {
    saveAnswers(CASE, readyAnswers());
    process.env.PRICE_CENTS = '';
    const r = await js(await checkout(req('/api/checkout', { method: 'POST', body: { caseId: CASE } })));
    expect(r.status).toBe(503);
  });
});

describe('webhook', () => {
  it('rejects a forged event', async () => {
    const payload = JSON.stringify({ type: 'checkout.session.completed', data: { object: {} } });
    const r = await webhook(req('/api/stripe-webhook', { method: 'POST', body: payload, token: null, headers: { 'stripe-signature': 't=1,v1=bad' } }));
    expect(r.status).toBe(400);
  });

  it('marks paid with an access window, and is idempotent', async () => {
    saveAnswers(CASE, readyAnswers());
    const s = await payViaWebhook();
    const p = db.T('payments')[0];
    expect(p.status).toBe('paid');
    const days = (new Date(p.access_expires_at) - new Date(p.paid_at)) / 86400_000;
    expect(Math.round(days)).toBe(60);
    expect(db.T('cases')[0].status).toBe('paid');
    // Same event again: no change.
    const before = p.paid_at;
    await webhook(signedEvent('checkout.session.completed', { id: s.id, payment_status: 'paid', amount_total: 4900, metadata: s.metadata }));
    expect(db.T('payments')[0].paid_at).toBe(before);
  });

  it('does not unlock for an unpaid (pending) session', async () => {
    saveAnswers(CASE, readyAnswers());
    await checkout(req('/api/checkout', { method: 'POST', body: { caseId: CASE } }));
    const s = sessions[0];
    await webhook(signedEvent('checkout.session.completed', { id: s.id, payment_status: 'unpaid', metadata: s.metadata }));
    expect(db.T('payments')[0].status).toBe('pending');
  });

  it('a full refund revokes access; a partial refund does not', async () => {
    saveAnswers(CASE, readyAnswers());
    const s = await payViaWebhook();
    await webhook(signedEvent('charge.refunded', { id: 'ch_1', refunded: false, payment_intent: 'pi_' + s.id }));
    expect(db.T('payments')[0].status).toBe('paid');
    await webhook(signedEvent('charge.refunded', { id: 'ch_1', refunded: true, payment_intent: 'pi_' + s.id }));
    expect(db.T('payments')[0].status).toBe('refunded');
    expect(db.T('cases')[0].status).toBe('draft');
    const r = await js(await download(req('/api/download', { method: 'POST', body: { caseId: CASE } })));
    expect(r.status).toBe(402);
  });
});

describe('download', () => {
  it('refuses before payment (success page alone unlocks nothing)', async () => {
    saveAnswers(CASE, readyAnswers());
    await checkout(req('/api/checkout', { method: 'POST', body: { caseId: CASE } }));
    const r = await js(await download(req('/api/download', { method: 'POST', body: { caseId: CASE } })));
    expect(r.status).toBe(402);
  });

  it('after payment: short-lived link -> clean PDF, not stored, logged', async () => {
    saveAnswers(CASE, readyAnswers());
    await payViaWebhook();
    const link = await js(await download(req('/api/download', { method: 'POST', body: { caseId: CASE } })));
    expect(link.status).toBe(200);
    expect(link.body.expiresInSeconds).toBeLessThanOrEqual(300);
    const pdf = await download(req(link.body.url, { token: null }));
    expect(pdf.status).toBe(200);
    expect(pdf.headers.get('content-type')).toBe('application/pdf');
    const bytes = Buffer.from(await pdf.arrayBuffer());
    expect(bytes.subarray(0, 4).toString()).toBe('%PDF');
    const d = db.T('documents_generated').find((x) => x.watermarked === false);
    expect(d).toMatchObject({ storage_key: null, form_version_id: 'fv1' });
  });

  it('rejects tampered or expired links, and other users', async () => {
    saveAnswers(CASE, readyAnswers());
    await payViaWebhook();
    const link = await js(await download(req('/api/download', { method: 'POST', body: { caseId: CASE } })));
    // Flip a character in the middle of the signature (the last base64url char can carry unused bits).
    const i = link.body.url.length - 10;
    const bad = link.body.url.slice(0, i) + (link.body.url[i] === 'A' ? 'B' : 'A') + link.body.url.slice(i + 1);
    expect((await download(req(bad, { token: null }))).status).toBe(403);
    const other = await js(await download(req('/api/download', { method: 'POST', body: { caseId: CASE }, token: 'tok-other' })));
    expect(other.status).toBe(404);
  });

  it('expires after the access window', async () => {
    saveAnswers(CASE, readyAnswers());
    await payViaWebhook();
    db.T('payments')[0].access_expires_at = new Date(Date.now() - 1000).toISOString();
    const r = await js(await download(req('/api/download', { method: 'POST', body: { caseId: CASE } })));
    expect(r.status).toBe(403);
    const pw = await js(await paywall(req(`/api/paywall?case=${CASE}`)));
    expect(pw.body.access.state).toBe('expired');
    expect(db.T('cases')[0].status).toBe('expired');
  });

  it('rate-limits downloads', async () => {
    saveAnswers(CASE, readyAnswers());
    await payViaWebhook();
    for (let i = 0; i < 20; i++) db.T('documents_generated').push({ case_id: CASE, watermarked: false, generated_at: new Date().toISOString() });
    const r = await js(await download(req('/api/download', { method: 'POST', body: { caseId: CASE } })));
    expect(r.status).toBe(429);
  });
});
