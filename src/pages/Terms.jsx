import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Shell from '../components/Shell.jsx';
import { ATTORNEY, RETENTION_DAYS_TEXT, RULES_EFFECTIVE_DATE, TERMS_VERSION } from '../config.js';
import { api } from '../lib/api.js';
import { supabase } from '../lib/supabase.js';

// Consent screen text (spec Section 8). Fee sentence wording is fixed by the spec — do not edit it.
export default function Terms() {
  const [agreed, setAgreed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const nav = useNavigate();

  async function onContinue() {
    setBusy(true); setErr('');
    const acceptedAt = new Date().toISOString();
    try {
      const { data } = await supabase.auth.getSession();
      if (data?.session) {
        await api.recordConsent(TERMS_VERSION, acceptedAt);
        nav('/home', { replace: true });
      } else {
        // Not logged in yet: hold the acceptance for this tab and record it right after signup/login.
        sessionStorage.setItem('pendingConsent', JSON.stringify({ v: TERMS_VERSION, at: acceptedAt }));
        nav('/account', { replace: true });
      }
    } catch (e) {
      setErr(e.message);
    } finally { setBusy(false); }
  }

  return (
    <Shell>
      <h1>Before you start</h1>
      <div className="card terms">
        <p>This tool helps you prepare the New York Family Court Financial Disclosure Affidavit. It is <strong>not legal advice</strong>, and using it <strong>does not create an attorney-client relationship</strong> with {ATTORNEY.name}{ATTORNEY.firm ? ` or ${ATTORNEY.firm}` : ''}.</p>
        <p>Results are <strong>estimates</strong> based on the information you enter and on rules and amounts in effect on {RULES_EFFECTIVE_DATE}. A court may reach a different result.</p>
        <p><strong>You are responsible for reviewing every answer.</strong> The completed form is a sworn statement. False statements can lead to penalties for perjury.</p>
        <p>Previewing is free. Downloading or printing the final, unwatermarked forms requires payment.</p>
        <p>We store your information securely and delete it after {RETENTION_DAYS_TEXT} days without activity. You can delete it anytime. See our <a href="/privacy">Privacy Policy</a>.</p>
      </div>
      <label className="check big-check">
        <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
        <span>I have read and agree to the <a href="/terms-of-use">Terms of Use</a> and <a href="/privacy">Privacy Policy</a>.</span>
      </label>
      {err && <p className="error" role="alert">{err}</p>}
      <button className="btn primary big" disabled={!agreed || busy} onClick={onContinue}>
        {busy ? 'One moment…' : 'Continue'}
      </button>
    </Shell>
  );
}
