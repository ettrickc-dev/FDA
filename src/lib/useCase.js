import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from './api.js';

// Loads every saved screen for a case (decrypted by the server).
export function useCaseAnswers(caseId) {
  const [answers, setAnswers] = useState(null);
  const [error, setError] = useState('');
  const nav = useNavigate();
  useEffect(() => {
    let live = true;
    setAnswers(null);
    api.getAnswers(caseId)
      .then(({ answers }) => {
        if (!live) return;
        const flat = {};
        for (const [k, v] of Object.entries(answers)) flat[k] = v.data;
        setAnswers(flat);
      })
      .catch((e) => {
        if (!live) return;
        if (e.status === 401) nav('/account', { replace: true });
        else setError(e.message);
      });
    return () => { live = false; };
  }, [caseId, nav]);
  return { answers, error };
}
