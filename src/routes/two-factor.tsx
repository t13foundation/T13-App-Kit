import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { Alert, AuthCard, Button, Input } from '@/components/kit';
import { verifyBackupCode, verifyTotp } from '@/lib/account';
import { ApiRequestError } from '@/lib/api';

export const Route = createFileRoute('/two-factor')({ component: TwoFactorPage });
function TwoFactorPage() {
  const [useBackup, setUseBackup] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  return <AuthCard title="Drugi składnik logowania" description={useBackup ? 'Wpisz jeden z zapisanych kodów odzyskiwania.' : 'Wpisz sześciocyfrowy kod z aplikacji uwierzytelniającej.'}>
    <form className="flex flex-col gap-5" onSubmit={(event) => {
      event.preventDefault(); if (pending) return;
      const form = event.currentTarget; const code = String(new FormData(form).get('code') ?? '').trim();
      setError(null); setPending(true);
      (useBackup ? verifyBackupCode(code) : verifyTotp(code)).then(() => window.location.assign('/'))
        .catch((cause: unknown) => { form.reset(); setError(cause instanceof ApiRequestError ? cause.message : 'Nieprawidłowy kod.'); setPending(false); });
    }}>
      {error && <Alert tone="error">{error}</Alert>}
      <Input key={String(useBackup)} isRequired name="code" label={useBackup ? 'Kod odzyskiwania' : 'Kod z aplikacji'}
        autoComplete="one-time-code" inputMode={useBackup ? 'text' : 'numeric'} maxLength={useBackup ? 128 : 6} />
      <Button type="submit" isDisabled={pending} isLoading={pending} size="lg">Potwierdź</Button>
      <Button type="button" color="link-gray" isDisabled={pending} onClick={() => { setUseBackup((value) => !value); setError(null); }}>
        {useBackup ? 'Użyj kodu z aplikacji' : 'Użyj kodu odzyskiwania'}
      </Button>
      <Button href="/sign-in" color="link-gray">Wróć do logowania</Button>
    </form>
  </AuthCard>;
}
