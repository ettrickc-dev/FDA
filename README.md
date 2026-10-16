# Form 4-17a Prep (Form Prep)

Mobile-first web app that helps people prepare NY Family Court Form 4-17a
(Financial Disclosure Affirmation, Short Form). React + Vite on Netlify, Netlify Functions,
Supabase (Postgres + Auth), Stripe Checkout (added in build step 6).

**Build status:** step 2 of 9 complete (scaffold, database, login, encrypted save/resume, Screen 1).

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
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | functions | step 6; **test keys** until go-live |

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
