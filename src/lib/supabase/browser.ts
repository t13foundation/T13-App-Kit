import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import { readSupabaseConfig } from "./config";

let browserClient: SupabaseClient<Database> | undefined;

/** Call only after hydration. No server singleton, cookies, or private SSR payload. */
export function getBrowserSupabase(): SupabaseClient<Database> | null {
  if (typeof window === "undefined") throw new Error("Supabase browser client must not run during SSR.");
  const config = readSupabaseConfig(import.meta.env);
  if (!config) return null;
  browserClient ??= createClient<Database>(config.url, config.key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      // This slice uses a confirmation code, never tokens from a URL fragment.
      detectSessionInUrl: false,
    },
  });
  return browserClient;
}
