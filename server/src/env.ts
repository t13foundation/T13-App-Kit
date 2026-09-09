import { z } from "zod";

/**
 * Environment contract. The server refuses to start when secrets are missing
 * or origins are malformed — there is no silent fallback and no dev bypass.
 */
const originList = z
  .string()
  .min(1)
  .transform((value) => value.split(",").map((entry) => entry.trim()).filter(Boolean))
  .refine((list) => list.length > 0, "at_least_one_trusted_origin")
  .refine(
    (list) => list.every((origin) => /^https?:\/\/[^/\s]+$/.test(origin)),
    "origins_must_be_scheme_and_host_without_path",
  );

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3001),
  HOST: z.string().default("127.0.0.1"),

  /** Public base URL of the web app; used for links inside emails. */
  APP_NAME: z.string().min(1).default("Aplikacja"),
  APP_URL: z.string().url(),
  /** Public base URL the auth API is reachable at (proxy origin included). */
  AUTH_URL: z.string().url(),
  /** Comma separated list of origins allowed to call the API with cookies. */
  TRUSTED_ORIGINS: originList,

  DATABASE_URL: z.string().url().refine((v) => v.startsWith("postgres"), "must_be_postgres"),

  BETTER_AUTH_SECRET: z.string().min(32, "secret_too_short"),

  SMTP_HOST: z.string().min(1),
  SMTP_PORT: z.coerce.number().int().positive(),
  SMTP_SECURE: z
    .enum(["true", "false"])
    .default("false")
    .transform((v) => v === "true"),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
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
  if (parsed.data.NODE_ENV === "production" && !parsed.data.AUTH_URL.startsWith("https://")) {
    throw new Error("Invalid server configuration:\n  - AUTH_URL: https_required_in_production");
  }
  return parsed.data;
}

export function env(): Env {
  cached ??= loadEnv();
  return cached;
}

/** Test helper: force re-reading process.env. */
export function resetEnvCache(): void {
  cached = undefined;
}
