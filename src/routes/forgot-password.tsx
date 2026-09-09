import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";

import { Alert, AuthCard, Button, Input } from "@/components/kit";
import { requestPasswordReset } from "@/lib/account";

export const Route = createFileRoute("/forgot-password")({ component: ForgotPasswordPage });

function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
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
          className="flex flex-col gap-5"
          onSubmit={(event) => {
            event.preventDefault();
            const email = String(new FormData(event.currentTarget).get("email") ?? "");
            setPending(true);
            // Always report the same outcome so accounts cannot be enumerated.
            requestPasswordReset(email)
              .catch(() => undefined)
              .finally(() => {
                setPending(false);
                setSent(true);
              });
          }}
        >
          <Input isRequired name="email" type="email" label="E-mail" autoComplete="email" />
          <Button type="submit" isDisabled={pending} size="lg">
            {pending ? "Wysyłanie…" : "Wyślij link"}
          </Button>
        </form>
      )}
    </AuthCard>
  );
}
