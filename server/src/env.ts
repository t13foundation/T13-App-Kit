import { z } from "zod";

/**
 * Environment contract. The server refuses to start when secrets are missing,
 * still hold a placeholder value, or when origins are malformed — there is no
 * silent fallback and no dev bypass.
 */
const PLACEHOLDER = /(change[-_ ]?me|changeme|replace[-_ ]?me|your[-_ ]?secret|example|todo|xxxx)/i;

/**
 * A public origin must be scheme + host only: no credentials, no path, no
 * query, no fragment and no wildcard.
 */
function parseOrigin(value: string): string | null {
  if (value.includes("*")) return null;
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return null;
  if (url.username || url.password) return null;
  if (url.search || url.hash) return null;
  if (url.pathname !== "/" && url.pathname !== "") return null;
  if (value.replace(/\/$/, "") !== url.origin) return null;
  return url.origin;
}

const publicUrl = z.string().superRefine((value, ctx) => {
  if (!parseOrigin(value)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "must_be_bare_public_origin" });
  }
});

const originList = z
  .string()
  .min(1)
  .transform((value) =>
    value
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean),
  )
  .superRefine((list, ctx) => {
    if (list.length === 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "at_least_one_trusted_origin" });
    }
    for (const origin of list) {
      if (!parseOrigin(origin)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "must_be_bare_public_origin" });
        return;
      }
    }
  })
  .transform((list) => list.map((origin) => parseOrigin(origin)!));

/** Optional comma separated list of proxy IPs/CIDRs Fastify may trust. */
const proxyList = z
  .string()
  .optional()
  .transform((value) =>
    (value ?? "")
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean),
  );

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3001),
  HOST: z.string().default("127.0.0.1"),

  /** Public base URL of the web app; used for links inside emails. */
  APP_NAME: z.string().min(1).default("Aplikacja"),
  APP_URL: publicUrl,
  /**
   * Public origin the auth API is reachable at — that is the origin of the web
   * proxy, never the internal backend port.
   */
  AUTH_URL: publicUrl,
  /** Comma separated list of origins allowed to call the API with cookies. */
  TRUSTED_ORIGINS: originList,
  /** Comma separated proxy addresses; empty means "no proxy is trusted". */
  TRUSTED_PROXIES: proxyList,

  DATABASE_URL: z
    .string()
    .refine((v) => /^postgres(ql)?:\/\//.test(v), "must_be_postgres"),

  BETTER_AUTH_SECRET: z
    .string()
    .min(32, "secret_too_short")
    .refine((v) => !PLACEHOLDER.test(v), "placeholder_secret_not_allowed"),

  SMTP_HOST: z.string().min(1),
  SMTP_PORT: z.coerce.number().int().positive(),
  SMTP_SECURE: z
    .enum(["true", "false"])
    .default("false")
    .transform((v) => v === "true"),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z
    .string()
    .optional()
    .refine((v) => v === undefined || !PLACEHOLDER.test(v), "placeholder_secret_not_allowed"),
  MAIL_FROM: z.string().min(3),
});

export type Env = z.infer<typeof envSchema>;

let cached: Env | undefined;

export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const parsed = envSchema.safeParse(source);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `  - ${issue.path.join(".") || "(root)"}: ${issue.message}`)
      .join("\n");
    // Names only — never the values.
    throw new Error(`Invalid server configuration:\n${issues}`);
  }
  const data = parsed.data;

  if (data.NODE_ENV === "production") {
    const insecure = [data.APP_URL, data.AUTH_URL, ...data.TRUSTED_ORIGINS].filter(
      (origin) => !origin.startsWith("https://"),
    );
    if (insecure.length > 0) {
      throw new Error(
        "Invalid server configuration:\n  - PUBLIC_ORIGINS: https_required_in_production",
      );
    }
  }
  return data;
}

/** True when the public auth origin is HTTPS, including HTTPS previews. */
export function usesHttps(config: Env): boolean {
  return config.AUTH_URL.startsWith("https://");
}

export function env(): Env {
  cached ??= loadEnv();
  return cached;
}

/** Test helper: force re-reading process.env. */
export function resetEnvCache(): void {
  cached = undefined;
}
