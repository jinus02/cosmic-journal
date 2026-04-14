-- Cosmic Journal — initial schema + RLS
-- Run in Supabase SQL Editor (or `supabase db reset` locally)

create extension if not exists "pgcrypto";

----------------------------------------------------------------------
-- profiles
----------------------------------------------------------------------
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  display_name text,
  locale text default 'en' check (locale in ('en','ko')),
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "profiles_select_public" on profiles
  for select using (true);

create policy "profiles_update_self" on profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

create policy "profiles_insert_self" on profiles
  for insert with check (auth.uid() = id);

----------------------------------------------------------------------
-- planets
----------------------------------------------------------------------
create table if not exists planets (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles(id) on delete cascade,
  name text not null,
  seed bigint not null,
  universe_x integer not null,
  universe_y integer not null,
  universe_z integer not null,
  biome text check (biome in ('ocean','desert','forest','ice','lava','crystal')),
  palette jsonb,
  radius real not null default 1.0,
  visibility text not null default 'public' check (visibility in ('public','unlisted','private')),
  created_at timestamptz not null default now(),
  unique (universe_x, universe_y, universe_z)
);

create index if not exists planets_owner_idx on planets(owner_id);
create index if not exists planets_visibility_idx on planets(visibility);

alter table planets enable row level security;

create policy "planets_select_visible" on planets
  for select using (
    visibility in ('public','unlisted')
    or owner_id = auth.uid()
  );

create policy "planets_insert_self" on planets
  for insert with check (owner_id = auth.uid());

create policy "planets_update_owner" on planets
  for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "planets_delete_owner" on planets
  for delete using (owner_id = auth.uid());

----------------------------------------------------------------------
-- journal_entries
----------------------------------------------------------------------
create table if not exists journal_entries (
  id uuid primary key default gen_random_uuid(),
  planet_id uuid not null references planets(id) on delete cascade,
  author_id uuid not null references profiles(id) on delete cascade,
  title text,
  body_md text not null,
  body_hash text,                -- sha256 of body_md (for AI cache key)
  mood text,
  emotion_scores jsonb,
  ai_poem text,
  ai_summary text,
  language text default 'en' check (language in ('en','ko')),
  created_at timestamptz not null default now()
);

create index if not exists entries_planet_idx on journal_entries(planet_id, created_at desc);
create index if not exists entries_author_idx on journal_entries(author_id, created_at desc);

alter table journal_entries enable row level security;

create policy "entries_select_visible" on journal_entries
  for select using (
    author_id = auth.uid()
    or exists (
      select 1 from planets p
      where p.id = planet_id and p.visibility in ('public','unlisted')
    )
  );

create policy "entries_insert_author" on journal_entries
  for insert with check (author_id = auth.uid());

create policy "entries_update_author" on journal_entries
  for update using (author_id = auth.uid()) with check (author_id = auth.uid());

create policy "entries_delete_author" on journal_entries
  for delete using (author_id = auth.uid());

----------------------------------------------------------------------
-- comments
----------------------------------------------------------------------
create table if not exists comments (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references journal_entries(id) on delete cascade,
  author_id uuid not null references profiles(id) on delete cascade,
  body text not null check (length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);

create index if not exists comments_entry_idx on comments(entry_id, created_at desc);

alter table comments enable row level security;

create policy "comments_select_when_entry_visible" on comments
  for select using (
    exists (
      select 1 from journal_entries e
      join planets p on p.id = e.planet_id
      where e.id = entry_id
        and (e.author_id = auth.uid() or p.visibility in ('public','unlisted'))
    )
  );

create policy "comments_insert_authenticated" on comments
  for insert with check (auth.uid() is not null and author_id = auth.uid());

create policy "comments_delete_author_or_planet_owner" on comments
  for delete using (
    author_id = auth.uid()
    or exists (
      select 1 from journal_entries e
      join planets p on p.id = e.planet_id
      where e.id = entry_id and p.owner_id = auth.uid()
    )
  );

----------------------------------------------------------------------
-- visits
----------------------------------------------------------------------
create table if not exists visits (
  id bigserial primary key,
  planet_id uuid not null references planets(id) on delete cascade,
  visitor_id uuid references profiles(id) on delete set null,
  visited_at timestamptz not null default now()
);

create index if not exists visits_planet_idx on visits(planet_id, visited_at desc);

alter table visits enable row level security;

create policy "visits_insert_anyone" on visits
  for insert with check (true);

create policy "visits_select_planet_owner" on visits
  for select using (
    exists (select 1 from planets p where p.id = planet_id and p.owner_id = auth.uid())
  );

----------------------------------------------------------------------
-- ai_cache  (body_hash -> Gemini response, dedupe identical entries)
----------------------------------------------------------------------
create table if not exists ai_cache (
  body_hash text primary key,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

alter table ai_cache enable row level security;
-- ai_cache is server-only (service_role); deny all client access
create policy "ai_cache_no_client" on ai_cache for select using (false);

----------------------------------------------------------------------
-- Realtime
----------------------------------------------------------------------
alter publication supabase_realtime add table comments;
