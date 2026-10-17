// Landing page. Persuasion follows three honest drivers (owner request, Oct 2026), framed to
// reassure rather than pressure (NY Rule 7.1: no misleading or coercive claims):
//  1. Fear & safety -> reassurance: private, calm, no contact with the other parent needed.
//  2. Authority -> real, verifiable authority only: the court's own instruction on the form and
//     the attorney who designed the tool. No fake counts, no countdowns, no guilt.
//  3. Connection & purpose -> values (children, fairness) and sharing with other parents.
import { Link } from 'react-router-dom';
import ShareTool from '../components/ShareTool.jsx';
import Shell from '../components/Shell.jsx';
import { ATTORNEY } from '../config.js';

export default function Landing() {
  return (
    <Shell showAd>
      <h1>Complete your NY child support Financial Disclosure form.</h1>
      <p className="lede">
        Step-by-step help preparing Family Court Form 4-17a, in plain language, on your phone or computer.
      </p>
      <Link className="btn primary big" to="/terms" replace>Get started</Link>
      <p className="fee-note">Free to build and preview. Pay only to download your final forms.</p>

      <ul className="trust" aria-label="About this tool">
        <li>Designed by {ATTORNEY.name}, Esq., a New York attorney</li>
        <li>Uses the court's official Form 4-17a (revised 1/2026)</li>
        <li>Your answers are encrypted. No ads and no tracking.</li>
      </ul>

      <section className="card">
        <h2>The court asks every parent for this form</h2>
        <p>
          The form itself says: "You are required to bring this form to Court. Fill it out before you
          come in on the next court date." Filling it out carefully is not taking sides or being
          difficult. It is what the court asks of both parents.
        </p>
      </section>

      <section className="card">
        <h2>Calm, private, and at your pace</h2>
        <ul className="steps">
          <li>You don't need to contact the other parent to fill this out.</li>
          <li>Your progress saves as you go, so you can stop and come back.</li>
          <li>Plain-language help on every screen, and you can change any answer before you print.</li>
          <li>Quick exit on every screen if you need to leave fast.</li>
        </ul>
      </section>

      <section className="card">
        <h2>How it works</h2>
        <ol className="steps">
          <li>Answer questions one screen at a time. Your progress saves as you go.</li>
          <li>See a draft preview of your form and make changes anytime.</li>
          <li>When you're ready, unlock the final form to print, sign, and bring to court.</li>
        </ol>
      </section>

      <section className="card">
        <h2>For your children</h2>
        <p>
          Child support is meant to fit your family's real situation. A complete, accurate form helps
          the court see that situation clearly, whichever side of the case you are on.
        </p>
      </section>

      <ShareTool />

      <section className="card subtle">
        <h2>Before you begin</h2>
        <p>
          This tool gives general information and helps you prepare a court form. It is not legal
          advice, and using it does not make anyone your lawyer.
        </p>
        <p>
          Using a shared phone or computer? Close this tab when you finish, and consider using a
          private browsing window.
        </p>
      </section>
    </Shell>
  );
}
