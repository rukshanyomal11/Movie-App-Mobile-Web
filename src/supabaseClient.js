import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const hasSupabaseConfig = Boolean(supabaseUrl && supabasePublishableKey);

export const supabase = hasSupabaseConfig
  ? createClient(supabaseUrl, supabasePublishableKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    })
  : null;

export function getSupabaseConfigError() {
  if (!supabaseUrl && !supabasePublishableKey) {
    return 'Missing VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in website/.env.';
  }

  if (!supabaseUrl) {
    return 'Missing VITE_SUPABASE_URL in website/.env.';
  }

  if (!supabasePublishableKey) {
    return 'Missing VITE_SUPABASE_PUBLISHABLE_KEY in website/.env.';
  }

  return '';
}
