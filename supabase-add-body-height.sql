alter table public.body_records
  add column if not exists height_cm numeric(5, 1)
  check (height_cm between 100 and 220);
