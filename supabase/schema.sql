-- Habit tracker schema. Paste into Supabase → SQL Editor and run top to bottom.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.habits (
  id         bigint generated always as identity primary key,
  -- default auth.uid(): an insert from the browser is stamped with the caller's
  -- id even if the client forgets to send one. The RLS policy still checks it.
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name       text not null check (char_length(trim(name)) between 1 and 80),
  created_at timestamptz not null default now()
);

create table public.daily_logs (
  id         bigint generated always as identity primary key,
  -- ON DELETE CASCADE: deleting a habit deletes every log that points at it,
  -- so no orphaned logs can survive the habit.
  habit_id   bigint not null references public.habits (id) on delete cascade,
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  log_date   date not null default current_date,
  created_at timestamptz not null default now(),
  -- One check-in per habit per day.
  unique (habit_id, log_date)
);

-- Postgres does not index foreign keys automatically; these back the RLS
-- filter (user_id) and the cascade lookup (habit_id).
create index habits_user_id_idx      on public.habits (user_id);
create index daily_logs_user_id_idx  on public.daily_logs (user_id);
create index daily_logs_habit_id_idx on public.daily_logs (habit_id);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

-- With RLS on and NO policies, every request from the browser is denied
-- (SELECT returns [], writes fail). Policies below open exactly what is allowed.
alter table public.habits     enable row level security;
alter table public.daily_logs enable row level security;

-- Each policy: `using` limits which EXISTING rows a request can see or touch;
-- `with check` decides whether a NEW or changed row is allowed. Update needs
-- both, or a user could hand their row to someone else by changing user_id.

create policy "Users can view their own habits"
on public.habits
for select
to authenticated
using ( auth.uid() = user_id );

create policy "Users can add their own habits"
on public.habits
for insert
to authenticated
with check ( auth.uid() = user_id );

create policy "Users can edit their own habits"
on public.habits
for update
to authenticated
using ( auth.uid() = user_id )
with check ( auth.uid() = user_id );

create policy "Users can delete their own habits"
on public.habits
for delete
to authenticated
using ( auth.uid() = user_id );

create policy "Users can view their own logs"
on public.daily_logs
for select
to authenticated
using ( auth.uid() = user_id );

create policy "Users can add their own logs"
on public.daily_logs
for insert
to authenticated
with check (
  auth.uid() = user_id
  -- ...and the habit being logged must be mine too. Without this, anyone could
  -- attach a log to a habit id they guessed, as long as they stamped it with
  -- their own user_id. The subquery runs under habits' own RLS.
  and exists (
    select 1 from public.habits
    where habits.id = habit_id and habits.user_id = auth.uid()
  )
);

create policy "Users can edit their own logs"
on public.daily_logs
for update
to authenticated
using ( auth.uid() = user_id )
with check (
  auth.uid() = user_id
  -- Same rule as insert: cannot move a log onto someone else's habit.
  and exists (
    select 1 from public.habits
    where habits.id = habit_id and habits.user_id = auth.uid()
  )
);

create policy "Users can delete their own logs"
on public.daily_logs
for delete
to authenticated
using ( auth.uid() = user_id );

-- ---------------------------------------------------------------------------
-- Seed data
-- ---------------------------------------------------------------------------
-- Sign up in the app first, then replace the email below with that account's
-- and run this block. It runs as the postgres role in the SQL editor, which
-- bypasses RLS — that is why user_id is set explicitly here.

with me as (
  select id from auth.users where email = 'you@example.com'
),
new_habits as (
  insert into public.habits (user_id, name)
  select me.id, h.name
  from me, (values ('Drink 2L of water'), ('Read 20 pages'), ('Walk 8,000 steps')) as h(name)
  returning id, user_id
)
insert into public.daily_logs (habit_id, user_id, log_date)
select id, user_id, current_date - offs
from new_habits, generate_series(0, 2) as offs;

-- ---------------------------------------------------------------------------
-- Audit queries (run in the SQL editor)
-- ---------------------------------------------------------------------------
-- Policies in place:
--   select tablename, policyname, cmd, qual, with_check
--   from pg_policies where schemaname = 'public' order by tablename, cmd;
--
-- Cascade works — note a habit id, delete it in the app, then:
--   select count(*) from public.daily_logs where habit_id = <that id>;  -- 0
