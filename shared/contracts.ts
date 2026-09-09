/**
 * Shared HTTP contracts between the web client and the API.
 *
 * This module is imported by both the browser bundle and the server, so it
 * must stay free of secrets, environment access and Node-only imports.
 */
import { z } from "zod";

export const localeSchema = z.enum(["pl", "en"]);
export type Locale = z.infer<typeof localeSchema>;

/** IANA timezone identifier, validated structurally (no tz database import). */
export const timezoneSchema = z
  .string()
  .min(1)
  .max(64)
  .regex(/^[A-Za-z][A-Za-z0-9+_-]*(\/[A-Za-z0-9+_-]+)*$/, "invalid_timezone");

export const preferencesSchema = z.object({
  locale: localeSchema,
  timezone: timezoneSchema,
});
export type Preferences = z.infer<typeof preferencesSchema>;

export const meSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
  emailVerified: z.boolean(),
  twoFactorEnabled: z.boolean(),
  locale: localeSchema,
  timezone: timezoneSchema,
  createdAt: z.string(),
});
export type Me = z.infer<typeof meSchema>;

/**
 * Session list entry. Deliberately free of anything private: no tokens, no
 * raw user agent secrets, no other users' data.
 */
export const sessionSummarySchema = z.object({
  id: z.string(),
  current: z.boolean(),
  createdAt: z.string(),
  expiresAt: z.string(),
  /** Coarse client label derived server-side, e.g. "Chrome / macOS". */
  client: z.string(),
});
export type SessionSummary = z.infer<typeof sessionSummarySchema>;

export const sessionListSchema = z.object({ sessions: z.array(sessionSummarySchema) });

export const apiErrorSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
  }),
});
export type ApiError = z.infer<typeof apiErrorSchema>;

/** Safe, non-secret backend metadata used by the preview status screen. */
export const statusSchema = z.object({
  api: z.enum(["up", "down"]),
  /** True when the frontend has an API_INTERNAL_URL configured at all. */
  configured: z.boolean(),
  version: z.string().optional(),
  features: z
    .object({
      emailVerification: z.boolean(),
      twoFactor: z.boolean(),
    })
    .optional(),
});
export type Status = z.infer<typeof statusSchema>;
