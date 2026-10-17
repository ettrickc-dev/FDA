import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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

export default function Account() {
  const [mode, setMode] = useState(sessionStorage.getItem('pendingConsent') ? 'signup' : 'login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const nav = useNavigate();

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setErr(''); setMsg('');
    try {
      if (mode === 'signup') {
        if (!sessionStorage.getItem('pendingConsent')) { nav('/terms', { replace: true }); return; }
        const { data, error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: `${window.location.origin}/home` },
        });
        if (error) throw error;
        if (!data.session) {
          setMsg('Check your email for a message to confirm your account, then come back and log in.');
          return;
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      await flushPendingConsent();
      nav('/home', { replace: true });
    } catch (e2) {
      setErr(e2?.message?.includes('Invalid login') ? 'That email and password did not match.' : (e2.message || 'Something went wrong.'));
    } finally { setBusy(false); }
  }

  return (
    <Shell>
      <h1>{mode === 'signup' ? 'Create your account' : 'Log in'}</h1>
      <p className="lede">
        {mode === 'signup'
          ? 'An account lets you save your progress and come back later.'
          : 'Log in to continue where you left off.'}
      </p>
      <form className="card form" onSubmit={submit} noValidate>
        <label className="field">
          <span>Email</span>
          <input type="email" autoComplete="email" required value={email}
            onChange={(e) => setEmail(e.target.value)} />
          <small>Use an email that only you can read.</small>
        </label>
        <label className="field">
          <span>Password</span>
          <input type="password" autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
            required minLength={10} value={password} onChange={(e) => setPassword(e.target.value)} />
          {mode === 'signup' && <small>At least 10 characters.</small>}
        </label>
        {err && <p className="error" role="alert">{err}</p>}
        {msg && <p className="notice" role="status">{msg}</p>}
        <button className="btn primary big" disabled={busy || !email || password.length < (mode === 'signup' ? 10 : 1)}>
          {busy ? 'One moment…' : mode === 'signup' ? 'Create account' : 'Log in'}
        </button>
      </form>
      <p className="center">
        {mode === 'signup' ? (
          <button className="link" onClick={() => setMode('login')}>Already have an account? Log in</button>
        ) : (
          <button className="link" onClick={() => nav('/terms', { replace: true })}>New here? Create an account</button>
        )}
      </p>
    </Shell>
  );
}
