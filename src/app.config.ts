/**
 * Application-level configuration for the delivered product.
 *
 * "T13 App Kit" is the name of the starter kit itself and appears only in
 * developer documentation. Anything a user of the built application can see
 * comes from here, and defaults to a neutral placeholder.
 */
export const appConfig = {
  /** Product name shown in the app shell, titles and emails. */
  name: "Aplikacja",
  /** Short neutral description used for document metadata. */
  description: "Konto użytkownika, bezpieczeństwo i ustawienia.",
  /** Supported UI languages. */
  locales: ["pl", "en"] as const,
  defaultLocale: "pl" as const,
} as const;

export type AppLocale = (typeof appConfig.locales)[number];
