import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Alert, AuthCard, Button, Input } from "@/components/kit";
import { signUp } from "@/lib/account";
import { ApiRequestError } from "@/lib/api";
export const Route = createFileRoute("/sign-up")({
  head: () => ({ meta: [{ title: "Rejestracja konta" }, { name: "robots", content: "noindex, nofollow" }] }), component: SignUpPage,
});
function SignUpPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null); const [pending, setPending] = useState(false);
  return <AuthCard title="Utwórz konto" description="Wyślemy wiadomość z linkiem potwierdzającym adres e-mail."
    footer={<>Masz już konto? <Link to="/sign-in" className="font-medium underline">Zaloguj się</Link></>}>
    <form method="post" className="flex flex-col gap-5" onSubmit={(event) => {
      event.preventDefault(); if (pending) return;
      const data = new FormData(event.currentTarget); setError(null); setPending(true);
      void signUp({ name: String(data.get("name") ?? "").trim(), email: String(data.get("email") ?? ""), password: String(data.get("password") ?? "") })
        .then(() => navigate({ to: "/verify-email" }))
        .catch((cause: unknown) => setError(cause instanceof ApiRequestError ? cause.message : "Nie udało się utworzyć konta."))
        .finally(() => setPending(false));
    }}>
      {error && <Alert tone="error">{error}</Alert>}
      <Input isRequired name="name" label="Imię i nazwisko" maxLength={120} autoComplete="name" />
      <Input isRequired name="email" type="email" label="E-mail" autoComplete="email" />
      <Input isRequired name="password" type="password" label="Hasło" minLength={12} hint="Minimum 12 znaków." autoComplete="new-password" />
      <Button type="submit" isLoading={pending} size="lg">Utwórz konto</Button>
    </form>
  </AuthCard>;
}
