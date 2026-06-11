create extension if not exists pgcrypto;

create table if not exists public.workout_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  workout_date date not null,
  workout_type text not null check (workout_type in ('力量训练', '有氧训练', '体能训练')),
  duration_minutes integer not null check (duration_minutes between 5 and 300),
  intensity text not null check (intensity in ('轻松', '适中', '挑战', '超燃')),
  body_parts text[] not null default '{}',
  note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists workout_records_user_date_idx
  on public.workout_records(user_id, workout_date desc);

create table if not exists public.body_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  record_date date not null,
  weight_kg numeric(5, 1) not null check (weight_kg between 25 and 250),
  body_fat_percent numeric(4, 1) check (body_fat_percent between 3 and 70),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, record_date)
);

create index if not exists body_records_user_date_idx
  on public.body_records(user_id, record_date desc);

alter table public.workout_records enable row level security;
alter table public.body_records enable row level security;

drop policy if exists "Users can read own workouts" on public.workout_records;
create policy "Users can read own workouts"
on public.workout_records for select to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert own workouts" on public.workout_records;
create policy "Users can insert own workouts"
on public.workout_records for insert to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update own workouts" on public.workout_records;
create policy "Users can update own workouts"
on public.workout_records for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete own workouts" on public.workout_records;
create policy "Users can delete own workouts"
on public.workout_records for delete to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can read own body records" on public.body_records;
create policy "Users can read own body records"
on public.body_records for select to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert own body records" on public.body_records;
create policy "Users can insert own body records"
on public.body_records for insert to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update own body records" on public.body_records;
create policy "Users can update own body records"
on public.body_records for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete own body records" on public.body_records;
create policy "Users can delete own body records"
on public.body_records for delete to authenticated
using ((select auth.uid()) = user_id);
