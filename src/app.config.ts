/**
 * Application-level configuration for the white-label shell.
 *
 * "T13 App Kit" is the name of the starter kit and appears only in developer
 * documentation. The product name shown in the UI is configured here.
 */
export const appConfig = {
  name: "App",
  description: "Konto użytkownika, bezpieczeństwo i ustawienia.",
  locales: ["pl", "en"] as const,
  defaultLocale: "pl" as const,
} as const;

export type AppLocale = (typeof appConfig.locales)[number];
