import { Route, Routes } from 'react-router-dom';
import Shell from './components/Shell.jsx';
import Account from './pages/Account.jsx';
import CaseInfo from './pages/CaseInfo.jsx';
import Home from './pages/Home.jsx';
import Landing from './pages/Landing.jsx';
import Terms from './pages/Terms.jsx';

function Placeholder({ title }) {
  return (
    <Shell>
      <h1>{title}</h1>
      <p className="notice">[DRAFT — owner and ethics counsel to supply final text before launch.]</p>
    </Shell>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/account" element={<Account />} />
      <Route path="/home" element={<Home />} />
      <Route path="/case/:id/info" element={<CaseInfo />} />
      <Route path="/privacy" element={<Placeholder title="Privacy Policy" />} />
      <Route path="/terms-of-use" element={<Placeholder title="Terms of Use" />} />
      <Route path="*" element={<Placeholder title="Page not found" />} />
    </Routes>
  );
}
