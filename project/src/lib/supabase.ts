// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

console.log('[supabase] Env variables:', {
  url: import.meta.env.VITE_SUPABASE_URL,
  hasAnon: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
  allEnv: import.meta.env
});

const url = import.meta.env.VITE_SUPABASE_URL!;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY!;

if (!url || !anon) {
  console.error('[supabase] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY');
  console.error('[supabase] URL:', url);
  console.error('[supabase] Has ANON key:', !!anon);
}

export const supabase = createClient(url, anon);
