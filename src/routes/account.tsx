import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Alert, Button } from "@/components/kit";
import { AccountSettings } from "@/components/kit/blocks/account-settings";
import { getMe } from "@/lib/account";
import { ApiRequestError } from "@/lib/api";
export const Route = createFileRoute("/account")({
  head: () => ({ meta: [{ title: "Ustawienia konta" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: AccountPage,
});
function AccountPage() {
  const me = useQuery({ queryKey: ["me"], queryFn: getMe, retry: false, gcTime: 0 });
  if (me.isPending) return <p role="status" className="mx-auto max-w-4xl px-5 py-12 text-sm text-gray-600">Wczytywanie konta…</p>;
  if (me.isError) {
    const error = me.error;
    const code = error instanceof ApiRequestError ? error.code : "request_failed";
    return <div className="mx-auto max-w-lg space-y-5 px-5 py-12">
      <Alert tone="error" title="Nie można wczytać konta">{error instanceof ApiRequestError ? error.message : "Nie udało się pobrać danych. Spróbuj ponownie."}</Alert>
      {code === "unauthenticated" ? <Button href="/sign-in">Zaloguj się</Button> :
        code === "email_not_verified" ? <Button href="/verify-email">Potwierdź adres e-mail</Button> :
        <Button color="secondary" onClick={() => void me.refetch()}>Spróbuj ponownie</Button>}
    </div>;
  }
  return <AccountSettings key={me.data.id} me={me.data} refresh={async () => {
    const result = await me.refetch(); if (result.error) throw result.error;
  }} />;
}
