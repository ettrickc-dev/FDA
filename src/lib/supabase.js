import { createClient } from '@supabase/supabase-js';

// Login session is kept in sessionStorage (cleared when the tab closes), not localStorage.
// On a shared device this means closing the tab logs the person out. Progress is saved
// on the server, so they can log back in and resume.
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  { auth: { storage: window.sessionStorage, persistSession: true, autoRefreshToken: true } },
);
