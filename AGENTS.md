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

# App Kit

- Implement directly in this repository. Do not delegate implementation to Lovable.
- White label: white background, neutral grays, product name from `src/app.config.ts`.
- Use the real MIT primitives in `src/components/kit`; retain upstream license and provenance.
- Reuse Better Auth. No custom tokens, MFA engine, authentication bypass or fake logged-in user.
- Check access on the server. Never expose session tokens, passwords or recovery codes in listings/logs.
- Keep web and server dependencies separate. No backend/secret imports in browser code.
- No installer, custom CLI, central T13 service or module-manager platform.
- Preserve migration history and local modifications when removing/restoring modules.
- GitHub Minutes are restricted: no automatic Actions, workflow dispatch or broad test matrices.
- At the end of a coherent change, run the minimum relevant checks locally. Do not remove existing tests.
- Record what was actually checked. A syntax check is not a build or an integration test.
- Do not publish, deploy production, change repository visibility or send user data to T13.
