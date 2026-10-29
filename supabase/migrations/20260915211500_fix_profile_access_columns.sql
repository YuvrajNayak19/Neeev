ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS school_id TEXT,
  ADD COLUMN IF NOT EXISTS student_passcode TEXT;

ALTER TABLE public.profiles
  ALTER COLUMN school_id DROP NOT NULL,
  ALTER COLUMN school_id SET DEFAULT NULL,
  ALTER COLUMN student_passcode DROP NOT NULL,
  ALTER COLUMN student_passcode SET DEFAULT NULL;

GRANT UPDATE (full_name, school_name, school_id, student_passcode) ON public.profiles TO authenticated;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'profiles'
      AND policyname = 'Users manage their own profile'
  ) THEN
    CREATE POLICY "Users manage their own profile"
      ON public.profiles
      FOR ALL
      TO authenticated
      USING (auth.uid() = id)
      WITH CHECK (auth.uid() = id);
  END IF;
END
$$;
