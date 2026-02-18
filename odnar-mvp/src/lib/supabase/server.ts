import "server-only";
import { createClient } from "@supabase/supabase-js";
import { getEnvPublic } from "@/lib/env/public";

export function getSupabaseServer() {
  const env = getEnvPublic();
  if (!env) return null;

  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

