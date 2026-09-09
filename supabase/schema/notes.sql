-- Declarative schema source. Generate the versioned migration with the pinned CLI;
-- do not label this file as an applied or generated migration.
create schema if not exists app_private;
revoke all on schema app_private from public;
grant usage on schema app_private to authenticated;

-- The only elevated lookup is narrowly bound to auth.uid(). Never trust user_metadata.
create function app_private.has_verified_email()
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from auth.users
    where id = (select auth.uid()) and email_confirmed_at is not null
      and (banned_until is null or banned_until < now())
  );
$$;
revoke all on function app_private.has_verified_email() from public, anon;
grant execute on function app_private.has_verified_email() to authenticated;

create table public.notes (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null check (char_length(title) <= 120 and title ~ '[^[:space:]]'),
  body text not null default '' check (char_length(body) <= 20000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index notes_owner_created_idx on public.notes (owner_id, created_at desc, id desc);
alter table public.notes enable row level security;
alter table public.notes force row level security;
revoke all on public.notes from public, anon, authenticated;
grant select, delete on public.notes to authenticated;
grant insert (owner_id, title, body) on public.notes to authenticated;
grant update (title, body) on public.notes to authenticated;

create policy notes_select_own on public.notes for select to authenticated
  using (owner_id = (select auth.uid()) and (select app_private.has_verified_email()));
create policy notes_insert_own on public.notes for insert to authenticated
  with check (owner_id = (select auth.uid()) and (select app_private.has_verified_email()));
create policy notes_update_own on public.notes for update to authenticated
  using (owner_id = (select auth.uid()) and (select app_private.has_verified_email()))
  with check (owner_id = (select auth.uid()) and (select app_private.has_verified_email()));
create policy notes_delete_own on public.notes for delete to authenticated
  using (owner_id = (select auth.uid()) and (select app_private.has_verified_email()));

create function app_private.touch_note()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  new.updated_at = clock_timestamp();
  return new;
end;
$$;
revoke all on function app_private.touch_note() from public, anon, authenticated;
create trigger notes_touch_before_update before update on public.notes
  for each row execute function app_private.touch_note();
