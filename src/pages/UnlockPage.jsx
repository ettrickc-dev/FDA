// Paywall (spec Rule 2.3 / Section 8). The price appears here for the first time, before any
// payment form, with what's included, the refund summary, and "No other fees…".
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Shell from '../components/Shell.jsx';
import { REFUND_SUMMARY } from '../content/afterPurchase.js';
import { api } from '../lib/api.js';
import { isGuest, useSessionUser } from '../lib/session.js';

export const formatPrice = (cents) =>
  cents === null || cents === undefined ? '[price not set]'
    : `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: cents % 100 ? 2 : 0, maximumFractionDigits: 2 })}`;

export default function UnlockPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const [info, setInfo] = useState(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const sessionUser = useSessionUser();

  useEffect(() => {
    api.paywall(id).then((r) => {
      if (r.access.state === 'paid') nav(`/case/${id}/download`, { replace: true });
      else setInfo(r);
    }).catch((e) => (e.status === 401 ? nav('/account', { replace: true }) : setErr(e.message)));
  }, [id, nav]);

  async function pay() {
    setBusy(true); setErr('');
    try {
      sessionStorage.setItem('checkoutCase', id); // used only to return here after Stripe
      const { url } = await api.checkout(id);
      window.location.assign(url);
    } catch (e) { setErr(e.message); setBusy(false); }
  }

  const guest = isGuest(sessionUser);
  if (err && !info) return <Shell><p className="error" role="alert">{err}</p></Shell>;
  if (!info) return <Shell><p>Loading…</p></Shell>;
  const days = info.accessDays ?? '[N]';

  return (
    <Shell>
      <h1>Unlock your final form</h1>
      {guest && (
        <div className="notice caution" role="note">
          <p>You're using a guest session. If you close this tab, you can't come back to your form. Before you pay, tap "Save my progress" to add your email, or plan to download or email your form right after paying.</p>
          <button type="button" className="btn" onClick={() => nav('/save-progress', { state: { back: `/case/${id}/unlock` } })}>Save my progress</button>
        </div>
      )}
      {info.access.state === 'expired' && (
        <p className="notice">Your earlier access period has ended. You can unlock again to download an updated form.</p>
      )}
      <section className="card paywall">
        <p className="price-line">Unlock your final forms for <strong className="price">{formatPrice(info.priceCents)}</strong>.</p>
        <ul className="includes">
          <li>Includes unlimited edits and downloads for {days} days.</li>
          <li>Your form without DRAFT marks, ready to print, sign, and bring to court.</li>
          <li>Any extra pages your answers need.</li>
        </ul>
        <p>{REFUND_SUMMARY(info.refundDays)} <a href="/refunds">Refund policy</a></p>
        <p className="no-fees"><strong>No other fees will be added at checkout.</strong></p>
        {info.statementSuffix && <p className="hint">Your card statement will show a neutral description.</p>}

        {!info.ready.ready && (
          <p className="warn">Before you can unlock: {info.ready.missing.includes('documents') ? 'finish your document checklist' : ''}
            {info.ready.missing.length === 2 ? ' and ' : ''}
            {info.ready.missing.includes('acknowledgment') ? 'check the "I understand" box on the review screen' : ''}.</p>
        )}
        {!info.checkoutAvailable && <p className="notice">Payments are not open yet. Please check back soon.</p>}
        {err && <p className="error" role="alert">{err}</p>}
        <button type="button" className="btn primary big" onClick={pay}
          disabled={busy || !info.checkoutAvailable || !info.ready.ready}>
          {busy ? 'Opening secure payment…' : 'Continue to secure payment'}
        </button>
        <p className="hint center">Payment is handled by Stripe. We never see or store your card number.</p>
      </section>
      <p className="center"><button type="button" className="link" onClick={() => nav(`/case/${id}/review`, { replace: true })}>Back to review</button></p>
    </Shell>
  );
}
