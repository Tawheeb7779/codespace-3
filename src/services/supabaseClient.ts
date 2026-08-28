import { createClient } from '@supabase/supabase-js';

interface ViteEnv {
  VITE_SUPABASE_URL?: string;
  VITE_SUPABASE_ANON_KEY?: string;
}

const env: ViteEnv = ((import.meta as unknown as { env?: ViteEnv }).env ?? {}) as ViteEnv;

const rawUrl = (env.VITE_SUPABASE_URL || '').trim();
const rawKey = (env.VITE_SUPABASE_ANON_KEY || '').trim();

/**
 * True only when both build-time variables are present and point at a real
 * project. Everything Supabase-backed is gated on this so the app degrades to
 * local-only mode instead of failing against a placeholder endpoint.
 */
export const isSupabaseConfigured = Boolean(
  rawUrl && rawKey && !rawUrl.includes('placeholder') && /^https?:\/\//.test(rawUrl)
);

// Fallbacks keep `createClient` from throwing during module init; every call
// path is guarded by `isSupabaseConfigured`.
const supabaseUrl = isSupabaseConfigured ? rawUrl : 'https://placeholder-project.supabase.co';
const supabaseAnonKey = isSupabaseConfigured ? rawKey : 'public-anon-key-placeholder';

/** The configured project URL, for display. Never returns the key. */
export function getSupabaseUrl(): string {
  return isSupabaseConfigured ? rawUrl : '';
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
