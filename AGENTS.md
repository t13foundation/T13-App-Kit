<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## T13 App Kit rules

- Use the existing modules and the single canonical UI directory
  `src/components/kit` first; do not start a parallel component set.
- White label: white `#FFFFFF`, strictly neutral grays, no brand colors, logo
  or marketing content. The product name comes from `src/app.config.ts`.
- No installer, no wizard, no CLI, no dynamic module engine.
- No secrets in the repository or in the client bundle; `.env*` stays ignored.
- Never delete or rewrite applied migrations, and never rewrite Git history.
- Real implementations only: a mock is not an integration test, and a feature
  without server support is shown as pending, never as a working button.
- Run `node scripts/check-source-integrity.mjs`, the web build and both
  typechecks before reporting work as done.
