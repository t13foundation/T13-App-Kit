import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Alert, Button } from "@/components/kit";
import { appConfig } from "@/app.config";
import { getStatus } from "@/lib/account";
import { ApiRequestError } from "@/lib/api";
export const Route = createFileRoute("/")({ component: Index });
function Index() {
  const status = useQuery({ queryKey: ["status"], queryFn: getStatus, retry: false });
  return <div className="mx-auto max-w-3xl space-y-8 px-5 py-12">
    <div><h1 className="text-2xl font-semibold tracking-tight text-gray-900">{appConfig.name}</h1><p className="mt-2 text-sm text-gray-600">{appConfig.description}</p></div>
    {status.isPending ? <p role="status" className="text-sm text-gray-600">Sprawdzanie połączenia…</p> :
      status.isError ? <Alert title="Funkcje konta są niedostępne" tone="error">{status.error instanceof ApiRequestError ? status.error.message : "Nie można sprawdzić połączenia z backendem."}</Alert> :
      <Alert tone="success" title="Połączono z API">Usługa konta odpowiada, a baza danych jest dostępna.</Alert>}
    <section className="space-y-4 border-t border-gray-200 pt-6"><h2 className="font-semibold">Konto</h2>
      <div className="flex flex-wrap gap-3"><Button href="/sign-in">Zaloguj się</Button><Button href="/sign-up" color="secondary">Utwórz konto</Button><Button href="/account" color="tertiary">Ustawienia konta</Button></div>
    </section>
    <section className="space-y-4 border-t border-gray-200 pt-6"><h2 className="font-semibold">Komponenty</h2><p className="text-sm text-gray-600">Katalog interfejsu działa również bez backendu.</p><Button href="/catalog" color="secondary">Otwórz katalog</Button></section>
  </div>;
}
