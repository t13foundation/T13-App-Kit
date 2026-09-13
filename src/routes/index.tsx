import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";

import {
  Alert,
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
    description: "Jedyna warstwa UI: tokeny, prymitywy i bloki stron.",
  },
  {
    term: "src/routes/",
    description: "Trasy TanStack Start: przegląd, prywatne Notes i zachowane ekrany legacy.",
  },
  {
    term: "src/lib/",
    description: "Oficjalny klient Supabase; klient i proxy legacy pozostają odizolowane.",
  },
  { term: "server/", description: "Zachowany backend legacy; nie jest wymagany przez Notes." },
  { term: "shared/", description: "Kontrakty Zod współdzielone przez aplikację i API." },
  { term: "docs/", description: "Karty modułów, instrukcja startu i zapis weryfikacji." },
];

const boundaries = [
  "Bieżący przyrost jest przeznaczony do demonstracji na wydzielonym środowisku testowym.",
  "Interfejs jest po polsku; ustawienie regionalne zmienia formaty dat, nie tłumaczenia.",
  "Pliki, organizacje, role, płatności i moduł AI pozostają zaplanowane, nie dostarczone.",
  "Ustawienia konta i inne funkcje legacy nie są migrowane w tym przyroście.",
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
        description="Punkt wyjścia do aplikacji z kontem użytkownika: jedna warstwa UI, jedno uwierzytelnianie, jeden zestaw kontraktów."
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
                "Prymitywy Untitled UI (MIT) na tokenach w neutralnej skali szarości. Bez drugiej biblioteki komponentów.",
            },
            {
              term: "Granica API",
              description:
                "Notes korzysta z publicznego klucza Supabase. Baza niezależnie sprawdza tożsamość, potwierdzony adres i właściciela danych.",
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
        title="Szybki start"
        description="Cztery kroki do działającej aplikacji z lokalną bazą danych i lokalną skrzynką pocztową."
      >
        <CodeBlock caption="1 — przypięte narzędzia i zależności">
          {"# Node 22.16.0, pnpm 10.34.5\npnpm install --frozen-lockfile"}
        </CodeBlock>
        <CodeBlock caption="2 — konfiguracja (zachowaj istniejący plik)">
          {
            "test -e .env || cp .env.example .env\n# Ustaw publiczny URL i klucz Supabase według docs/supabase.md"
          }
        </CodeBlock>
        <CodeBlock caption="3 — lokalny Supabase i istniejąca migracja">
          {
            "pnpm exec supabase start --exclude storage-api,imgproxy,studio,postgres-meta\npnpm exec supabase migration up --local"
          }
        </CodeBlock>
        <CodeBlock caption="4 — uruchomienie aplikacji">
          {"pnpm dev --host 127.0.0.1 --port 4311 --strictPort"}
        </CodeBlock>
        <Panel
          title="Konto i prywatne dane"
          description="Zarejestruj konto, potwierdź kod z wiadomości i utwórz własną notatkę."
        >
          <p className="text-sm text-tertiary">
            Pełna instrukcja przygotowania bazy i lokalnej poczty: docs/supabase.md. Notes nie
            wymaga uruchamiania backendu legacy.
          </p>
          <Button href="/notes">Otwórz prywatne notatki</Button>
        </Panel>
      </PageSection>

      <PageSection
        id="struktura"
        title="Struktura repozytorium"
        description="Każdy katalog ma jedno zadanie. Nie ma równoległej warstwy UI ani drugiego klienta uwierzytelniania."
      >
        <SpecList items={structure} />
      </PageSection>

      <ComponentsSection />

      <PageSection
        id="granice"
        title="Granice tego wydania"
        description="Spis rzeczy, których ten zestaw nie dostarcza. Lista jest celowo wprost."
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
        description="Trwałe ustalenia są w repozytorium, nie na tej stronie."
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
      description="Pełny zestaw prymitywów dostarczanych z tym kitem. Te same pliki i te same rozmiary są w T13 Site Kit."
    >
      <Showcase
        name="Button"
        description="Trzy warianty barwne i stan ładowania. Z atrybutem href renderuje się jako link."
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
        description="Etykieta, podpowiedź i stan błędu są częścią komponentu, nie osobnym układem."
        code={'<Input label="E-mail" hint="Adres służbowy lub prywatny." />'}
      >
        <div className="grid w-full gap-4 sm:grid-cols-2">
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
        description="Wieloliniowe pole tekstowe o tej samej wysokości wiersza i tych samych stanach co Input."
        code={'<TextArea label="Notatka" placeholder="Treść" />'}
      >
        <div className="w-full sm:max-w-sm">
          <TextArea label="Notatka" placeholder="Treść" />
        </div>
      </Showcase>

      <Showcase
        name="NativeSelect"
        description="Natywna lista wyboru — działa na klawiaturze i na urządzeniach mobilnych bez dodatkowego kodu."
        code={
          '<NativeSelect label="Formaty regionalne" options={[{ value: "pl", label: "Polskie" }]} />'
        }
      >
        <div className="w-full sm:max-w-xs">
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
        description="Dwie kontrolki binarne. Checkbox przyjmuje podpowiedź, Toggle zmienia stan natychmiast."
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
        description="Ton niosą ikona, treść i rola ARIA — nigdy sam kolor. Dzięki temu kit pozostaje neutralny."
        code={'<Alert tone="error" title="Nie udało się zapisać">Spróbuj ponownie.</Alert>'}
      >
        <div className="flex w-full flex-col gap-3">
          <Alert title="Informacja">Operacja nie wymaga potwierdzenia.</Alert>
          <Alert tone="success" title="Zapisano">
            Zmiany zostały utrwalone.
          </Alert>
          <Alert tone="error" title="Nie udało się zapisać">
            Spróbuj ponownie. Nieukończona operacja nie jest potwierdzeniem zapisu.
          </Alert>
        </div>
      </Showcase>

      <Showcase
        name="Badge"
        description="Krótki fakt przy nagłówku: licencja, element stosu, status modułu."
        code={'<Badge>MIT</Badge>\n<Badge tone="subtle">planowane</Badge>'}
      >
        <Badge>MIT</Badge>
        <Badge>TanStack Start</Badge>
        <Badge tone="subtle">planowane</Badge>
      </Showcase>

      <Showcase
        name="Panel"
        description="Karta z obramowaniem grupująca powiązane kontrolki wewnątrz sekcji."
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
        description="Polecenie lub fragment kodu. Przewija się w poziomie, więc komenda nigdy nie łamie się po cichu."
        code={'<CodeBlock caption="instalacja">pnpm install</CodeBlock>'}
      >
        <CodeBlock className="w-full" caption="instalacja">
          pnpm install --frozen-lockfile
        </CodeBlock>
      </Showcase>

      <p className="text-xs text-tertiary">
        Prymitywy pochodzą z publicznego repozytorium untitleduico/react (MIT). Pochodzenie i zakres
        vendorowania opisuje third-party/untitledui-react/SOURCE.md. Nazwa produktu w powłoce to „
        {appConfig.name}” i pochodzi z app.config.ts.
      </p>
    </PageSection>
  );
}
