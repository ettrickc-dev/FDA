// Where Stripe sends people back. Does NOT unlock anything itself: it waits until the
// server (updated by the Stripe webhook) says the payment is complete.
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Shell from '../components/Shell.jsx';
import { api } from '../lib/api.js';

export default function CheckoutReturn() {
  const nav = useNavigate();
  const [msg, setMsg] = useState('Confirming your payment…');
  const status = new URLSearchParams(window.location.search).get('status');
  const caseId = sessionStorage.getItem('checkoutCase');

  useEffect(() => {
    if (!caseId) { nav('/home', { replace: true }); return; }
    if (status !== 'success') { nav(`/case/${caseId}/unlock`, { replace: true }); return; }
    let tries = 0, stop = false;
    const poll = async () => {
      if (stop) return;
      tries += 1;
      try {
        const r = await api.paywall(caseId);
        if (r.access.state === 'paid') { sessionStorage.removeItem('checkoutCase'); nav(`/case/${caseId}/download`, { replace: true }); return; }
      } catch { /* keep trying */ }
      if (tries < 20) setTimeout(poll, 1500);
      else setMsg('This is taking longer than usual. Your payment may still be processing — you can safely come back in a few minutes. Your form will be unlocked as soon as it completes.');
    };
    poll();
    return () => { stop = true; };
  }, [caseId, status, nav]);

  return (
    <Shell>
      <h1>Thank you</h1>
      <p className="notice" role="status" aria-live="polite">{msg}</p>
      <p className="center"><button type="button" className="link" onClick={() => nav('/home', { replace: true })}>Go to my forms</button></p>
    </Shell>
  );
}
