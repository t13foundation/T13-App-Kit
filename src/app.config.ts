/**
 * Application-level configuration for the white-label shell.
 *
 * `appConfig` is what an integrator changes: it drives the product name and
 * description shown in the interface. `kitInfo` describes the starter itself and
 * appears only on the developer-facing overview page, never in a delivered product.
 */
export const appConfig = {
  name: "App",
  description: "Konto użytkownika, bezpieczeństwo i ustawienia.",
  locales: ["pl", "en"] as const,
  defaultLocale: "pl" as const,
} as const;

export type AppLocale = (typeof appConfig.locales)[number];

export const kitInfo = {
  name: "T13 App Kit",
  title: "Startowy zestaw aplikacji z kontem użytkownika",
  summary:
    "Biała aplikacja TanStack Start z gotowym uwierzytelnianiem, ekranem konta i jedną warstwą komponentów. Przeznaczona do rozwinięcia w produkt, nie do wdrożenia w obecnej postaci.",
  stack: ["MIT", "TanStack Start", "Untitled UI", "Better Auth", "PostgreSQL"],
} as const;
