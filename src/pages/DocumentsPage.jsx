// Document checklist. Shown early ("Papers to gather") and again before review ("Check your papers").
import { useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import SaveStatus from '../components/SaveStatus.jsx';
import Shell from '../components/Shell.jsx';
import StepNav, { Progress } from '../components/StepNav.jsx';
import { api } from '../lib/api.js';
import { buildChecklist } from '../lib/checklist.js';
import { useAutosave } from '../lib/useAutosave.js';
import { useCaseAnswers } from '../lib/useCase.js';

function Checklist({ caseId, answers, final }) {
  const [data, setData] = useState(() => ({ status: {}, ...(answers.doc_checklist || {}) }));
  const status = useAutosave(caseId, 'doc_checklist', data);
  const latest = useRef(data);
  latest.current = data;
  const docs = buildChecklist(answers);
  const set = (key, v) => setData((d) => ({ ...d, status: { ...d.status, [key]: d.status[key] === v ? undefined : v } }));
  const done = docs.filter((d) => ['have', 'na'].includes(data.status[d.key])).length;
  const step = final ? 'documents-final' : 'documents';

  return (
    <>
      <h1>{final ? 'Check your papers' : 'Papers to gather'}</h1>
      <p className="lede">
        {final
          ? 'The court requires you to bring these with your form. Mark each one when you have it, or if it doesn\'t apply to you.'
          : 'The court requires you to bring these papers with your form. Start gathering them now — many of them also help you answer the questions. You can mark them later.'}
      </p>
      <SaveStatus status={status} />
      <p className="count" aria-live="polite"><strong>{done} of {docs.length}</strong> ready</p>
      <ul className="doc-list">
        {docs.map((d) => {
          const s = data.status[d.key];
          return (
            <li key={d.key} className={`card doc ${s || ''}`}>
              <p className="doc-label">{d.label}{d.added && <span className="pill">Based on your answers</span>}</p>
              {d.hint && <small className="hint">{d.hint}</small>}
              <div className="seg" role="group" aria-label={d.label}>
                <button type="button" aria-pressed={s === 'have'} className={s === 'have' ? 'on' : ''} onClick={() => set(d.key, 'have')}>I have it</button>
                <button type="button" aria-pressed={s === 'na'} className={s === 'na' ? 'on' : ''} onClick={() => set(d.key, 'na')}>Doesn't apply</button>
              </div>
            </li>
          );
        })}
      </ul>
      {final && done < docs.length && (
        <p className="notice">You can keep going and preview your form. Before you download the final form, each item needs to be marked "I have it" or "Doesn't apply."</p>
      )}
      <StepNav caseId={caseId} step={step} beforeNext={async () => {
        await api.saveSection(caseId, 'doc_checklist', latest.current).catch(() => {});
        return true;
      }} />
    </>
  );
}

export default function DocumentsPage({ final = false }) {
  const { id } = useParams();
  const { answers, error } = useCaseAnswers(id);
  const step = final ? 'documents-final' : 'documents';
  return (
    <Shell>
      <Progress caseId={id} step={step} />
      {error && <p className="error" role="alert">{error}</p>}
      {!answers && !error && <p>Loading…</p>}
      {answers && <Checklist key={step} caseId={id} answers={answers} final={final} />}
    </Shell>
  );
}
