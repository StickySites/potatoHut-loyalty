import { createClient } from "@supabase/supabase-js";

function requireEnv(name, value) {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

/**
 * Browser / anon client — read-only stamp lookups.
 * Prefer publishable/anon key; never put the service role key here.
 */
export function getSupabaseAnon() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY;

  return createClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL)", url),
    requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY (or SUPABASE_ANON_KEY)", key),
    {
      auth: { persistSession: false, autoRefreshToken: false },
    }
  );
}

/**
 * Server client with service role — webhooks, redeem, writes.
 * Falls back to anon only if service role is unset (local demos); writes may fail under RLS.
 */
export function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY;

  const key = serviceKey || anonKey;

  return createClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL)", url),
    requireEnv("SUPABASE_SERVICE_ROLE_KEY (or anon fallback)", key),
    {
      auth: { persistSession: false, autoRefreshToken: false },
    }
  );
}

/** @deprecated Prefer getSupabaseAnon() / getSupabaseAdmin() */
export const supabase = (() => {
  try {
    return getSupabaseAnon();
  } catch {
    return null;
  }
})();
