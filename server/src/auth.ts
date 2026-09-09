import { drizzleAdapter } from '@better-auth/drizzle-adapter';
import { betterAuth } from 'better-auth';
import { twoFactor } from 'better-auth/plugins';
import { db } from './db/client.ts';
import { schema } from './db/schema.ts';
import { env } from './env.ts';
import { sendResetPasswordMail, sendVerificationMail } from './mail/send.ts';

export const AUTH_BASE_PATH = '/api/auth';
export function createAuth() {
  const cfg = env();
  const secure = new URL(cfg.AUTH_URL).protocol === 'https:';
  return betterAuth({
    appName: cfg.APP_NAME, baseURL: cfg.AUTH_URL, basePath: AUTH_BASE_PATH,
    secret: cfg.BETTER_AUTH_SECRET, trustedOrigins: cfg.TRUSTED_ORIGINS,
    database: drizzleAdapter(db(), { provider: 'pg', schema }),
    logger: { disabled: true }, // Sanitized operation metadata is logged by Fastify.
    emailAndPassword: {
      enabled: true, requireEmailVerification: true, minPasswordLength: 12,
      sendResetPassword: async ({ user, url }) => { await sendResetPasswordMail(user.email, url); },
      revokeSessionsOnPasswordReset: true,
    },
    emailVerification: {
      sendOnSignUp: true, autoSignInAfterVerification: false,
      sendVerificationEmail: async ({ user, url }) => { await sendVerificationMail(user.email, url); },
    },
    user: {
      additionalFields: {
        locale: { type: 'string', required: false, defaultValue: 'pl', input: false },
        timezone: { type: 'string', required: false, defaultValue: 'Europe/Warsaw', input: false },
      },
      changeEmail: { enabled: false }, deleteUser: { enabled: false },
    },
    session: {
      expiresIn: 60 * 60 * 24 * 7, updateAge: 60 * 60 * 24, freshAge: 5 * 60,
      cookieCache: { enabled: false },
    },
    rateLimit: {
      enabled: true, storage: 'database', modelName: 'rateLimit', window: 60, max: 60,
      customRules: {
        '/sign-in/email': { window: 300, max: 10 }, '/sign-up/email': { window: 3600, max: 5 },
        '/request-password-reset': { window: 3600, max: 5 }, '/reset-password': { window: 3600, max: 10 },
        '/send-verification-email': { window: 3600, max: 5 }, '/two-factor/verify-totp': { window: 300, max: 10 },
        '/two-factor/verify-backup-code': { window: 3600, max: 10 },
      },
    },
    advanced: {
      useSecureCookies: secure, disableCSRFCheck: false, disableOriginCheck: false,
      ipAddress: { ipAddressHeaders: ['x-forwarded-for'] },
      defaultCookieAttributes: { httpOnly: true, sameSite: 'lax', secure, path: '/' },
    },
    disabledPaths: ['/sign-in/social', '/sign-in/username', '/sign-in/phone-number',
      '/delete-user', '/change-email', '/two-factor/view-backup-codes', '/two-factor/send-otp', '/two-factor/verify-otp'],
    plugins: [twoFactor({ issuer: cfg.APP_NAME, skipVerificationOnEnable: false })],
  });
}
export type Auth = ReturnType<typeof createAuth>;
let instance: Auth | undefined;
export function auth(): Auth { instance ??= createAuth(); return instance; }
