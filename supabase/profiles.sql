-- Public learner profiles: what other signed-in learners see at /profile/[id].
-- Published from src/hooks/use-progress.tsx whenever progress is saved.
--
-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor).
-- RLS keys on the Clerk session token's `sub` claim (= Clerk user ID),
-- the same convention as `progress`, `custom_courses` and `leaderboard`.

create table if not exists public.public_profiles (
  user_id           text primary key,                 -- Clerk user ID
  display_name      text not null default '',
  bio               text not null default '' check (char_length(bio) <= 160),
  avatar_url        text,
  xp                integer not null default 0,
  streak            integer not null default 0,
  lessons_done      integer not null default 0,
  courses_completed integer not null default 0,
  certificates      integer not null default 0,
  -- { "<badge id>": "YYYY-MM-DD", ... } — every badge the learner unlocked.
  badges            jsonb not null default '{}'::jsonb,
  -- Up to 3 badge ids the learner pinned to the top of their profile.
  featured_badges   text[] not null default '{}' check (cardinality(featured_badges) <= 3),
  updated_at        timestamptz not null default now()
);

alter table public.public_profiles enable row level security;

-- Signed-in learners can view anyone's profile; anonymous visitors cannot.
drop policy if exists "public_profiles_select_authenticated" on public.public_profiles;
create policy "public_profiles_select_authenticated"
  on public.public_profiles
  for select to authenticated
  using (true);

-- Learners may only create/update their own profile.
drop policy if exists "public_profiles_insert_own" on public.public_profiles;
create policy "public_profiles_insert_own"
  on public.public_profiles
  for insert to authenticated
  with check ((auth.jwt() ->> 'sub') = user_id);

drop policy if exists "public_profiles_update_own" on public.public_profiles;
create policy "public_profiles_update_own"
  on public.public_profiles
  for update to authenticated
  using ((auth.jwt() ->> 'sub') = user_id)
  with check ((auth.jwt() ->> 'sub') = user_id);

grant select, insert, update on public.public_profiles to authenticated;
