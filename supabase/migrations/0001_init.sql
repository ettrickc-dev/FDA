-- 0001_init.sql : Form 4-17a app, initial schema (spec Section 9)
--
-- Design notes
-- * Login uses Supabase Auth (auth.users holds email + password hash). public.profiles
--   carries the extra user fields from the spec.
-- * The browser only talks to Supabase for login. All reads/writes of case data go through
--   Netlify Functions using the service role, which encrypt answers before storage.
-- * RLS is ON for every table. Owner-read policies exist only where harmless; the
--   answers table has NO client policies and no client grants at all.
-- * Docket #, file #, court date live inside the encrypted answers, not as plain columns
--   (deliberate tightening of the spec's cases table).

create extension if not exists pgcrypto;

-- ---------- helpers ----------
create or replace function public.touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin new.updated_at := now(); return new; end $$;

-- ---------- profiles ----------
create table public.profiles (
  id                     uuid primary key references auth.users(id) on delete cascade,
  created_at             timestamptz not null default now(),
  last_active_at         timestamptz not null default now(),
  deletion_scheduled_at  timestamptz
);

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id) values (new.id) on conflict do nothing;
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- cases ----------
create table public.cases (
  id                        uuid primary key default gen_random_uuid(),
  user_id                   uuid not null references auth.users(id) on delete cascade,
  form_type                 text not null default '4-17a',
  status                    text not null default 'draft'
                            check (status in ('draft','paid','expired')),
  role                      text check (role in ('payor','payee','unsure')),
  case_type                 text check (case_type in ('new','modification','enforcement','unsure')),
  goal                      text check (goal in ('fair','reduce','increase','understand')),
  county                    text,
  confidentiality_requested boolean not null default false,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);
create index cases_user_idx on public.cases(user_id);
create trigger cases_touch before update on public.cases
  for each row execute function public.touch_updated_at();

-- ---------- answers (encrypted, one row per screen) ----------
create table public.answers (
  case_id      uuid not null references public.cases(id) on delete cascade,
  section      text not null,
  data_enc     text not null,              -- AES-256-GCM, see netlify/functions/_lib/crypto.js
  key_version  smallint not null default 1,
  updated_at   timestamptz not null default now(),
  primary key (case_id, section)
);

-- ---------- uploads ----------
create table public.uploads (
  id            uuid primary key default gen_random_uuid(),
  case_id       uuid not null references public.cases(id) on delete cascade,
  type          text not null,
  storage_key   text not null,
  extracted_at  timestamptz,
  delete_after  timestamptz not null,
  created_at    timestamptz not null default now()
);
create index uploads_case_idx on public.uploads(case_id);

-- ---------- red flags ----------
create table public.red_flags (
  id           uuid primary key default gen_random_uuid(),
  case_id      uuid not null references public.cases(id) on delete cascade,
  flag_type    text not null,
  answer_enc   text,                       -- encrypted; may contain free text
  shown_at     timestamptz not null default now(),
  user_action  text check (user_action in ('attorney','free_help','continue'))
);
create index red_flags_case_idx on public.red_flags(case_id);

-- ---------- form versions ----------
create table public.form_versions (
  id             uuid primary key default gen_random_uuid(),
  form_number    text not null,
  revision_date  text not null,            -- as printed, e.g. '1/2026'
  pdf_hash       text not null,            -- sha256 of the blank court PDF
  field_map      jsonb not null default '{}'::jsonb,
  active         boolean not null default false,
  created_at     timestamptz not null default now()
);
create unique index form_versions_one_active
  on public.form_versions(form_number) where active;

-- ---------- generated documents ----------
create table public.documents_generated (
  id               uuid primary key default gen_random_uuid(),
  case_id          uuid not null references public.cases(id) on delete cascade,
  form_version_id  uuid not null references public.form_versions(id),
  watermarked      boolean not null,
  generated_at     timestamptz not null default now(),
  expires_at       timestamptz,
  storage_key      text
);
create index documents_generated_case_idx on public.documents_generated(case_id);
create index documents_generated_fv_idx on public.documents_generated(form_version_id);

-- ---------- payments (kept after data deletion, stripped of case link) ----------
create table public.payments (
  id                 uuid primary key default gen_random_uuid(),
  case_id            uuid references public.cases(id) on delete set null,
  case_ref           text not null,        -- opaque reference also sent to Stripe
  stripe_session_id  text unique,
  amount_cents       integer,
  currency           text default 'usd',
  status             text not null default 'pending'
                     check (status in ('pending','paid','refunded','failed')),
  paid_at            timestamptz,
  access_expires_at  timestamptz,
  refunded_at        timestamptz,
  created_at         timestamptz not null default now()
);
create index payments_case_idx on public.payments(case_id);

-- ---------- consents (kept after data deletion) ----------
create table public.consents (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid references auth.users(id) on delete set null,
  terms_version  text not null,
  accepted_at    timestamptz not null,
  ip_hash        text
);
create index consents_user_idx on public.consents(user_id);

-- ---------- audit log (never contains answer contents) ----------
create table public.audit_log (
  id       bigint generated always as identity primary key,
  actor    uuid,
  action   text not null,
  case_id  uuid,
  at       timestamptz not null default now()
);

-- ---------- row-level security ----------
alter table public.profiles            enable row level security;
alter table public.cases               enable row level security;
alter table public.answers             enable row level security;
alter table public.uploads             enable row level security;
alter table public.red_flags           enable row level security;
alter table public.form_versions       enable row level security;
alter table public.documents_generated enable row level security;
alter table public.payments            enable row level security;
alter table public.consents            enable row level security;
alter table public.audit_log           enable row level security;

create policy "own profile read" on public.profiles
  for select to authenticated using ((select auth.uid()) = id);

create policy "own cases read" on public.cases
  for select to authenticated using ((select auth.uid()) = user_id);

-- Supabase's advisor will list these as "RLS enabled, no policy" (INFO). That is intended.
-- Every other table: no client policies = no client access. Functions use the service role.
-- Belt and braces: remove direct grants on the most sensitive tables.
revoke all on public.answers   from anon, authenticated;
revoke all on public.red_flags from anon, authenticated;
revoke all on public.uploads   from anon, authenticated;
revoke all on public.consents  from anon, authenticated;
revoke all on public.audit_log from anon, authenticated;
revoke all on public.payments  from anon, authenticated;

revoke execute on function public.handle_new_user() from anon, authenticated, public;
