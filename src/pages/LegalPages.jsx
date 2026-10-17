// Terms of Use and Privacy Policy (spec Section 8). Drafted Oct 2026 for the owner's review and
// sign-off. The privacy policy is written to match what the system actually does today; keep it in
// sync if the system changes (vendors, backups, uploads, retention numbers in config.js).
//
// Notes for the owner (not shown on the page):
// - §2 / Rule 1.18: the tool collects no case facts for the attorney, and the WhatsApp/phone line
//   asks people not to share case details until a conflict check is done.
// - §7 / Rule 1.8(h): the cap applies to the document-preparation service only; it expressly does
//   not limit any duty owed to a client and does not cover a separate consultation.
import Shell from '../components/Shell.jsx';
import {
  ACCESS_DAYS_TEXT, ATTORNEY, ATTORNEY_PHONE_TEXT, LEGAL_EFFECTIVE_DATE, RETENTION_DAYS_TEXT,
  RULES_EFFECTIVE_DATE, SUPPORT_EMAIL, TERMS_VERSION,
} from '../config.js';

function Section({ title, children }) {
  return (
    <section className="card legal">
      <h2>{title}</h2>
      {children}
    </section>
  );
}

const Mail = () => <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>;

export function TermsOfUse() {
  return (
    <Shell>
      <h1>Terms of Use</h1>
      <p className="hint">Version {TERMS_VERSION} · Effective {LEGAL_EFFECTIVE_DATE}</p>
      <Section title="1. What this service is">
        <p>This website ("the tool") helps you prepare the New York Family Court Financial Disclosure Affirmation (Form 4-17a, Short Form). It provides document preparation and general legal information only. It is offered by {ATTORNEY.name}, Attorney at Law, {ATTORNEY.address} ("we," "us").</p>
        <p>By creating an account or using the tool, you agree to these Terms. If you do not agree, please do not use the tool.</p>
      </Section>
      <Section title="2. No attorney-client relationship">
        <p>Using the tool is not legal advice and does not create an attorney-client relationship, or a prospective-client relationship, with {ATTORNEY.name} or anyone else. No lawyer reviews your answers, and the information you enter is not shared with a lawyer.</p>
        <p>An attorney consultation is a separate, paid service. It begins only after a conflict check and a separate written agreement. If you contact us by WhatsApp or phone ({ATTORNEY_PHONE_TEXT}), please do not share details about your case until we confirm that we can help you.</p>
      </Section>
      <Section title="3. Accuracy of information and court forms">
        <p>Information in the tool is general and may not fit your situation. Results are estimates based on what you enter and on rules and amounts in effect on {RULES_EFFECTIVE_DATE}. Courts revise their forms; the tool uses Form 4-17a revision 1/2026. We try to keep forms and information current but cannot promise that they are.</p>
      </Section>
      <Section title="4. Your responsibility">
        <p>You are responsible for every answer and for reviewing the completed form before you sign it. The form is a sworn statement made under penalty of perjury; false statements can lead to penalties. You agree to give true and complete information and to sign the form yourself.</p>
        <p>You agree to use the tool only to prepare your own form, to keep your password private, and not to misuse, copy, or interfere with the tool.</p>
      </Section>
      <Section title="5. No promise about the court">
        <p>We make no promise that a court will accept the form, rule in any particular way, or set any particular amount, and no promise that this form is the right form for your case.</p>
      </Section>
      <Section title="6. Fees and refunds">
        <p>Previewing is free. Downloading or printing the final, unwatermarked forms requires payment.</p>
        <p>The price is shown on the payment screen before you pay. It includes unlimited edits and downloads for {ACCESS_DAYS_TEXT} days. No other fees are added at checkout. Payments are processed by Stripe. Refunds follow our <a href="/refunds">Refund Policy</a>.</p>
      </Section>
      <Section title="7. Limitation of liability">
        <p>The tool is provided "as is." To the fullest extent the law allows, our total liability to you for any claim arising from your use of the tool is limited to the amount you paid for it, and we are not responsible for indirect or consequential losses, including the outcome of any court case.</p>
        <p>Nothing in these Terms limits any liability that cannot be limited by law, including any duty a lawyer owes to a client under the New York Rules of Professional Conduct. This section does not apply to any separate attorney consultation, which is governed by its own agreement.</p>
      </Section>
      <Section title="8. Governing law and venue">
        <p>These Terms are governed by the laws of the State of New York. Any dispute about them will be heard in the state courts located in Kings County, New York.</p>
      </Section>
      <Section title="9. Privacy and data retention">
        <p>See the <a href="/privacy">Privacy Policy</a>. You can delete your data at any time.</p>
      </Section>
      <Section title="10. Safety">
        <p>If you are worried someone may see your activity, use a private browsing window, close the tab when finished, and delete downloaded files. The Quick exit button leaves the site immediately. Emails from us use neutral wording. If you are in danger, call 911.</p>
      </Section>
      <Section title="11. Changes to these Terms">
        <p>We may update these Terms. The version and effective date are shown at the top. If we make an important change, we will ask you to accept the new Terms before you continue.</p>
      </Section>
      <Section title="12. Attorney advertising">
        <p>This website may be considered Attorney Advertising. Prior results do not guarantee a similar outcome.</p>
      </Section>
      <Section title="13. Contact">
        <p><Mail /></p>
      </Section>
    </Shell>
  );
}

export function PrivacyPolicy() {
  return (
    <Shell>
      <h1>Privacy Policy</h1>
      <p className="hint">Version {TERMS_VERSION} · Effective {LEGAL_EFFECTIVE_DATE}</p>
      <Section title="What we collect">
        <ul>
          <li><strong>Account:</strong> your email address and a password (stored only as a secure hash by our login provider).</li>
          <li><strong>Your answers:</strong> everything you enter on the form screens and the situation and safety questions.</li>
          <li><strong>Records:</strong> which version of the Terms you accepted and when, with a one-way scrambled (hashed) version of your IP address; when previews and downloads were made; payment status.</li>
          <li><strong>Uploads:</strong> we don't accept uploaded papers.</li>
        </ul>
      </Section>
      <Section title="How we use it">
        <p>We use your information only to run the tool: to save your progress, fill in your form, show your preview, confirm your payment, and keep the records described here. We do not use it for advertising, and we do not share it with the attorney's law practice for any other purpose.</p>
      </Section>
      <Section title="How we protect it">
        <ul>
          <li>Your answers and safety answers are encrypted by our application before they are stored, in addition to the database's own encryption.</li>
          <li>Each person can only reach their own information.</li>
          <li>We do not use analytics, advertising, tracking, or session-recording tools, and we do not use tracking cookies.</li>
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
          <li><strong>WhatsApp or your phone carrier</strong>, only if you choose to contact the attorney that way. Those conversations happen outside this tool and are covered by those companies' own policies.</li>
        </ul>
        <p>We do not sell your information. We may disclose information if the law requires it, such as in response to a valid court order.</p>
      </Section>
      <Section title="How long we keep it">
        <ul>
          <li>Forms in progress are deleted after {RETENTION_DAYS_TEXT} days without activity.</li>
          <li>Accounts with no forms are deleted after {RETENTION_DAYS_TEXT} days without activity.</li>
          <li>After you delete your data, we keep only: payment records (amount, date, status, a random reference) and Terms-acceptance records, with the link to you removed, for 7 years, for tax, accounting, and payment-dispute purposes.</li>
          <li>Backups: we do not currently keep separate backup copies of the database. If we add backups, deleted information could remain in a backup for up to 7 days before it is overwritten.</li>
        </ul>
      </Section>
      <Section title="Your choices">
        <p>You can delete your account and everything in it at any time using "Delete my data". It takes effect right away. You can also email us with questions about your information.</p>
      </Section>
      <Section title="Children">
        <p>The tool is meant for adults preparing their own court forms. It is not directed to anyone under 18.</p>
      </Section>
      <Section title="Changes to this policy">
        <p>If we change this policy, we will update the version and effective date above. If a change affects how we use information you already gave us, we will ask for your agreement first.</p>
      </Section>
      <Section title="Contact">
        <p><Mail /></p>
      </Section>
    </Shell>
  );
}
