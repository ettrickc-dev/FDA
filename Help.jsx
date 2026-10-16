import { ATTORNEY_CONSULT_URL, FREE_HELP_URL } from '../config.js';
import { CANT_TELL, HELP } from '../content/help.js';

export function LawyerLinks() {
  return (
    <p className="lawyer-links">
      <a href={ATTORNEY_CONSULT_URL} target="_blank" rel="noopener noreferrer">Talk to a lawyer</a>
      {' · '}
      <a href={FREE_HELP_URL} target="_blank" rel="noopener noreferrer">Free legal help resources</a>
    </p>
  );
}

export default function Help({ topic }) {
  const h = HELP[topic];
  if (!h) return null;
  return (
    <details className="help">
      <summary>What counts here?</summary>
      <div className="help-body">
        <p className="help-title">{h.title}</p>
        {h.body.map((p, i) => <p key={i}>{p}</p>)}
        {h.maybe && (
          <>
            <p className="help-caveat">{CANT_TELL}</p>
            <LawyerLinks />
          </>
        )}
      </div>
    </details>
  );
}
