// 6-digit email code entry with a "Resend code" button (60-second wait, Supabase's limit).
import { useEffect, useState } from 'react';

export default function CodeEntry({ email, onVerify, onResend, busy }) {
  const [code, setCode] = useState('');
  const [wait, setWait] = useState(60);
  const [note, setNote] = useState('');
  useEffect(() => {
    if (wait <= 0) return undefined;
    const t = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);

  async function resend() {
    setNote('');
    try { await onResend(); setWait(60); setNote('We sent a new code. Use the newest email.'); }
    catch (e) { setNote(e.message || 'Could not send a new code. Please wait a minute and try again.'); }
  }

  return (
    <div className="card form">
      <p>We emailed a 6-digit code to <strong>{email}</strong>. Enter it here.</p>
      <label className="field">
        <span>Code</span>
        <input className="code-input" inputMode="numeric" autoComplete="one-time-code" maxLength={8}
          value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} aria-label="6-digit code" />
      </label>
      <button type="button" className="btn primary big" disabled={busy || code.length < 6} onClick={() => onVerify(code)}>
        {busy ? 'Checking…' : 'Confirm'}
      </button>
      <p className="hint">Not there? Check your spam or junk folder. The email is from "Form Prep".</p>
      <button type="button" className="link" disabled={wait > 0} onClick={resend}>
        {wait > 0 ? `Resend code (available in ${wait}s)` : 'Resend code'}
      </button>
      {note && <p className="hint" role="status">{note}</p>}
    </div>
  );
}
