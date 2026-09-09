import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import {
  Alert,
  Button,
  Checkbox,
  Input,
  NativeSelect,
  PageSection,
  TextArea,
  Toggle,
} from "@/components/kit";
import { appConfig } from "@/app.config";

export const Route = createFileRoute("/catalog")({
  head: () => ({
    meta: [
      { title: "Katalog komponentów" },
      {
        name: "description",
        content: "Neutralne komponenty interfejsu używane przez ekrany konta i ustawień.",
      },
      { property: "og:title", content: "Katalog komponentów" },
      {
        property: "og:description",
        content: "Neutralne komponenty interfejsu używane przez ekrany konta i ustawień.",
      },
    ],
  }),
  component: CatalogPage,
});

const copy = {
  pl: {
    title: "Katalog komponentów",
    lead: "Podgląd komponentów dostarczanych z tym zestawem. Działa bez backendu.",
    language: "Język podglądu",
    controls: "Kontrolki",
    controlsDesc: "Przyciski, przełącznik i pole wyboru.",
    forms: "Formularze",
    formsDesc: "Pola tekstowe z etykietą, podpowiedzią i stanem błędu.",
    feedback: "Komunikaty",
    feedbackDesc: "Neutralne komunikaty stanu bez kolorów akcentu.",
    source: "Komponenty bazowe pochodzą z publicznego repozytorium untitleduico/react (MIT).",
  },
  en: {
    title: "Component catalog",
    lead: "Preview of the components shipped with this kit. Works without a backend.",
    language: "Preview language",
    controls: "Controls",
    controlsDesc: "Buttons, switch and checkbox.",
    forms: "Forms",
    formsDesc: "Text fields with label, hint and error state.",
    feedback: "Feedback",
    feedbackDesc: "Neutral status messages without accent colors.",
    source: "Base components come from the public untitleduico/react repository (MIT).",
  },
} as const;

function CatalogPage() {
  const [locale, setLocale] = useState<"pl" | "en">(appConfig.defaultLocale);
  const t = copy[locale];

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight text-gray-900">{t.title}</h1>
      <p className="mt-1 text-sm text-gray-600">{t.lead}</p>

      <div className="mt-6 max-w-xs">
        <NativeSelect
          label={t.language}
          value={locale}
          onChange={(event) => setLocale(event.target.value === "en" ? "en" : "pl")}
          options={[
            { label: "Polski", value: "pl" },
            { label: "English", value: "en" },
          ]}
        />
      </div>

      <PageSection title={t.controls} description={t.controlsDesc}>
        <div className="flex flex-wrap items-center gap-3">
          <Button>Primary</Button>
          <Button color="secondary">Secondary</Button>
          <Button color="tertiary">Tertiary</Button>
          <Button isDisabled>Disabled</Button>
        </div>
        <Checkbox label="Checkbox" hint="Pole wyboru z podpowiedzią." />
        <Toggle label="Toggle" />
        <Example code={`<Button color="secondary">Secondary</Button>`} />
      </PageSection>

      <PageSection title={t.forms} description={t.formsDesc}>
        <Input label="E-mail" placeholder="nazwa@example.com" hint="Adres służbowy lub prywatny." />
        <Input label="Hasło" type="password" isInvalid hint="Hasło jest za krótkie." />
        <TextArea label="Notatka" placeholder="Treść" />
        <Example code={`<Input label="E-mail" hint="Adres służbowy lub prywatny." />`} />
      </PageSection>

      <PageSection title={t.feedback} description={t.feedbackDesc}>
        <Alert title="Neutral">Domyślny komunikat informacyjny.</Alert>
        <Alert tone="success" title="Success">
          Operacja zakończona powodzeniem.
        </Alert>
        <Alert tone="error" title="Error">
          Operacja nie powiodła się.
        </Alert>
        <Example code={`<Alert tone="error" title="Error">Operacja nie powiodła się.</Alert>`} />
      </PageSection>

      <p className="pt-6 text-xs text-gray-600">{t.source}</p>
    </div>
  );
}

function Example({ code }: { code: string }) {
  return (
    <pre className="overflow-x-auto rounded border border-gray-200 bg-gray-50 p-3 text-xs text-gray-900">
      <code>{code}</code>
    </pre>
  );
}
