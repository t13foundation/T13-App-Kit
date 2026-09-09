import { createFileRoute } from "@tanstack/react-router";
import { Alert, Button } from "@/components/kit";
import { appConfig } from "@/app.config";
export const Route = createFileRoute("/")({ component: Index });
function Index() {
  return <div className="mx-auto max-w-3xl space-y-8 px-5 py-12">
    <div><h1 className="text-2xl font-semibold tracking-tight text-gray-900">{appConfig.name}</h1><p className="mt-2 text-sm text-gray-600">{appConfig.description}</p></div>
    <Alert title="Szablon aplikacji">Neutralna baza do rozbudowy. Pierwszy przyrost Supabase obejmuje konto i prywatne notatki. Konfigurację opisuje docs/supabase.md.</Alert>
    <section className="space-y-4 border-t border-gray-200 pt-6"><h2 className="font-semibold">Konto i prywatne dane</h2>
      <p className="text-sm text-gray-600">Utwórz konto, potwierdź e-mail kodem i przejdź przez dodawanie, edycję oraz usuwanie notatek.</p>
      <Button href="/notes">Otwórz konto i Notes</Button>
    </section>
    <section className="space-y-4 border-t border-gray-200 pt-6"><h2 className="font-semibold">Komponenty</h2><p className="text-sm text-gray-600">Katalog interfejsu działa również bez backendu.</p><Button href="/catalog" color="secondary">Otwórz katalog</Button></section>
    <details className="border-t border-gray-200 pt-6"><summary className="cursor-pointer text-sm font-medium">Poprzedni backend — ścieżka wycofania</summary>
      <p className="my-3 text-sm text-gray-600">Better Auth i stare ustawienia pozostają do czasu odbioru zamiennika. Korzystają z oddzielnych kont i sesji.</p>
      <div className="flex flex-wrap gap-3"><Button href="/sign-in" color="secondary">Logowanie legacy</Button><Button href="/account" color="tertiary">Ustawienia legacy</Button></div>
    </details>
  </div>;
}
