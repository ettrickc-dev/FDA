import { useParams } from 'react-router-dom';
import Shell from '../components/Shell.jsx';
import StepNav, { Progress } from '../components/StepNav.jsx';

// Replaced in build step 5 by the review screen and DRAFT preview.
export default function ReviewPlaceholder() {
  const { id } = useParams();
  return (
    <Shell>
      <Progress caseId={id} step="review" />
      <h1>Review</h1>
      <p className="notice">Your answers are saved. The review screen and draft preview of your form are coming in the next build step.</p>
      <StepNav caseId={id} step="review" />
    </Shell>
  );
}
