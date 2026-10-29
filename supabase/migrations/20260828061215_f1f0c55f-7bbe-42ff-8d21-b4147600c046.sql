DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.saved_schedules'::regclass
      AND conname = 'saved_schedules_user_day_key'
  ) THEN
    ALTER TABLE public.saved_schedules
      ADD CONSTRAINT saved_schedules_user_day_key UNIQUE (user_id, day);
  END IF;
END
$$;