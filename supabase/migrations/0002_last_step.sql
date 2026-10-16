-- 0002_last_step.sql : remember where the person left off (resume).
alter table public.cases add column if not exists last_step text;
