// GET  /api/cases          -> list my cases (no answer content)
// POST /api/cases          -> start a new draft case
// PATCH /api/cases {id, ...} -> update routing fields (role, case_type, goal, county, confidentiality)
import { admin, audit, handler, HttpError, json, readJson, requireOwnCase, requireUser } from './_lib/http.js';

const ROLE = ['payor', 'payee', 'unsure'];
const TYPE = ['new', 'modification', 'enforcement', 'unsure'];
const GOAL = ['fair', 'reduce', 'increase', 'understand'];
const COLS = 'id,status,form_type,role,case_type,goal,county,confidentiality_requested,last_step,next_court_date,created_at,updated_at';
const STEPS = ['setup', 'safety', 'documents', 'info', 'job', 'other-income', 'household', 'other-orders',
  'health', 'child-care', 'assets', 'expenses', 'debts', 'for-you', 'documents-final', 'review'];

export default handler('cases', async (req) => {
  const user = await requireUser(req);

  if (req.method === 'GET') {
    const { data, error } = await admin().from('cases').select(COLS)
      .eq('user_id', user.id).order('updated_at', { ascending: false });
    if (error) throw new HttpError(500);
    return json({ cases: data });
  }

  if (req.method === 'POST') {
    const { count } = await admin().from('cases').select('id', { count: 'exact', head: true }).eq('user_id', user.id);
    if ((count ?? 0) >= 5) throw new HttpError(429, 'You already have several forms in progress.');
    const { data, error } = await admin().from('cases').insert({ user_id: user.id }).select(COLS).single();
    if (error) throw new HttpError(500);
    await audit(user.id, 'case.created', data.id);
    return json({ case: data }, 201);
  }

  if (req.method === 'PATCH') {
    const body = await readJson(req, 4096);
    await requireOwnCase(user.id, body.id);
    const patch = {};
    if ('role' in body) { if (body.role !== null && !ROLE.includes(body.role)) throw new HttpError(400); patch.role = body.role; }
    if ('case_type' in body) { if (body.case_type !== null && !TYPE.includes(body.case_type)) throw new HttpError(400); patch.case_type = body.case_type; }
    if ('goal' in body) { if (body.goal !== null && !GOAL.includes(body.goal)) throw new HttpError(400); patch.goal = body.goal; }
    if ('county' in body) patch.county = body.county ? String(body.county).slice(0, 40) : null;
    if ('confidentiality_requested' in body) patch.confidentiality_requested = !!body.confidentiality_requested;
    if ('next_court_date' in body) {
      const v = body.next_court_date;
      if (v !== null && !(typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v)))) throw new HttpError(400);
      patch.next_court_date = v;
    }
    if ('last_step' in body) {
      if (!STEPS.includes(body.last_step)) throw new HttpError(400);
      patch.last_step = body.last_step;
    }
    const { data, error } = await admin().from('cases').update(patch).eq('id', body.id).select(COLS).single();
    if (error) throw new HttpError(500);
    return json({ case: data });
  }

  throw new HttpError(405);
});

export const config = { path: '/api/cases' };
