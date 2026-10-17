-- 0004_payments_stripe.sql : link payments to Stripe payment intents (refund handling) and
-- make the opaque case reference unique.
alter table public.payments add column if not exists stripe_payment_intent text;
create unique index if not exists payments_pi_uidx on public.payments(stripe_payment_intent) where stripe_payment_intent is not null;
create unique index if not exists payments_case_ref_uidx on public.payments(case_ref);
create index if not exists documents_generated_case_time_idx on public.documents_generated(case_id, watermarked, generated_at);
