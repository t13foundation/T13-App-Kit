import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";

import { Alert, AuthCard, Button, Input } from "@/components/kit";
import { authClient, authErrorMessage, webUrl } from "@/lib/auth-client";

export const Route = createFileRoute("/verify-email")({
  head: () => ({
    meta: [
      { title: "Potwierdzenie adresu e-mail" },
      { name: "description", content: "Potwierdź adres e-mail, aby korzystać z konta." },
      { property: "og:title", content: "Potwierdzenie adresu e-mail" },
      { property: "og:description", content: "Potwierdź adres e-mail, aby korzystać z konta." },
    ],
  }),
  component: VerifyEmailPage,
});

function VerifyEmailPage() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  return (
    <AuthCard
      title="Potwierdź adres e-mail"
      description="Dostęp do danych konta jest możliwy dopiero po potwierdzeniu adresu."
      footer={
        <Link to="/sign-in" className="font-medium text-primary underline">
          Wróć do logowania
        </Link>
      }
    >
      {sent ? (
        <Alert title="Wysłano">Wiadomość z linkiem potwierdzającym została wysłana.</Alert>
      ) : null}
      {error ? <Alert tone="error">{error}</Alert> : null}
      <form
        method="post"
        className="flex flex-col gap-5"
        onSubmit={(event) => {
          event.preventDefault();
          const email = String(new FormData(event.currentTarget).get("email") ?? "");
          setError(null);
          setSent(false);
          setPending(true);
          void authClient
            .sendVerificationEmail({ email, callbackURL: webUrl("/sign-in") })
            .then((result) => {
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
        <Input isRequired name="email" type="email" label="E-mail" autoComplete="email" />
        <Button type="submit" isDisabled={pending} size="lg">
          {pending ? "Wysyłanie…" : "Wyślij link ponownie"}
        </Button>
      </form>
    </AuthCard>
  );
}
