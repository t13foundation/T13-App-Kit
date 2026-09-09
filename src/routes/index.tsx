import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { appConfig } from '@/app.config';
import { Button } from '@/components/kit/controls/button';
import { Alert } from '@/components/kit/feedback/alert';
import { AccountSettings } from '@/components/kit/blocks/account-settings';
import { getMe } from '@/lib/account';
import { ApiRequestError } from '@/lib/api';

export const Route = createFileRoute('/')({ component: HomePage });
function HomePage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const me = useQuery({ queryKey: ['me'], queryFn: getMe, enabled: mounted, retry: false, gcTime: 0 });
  if (!mounted || me.isPending) return <p role="status" className="p-10 text-center text-sm text-gray-600">Wczytywanie konta…</p>;
  if (me.data) return <AccountSettings me={me.data} refresh={() => me.refetch({ throwOnError: true })} />;
  const error = me.error;
  const anonymous = error instanceof ApiRequestError && error.status === 401;
  return <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center gap-5 px-5 py-12">
    <h1 className="text-2xl font-semibold tracking-tight text-gray-900">{appConfig.name}</h1>
    <p className="text-sm text-gray-600">Zaloguj się, aby przejść do konta i ustawień.</p>
    {!anonymous && <Alert tone="error">{error instanceof ApiRequestError ? error.message : 'Nie udało się sprawdzić stanu konta.'}</Alert>}
    <div className="flex flex-wrap gap-3"><Button href="/sign-in" size="lg">Zaloguj się</Button><Button href="/sign-up" size="lg" color="secondary">Utwórz konto</Button></div>
    {!anonymous && <Button type="button" color="link-gray" onClick={() => void me.refetch()}>Sprawdź ponownie</Button>}
  </div>;
}
