// Screen 1: Case info (spec Section 5). Demonstrates encrypted autosave + resume.
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Shell from '../components/Shell.jsx';
import SaveStatus from '../components/SaveStatus.jsx';
import { NY_COUNTIES } from '../config.js';
import { api } from '../lib/api.js';
import { useAutosave } from '../lib/useAutosave.js';

const EMPTY = {
  county: '', file_no: '', docket_no: '', court_date: '', party: '',
  full_name: '', confidential: '', street: '', apt: '', city: '', state: 'NY', zip: '',
};

export default function CaseInfo() {
  const { id } = useParams();
  const nav = useNavigate();
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    api.getAnswers(id)
      .then(({ answers }) => setData({ ...EMPTY, ...(answers.case_info?.data || {}) }))
      .catch((e) => (e.status === 401 ? nav('/account', { replace: true }) : setErr(e.message)));
  }, [id, nav]);

  const status = useAutosave(id, 'case_info', data || EMPTY, { enabled: data !== null });

  // Keep routing fields on the case row in sync (county, confidentiality flag).
  useEffect(() => {
    if (!data) return;
    const t = setTimeout(() => {
      api.updateCase(id, { county: data.county || null, confidentiality_requested: data.confidential === 'yes' }).catch(() => {});
    }, 1000);
    return () => clearTimeout(t);
  }, [id, data?.county, data?.confidential]); // eslint-disable-line

  if (err) return <Shell><p className="error" role="alert">{err}</p></Shell>;
  if (!data) return <Shell><p>Loading…</p></Shell>;

  const set = (k) => (e) => setData((d) => ({ ...d, [k]: e.target.value }));
  const confidential = data.confidential === 'yes';

  return (
    <Shell>
      <p className="eyebrow">Step 1 · About your case</p>
      <h1>Case information</h1>
      <SaveStatus status={status} />

      <div className="card form">
        <label className="field">
          <span>County where your case is</span>
          <select value={data.county} onChange={set('county')}>
            <option value="">Choose a county</option>
            {NY_COUNTIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </label>

        <fieldset className="field">
          <legend>In this case, are you the Petitioner or the Respondent?</legend>
          <small>The Petitioner is the person who started the case. The Respondent is the other person.</small>
          {[['petitioner', 'Petitioner'], ['respondent', 'Respondent']].map(([v, l]) => (
            <label key={v} className="choice">
              <input type="radio" name="party" value={v} checked={data.party === v} onChange={set('party')} /> {l}
            </label>
          ))}
        </fieldset>

        <label className="field">
          <span>Your full legal name</span>
          <input autoComplete="off" value={data.full_name} onChange={set('full_name')} maxLength={120} />
        </label>

        <details className="optional">
          <summary>Court papers details (optional)</summary>
          <p className="hint">You can find these on the papers you got from the court. Leave blank if you don't have them.</p>
          <label className="field"><span>File #</span>
            <input autoComplete="off" value={data.file_no} onChange={set('file_no')} maxLength={40} /></label>
          <label className="field"><span>Docket #</span>
            <input autoComplete="off" value={data.docket_no} onChange={set('docket_no')} maxLength={40} /></label>
          <label className="field"><span>Next court date, time, and part</span>
            <input autoComplete="off" value={data.court_date} onChange={set('court_date')} maxLength={80}
              placeholder="e.g. Nov 3, 9:30 AM, Part 4" /></label>
        </details>
      </div>

      <div className="card form">
        <fieldset className="field">
          <legend>Would sharing your home address with the other parent put your health, safety, or freedom at risk?</legend>
          {[['no', 'No'], ['yes', 'Yes'], ['prefer_not', 'Prefer not to say']].map(([v, l]) => (
            <label key={v} className="choice">
              <input type="radio" name="confidential" value={v} checked={data.confidential === v} onChange={set('confidential')} /> {l}
            </label>
          ))}
        </fieldset>

        {confidential ? (
          <div className="notice" role="note">
            <p>
              You can ask the court to keep your address confidential under Family Court Act § 154-b,
              using forms GF-21 and GF-21a (available at nycourts.gov). The court decides whether to
              grant this request.
            </p>
            <p>
              Your form will say <strong>"Confidential – see GF-21 application"</strong> where your
              address would go. We won't ask for your address.
            </p>
            <p>If you are in danger right now, call 911.</p>
          </div>
        ) : (
          <>
            <label className="field"><span>Home street address</span>
              <input autoComplete="off" value={data.street} onChange={set('street')} maxLength={120} /></label>
            <label className="field"><span>Apartment or unit (optional)</span>
              <input autoComplete="off" value={data.apt} onChange={set('apt')} maxLength={20} /></label>
            <div className="row">
              <label className="field grow"><span>City</span>
                <input autoComplete="off" value={data.city} onChange={set('city')} maxLength={60} /></label>
              <label className="field small"><span>State</span>
                <input autoComplete="off" value={data.state} onChange={set('state')} maxLength={2} /></label>
              <label className="field small"><span>ZIP</span>
                <input autoComplete="off" inputMode="numeric" value={data.zip} onChange={set('zip')} maxLength={10} /></label>
            </div>
          </>
        )}
      </div>

      <div className="nav-row">
        <button className="btn" onClick={() => nav('/home', { replace: true })}>Save and exit</button>
        <button className="btn primary" disabled title="Next screens arrive in build step 3">Next</button>
      </div>
    </Shell>
  );
}
