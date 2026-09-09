import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";

import { Alert, Button, Input, NativeSelect, PageSection } from "@/components/kit";
import { getMe, getSessions, revokeOtherSessions, updatePreferences } from "@/lib/account";
import { ApiRequestError } from "@/lib/api";
import { authClient, authErrorMessage } from "@/lib/auth-client";

export const Route = createFileRoute("/account")({
  head: () => ({
    meta: [
      { title: "Konto i ustawienia" },
      { name: "description", content: "Profil, preferencje, hasło, weryfikacja dwuetapowa i sesje." },
      { property: "og:title", content: "Konto i ustawienia" },
      {
        property: "og:description",
        content: "Profil, preferencje, hasło, weryfikacja dwuetapowa i sesje.",
      },
    ],
  }),
  component: AccountPage,
});

const TIMEZONES = [
  "Europe/Warsaw",
  "Europe/London",
  "Europe/Berlin",
  "America/New_York",
  "Asia/Tokyo",
  "UTC",
];

function AccountPage() {
  const me = useQuery({ queryKey: ["me"], queryFn: getMe, retry: false });
  const sessions = useQuery({
    queryKey: ["sessions"],
    queryFn: getSessions,
    retry: false,
    enabled: me.isSuccess,
  });

  if (me.isLoading) {
    return <p className="mx-auto max-w-3xl px-4 py-12 text-sm text-gray-600">Wczytywanie…</p>;
  }

  if (me.isError) {
    const error = me.error;
    const status = error instanceof ApiRequestError ? error.status : 0;
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <Alert
          tone="error"
          title={
            status === 401
              ? "Wymagane logowanie"
              : status === 403
                ? "Potwierdź adres e-mail"
                : "Brak połączenia z API"
          }
        >
          {status === 401 ? (
            <Link to="/sign-in" className="font-medium text-gray-900 underline">
              Przejdź do logowania
            </Link>
          ) : status === 403 ? (
            <Link to="/verify-email" className="font-medium text-gray-900 underline">
              Wyślij link potwierdzający
            </Link>
          ) : (
            "Backend nie jest uruchomiony lub nie jest skonfigurowany."
          )}
        </Alert>
      </div>
    );
  }

  const user = me.data!;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Konto</h1>
      <p className="mt-1 text-sm text-gray-600">{user.email}</p>

      <PageSection title="Profil" description="Dane podstawowe pobrane z serwera.">
        <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-gray-600">Imię i nazwisko</dt>
            <dd className="text-gray-900">{user.name}</dd>
          </div>
          <div>
            <dt className="text-gray-600">Adres e-mail</dt>
            <dd className="text-gray-900">
              {user.email} {user.emailVerified ? "(potwierdzony)" : "(niepotwierdzony)"}
            </dd>
          </div>
        </dl>
        <Alert>
          Zmiana adresu e-mail i usunięcie konta są zaplanowane jako kontrolowane procesy i nie są
          jeszcze dostępne.
        </Alert>
      </PageSection>

      <PreferencesSection locale={user.locale} timezone={user.timezone} />
      <PasswordSection />
      <TwoFactorSection enabled={user.twoFactorEnabled} />

      <PageSection
        title="Sesje"
        description="Lista aktywnych sesji tego konta. Nie zawiera tokenów ani danych innych użytkowników."
      >
        {sessions.isError ? <Alert tone="error">Nie udało się pobrać listy sesji.</Alert> : null}
        <ul className="divide-y divide-gray-200 border-y border-gray-200 text-sm">
          {(sessions.data?.sessions ?? []).map((session) => (
            <li key={session.id} className="flex items-center justify-between gap-4 py-3">
              <span className="text-gray-900">
                {session.client}
                {session.current ? " — bieżąca" : ""}
              </span>
              <time className="text-gray-600" dateTime={session.createdAt}>
                {new Date(session.createdAt).toLocaleString()}
              </time>
            </li>
          ))}
        </ul>
        <RevokeOthers />
      </PageSection>

      <PageSection title="Wyloguj" description="Zakończ bieżącą sesję na tym urządzeniu.">
        <SignOutButton />
      </PageSection>
    </div>
  );
}

function PreferencesSection({ locale, timezone }: { locale: string; timezone: string }) {
  const queryClient = useQueryClient();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: updatePreferences,
    onSuccess: () => {
      setError(null);
      setMessage("Zapisano preferencje.");
      void queryClient.invalidateQueries({ queryKey: ["me"] });
    },
    onError: () => {
      setMessage(null);
      setError("Nie udało się zapisać preferencji.");
    },
  });

  return (
    <PageSection title="Preferencje" description="Język i strefa czasowa zapisywane w bazie danych.">
      {message ? <Alert tone="success">{message}</Alert> : null}
      {error ? <Alert tone="error">{error}</Alert> : null}
      <form
        method="post"
        className="flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          mutation.mutate({
            locale: String(data.get("locale") ?? "pl") as "pl" | "en",
            timezone: String(data.get("timezone") ?? "UTC"),
          });
        }}
      >
        <NativeSelect
          name="locale"
          label="Język"
          defaultValue={locale}
          options={[
            { label: "Polski", value: "pl" },
            { label: "English", value: "en" },
          ]}
        />
        <NativeSelect
          name="timezone"
          label="Strefa czasowa"
          defaultValue={timezone}
          options={TIMEZONES.map((zone) => ({ label: zone, value: zone }))}
        />
        <div>
          <Button type="submit" isDisabled={mutation.isPending}>
            {mutation.isPending ? "Zapisywanie…" : "Zapisz preferencje"}
          </Button>
        </div>
      </form>
    </PageSection>
  );
}

function PasswordSection() {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  return (
    <PageSection title="Hasło" description="Zmiana hasła wymaga podania obecnego hasła.">
      {message ? <Alert tone="success">{message}</Alert> : null}
      {error ? <Alert tone="error">{error}</Alert> : null}
      <form
        method="post"
        className="flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          const form = event.currentTarget;
          const data = new FormData(form);
          setError(null);
          setMessage(null);
          setPending(true);
          void authClient
            .changePassword({
              currentPassword: String(data.get("current") ?? ""),
              newPassword: String(data.get("next") ?? ""),
              revokeOtherSessions: true,
            })
            .then((result) => {
              if (result.error) {
                setError(authErrorMessage(result.error));
                return;
              }
              form.reset();
              setMessage("Hasło zostało zmienione.");
            })
            .catch(() => setError("Usługa jest niedostępna."))
            .finally(() => setPending(false));
        }}
      >
        <Input isRequired name="current" type="password" label="Obecne hasło" autoComplete="current-password" />
        <Input
          isRequired
          name="next"
          type="password"
          label="Nowe hasło"
          hint="Minimum 12 znaków."
          autoComplete="new-password"
        />
        <div>
          <Button type="submit" isDisabled={pending}>
            {pending ? "Zapisywanie…" : "Zmień hasło"}
          </Button>
        </div>
      </form>
    </PageSection>
  );
}

function TwoFactorSection({ enabled }: { enabled: boolean }) {
  const queryClient = useQueryClient();
  const [totpUri, setTotpUri] = useState<string | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  return (
    <PageSection
      title="Weryfikacja dwuetapowa"
      description="Kod jednorazowy TOTP z aplikacji uwierzytelniającej oraz kody odzyskiwania."
    >
      {message ? <Alert tone="success">{message}</Alert> : null}
      {error ? <Alert tone="error">{error}</Alert> : null}
      <p className="text-sm text-gray-600">
        Stan: {enabled ? "włączona" : "wyłączona"}. Włączenie wymaga potwierdzenia kodem.
      </p>

      {!enabled ? (
        <form
          method="post"
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            const password = String(new FormData(event.currentTarget).get("password") ?? "");
            setError(null);
            void authClient.twoFactor.enable({ password }).then((result) => {
              if (result.error) {
                setError(authErrorMessage(result.error));
                return;
              }
              const data = result.data as { totpURI: string; backupCodes: string[] };
              setTotpUri(data.totpURI);
              setBackupCodes(data.backupCodes);
            });
          }}
        >
          <Input isRequired name="password" type="password" label="Hasło" autoComplete="current-password" />
          <div>
            <Button type="submit">Rozpocznij konfigurację</Button>
          </div>
        </form>
      ) : (
        <form
          method="post"
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            const password = String(new FormData(event.currentTarget).get("password") ?? "");
            setError(null);
            void authClient.twoFactor.disable({ password }).then((result) => {
              if (result.error) {
                setError(authErrorMessage(result.error));
                return;
              }
              setMessage("Weryfikacja dwuetapowa została wyłączona.");
              void queryClient.invalidateQueries({ queryKey: ["me"] });
            });
          }}
        >
          <Input isRequired name="password" type="password" label="Hasło" autoComplete="current-password" />
          <div>
            <Button type="submit" color="secondary">
              Wyłącz weryfikację dwuetapową
            </Button>
          </div>
        </form>
      )}

      {totpUri ? (
        <div className="flex flex-col gap-4 border-t border-gray-200 pt-4">
          <div>
            <p className="text-sm text-gray-600">Adres konfiguracyjny dla aplikacji TOTP:</p>
            <code className="mt-1 block break-all rounded border border-gray-200 bg-gray-50 p-2 text-xs text-gray-900">
              {totpUri}
            </code>
          </div>
          {backupCodes.length ? (
            <div>
              <p className="text-sm text-gray-600">Kody odzyskiwania — zapisz je teraz:</p>
              <ul className="mt-1 grid grid-cols-2 gap-1 text-xs text-gray-900">
                {backupCodes.map((code) => (
                  <li key={code}>
                    <code>{code}</code>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          <form
            method="post"
            className="flex flex-col gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              const code = String(new FormData(event.currentTarget).get("code") ?? "");
              setError(null);
              void authClient.twoFactor.verifyTotp({ code }).then((result) => {
                if (result.error) {
                  setError(authErrorMessage(result.error));
                  return;
                }
                setTotpUri(null);
                setMessage("Weryfikacja dwuetapowa jest aktywna.");
                void queryClient.invalidateQueries({ queryKey: ["me"] });
              });
            }}
          >
            <Input isRequired name="code" label="Kod z aplikacji" autoComplete="one-time-code" />
            <div>
              <Button type="submit">Potwierdź i włącz</Button>
            </div>
          </form>
        </div>
      ) : null}
    </PageSection>
  );
}

function RevokeOthers() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: revokeOtherSessions,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["sessions"] });
    },
  });

  return (
    <div>
      <Button
        color="secondary"
        isDisabled={mutation.isPending}
        onClick={() => mutation.mutate()}
      >
        {mutation.isPending ? "Odwoływanie…" : "Wyloguj pozostałe sesje"}
      </Button>
      {mutation.isError ? (
        <p className="mt-2 text-sm text-gray-900">Nie udało się odwołać sesji.</p>
      ) : null}
    </div>
  );
}

function SignOutButton() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return (
    <div>
      <Button
        color="secondary"
        onClick={() => {
          void authClient.signOut().then(() => {
            queryClient.clear();
            void navigate({ to: "/sign-in" });
          });
        }}
      >
        Wyloguj się
      </Button>
    </div>
  );
}
