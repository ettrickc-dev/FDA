// Turns a guest session into a saved account: email -> 6-digit code -> password.
// Same user id, so all answers, payments and downloads stay with it.
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import CodeEntry from '../components/CodeEntry.jsx';
import Shell from '../components/Shell.jsx';
import { supabase } from '../lib/supabase.js';
import { isGuest, useSessionUser } from '../lib/session.js';

export default function SaveProgress() {
  const user = useSessionUser();
  const nav = useNavigate();
  const back = useLocation().state?.back || '/home';
  const [stage, setStage] = useState('email'); // email | code | password | done
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const run = async (fn) => {
    setBusy(true); setErr('');
    try { await fn(); } catch (e) { setErr(e.message || 'Something went wrong. Please try again.'); }
    finally { setBusy(false); }
  };

  const sendCode = () => run(async () => {
    const { error } = await supabase.auth.updateUser({ email });
    if (error) throw new Error(/registered|exists/i.test(error.message) ? 'That email already has an account. Use a different email, or log in to that account.' : error.message);
    setStage('code');
  });

  const verify = (code) => run(async () => {
    const { error } = await supabase.auth.verifyOtp({ email, token: code, type: 'email_change' });
    if (error) throw new Error('That code is wrong or has expired. Check the newest email, or tap "Resend code".');
    setStage('password');
  });

  const setPw = () => run(async () => {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
    setStage('done');
  });

  if (user === undefined) return <Shell><p>Loading…</p></Shell>;
  if (!user) { nav('/account', { replace: true }); return null; }
  if (!isGuest(user) && stage !== 'done') {
    return (
      <Shell>
        <h1>Your progress is saved</h1>
        <p>You're logged in with an account, so your answers are already saved.</p>
        <button className="btn primary big" onClick={() => nav(back, { replace: true })}>Go back</button>
      </Shell>
    );
  }

  return (
    <Shell>
      <h1>Save my progress</h1>
      {stage === 'email' && (
        <div className="card form">
          <p>Add your email and a password so you can come back later on any device. Everything you've entered stays.</p>
          <label className="field">
            <span>Email</span>
            <input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value.trim())} />
            <small>Use an email that only you can read.</small>
          </label>
          <button type="button" className="btn primary big" disabled={busy || !/^\S+@\S+\.\S+$/.test(email)} onClick={sendCode}>
            {busy ? 'Sending…' : 'Email me a code'}
          </button>
        </div>
      )}
      {stage === 'code' && (
        <CodeEntry email={email} busy={busy} onVerify={verify}
          onResend={async () => { const { error } = await supabase.auth.updateUser({ email }); if (error) throw error; }} />
      )}
      {stage === 'password' && (
        <div className="card form">
          <p>Email confirmed. Now choose a password.</p>
          <label className="field">
            <span>Password</span>
            <input type="password" autoComplete="new-password" minLength={10} value={password} onChange={(e) => setPassword(e.target.value)} />
            <small>At least 10 characters.</small>
          </label>
          <button type="button" className="btn primary big" disabled={busy || password.length < 10} onClick={setPw}>
            {busy ? 'Saving…' : 'Save my account'}
          </button>
        </div>
      )}
      {stage === 'done' && (
        <div className="card">
          <p><strong>Saved.</strong> You can log in with {email} any time to continue.</p>
          <button className="btn primary big" onClick={() => nav(back, { replace: true })}>Continue my form</button>
        </div>
      )}
      {err && <p className="error" role="alert">{err}</p>}
      {stage !== 'done' && <p className="center"><button className="link" onClick={() => nav(back, { replace: true })}>Not now</button></p>}
    </Shell>
  );
}
