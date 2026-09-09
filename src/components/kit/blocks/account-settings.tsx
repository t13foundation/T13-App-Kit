import { useRef, useState, type FormEvent, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { preferencesSchema, profileSchema, type Me } from "@shared/contracts";
import { Button } from "../controls/button";
import { Input } from "../forms/input";
import { NativeSelect } from "../forms/select-native";
import { Alert } from "../feedback/alert";
import { changePassword, disableTotp, enableTotp, exportAccount, getSessions,
  revokeOtherSessions, revokeSession, signOut, updatePreferences, updateProfile, verifyTotp } from "@/lib/account";
import { ApiRequestError } from "@/lib/api";

function Section({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return <section className="grid gap-5 border-t border-gray-200 py-8 md:grid-cols-[200px_1fr]">
    <div><h2 className="font-semibold text-gray-900">{title}</h2><p className="mt-1 text-sm text-gray-600">{description}</p></div>
    <div className="min-w-0 space-y-4">{children}</div>
  </section>;
}
function values(event: FormEvent<HTMLFormElement>) { event.preventDefault(); return new FormData(event.currentTarget); }
const text = (data: FormData, key: string) => String(data.get(key) ?? "");

/** Account credentials and recovery material stay in component memory, never browser storage. */
export function AccountSettings({ me, refresh }: { me: Me; refresh: () => Promise<unknown> }) {
  const queryClient = useQueryClient();
  const lock = useRef(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ error: boolean; message: string; reauthenticate?: boolean } | null>(null);
  const [enrollment, setEnrollment] = useState<{ totpURI: string; backupCodes: string[] } | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const sessions = useQuery({ queryKey: ["sessions", me.id], queryFn: getSessions, retry: false, gcTime: 0 });
  async function run(id: string, operation: () => Promise<unknown>, success: string) {
    if (lock.current) return;
    lock.current = true; setBusy(id); setNotice(null);
    try { await operation(); if (success) setNotice({ error: false, message: success }); }
    catch (cause) {
      setNotice({ error: true, message: cause instanceof ApiRequestError ? cause.message : "Nie udało się potwierdzić wyniku operacji. Odśwież dane i spróbuj ponownie.",
        reauthenticate: cause instanceof ApiRequestError && ["reauthentication_required", "unauthenticated", "SESSION_NOT_FRESH"].includes(cause.code) });
    } finally { lock.current = false; setBusy(null); }
  }
  function invalid(message: string) { setNotice({ error: true, message }); }
  function date(value: string) {
    return new Intl.DateTimeFormat(me.locale, { dateStyle: "medium", timeStyle: "short", timeZone: me.timezone }).format(new Date(value));
  }
  const disabled = busy !== null;
  return <div className="mx-auto w-full max-w-4xl px-5 py-10 sm:px-8">
    <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
      <div><h1 className="text-2xl font-semibold tracking-tight text-gray-900">Ustawienia konta</h1>
        <p className="mt-2 text-sm text-gray-600">Profil, preferencje i bezpieczeństwo Twojego konta.</p></div>
      <Button type="button" color="secondary" isDisabled={disabled} onClick={() => void run("logout", async () => {
        await signOut(); await queryClient.cancelQueries(); queryClient.clear(); setEnrollment(null); window.location.assign("/sign-in");
      }, "")}>Wyloguj się</Button>
    </div>
    {notice && <div className="mb-6"><Alert tone={notice.error ? "error" : "success"}>{notice.message}
      {notice.reauthenticate && <p className="mt-2"><a href="/sign-in" className="font-medium underline">Zaloguj się ponownie</a></p>}
    </Alert></div>}
    <Section title="Profil" description="Nazwa widoczna w aplikacji.">
      <form method="post" className="space-y-4" onSubmit={(event) => {
        const data = values(event); const parsed = profileSchema.safeParse({ name: text(data, "name") });
        if (!parsed.success) return invalid("Wpisz nazwę o długości od 1 do 120 znaków.");
        void run("profile", async () => { await updateProfile(parsed.data); await refresh(); }, "Profil został zapisany.");
      }}>
        <Input name="name" label="Nazwa" defaultValue={me.name} isRequired maxLength={120} autoComplete="name" />
        <div><p className="text-sm font-medium text-gray-700">E-mail</p><p className="mt-1 break-all text-sm text-gray-600">{me.email}</p></div>
        <Button type="submit" isDisabled={disabled} isLoading={busy === "profile"}>Zapisz profil</Button>
      </form>
    </Section>
    <Section title="Preferencje" description="Ustawienia zapisywane na Twoim koncie.">
      <form method="post" className="space-y-4" onSubmit={(event) => {
        const data = values(event); const parsed = preferencesSchema.safeParse({ locale: text(data, "locale"), timezone: text(data, "timezone") });
        if (!parsed.success) return invalid("Wybierz język i poprawną strefę czasową, np. Europe/Warsaw.");
        void run("preferences", async () => { await updatePreferences(parsed.data); await refresh(); }, "Preferencje zostały zapisane.");
      }}>
        <NativeSelect name="locale" label="Formaty regionalne" defaultValue={me.locale}
          options={[{ value: "pl", label: "Polskie" }, { value: "en", label: "English" }]} />
        <Input name="timezone" label="Strefa czasowa" defaultValue={me.timezone} isRequired hint="Np. Europe/Warsaw, Europe/London lub UTC." />
        <p className="text-xs text-gray-600">Interfejs tego wydania jest po polsku. Ustawienie zmienia format dat, nie język wszystkich ekranów.</p>
        <Button type="submit" isDisabled={disabled} isLoading={busy === "preferences"}>Zapisz preferencje</Button>
      </form>
    </Section>
    <Section title="Hasło" description="Zmiana wyloguje pozostałe sesje. Operacja wymaga świeżego logowania.">
      <form method="post" className="space-y-4" onSubmit={(event) => {
        const form = event.currentTarget; const data = values(event);
        if (text(data, "newPassword") !== text(data, "confirm")) return invalid("Nowe hasła muszą być identyczne.");
        const body = { currentPassword: text(data, "currentPassword"), newPassword: text(data, "newPassword") };
        form.reset();
        void run("password", async () => { await changePassword(body); await sessions.refetch(); }, "Hasło zostało zmienione. Pozostałe sesje odwołano.");
      }}>
        <Input name="currentPassword" type="password" label="Obecne hasło" isRequired autoComplete="current-password" />
        <Input name="newPassword" type="password" label="Nowe hasło" isRequired minLength={12} autoComplete="new-password" hint="Co najmniej 12 znaków." />
        <Input name="confirm" type="password" label="Powtórz nowe hasło" isRequired minLength={12} autoComplete="new-password" />
        <Button type="submit" isDisabled={disabled} isLoading={busy === "password"}>Zmień hasło</Button>
      </form>
    </Section>
    <Section title="Logowanie dwuetapowe" description="Kod z aplikacji uwierzytelniającej i jednorazowe kody odzyskiwania.">
      <p className="text-sm font-medium text-gray-900">{me.twoFactorEnabled ? "Logowanie dwuetapowe jest włączone." : "Logowanie dwuetapowe nie jest włączone."}</p>
      {enrollment ? <div className="space-y-4">
        {!confirmed && <>
          <p className="text-sm text-gray-600">Dodaj konto w aplikacji uwierzytelniającej. Klucz i adres poniżej są poufne.</p>
          <Input label="Klucz do ręcznego dodania" value={new URL(enrollment.totpURI).searchParams.get("secret") ?? ""} isReadOnly />
          <details className="text-sm"><summary className="cursor-pointer text-gray-700">Pokaż pełny adres konfiguracji TOTP</summary>
            <code className="mt-2 block break-all rounded border border-gray-200 p-3">{enrollment.totpURI}</code></details>
        </>}
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <h3 className="text-sm font-semibold">Zapisz kody odzyskiwania</h3>
          <p className="mt-1 text-sm text-gray-600">Przechowuj je poza aplikacją. Każdy kod działa tylko raz.</p>
          <ul className="mt-3 grid grid-cols-1 gap-2 font-mono text-sm sm:grid-cols-2">{enrollment.backupCodes.map((code) => <li key={code}>{code}</li>)}</ul>
        </div>
        {!confirmed ? <form method="post" className="space-y-4" onSubmit={(event) => {
          const form = event.currentTarget; const code = text(values(event), "code"); form.reset();
          void run("confirm-mfa", async () => { await verifyTotp(code); setConfirmed(true); await refresh(); }, "Logowanie dwuetapowe zostało włączone.");
        }}>
          <Input name="code" label="Kod z aplikacji" inputMode="numeric" autoComplete="one-time-code" isRequired minLength={6} maxLength={6} />
          <Button type="submit" isDisabled={disabled} isLoading={busy === "confirm-mfa"}>Potwierdź i włącz</Button>
        </form> : <Button type="button" color="secondary" onClick={() => { setEnrollment(null); setConfirmed(false); }}>Kody zapisane — ukryj</Button>}
      </div> : <form method="post" className="space-y-4" onSubmit={(event) => {
        const form = event.currentTarget; const password = text(values(event), "password"); form.reset();
        void run("mfa", async () => {
          if (me.twoFactorEnabled) { await disableTotp(password); await refresh(); }
          else { setConfirmed(false); setEnrollment(await enableTotp(password)); }
        }, me.twoFactorEnabled ? "Logowanie dwuetapowe zostało wyłączone." : "Potwierdź konfigurację kodem z aplikacji.");
      }}>
        <Input name="password" type="password" label="Potwierdź obecnym hasłem" isRequired autoComplete="current-password" />
        <Button type="submit" color="secondary" isDisabled={disabled} isLoading={busy === "mfa"}>{me.twoFactorEnabled ? "Wyłącz logowanie dwuetapowe" : "Skonfiguruj logowanie dwuetapowe"}</Button>
      </form>}
    </Section>
    <Section title="Aktywne sesje" description="Lista sesji, nie zweryfikowany rejestr fizycznych urządzeń.">
      {sessions.isPending ? <p role="status" className="text-sm text-gray-600">Wczytywanie sesji…</p> : sessions.isError ? <Alert tone="error">Nie udało się wczytać sesji.</Alert> : <ul className="divide-y divide-gray-200 rounded-lg border border-gray-200">
        {sessions.data.sessions.map((entry) => <li key={entry.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
          <div><p className="text-sm font-medium">{entry.client}{entry.current ? " · Bieżąca sesja" : ""}</p><p className="mt-1 text-xs text-gray-600">Utworzono: {date(entry.createdAt)}</p></div>
          {!entry.current && <Button type="button" color="secondary" isDisabled={disabled} onClick={() => void run("session", async () => { await revokeSession(entry.id); await sessions.refetch(); }, "Sesja została odwołana.")}>Odwołaj</Button>}
        </li>)}
      </ul>}
      <Button type="button" color="secondary" isDisabled={disabled || !sessions.data?.sessions.some((entry) => !entry.current)} onClick={() => void run("sessions", async () => {
        await revokeOtherSessions(); await sessions.refetch();
      }, "Pozostałe sesje zostały odwołane.")}>Wyloguj pozostałe sesje</Button>
    </Section>
    <Section title="Dane konta" description="Pobierz profil i preferencje. Ten eksport nie obejmuje materiałów innych modułów.">
      <Button type="button" color="secondary" isDisabled={disabled} isLoading={busy === "export"} onClick={() => void run("export", async () => {
        const data = await exportAccount(); const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
        const link = document.createElement("a"); link.href = url; link.download = "konto.json";
        document.body.appendChild(link); link.click(); link.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      }, "Eksport danych konta został przygotowany.")}>Pobierz dane konta</Button>
    </Section>
  </div>;
}
