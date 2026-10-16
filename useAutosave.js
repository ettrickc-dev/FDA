import { useEffect, useRef, useState } from 'react';
import { api } from './api.js';

// Saves a screen's answers automatically, shortly after the person stops typing.
// status: 'idle' | 'saving' | 'saved' | 'error'
export function useAutosave(caseId, section, data, { delay = 800, enabled = true } = {}) {
  const [status, setStatus] = useState('idle');
  const first = useRef(true);
  const timer = useRef();
  const latest = useRef(data);
  latest.current = data;

  useEffect(() => {
    if (!enabled || !caseId) return;
    if (first.current) { first.current = false; return; } // don't save on initial load
    clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      setStatus('saving');
      try {
        await api.saveSection(caseId, section, latest.current);
        setStatus('saved');
      } catch {
        setStatus('error');
      }
    }, delay);
    return () => clearTimeout(timer.current);
  }, [caseId, section, JSON.stringify(data), enabled]); // eslint-disable-line

  // Flush on tab hide so nothing typed is lost.
  useEffect(() => {
    const flush = () => {
      if (document.visibilityState === 'hidden' && timer.current && caseId && enabled) {
        clearTimeout(timer.current);
        api.saveSection(caseId, section, latest.current).catch(() => {});
      }
    };
    document.addEventListener('visibilitychange', flush);
    return () => document.removeEventListener('visibilitychange', flush);
  }, [caseId, section, enabled]);

  return status;
}
