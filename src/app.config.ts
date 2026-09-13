/**
 * Application-level configuration for the white-label shell.
 *
 * `appConfig` is what an integrator changes: it drives the product name and
 * description shown in the interface. `kitInfo` describes the starter itself and
 * appears only on the developer-facing overview page, never in a delivered product.
 */
export const appConfig = {
  name: "App",
  description: "Konto użytkownika i prywatne notatki.",
  locales: ["pl", "en"] as const,
  defaultLocale: "pl" as const,
} as const;

export type AppLocale = (typeof appConfig.locales)[number];

export const kitInfo = {
  name: "T13 App Kit",
  title: "Startowy zestaw aplikacji z kontem użytkownika",
  summary:
    "App Kit to zestaw startowy zespołu T13.AI do tworzenia aplikacji. Łączy gotowe komponenty, układy stron i podstawy kont użytkowników, abyś mógł skupić się na funkcjach swojego produktu. Powstał z myślą o pracy z agentami AI: mniej budowania od nowa, mniej czasu i tokenów.",
  stack: ["MIT", "TanStack Start", "Untitled UI", "Supabase", "PostgreSQL"],
} as const;
