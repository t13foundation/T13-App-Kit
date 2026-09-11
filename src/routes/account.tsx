import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { AccountSettings, Alert, Button, Container } from "@/components/kit";
import { getMe } from "@/lib/account";
import { ApiRequestError } from "@/lib/api";

export const Route = createFileRoute("/account")({
  head: () => ({
    meta: [{ title: "Ustawienia konta" }, { name: "robots", content: "noindex, nofollow" }],
  }),
  component: AccountPage,
});

function AccountPage() {
  const me = useQuery({ queryKey: ["me"], queryFn: getMe, retry: false, gcTime: 0 });

  if (me.isPending) {
    return (
      <Container className="py-12">
        <p role="status" className="text-sm text-tertiary">
          Wczytywanie konta…
        </p>
      </Container>
    );
  }

  if (me.isError) {
    const error = me.error;
    const code = error instanceof ApiRequestError ? error.code : "request_failed";
    return (
      <Container className="flex flex-col items-start gap-5 py-12">
        <Alert tone="error" title="Nie można wczytać konta">
          {error instanceof ApiRequestError
            ? error.message
            : "Nie udało się pobrać danych. Spróbuj ponownie."}
        </Alert>
        {code === "unauthenticated" ? (
          <Button href="/sign-in">Zaloguj się</Button>
        ) : code === "email_not_verified" ? (
          <Button href="/verify-email">Potwierdź adres e-mail</Button>
        ) : (
          <Button color="secondary" onClick={() => void me.refetch()}>
            Spróbuj ponownie
          </Button>
        )}
      </Container>
    );
  }

  return (
    <AccountSettings
      key={me.data.id}
      me={me.data}
      refresh={async () => {
        const result = await me.refetch();
        if (result.error) throw result.error;
      }}
    />
  );
}
