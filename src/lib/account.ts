import type { AccountExport, Me, Preferences, Profile, SessionList, Status } from '@shared/contracts';
import { api } from './api';

const callback = (path: string) => new URL(path, window.location.origin).toString();
export const getStatus = () => api<Status>('/status');
export const getMe = () => api<Me>('/me');
export const getSessions = () => api<SessionList>('/me/sessions');
export const updatePreferences = (body: Preferences) => api<Preferences>('/me/preferences', { method: 'PUT', body });
export const updateProfile = (body: Profile) => api<Profile>('/me/profile', { method: 'PUT', body });
export const exportAccount = () => api<AccountExport>('/me/export', { method: 'POST' });
export const revokeOtherSessions = () => api<{ ok: true }>('/me/sessions/revoke-others', { method: 'POST' });
export const revokeSession = (id: string) => api<{ ok: true }>(`/me/sessions/${encodeURIComponent(id)}`, { method: 'DELETE' });
export const signUp = (body: { name: string; email: string; password: string }) =>
  api<unknown>('/auth/sign-up/email', { method: 'POST', body: { ...body, callbackURL: callback('/sign-in') } });
export const signIn = (body: { email: string; password: string }) =>
  api<{ twoFactorRedirect?: boolean }>('/auth/sign-in/email', { method: 'POST', body });
export const signOut = () => api<unknown>('/auth/sign-out', { method: 'POST' });
export const sendVerificationEmail = (email: string) => api<unknown>('/auth/send-verification-email', {
  method: 'POST', body: { email, callbackURL: callback('/sign-in') },
});
export const requestPasswordReset = (email: string) => api<unknown>('/auth/request-password-reset', {
  method: 'POST', body: { email, redirectTo: callback('/reset-password') },
});
export const resetPassword = (body: { token: string; newPassword: string }) =>
  api<unknown>('/auth/reset-password', { method: 'POST', body });
export const changePassword = (body: { currentPassword: string; newPassword: string }) =>
  api<unknown>('/auth/change-password', { method: 'POST', body: { ...body, revokeOtherSessions: true } });
export const enableTotp = (password: string) => api<{ totpURI: string; backupCodes: string[] }>('/auth/two-factor/enable', { method: 'POST', body: { password } });
export const verifyTotp = (code: string) => api<unknown>('/auth/two-factor/verify-totp', { method: 'POST', body: { code, trustDevice: false } });
export const disableTotp = (password: string) => api<unknown>('/auth/two-factor/disable', { method: 'POST', body: { password } });
export const verifyBackupCode = (code: string) => api<unknown>('/auth/two-factor/verify-backup-code', { method: 'POST', body: { code, trustDevice: false } });
