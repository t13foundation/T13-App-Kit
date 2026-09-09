import type { Me, Preferences, SessionList, Status } from "@shared/contracts";

import { api } from "./api";

/**
 * Our own account endpoints. Authentication itself uses the official Better
 * Auth client in `auth-client.ts` instead of a hand-rolled protocol.
 */
export const getStatus = () => api<Status>("/status");
export const getMe = () => api<Me>("/me");
export const getSessions = () => api<SessionList>("/me/sessions");

export const updatePreferences = (preferences: Preferences) =>
  api<Preferences>("/me/preferences", { method: "PUT", body: preferences });

export const revokeOtherSessions = () =>
  api<{ ok: true }>("/me/sessions/revoke-others", { method: "POST" });
