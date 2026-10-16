// Review screen (user flow step 9 + Screen 12): consistency checks, edit links,
// "before you sign" explanation, and the watermarked DRAFT preview (page images).
import { useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Shell from '../components/Shell.jsx';
import StepNav, { Progress } from '../components/StepNav.jsx';
import { STEP_NAMES } from '../content/screens.js';
import { api } from '../lib/api.js';
import { checklistComplete } from '../lib/checklist.js';
import { reviewChecks } from '../lib/reviewChecks.js';
import { useAutosave } from '../lib/useAutosave.js';
import { useCaseAnswers } from '../lib/useCase.js';

const EDIT_STEPS = ['info', 'job', 'other-income', 'household', 'other-orders', 'health', 'child-care', 'assets', 'expenses', 'debts', 'documents-final'];

function Issues({ checks, go }) {
  const fix = checks.filter((c) => c.level === 'fix');
  const check = checks.filter((c) => c.level === 'check');
  if (!checks.length) return <p className="notice ok">We didn't find anything that looks incomplete or inconsistent. Still read the preview carefully.</p>;
  const List = ({ items }) => (
    <ul className="issues">
      {items.map((c, i) => (
        <li key={i}>
          <span>{c.text}</span>
          <button type="button" className="link small" onClick={() => go(c.step)}>Go to {STEP_NAMES[c.step]}</button>
        </li>
      ))}
    </ul>
  );
  return (
    <>
      {fix.length > 0 && (<div className="card issues-card fix"><h2>Please fix ({fix.length})</h2><List items={fix} /></div>)}
      {check.length > 0 && (<div className="card issues-card look"><h2>Worth a second look ({check.length})</h2><List items={check} /></div>)}
    </>
  );
}

function Preview({ caseId }) {
  const [state, setState] = useState({ status: 'idle' });
  const load = async () => {
    setState({ status: 'loading' });
    try {
      const r = await api.preview(caseId);
      setState({ status: 'ready', ...r });
    } catch (e) {
      setState({ status: 'error', error: e.message });
    }
  };
  return (
    <section className="card preview-card" aria-labelledby="pv-h">
      <h2 id="pv-h">Draft preview</h2>
      <p className="hint">This is what your form will look like, marked DRAFT. Pinch or zoom to read it. Change any answer and make a new preview — edits are always included.</p>
      {state.status !== 'ready' && (
        <button type="button" className="btn primary big" onClick={load} disabled={state.status === 'loading'}>
          {state.status === 'loading' ? 'Making your preview…' : 'Show my draft preview'}
        </button>
      )}
      {state.status === 'error' && <p className="error" role="alert">{state.error}</p>}
      {state.status === 'ready' && (
        <>
          {state.attachmentPages > 0 && (
            <p className="notice">Some of your answers didn't fit on the form, so {state.attachmentPages === 1 ? 'an extra page is' : `${state.attachmentPages} extra pages are`} attached at the end.</p>
          )}
          <div className="pages">
            {state.pages.map((p, i) => (
              <figure key={i} className="page-img">
                <img src={p.src} width={p.width} height={p.height} alt={`Draft preview, page ${i + 1} of ${state.pages.length}`} draggable={false} />
                <figcaption>Page {i + 1} of {state.pages.length}</figcaption>
              </figure>
            ))}
          </div>
          <button type="button" className="btn" onClick={load}>Refresh preview</button>
        </>
      )}
    </section>
  );
}

function Review({ caseId, answers }) {
  const nav = useNavigate();
  const [ack, setAck] = useState(() => ({ understood: false, ...(answers.review || {}) }));
  useAutosave(caseId, 'review', ack);
  const latest = useRef(ack);
  latest.current = ack;
  const checks = reviewChecks(answers);
  const go = (s) => { window.scrollTo(0, 0); nav(`/case/${caseId}/${s}`, { replace: true }); };
  const docsDone = checklistComplete(answers);

  return (
    <>
      <h1>Review your form</h1>
      <p className="lede">Look over your answers and the draft preview. You can change anything, as many times as you need.</p>

      <Issues checks={checks} go={go} />

      <details className="card edit-list">
        <summary>Change an answer</summary>
        <ul>
          {EDIT_STEPS.map((s) => (
            <li key={s}><button type="button" className="link" onClick={() => go(s)}>{STEP_NAMES[s]}</button></li>
          ))}
        </ul>
      </details>

      <Preview caseId={caseId} />

      <section className="card before-sign" aria-labelledby="bs-h">
        <h2 id="bs-h">Before you sign</h2>
        <ul>
          <li>This form is a <strong>sworn statement</strong>. At the end, you affirm "under the penalties of perjury" that what you wrote is true.</li>
          <li>The form says false statements can lead to penalties that <strong>may include a fine or imprisonment</strong>.</li>
          <li>The form <strong>may be filed in court</strong> and seen by the judge or support magistrate and the other parent (and their lawyer, if they have one).</li>
          <li>We leave the <strong>signature and date blank</strong>. You sign and date the form yourself, after you've checked every line.</li>
          <li>Bring the papers on your checklist with the form.</li>
        </ul>
        <label className="check big-check">
          <input type="checkbox" checked={!!ack.understood}
            onChange={(e) => setAck({ understood: e.target.checked, at: e.target.checked ? new Date().toISOString() : null })} />
          <span>I understand this will be a sworn statement, and that I am responsible for checking every answer before I sign it.</span>
        </label>
      </section>

      <section className="card unlock-card">
        <h2>Ready for your final form?</h2>
        <p>The final form has no DRAFT marks, so you can print it, sign it, and bring it to court.</p>
        {!docsDone && <p className="warn">Finish your document checklist first.</p>}
        <button type="button" className="btn primary big" disabled={!ack.understood || !docsDone}
          onClick={async () => { await api.saveSection(caseId, 'review', latest.current).catch(() => {}); go('unlock'); }}>
          Unlock final form
        </button>
        {!docsDone && <button type="button" className="link" onClick={() => go('documents-final')}>Go to document checklist</button>}
      </section>

      <StepNav caseId={caseId} step="review" />
    </>
  );
}

export default function ReviewPage() {
  const { id } = useParams();
  const { answers, error } = useCaseAnswers(id);
  return (
    <Shell>
      <Progress caseId={id} step="review" />
      {error && <p className="error" role="alert">{error}</p>}
      {!answers && !error && <p>Loading…</p>}
      {answers && <Review caseId={id} answers={answers} />}
    </Shell>
  );
}
