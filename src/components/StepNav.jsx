import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FLOW, STEP_NAMES } from '../content/screens.js';
import { api } from '../lib/api.js';

export function useStepNav(caseId, step) {
  const nav = useNavigate();
  const i = FLOW.indexOf(step);
  const go = (s) => { window.scrollTo(0, 0); nav(`/case/${caseId}/${s}`, { replace: true }); };
  return {
    index: i,
    total: FLOW.length,
    prev: i > 0 ? FLOW[i - 1] : null,
    next: i >= 0 && i < FLOW.length - 1 ? FLOW[i + 1] : null,
    go,
    home: () => nav('/home', { replace: true }),
  };
}

export function Progress({ caseId, step }) {
  const { index, total } = useStepNav(caseId, step);
  // Remember where the person is, so "Continue" brings them back here.
  useEffect(() => { api.updateCase(caseId, { last_step: step }).catch(() => {}); }, [caseId, step]);
  const pct = Math.round(((index + 1) / total) * 100);
  return (
    <div className="progress" aria-label={`Step ${index + 1} of ${total}: ${STEP_NAMES[step]}`}>
      <div className="progress-bar"><div style={{ width: `${pct}%` }} /></div>
      <small>Step {index + 1} of {total}</small>
    </div>
  );
}

export default function StepNav({ caseId, step, beforeNext, nextLabel, nextDisabled }) {
  const { prev, next, go, home } = useStepNav(caseId, step);
  async function onNext() {
    if (beforeNext) {
      const ok = await beforeNext();
      if (ok === false) return;
    }
    if (next) go(next);
  }
  return (
    <div className="step-nav">
      <div className="nav-row">
        {prev ? <button type="button" className="btn" onClick={() => go(prev)}>Back</button> : <span />}
        {next && (
          <button type="button" className="btn primary" onClick={onNext} disabled={nextDisabled}>
            {nextLabel || 'Next'}
          </button>
        )}
      </div>
      <p className="center"><button type="button" className="link" onClick={home}>Save and finish later</button></p>
    </div>
  );
}
