# Private go-live checklist (owner only)

Do these yourself. Never paste keys into a chat.

## Launch gates (spec Section 14 — yours, not the code's)
- [ ] Ethics counsel sign-off in writing (Terms, Privacy, ad label, red-flag prompts, recommendations, consult link)
- [ ] Malpractice and cyber insurance confirmed
- [ ] Content review by a Family Court practitioner (help text, recommendations, next steps)
- [ ] Security review
- [ ] Privacy policy matches actual system behavior (`src/pages/LegalPages.jsx` was written to match it today)
- [ ] 3–5 real-user tests on phones
- [ ] Soft launch before marketing
- [ ] Supabase email templates set from `docs/email-templates.md`; custom SMTP with a neutral sender
- [ ] Attorney consultation link set in `src/config.js` (`ATTORNEY_CONSULT_URL`)
- [ ] "Rules in effect on [date]" set on the Terms screen (`RULES_EFFECTIVE_DATE` in `src/config.js`)

## Before switching Stripe to live
- [ ] Section 0 decided and set in Netlify (Production): `PRICE_CENTS`, `ACCESS_DAYS`, `REFUND_DAYS`,
      `DRAFT_RETENTION_DAYS`, `UPLOAD_RETENTION_DAYS`, `STRIPE_STATEMENT_DESCRIPTOR`.
- [ ] Refund-policy page numbers filled in (`src/pages/RefundPolicy.jsx`), matching `REFUND_DAYS`.
- [ ] Accountant has confirmed sales-tax handling.
- [ ] Ethics counsel written sign-off; malpractice + cyber coverage confirmed; Family Court practitioner content review;
      security review; privacy policy matches actual behavior; 3–5 real-user tests (spec Section 14).
- [ ] Hotline numbers re-verified (`src/content/redFlags.js`).

## Stripe live switch
1. Stripe dashboard → activate the account (business details, bank account).
2. Settings → Public details: neutral statement descriptor and business name.
3. Turn **off** test mode → Developers → API keys → reveal the **live secret key**.
4. Netlify → Site configuration → Environment variables → `STRIPE_SECRET_KEY` →
   set a **Production-only** value = live key. Keep the test key for Deploy Previews / branch deploys.
5. Stripe (live mode) → Developers → Webhooks → add endpoint
   `https://<your-subdomain>/api/stripe-webhook` with the same 6 events → copy the live signing secret →
   Netlify `STRIPE_WEBHOOK_SECRET` (Production-only value).
6. Redeploy production. Make one real purchase with your own card, download, then refund it from the
   dashboard and confirm the download locks again.

## Domain
1. Netlify → Domain management → Add domain → `forms.<yoursite>.com`.
2. At your DNS provider: CNAME `forms` → `<your-netlify-site>.netlify.app`.
3. Wait for Netlify to issue the HTTPS certificate; turn on "Force HTTPS".
4. Supabase → Authentication → URL configuration → Site URL = `https://forms.<yoursite>.com`,
   add `https://forms.<yoursite>.com/home` to redirect URLs.

## Secrets (Production values, generate fresh — don't reuse test ones)
- `ANSWERS_ENC_KEY` (`openssl rand -base64 32`) — **store a copy in a password manager; losing it loses all answers**
- `DOWNLOAD_TOKEN_SECRET`, `IP_HASH_SALT` (`openssl rand -hex 32`)
- `SUPABASE_SERVICE_ROLE_KEY` (Supabase → Project Settings → API)
