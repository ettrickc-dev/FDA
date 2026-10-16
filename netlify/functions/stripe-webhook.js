// POST /api/stripe-webhook   (configure this URL in the Stripe dashboard)
// The ONLY thing that unlocks access. Verifies Stripe's signature, is idempotent
// (Stripe may send the same event more than once), and revokes access on refund.
// Events handled:
//   checkout.session.completed / checkout.session.async_payment_succeeded -> paid
//   checkout.session.async_payment_failed / checkout.session.expired      -> failed
//   charge.refunded (full refund)                                          -> refunded, access revoked
//   charge.dispute.created                                                 -> audit only (owner decides)
import { addDays } from './_lib/access.js';
import { ownerConfig } from './_lib/config.js';
import { admin, audit, json } from './_lib/http.js';
import { stripe } from './_lib/stripe.js';

async function findPayment(session) {
  const ref = session.metadata?.case_ref || session.client_reference_id;
  let q = admin().from('payments').select('id,case_id,status,case_ref').eq('stripe_session_id', session.id).maybeSingle();
  let { data } = await q;
  if (!data && ref) ({ data } = await admin().from('payments').select('id,case_id,status,case_ref').eq('case_ref', ref).maybeSingle());
  return data;
}

async function markPaid(session) {
  if (session.payment_status !== 'paid') return 'not_paid_yet';
  const p = await findPayment(session);
  if (!p) return 'unknown_payment';
  if (p.status === 'paid' || p.status === 'refunded') return 'already_processed';
  const { accessDays } = ownerConfig();
  const paidAt = new Date();
  const { error } = await admin().from('payments').update({
    status: 'paid',
    paid_at: paidAt.toISOString(),
    access_expires_at: addDays(paidAt, accessDays || 0).toISOString(),
    amount_cents: session.amount_total,
    stripe_payment_intent: typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id || null,
  }).eq('id', p.id).eq('status', 'pending');
  if (error) throw new Error('db');
  if (p.case_id) {
    await admin().from('cases').update({ status: 'paid' }).eq('id', p.case_id);
    await audit(null, 'payment.paid', p.case_id);
  }
  return 'paid';
}

async function markFailed(session) {
  const p = await findPayment(session);
  if (!p || p.status !== 'pending') return 'ignored';
  await admin().from('payments').update({ status: 'failed' }).eq('id', p.id).eq('status', 'pending');
  return 'failed';
}

async function markRefunded(charge) {
  if (!charge.refunded) return 'partial_refund_ignored'; // only full refunds revoke access
  const pi = typeof charge.payment_intent === 'string' ? charge.payment_intent : charge.payment_intent?.id;
  if (!pi) return 'no_payment_intent';
  const { data: p } = await admin().from('payments').select('id,case_id,status').eq('stripe_payment_intent', pi).maybeSingle();
  if (!p) return 'unknown_payment';
  if (p.status === 'refunded') return 'already_processed';
  await admin().from('payments').update({ status: 'refunded', refunded_at: new Date().toISOString() }).eq('id', p.id);
  if (p.case_id) {
    await admin().from('cases').update({ status: 'draft' }).eq('id', p.case_id);
    await audit(null, 'payment.refunded', p.case_id);
  }
  return 'refunded';
}

export default async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  const sig = req.headers.get('stripe-signature');
  const raw = await req.text();
  let event;
  try {
    event = await stripe().webhooks.constructEventAsync(raw, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch {
    console.error('[stripe-webhook] signature verification failed');
    return new Response('Bad signature', { status: 400 });
  }
  try {
    let result = 'ignored';
    switch (event.type) {
      case 'checkout.session.completed':
      case 'checkout.session.async_payment_succeeded':
        result = await markPaid(event.data.object); break;
      case 'checkout.session.async_payment_failed':
      case 'checkout.session.expired':
        result = await markFailed(event.data.object); break;
      case 'charge.refunded':
        result = await markRefunded(event.data.object); break;
      case 'charge.dispute.created':
        await audit(null, 'payment.dispute_opened', null); result = 'logged'; break;
      default: break;
    }
    // Log only the event type and outcome — never customer details.
    console.log(`[stripe-webhook] ${event.type} -> ${result}`);
    return json({ received: true, result });
  } catch {
    console.error(`[stripe-webhook] processing error for ${event.type}`);
    return new Response('Retry later', { status: 500 }); // Stripe will retry
  }
};

export const config = { path: '/api/stripe-webhook' };
