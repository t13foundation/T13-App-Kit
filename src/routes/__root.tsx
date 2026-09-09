import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Outlet, createRootRouteWithContext, useRouter, HeadContent, Scripts } from '@tanstack/react-router';
import type { ReactNode } from 'react';
import { appConfig } from '../app.config';
import { Button } from '../components/kit/controls/button';
import { AppHeader } from '../components/kit/navigation/app-header';
import appCss from '../styles.css?url';

function NotFoundComponent() {
  return <div className="mx-auto max-w-md space-y-4 px-5 py-20">
    <h1 className="text-2xl font-semibold">Nie znaleziono strony</h1><p className="text-sm text-gray-600">Ten adres nie prowadzi do dostępnej strony.</p>
    <Button href="/" color="secondary">Wróć do aplikacji</Button>
  </div>;
}
function ErrorComponent({ reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  // Never serialize the thrown error or a sensitive URL into client telemetry.
  return <div className="mx-auto max-w-md space-y-4 px-5 py-20">
    <h1 className="text-2xl font-semibold">Nie udało się wczytać strony</h1>
    <p className="text-sm text-gray-600">Spróbuj ponownie. Nieukończona operacja nie jest potwierdzeniem zapisu.</p>
    <div className="flex flex-wrap gap-3"><Button type="button" onClick={() => { void router.invalidate(); reset(); }}>Spróbuj ponownie</Button><Button href="/" color="secondary">Wróć</Button></div>
  </div>;
}
export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({ meta: [
    { charSet: 'utf-8' }, { name: 'viewport', content: 'width=device-width, initial-scale=1' },
    { title: appConfig.name }, { name: 'description', content: appConfig.description },
    { name: 'referrer', content: 'no-referrer' },
  ], links: [{ rel: 'stylesheet', href: appCss }, { rel: 'icon', href: 'data:,' }] }),
  shellComponent: RootShell, component: RootComponent,
  notFoundComponent: NotFoundComponent, errorComponent: ErrorComponent,
});
function RootShell({ children }: { children: ReactNode }) {
  return <html lang={appConfig.defaultLocale}><head><HeadContent /></head><body>{children}<Scripts /></body></html>;
}
function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return <QueryClientProvider client={queryClient}>
    <a href="#main-content" className="sr-only z-50 bg-white p-3 text-gray-900 focus:not-sr-only focus:fixed focus:left-3 focus:top-3">Przejdź do treści</a>
    <AppHeader /><main id="main-content" className="min-h-[calc(100vh-4rem)]"><Outlet /></main>
  </QueryClientProvider>;
}
