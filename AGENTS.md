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

- GitHub Issues and native dependencies are the task/status source. Start with the current issue and [accepted scope](https://github.com/t13foundation/T13-App-Kit/issues/2), then [Polish specification](docs/specyfikacja.md) and [Supabase contract](docs/supabase.md).
- Implement directly in GitHub, never by delegating generation to Lovable. Preserve history and unique work; no force push, destructive reset or migration rewrite.
- Accepted stack: TanStack Start, React, Supabase Auth/PostgreSQL/Storage, Cloudflare. Use existing MIT Untitled components in `src/components/kit`; no parallel UI library or custom authentication.
- The first slice lives at `/notes`. Legacy Better Auth/Fastify/Drizzle code and routes stay isolated until replacement acceptance. Legacy docs describe that old path, not the accepted target.
- Keep white/neutral configurable branding. No installer, custom CLI, dynamic module engine or unrelated product features.
- All private data requires database RLS and a verified account. Do not trust user metadata for authorization. Sensitive operations need fresh/live authorization in their own later slice.
- This first Supabase client persists provider-managed sessions in browser storage. It does NOT promise HttpOnly-only tokens or immediate JWT revocation. Never copy tokens into app state stores, logs, files, exports or telemetry. Never expose secret/service_role keys.
- Prefer direct public API calls governed by RLS; do not add privileged-key endpoints to bypass policies. Do not share authenticated clients or user data across SSR requests.
- Pin runtime/packages and generate real lockfiles, migrations, database types and route trees. Never fabricate generated outputs or call a hand-authored schema an applied migration.
- Keep legacy web/API dependencies separated; ignore local environment files and preserve useful security tests. Retire conflicting lockfiles only with a verified replacement.
- GitHub CI remains manual-only. Run minimum relevant checks at the end; no push/PR triggers, broad matrices or surprise GitHub Minutes.
- Report syntax, focused tests, full typecheck, build, API and browser evidence separately. Never substitute mocks/static checks for actual RLS or reuse old passes.
- WBS-APP1-01 needs a demonstrated first slice and Marek's GO before later hardening. Keep incomplete work draft/open; no release tag before acceptance.
- No production deployment, publication, visibility changes, paid activation or Site Kit writes without a separate request.
