// src/global.ts
import { supabase } from './lib/supabase';

declare global {
  interface Window { supabase: typeof supabase }
}

if (typeof window !== 'undefined') {
  (window as any).supabase = supabase;
  console.log('[global] window.supabase prêt', window.supabase);
}
