import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRouteWithContext,
  useRouter,
} from "@tanstack/react-router";

import { appConfig } from "@/app.config";
import { Button, Container, PageFooter, PageNav } from "@/components/kit";
import appCss from "@/styles.css?url";

const navLinks = [
  { to: "/", label: "Przegląd" },
  { to: "/notes", label: "Notatki" },
];

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: appConfig.name },
      { name: "description", content: appConfig.description },
      { name: "referrer", content: "no-referrer" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "data:," },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang={appConfig.defaultLocale}>
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <a
        href="#main-content"
        className="sr-only z-50 bg-primary p-3 text-primary focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Przejdź do treści
      </a>
      <PageNav name={appConfig.name} links={navLinks} />
      <main id="main-content" className="min-h-[calc(100vh-4rem)]">
        <Outlet />
      </main>
      <PageFooter name={appConfig.name} note="Zestaw startowy — bez wdrożenia produkcyjnego." />
    </QueryClientProvider>
  );
}

function NotFoundComponent() {
  return (
    <Container className="flex flex-col items-start gap-4 py-20">
      <h1 className="text-display-xs font-semibold text-primary">Nie znaleziono strony</h1>
      <p className="text-sm text-tertiary">Ten adres nie prowadzi do dostępnej strony.</p>
      <Button href="/" color="secondary">
        Wróć do aplikacji
      </Button>
    </Container>
  );
}

/** Never serialize the thrown error or a sensitive URL into client telemetry. */
function ErrorComponent({ reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  return (
    <Container className="flex flex-col items-start gap-4 py-20">
      <h1 className="text-display-xs font-semibold text-primary">Nie udało się wczytać strony</h1>
      <p className="text-sm text-tertiary">
        Spróbuj ponownie. Jeśli błąd wystąpił podczas zapisywania, sprawdź dane przed ponowieniem
        zmiany.
      </p>
      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
          onClick={() => {
            void router.invalidate();
            reset();
          }}
        >
          Spróbuj ponownie
        </Button>
        <Button href="/" color="secondary">
          Wróć
        </Button>
      </div>
    </Container>
  );
}
