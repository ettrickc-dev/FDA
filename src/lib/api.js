import { supabase } from './supabase.js';

async function call(path, { method = 'GET', body } = {}) {
  const { data } = await supabase.auth.getSession();
  const token = data?.session?.access_token;
  const res = await fetch(path, {
    method,
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const out = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(out.error || 'Something went wrong. Please try again.');
    err.status = res.status;
    throw err;
  }
  return out;
}

export const api = {
  consentStatus: () => call('/api/consent'),
  recordConsent: (termsVersion, acceptedAt) =>
    call('/api/consent', { method: 'POST', body: { termsVersion, acceptedAt } }),
  listCases: () => call('/api/cases'),
  createCase: () => call('/api/cases', { method: 'POST' }),
  updateCase: (id, patch) => call('/api/cases', { method: 'PATCH', body: { id, ...patch } }),
  getAnswers: (caseId) => call(`/api/answers?case=${encodeURIComponent(caseId)}`),
  preview: (caseId) => call(`/api/preview?case=${encodeURIComponent(caseId)}`),
  deleteMyData: () => call('/api/delete-my-data', { method: 'POST', body: { confirm: 'DELETE' } }),
  paywall: (caseId) => call(`/api/paywall?case=${encodeURIComponent(caseId)}`),
  checkout: (caseId) => call('/api/checkout', { method: 'POST', body: { caseId } }),
  downloadLink: (caseId) => call('/api/download', { method: 'POST', body: { caseId } }),
  logFlag: (caseId, flagType, answer) =>
    call('/api/red-flags', { method: 'POST', body: { caseId, flagType, answer } }),
  flagAction: (caseId, id, userAction) =>
    call('/api/red-flags', { method: 'PATCH', body: { caseId, id, userAction } }),
  saveSection: (caseId, section, data) =>
    call('/api/answers', { method: 'PUT', body: { caseId, section, data } }),
};
