import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";

import { Alert, AuthCard, Button, Input } from "@/components/kit";
import { signUp } from "@/lib/account";
import { ApiRequestError } from "@/lib/api";

export const Route = createFileRoute("/sign-up")({ component: SignUpPage });

function SignUpPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  return (
    <AuthCard
      title="Utwórz konto"
      description="Po rejestracji wyślemy wiadomość z linkiem potwierdzającym adres e-mail."
      footer={
        <>
          Masz już konto?{" "}
          <Link to="/sign-in" className="font-medium text-gray-900 underline">
            Zaloguj się
          </Link>
        </>
      }
    >
      <form
        className="flex flex-col gap-5"
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          setError(null);
          setPending(true);
          signUp({
            name: String(data.get("name") ?? ""),
            email: String(data.get("email") ?? ""),
            password: String(data.get("password") ?? ""),
          })
            .then(() => navigate({ to: "/verify-email" }))
            .catch((cause: unknown) =>
              setError(cause instanceof ApiRequestError ? cause.message : "Nie udało się utworzyć konta."),
            )
            .finally(() => setPending(false));
        }}
      >
        {error ? <Alert tone="error">{error}</Alert> : null}
        <Input isRequired name="name" label="Imię i nazwisko" autoComplete="name" />
        <Input isRequired name="email" type="email" label="E-mail" autoComplete="email" />
        <Input
          isRequired
          name="password"
          type="password"
          label="Hasło"
          hint="Minimum 12 znaków."
          autoComplete="new-password"
        />
        <Button type="submit" isDisabled={pending} size="lg">
          {pending ? "Tworzenie konta…" : "Utwórz konto"}
        </Button>
      </form>
    </AuthCard>
  );
}
