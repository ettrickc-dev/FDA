// Keeps the case's next court date in memory so every screen can show the countdown,
// and updates it as soon as the person changes the date on "Your situation".
import { useEffect, useState } from 'react';
import { api } from './api.js';

const cache = new Map();          // caseId -> 'YYYY-MM-DD' | null
const listeners = new Set();

export function rememberCourtDate(caseId, date) {
  cache.set(caseId, date || null);
  listeners.forEach((fn) => fn());
}

export function useCourtDate(caseId) {
  const [, force] = useState(0);
  useEffect(() => {
    const fn = () => force((n) => n + 1);
    listeners.add(fn);
    if (!cache.has(caseId)) {
      api.listCases()
        .then(({ cases }) => {
          for (const c of cases) if (!cache.has(c.id)) cache.set(c.id, c.next_court_date || null);
          listeners.forEach((l) => l());
        })
        .catch(() => {});
    }
    return () => listeners.delete(fn);
  }, [caseId]);
  return cache.get(caseId) ?? null;
}

// Whole days from today (local time) to the court date. Negative = in the past.
export function daysUntil(dateStr, now = new Date()) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr || '')) return null;
  const [y, m, d] = dateStr.split('-').map(Number);
  const target = new Date(y, m - 1, d);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((target - today) / 86400000);
}

export function countdownText(dateStr, now = new Date()) {
  const n = daysUntil(dateStr, now);
  if (n === null) return null;
  const [y, m, d] = dateStr.split('-').map(Number);
  const pretty = new Date(y, m - 1, d).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  if (n < 0) return { tone: 'past', text: `The court date you entered (${pretty}) has passed. If you have a new date, update it on "Your situation".` };
  if (n === 0) return { tone: 'urgent', text: `Your court date is today (${pretty}). Bring this form completed and signed.` };
  if (n === 1) return { tone: 'urgent', text: `Your court date is tomorrow (${pretty}). Bring this form completed and signed.` };
  return { tone: n <= 7 ? 'urgent' : 'soon', text: `Your court date is ${pretty}: ${n} days from now. Bring this form completed and signed.` };
}
