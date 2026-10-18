// Account: create (confirm with a 6-digit email code), log in, or continue as a guest.
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CodeEntry from '../components/CodeEntry.jsx';
import Shell from '../components/Shell.jsx';
import { api } from '../lib/api.js';
import { supabase } from '../lib/supabase.js';

export async function flushPendingConsent() {
  const raw = sessionStorage.getItem('pendingConsent');
  if (!raw) return;
  try {
    const { v, at } = JSON.parse(raw);
    await api.recordConsent(v, at);
    sessionStorage.removeItem('pendingConsent');
  } catch { /* retried from /home */ }
}

const friendly = (e) => {
  const m = e?.message || '';
  if (m.includes('Invalid login')) return 'That email and password did not match.';
  if (/expired|invalid/i.test(m) && /token|otp|code/i.test(m)) return 'That code is wrong or has expired. Check the newest email, or tap "Resend code".';
  if (/rate|seconds/i.test(m)) return 'Please wait a minute before asking for another code.';
  if (/already registered/i.test(m)) return 'That email already has an account. Log in instead.';
  return m || 'Something went wrong. Please try again.';
};

export default function Account() {
  const [mode, setMode] = useState(sessionStorage.getItem('pendingConsent') ? 'signup' : 'login');
  const [stage, setStage] = useState('form'); // form | code
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const nav = useNavigate();

  async function finish() {
    await flushPendingConsent();
    nav('/home', { replace: true });
  }

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setErr('');
    try {
      if (mode === 'signup') {
        if (!sessionStorage.getItem('pendingConsent')) { nav('/terms', { replace: true }); return; }
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        if (!data.session) { setStage('code'); return; }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          if (/not confirmed/i.test(error.message)) {
            await supabase.auth.resend({ type: 'signup', email }).catch(() => {});
            setStage('code');
            return;
          }
          throw error;
        }
      }
      await finish();
    } catch (e2) { setErr(friendly(e2)); }
    finally { setBusy(false); }
  }

  async function verify(code) {
    setBusy(true); setErr('');
    try {
      const { error } = await supabase.auth.verifyOtp({ email, token: code, type: 'signup' });
      if (error) throw error;
      // Logging in after confirming (the code confirms the email; the password was set at sign-up).
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        const { error: e2 } = await supabase.auth.signInWithPassword({ email, password });
        if (e2) throw e2;
      }
      await finish();
    } catch (e3) { setErr(friendly(e3)); }
    finally { setBusy(false); }
  }

  async function resend() {
    const { error } = await supabase.auth.resend({ type: 'signup', email });
    if (error) throw new Error(friendly(error));
  }

  async function guest() {
    setBusy(true); setErr('');
    try {
      if (!sessionStorage.getItem('pendingConsent')) { nav('/terms', { replace: true }); return; }
      const { error } = await supabase.auth.signInAnonymously();
      if (error) throw error;
      await finish();
    } catch (e4) { setErr(friendly(e4)); }
    finally { setBusy(false); }
  }

  if (stage === 'code') {
    return (
      <Shell>
        <h1>Confirm your email</h1>
        <CodeEntry email={email} onVerify={verify} onResend={resend} busy={busy} />
        {err && <p className="error" role="alert">{err}</p>}
        <p className="center"><button className="link" onClick={() => { setStage('form'); setErr(''); }}>Use a different email</button></p>
      </Shell>
    );
  }

  return (
    <Shell>
      <h1>{mode === 'signup' ? 'Create your account' : 'Log in'}</h1>
      <p className="lede">
        {mode === 'signup'
          ? 'An account saves your progress so you can come back later. We\'ll email you a 6-digit code to confirm.'
          : 'Log in to continue where you left off.'}
      </p>
      <form className="card form" onSubmit={submit} noValidate>
        <label className="field">
          <span>Email</span>
          <input type="email" autoComplete="email" required value={email}
            onChange={(e) => setEmail(e.target.value.trim())} />
          <small>Use an email that only you can read.</small>
        </label>
        <label className="field">
          <span>Password</span>
          <input type="password" autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
            required minLength={10} value={password} onChange={(e) => setPassword(e.target.value)} />
          {mode === 'signup' && <small>At least 10 characters.</small>}
        </label>
        {err && <p className="error" role="alert">{err}</p>}
        <button className="btn primary big" disabled={busy || !email || password.length < (mode === 'signup' ? 10 : 1)}>
          {busy ? 'One moment…' : mode === 'signup' ? 'Create account' : 'Log in'}
        </button>
      </form>

      {sessionStorage.getItem('pendingConsent') && (
        <div className="card subtle">
          <h2>Or continue as a guest</h2>
          <p>No account needed. Your answers stay only in this browser tab, so finish in one sitting or tap "Save my progress" at any time.</p>
          <button type="button" className="btn" onClick={guest} disabled={busy}>Continue as a guest</button>
        </div>
      )}

      <p className="center">
        {mode === 'signup' ? (
          <button className="link" onClick={() => setMode('login')}>Already have an account? Log in</button>
        ) : (
          <button className="link" onClick={() => nav('/terms', { replace: true })}>New here? Create an account or continue as a guest</button>
        )}
      </p>
    </Shell>
  );
}
