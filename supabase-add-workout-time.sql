alter table public.workout_records
  add column if not exists workout_time time;

update public.workout_records
set workout_time = (created_at at time zone 'Asia/Shanghai')::time
where workout_time is null;

drop index if exists public.workout_records_user_date_idx;

create index workout_records_user_date_idx
  on public.workout_records(user_id, workout_date desc, workout_time desc);
