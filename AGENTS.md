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

## App Kit rules

- Implement directly in GitHub. Do not delegate code generation to Lovable.
- Reuse `src/components/kit`, real MIT sources and Better Auth. No parallel UI library or custom authentication.
- White background, neutral grays, configurable product name. No required T13 branding.
- Preserve both sides when reconciling branches. No force push, destructive reset or migration rewrite.
- No installer, wizard, custom CLI or dynamic module engine.
- Every private endpoint checks the session and verified account. Sensitive changes require fresh authentication.
- No secrets, raw session tokens, passwords or recovery codes in logs, repository, browser storage or exports.
- Keep web/API dependencies separate. Ignore local environment files; do not restore historical `.env.test` files.
- GitHub Minutes are limited. Main CI remains manual-only; no test on every commit and no broad matrices.
- Run the minimum relevant checks at the end of a coherent increment. Preserve existing tests and their database guards.
- Report exact results: syntax, full typecheck, build and integration are different checks. Never reuse an old pass for new code.
- No production deployment, publication, visibility change, paid cloud enablement or changes to Site Kit without a separate request.
