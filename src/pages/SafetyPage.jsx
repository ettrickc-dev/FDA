// Red-flag screening (spec Section 6). Calm, optional, never blocks the person.
import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import SaveStatus from '../components/SaveStatus.jsx';
import Shell from '../components/Shell.jsx';
import StepNav, { Progress } from '../components/StepNav.jsx';
import { ATTORNEY_CONSULT_URL, FREE_HELP_URL } from '../config.js';
import { PROMPTS, RED_FLAG_QUESTIONS } from '../content/redFlags.js';
import { api } from '../lib/api.js';
import { useAutosave } from '../lib/useAutosave.js';
import { useCaseAnswers } from '../lib/useCase.js';

const EMPTY = { answers: {}, other_text: '', flags: {} };

function FlagPrompt({ q, flag, onAction }) {
  const done = flag?.action;
  return (
    <div className={`flag ${q.prompt}`} role="note">
      {PROMPTS[q.prompt].map((p, i) => <p key={i}>{p}</p>)}
      {done === 'continue' ? (
        <p className="flag-done">Thanks. You can keep going.</p>
      ) : (
        <div className="flag-actions">
          <a className="btn" href={ATTORNEY_CONSULT_URL} target="_blank" rel="noopener noreferrer"
            onClick={() => onAction('attorney')}>Speak with an attorney</a>
          <a className="btn" href={FREE_HELP_URL} target="_blank" rel="noopener noreferrer"
            onClick={() => onAction('free_help')}>Free legal help resources</a>
          <button type="button" className="btn primary" onClick={() => onAction('continue')}>Continue</button>
        </div>
      )}
      <p className="flag-note">The attorney consultation is separate and paid. Free legal help is available to everyone.</p>
    </div>
  );
}

function SafetyForm({ caseId, saved }) {
  const [data, setData] = useState(() => ({ ...EMPTY, ...(saved || {}), flags: { ...(saved?.flags || {}) } }));
  const status = useAutosave(caseId, 'red_flags', data);
  const pending = useRef(new Set());
  const latest = useRef(data);
  latest.current = data;

  // Log a flag the first time its prompt is shown.
  useEffect(() => {
    for (const q of RED_FLAG_QUESTIONS) {
      const a = data.answers[q.key];
      if (!q.prompt || !q.triggers.includes(a)) continue;
      if (data.flags[q.key]?.id || pending.current.has(q.key)) continue;
      pending.current.add(q.key);
      api.logFlag(caseId, q.key, a)
        .then(({ id }) => setData((d) => ({ ...d, flags: { ...d.flags, [q.key]: { ...(d.flags[q.key] || {}), id } } })))
        .catch(() => {})
        .finally(() => pending.current.delete(q.key));
    }
  }, [caseId, JSON.stringify(data.answers)]); // eslint-disable-line

  const setAnswer = (key, v) => setData((d) => ({ ...d, answers: { ...d.answers, [key]: v } }));
  const onAction = (key, action) => {
    setData((d) => ({ ...d, flags: { ...d.flags, [key]: { ...(d.flags[key] || {}), action } } }));
    const id = latest.current.flags[key]?.id;
    if (id) api.flagAction(caseId, id, action).catch(() => {});
  };

  return (
    <>
      <h1>A few more questions</h1>
      <p className="lede">
        These help us point you to the right information. None of these answers go on your form,
        and you can choose "Prefer not to say" for any of them.
      </p>
      <SaveStatus status={status} />
      <div className="card form">
        {RED_FLAG_QUESTIONS.map((q) => {
          const a = data.answers[q.key];
          const show = q.prompt && q.triggers.includes(a);
          return (
            <div key={q.key} className="rf-q">
              <fieldset className="field">
                <legend className="field-label">{q.label}</legend>
                {q.options.map((o) => (
                  <label key={o.value} className="choice">
                    <input type="radio" name={q.key} checked={a === o.value} onChange={() => setAnswer(q.key, o.value)} />
                    <span>{o.label}</span>
                  </label>
                ))}
              </fieldset>
              {show && <FlagPrompt q={q} flag={data.flags[q.key]} onAction={(act) => onAction(q.key, act)} />}
            </div>
          );
        })}
        <label className="field">
          <span className="field-label">Is there anything else about your situation that feels complicated? <span className="opt">(optional)</span></span>
          <small className="hint">Only you and the app can see this. It does not go on your form.</small>
          <textarea rows={3} maxLength={600} value={data.other_text}
            onChange={(e) => setData((d) => ({ ...d, other_text: e.target.value }))} />
        </label>
      </div>
      <StepNav caseId={caseId} step="safety" beforeNext={async () => {
        await api.saveSection(caseId, 'red_flags', latest.current).catch(() => {});
        return true;
      }} />
    </>
  );
}

export default function SafetyPage() {
  const { id } = useParams();
  const { answers, error } = useCaseAnswers(id);
  return (
    <Shell>
      <Progress caseId={id} step="safety" />
      {error && <p className="error" role="alert">{error}</p>}
      {!answers && !error && <p>Loading…</p>}
      {answers && <SafetyForm caseId={id} saved={answers.red_flags} />}
    </Shell>
  );
}
