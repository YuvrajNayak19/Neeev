-- Run this once in the SQL Editor of project szzopeokulxboadthqkc.
-- This creates the complete application schema for a new Supabase project.

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  school_name TEXT NOT NULL DEFAULT '',
  school_id TEXT NOT NULL DEFAULT '',
  student_passcode TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.teachers (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  subject TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'TGT',
  busy JSONB NOT NULL DEFAULT '{}'::jsonb,
  timetable JSONB NOT NULL DEFAULT '{}'::jsonb,
  weekly_timetable JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT teachers_category_check CHECK (category IN ('PRT', 'TGT', 'PGT'))
);

CREATE TABLE IF NOT EXISTS public.saved_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day DATE NOT NULL,
  rows JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT saved_schedules_user_day_key UNIQUE (user_id, day)
);

CREATE TABLE IF NOT EXISTS public.substitutions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id TEXT NOT NULL,
  date DATE NOT NULL,
  period INTEGER NOT NULL,
  class_name TEXT NOT NULL DEFAULT '',
  original_teacher_id TEXT NOT NULL DEFAULT '',
  original_teacher_name TEXT NOT NULL DEFAULT '',
  substitute_teacher_id TEXT,
  substitute_teacher_name TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'assigned',
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT substitutions_status_check CHECK (status IN ('assigned', 'overridden')),
  CONSTRAINT substitutions_school_date_period_class_key
    UNIQUE (school_id, date, period, class_name, original_teacher_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS profiles_school_id_unique
  ON public.profiles (school_id)
  WHERE school_id <> '';

CREATE INDEX IF NOT EXISTS teachers_user_id_idx
  ON public.teachers (user_id);

CREATE INDEX IF NOT EXISTS substitutions_student_lookup_idx
  ON public.substitutions (school_id, date, class_name, period);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'profiles_updated_at'
      AND tgrelid = 'public.profiles'::regclass
  ) THEN
    CREATE TRIGGER profiles_updated_at
      BEFORE UPDATE ON public.profiles
      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'teachers_updated_at'
      AND tgrelid = 'public.teachers'::regclass
  ) THEN
    CREATE TRIGGER teachers_updated_at
      BEFORE UPDATE ON public.teachers
      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'saved_schedules_updated_at'
      AND tgrelid = 'public.saved_schedules'::regclass
  ) THEN
    CREATE TRIGGER saved_schedules_updated_at
      BEFORE UPDATE ON public.saved_schedules
      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'substitutions_updated_at'
      AND tgrelid = 'public.substitutions'::regclass
  ) THEN
    CREATE TRIGGER substitutions_updated_at
      BEFORE UPDATE ON public.substitutions
      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END
$$;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.teachers TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.saved_schedules TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.substitutions TO authenticated;
GRANT ALL ON public.profiles, public.teachers, public.saved_schedules, public.substitutions TO service_role;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.substitutions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Users manage their own profile') THEN
    CREATE POLICY "Users manage their own profile" ON public.profiles
      FOR ALL TO authenticated
      USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'teachers' AND policyname = 'Users manage their own teachers') THEN
    CREATE POLICY "Users manage their own teachers" ON public.teachers
      FOR ALL TO authenticated
      USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'saved_schedules' AND policyname = 'Users manage their own saved schedules') THEN
    CREATE POLICY "Users manage their own saved schedules" ON public.saved_schedules
      FOR ALL TO authenticated
      USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'substitutions' AND policyname = 'Admins manage substitutions for their school') THEN
    CREATE POLICY "Admins manage substitutions for their school" ON public.substitutions
      FOR ALL TO authenticated
      USING (
        created_by = auth.uid()
        AND school_id = (SELECT p.school_id FROM public.profiles p WHERE p.id = auth.uid())
      )
      WITH CHECK (
        created_by = auth.uid()
        AND school_id = (SELECT p.school_id FROM public.profiles p WHERE p.id = auth.uid())
      );
  END IF;
END
$$;

CREATE OR REPLACE FUNCTION public.verify_student_access(
  requested_school_id TEXT,
  requested_passcode TEXT
)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE school_id = upper(trim(requested_school_id))
      AND student_passcode = trim(requested_passcode)
      AND school_id <> ''
      AND student_passcode <> ''
  );
$$;

CREATE OR REPLACE FUNCTION public.fetch_student_substitutions(
  requested_school_id TEXT,
  requested_date DATE
)
RETURNS TABLE (
  school_id TEXT,
  date DATE,
  period INTEGER,
  class_name TEXT,
  original_teacher_id TEXT,
  original_teacher_name TEXT,
  substitute_teacher_id TEXT,
  substitute_teacher_name TEXT,
  status TEXT
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT s.school_id, s.date, s.period, s.class_name,
         s.original_teacher_id, s.original_teacher_name,
         s.substitute_teacher_id, s.substitute_teacher_name, s.status
  FROM public.substitutions s
  WHERE s.school_id = upper(trim(requested_school_id))
    AND s.date = requested_date
    AND s.status IN ('assigned', 'overridden')
    AND s.substitute_teacher_id IS NOT NULL
  ORDER BY s.period, s.class_name;
$$;

REVOKE ALL ON FUNCTION public.verify_student_access(TEXT, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.fetch_student_substitutions(TEXT, DATE) FROM PUBLIC, anon, authenticated;
