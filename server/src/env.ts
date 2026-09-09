import { z } from 'zod';
import { canonicalOrigin } from '../../shared/security-policy.ts';

const publicOrigin = z.string().transform((value, ctx) => {
  const origin = canonicalOrigin(value);
  if (!origin) { ctx.addIssue({ code: 'custom', message: 'invalid_origin' }); return z.NEVER; }
  return origin;
});
const originList = z.string().min(1).transform((value) => value.split(',').map((item) => item.trim()).filter(Boolean))
  .refine((list) => list.length > 0 && list.every((item) => canonicalOrigin(item) !== null), 'invalid_origins')
  .transform((list) => list.map((item) => canonicalOrigin(item)!));
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3001), HOST: z.string().default('127.0.0.1'),
  APP_NAME: z.string().min(1).max(120).default('Aplikacja'), APP_URL: publicOrigin, AUTH_URL: publicOrigin,
  TRUSTED_ORIGINS: originList,
  DATABASE_URL: z.string().url().refine((value) => value.startsWith('postgres://') || value.startsWith('postgresql://'), 'must_be_postgres'),
  BETTER_AUTH_SECRET: z.string().min(32, 'secret_too_short'),
  SMTP_HOST: z.string().min(1), SMTP_PORT: z.coerce.number().int().min(1).max(65535),
  SMTP_SECURE: z.enum(['true', 'false']).default('false').transform((value) => value === 'true'),
  SMTP_USER: z.string().optional(), SMTP_PASSWORD: z.string().optional(), MAIL_FROM: z.string().min(3),
}).superRefine((cfg, ctx) => {
  if (!cfg.TRUSTED_ORIGINS.includes(cfg.APP_URL)) {
    ctx.addIssue({ code: 'custom', path: ['TRUSTED_ORIGINS'], message: 'app_origin_must_be_trusted' });
  }
  if (cfg.NODE_ENV === 'production') {
    for (const key of ['APP_URL', 'AUTH_URL'] as const) {
      if (!cfg[key].startsWith('https://')) ctx.addIssue({ code: 'custom', path: [key], message: 'https_required_in_production' });
    }
    if (cfg.TRUSTED_ORIGINS.some((origin) => !origin.startsWith('https://'))) {
      ctx.addIssue({ code: 'custom', path: ['TRUSTED_ORIGINS'], message: 'https_required_in_production' });
    }
    if (/change|replace|example|test.only|placeholder/i.test(cfg.BETTER_AUTH_SECRET)) {
      ctx.addIssue({ code: 'custom', path: ['BETTER_AUTH_SECRET'], message: 'placeholder_secret_not_allowed' });
    }
  }
});
export type Env = z.infer<typeof envSchema>;
let cached: Env | undefined;
export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const parsed = envSchema.safeParse(source);
  if (!parsed.success) {
    // Only field names and fixed error codes, never supplied values.
    throw new Error(`Invalid server configuration:\n${parsed.error.issues.map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`).join('\n')}`);
  }
  return parsed.data;
}
export function env(): Env { cached ??= loadEnv(); return cached; }
export function resetEnvCache(): void { cached = undefined; }
