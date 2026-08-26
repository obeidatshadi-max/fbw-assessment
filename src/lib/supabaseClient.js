import { createClient } from '@supabase/supabase-js';

export function hasSupabaseConfig(url, key) {
  return Boolean(url) && Boolean(key);
}

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!hasSupabaseConfig(url, anonKey)) {
  console.warn('Supabase env vars are not set — sign-in and saving are disabled.');
}

export const supabase = hasSupabaseConfig(url, anonKey) ? createClient(url, anonKey) : null;
