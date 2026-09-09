import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";

import { Alert, AuthCard, Button, Input } from "@/components/kit";
import { signIn } from "@/lib/account";
import { ApiRequestError } from "@/lib/api";

export const Route = createFileRoute("/sign-in")({ component: SignInPage });

function SignInPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  return (
    <AuthCard
      title="Zaloguj się"
      description="Podaj adres e-mail i hasło do swojego konta."
      footer={
        <div className="flex flex-col gap-2">
          <Link to="/forgot-password" className="font-medium text-gray-900 underline">
            Nie pamiętam hasła
          </Link>
          <span>
            Nie masz konta?{" "}
            <Link to="/sign-up" className="font-medium text-gray-900 underline">
              Zarejestruj się
            </Link>
          </span>
        </div>
      }
    >
      <form
        className="flex flex-col gap-5"
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          setError(null);
          setPending(true);
          signIn({
            email: String(data.get("email") ?? ""),
            password: String(data.get("password") ?? ""),
          })
            .then((result) =>
              navigate({ to: result?.twoFactorRedirect ? "/two-factor" : "/account" }),
            )
            .catch((cause: unknown) =>
              setError(
                cause instanceof ApiRequestError ? cause.message : "Logowanie nie powiodło się.",
              ),
            )
            .finally(() => setPending(false));
        }}
      >
        {error ? <Alert tone="error">{error}</Alert> : null}
        <Input isRequired name="email" type="email" label="E-mail" autoComplete="email" />
        <Input
          isRequired
          name="password"
          type="password"
          label="Hasło"
          autoComplete="current-password"
        />
        <Button type="submit" isDisabled={pending} size="lg">
          {pending ? "Logowanie…" : "Zaloguj się"}
        </Button>
      </form>
    </AuthCard>
  );
}
