import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database";
import { env } from "./env";

let client: SupabaseClient<Database> | undefined;

export function getSupabase(): SupabaseClient<Database> {
  if (!client) {
    client = createClient<Database>(env.supabaseUrl, env.supabaseServiceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return client;
}
