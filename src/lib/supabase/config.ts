export interface PublicSupabaseConfig {
  url: string;
  key: string;
}

/** A key classification check, not JWT authentication or signature verification. */
export function readSupabaseConfig(env: Record<string, unknown>): PublicSupabaseConfig | null {
  const url = String(env["VITE_SUPABASE_URL"] ?? "").trim();
  const key = String(env["VITE_SUPABASE_PUBLISHABLE_KEY"] ?? "").trim();
  if (!url && !key) return null;
  if (!url || !key) throw new Error("Set both public Supabase environment variables.");
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error("The Supabase origin is invalid.");
  }
  const local = ["localhost", "127.0.0.1", "[::1]"].includes(parsed.hostname);
  if (
    (parsed.protocol !== "https:" && !(local && parsed.protocol === "http:")) ||
    parsed.username ||
    parsed.password ||
    parsed.search ||
    parsed.hash ||
    parsed.pathname !== "/"
  ) {
    throw new Error(
      "Use an HTTPS Supabase origin, or an HTTP loopback origin for local development.",
    );
  }
  if (!/^sb_publishable_[A-Za-z0-9_-]+$/.test(key)) {
    // The local CLI may still return a legacy anon JWT. Never accept service_role here.
    try {
      const payload = key.split(".")[1];
      if (!payload || key.split(".").length !== 3) throw new Error();
      const claims: unknown = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
      if (!claims || typeof claims !== "object" || !("role" in claims) || claims.role !== "anon")
        throw new Error();
    } catch {
      throw new Error("Only a publishable key or legacy anon key may be exposed to the browser.");
    }
  }
  return { url: parsed.origin, key };
}
