REVOKE ALL ON FUNCTION public.fetch_student_substitutions(TEXT, DATE) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.verify_student_access(TEXT, TEXT) FROM PUBLIC, anon, authenticated;
