import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";

import { Alert, AuthCard, Button, Input } from "@/components/kit";
import { authClient, authErrorMessage } from "@/lib/auth-client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Ustawienie nowego hasła" },
      { name: "description", content: "Ustaw nowe hasło do swojego konta." },
      { property: "og:title", content: "Ustawienie nowego hasła" },
      { property: "og:description", content: "Ustaw nowe hasło do swojego konta." },
    ],
  }),
  component: ResetPasswordPage,
  validateSearch: (search: Record<string, unknown>) => ({
    token: typeof search["token"] === "string" ? search["token"] : "",
  }),
});

function ResetPasswordPage() {
  const { token } = Route.useSearch();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  return (
    <AuthCard
      title="Ustaw nowe hasło"
      description="Po zmianie hasła wszystkie aktywne sesje zostaną wylogowane."
      footer={
        <Link to="/sign-in" className="font-medium text-primary underline">
          Wróć do logowania
        </Link>
      }
    >
      {token ? (
        <form
          method="post"
          className="flex flex-col gap-5"
          onSubmit={(event) => {
            event.preventDefault();
            const newPassword = String(new FormData(event.currentTarget).get("password") ?? "");
            setError(null);
            setPending(true);
            void authClient
              .resetPassword({ token, newPassword })
              .then((result) => {
                if (result.error) {
                  setError(authErrorMessage(result.error));
                  return;
                }
                void navigate({ to: "/sign-in" });
              })
              .catch(() => setError("Usługa jest niedostępna. Spróbuj ponownie później."))
              .finally(() => setPending(false));
          }}
        >
          {error ? <Alert tone="error">{error}</Alert> : null}
          <Input
            isRequired
            name="password"
            type="password"
            label="Nowe hasło"
            hint="Minimum 12 znaków."
            autoComplete="new-password"
          />
          <Button type="submit" isDisabled={pending} size="lg">
            {pending ? "Zapisywanie…" : "Zapisz hasło"}
          </Button>
        </form>
      ) : (
        <Alert tone="error" title="Brak tokenu">
          Otwórz link z wiadomości e-mail, aby ustawić nowe hasło.
        </Alert>
      )}
    </AuthCard>
  );
}
