import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";

import { Alert, AuthCard, Button, Input } from "@/components/kit";
import { authClient, authErrorMessage, webUrl } from "@/lib/auth-client";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Odzyskiwanie hasła" },
      { name: "description", content: "Wyślij link do ustawienia nowego hasła." },
      { property: "og:title", content: "Odzyskiwanie hasła" },
      { property: "og:description", content: "Wyślij link do ustawienia nowego hasła." },
    ],
  }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  return (
    <AuthCard
      title="Odzyskiwanie hasła"
      description="Wyślemy link do ustawienia nowego hasła, jeśli konto istnieje."
      footer={
        <Link to="/sign-in" className="font-medium text-gray-900 underline">
          Wróć do logowania
        </Link>
      }
    >
      {sent ? (
        <Alert title="Sprawdź skrzynkę pocztową">
          Jeśli podany adres jest powiązany z kontem, wiadomość z linkiem została wysłana.
        </Alert>
      ) : (
        <form
          method="post"
          className="flex flex-col gap-5"
          onSubmit={(event) => {
            event.preventDefault();
            const email = String(new FormData(event.currentTarget).get("email") ?? "");
            setError(null);
            setPending(true);
            void authClient
              .requestPasswordReset({ email, redirectTo: webUrl("/reset-password") })
              .then((result) => {
                // Only a real, successful response counts as "sent". A missing
                // backend, 429 or 503 must stay visible as an error.
                if (result.error) {
                  setError(authErrorMessage(result.error));
                  return;
                }
                setSent(true);
              })
              .catch(() => setError("Usługa jest niedostępna. Spróbuj ponownie później."))
              .finally(() => setPending(false));
          }}
        >
          {error ? <Alert tone="error">{error}</Alert> : null}
          <Input isRequired name="email" type="email" label="E-mail" autoComplete="email" />
          <Button type="submit" isDisabled={pending} size="lg">
            {pending ? "Wysyłanie…" : "Wyślij link"}
          </Button>
        </form>
      )}
    </AuthCard>
  );
}
