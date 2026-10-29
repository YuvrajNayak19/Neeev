CREATE TABLE IF NOT EXISTS public.substitutions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id TEXT NOT NULL,
  date DATE NOT NULL,
  period INTEGER NOT NULL,
  class_name TEXT NOT NULL,
  original_teacher_id TEXT NOT NULL,
  original_teacher_name TEXT NOT NULL,
  substitute_teacher_id TEXT,
  substitute_teacher_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'assigned' CHECK (status IN ('assigned', 'overridden')),
  created_by UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (school_id, date, period, class_name)
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.substitutions'::regclass
      AND conname = 'substitutions_school_date_period_class_key'
  ) THEN
    ALTER TABLE public.substitutions
      ADD CONSTRAINT substitutions_school_date_period_class_key
      UNIQUE (school_id, date, period, class_name);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.substitutions'::regclass
      AND conname = 'substitutions_status_check'
  ) THEN
    ALTER TABLE public.substitutions
      ADD CONSTRAINT substitutions_status_check
      CHECK (status IN ('assigned', 'overridden'));
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS substitutions_student_lookup_idx
  ON public.substitutions (school_id, date, class_name, period);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.substitutions TO authenticated;

ALTER TABLE public.substitutions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'substitutions'
      AND policyname = 'Admins manage substitutions for their school'
  ) THEN
    CREATE POLICY "Admins manage substitutions for their school"
      ON public.substitutions
      FOR ALL
      TO authenticated
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

DO $$
BEGIN
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

GRANT EXECUTE ON FUNCTION public.fetch_student_substitutions(TEXT, DATE) TO anon, authenticated;
