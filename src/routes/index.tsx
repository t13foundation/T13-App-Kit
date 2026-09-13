import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";

import {
  Alert,
  LayoutShowcase,
  Badge,
  Button,
  Checkbox,
  CodeBlock,
  Input,
  NativeSelect,
  PageHeader,
  PageSection,
  Panel,
  Showcase,
  SpecList,
  TextArea,
  Toggle,
} from "@/components/kit";
import { appConfig, kitInfo } from "@/app.config";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: `${kitInfo.name} — przegląd` },
      { name: "description", content: kitInfo.summary },
    ],
  }),
  component: Overview,
});

const structure = [
  {
    term: "src/components/kit/",
    description: "Wspólne komponenty, układy i ustawienia wyglądu.",
  },
  {
    term: "src/routes/",
    description: "Trasy TanStack Start: przegląd, prywatne Notes i zachowane ekrany legacy.",
  },
  {
    term: "src/lib/",
    description: "Oficjalny klient Supabase. Klient i proxy legacy są odizolowane.",
  },
  { term: "server/", description: "Zachowany backend legacy, którego Notes nie wymaga." },
  { term: "shared/", description: "Kontrakty Zod współdzielone przez aplikację i API." },
  { term: "docs/", description: "Dokumentacja modułów, startu i weryfikacji." },
];

const boundaries = [
  "Obecna wersja służy do sprawdzenia zestawu na danych testowych.",
  "Interfejs jest po polsku. Ustawienie regionalne zmienia format dat, ale nie język.",
  "Pliki, organizacje, role, płatności i moduł AI są zaplanowane, ale jeszcze niedostarczone.",
  "Ustawienia konta i inne funkcje legacy nie zostały jeszcze przeniesione.",
];

function Overview() {
  return (
    <>
      <PageHeader
        eyebrow={kitInfo.name}
        title={kitInfo.title}
        description={kitInfo.summary}
        meta={kitInfo.stack.map((item) => (
          <Badge key={item}>{item}</Badge>
        ))}
        actions={
          <>
            <Button href="#start">Szybki start</Button>
            <Button href="#komponenty" color="secondary">
              Zobacz komponenty
            </Button>
            <Button href="/notes" color="tertiary">
              Prywatne notatki
            </Button>
          </>
        }
      />

      <PageSection
        id="czym-jest"
        title="Czym jest ten zestaw"
        description="Zacznij od gotowej bazy. Poniżej sprawdzisz, co już działa, jak uruchomić projekt i z których elementów korzystać przy jego rozbudowie."
      >
        <SpecList
          items={[
            {
              term: "Uwierzytelnianie",
              description:
                "Supabase Auth: rejestracja, kod potwierdzający, logowanie i wylogowanie.",
            },
            {
              term: "Interfejs",
              description:
                "Komponenty Untitled UI na licencji MIT. Kolory i odstępy są wspólne dla całej aplikacji.",
            },
            {
              term: "Prywatne dane",
              description:
                "Notes używa publicznego klucza Supabase. Baza sprawdza tożsamość, potwierdzony adres i właściciela danych.",
            },
            {
              term: "Marka",
              description:
                "Nazwa produktu pochodzi z app.config.ts. Nazwa „T13 App Kit” występuje wyłącznie w dokumentacji dla programisty.",
            },
          ]}
        />
      </PageSection>

      <PageSection
        id="start"
        title="Szybki start dla programisty"
        description="Przygotuj lokalną bazę i skrzynkę pocztową, a potem uruchom aplikację."
      >
        <CodeBlock caption="1 — zainstaluj przypięte zależności">
          {"# Node 22.16.0, pnpm 10.34.5\npnpm install --frozen-lockfile"}
        </CodeBlock>
        <CodeBlock caption="2 — skonfiguruj środowisko (zachowaj istniejący plik)">
          {
            "test -e .env || cp .env.example .env\n# Ustaw publiczny URL i klucz Supabase według docs/supabase.md"
          }
        </CodeBlock>
        <CodeBlock caption="3 — uruchom lokalny Supabase i migrację">
          {
            "pnpm exec supabase start --exclude storage-api,imgproxy,studio,postgres-meta\npnpm exec supabase migration up --local"
          }
        </CodeBlock>
        <CodeBlock caption="4 — uruchom aplikację">
          {"pnpm dev --host 127.0.0.1 --port 4311 --strictPort"}
        </CodeBlock>
        <Panel
          title="Sprawdź konto i notatki"
          description="W aplikacji zarejestruj konto, potwierdź kod z wiadomości i utwórz prywatną notatkę."
        >
          <p className="text-sm text-tertiary">
            Pełna instrukcja przygotowania bazy i lokalnej poczty: docs/supabase.md. Notes działa
            bez uruchamiania backendu legacy.
          </p>
          <Button href="/notes">Otwórz prywatne notatki</Button>
        </Panel>
      </PageSection>

      <PageSection
        id="struktura"
        title="Struktura repozytorium"
        description="Każdy katalog ma jedno zadanie. Aplikacja korzysta z jednej warstwy UI i jednego klienta uwierzytelniania."
      >
        <SpecList items={structure} />
      </PageSection>

      <PageSection
        id="uklady"
        title="Gotowe układy stron"
        description="Te same szerokości i odstępy na każdej stronie. Układ dopasowuje się do dostępnego miejsca."
      >
        <LayoutShowcase />
      </PageSection>

      <ComponentsSection />

      <PageSection
        id="granice"
        title="Stan zestawu"
        description="Ta lista pokazuje, czego zestaw jeszcze nie dostarcza."
      >
        <ul className="flex flex-col gap-2">
          {boundaries.map((item) => (
            <li key={item} className="flex gap-3 text-sm text-tertiary">
              <span
                aria-hidden="true"
                className="mt-2 size-1 shrink-0 rounded-full bg-quaternary"
              />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </PageSection>

      <PageSection
        id="dalej"
        title="Dokumentacja"
        description="Aktualne ustalenia są w repozytorium."
      >
        <SpecList
          items={[
            {
              term: "README.md",
              description: "Przeznaczenie, architektura i zakres dostarczenia.",
            },
            { term: "docs/start.md", description: "Pełna instrukcja uruchomienia lokalnego." },
            { term: "docs/status.md", description: "Co zostało zweryfikowane i czym dokładnie." },
            { term: "AGENTS.md", description: "Zasady pracy nad tym repozytorium." },
          ]}
        />
      </PageSection>
    </>
  );
}

function ComponentsSection() {
  const [accepted, setAccepted] = useState(false);
  const [compact, setCompact] = useState(false);

  return (
    <PageSection
      id="komponenty"
      title="Komponenty"
      description="Gotowe komponenty do wykorzystania w projekcie. Te same pliki i rozmiary są w T13 Site Kit."
    >
      <Showcase
        name="Button"
        description="Trzy warianty kolorów i stan ładowania. Z atrybutem href przycisk staje się linkiem."
        code={
          '<Button>Zapisz</Button>\n<Button color="secondary">Anuluj</Button>\n<Button color="tertiary">Pomiń</Button>'
        }
      >
        <Button>Zapisz</Button>
        <Button color="secondary">Anuluj</Button>
        <Button color="tertiary">Pomiń</Button>
        <Button isLoading>Zapisywanie</Button>
        <Button isDisabled>Niedostępny</Button>
      </Showcase>

      <Showcase
        name="Input"
        description="Komponent obejmuje etykietę, podpowiedź i komunikat błędu."
        code={'<Input label="E-mail" hint="Adres służbowy lub prywatny." />'}
      >
        <div className="kit-grid w-full">
          <Input
            label="E-mail"
            placeholder="nazwa@example.com"
            hint="Adres służbowy lub prywatny."
          />
          <Input label="Hasło" type="password" isInvalid hint="Hasło jest za krótkie." />
        </div>
      </Showcase>

      <Showcase
        name="TextArea"
        description="Wielowierszowe pole tekstowe z tymi samymi stanami co Input."
        code={'<TextArea label="Notatka" placeholder="Treść" />'}
      >
        <div data-measure="form" className="kit-measure">
          <TextArea label="Notatka" placeholder="Treść" />
        </div>
      </Showcase>

      <Showcase
        name="NativeSelect"
        description="Natywna lista wyboru działa z klawiaturą i na telefonie bez dodatkowego kodu."
        code={
          '<NativeSelect label="Formaty regionalne" options={[{ value: "pl", label: "Polskie" }]} />'
        }
      >
        <div data-measure="form" className="kit-measure">
          <NativeSelect
            label="Formaty regionalne"
            hint="Wybór zmienia formaty, nie tłumaczenia."
            options={[
              { value: "pl", label: "Polskie" },
              { value: "en", label: "English" },
            ]}
          />
        </div>
      </Showcase>

      <Showcase
        name="Checkbox i Toggle"
        description="Dwa sposoby wyboru opcji. Checkbox obsługuje podpowiedź, a Toggle zmienia stan od razu."
        code={
          '<Checkbox label="Akceptuję warunki" hint="Wymagane do założenia konta." />\n<Toggle label="Widok kompaktowy" />'
        }
      >
        <div className="flex flex-col gap-4">
          <Checkbox
            label="Akceptuję warunki"
            hint="Wymagane do założenia konta."
            isSelected={accepted}
            onChange={setAccepted}
          />
          <Toggle label="Widok kompaktowy" isSelected={compact} onChange={setCompact} />
          <p className="text-sm text-tertiary" role="status">
            Zgoda: {accepted ? "udzielona" : "brak"} · Widok: {compact ? "kompaktowy" : "domyślny"}
          </p>
        </div>
      </Showcase>

      <Showcase
        name="Alert"
        description="Znaczenie komunikatu przekazują ikona, treść i rola ARIA, a nie sam kolor."
        code={'<Alert tone="error" title="Nie udało się zapisać">Spróbuj ponownie.</Alert>'}
      >
        <div className="flex w-full flex-col gap-3">
          <Alert title="Informacja">Operacja nie wymaga potwierdzenia.</Alert>
          <Alert tone="success" title="Zapisano">
            Zmiany zostały utrwalone.
          </Alert>
          <Alert tone="error" title="Nie udało się zapisać">
            Sprawdź połączenie i spróbuj ponownie.
          </Alert>
        </div>
      </Showcase>

      <Showcase
        name="Badge"
        description="Krótka informacja przy nagłówku: licencja, technologia lub status modułu."
        code={'<Badge>MIT</Badge>\n<Badge tone="subtle">planowane</Badge>'}
      >
        <Badge>MIT</Badge>
        <Badge>TanStack Start</Badge>
        <Badge tone="subtle">planowane</Badge>
      </Showcase>

      <Showcase
        name="Panel"
        description="Obramowana karta grupuje powiązane kontrolki w sekcji."
        code={'<Panel title="Połączenie z API" description="Sprawdzane na żywo.">…</Panel>'}
      >
        <Panel
          className="w-full"
          title="Przykładowy panel"
          description="Nagłówek, opis i miejsce na treść."
        >
          <p className="text-sm text-tertiary">Treść panelu.</p>
        </Panel>
      </Showcase>

      <Showcase
        name="CodeBlock"
        description="Polecenie lub fragment kodu. Dłuższe treści przewijają się poziomo."
        code={'<CodeBlock caption="instalacja">pnpm install</CodeBlock>'}
      >
        <CodeBlock className="w-full" caption="instalacja">
          pnpm install --frozen-lockfile
        </CodeBlock>
      </Showcase>

      <p className="text-xs text-tertiary">
        Komponenty pochodzą z publicznego repozytorium untitleduico/react (MIT). Źródła i licencję
        opisuje third-party/untitledui-react/SOURCE.md. Nazwa produktu w powłoce to „
        {appConfig.name}” i pochodzi z app.config.ts.
      </p>
    </PageSection>
  );
}
