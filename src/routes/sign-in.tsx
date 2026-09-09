import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";

import { Alert, AuthCard, Button, Input } from "@/components/kit";
import { authClient, authErrorMessage } from "@/lib/auth-client";

export const Route = createFileRoute("/sign-in")({
  head: () => ({
    meta: [
      { title: "Logowanie" },
      { name: "description", content: "Zaloguj się do swojego konta." },
      { property: "og:title", content: "Logowanie" },
      { property: "og:description", content: "Zaloguj się do swojego konta." },
    ],
  }),
  component: SignInPage,
});

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
        method="post"
        className="flex flex-col gap-5"
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          setError(null);
          setPending(true);
          void authClient
            .signIn
            .email({
              email: String(data.get("email") ?? ""),
              password: String(data.get("password") ?? ""),
              // Never remember the device: the second factor is always required.
              rememberMe: true,
            })
            .then((result) => {
              if (result.error) {
                setError(authErrorMessage(result.error));
                return;
              }
              const twoFactor = (result.data as { twoFactorRedirect?: boolean } | null)
                ?.twoFactorRedirect;
              void navigate({ to: twoFactor ? "/two-factor" : "/account" });
            })
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
