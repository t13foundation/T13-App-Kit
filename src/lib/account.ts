import type { Me, Preferences, SessionList, Status } from "@shared/contracts";

import { api } from "./api";

export const getStatus = () => api<Status>("/status");
export const getMe = () => api<Me>("/me");
export const getSessions = () => api<SessionList>("/me/sessions");

export const updatePreferences = (preferences: Preferences) =>
  api<Me>("/me/preferences", { method: "POST", body: preferences });

export const revokeOtherSessions = () =>
  api<{ revoked: number }>("/me/sessions/revoke-others", { method: "POST" });

export const signUp = (body: { name: string; email: string; password: string }) =>
  api<unknown>("/auth/sign-up/email", { method: "POST", body });

export const signIn = (body: { email: string; password: string }) =>
  api<{ twoFactorRedirect?: boolean }>("/auth/sign-in/email", { method: "POST", body });

export const signOut = () => api<unknown>("/auth/sign-out", { method: "POST" });

export const sendVerificationEmail = (email: string) =>
  api<unknown>("/auth/send-verification-email", { method: "POST", body: { email } });

export const requestPasswordReset = (email: string) =>
  api<unknown>("/auth/request-password-reset", { method: "POST", body: { email } });

export const resetPassword = (body: { token: string; newPassword: string }) =>
  api<unknown>("/auth/reset-password", { method: "POST", body });

export const changePassword = (body: { currentPassword: string; newPassword: string }) =>
  api<unknown>("/auth/change-password", { method: "POST", body });

export const enableTotp = (password: string) =>
  api<{ totpURI: string; backupCodes: string[] }>("/auth/two-factor/enable", {
    method: "POST",
    body: { password },
  });

export const verifyTotp = (code: string) =>
  api<unknown>("/auth/two-factor/verify-totp", { method: "POST", body: { code } });

export const disableTotp = (password: string) =>
  api<unknown>("/auth/two-factor/disable", { method: "POST", body: { password } });

export const verifyBackupCode = (code: string) =>
  api<unknown>("/auth/two-factor/verify-backup-code", { method: "POST", body: { code } });
