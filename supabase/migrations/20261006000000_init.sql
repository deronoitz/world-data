-- World Data Explorer: per-user library tables.
-- Every row belongs to auth.uid(); RLS restricts all access to the owner.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Favorites ----------------------------------------------------------------
create table public.favorite_countries (
  user_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  country_code varchar(3) not null check (country_code ~ '^[A-Z0-9]{3}$'),
  created_at   timestamptz not null default now(),
  primary key (user_id, country_code)
);

-- Saved (pinned) indicators -------------------------------------------------
create table public.saved_indicators (
  user_id        uuid not null default auth.uid() references auth.users (id) on delete cascade,
  indicator_code varchar(64) not null check (char_length(indicator_code) >= 1),
  position       integer not null default 0,
  created_at     timestamptz not null default now(),
  primary key (user_id, indicator_code)
);

-- Saved comparisons ---------------------------------------------------------
create table public.comparisons (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name           varchar(120) not null check (char_length(name) >= 1),
  country_codes  varchar(3)[] not null check (cardinality(country_codes) between 2 and 6),
  indicator_code varchar(64) not null check (char_length(indicator_code) >= 1),
  year_from      integer check (year_from between 1960 and 2100),
  year_to        integer check (year_to between 1960 and 2100),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  check (year_from is null or year_to is null or year_from <= year_to)
);
create index comparisons_user_created_idx on public.comparisons (user_id, created_at desc);
create trigger comparisons_set_updated_at
  before update on public.comparisons
  for each row execute function public.set_updated_at();

-- Country notes -------------------------------------------------------------
create table public.country_notes (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  country_code varchar(3) not null check (country_code ~ '^[A-Z0-9]{3}$'),
  body         varchar(5000) not null check (char_length(body) >= 1),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index country_notes_user_country_idx on public.country_notes (user_id, country_code, created_at desc);
create trigger country_notes_set_updated_at
  before update on public.country_notes
  for each row execute function public.set_updated_at();

-- Row Level Security ---------------------------------------------------------
alter table public.favorite_countries enable row level security;
alter table public.saved_indicators   enable row level security;
alter table public.comparisons        enable row level security;
alter table public.country_notes      enable row level security;

create policy "Owners manage their favorites" on public.favorite_countries
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Owners manage their saved indicators" on public.saved_indicators
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Owners manage their comparisons" on public.comparisons
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Owners manage their notes" on public.country_notes
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
