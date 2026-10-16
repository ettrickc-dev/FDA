# Form 4-17a Prep (Form Prep)

Mobile-first web app that helps people prepare NY Family Court Form 4-17a
(Financial Disclosure Affirmation, Short Form). React + Vite on Netlify, Netlify Functions,
Supabase (Postgres + Auth), Stripe Checkout (added in build step 6).

**Build status:** step 6 of 9 complete — …through review + DRAFT preview, plus paywall, Stripe Checkout (test mode), webhook, and clean PDF download.

## How the pieces fit

- **Browser** talks to Supabase *only to log in*. Session is kept in `sessionStorage`, so
  closing the tab logs the person out (shared-device safety).
- **All case data** goes through Netlify Functions under `/api/*`. Each function checks the
  login token and that the case belongs to that user.
- **Answers are encrypted in the function** with AES-256-GCM (`netlify/functions/_lib/crypto.js`)
  before they reach the database. The key never leaves Netlify's environment variables.
  The case id and screen name are bound into the encryption, so data cannot be swapped between cases.
- **Row-level security** is on for every table. The browser cannot read the `answers`,
  `red_flags`, `uploads`, `consents`, `payments` or `audit_log` tables at all.
- **Logging:** functions log only an error category, never request bodies or answers.

## Local setup

```bash
npm install
cp .env.example .env        # fill in values (see below)
npm install -g netlify-cli
netlify dev                 # runs the app and the functions together at http://localhost:8888
npm test                    # encryption tests + automated checks of the spec's hard rules
```

## Environment variables

| Name | Where | Notes |
|---|---|---|
| `VITE_SUPABASE_URL` | browser | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | browser | Supabase publishable (anon) key — safe to expose |
| `SUPABASE_URL` | functions | same URL |
| `SUPABASE_SERVICE_ROLE_KEY` | functions | **secret** |
| `ANSWERS_ENC_KEY` | functions | **secret**, `openssl rand -base64 32` |
| `ANSWERS_ENC_KEY_VERSION` | functions | `1` to start |
| `IP_HASH_SALT` | functions | **secret**, `openssl rand -hex 32` |
| `SUPPORT_EMAIL` | functions | ettrickc@gmail.com |
| `PRICE_CENTS`, `ACCESS_DAYS`, `REFUND_DAYS`, `DRAFT_RETENTION_DAYS`, `UPLOAD_RETENTION_DAYS`, `STRIPE_STATEMENT_DESCRIPTOR` | functions | owner decisions, placeholders for now |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | functions | **test keys** (`sk_test_…`, `whsec_…`) until go-live |
| `DOWNLOAD_TOKEN_SECRET` | functions | **secret**, `openssl rand -hex 32` |

Enter secrets in **Netlify → Site configuration → Environment variables**. Use separate values
for *Deploy Previews* (test) and *Production* (live). Never paste secrets into chat or commit them.

**Lose `ANSWERS_ENC_KEY` and saved answers cannot be recovered.** Store a copy in a password manager.

## Database

Migration: `supabase/migrations/0001_init.sql`. Apply with the Supabase CLI
(`supabase db push`) or paste into the Supabase SQL editor.

Supabase dashboard settings to change:
1. **Authentication → Email templates:** neutral wording. Suggested subject
   "Confirm your account" / "Reset your password"; body must not mention court, child support,
   or family matters.
2. **Authentication → URL configuration:** site URL = your subdomain; add `/home` as a redirect URL.
3. **Authentication → Providers → Email:** keep "Confirm email" on; minimum password length 10.

## Netlify deploy

1. Netlify → Add new project → Import from GitHub → `ettrickc-dev/FDA`.
2. Build command `npm run build`, publish directory `dist` (already in `netlify.toml`).
3. Add environment variables (above).
4. Domain management → add the subdomain.

`netlify.toml` sets strict security headers, including a Content-Security-Policy that blocks
third-party scripts (no analytics or trackers).

## Notes and deviations from the spec

- Uses Supabase Auth for users instead of a custom `users.password_hash` column; extra user fields
  live in `profiles`.
- Docket #, file # and court date are stored inside the encrypted answers instead of plain
  columns on `cases`.
- Netlify Identity was reversed from deprecation in Feb 2026; not used regardless.
- Confidential address: when the user says sharing their address is a risk, the address is not
  collected and the form will print "Confidential – see GF-21 application."

## Editing content (no coding needed beyond text)

| What | File |
|---|---|
| Question screens, labels, order | `src/content/screens.js` |
| "What counts here?" help text (ATTORNEY TO REVIEW) | `src/content/help.js` |
| Red-flag questions, prompts, hotline numbers | `src/content/redFlags.js` |
| Document checklist | `src/lib/checklist.js` |
| Attorney name, ad label, links | `src/config.js` |

`npm test` checks the hard rules (banned words, fee wording, no price before the paywall,
no trackers) every time content changes.

## Owner decisions recorded
- Support email: ettrickc@gmail.com.
- Confidential address prints "Confidential – see GF-21 application"; the address is not collected.
- The "Print or type name" line under the signature is filled from the person's full legal name.
  Signature and date stay blank.
- Form template: 4-17a revision 1/2026 (`forms/`).

## PDF generation (Form 4-17a, 1/2026)

- Template: `forms/4-17a_2026-01.pdf` (no fillable fields). Positions: `forms/4-17a_2026-01.map.json`
  (also stored in `form_versions.field_map`, migration 0003).
- Code: `netlify/functions/_lib/pdf/model.js` (answers → what goes on each line) and `fill.js` (draws it).
- Font: DejaVu Sans Condensed (embedded; handles accented names). Answers print in dark blue.
- Long entries shrink to fit (min 6.5 pt). If still too long, the line shows the start + "(see att.)" and the
  full entry goes on an attachment page. Dollar amounts are never cut off.
- Extra rows (other jobs, 4+ other-income sources, 2+ support orders, 2+ accounts/vehicles/homes,
  3+ other assets, 3+ debts) go on "Attachment to Form 4-17a" pages, and "(see attached page)" is
  printed next to that section. Attachment pages carry a blank "Initials" line.
- Never filled: signature, affirmation date. Filled: "Print or type name".
- Petitioner/Respondent is circled.

**Check placement:** `node scripts/pdf-check.mjs out/` renders 8 fictional cases (empty, typical, confidential,
self-employed, every checkbox ×2, max length, overflow) to PDF + PNG.
**When the court revises the form:** the check script stops if the template hash changes. Run
`python3 scripts/measure_form.py <new.pdf>` to list blank positions, make a new map file, re-run the check.

## Draft preview (step 5)

- `GET /api/preview?case=…` fills the form with a DRAFT watermark, then renders each page to a PNG
  image on the server (PDFium compiled to WebAssembly — no native binaries) and returns the images.
  **No PDF leaves the server on this path**, the answers are not selectable text, and the watermark is
  part of the pixels. Images are 110 dpi grayscale: readable on screen, poor for printing.
- Why images: testing showed the PDF watermark is a separate layer anyone can delete in a PDF editor,
  and the answers underneath are copyable text.
- Nothing is stored. Each preview is logged in `documents_generated` (watermarked = true, no file).
  Limit: 40 previews per case per hour.
- Review checks: `src/lib/reviewChecks.js` ("Please fix" vs "Worth a second look"; never blocking).
- "Unlock final form" requires the sworn-statement acknowledgment and a finished document checklist.

## Payments (step 6)

**Flow:** review → paywall (`/case/:id/unlock`, the first and only screen showing the price) →
Stripe-hosted Checkout → back to `/checkout/return`, which waits for the server → download page.

- `GET /api/paywall` — the only endpoint that returns the price (from `PRICE_CENTS`).
- `POST /api/checkout` — requires a finished document checklist and the "I understand" acknowledgment.
  Sends Stripe only an opaque reference (`r_…`), the price, and the neutral product name
  "Document preparation access". No names, case ids, or answers go to Stripe.
- `POST /api/stripe-webhook` — **the only thing that unlocks access.** Verifies Stripe's signature,
  ignores duplicates, sets `access_expires_at = paid_at + ACCESS_DAYS`. A **full** refund revokes access;
  partial refunds don't. Disputes are logged only.
- `POST /api/download` → 5-minute signed link → `GET /api/download?t=…` regenerates the clean PDF from
  current answers after re-checking login, ownership, payment, expiry, checklist. Never stored. 20 per day.
  Each download is logged in `documents_generated` (delivery evidence for chargebacks, with `consents`).
- Placeholders: while `PRICE_CENTS`, `ACCESS_DAYS`, or `REFUND_DAYS` is blank, the paywall shows
  "[price not set]" / "[N]" and payment stays closed.

### Test it (Stripe test mode)

1. Stripe dashboard → make sure **Test mode** is on → Developers → API keys → copy the *secret* test key
   into Netlify as `STRIPE_SECRET_KEY` (Deploy Previews + local). Never paste it into chat.
2. Webhook: Developers → Webhooks → Add endpoint → `https://<your-site>/api/stripe-webhook`, events:
   `checkout.session.completed`, `checkout.session.async_payment_succeeded`,
   `checkout.session.async_payment_failed`, `checkout.session.expired`, `charge.refunded`,
   `charge.dispute.created`. Copy its signing secret into `STRIPE_WEBHOOK_SECRET`.
3. Local testing: `stripe login` then `stripe listen --forward-to localhost:8888/api/stripe-webhook`
   (use the `whsec_…` it prints), and `netlify dev`.
4. Set test values, e.g. `PRICE_CENTS=100`, `ACCESS_DAYS=60`, `REFUND_DAYS=7`.
5. Test cards (any future date, any CVC, any ZIP):
   - `4242 4242 4242 4242` — succeeds
   - `4000 0000 0000 9995` — declined (insufficient funds)
   - `4000 0025 0000 3155` — requires authentication (3-D Secure)
6. Check: paying unlocks the download page; pressing Back from Stripe changes nothing; refunding the
   payment in the dashboard locks the download again; `npm test` covers all of this automatically too.

### Stripe settings to make neutral (dashboard)
- Settings → Public details → **statement descriptor**: a neutral name (not "child support" or "court").
- Settings → Customer emails → turn on receipts only if the wording is neutral; check the business name.
- Branding → neutral name and icon on the Checkout page.

### Not decided yet (configurable, owner/accountant)
- Sales tax / Stripe Tax: **off**. Turn on only after your accountant confirms (`automatic_tax` in checkout.js).
- Failed payments: the person simply stays on the paywall and can try again.
- Re-purchase after expiry: allowed; the paywall says the earlier access period ended.
