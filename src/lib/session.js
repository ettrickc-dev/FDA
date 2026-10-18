// Who is using the app right now: a guest (anonymous session) or a saved account.
import { useEffect, useState } from 'react';
import { supabase } from './supabase.js';

export function useSessionUser() {
  const [user, setUser] = useState(undefined); // undefined = loading, null = signed out
  useEffect(() => {
    let live = true;
    supabase.auth.getSession().then(({ data }) => { if (live) setUser(data?.session?.user ?? null); });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => setUser(session?.user ?? null));
    return () => { live = false; sub?.subscription?.unsubscribe(); };
  }, []);
  return user;
}

export const isGuest = (user) => !!user?.is_anonymous;
