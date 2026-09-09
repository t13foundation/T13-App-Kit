import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";

import { Alert, AuthCard, Button, Input } from "@/components/kit";
import { verifyBackupCode, verifyTotp } from "@/lib/account";
import { ApiRequestError } from "@/lib/api";

export const Route = createFileRoute("/two-factor")({ component: TwoFactorPage });

function TwoFactorPage() {
  const navigate = useNavigate();
  const [useBackup, setUseBackup] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  return (
    <AuthCard
      title="Drugi składnik logowania"
      description={
        useBackup
          ? "Wpisz jeden z zapisanych kodów odzyskiwania."
          : "Wpisz sześciocyfrowy kod z aplikacji uwierzytelniającej."
      }
    >
      <form
        className="flex flex-col gap-5"
        onSubmit={(event) => {
          event.preventDefault();
          const code = String(new FormData(event.currentTarget).get("code") ?? "");
          setError(null);
          setPending(true);
          (useBackup ? verifyBackupCode(code) : verifyTotp(code))
            .then(() => navigate({ to: "/account" }))
            .catch((cause: unknown) =>
              setError(cause instanceof ApiRequestError ? cause.message : "Nieprawidłowy kod."),
            )
            .finally(() => setPending(false));
        }}
      >
        {error ? <Alert tone="error">{error}</Alert> : null}
        <Input
          isRequired
          name="code"
          label={useBackup ? "Kod odzyskiwania" : "Kod z aplikacji"}
          autoComplete="one-time-code"
          inputMode={useBackup ? "text" : "numeric"}
        />
        <Button type="submit" isDisabled={pending} size="lg">
          {pending ? "Sprawdzanie…" : "Potwierdź"}
        </Button>
        <Button color="link-gray" onClick={() => setUseBackup((value) => !value)}>
          {useBackup ? "Użyj kodu z aplikacji" : "Użyj kodu odzyskiwania"}
        </Button>
      </form>
    </AuthCard>
  );
}
