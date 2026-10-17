import { Link } from 'react-router-dom';
import Shell from '../components/Shell.jsx';

export default function Landing() {
  return (
    <Shell showAd>
      <h1>Complete your NY child support Financial Disclosure form.</h1>
      <p className="lede">
        Step-by-step help preparing Family Court Form 4-17a, in plain language, on your phone or computer.
      </p>
      <Link className="btn primary big" to="/terms" replace>Get started</Link>
      <p className="fee-note">Free to build and preview. Pay only to download your final forms.</p>

      <section className="card">
        <h2>How it works</h2>
        <ol className="steps">
          <li>Answer questions one screen at a time. Your progress saves as you go.</li>
          <li>See a draft preview of your form and make changes anytime.</li>
          <li>When you're ready, unlock the final form to print, sign, and bring to court.</li>
        </ol>
      </section>

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
