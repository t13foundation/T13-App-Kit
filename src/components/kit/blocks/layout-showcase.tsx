import { ArticleLayout, ContentGrid, FormLayout, SidebarLayout } from "../layout/layouts";
import { CodeBlock } from "./code-block";

export function LayoutShowcase() {
  return (
    <div className="kit-stack">
      <p className="kit-measure text-sm text-tertiary" data-measure="prose">
        Wybierz gotowy układ przy dodawaniu strony. Szerokości, marginesy i odstępy zmienisz dla
        całego projektu w jednym pliku: themes/layout.css.
      </p>
      <ContentGrid>
        <div className="kit-stack rounded-lg border border-secondary p-5">
          <h3 className="font-semibold">Strona — page</h3>
          <p className="text-sm text-tertiary">
            Do 80 rem. Nagłówek i treść wyrównane z nawigacją. Tabele mogą korzystać z wariantu
            wide: do 96 rem.
          </p>
        </div>
        <div className="rounded-lg border border-secondary p-5">
          <FormLayout>
            <h3 className="font-semibold">Formularz — form</h3>
            <p className="text-sm text-tertiary">
              Do 32 rem. Pola zachowują czytelną szerokość również na dużym ekranie.
            </p>
          </FormLayout>
        </div>
        <div className="rounded-lg border border-secondary p-5">
          <ArticleLayout>
            <h3 className="font-semibold">Artykuł — prose</h3>
            <p className="text-sm text-tertiary">
              Do 65 ch. Dłuższy tekst pozostaje wygodny do czytania. Na wąskim ekranie zajmuje
              dostępne miejsce.
            </p>
          </ArticleLayout>
        </div>
      </ContentGrid>
      <SidebarLayout
        sidebar={
          <div className="rounded-lg bg-secondary p-5">
            <h3 className="font-semibold">Boczna nawigacja</h3>
            <p className="mt-2 text-sm text-tertiary">Na wąskim ekranie pojawia się nad treścią.</p>
          </div>
        }
      >
        <div className="rounded-lg border border-secondary p-5">
          <h3 className="font-semibold">Treść strony</h3>
          <p className="mt-2 text-sm text-tertiary">
            Ten przykład korzysta z gotowego SidebarLayout. Zmień szerokość okna, aby zobaczyć
            zmianę układu.
          </p>
        </div>
      </SidebarLayout>
      <CodeBlock caption="Układy dostępne w src/components/kit">
        {
          '<PageLayout title="Ustawienia">…</PageLayout>\n<FormLayout>…</FormLayout>\n<ArticleLayout>…</ArticleLayout>\n<SidebarLayout sidebar={navigation}>…</SidebarLayout>\n<ContentGrid>…</ContentGrid>'
        }
      </CodeBlock>
    </div>
  );
}
