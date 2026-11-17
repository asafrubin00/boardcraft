-- BoardCraft accounts and classroom mode.
-- Applied to the "boardcraft" Supabase project (London, eu-west-2).
-- Re-runnable: every statement checks before it creates.
--
-- Who can see what (enforced by row-level security, not by the app):
--   - everyone sees and edits only their own profile and their own results;
--   - a lecturer also sees the profiles and results of students in classes
--     they created, and nobody else's;
--   - students join a class only through public.join_class(code), so the
--     list of classes can never be browsed.
-- Internal helper functions live in the "private" schema, which the Data API
-- does not expose, so they cannot be called from the browser.

create schema if not exists private;

-- ── Profiles: one row per signed-up user ──────────────────────────────────
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  display_name text not null default '',
  -- Self-declared at sign-up (anyone may run a class); it only gates
  -- creating classes, never access to anyone else's data.
  role text not null default 'student' check (role in ('student', 'lecturer')),
  created_at timestamptz not null default now()
);

create or replace function private.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, email, display_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'display_name', ''),
    case when new.raw_user_meta_data ->> 'role' = 'lecturer' then 'lecturer' else 'student' end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

-- ── Classes and who is in them ────────────────────────────────────────────
create table if not exists public.classes (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 120),
  code text not null unique default upper(substr(md5(random()::text), 1, 6)),
  lecturer_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  company_id text, -- optional: the company the lecturer wants played
  created_at timestamptz not null default now()
);
create index if not exists classes_lecturer_idx on public.classes (lecturer_id);

create table if not exists public.class_members (
  class_id uuid not null references public.classes (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (class_id, user_id)
);
create index if not exists class_members_user_idx on public.class_members (user_id);

-- ── Finished years ────────────────────────────────────────────────────────
create table if not exists public.game_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  class_id uuid references public.classes (id) on delete set null,
  company_id text not null,
  company_name text not null,
  final_sv numeric,
  governance_health integer,
  gc_earned integer,
  events_resolved integer,
  game_state jsonb not null,   -- the whole finished year, so the debrief can be rebuilt exactly
  agm_votes jsonb,
  created_at timestamptz not null default now()
);
create index if not exists game_results_class_idx on public.game_results (class_id);
create index if not exists game_results_user_idx on public.game_results (user_id);

-- ── Private helpers (security definer, so policies never loop) ────────────
create or replace function private.is_class_lecturer(p_class uuid)
returns boolean language sql security definer stable set search_path = '' as $$
  select exists (select 1 from public.classes where id = p_class and lecturer_id = (select auth.uid()));
$$;

create or replace function private.is_class_member(p_class uuid)
returns boolean language sql security definer stable set search_path = '' as $$
  select exists (select 1 from public.class_members where class_id = p_class and user_id = (select auth.uid()));
$$;

create or replace function private.teaches_user(p_user uuid)
returns boolean language sql security definer stable set search_path = '' as $$
  select exists (
    select 1 from public.class_members m join public.classes c on c.id = m.class_id
    where m.user_id = p_user and c.lecturer_id = (select auth.uid())
  );
$$;

create or replace function private.is_lecturer()
returns boolean language sql security definer stable set search_path = '' as $$
  select exists (select 1 from public.profiles where id = (select auth.uid()) and role = 'lecturer');
$$;

revoke all on schema private from public, anon;
grant usage on schema private to authenticated;
revoke all on all functions in schema private from public, anon;
grant execute on function private.is_class_lecturer(uuid), private.is_class_member(uuid),
  private.teaches_user(uuid), private.is_lecturer() to authenticated;

-- ── The one public function: a student joins with the lecturer's code ─────
create or replace function public.join_class(p_code text)
returns table (id uuid, name text, company_id text)
language plpgsql security definer set search_path = '' as $$
declare v_class public.classes%rowtype;
begin
  if (select auth.uid()) is null then raise exception 'Sign in first'; end if;
  select * into v_class from public.classes c where c.code = upper(trim(p_code));
  if not found then raise exception 'No class with that code'; end if;
  insert into public.class_members (class_id, user_id) values (v_class.id, (select auth.uid()))
  on conflict do nothing;
  return query select v_class.id, v_class.name, v_class.company_id;
end;
$$;
revoke all on function public.join_class(text) from public, anon;
grant execute on function public.join_class(text) to authenticated;

-- ── Table access for signed-in users only (rows filtered by RLS) ──────────
revoke all on public.profiles, public.classes, public.class_members, public.game_results from anon;
grant select, update on public.profiles to authenticated;
grant select, insert, update, delete on public.classes to authenticated;
grant select, delete on public.class_members to authenticated;
grant select, insert, delete on public.game_results to authenticated;

-- ── Row-level security ────────────────────────────────────────────────────
alter table public.profiles enable row level security;
alter table public.classes enable row level security;
alter table public.class_members enable row level security;
alter table public.game_results enable row level security;

drop policy if exists "own profile or my students" on public.profiles;
create policy "own profile or my students" on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or private.teaches_user(id));

drop policy if exists "edit own profile" on public.profiles;
create policy "edit own profile" on public.profiles
  for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

drop policy if exists "see my classes" on public.classes;
create policy "see my classes" on public.classes
  for select to authenticated
  using (lecturer_id = (select auth.uid()) or private.is_class_member(id));

drop policy if exists "lecturers create classes" on public.classes;
create policy "lecturers create classes" on public.classes
  for insert to authenticated
  with check (lecturer_id = (select auth.uid()) and private.is_lecturer());

drop policy if exists "lecturers edit own classes" on public.classes;
create policy "lecturers edit own classes" on public.classes
  for update to authenticated
  using (lecturer_id = (select auth.uid())) with check (lecturer_id = (select auth.uid()));

drop policy if exists "lecturers delete own classes" on public.classes;
create policy "lecturers delete own classes" on public.classes
  for delete to authenticated
  using (lecturer_id = (select auth.uid()));

drop policy if exists "see memberships" on public.class_members;
create policy "see memberships" on public.class_members
  for select to authenticated
  using (user_id = (select auth.uid()) or private.is_class_lecturer(class_id));

drop policy if exists "leave a class" on public.class_members;
create policy "leave a class" on public.class_members
  for delete to authenticated
  using (user_id = (select auth.uid()) or private.is_class_lecturer(class_id));

drop policy if exists "see own results or my class's" on public.game_results;
create policy "see own results or my class's" on public.game_results
  for select to authenticated
  using (user_id = (select auth.uid()) or (class_id is not null and private.is_class_lecturer(class_id)));

drop policy if exists "save own results" on public.game_results;
create policy "save own results" on public.game_results
  for insert to authenticated
  with check (user_id = (select auth.uid()) and (class_id is null or private.is_class_member(class_id)));

drop policy if exists "delete own results" on public.game_results;
create policy "delete own results" on public.game_results
  for delete to authenticated
  using (user_id = (select auth.uid()));
