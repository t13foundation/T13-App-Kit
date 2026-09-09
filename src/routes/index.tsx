import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";

import { Alert, Button, PageSection } from "@/components/kit";
import { appConfig } from "@/app.config";
import { getStatus } from "@/lib/account";
import { ApiRequestError } from "@/lib/api";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Aplikacja — konto i ustawienia" },
      { name: "description", content: "Konto użytkownika, bezpieczeństwo i ustawienia." },
      { property: "og:title", content: "Aplikacja — konto i ustawienia" },
      { property: "og:description", content: "Konto użytkownika, bezpieczeństwo i ustawienia." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

function Index() {
  const status = useQuery({ queryKey: ["status"], queryFn: getStatus, retry: false });

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight text-gray-900">{appConfig.name}</h1>
      <p className="mt-1 text-sm text-gray-600">{appConfig.description}</p>

      <PageSection title="Stan usługi" description="Rzeczywisty stan połączenia z API.">
        {status.isLoading ? <p className="text-sm text-gray-600">Sprawdzanie…</p> : null}
        {status.isSuccess ? (
          <Alert tone="success" title="API odpowiada">
            Weryfikacja e-maila: {status.data.features?.emailVerification ? "włączona" : "wyłączona"}.
            Weryfikacja dwuetapowa: {status.data.features?.twoFactor ? "włączona" : "wyłączona"}.
          </Alert>
        ) : null}
        {status.isError ? (
          <Alert tone="error" title="Brak backendu">
            {status.error instanceof ApiRequestError && status.error.code === "api_not_configured"
              ? "Zmienna API_INTERNAL_URL nie jest ustawiona, więc żadne funkcje konta nie działają. To rzeczywisty stan, nie symulacja."
              : "API nie odpowiada. Uruchom lokalnie bazę, pocztę i serwer zgodnie z docs/start.md."}
          </Alert>
        ) : null}
      </PageSection>

      <PageSection
        title="Konto"
        description="Rejestracja, potwierdzenie adresu, logowanie, hasło, weryfikacja dwuetapowa i sesje."
      >
        <div className="flex flex-wrap gap-3">
          <Link to="/sign-in">
            <Button>Zaloguj się</Button>
          </Link>
          <Link to="/sign-up">
            <Button color="secondary">Utwórz konto</Button>
          </Link>
          <Link to="/account">
            <Button color="tertiary">Ustawienia konta</Button>
          </Link>
        </div>
      </PageSection>

      <PageSection
        title="Komponenty"
        description="Neutralny podgląd komponentów interfejsu; działa również bez backendu."
      >
        <div>
          <Link to="/catalog">
            <Button color="secondary">Otwórz katalog</Button>
          </Link>
        </div>
      </PageSection>
    </div>
  );
}
