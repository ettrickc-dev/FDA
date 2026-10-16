import Shell from '../components/Shell.jsx';
import { SUPPORT_EMAIL } from '../config.js';

// DRAFT refund policy (spec Section 8). Owner / ethics counsel to review.
// [N] values come from owner decisions not yet made.
export default function RefundPolicy() {
  return (
    <Shell>
      <h1>Refund policy</h1>
      <p className="notice">[DRAFT — owner and ethics counsel to review before launch.]</p>
      <div className="card">
        <ul className="steps">
          <li><strong>Problem on our end:</strong> if a technical problem on our side keeps you from getting your form, we will fix it or give you a full refund.</li>
          <li><strong>Before your first download:</strong> full refund if you ask within [N] days of paying.</li>
          <li><strong>After you download:</strong> generally no refund. But if we made a mistake filling in the form from your answers, we will correct it at no charge or refund you.</li>
          <li><strong>Court decisions:</strong> we can't give refunds because a court reached a different result or asked for different forms.</li>
        </ul>
        <p>To ask for a refund, email <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>. We aim to reply within [2] business days.</p>
      </div>
    </Shell>
  );
}
