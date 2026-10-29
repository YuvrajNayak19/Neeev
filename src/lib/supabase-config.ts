export const isSupabaseConfigured = Boolean(
  (import.meta.env['VITE_SUPABASE_URL'] || process.env['SUPABASE_URL']) &&
    (import.meta.env['VITE_SUPABASE_PUBLISHABLE_KEY'] || process.env['SUPABASE_PUBLISHABLE_KEY']),
);
