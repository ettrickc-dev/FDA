// Terms of Use and Privacy Policy — SCAFFOLDS (spec Section 8). Every clause is a DRAFT for the
// owner and ethics counsel. Bracketed items are decisions not yet made. The privacy policy is
// written to match what the system actually does today; keep it in sync if the system changes.
import Shell from '../components/Shell.jsx';
import { ATTORNEY, SUPPORT_EMAIL } from '../config.js';

const Draft = () => <p className="notice">[DRAFT — owner and ethics counsel to review before launch. Bracketed items are not yet decided.]</p>;

function Section({ title, children, flag }) {
  return (
    <section className="card legal">
      <h2>{title}</h2>
      {flag && <p className="counsel-flag">Counsel: {flag}</p>}
      {children}
    </section>
  );
}

export function TermsOfUse() {
  return (
    <Shell>
      <h1>Terms of Use</h1>
      <p className="hint">Version 2026-10-draft-1 · Effective [date]</p>
      <Draft />
      <Section title="1. What this service is">
        <p>This website ("the tool") helps you prepare New York Family Court Form 4-17a, the Financial Disclosure Affirmation (Short Form). It provides document preparation and general legal information only. It is offered by {ATTORNEY.name}, Attorney at Law, {ATTORNEY.address}.</p>
      </Section>
      <Section title="2. No attorney-client relationship" flag="Rule 1.18 (prospective clients) — confirm that information entered here does not create prospective-client duties, and how conflicts are handled if a user later books a consultation.">
        <p>Using the tool is not legal advice and does not create an attorney-client relationship, or a prospective-client relationship, with {ATTORNEY.name} or anyone else. No lawyer reviews your answers. An attorney consultation, if offered, is a separate service with its own agreement and fee.</p>
      </Section>
      <Section title="3. Accuracy of information and court forms">
        <p>Information in the tool is general and may not fit your situation. Results are estimates based on what you enter and on rules and amounts in effect on [date]. Courts revise their forms; the tool uses Form 4-17a revision 1/2026. We try to keep forms and information current but cannot promise that they are.</p>
      </Section>
      <Section title="4. Your responsibility">
        <p>You are responsible for every answer and for reviewing the completed form before you sign it. The form is a sworn statement made under penalty of perjury; false statements can lead to penalties. You agree to give true and complete information and to sign the form yourself.</p>
      </Section>
      <Section title="5. No promise about the court">
        <p>We make no promise that a court will accept the form, rule in any particular way, or set any particular amount, and no promise that this form is the right form for your case.</p>
      </Section>
      <Section title="6. Fees and refunds">
        <p>Previewing is free. Downloading or printing the final, unwatermarked forms requires payment.</p>
        <p>The price is shown on the payment screen before you pay. It includes unlimited edits and downloads for [N] days. No other fees are added at checkout. Refunds follow our <a href="/refunds">Refund Policy</a>.</p>
      </Section>
      <Section title="7. Limitation of liability" flag="Rule 1.8(h) — a lawyer may not prospectively limit malpractice liability to a client. Confirm this clause is permissible for a non-client document service and how it interacts with any later consultation.">
        <p>[To be drafted by counsel.]</p>
      </Section>
      <Section title="8. Governing law and venue">
        <p>These terms are governed by New York law. [Venue: courts located in [county], New York.]</p>
      </Section>
      <Section title="9. Privacy and data retention">
        <p>See the <a href="/privacy">Privacy Policy</a>. You can delete your data at any time.</p>
      </Section>
      <Section title="10. Safety">
        <p>If you are worried someone may see your activity, use a private browsing window, close the tab when finished, and delete downloaded files. The Quick exit button leaves the site immediately. Emails from us use neutral wording. If you are in danger, call 911.</p>
      </Section>
      <Section title="11. Attorney advertising">
        <p>This website may be considered Attorney Advertising. Prior results do not guarantee a similar outcome.</p>
      </Section>
      <Section title="12. Contact">
        <p><a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a></p>
      </Section>
    </Shell>
  );
}

export function PrivacyPolicy() {
  return (
    <Shell>
      <h1>Privacy Policy</h1>
      <p className="hint">Version 2026-10-draft-1 · Effective [date]</p>
      <Draft />
      <Section title="What we collect">
        <ul>
          <li><strong>Account:</strong> your email address and a password (stored only as a secure hash by our login provider).</li>
          <li><strong>Your answers:</strong> everything you enter on the form screens and the situation and safety questions.</li>
          <li><strong>Records:</strong> which version of the Terms you accepted and when, with a one-way scrambled (hashed) version of your IP address; when previews and downloads were made; payment status.</li>
          <li><strong>Uploads:</strong> [not offered yet] if added, papers you choose to upload.</li>
        </ul>
      </Section>
      <Section title="How we protect it">
        <ul>
          <li>Your answers and safety answers are encrypted by our application before they are stored, in addition to the database's own encryption.</li>
          <li>Each person can only reach their own information.</li>
          <li>We do not use analytics, advertising, tracking, or session-recording tools.</li>
          <li>We do not put your name, answers, or address in our logs.</li>
          <li>Login is kept only for the browser tab you are using; closing the tab logs you out.</li>
          <li>The draft preview is shown as images; the final form is created only when you download it and is not stored by us afterward.</li>
        </ul>
      </Section>
      <Section title="Who else handles your information">
        <ul>
          <li><strong>Supabase</strong> (database and login), United States.</li>
          <li><strong>Netlify</strong> (website hosting). Like most hosts, Netlify keeps standard request logs that can include IP addresses.</li>
          <li><strong>Stripe</strong> (payments). Stripe collects your payment details and email for the receipt. We send Stripe only a random reference number and the price — never your name, answers, or anything about your case. Stripe's own privacy policy applies to what you give Stripe.</li>
        </ul>
        <p>We do not sell your information.</p>
      </Section>
      <Section title="How long we keep it">
        <ul>
          <li>Forms in progress are deleted after [X] days without activity.</li>
          <li>Accounts with no forms are deleted after [X] days without activity.</li>
          <li>Uploaded papers are deleted after [X] days.</li>
          <li>After you delete your data, we keep only: payment records (amount, date, status, a random reference) and Terms-acceptance records, with the link to you removed, for [period — counsel to confirm].</li>
          <li>Backups: [describe backup schedule and how long backups are kept, per the Supabase plan in use].</li>
        </ul>
      </Section>
      <Section title="Your choices">
        <p>You can delete your account and everything in it at any time using "Delete my data". It takes effect right away.</p>
      </Section>
      <Section title="Contact">
        <p><a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a></p>
      </Section>
    </Shell>
  );
}
