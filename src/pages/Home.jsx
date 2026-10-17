import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Shell from '../components/Shell.jsx';
import { api } from '../lib/api.js';
import { supabase } from '../lib/supabase.js';
import { flushPendingConsent } from './Account.jsx';

export default function Home() {
  const [cases, setCases] = useState(null);
  const [err, setErr] = useState('');
  const nav = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        await flushPendingConsent();
        const c = await api.consentStatus();
        if (!c.accepted) { nav('/terms', { replace: true }); return; }
        const { cases } = await api.listCases();
        setCases(cases);
      } catch (e) {
        if (e.status === 401) nav('/account', { replace: true }); else setErr(e.message);
      }
    })();
  }, [nav]);

  async function start() {
    try {
      const { case: c } = await api.createCase();
      nav(`/case/${c.id}/setup`, { replace: true });
    } catch (e) { setErr(e.message); }
  }

  async function logout() {
    await supabase.auth.signOut();
    nav('/', { replace: true });
  }

  return (
    <Shell>
      <h1>Your forms</h1>
      {err && <p className="error" role="alert">{err}</p>}
      {cases === null && !err && <p>Loading…</p>}
      {cases?.length === 0 && (
        <div className="card">
          <p>You haven't started a form yet.</p>
          <button className="btn primary big" onClick={start}>Start my Financial Disclosure Affidavit</button>
        </div>
      )}
      {cases?.length > 0 && (
        <>
          <ul className="case-list">
            {cases.map((c) => (
              <li key={c.id} className="card">
                <div>
                  <strong>Financial Disclosure Affidavit</strong>
                  <span className={`pill ${c.status}`}>{c.status === 'draft' ? 'Draft' : c.status === 'paid' ? 'Unlocked' : 'Expired'}</span>
                </div>
                <small>Last saved {new Date(c.updated_at).toLocaleString()}</small>
                {c.status === 'paid' && (
                  <button className="btn primary" onClick={() => nav(`/case/${c.id}/download`, { replace: true })}>
                    Download final form
                  </button>
                )}
                <button className={c.status === 'paid' ? 'btn' : 'btn primary'} onClick={() => nav(`/case/${c.id}/${c.last_step || 'setup'}`, { replace: true })}>
                  {c.status === 'paid' ? 'Edit answers' : 'Continue'}
                </button>
              </li>
            ))}
          </ul>
          <button className="btn" onClick={start}>Start another form</button>
        </>
      )}
      <p className="center">
        <button className="link" onClick={logout}>Log out</button>
        {' · '}
        <button className="link" onClick={() => nav('/delete-my-data', { replace: true })}>Delete my data</button>
      </p>
    </Shell>
  );
}
