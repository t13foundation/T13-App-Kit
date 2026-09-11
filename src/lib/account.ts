import { z } from "zod";
import {
  accountExportSchema,
  meSchema,
  preferencesSchema,
  profileSchema,
  sessionListSchema,
  statusSchema,
  type Preferences,
  type Profile,
} from "@shared/contracts";
import { api, ApiRequestError } from "./api";
import { authClient, webUrl } from "./auth-client";

type AuthError = { code?: string; status?: number; error?: { code?: string } };
async function unwrap<T>(
  request: Promise<{ data?: T | null; error?: AuthError | null }>,
): Promise<T> {
  let result: { data?: T | null; error?: AuthError | null };
  try {
    result = await request;
  } catch {
    throw new ApiRequestError(0, "network_unavailable");
  }
  if (result.error)
    throw new ApiRequestError(
      result.error.status ?? 400,
      result.error.code ?? result.error.error?.code ?? "request_failed",
    );
  if (result.data == null) throw new ApiRequestError(502, "invalid_response");
  return result.data;
}
export const getStatus = () => api<unknown>("/status").then((data) => statusSchema.parse(data));
export const getMe = () => api<unknown>("/me").then((data) => meSchema.parse(data));
export const getSessions = () =>
  api<unknown>("/me/sessions").then((data) => sessionListSchema.parse(data));
export const updateProfile = (profile: Profile) =>
  api<unknown>("/me/profile", { method: "PUT", body: profile }).then((data) =>
    profileSchema.parse(data),
  );
export const updatePreferences = (preferences: Preferences) =>
  api<unknown>("/me/preferences", { method: "PUT", body: preferences }).then((data) =>
    preferencesSchema.parse(data),
  );
export const revokeOtherSessions = () =>
  api<{ ok: true }>("/me/sessions/revoke-others", { method: "POST" });
export const revokeSession = (id: string) =>
  api<{ ok: true }>(`/me/sessions/${encodeURIComponent(id)}`, { method: "DELETE" });
export const exportAccount = () =>
  api<unknown>("/me/export", { method: "POST" }).then((data) => accountExportSchema.parse(data));
export const signOut = () => unwrap(authClient.signOut());
export const signIn = (body: { email: string; password: string }) =>
  unwrap(authClient.signIn.email(body));
export const signUp = (body: { name: string; email: string; password: string }) =>
  unwrap(authClient.signUp.email({ ...body, callbackURL: webUrl("/sign-in") }));
export const changePassword = (body: { currentPassword: string; newPassword: string }) =>
  unwrap(authClient.changePassword({ ...body, revokeOtherSessions: true }));
const enrollmentSchema = z.object({
  totpURI: z.string().startsWith("otpauth://"),
  backupCodes: z.array(z.string()).min(1),
});
export const enableTotp = (password: string) =>
  unwrap(authClient.twoFactor.enable({ password })).then((data) => enrollmentSchema.parse(data));
export const disableTotp = (password: string) => unwrap(authClient.twoFactor.disable({ password }));
export const verifyTotp = (code: string) =>
  unwrap(authClient.twoFactor.verifyTotp({ code, trustDevice: false }));
export const verifyBackupCode = (code: string) =>
  unwrap(authClient.twoFactor.verifyBackupCode({ code, trustDevice: false }));
