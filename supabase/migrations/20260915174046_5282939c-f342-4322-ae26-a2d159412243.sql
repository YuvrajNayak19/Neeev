CREATE TABLE public.substitutions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id text NOT NULL,
  date date NOT NULL,
  period integer NOT NULL,
  class_name text NOT NULL DEFAULT '',
  original_teacher_id text NOT NULL DEFAULT '',
  original_teacher_name text NOT NULL DEFAULT '',
  substitute_teacher_id text,
  substitute_teacher_name text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'assigned',
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX substitutions_school_date_idx ON public.substitutions (school_id, date);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.substitutions TO authenticated;
GRANT ALL ON public.substitutions TO service_role;

ALTER TABLE public.substitutions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own substitutions"
ON public.substitutions FOR ALL TO authenticated
USING (auth.uid() = created_by) WITH CHECK (auth.uid() = created_by);

CREATE TRIGGER substitutions_updated_at BEFORE UPDATE ON public.substitutions
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.fetch_student_substitutions(requested_school_id text, requested_date date)
RETURNS TABLE (
  school_id text,
  date date,
  period integer,
  class_name text,
  original_teacher_id text,
  original_teacher_name text,
  substitute_teacher_id text,
  substitute_teacher_name text,
  status text
)
LANGUAGE sql
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
  ORDER BY s.period;
$$;

GRANT EXECUTE ON FUNCTION public.fetch_student_substitutions(text, date) TO anon, authenticated;