'use client';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// The project URL and publishable key are meant to be public: they let the
// browser talk to Supabase, and row-level security (supabase/schema.sql)
// decides what each signed-in user may read or write. Env vars override them.
const URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://cnyyzezfpigacidbluoy.supabase.co';
const KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? 'sb_publishable_1vUuZ-I-g7eeLNVAQk-iYQ_N-wDOm2P';

let client: SupabaseClient | null = null;

/** The one Supabase client for the browser. Null during server rendering. */
export function supabase(): SupabaseClient | null {
  if (typeof window === 'undefined') return null;
  if (!client) client = createClient(URL, KEY, { auth: { persistSession: true, autoRefreshToken: true } });
  return client;
}
