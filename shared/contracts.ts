/** Browser-safe contracts. Never import server modules or environment values here. */
import { z } from 'zod';

export const localeSchema = z.enum(['pl', 'en']);
export type Locale = z.infer<typeof localeSchema>;
export const timezoneSchema = z.string().min(1).max(64).refine((value) => {
  try { new Intl.DateTimeFormat('en', { timeZone: value }).format(0); return true; }
  catch { return false; }
}, 'invalid_timezone');
export const preferencesSchema = z.object({ locale: localeSchema, timezone: timezoneSchema }).strict();
export type Preferences = z.infer<typeof preferencesSchema>;
export const profileSchema = z.object({ name: z.string().trim().min(1).max(120) }).strict();
export type Profile = z.infer<typeof profileSchema>;
export const meSchema = z.object({
  id: z.string(), email: z.string().email(), name: z.string(), emailVerified: z.boolean(),
  twoFactorEnabled: z.boolean(), locale: localeSchema, timezone: timezoneSchema, createdAt: z.string(),
});
export type Me = z.infer<typeof meSchema>;
export const sessionSummarySchema = z.object({
  id: z.string(), current: z.boolean(), createdAt: z.string(), expiresAt: z.string(), client: z.string(),
});
export type SessionSummary = z.infer<typeof sessionSummarySchema>;
export const sessionListSchema = z.object({ sessions: z.array(sessionSummarySchema) });
export type SessionList = z.infer<typeof sessionListSchema>;
export const apiErrorSchema = z.object({ error: z.object({ code: z.string(), message: z.string() }) });
export type ApiError = z.infer<typeof apiErrorSchema>;
export const statusSchema = z.object({
  api: z.enum(['up', 'down']), configured: z.boolean(), version: z.string().optional(),
  features: z.object({ emailVerification: z.boolean(), twoFactor: z.boolean() }).optional(),
});
export type Status = z.infer<typeof statusSchema>;
export const accountExportSchema = z.object({
  schemaVersion: z.literal(1), generatedAt: z.string(), account: meSchema,
});
export type AccountExport = z.infer<typeof accountExportSchema>;
