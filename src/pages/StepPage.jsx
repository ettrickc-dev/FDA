// Generic intake screen: renders a screen definition, autosaves, and moves through the flow.
import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import Fields from '../components/Fields.jsx';
import SaveStatus from '../components/SaveStatus.jsx';
import Shell from '../components/Shell.jsx';
import StepNav, { Progress } from '../components/StepNav.jsx';
import { SCREENS } from '../content/screens.js';
import { api } from '../lib/api.js';
import { hydrate } from '../lib/formLogic.js';
import { useAutosave } from '../lib/useAutosave.js';
import { useCaseAnswers } from '../lib/useCase.js';

function ScreenForm({ caseId, step, screen, saved }) {
  const [data, setData] = useState(() => ({ ...(screen.defaults || {}), ...hydrate(screen.fields, saved) }));
  const status = useAutosave(caseId, screen.section, data);
  const latest = useRef(data);
  latest.current = data;

  // Keep a few non-sensitive routing fields on the case row (county, role, goal…).
  const patchKey = screen.casePatch ? JSON.stringify(screen.casePatch(data)) : '';
  useEffect(() => {
    if (!screen.casePatch) return;
    const t = setTimeout(() => api.updateCase(caseId, screen.casePatch(latest.current)).catch(() => {}), 1000);
    return () => clearTimeout(t);
  }, [patchKey]); // eslint-disable-line

  // Save immediately when moving on, so nothing is lost between screens.
  const flush = async () => {
    try {
      await api.saveSection(caseId, screen.section, latest.current);
      if (screen.casePatch) await api.updateCase(caseId, screen.casePatch(latest.current)).catch(() => {});
      return true;
    } catch {
      return true; // never block the person; autosave retries on the next change
    }
  };

  return (
    <>
      {screen.eyebrow && <p className="eyebrow">{screen.eyebrow}</p>}
      <h1>{screen.title}</h1>
      {screen.intro && <p className="lede">{screen.intro}</p>}
      <SaveStatus status={status} />
      <form className="card form" onSubmit={(e) => e.preventDefault()} noValidate>
        <Fields fields={screen.fields} data={data} setData={setData} />
      </form>
      <StepNav caseId={caseId} step={step} beforeNext={flush} />
    </>
  );
}

export default function StepPage() {
  const { id, step } = useParams();
  const screen = SCREENS[step];
  const { answers, error } = useCaseAnswers(id);

  if (!screen) return <Shell><p>Page not found.</p></Shell>;
  return (
    <Shell>
      <Progress caseId={id} step={step} />
      {error && <p className="error" role="alert">{error}</p>}
      {!answers && !error && <p>Loading…</p>}
      {answers && <ScreenForm key={step} caseId={id} step={step} screen={screen} saved={answers[screen.section]} />}
    </Shell>
  );
}
