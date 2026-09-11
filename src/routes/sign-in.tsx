import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Alert, AuthCard, Button, Input } from "@/components/kit";
import { signIn } from "@/lib/account";
import { ApiRequestError } from "@/lib/api";
export const Route = createFileRoute("/sign-in")({
  head: () => ({
    meta: [{ title: "Logowanie" }, { name: "robots", content: "noindex, nofollow" }],
  }),
  component: SignInPage,
});
function SignInPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [unverified, setUnverified] = useState(false);
  return (
    <AuthCard
      title="Zaloguj się"
      description="Podaj adres e-mail i hasło do swojego konta."
      footer={
        <div className="flex flex-col gap-3">
          <Link to="/forgot-password" className="font-medium underline">
            Nie pamiętam hasła
          </Link>
          <span>
            Nie masz konta?{" "}
            <Link to="/sign-up" className="font-medium underline">
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
          if (pending) return;
          const data = new FormData(event.currentTarget);
          setError(null);
          setUnverified(false);
          setPending(true);
          void signIn({
            email: String(data.get("email") ?? ""),
            password: String(data.get("password") ?? ""),
          })
            .then(async (result) => {
              await queryClient.cancelQueries();
              queryClient.clear();
              const mfa = (result as { twoFactorRedirect?: boolean }).twoFactorRedirect;
              await navigate({ to: mfa ? "/two-factor" : "/account" });
            })
            .catch((cause: unknown) => {
              setError(
                cause instanceof ApiRequestError ? cause.message : "Logowanie nie powiodło się.",
              );
              setUnverified(
                cause instanceof ApiRequestError &&
                  ["email_not_verified", "EMAIL_NOT_VERIFIED"].includes(cause.code),
              );
            })
            .finally(() => setPending(false));
        }}
      >
        {error && (
          <Alert tone="error">
            {error}
            {unverified && (
              <p className="mt-2">
                <Link to="/verify-email" className="font-medium underline">
                  Wyślij link potwierdzający
                </Link>
              </p>
            )}
          </Alert>
        )}
        <Input isRequired name="email" type="email" label="E-mail" autoComplete="email" />
        <Input
          isRequired
          name="password"
          type="password"
          label="Hasło"
          autoComplete="current-password"
        />
        <Button type="submit" isLoading={pending} size="lg">
          Zaloguj się
        </Button>
      </form>
    </AuthCard>
  );
}
