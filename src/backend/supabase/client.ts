// Canonical browser-side Supabase client. Anon publishable key only — the
// service-role key is never imported here and must never reach the bundle.
// All in-app imports should resolve to this module via `@/lib/supabase`
// (the public re-export) so we keep a single instance.
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
  import.meta.env.VITE_SUPABASE_ANON_KEY;
const hasSupabaseConfig = Boolean(supabaseUrl && supabaseKey);

if (!hasSupabaseConfig) {
  console.error(
    "Missing Supabase browser env. Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in the deployment environment."
  );
}

export const supabase = createClient(
  hasSupabaseConfig ? supabaseUrl : "https://missing-supabase-url.supabase.co",
  hasSupabaseConfig ? supabaseKey : "missing-supabase-publishable-key",
  {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  }
);

export async function testConnection(): Promise<{ ok: boolean; message: string }> {
  try {
    const { error } = await supabase.from('polls').select('id').limit(1);
    if (error) return { ok: false, message: error.message };
    return { ok: true, message: 'Connected to Supabase' };
  } catch (err) {
    return { ok: false, message: String(err) };
  }
}
