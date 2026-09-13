import { useRef, useState, type FormEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { preferencesSchema, profileSchema, type Me } from "@shared/contracts";

import { PageHeader } from "@/components/kit/blocks/page-header";
import { PageSection } from "@/components/kit/blocks/page-section";
import { Button } from "@/components/kit/controls/button";
import { Alert } from "@/components/kit/feedback/alert";
import { Input } from "@/components/kit/forms/input";
import { NativeSelect } from "@/components/kit/forms/select-native";
import { Container } from "@/components/kit/layout/container";
import {
  changePassword,
  disableTotp,
  enableTotp,
  exportAccount,
  getSessions,
  revokeOtherSessions,
  revokeSession,
  signOut,
  updatePreferences,
  updateProfile,
  verifyTotp,
} from "@/lib/account";
import { ApiRequestError } from "@/lib/api";

const REAUTHENTICATION_CODES = [
  "reauthentication_required",
  "unauthenticated",
  "SESSION_NOT_FRESH",
];

function values(event: FormEvent<HTMLFormElement>) {
  event.preventDefault();
  return new FormData(event.currentTarget);
}

const text = (data: FormData, key: string) => String(data.get(key) ?? "");

/** Account credentials and recovery material stay in component memory, never browser storage. */
export function AccountSettings({ me, refresh }: { me: Me; refresh: () => Promise<unknown> }) {
  const queryClient = useQueryClient();
  const lock = useRef(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<{
    error: boolean;
    message: string;
    reauthenticate?: boolean;
  } | null>(null);
  const [enrollment, setEnrollment] = useState<{ totpURI: string; backupCodes: string[] } | null>(
    null,
  );
  const [confirmed, setConfirmed] = useState(false);
  const sessions = useQuery({
    queryKey: ["sessions", me.id],
    queryFn: getSessions,
    retry: false,
    gcTime: 0,
  });

  async function run(id: string, operation: () => Promise<unknown>, success: string) {
    if (lock.current) return;
    lock.current = true;
    setBusy(id);
    setNotice(null);
    try {
      await operation();
      if (success) setNotice({ error: false, message: success });
    } catch (cause) {
      setNotice({
        error: true,
        message:
          cause instanceof ApiRequestError
            ? cause.message
            : "Nie udało się potwierdzić wyniku operacji. Odśwież dane i spróbuj ponownie.",
        reauthenticate:
          cause instanceof ApiRequestError && REAUTHENTICATION_CODES.includes(cause.code),
      });
    } finally {
      lock.current = false;
      setBusy(null);
    }
  }

  function invalid(message: string) {
    setNotice({ error: true, message });
  }

  function date(value: string) {
    return new Intl.DateTimeFormat(me.locale, {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: me.timezone,
    }).format(new Date(value));
  }

  const disabled = busy !== null;

  return (
    <>
      <PageHeader
        eyebrow="Konto"
        title="Ustawienia konta"
        description="Profil, preferencje i bezpieczeństwo Twojego konta."
        actions={
          <Button
            type="button"
            color="secondary"
            isDisabled={disabled}
            onClick={() =>
              void run(
                "logout",
                async () => {
                  await signOut();
                  await queryClient.cancelQueries();
                  queryClient.clear();
                  setEnrollment(null);
                  window.location.assign("/sign-in");
                },
                "",
              )
            }
          >
            Wyloguj się
          </Button>
        }
      />

      {notice && (
        <Container className="pt-8">
          <Alert tone={notice.error ? "error" : "success"}>
            {notice.message}
            {notice.reauthenticate && (
              <p className="mt-2">
                <a href="/sign-in" className="font-medium underline">
                  Zaloguj się ponownie
                </a>
              </p>
            )}
          </Alert>
        </Container>
      )}

      <PageSection title="Profil" description="Nazwa widoczna w aplikacji.">
        <form
          method="post"
          className="flex max-w-[var(--kit-form-max)] flex-col gap-4"
          onSubmit={(event) => {
            const data = values(event);
            const parsed = profileSchema.safeParse({ name: text(data, "name") });
            if (!parsed.success) return invalid("Wpisz nazwę o długości od 1 do 120 znaków.");
            void run(
              "profile",
              async () => {
                await updateProfile(parsed.data);
                await refresh();
              },
              "Profil został zapisany.",
            );
          }}
        >
          <Input
            name="name"
            label="Nazwa"
            defaultValue={me.name}
            isRequired
            maxLength={120}
            autoComplete="name"
          />
          <div>
            <p className="text-sm font-medium text-secondary">E-mail</p>
            <p className="mt-1 text-sm break-all text-tertiary">{me.email}</p>
          </div>
          <Button
            type="submit"
            className="self-start"
            isDisabled={disabled}
            isLoading={busy === "profile"}
          >
            Zapisz profil
          </Button>
        </form>
      </PageSection>

      <PageSection title="Preferencje" description="Ustawienia zapisywane na Twoim koncie.">
        <form
          method="post"
          className="flex max-w-[var(--kit-form-max)] flex-col gap-4"
          onSubmit={(event) => {
            const data = values(event);
            const parsed = preferencesSchema.safeParse({
              locale: text(data, "locale"),
              timezone: text(data, "timezone"),
            });
            if (!parsed.success)
              return invalid("Wybierz język i poprawną strefę czasową, np. Europe/Warsaw.");
            void run(
              "preferences",
              async () => {
                await updatePreferences(parsed.data);
                await refresh();
              },
              "Preferencje zostały zapisane.",
            );
          }}
        >
          <NativeSelect
            name="locale"
            label="Formaty regionalne"
            defaultValue={me.locale}
            options={[
              { value: "pl", label: "Polskie" },
              { value: "en", label: "English" },
            ]}
          />
          <Input
            name="timezone"
            label="Strefa czasowa"
            defaultValue={me.timezone}
            isRequired
            hint="Np. Europe/Warsaw, Europe/London lub UTC."
          />
          <p className="text-xs text-tertiary">
            Interfejs tego wydania jest po polsku. Ustawienie zmienia format dat, nie język
            wszystkich ekranów.
          </p>
          <Button
            type="submit"
            className="self-start"
            isDisabled={disabled}
            isLoading={busy === "preferences"}
          >
            Zapisz preferencje
          </Button>
        </form>
      </PageSection>

      <PageSection
        title="Hasło"
        description="Zmiana wyloguje pozostałe sesje. Operacja wymaga świeżego logowania."
      >
        <form
          method="post"
          className="flex max-w-[var(--kit-form-max)] flex-col gap-4"
          onSubmit={(event) => {
            const form = event.currentTarget;
            const data = values(event);
            if (text(data, "newPassword") !== text(data, "confirm"))
              return invalid("Nowe hasła muszą być identyczne.");
            const body = {
              currentPassword: text(data, "currentPassword"),
              newPassword: text(data, "newPassword"),
            };
            form.reset();
            void run(
              "password",
              async () => {
                await changePassword(body);
                await sessions.refetch();
              },
              "Hasło zostało zmienione. Pozostałe sesje odwołano.",
            );
          }}
        >
          <Input
            name="currentPassword"
            type="password"
            label="Obecne hasło"
            isRequired
            autoComplete="current-password"
          />
          <Input
            name="newPassword"
            type="password"
            label="Nowe hasło"
            isRequired
            minLength={12}
            autoComplete="new-password"
            hint="Co najmniej 12 znaków."
          />
          <Input
            name="confirm"
            type="password"
            label="Powtórz nowe hasło"
            isRequired
            minLength={12}
            autoComplete="new-password"
          />
          <Button
            type="submit"
            className="self-start"
            isDisabled={disabled}
            isLoading={busy === "password"}
          >
            Zmień hasło
          </Button>
        </form>
      </PageSection>

      <PageSection
        title="Logowanie dwuetapowe"
        description="Kod z aplikacji uwierzytelniającej i jednorazowe kody odzyskiwania."
      >
        <p className="text-sm font-medium text-primary">
          {me.twoFactorEnabled
            ? "Logowanie dwuetapowe jest włączone."
            : "Logowanie dwuetapowe nie jest włączone."}
        </p>

        {enrollment ? (
          <div className="flex max-w-[var(--kit-form-max)] flex-col gap-4">
            {!confirmed && (
              <>
                <p className="text-sm text-tertiary">
                  Dodaj konto w aplikacji uwierzytelniającej. Klucz i adres poniżej są poufne.
                </p>
                <Input
                  label="Klucz do ręcznego dodania"
                  value={new URL(enrollment.totpURI).searchParams.get("secret") ?? ""}
                  isReadOnly
                />
                <details className="text-sm">
                  <summary className="cursor-pointer text-secondary">
                    Pokaż pełny adres konfiguracji TOTP
                  </summary>
                  <code className="mt-2 block rounded-lg border border-secondary p-3 break-all">
                    {enrollment.totpURI}
                  </code>
                </details>
              </>
            )}

            <div className="rounded-lg border border-secondary bg-primary p-4">
              <h3 className="text-sm font-semibold text-primary">Zapisz kody odzyskiwania</h3>
              <p className="mt-1 text-sm text-tertiary">
                Przechowuj je poza aplikacją. Każdy kod działa tylko raz.
              </p>
              <ul className="mt-3 grid grid-cols-1 gap-2 font-mono text-sm text-primary sm:grid-cols-2">
                {enrollment.backupCodes.map((code) => (
                  <li key={code}>{code}</li>
                ))}
              </ul>
            </div>

            {!confirmed ? (
              <form
                method="post"
                className="flex flex-col gap-4"
                onSubmit={(event) => {
                  const form = event.currentTarget;
                  const code = text(values(event), "code");
                  form.reset();
                  void run(
                    "confirm-mfa",
                    async () => {
                      await verifyTotp(code);
                      setConfirmed(true);
                      await refresh();
                    },
                    "Logowanie dwuetapowe zostało włączone.",
                  );
                }}
              >
                <Input
                  name="code"
                  label="Kod z aplikacji"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  isRequired
                  minLength={6}
                  maxLength={6}
                />
                <Button
                  type="submit"
                  className="self-start"
                  isDisabled={disabled}
                  isLoading={busy === "confirm-mfa"}
                >
                  Potwierdź i włącz
                </Button>
              </form>
            ) : (
              <Button
                type="button"
                color="secondary"
                className="self-start"
                onClick={() => {
                  setEnrollment(null);
                  setConfirmed(false);
                }}
              >
                Kody zapisane — ukryj
              </Button>
            )}
          </div>
        ) : (
          <form
            method="post"
            className="flex max-w-[var(--kit-form-max)] flex-col gap-4"
            onSubmit={(event) => {
              const form = event.currentTarget;
              const password = text(values(event), "password");
              form.reset();
              void run(
                "mfa",
                async () => {
                  if (me.twoFactorEnabled) {
                    await disableTotp(password);
                    await refresh();
                  } else {
                    setConfirmed(false);
                    setEnrollment(await enableTotp(password));
                  }
                },
                me.twoFactorEnabled
                  ? "Logowanie dwuetapowe zostało wyłączone."
                  : "Potwierdź konfigurację kodem z aplikacji.",
              );
            }}
          >
            <Input
              name="password"
              type="password"
              label="Potwierdź obecnym hasłem"
              isRequired
              autoComplete="current-password"
            />
            <Button
              type="submit"
              color="secondary"
              className="self-start"
              isDisabled={disabled}
              isLoading={busy === "mfa"}
            >
              {me.twoFactorEnabled
                ? "Wyłącz logowanie dwuetapowe"
                : "Skonfiguruj logowanie dwuetapowe"}
            </Button>
          </form>
        )}
      </PageSection>

      <PageSection
        title="Aktywne sesje"
        description="Lista sesji, nie zweryfikowany rejestr fizycznych urządzeń."
      >
        {sessions.isPending ? (
          <p role="status" className="text-sm text-tertiary">
            Wczytywanie sesji…
          </p>
        ) : sessions.isError ? (
          <Alert tone="error">Nie udało się wczytać sesji.</Alert>
        ) : (
          <ul className="divide-y divide-secondary rounded-lg border border-secondary">
            {sessions.data.sessions.map((entry) => (
              <li key={entry.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div>
                  <p className="text-sm font-medium text-primary">
                    {entry.client}
                    {entry.current ? " · Bieżąca sesja" : ""}
                  </p>
                  <p className="mt-1 text-xs text-tertiary">Utworzono: {date(entry.createdAt)}</p>
                </div>
                {!entry.current && (
                  <Button
                    type="button"
                    color="secondary"
                    isDisabled={disabled}
                    onClick={() =>
                      void run(
                        "session",
                        async () => {
                          await revokeSession(entry.id);
                          await sessions.refetch();
                        },
                        "Sesja została odwołana.",
                      )
                    }
                  >
                    Odwołaj
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
        <Button
          type="button"
          color="secondary"
          className="self-start"
          isDisabled={disabled || !sessions.data?.sessions.some((entry) => !entry.current)}
          onClick={() =>
            void run(
              "sessions",
              async () => {
                await revokeOtherSessions();
                await sessions.refetch();
              },
              "Pozostałe sesje zostały odwołane.",
            )
          }
        >
          Wyloguj pozostałe sesje
        </Button>
      </PageSection>

      <PageSection
        title="Dane konta"
        description="Pobierz profil i preferencje. Ten eksport nie obejmuje materiałów innych modułów."
      >
        <Button
          type="button"
          color="secondary"
          className="self-start"
          isDisabled={disabled}
          isLoading={busy === "export"}
          onClick={() =>
            void run(
              "export",
              async () => {
                const data = await exportAccount();
                const url = URL.createObjectURL(
                  new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
                );
                const link = document.createElement("a");
                link.href = url;
                link.download = "konto.json";
                document.body.appendChild(link);
                link.click();
                link.remove();
                setTimeout(() => URL.revokeObjectURL(url), 1000);
              },
              "Eksport danych konta został przygotowany.",
            )
          }
        >
          Pobierz dane konta
        </Button>
      </PageSection>
    </>
  );
}
