// POST /api/checkout { caseId } -> { url }  (Stripe-hosted Checkout)
// Only an opaque reference goes to Stripe — no names, answers, or case ids (spec Section 9).
// The success page does NOT unlock anything; the webhook does.
import { getAccess, newCaseRef } from './_lib/access.js';
import { loadAnswers } from './_lib/answers.js';
import { missingForCheckout, ownerConfig } from './_lib/config.js';
import { admin, audit, handler, HttpError, json, readJson, requireOwnCase, requireUser } from './_lib/http.js';
import { readiness } from './_lib/readiness.js';
import { stripe } from './_lib/stripe.js';

export default handler('checkout', async (req) => {
  if (req.method !== 'POST') throw new HttpError(405);
  const user = await requireUser(req);
  const { caseId } = await readJson(req, 1024);
  await requireOwnCase(user.id, caseId);

  const cfg = ownerConfig();
  if (missingForCheckout(cfg).length) throw new HttpError(503, 'Payments are not open yet. Please check back soon.');

  const access = await getAccess(caseId);
  if (access.active) throw new HttpError(409, 'Your final form is already unlocked.');
  const { ready } = readiness(await loadAnswers(caseId));
  if (!ready) throw new HttpError(409, 'Please finish your document checklist and review before unlocking.');

  const caseRef = newCaseRef();
  const origin = new URL(req.url).origin;
  const session = await stripe().checkout.sessions.create({
    mode: 'payment',
    client_reference_id: caseRef,
    metadata: { case_ref: caseRef },
    line_items: [{
      quantity: 1,
      price_data: {
        currency: cfg.currency,
        unit_amount: cfg.priceCents,
        // Neutral wording: appears on the checkout page and receipt.
        product_data: { name: 'Document preparation access' },
      },
    }],
    payment_intent_data: {
      metadata: { case_ref: caseRef },
      ...(cfg.statementSuffix ? { statement_descriptor_suffix: cfg.statementSuffix } : {}),
    },
    success_url: `${origin}/checkout/return?status=success`,
    cancel_url: `${origin}/checkout/return?status=cancel`,
    expires_at: Math.floor(Date.now() / 1000) + 60 * 60, // 1 hour
  }, { idempotencyKey: `checkout_${caseRef}` });

  const { error } = await admin().from('payments').insert({
    case_id: caseId, case_ref: caseRef, stripe_session_id: session.id,
    amount_cents: cfg.priceCents, currency: cfg.currency, status: 'pending',
  });
  if (error) throw new HttpError(500);
  await audit(user.id, 'checkout.started', caseId);
  return json({ url: session.url });
});

export const config = { path: '/api/checkout' };
