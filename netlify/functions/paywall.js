// GET /api/paywall?case=<id>
// The ONLY endpoint that returns the price (spec Rule 2.2). Called by the paywall screen.
import { getAccess, syncCaseStatus } from './_lib/access.js';
import { loadAnswers } from './_lib/answers.js';
import { missingForCheckout, ownerConfig } from './_lib/config.js';
import { handler, HttpError, json, requireOwnCase, requireUser } from './_lib/http.js';
import { readiness } from './_lib/readiness.js';

export default handler('paywall', async (req) => {
  if (req.method !== 'GET') throw new HttpError(405);
  const user = await requireUser(req);
  const caseId = new URL(req.url).searchParams.get('case');
  await requireOwnCase(user.id, caseId);
  const cfg = ownerConfig();
  const access = await getAccess(caseId);
  await syncCaseStatus(caseId, access);
  const ready = readiness(await loadAnswers(caseId));
  return json({
    priceCents: cfg.priceCents,          // null = owner hasn't set it yet
    currency: cfg.currency,
    accessDays: cfg.accessDays,
    refundDays: cfg.refundDays,
    statementSuffix: cfg.statementSuffix,
    checkoutAvailable: missingForCheckout(cfg).length === 0,
    access: { state: access.state, expiresAt: access.expiresAt || access.payment?.access_expires_at || null },
    ready,
  });
});

export const config = { path: '/api/paywall' };
