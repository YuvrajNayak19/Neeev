ALTER TABLE public.teachers
  ADD COLUMN timetable JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN weekly_timetable JSONB NOT NULL DEFAULT '{}'::jsonb;
