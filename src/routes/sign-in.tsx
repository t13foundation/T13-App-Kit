import { createFileRoute, Link } from '@tanstack/react-router';
import { useState } from 'react';
import { Alert, AuthCard, Button, Input } from '@/components/kit';
import { signIn } from '@/lib/account';
import { ApiRequestError } from '@/lib/api';

export const Route = createFileRoute('/sign-in')({ component: SignInPage });
function SignInPage() {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  return <AuthCard title="Zaloguj się" description="Podaj adres e-mail i hasło do swojego konta." footer={
    <div className="flex flex-col gap-2"><Link to="/forgot-password" className="font-medium text-gray-900 underline">Nie pamiętam hasła</Link>
      <span>Nie masz konta? <Link to="/sign-up" className="font-medium text-gray-900 underline">Zarejestruj się</Link></span></div>
  }>
    <form className="flex flex-col gap-5" onSubmit={(event) => {
      event.preventDefault(); if (pending) return;
      const form = event.currentTarget; const data = new FormData(form);
      const body = { email: String(data.get('email') ?? ''), password: String(data.get('password') ?? '') };
      setError(null); setPending(true);
      signIn(body).then((result) => {
        // A new document clears the previous account's private query cache.
        window.location.assign(result?.twoFactorRedirect ? '/two-factor' : '/');
      }).catch((cause: unknown) => {
        const field = form.elements.namedItem('password'); if (field instanceof HTMLInputElement) field.value = '';
        setError(cause instanceof ApiRequestError ? cause.message : 'Logowanie nie powiodło się.');
        setPending(false);
      });
    }}>
      {error && <Alert tone="error">{error}</Alert>}
      <Input isRequired name="email" type="email" label="E-mail" autoComplete="email" />
      <Input isRequired name="password" type="password" label="Hasło" autoComplete="current-password" />
      <Button type="submit" isDisabled={pending} isLoading={pending} size="lg">Zaloguj się</Button>
    </form>
  </AuthCard>;
}
