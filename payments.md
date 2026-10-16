# Payments (Stripe)

**Flow:** review → paywall (`/case/:id/unlock`, the first and only screen showing the price) →
Stripe-hosted Checkout → `/checkout/return` (waits for the server) → download page.

- `GET /api/paywall` — the only endpoint that returns the price (`PRICE_CENTS`).
- `POST /api/checkout` — requires a finished document checklist and the "I understand" acknowledgment.
  Sends Stripe only an opaque reference (`r_…`), the price, and the neutral product name
  "Document preparation access". No names, case ids, or answers go to Stripe.
- `POST /api/stripe-webhook` — **the only thing that unlocks access.** Verifies Stripe's signature, ignores
  duplicates, sets `access_expires_at = paid_at + ACCESS_DAYS`. A **full** refund revokes access; partial
  refunds don't. Disputes are logged only.
- `POST /api/download` → 5-minute signed link → `GET /api/download?t=…` regenerates the clean PDF from the
  current answers after re-checking login, ownership, payment, expiry and checklist. Never stored.
  20 per case per day. Each download is logged (`documents_generated`) — with `consents`, this is your
  chargeback evidence (consent record + delivery log).
- While `PRICE_CENTS`, `ACCESS_DAYS` or `REFUND_DAYS` is blank, the paywall shows "[price not set]" /
  "[N]" and payment stays closed.

## Test mode

1. Stripe dashboard → **Test mode** on → Developers → API keys → copy the secret test key into Netlify as
   `STRIPE_SECRET_KEY` (Deploy Previews + local `.env`).
2. Developers → Webhooks → Add endpoint `https://<site>/api/stripe-webhook`, events:
   `checkout.session.completed`, `checkout.session.async_payment_succeeded`,
   `checkout.session.async_payment_failed`, `checkout.session.expired`, `charge.refunded`,
   `charge.dispute.created`. Copy the signing secret into `STRIPE_WEBHOOK_SECRET`.
3. Local: `stripe login`, then `stripe listen --forward-to localhost:8888/api/stripe-webhook` (use the
   `whsec_…` it prints) and `netlify dev`.
4. Test values: `PRICE_CENTS=100`, `ACCESS_DAYS=60`, `REFUND_DAYS=7`.
5. Test cards (any future expiry, any CVC, any ZIP):
   `4242 4242 4242 4242` succeeds · `4000 0000 0000 9995` declined · `4000 0025 0000 3155` needs 3-D Secure.
6. Check by hand: paying unlocks the download page; Back from Stripe unlocks nothing; refunding in the
   dashboard locks the download again. `npm test` covers these automatically too.

## Neutral Stripe settings (dashboard)
- Settings → Public details → statement descriptor: neutral business name (nothing about court or support).
- Settings → Customer emails → receipts on only if the business name/wording is neutral.
- Settings → Branding → neutral name and icon on the Checkout page.

## Configurable, not decided
- Sales tax / Stripe Tax: **off** until the accountant confirms (add `automatic_tax: { enabled: true }` in `checkout.js`).
- Failed payment: the person stays on the paywall and can retry.
- Re-purchase after expiry: allowed; the paywall says the earlier access period ended.
