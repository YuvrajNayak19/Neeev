ALTER TABLE public.substitutions
  DROP CONSTRAINT IF EXISTS substitutions_school_date_period_class_key;

ALTER TABLE public.substitutions
  ADD CONSTRAINT substitutions_school_date_period_class_key
  UNIQUE (school_id, date, period, class_name, original_teacher_id);
