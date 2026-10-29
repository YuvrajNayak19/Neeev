ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS school_id text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS student_passcode text NOT NULL DEFAULT '';

CREATE UNIQUE INDEX IF NOT EXISTS profiles_school_id_unique
  ON public.profiles (school_id) WHERE school_id <> '';

ALTER TABLE public.teachers
  ADD COLUMN IF NOT EXISTS timetable jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS weekly_timetable jsonb NOT NULL DEFAULT '{}'::jsonb;

CREATE OR REPLACE FUNCTION public.verify_student_access(requested_school_id text, requested_passcode text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE school_id = upper(trim(requested_school_id))
      AND student_passcode = trim(requested_passcode)
      AND school_id <> ''
      AND student_passcode <> ''
  );
$$;

GRANT EXECUTE ON FUNCTION public.verify_student_access(text, text) TO anon, authenticated;