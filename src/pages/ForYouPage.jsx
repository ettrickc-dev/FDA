// Goal-based recommendations screen (spec Section 4 step 8, Section 7).
import { useParams } from 'react-router-dom';
import { LawyerLinks } from '../components/Help.jsx';
import Shell from '../components/Shell.jsx';
import StepNav, { Progress } from '../components/StepNav.jsx';
import { pickRecommendations } from '../lib/recommendations.js';
import { useCaseAnswers } from '../lib/useCase.js';

export default function ForYouPage() {
  const { id } = useParams();
  const { answers, error } = useCaseAnswers(id);
  const blocks = answers ? pickRecommendations(answers.case_setup || {}) : [];

  return (
    <Shell>
      <Progress caseId={id} step="for-you" />
      <h1>Information for your situation</h1>
      <p className="lede">Based on what you told us about your case and your goal. This is general information written by a New York attorney — not legal advice about your case.</p>
      {error && <p className="error" role="alert">{error}</p>}
      {!answers && !error && <p>Loading…</p>}
      {blocks.map((b) => (
        <details key={b.id} className="card rec" open={blocks.indexOf(b) < 2}>
          <summary><h2>{b.title}</h2></summary>
          {b.body.map((p, i) => <p key={i}>{p}</p>)}
        </details>
      ))}
      {answers && (
        <section className="card subtle">
          <h2>Want advice about your case?</h2>
          <p>Only a lawyer who knows the facts of your case can give you legal advice.</p>
          <LawyerLinks />
        </section>
      )}
      <StepNav caseId={id} step="for-you" />
    </Shell>
  );
}
