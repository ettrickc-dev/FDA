import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Shell from '../components/Shell.jsx';
import { api } from '../lib/api.js';
import { supabase } from '../lib/supabase.js';

export default function DeleteMyData() {
  const nav = useNavigate();
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [done, setDone] = useState(false);

  async function del() {
    setBusy(true); setErr('');
    try {
      await api.deleteMyData();
      try { await supabase.auth.signOut({ scope: 'local' }); } catch { /* already gone */ }
      try { sessionStorage.clear(); } catch { /* ignore */ }
      setDone(true);
    } catch (e) {
      if (e.status === 401) nav('/account', { replace: true }); else setErr(e.message);
    } finally { setBusy(false); }
  }

  if (done) {
    return (
      <Shell>
        <h1>Your data has been deleted</h1>
        <p className="notice" role="status">Your account, answers, and forms have been deleted. If you downloaded a form, the copy on your device is not affected — delete it from your downloads if you share this device.</p>
        <button type="button" className="btn" onClick={() => nav('/', { replace: true })}>Done</button>
      </Shell>
    );
  }

  return (
    <Shell>
      <h1>Delete my data</h1>
      <div className="card">
        <p><strong>This deletes right away, and can't be undone:</strong></p>
        <ul className="steps">
          <li>Your account and login</li>
          <li>All your answers and forms in progress</li>
          <li>Your answers to the safety and situation questions</li>
          <li>Any papers you uploaded</li>
        </ul>
        <p><strong>We keep only:</strong> a record that a payment happened (amount and date, not linked to your answers), and a record of which version of the Terms was accepted and when. See the Privacy Policy.</p>
        <p>If you paid and your access period hasn't ended, you will lose access to download your form.</p>
      </div>
      <label className="field form">
        <span className="field-label">Type DELETE to confirm</span>
        <input autoComplete="off" value={text} onChange={(e) => setText(e.target.value)} />
      </label>
      {err && <p className="error" role="alert">{err}</p>}
      <button type="button" className="btn danger big" disabled={text !== 'DELETE' || busy} onClick={del}>
        {busy ? 'Deleting…' : 'Delete everything now'}
      </button>
      <p className="center"><button type="button" className="link" onClick={() => nav('/home', { replace: true })}>Cancel</button></p>
    </Shell>
  );
}
