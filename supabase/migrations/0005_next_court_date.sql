-- Next court date (from "Your situation"), used for the on-screen countdown and as a fallback
-- for the "Court Date" line on the form. Applied to project form-prep on 2026-10-17.
alter table public.cases add column if not exists next_court_date date;
comment on column public.cases.next_court_date is 'Next court date from Your situation; used only for the on-screen countdown and as a fallback on the form.';
