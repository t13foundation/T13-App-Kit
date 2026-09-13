import { useEffect, useRef, useState, type FormEvent } from "react";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { Alert, Button, Input, TextArea, PageLayout, FormLayout } from "../../components/kit";
import type { Database } from "../../lib/supabase/database.types";
import { deleteNote, listNotes, saveNote, type Note, type NotesClient } from "./repository";
import { NOTE_BODY_LIMIT, NOTE_TITLE_LIMIT } from "./validation";

type Client = SupabaseClient<Database>;
type AuthMode = "sign-in" | "sign-up" | "verify";

export function SupabaseWorkspace() {
  const [client, setClient] = useState<Client | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    let active = true;
    let unsubscribe = () => {};
    let authVersion = 0;
    void import("../../lib/supabase/browser")
      .then(async ({ getBrowserSupabase }) => {
        const next = getBrowserSupabase();
        if (!active) return;
        setClient(next);
        if (!next) {
          setLoading(false);
          return;
        }
        // This is display state only. The database independently checks identity and verification.
        const { data: listener } = next.auth.onAuthStateChange((_event, session) => {
          authVersion += 1;
          if (active) setUser(session?.user.email_confirmed_at ? session.user : null);
        });
        unsubscribe = () => listener.subscription.unsubscribe();
        const initialVersion = authVersion;
        const { data, error } = await next.auth.getSession();
        if (!active) return;
        if (error) setNotice("Nie udało się odczytać sesji. Spróbuj zalogować się ponownie.");
        if (authVersion === initialVersion)
          setUser(data.session?.user.email_confirmed_at ? data.session.user : null);
        setLoading(false);
      })
      .catch(() => {
        if (active) {
          setNotice("Konfiguracja Supabase jest nieprawidłowa. Sprawdź instrukcję uruchomienia.");
          setLoading(false);
        }
      });
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  return (
    <PageLayout
      title="Prywatne notatki"
      description="Zapisuj i edytuj własne notatki. Dostęp do nich masz tylko Ty."
    >
      {notice && <Alert tone="error">{notice}</Alert>}
      {loading ? (
        <p role="status">Wczytywanie sesji…</p>
      ) : !client ? (
        <Alert title="Supabase nie jest skonfigurowany">
          Ustaw VITE_SUPABASE_URL i VITE_SUPABASE_PUBLISHABLE_KEY, zastosuj migrację Notes i uruchom
          aplikację ponownie. Instrukcja: docs/supabase.md.
        </Alert>
      ) : !user ? (
        <AuthPanel client={client} />
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-secondary pb-4">
            <p className="min-w-0 break-all text-sm text-tertiary">Zalogowano: {user.email}</p>
            <Button
              color="secondary"
              isLoading={signingOut}
              isDisabled={signingOut}
              onClick={() => {
                if (signingOut) return;
                setSigningOut(true);
                setNotice(null);
                void client.auth
                  .signOut({ scope: "local" })
                  .then(({ error }) => {
                    if (error) setNotice("Nie potwierdzono wylogowania. Spróbuj ponownie.");
                  })
                  .catch(() => setNotice("Nie potwierdzono wylogowania. Spróbuj ponownie."))
                  .finally(() => setSigningOut(false));
              }}
            >
              Wyloguj się
            </Button>
          </div>
          {/* Unmounting discards the previous account's drafts and query state. */}
          <NotesBoard key={user.id} client={client} actorId={user.id} />
        </>
      )}
    </PageLayout>
  );
}

function AuthPanel({ client }: { client: Client }) {
  const [mode, setMode] = useState<AuthMode>("sign-in");
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const pendingRef = useRef(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const title =
    mode === "sign-in" ? "Zaloguj się" : mode === "sign-up" ? "Utwórz konto" : "Potwierdź e-mail";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pendingRef.current) return;
    const form = event.currentTarget;
    const values = new FormData(form);
    const address = String(values.get("email") ?? "").trim();
    setEmail(address);
    pendingRef.current = true;
    setPending(true);
    setError(null);
    setMessage(null);
    try {
      if (mode === "sign-up") {
        const result = await client.auth.signUp({
          email: address,
          password: String(values.get("password") ?? ""),
        });
        if (result.error) throw new Error();
        // Changing the form key removes the password while retaining the confirmation address.
        setMode("verify");
        setMessage("Sprawdź pocztę i wpisz sześciocyfrowy kod z wiadomości.");
      } else if (mode === "verify") {
        const result = await client.auth.verifyOtp({
          email: address,
          token: String(values.get("code") ?? "").trim(),
          type: "signup",
        });
        if (result.error) throw new Error();
        form.reset();
      } else {
        const result = await client.auth.signInWithPassword({
          email: address,
          password: String(values.get("password") ?? ""),
        });
        if (result.error) throw new Error();
        form.reset();
      }
    } catch {
      setError(
        mode === "verify"
          ? "Kod jest nieprawidłowy lub wygasł. Możesz poprosić o nowy."
          : "Operacja nie powiodła się. Sprawdź dane, potwierdzenie adresu i połączenie.",
      );
    } finally {
      pendingRef.current = false;
      setPending(false);
    }
  }

  return (
    <FormLayout>
      <section aria-labelledby="notes-auth-title" className="kit-stack">
        <h2 id="notes-auth-title" className="text-lg font-semibold">
          {title}
        </h2>
        <p className="text-sm text-tertiary">
          {mode === "sign-in"
            ? "Zaloguj się, aby otworzyć swoje notatki."
            : mode === "sign-up"
              ? "Podaj e-mail i hasło. Następnie potwierdź adres kodem z wiadomości."
              : "Wpisz sześciocyfrowy kod wysłany na Twój adres e-mail."}
        </p>
        {message && <Alert tone="success">{message}</Alert>}
        {error && <Alert tone="error">{error}</Alert>}
        <form
          key={mode}
          method="post"
          onSubmit={(event) => {
            void submit(event);
          }}
          className="space-y-4"
        >
          <Input
            name="email"
            label="E-mail"
            type="email"
            autoComplete="email"
            isRequired
            isDisabled={pending}
            value={email}
            onChange={setEmail}
          />
          {mode === "verify" ? (
            <Input
              name="code"
              label="Kod z wiadomości"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6}"
              minLength={6}
              maxLength={6}
              isRequired
              isDisabled={pending}
            />
          ) : (
            <Input
              name="password"
              label="Hasło"
              type="password"
              autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
              minLength={mode === "sign-up" ? 12 : undefined}
              isRequired
              isDisabled={pending}
              hint={mode === "sign-up" ? "Minimum 12 znaków." : undefined}
            />
          )}
          <Button type="submit" isLoading={pending} isDisabled={pending}>
            {title}
          </Button>
        </form>
        <div className="flex flex-wrap gap-3">
          {mode !== "sign-in" && (
            <Button
              color="secondary"
              isDisabled={pending}
              onClick={() => {
                setMode("sign-in");
                setError(null);
                setMessage(null);
              }}
            >
              Mam już konto
            </Button>
          )}
          {mode !== "sign-up" && (
            <Button
              color="secondary"
              isDisabled={pending}
              onClick={() => {
                setMode("sign-up");
                setError(null);
                setMessage(null);
              }}
            >
              Nowe konto
            </Button>
          )}
          {mode !== "verify" && (
            <Button
              color="tertiary"
              isDisabled={pending}
              onClick={() => {
                setMode("verify");
                setError(null);
                setMessage(null);
              }}
            >
              Mam kod potwierdzający
            </Button>
          )}
          {mode === "verify" && (
            <Button
              color="secondary"
              isDisabled={pending || !email}
              onClick={() => {
                if (pendingRef.current) return;
                pendingRef.current = true;
                setPending(true);
                setError(null);
                setMessage(null);
                void client.auth
                  .resend({ type: "signup", email })
                  .then(({ error: cause }) => {
                    if (cause)
                      setError(
                        "Nie potwierdzono wysłania kodu. Odczekaj chwilę i spróbuj ponownie.",
                      );
                    else setMessage("Jeżeli adres oczekuje na potwierdzenie, otrzymasz nowy kod.");
                  })
                  .catch(() => setError("Nie potwierdzono wysłania kodu."))
                  .finally(() => {
                    pendingRef.current = false;
                    setPending(false);
                  });
              }}
            >
              Wyślij kod ponownie
            </Button>
          )}
        </div>
      </section>
    </FormLayout>
  );
}

function NotesBoard({ client, actorId }: { client: NotesClient; actorId: string }) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [revision, setRevision] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [editing, setEditing] = useState<Note | null | undefined>(undefined);
  const [removing, setRemoving] = useState<Note | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    setLoading(true);
    setError(null);
    setNotes([]);
    setHasMore(false);
    void listNotes(client, actorId, page, controller.signal)
      .then((result) => {
        if (active) {
          setNotes(result.notes);
          setHasMore(result.hasMore);
        }
      })
      .catch((cause: unknown) => {
        if (active)
          setError(cause instanceof Error ? cause.message : "Nie udało się wczytać notatek.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
      controller.abort();
    };
  }, [client, actorId, page, revision]);

  async function mutate(action: () => Promise<unknown>, success: string) {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      await action();
      setEditing(undefined);
      setRemoving(null);
      setMessage(success);
      setPage(0);
      setRevision((value) => value + 1);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Nie udało się potwierdzić zmiany. Sprawdź notatkę przed ponowieniem.",
      );
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }

  return (
    <section aria-labelledby="notes-list-title" className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="notes-list-title" className="text-lg font-semibold">
          Twoje notatki
        </h2>
        <div className="flex flex-wrap gap-2">
          <Button
            isDisabled={busy}
            onClick={() => {
              setEditing(null);
              setRemoving(null);
              setMessage(null);
            }}
          >
            Nowa notatka
          </Button>
          <Button
            color="secondary"
            isDisabled={busy || loading}
            onClick={() => {
              setEditing(undefined);
              setRemoving(null);
              setRevision((value) => value + 1);
            }}
          >
            Odśwież listę
          </Button>
        </div>
      </div>
      {error && <Alert tone="error">{error}</Alert>}
      {message && <Alert tone="success">{message}</Alert>}
      {editing !== undefined && (
        <form
          key={editing ? `${editing.id}:${editing.updated_at}` : "new"}
          method="post"
          data-measure="form"
          className="kit-measure space-y-4 rounded-xl border border-secondary p-4"
          onSubmit={(event) => {
            event.preventDefault();
            const values = new FormData(event.currentTarget);
            const draft = {
              title: String(values.get("title") ?? ""),
              body: String(values.get("body") ?? ""),
            };
            void mutate(
              () => saveNote(client, actorId, draft, editing ?? undefined),
              "Notatka została zapisana.",
            );
          }}
        >
          <h3 className="font-semibold">{editing ? "Edytuj notatkę" : "Nowa notatka"}</h3>
          <Input
            name="title"
            label="Tytuł"
            defaultValue={editing?.title ?? ""}
            maxLength={NOTE_TITLE_LIMIT}
            isRequired
            isDisabled={busy}
            autoFocus
          />
          <TextArea
            name="body"
            label="Treść"
            defaultValue={editing?.body ?? ""}
            maxLength={NOTE_BODY_LIMIT}
            isDisabled={busy}
            rows={6}
          />
          <div className="flex flex-wrap gap-3">
            <Button type="submit" isLoading={busy} isDisabled={busy}>
              Zapisz notatkę
            </Button>
            <Button color="secondary" isDisabled={busy} onClick={() => setEditing(undefined)}>
              Anuluj edycję
            </Button>
          </div>
        </form>
      )}
      {removing && (
        <div role="alert" className="space-y-3 rounded-xl border border-primary p-4">
          <p className="break-words">
            Usunąć notatkę „{removing.title}”? Tej operacji nie można cofnąć.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button
              isLoading={busy}
              isDisabled={busy}
              onClick={() => {
                void mutate(
                  () => deleteNote(client, actorId, removing),
                  "Notatka została usunięta.",
                );
              }}
            >
              Potwierdź usunięcie
            </Button>
            <Button color="secondary" isDisabled={busy} onClick={() => setRemoving(null)}>
              Anuluj usunięcie
            </Button>
          </div>
        </div>
      )}
      {loading ? (
        <p role="status">Wczytywanie notatek…</p>
      ) : notes.length === 0 ? (
        <p className="text-sm text-tertiary">
          {error
            ? "Lista nie jest dostępna. Spróbuj ją odświeżyć."
            : page === 0
              ? "Nie ma tu jeszcze notatek. Utwórz pierwszą."
              : "Na tej stronie nie ma już notatek. Wróć do poprzedniej."}
        </p>
      ) : (
        <ul className="space-y-3">
          {notes.map((note) => (
            <li key={note.id} className="space-y-3 rounded-xl border border-secondary p-4">
              <h3 className="break-words font-semibold">{note.title}</h3>
              <p
                data-measure="prose"
                className="kit-measure whitespace-pre-wrap break-words text-sm text-secondary"
              >
                {note.body}
              </p>
              <div className="flex flex-wrap gap-3">
                <Button
                  color="secondary"
                  isDisabled={busy}
                  onClick={() => {
                    setEditing(note);
                    setRemoving(null);
                  }}
                >
                  Edytuj
                </Button>
                <Button
                  color="tertiary"
                  isDisabled={busy}
                  onClick={() => {
                    setRemoving(note);
                    setEditing(undefined);
                  }}
                >
                  Usuń
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <nav aria-label="Strony notatek" className="flex flex-wrap items-center gap-3">
        <Button
          color="secondary"
          isDisabled={busy || loading || page === 0}
          onClick={() => {
            setEditing(undefined);
            setRemoving(null);
            setPage((value) => value - 1);
          }}
        >
          Poprzednia
        </Button>
        <span className="text-sm text-tertiary">Strona {page + 1}</span>
        <Button
          color="secondary"
          isDisabled={busy || loading || !hasMore}
          onClick={() => {
            setEditing(undefined);
            setRemoving(null);
            setPage((value) => value + 1);
          }}
        >
          Następna
        </Button>
      </nav>
    </section>
  );
}
