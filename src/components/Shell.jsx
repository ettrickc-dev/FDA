import { useEffect } from 'react';
import { AD_LABEL, QUICK_EXIT_URL } from '../config.js';
import { supabase } from '../lib/supabase.js';

export function quickExit() {
  try { supabase.auth.signOut({ scope: 'local' }); } catch { /* ignore */ }
  try { sessionStorage.clear(); } catch { /* ignore */ }
  // replace() swaps this page out of history so Back does not return here.
  window.location.replace(QUICK_EXIT_URL);
}

export function QuickExit() {
  // Pressing Escape twice quickly also exits.
  useEffect(() => {
    let last = 0;
    const onKey = (e) => {
      if (e.key !== 'Escape') return;
      const now = Date.now();
      if (now - last < 700) quickExit();
      last = now;
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  return (
    <button type="button" className="quick-exit" onClick={quickExit}
      aria-label="Quick exit. Leaves this site immediately.">
      Quick exit
    </button>
  );
}

export function AdLabel() {
  return <p className="ad-label">{AD_LABEL}</p>;
}

export default function Shell({ children, wide = false, showAd = false }) {
  return (
    <div className="app">
      <header className="topbar">
        <span className="brand" aria-hidden="true">Form Prep</span>
        <QuickExit />
      </header>
      <main id="main" className={wide ? 'page wide' : 'page'}>{children}</main>
      <footer className="footer">
        {showAd && <AdLabel />}
        <p className="footer-note">Press Esc twice or tap Quick exit to leave fast.</p>
      </footer>
    </div>
  );
}
