import { Route, Routes, useParams } from 'react-router-dom';
import Shell from './components/Shell.jsx';
import Account from './pages/Account.jsx';
import DocumentsPage from './pages/DocumentsPage.jsx';
import Home from './pages/Home.jsx';
import Landing from './pages/Landing.jsx';
import { PrivacyPolicy, TermsOfUse } from './pages/LegalPages.jsx';
import CheckoutReturn from './pages/CheckoutReturn.jsx';
import DeleteMyData from './pages/DeleteMyData.jsx';
import DownloadPage from './pages/DownloadPage.jsx';
import ForYouPage from './pages/ForYouPage.jsx';
import RefundPolicy from './pages/RefundPolicy.jsx';
import ReviewPage from './pages/ReviewPage.jsx';
import UnlockPage from './pages/UnlockPage.jsx';
import SafetyPage from './pages/SafetyPage.jsx';
import StepPage from './pages/StepPage.jsx';
import Terms from './pages/Terms.jsx';
import SaveProgress from './pages/SaveProgress.jsx';
import ReadyList from './components/ReadyList.jsx';

function Placeholder({ title }) {
  return (
    <Shell>
      <h1>{title}</h1>
      <p>We couldn't find that page. <a href="/">Go to the start</a>.</p>
    </Shell>
  );
}

function CaseStep() {
  const { step } = useParams();
  if (step === 'safety') return <SafetyPage />;
  if (step === 'documents') return <DocumentsPage />;
  if (step === 'documents-final') return <DocumentsPage final />;
  if (step === 'for-you') return <ForYouPage />;
  if (step === 'review') return <ReviewPage />;
  if (step === 'unlock') return <UnlockPage />;
  if (step === 'download') return <DownloadPage />;
  return <StepPage />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/account" element={<Account />} />
      <Route path="/home" element={<Home />} />
      <Route path="/case/:id/:step" element={<CaseStep />} />
      <Route path="/checkout/return" element={<CheckoutReturn />} />
      <Route path="/refunds" element={<RefundPolicy />} />
      <Route path="/delete-my-data" element={<DeleteMyData />} />
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/terms-of-use" element={<TermsOfUse />} />
      <Route path="/save-progress" element={<SaveProgress />} />
      <Route path="/what-you-need" element={<Shell><h1>What you'll need</h1><ReadyList title="Checklist" showPrint /></Shell>} />
      <Route path="*" element={<Placeholder title="Page not found" />} />
    </Routes>
  );
}
