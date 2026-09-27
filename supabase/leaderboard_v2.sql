-- Leaderboard v2: extra stats for the /leaderboard page categories
-- (Top Course Creator, Top AI Ask, Top Quiz, Top Badges, ...).
--
-- Run this ONCE in the Supabase SQL Editor after leaderboard.sql.
-- Safe to re-run. Until it is run the app keeps publishing the old
-- columns only, and the new leaderboard tabs show an empty board.

alter table public.leaderboard
  add column if not exists courses_created integer not null default 0,
  add column if not exists ai_asks         integer not null default 0,
  add column if not exists quizzes_passed  integer not null default 0,
  add column if not exists certificates    integer not null default 0,
  add column if not exists badges_count    integer not null default 0;

-- Each tab orders by one column; index them so the board stays fast.
create index if not exists leaderboard_xp_idx              on public.leaderboard (xp desc);
create index if not exists leaderboard_streak_idx          on public.leaderboard (streak desc);
create index if not exists leaderboard_lessons_done_idx    on public.leaderboard (lessons_done desc);
create index if not exists leaderboard_courses_created_idx on public.leaderboard (courses_created desc);
create index if not exists leaderboard_ai_asks_idx         on public.leaderboard (ai_asks desc);
create index if not exists leaderboard_quizzes_passed_idx  on public.leaderboard (quizzes_passed desc);
create index if not exists leaderboard_badges_count_idx    on public.leaderboard (badges_count desc);
