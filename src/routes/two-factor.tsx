import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";

import { Alert, AuthCard, Button, Input } from "@/components/kit";
import { authClient, authErrorMessage } from "@/lib/auth-client";

export const Route = createFileRoute("/two-factor")({
  head: () => ({
    meta: [
      { title: "Drugi składnik logowania" },
      { name: "description", content: "Potwierdź logowanie kodem jednorazowym." },
      { property: "og:title", content: "Drugi składnik logowania" },
      { property: "og:description", content: "Potwierdź logowanie kodem jednorazowym." },
    ],
  }),
  component: TwoFactorPage,
});

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
          // trustDevice is never requested; the server rejects it as well.
          const request = useBackup
            ? authClient.twoFactor.verifyBackupCode({ code })
            : authClient.twoFactor.verifyTotp({ code });
          void request
            .then((result) => {
              if (result.error) {
                setError(authErrorMessage(result.error));
                return;
              }
              void navigate({ to: "/account" });
            })
            .catch(() => setError("Usługa jest niedostępna. Spróbuj ponownie później."))
            .finally(() => setPending(false));
        }}
      >
        {error ? <Alert tone="error">{error}</Alert> : null}
        <Input
          isRequired
          name="code"
          label={useBackup ? "Kod odzyskiwania" : "Kod z aplikacji"}
          autoComplete="one-time-code"
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
