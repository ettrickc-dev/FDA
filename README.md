# Form Prep — NY Family Court Form 4-17a

Mobile-first web app that helps people prepare **NY Family Court Form 4-17a, Financial Disclosure
Affirmation (Short Form), revision 1/2026**. Free to build and preview (watermarked DRAFT); payment
unlocks the clean PDF. Built for Ettrick Campbell, Esquire.

**Status:** all 9 build steps complete (spec Section 13). All legal text is DRAFT for owner and
ethics-counsel review. `npm test` runs 90 automated tests.

---

## 1. How it works

| Layer | What | Where |
|---|---|---|
| Front end | React + Vite, mobile-first, no trackers, strict Content-Security-Policy | `src/` |
| Back end | Netlify Functions (`/api/*`) + one scheduled function | `netlify/functions/` |
| Data + login | Supabase Postgres + Supabase Auth (email/password) | `supabase/migrations/` |
| Payments | Stripe Checkout (hosted) + webhook | `checkout.js`, `stripe-webhook.js` |
| PDF | pdf-lib fills the court PDF at measured positions; PDFium (WebAssembly) renders previews to images | `netlify/functions/_lib/pdf/`, `forms/` |

**Security model**
- The browser talks to Supabase only to log in. All case data goes through functions, which check the
  login token and case ownership on every call.
- Answers (and red-flag answers) are encrypted with AES-256-GCM in the function before storage
  (`_lib/crypto.js`), bound to the case + screen. Key from `ANSWERS_ENC_KEY` only.
- Row-level security is on for every table; the browser has no access to answers, red flags, uploads,
  consents, payments or the audit log.
- Functions log only error categories / event types — never answers, names, emails, or addresses.
- Login session lives in `sessionStorage` (closing the tab logs out — shared-device safety).
- Quick exit on every screen (button or Esc twice) replaces the page so Back doesn't return.

## 2. User flow (16 steps)

Landing → Terms (consent logged) → Account → **Your situation** (role / case type / goal) →
**A few more questions** (red flags, non-blocking, logged) → **Papers to gather** → Form parts 1–10 →
**Information for you** (recommendations) → **Check your papers** → **Review** (consistency checks,
"Before you sign" acknowledgment, DRAFT preview as images) → **Paywall** (price shown here first) →
Stripe → **Download** (+ next steps, attorney link, free legal help, delete my data).

## 3. Editing content (text only, no code)

| What | File |
|---|---|
| Question screens, labels, order | `src/content/screens.js` |
| "What counts here?" help (ATTORNEY TO REVIEW) | `src/content/help.js` |
| Red-flag questions, prompts, hotline numbers | `src/content/redFlags.js` |
| Recommendations decision tree (ATTORNEY TO REVIEW) | `src/content/recommendations.json` |
| Document checklist | `src/lib/checklist.js` |
| Download-page disclaimer, next steps, refund summary | `src/content/afterPurchase.js` |
| Terms of Use, Privacy Policy scaffolds | `src/pages/LegalPages.jsx` |
| Terms screen text, refund policy | `src/pages/Terms.jsx`, `src/pages/RefundPolicy.jsx` |
| Attorney name, ad label, consult + free-help links | `src/config.js` |

After any text change run `npm test`: it checks the hard rules (banned words, exact fee sentences,
no price before the paywall, ad label, no trackers) and that every recommendation is marked for review.

## 4. Environment variables

Set in **Netlify → Site configuration → Environment variables**. Use separate values per context:
*Deploy Previews / branch deploys* = test values; *Production* = live values.

| Name | Secret? | Notes |
|---|---|---|
| `VITE_SUPABASE_URL` | no | `https://rvcidhzqwbmsqtgotidf.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | no | Supabase publishable (anon) key |
| `SUPABASE_URL` | no | same URL |
| `SUPABASE_SERVICE_ROLE_KEY` | **yes** | Supabase → Project Settings → API |
| `ANSWERS_ENC_KEY` | **yes** | `openssl rand -base64 32` — **back it up; losing it loses all answers** |
| `ANSWERS_ENC_KEY_VERSION` | no | `1`; when rotating, bump and keep the old key as `ANSWERS_ENC_KEY_<old>` |
| `DOWNLOAD_TOKEN_SECRET` | **yes** | `openssl rand -hex 32` |
| `IP_HASH_SALT` | **yes** | `openssl rand -hex 32` |
| `STRIPE_SECRET_KEY` | **yes** | `sk_test_…` until go-live |
| `STRIPE_WEBHOOK_SECRET` | **yes** | `whsec_…` from the webhook endpoint |
| `PRICE_CENTS` | no | **placeholder** — blank keeps payment closed |
| `ACCESS_DAYS` | no | **placeholder** |
| `REFUND_DAYS` | no | **placeholder** |
| `DRAFT_RETENTION_DAYS` | no | **placeholder** — blank = nightly job deletes nothing |
| `UPLOAD_RETENTION_DAYS` | no | **placeholder** (uploads not offered yet) |
| `STRIPE_STATEMENT_DESCRIPTOR` | no | neutral card-statement suffix, e.g. `FORMPREP` |
| `SUPPORT_EMAIL` | no | `ettrickc@gmail.com` |

Never paste secret values into a chat or commit them. `.env` is git-ignored.

## 5. Local setup

```bash
npm install
cp .env.example .env          # fill in (test values)
npm install -g netlify-cli
netlify dev                   # app + functions at http://localhost:8888
npm test                      # 90 tests
node scripts/pdf-check.mjs out/          # render 8 fictional cases to PDF + PNG for a visual check
node scripts/pdf-check.mjs out/ --draft
```

## 6. Database (Supabase project `form-prep`, us-east-1)

Migrations in `supabase/migrations/` — **already applied** to the project:
`0001_init` (schema + RLS), `0002_last_step` (resume), `0003_form_version…` (Form 4-17a 1/2026 + field map),
`0004_payments_stripe`. For a new project: `supabase db push`, or paste each file into the SQL editor in order.

Supabase dashboard settings:
1. **Authentication → Email templates:** use `docs/email-templates.md` (neutral wording).
2. **Authentication → URL configuration:** Site URL = your subdomain; add `<site>/home` as a redirect URL.
3. **Authentication → Providers → Email:** keep "Confirm email" on; minimum password length 10.
4. The security advisor lists "RLS enabled, no policy" (INFO) on 8 tables — intended (no browser access).

## 7. Deploy to Netlify

1. Netlify → Add new project → Import from GitHub → `ettrickc-dev/FDA`.
2. Build settings come from `netlify.toml` (`npm run build`, publish `dist`, functions `netlify/functions`,
   `forms/**` included for the PDF functions).
3. Add the environment variables (section 4). Redeploy.
4. Domain: see `GO-LIVE-CHECKLIST.md`.
5. Timing: preview ≈ 0.5 s, download ≈ 0.3 s — well inside Netlify's synchronous function limit.
   The nightly `cleanup` is a Scheduled Function (`@daily`, UTC) and isn't reachable by URL.

## 8. PDF generation

- Template `forms/4-17a_2026-01.pdf` (no fillable fields). Positions: `forms/4-17a_2026-01.map.json`
  (also in `form_versions.field_map`).
- Answers print in dark blue, DejaVu Sans Condensed (embedded; handles accented names).
- Too-long entries shrink to 6.5 pt, then go to an attachment page with "(see att.)" on the line.
  Dollar amounts are never cut off. Extra rows go on "Attachment to Form 4-17a" pages with
  "(see attached page)" printed by the section; attachment pages carry a blank "Initials" line.
- Never filled: signature, affirmation date. Filled: "Print or type name". Petitioner/Respondent circled.
  Confidential address → "Confidential – see GF-21 application" (address not collected).
- **Preview** = page images (110 dpi, grayscale, DRAFT burned in): no PDF and no copyable text leaves
  the server before payment. **Clean PDF** = generated per download, never stored.
- **When the court revises the form:** `scripts/pdf-check.mjs` stops if the template hash changes.
  Run `python3 scripts/measure_form.py <new.pdf>` to list blank positions, create a new map + migration,
  re-run the check script and look at every page.

## 9. Payments

`docs/payments.md`: flow, Stripe test mode, test cards, webhook events, neutral Stripe settings.
Go-live steps: `GO-LIVE-CHECKLIST.md` (private).

## 10. Data retention and deletion

- **Delete my data** (`/delete-my-data`, typed confirmation): immediately deletes account, cases,
  answers, red flags, uploads, generated-document log rows. Keeps payment rows (amount, date, status,
  random reference — case link removed) and consent rows (terms version + time — user link removed);
  removes user/case links from the audit log. Retention period for kept rows: owner/counsel to decide.
- **Nightly job** (`netlify/functions/cleanup.js`): expires ended access; marks abandoned checkouts failed;
  deletes draft/expired cases idle for `DRAFT_RETENTION_DAYS` and idle accounts with no cases; deletes
  uploads past `delete_after`. Does nothing destructive while `DRAFT_RETENTION_DAYS` is blank.
- **Audit log** records actions only (consent accepted, case created, preview, checkout started, paid,
  refunded, dispute opened, download, user deleted, cleanup ran) — never answer contents.

## 11. Owner decisions recorded

- Attorney: Ettrick Campbell, Esquire, 10308 Avenue K, Brooklyn, NY 11236. Support email: ettrickc@gmail.com.
- Confidential address prints "Confidential – see GF-21 application".
- "Print or type name" is filled; signature and date stay blank.
- Form: 4-17a revision 1/2026. Database: Supabase (free plan, project `form-prep`).
- Placeholders still open: price, access days, refund days, retention days, statement descriptor,
  subdomain, sales tax, attorney consultation link, rules-effective date on the Terms screen.

## 12. Open VERIFY items and known limits

- National Domestic Violence Hotline number (1-800-799-7233) — re-verify before launch. NY State hotline
  1-800-942-6906 / text 844-997-2121 verified on opdv.ny.gov (Oct 2026).
- Notarization: not required on the 1/2026 form (affirmation; CPLR 2106) — owner to confirm.
- Whether any court requires a separate child support worksheet with 4-17a — owner (local practice).
- GF-21 / GF-21a referenced from the form's own footnote; those forms were not reviewed.
- Netlify Identity: deprecation was reversed in Feb 2026; not used (Supabase Auth instead).
- Uploads/extraction are scaffolded in the schema and deletion code but not offered in the UI.
- English only; text lives in content files so translation can be added.
- Launch gates (owner): see `GO-LIVE-CHECKLIST.md`.
