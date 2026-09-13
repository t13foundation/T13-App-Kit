# App Kit in Lovable

Build on the shipped foundation. Adapt configuration to the selected environment;
do not regenerate accounts, Notes, UI, or migrations. This is an onboarding
contract, not evidence that the current kit has passed a Lovable remix.

## Start with the existing code

- **Without Lovable:** clone the kit, follow [docs/start.md](docs/start.md) and
  [docs/supabase.md](docs/supabase.md), then deploy the same source to your own Cloudflare target.
- **With Lovable:** remix the maintained App Kit project, then connect the remix
  to its own GitHub repository. Verify the source commit, preview and linked branch.
  Both kits originated in Lovable; `.lovable` metadata alone does not prove current compatibility.
  Do not advertise a ready remix link before testing that exact base project.
- Lovable supports Git sync for a connected project, but does not currently import
  arbitrary repositories. Preserve its repository connection and published history.
  See [GitHub integration](https://docs.lovable.dev/integrations/github).

Read this file once for setup, then only the module needed for the requested
feature. Root `AGENTS.md` points here because Lovable
[reads root instruction files](https://docs.lovable.dev/features/knowledge).

## Select one backend; reuse what is already connected

| Environment | Accounts and database | Signup email | OAuth when requested |
| --- | --- | --- | --- |
| Local development | Local Supabase | Mailpit test inbox | Provider configuration only when needed |
| Lovable + your Supabase | Your existing dedicated Supabase project | Configured Auth SMTP sender | Supabase Auth provider configuration |
| Lovable Cloud | Cloud-managed backend, after compatibility checks below | Cloud Auth sender | Managed Google login, if enabled |
| GitHub + own Cloudflare | Your Supabase project | Configured Auth SMTP sender | Supabase Auth provider configuration |

For a new app requiring ownership and straightforward operation outside Lovable,
prefer **your own Supabase**, usable from either frontend host. Cloud is an optional
convenience choice, not an automatic replacement. Its instance is managed by
Lovable, not your Supabase account; leaving requires migration, not changing a URL.
See [Supabase's ownership explanation](https://supabase.com/docs/guides/troubleshooting/cant-access-supabase-project-lovable-cloud).
Cloud remixes remain Cloud projects; inspect fresh credentials and schema rather
than assuming users, data or manually added secrets were copied. Existing external
Supabase projects cannot be automatically converted to Cloud. See
[Cloud remix and migration rules](https://docs.lovable.dev/features/cloud).

## Minimal configuration work

1. Inspect the connected backend before provisioning anything. If absent, recommend
   connecting the user's Supabase for portability, or explicitly selecting Cloud.
   Never reuse the kit demo's credentials, accounts or private data in a client remix.
2. Reuse `src/lib/supabase/` and the committed migration. Map the selected project's
   public configuration to `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`.
   Do not add a second generated Supabase client. Service-role keys never belong in frontend configuration.
3. Apply the existing schema/grants/RLS to an authorized empty target. Verify Cloud
   supports the migration's `app_private` helper, Auth reads and ownership rules;
   do not weaken policies if a managed service rejects them.
4. Keep the current code-confirmation flow and Auth settings from `docs/supabase.md`.
   Mailpit captures local test mail; it is not a production sender. In Cloud,
   verify the actual signup template delivers the code expected by this UI.
   If unavailable, report the precise mismatch instead of silently disabling confirmation.
5. [Lovable email delivery](https://docs.lovable.dev/features/custom-emails) is not
   a personal inbox: free Cloud Auth uses a default sender; branded/app emails need
   an eligible paid plan. Outside Cloud, use the configured Supabase SMTP sender
   (Resend is the kit recommendation). Never add a second sender for the same event.
6. [Managed Google OAuth](https://docs.lovable.dev/features/google-auth) is a Cloud
   option, not a replacement identity system. Add it only when the app needs it;
   retain the same user identity and Notes authorization. With external Supabase,
   configure that project's provider and callbacks. Do not silently replace email login.

## Acceptance before claiming Lovable support

Use a fresh remix with synthetic data: preview, signup, delivered confirmation,
login, private Notes CRUD, second-user denial, logout, mobile and keyboard. Export
that source to GitHub and build/run it independently with documented configuration.
Record the tested base/remix URLs, source commit, backend choice and any remaining
manual setup in the existing Issue/PR. Test email and OAuth only for the chosen
profile; a working local build is not a successful Lovable deployment.

Do not add provider-switching frameworks, installers, parallel authentication,
new product features or paid services merely to prepare a remix. Existing
[required checks](docs/supabase.md) and shared UI remain authoritative.

Provider documentation checked on 2026-09-13. Lovable's
[current runtime](https://lovable.dev/blog/building-apps-using-tanstack-start) uses
TanStack Start and Workers; verify this kit's actual build configuration in the
project, rather than assuming framework names guarantee compatibility.
