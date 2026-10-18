// Shown to guests on every form screen: their work lives only in this tab until they save it.
import { useNavigate } from 'react-router-dom';
import { isGuest, useSessionUser } from '../lib/session.js';

export default function GuestBanner() {
  const user = useSessionUser();
  const nav = useNavigate();
  if (!isGuest(user)) return null;
  return (
    <div className="guest-banner" role="note">
      <strong>You're using a guest session.</strong> If you close this tab, your answers are lost.
      <div><button type="button" className="btn" onClick={() => nav('/save-progress', { state: { back: window.location.pathname } })}>Save my progress</button></div>
    </div>
  );
}
