import { createClient } from "@supabase/supabase-js";
import { hasServerSupabaseEnv } from "@/lib/env";
import type { Database } from "@/types/database.types";

export function createAdminClient() {
  if (!hasServerSupabaseEnv()) {
    throw new Error("Supabase server env vars are missing.");
  }

  return createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
