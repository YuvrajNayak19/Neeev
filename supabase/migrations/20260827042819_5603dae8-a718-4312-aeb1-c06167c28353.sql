ALTER TABLE public.teachers ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public.teachers ALTER COLUMN id TYPE text USING id::text;