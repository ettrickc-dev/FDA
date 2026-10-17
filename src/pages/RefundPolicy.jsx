import Shell from '../components/Shell.jsx';
import { REFUND_DAYS_TEXT, SUPPORT_EMAIL } from '../config.js';

// Refund policy (spec Section 8). Numbers come from config.js; keep them in sync with Netlify.
export default function RefundPolicy() {
  return (
    <Shell>
      <h1>Refund policy</h1>
      <div className="card">
        <ul className="steps">
          <li><strong>Problem on our end:</strong> if a technical problem on our side keeps you from getting your form, we will fix it or give you a full refund.</li>
          <li><strong>Before your first download:</strong> full refund if you ask within {REFUND_DAYS_TEXT} days of paying.</li>
          <li><strong>After you download:</strong> generally no refund. But if we made a mistake filling in the form from your answers, we will correct it at no charge or refund you.</li>
          <li><strong>Court decisions:</strong> we can't give refunds because a court reached a different result or asked for different forms.</li>
        </ul>
        <p>To ask for a refund, email <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>. We aim to reply within 2 business days.</p>
      </div>
    </Shell>
  );
}
