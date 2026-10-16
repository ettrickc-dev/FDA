// Download + after-purchase page (spec Section 4 steps 12-13, Section 8).
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { LawyerLinks } from '../components/Help.jsx';
import Shell from '../components/Shell.jsx';
import { ATTORNEY_CONSULT_URL, ATTORNEY_PHONE_TEL, ATTORNEY_PHONE_TEXT, FREE_HELP_URL } from '../config.js';
import { DOWNLOAD_DISCLAIMER, NEXT_STEPS } from '../content/afterPurchase.js';
import { api } from '../lib/api.js';

export default function DownloadPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const [info, setInfo] = useState(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.paywall(id).then((r) => {
      if (r.access.state !== 'paid') nav(`/case/${id}/unlock`, { replace: true });
      else setInfo(r);
    }).catch((e) => (e.status === 401 ? nav('/account', { replace: true }) : setErr(e.message)));
  }, [id, nav]);

  async function download() {
    setBusy(true); setErr('');
    try {
      const { url } = await api.downloadLink(id);
      window.location.assign(url); // short-lived link; the browser saves the PDF
    } catch (e) { setErr(e.message); }
    finally { setTimeout(() => setBusy(false), 1500); }
  }

  if (err && !info) return <Shell><p className="error" role="alert">{err}</p></Shell>;
  if (!info) return <Shell><p>Loading…</p></Shell>;
  const until = info.access.expiresAt ? new Date(info.access.expiresAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : null;

  return (
    <Shell>
      <h1>Your final form</h1>
      {until && <p className="lede">You can edit your answers and download again until {until}.</p>}

      <section className="card disclaimer" role="note">
        <p>{DOWNLOAD_DISCLAIMER}</p>
        <p className="links">
          <a href={FREE_HELP_URL} target="_blank" rel="noopener noreferrer">Free legal help</a>
          {' · '}
          <a href={ATTORNEY_CONSULT_URL} target="_blank" rel="noopener noreferrer">Attorney consultation on WhatsApp (separate, paid)</a>
          {' · '}
          <a href={ATTORNEY_PHONE_TEL}>Call {ATTORNEY_PHONE_TEXT}</a>
        </p>
      </section>

      {err && <p className="error" role="alert">{err}</p>}
      <button type="button" className="btn primary big" onClick={download} disabled={busy}>
        {busy ? 'Preparing your form…' : 'Download my form (PDF)'}
      </button>
      <p className="hint center">On a shared phone or computer? Delete the file from your downloads after printing.</p>

      <section className="card">
        <h2>What to do next</h2>
        <ol className="steps">{NEXT_STEPS.map((s, i) => <li key={i}>{s}</li>)}</ol>
        <p className="hint">General information only — not legal advice. Court procedures can differ by county.</p>
      </section>

      <section className="card">
        <h2>Need to change something?</h2>
        <p>Your edits are included every time you download.</p>
        <button type="button" className="btn" onClick={() => nav(`/case/${id}/review`, { replace: true })}>Review or change answers</button>
      </section>

      <section className="card subtle">
        <h2>Questions about your case?</h2>
        <p>This tool can't give legal advice. You can get help from a lawyer or a legal aid program.</p>
        <LawyerLinks />
        <p className="hint">An attorney consultation is a separate service with its own fee and agreement. Using this tool does not make anyone your lawyer.</p>
      </section>

      <section className="card subtle">
        <h2>Your information</h2>
        <p>You can delete your answers and account at any time.</p>
        <button type="button" className="btn" onClick={() => nav('/delete-my-data', { replace: true })}>Delete my data</button>
      </section>
    </Shell>
  );
}
