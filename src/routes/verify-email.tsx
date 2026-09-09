import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";

import { Alert, AuthCard, Button, Input } from "@/components/kit";
import { sendVerificationEmail } from "@/lib/account";

export const Route = createFileRoute("/verify-email")({ component: VerifyEmailPage });

function VerifyEmailPage() {
  const [sent, setSent] = useState(false);
  const [pending, setPending] = useState(false);

  return (
    <AuthCard
      title="Potwierdź adres e-mail"
      description="Dostęp do danych konta jest możliwy dopiero po potwierdzeniu adresu."
      footer={
        <Link to="/sign-in" className="font-medium text-gray-900 underline">
          Wróć do logowania
        </Link>
      }
    >
      {sent ? <Alert title="Wysłano">Jeśli konto wymaga potwierdzenia, wiadomość jest w drodze.</Alert> : null}
      <form
        className="flex flex-col gap-5"
        onSubmit={(event) => {
          event.preventDefault();
          const email = String(new FormData(event.currentTarget).get("email") ?? "");
          setPending(true);
          sendVerificationEmail(email)
            .catch(() => undefined)
            .finally(() => {
              setPending(false);
              setSent(true);
            });
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
