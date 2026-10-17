// "Know a parent who needs this?" — shares ONLY the site link with neutral wording.
// No case data, no names, no tracking parameters. Uses the phone's share sheet when available,
// otherwise copies the link.
import { useState } from 'react';

const SHARE_URL = 'https://forms.ettrickcampbell.com';
const SHARE_TEXT = 'A step-by-step helper for the NY Family Court Financial Disclosure Affirmation.';

export default function ShareTool({ compact = false }) {
  const [status, setStatus] = useState('');

  async function share() {
    setStatus('');
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Form Prep', text: SHARE_TEXT, url: SHARE_URL });
        return;
      }
      await navigator.clipboard.writeText(SHARE_URL);
      setStatus('Link copied. Paste it in a text or message.');
    } catch {
      // User closed the share sheet, or copying is blocked — show the link instead.
      setStatus(`Share this link: ${SHARE_URL}`);
    }
  }

  return (
    <section className={compact ? 'share compact' : 'card share'} aria-labelledby="share-h">
      <h2 id="share-h">Know a parent who needs this?</h2>
      {!compact && (
        <p>Many parents go to court without knowing how to fill out this form. Passing it along can save someone a stressful morning.</p>
      )}
      <button type="button" className="btn" onClick={share}>Share the link</button>
      {status && <p className="hint" role="status">{status}</p>}
    </section>
  );
}
